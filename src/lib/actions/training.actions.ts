"use server";

import { db } from "@/lib/db";
import {
  trainingAssignments,
  trainingAcknowledgements,
  documents,
  documentVersions,
  users,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/utils";
import { createAuditLog } from "./audit.actions";
import type { ActionResult, TrainingAssignmentWithDetails } from "@/lib/types";
import { headers } from "next/headers";

const assignTrainingSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  userIds: z.array(z.string().uuid()).min(1, "At least one user must be selected"),
  dueDate: z.string().optional(),
});

export async function getTrainingAssignments(params?: {
  userId?: string;
  documentId?: string;
  status?: "pending" | "acknowledged";
}): Promise<ActionResult<TrainingAssignmentWithDetails[]>> {
  try {
    const currentUser = await requireAuth();

    // Staff can only see their own assignments
    const targetUserId =
      currentUser.role === "staff" ? currentUser.id : params?.userId;

    const rows = await db
      .select({
        id: trainingAssignments.id,
        documentId: trainingAssignments.documentId,
        userId: trainingAssignments.userId,
        assignedBy: trainingAssignments.assignedBy,
        assignedAt: trainingAssignments.assignedAt,
        dueDate: trainingAssignments.dueDate,
        document: {
          id: documents.id,
          title: documents.title,
          category: documents.category,
          currentVersion: {
            id: documentVersions.id,
            versionNumber: documentVersions.versionNumber,
            reviewDate: documentVersions.reviewDate,
          },
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          department: users.department,
        },
        acknowledgement: {
          id: trainingAcknowledgements.id,
          assignmentId: trainingAcknowledgements.assignmentId,
          acknowledgedAt: trainingAcknowledgements.acknowledgedAt,
          ipAddress: trainingAcknowledgements.ipAddress,
        },
      })
      .from(trainingAssignments)
      .innerJoin(documents, eq(trainingAssignments.documentId, documents.id))
      .leftJoin(documentVersions, eq(documents.currentVersionId, documentVersions.id))
      .innerJoin(users, eq(trainingAssignments.userId, users.id))
      .leftJoin(
        trainingAcknowledgements,
        eq(trainingAssignments.id, trainingAcknowledgements.assignmentId)
      )
      .where(
        targetUserId
          ? eq(trainingAssignments.userId, targetUserId)
          : params?.documentId
          ? eq(trainingAssignments.documentId, params.documentId)
          : undefined
      )
      .orderBy(desc(trainingAssignments.assignedAt));

    // Filter by status if requested
    let filtered = rows;
    if (params?.status === "acknowledged") {
      filtered = rows.filter((r) => r.acknowledgement?.id != null);
    } else if (params?.status === "pending") {
      filtered = rows.filter((r) => r.acknowledgement?.id == null);
    }

    return {
      success: true,
      data: filtered.map((row) => ({
        ...row,
        document: {
          id: row.document.id,
          title: row.document.title,
          category: row.document.category,
          currentVersion: row.document.currentVersion.id
            ? {
                id: row.document.currentVersion.id,
                versionNumber: row.document.currentVersion.versionNumber,
                reviewDate: row.document.currentVersion.reviewDate,
              }
            : null,
        },
        assignedByUser: { id: row.assignedBy, name: "" },
        acknowledgement: row.acknowledgement?.id
          ? {
              id: row.acknowledgement.id,
              assignmentId: row.acknowledgement.assignmentId,
              acknowledgedAt: row.acknowledgement.acknowledgedAt,
              ipAddress: row.acknowledgement.ipAddress,
            }
          : null,
      })) as TrainingAssignmentWithDetails[],
    };
  } catch (error) {
    console.error("Failed to fetch training assignments:", error);
    return { success: false, error: "Failed to fetch training assignments" };
  }
}

export async function assignTraining(params: {
  documentId: string;
  userIds: string[];
  dueDate?: string;
}): Promise<ActionResult<{ assigned: number }>> {
  try {
    const currentUser = await requireRole("admin", "manager");

    const validated = assignTrainingSchema.safeParse(params);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Validation failed",
      };
    }

    const { documentId, userIds, dueDate } = validated.data;

    // Check document exists
    const [doc] = await db
      .select({ id: documents.id, title: documents.title })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    // Filter out users already assigned
    const existingAssignments = await db
      .select({ userId: trainingAssignments.userId })
      .from(trainingAssignments)
      .where(eq(trainingAssignments.documentId, documentId));

    const existingUserIds = new Set(existingAssignments.map((a) => a.userId));
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return { success: false, error: "All selected users are already assigned to this SOP" };
    }

    const values = newUserIds.map((userId) => ({
      documentId,
      userId,
      assignedBy: currentUser.id,
      dueDate: dueDate ? new Date(dueDate) : null,
    }));

    await db.insert(trainingAssignments).values(values);

    await createAuditLog({
      userId: currentUser.id,
      action: "training.assigned",
      entityType: "training_assignment",
      entityId: documentId,
      metadata: { documentTitle: doc.title, userCount: newUserIds.length, dueDate },
    });

    return { success: true, data: { assigned: newUserIds.length } };
  } catch (error) {
    console.error("Failed to assign training:", error);
    return { success: false, error: "Failed to assign training" };
  }
}

export async function acknowledgeTraining(
  assignmentId: string
): Promise<ActionResult> {
  try {
    const currentUser = await requireAuth();

    // Verify the assignment belongs to the current user
    const [assignment] = await db
      .select()
      .from(trainingAssignments)
      .where(eq(trainingAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (assignment.userId !== currentUser.id && currentUser.role === "staff") {
      return { success: false, error: "You can only acknowledge your own training assignments" };
    }

    // Check if already acknowledged
    const [existing] = await db
      .select({ id: trainingAcknowledgements.id })
      .from(trainingAcknowledgements)
      .where(eq(trainingAcknowledgements.assignmentId, assignmentId))
      .limit(1);

    if (existing) {
      return { success: false, error: "Training already acknowledged" };
    }

    // Get IP address
    const headersList = headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    await db.insert(trainingAcknowledgements).values({
      assignmentId,
      ipAddress,
    });

    await createAuditLog({
      userId: currentUser.id,
      action: "training.acknowledged",
      entityType: "training_assignment",
      entityId: assignmentId,
      metadata: { documentId: assignment.documentId, ipAddress },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to acknowledge training:", error);
    return { success: false, error: "Failed to acknowledge training" };
  }
}

export async function removeTrainingAssignment(
  assignmentId: string
): Promise<ActionResult> {
  try {
    const currentUser = await requireRole("admin", "manager");

    const [assignment] = await db
      .select()
      .from(trainingAssignments)
      .where(eq(trainingAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    await db
      .delete(trainingAssignments)
      .where(eq(trainingAssignments.id, assignmentId));

    await createAuditLog({
      userId: currentUser.id,
      action: "training.assignment_removed",
      entityType: "training_assignment",
      entityId: assignmentId,
      metadata: { documentId: assignment.documentId, userId: assignment.userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to remove training assignment:", error);
    return { success: false, error: "Failed to remove training assignment" };
  }
}

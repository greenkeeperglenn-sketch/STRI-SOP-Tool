"use server";

import { db } from "@/lib/db";
import { documents, documentVersions, users } from "@/lib/db/schema";
import { eq, desc, ilike, or, and, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/utils";
import { createAuditLog } from "./audit.actions";
import { generateVersionNumber } from "@/lib/utils";
import type { ActionResult, DocumentWithVersion, DocumentWithVersions } from "@/lib/types";
import { addDays } from "date-fns";

const createDocumentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  department: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().positive("File size must be positive"),
  versionNumber: z.string().optional(),
  reviewDate: z.string().optional(),
  changeSummary: z.string().optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(3).optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export async function getDocuments(params?: {
  search?: string;
  category?: string;
  status?: string;
  department?: string;
}): Promise<ActionResult<DocumentWithVersion[]>> {
  try {
    await requireAuth();

    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(documents.title, `%${params.search}%`),
          ilike(documents.category, `%${params.search}%`)
        )
      );
    }

    if (params?.category && params.category !== "all") {
      conditions.push(eq(documents.category, params.category));
    }

    if (params?.status && params.status !== "all") {
      conditions.push(
        eq(documents.status, params.status as "draft" | "active" | "archived")
      );
    }

    if (params?.department && params.department !== "all") {
      conditions.push(ilike(documents.department, params.department));
    }

    const rows = await db
      .select({
        id: documents.id,
        title: documents.title,
        category: documents.category,
        department: documents.department,
        status: documents.status,
        currentVersionId: documents.currentVersionId,
        createdAt: documents.createdAt,
        createdBy: documents.createdBy,
        currentVersion: {
          id: documentVersions.id,
          documentId: documentVersions.documentId,
          versionNumber: documentVersions.versionNumber,
          fileUrl: documentVersions.fileUrl,
          fileName: documentVersions.fileName,
          fileSize: documentVersions.fileSize,
          uploadedBy: documentVersions.uploadedBy,
          uploadedAt: documentVersions.uploadedAt,
          reviewDate: documentVersions.reviewDate,
          approvedBy: documentVersions.approvedBy,
          approvedAt: documentVersions.approvedAt,
          changeSummary: documentVersions.changeSummary,
        },
        createdByUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(documents)
      .leftJoin(documentVersions, eq(documents.currentVersionId, documentVersions.id))
      .leftJoin(users, eq(documents.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(documents.createdAt));

    return { success: true, data: rows as DocumentWithVersion[] };
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

export async function getDocument(id: string): Promise<ActionResult<DocumentWithVersions>> {
  try {
    await requireAuth();

    const [doc] = await db
      .select({
        id: documents.id,
        title: documents.title,
        category: documents.category,
        department: documents.department,
        status: documents.status,
        currentVersionId: documents.currentVersionId,
        createdAt: documents.createdAt,
        createdBy: documents.createdBy,
        createdByUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(documents)
      .leftJoin(users, eq(documents.createdBy, users.id))
      .where(eq(documents.id, id))
      .limit(1);

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    const versions = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, id))
      .orderBy(desc(documentVersions.uploadedAt));

    const currentVersion = versions.find((v) => v.id === doc.currentVersionId) ?? null;

    return {
      success: true,
      data: {
        ...doc,
        currentVersion,
        versions,
      } as DocumentWithVersions,
    };
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return { success: false, error: "Failed to fetch document" };
  }
}

export async function createDocument(params: {
  title: string;
  category: string;
  department?: string;
  status?: "draft" | "active" | "archived";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  versionNumber?: string;
  reviewDate?: string;
  changeSummary?: string;
}): Promise<ActionResult<{ documentId: string; versionId: string }>> {
  try {
    const currentUser = await requireRole("admin", "manager");

    const validated = createDocumentSchema.safeParse(params);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Validation failed",
      };
    }

    const { title, category, department, status, fileUrl, fileName, fileSize, reviewDate, changeSummary } = validated.data;
    const versionNumber = validated.data.versionNumber ?? "1.0";

    // Create document first (without currentVersionId)
    const [newDoc] = await db
      .insert(documents)
      .values({
        title,
        category,
        department: department ?? null,
        status: status ?? "draft",
        createdBy: currentUser.id,
      })
      .returning();

    // Create first version
    const [newVersion] = await db
      .insert(documentVersions)
      .values({
        documentId: newDoc.id,
        versionNumber,
        fileUrl,
        fileName,
        fileSize,
        uploadedBy: currentUser.id,
        reviewDate: reviewDate ? new Date(reviewDate) : null,
        changeSummary: changeSummary ?? null,
      })
      .returning();

    // Set currentVersionId
    await db
      .update(documents)
      .set({ currentVersionId: newVersion.id })
      .where(eq(documents.id, newDoc.id));

    await createAuditLog({
      userId: currentUser.id,
      action: "document.created",
      entityType: "document",
      entityId: newDoc.id,
      metadata: { title, category, department, versionNumber, fileName },
    });

    return {
      success: true,
      data: { documentId: newDoc.id, versionId: newVersion.id },
    };
  } catch (error) {
    console.error("Failed to create document:", error);
    return { success: false, error: "Failed to create document" };
  }
}

export async function uploadNewVersion(params: {
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  reviewDate?: string;
  changeSummary?: string;
  setAsCurrent?: boolean;
}): Promise<ActionResult<{ versionId: string }>> {
  try {
    const currentUser = await requireRole("admin", "manager");

    // Get existing versions count
    const existingVersions = await db
      .select({ id: documentVersions.id })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, params.documentId));

    const versionNumber = generateVersionNumber(existingVersions.length);

    const [newVersion] = await db
      .insert(documentVersions)
      .values({
        documentId: params.documentId,
        versionNumber,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        fileSize: params.fileSize,
        uploadedBy: currentUser.id,
        reviewDate: params.reviewDate ? new Date(params.reviewDate) : null,
        changeSummary: params.changeSummary ?? null,
      })
      .returning();

    // By default, set as current version
    if (params.setAsCurrent !== false) {
      await db
        .update(documents)
        .set({ currentVersionId: newVersion.id })
        .where(eq(documents.id, params.documentId));
    }

    await createAuditLog({
      userId: currentUser.id,
      action: "document.version_uploaded",
      entityType: "document",
      entityId: params.documentId,
      metadata: { versionNumber, fileName: params.fileName, versionId: newVersion.id },
    });

    return { success: true, data: { versionId: newVersion.id } };
  } catch (error) {
    console.error("Failed to upload new version:", error);
    return { success: false, error: "Failed to upload new version" };
  }
}

export async function updateDocument(
  id: string,
  params: {
    title?: string;
    category?: string;
    department?: string;
    status?: "draft" | "active" | "archived";
  }
): Promise<ActionResult> {
  try {
    const currentUser = await requireRole("admin", "manager");

    const validated = updateDocumentSchema.safeParse(params);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Validation failed",
      };
    }

    await db
      .update(documents)
      .set(validated.data)
      .where(eq(documents.id, id));

    await createAuditLog({
      userId: currentUser.id,
      action: "document.updated",
      entityType: "document",
      entityId: id,
      metadata: validated.data as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update document:", error);
    return { success: false, error: "Failed to update document" };
  }
}

export async function approveVersion(versionId: string): Promise<ActionResult> {
  try {
    const currentUser = await requireRole("admin", "manager");

    await db
      .update(documentVersions)
      .set({
        approvedBy: currentUser.id,
        approvedAt: new Date(),
      })
      .where(eq(documentVersions.id, versionId));

    const [version] = await db
      .select({ documentId: documentVersions.documentId })
      .from(documentVersions)
      .where(eq(documentVersions.id, versionId))
      .limit(1);

    if (version) {
      await createAuditLog({
        userId: currentUser.id,
        action: "document.version_approved",
        entityType: "document_version",
        entityId: versionId,
        metadata: { documentId: version.documentId },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to approve version:", error);
    return { success: false, error: "Failed to approve version" };
  }
}

export async function getDashboardStats() {
  try {
    await requireAuth();

    const thirtyDaysFromNow = addDays(new Date(), 30);

    // Total active SOPs
    const [{ count: totalActive }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.status, "active"));

    // SOPs due for review (active docs with reviewDate in next 30 days)
    const [{ count: dueForReview }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .leftJoin(documentVersions, eq(documents.currentVersionId, documentVersions.id))
      .where(
        and(
          eq(documents.status, "active"),
          lt(documentVersions.reviewDate, thirtyDaysFromNow)
        )
      );

    // Training stats
    const { trainingAssignments, trainingAcknowledgements } = await import("@/lib/db/schema");

    const [{ count: totalAssignments }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainingAssignments);

    const [{ count: acknowledged }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainingAcknowledgements);

    // Overdue training
    const [{ count: overdueTraining }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainingAssignments)
      .leftJoin(
        trainingAcknowledgements,
        eq(trainingAssignments.id, trainingAcknowledgements.assignmentId)
      )
      .where(
        and(
          lt(trainingAssignments.dueDate, new Date()),
          sql`${trainingAcknowledgements.id} IS NULL`
        )
      );

    // Total active staff
    const [{ count: totalStaff }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.active, true));

    const compliancePercentage =
      Number(totalAssignments) > 0
        ? Math.round((Number(acknowledged) / Number(totalAssignments)) * 100)
        : 100;

    return {
      success: true,
      data: {
        totalActiveSOPs: Number(totalActive),
        sopsDueForReview: Number(dueForReview),
        compliancePercentage,
        overdueTraining: Number(overdueTraining),
        totalStaff: Number(totalStaff),
        totalAssignments: Number(totalAssignments),
        acknowledgedAssignments: Number(acknowledged),
      },
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

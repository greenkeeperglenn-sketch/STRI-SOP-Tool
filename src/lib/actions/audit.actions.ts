"use server";

import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import type { ActionResult, AuditLogWithUser } from "@/lib/types";

export async function createAuditLog(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLog).values({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata ?? null,
  });
}

export async function getAuditLogs(params?: {
  limit?: number;
  entityType?: string;
  entityId?: string;
}): Promise<ActionResult<AuditLogWithUser[]>> {
  try {
    const limit = params?.limit ?? 100;

    const conditions = [];
    if (params?.entityType) {
      conditions.push(eq(auditLog.entityType, params.entityType));
    }
    if (params?.entityId) {
      conditions.push(eq(auditLog.entityId, params.entityId));
    }

    const logs = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        metadata: auditLog.metadata,
        timestamp: auditLog.timestamp,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.timestamp))
      .limit(limit);

    return {
      success: true,
      data: logs as AuditLogWithUser[],
    };
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}

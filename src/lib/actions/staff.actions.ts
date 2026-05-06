"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, ne, ilike, or } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth/utils";
import { createAuditLog } from "./audit.actions";
import type { ActionResult, User } from "@/lib/types";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "manager", "staff"]),
  department: z.string().optional(),
  startDate: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "manager", "staff"]).optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  active: z.boolean().optional(),
});

export async function getStaffList(search?: string): Promise<ActionResult<User[]>> {
  try {
    await requireAuth();

    let query;
    if (search) {
      query = db
        .select()
        .from(users)
        .where(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.department, `%${search}%`)
          )
        );
    } else {
      query = db.select().from(users);
    }

    const staffList = await query;
    return { success: true, data: staffList };
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return { success: false, error: "Failed to fetch staff list" };
  }
}

export async function getStaffMember(id: string): Promise<ActionResult<User>> {
  try {
    await requireAuth();

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!user) {
      return { success: false, error: "Staff member not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Failed to fetch staff member:", error);
    return { success: false, error: "Failed to fetch staff member" };
  }
}

export async function createStaffMember(
  formData: FormData
): Promise<ActionResult<User>> {
  try {
    const currentUser = await requireRole("admin", "manager");

    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
      department: (formData.get("department") as string) || undefined,
      startDate: (formData.get("startDate") as string) || undefined,
    };

    const validated = createUserSchema.safeParse(raw);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Validation failed",
      };
    }

    const { name, email, password, role, department, startDate } = validated.data;

    // Check for existing email
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const passwordHash = await hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: role as "admin" | "manager" | "staff",
        department: department ?? null,
        startDate: startDate ? new Date(startDate) : null,
      })
      .returning();

    await createAuditLog({
      userId: currentUser.id,
      action: "user.created",
      entityType: "user",
      entityId: newUser.id,
      metadata: { name, email, role },
    });

    return { success: true, data: newUser };
  } catch (error) {
    console.error("Failed to create staff member:", error);
    return { success: false, error: "Failed to create staff member" };
  }
}

export async function updateStaffMember(
  id: string,
  formData: FormData
): Promise<ActionResult<User>> {
  try {
    const currentUser = await requireRole("admin", "manager");

    const raw = {
      name: formData.get("name") as string || undefined,
      email: formData.get("email") as string || undefined,
      role: formData.get("role") as string || undefined,
      department: formData.get("department") as string || undefined,
      startDate: formData.get("startDate") as string || undefined,
      active: formData.get("active") === "true" ? true : formData.get("active") === "false" ? false : undefined,
    };

    const validated = updateUserSchema.safeParse(raw);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Validation failed",
      };
    }

    const updateData: Partial<typeof users.$inferInsert> = {};
    if (validated.data.name) updateData.name = validated.data.name;
    if (validated.data.email) updateData.email = validated.data.email;
    if (validated.data.role) updateData.role = validated.data.role as "admin" | "manager" | "staff";
    if (validated.data.department !== undefined) updateData.department = validated.data.department;
    if (validated.data.startDate) updateData.startDate = new Date(validated.data.startDate);
    if (validated.data.active !== undefined) updateData.active = validated.data.active;

    // Check email uniqueness
    if (validated.data.email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, validated.data.email))
        .limit(1);

      if (existing && existing.id !== id) {
        return { success: false, error: "Email already in use" };
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return { success: false, error: "Staff member not found" };
    }

    await createAuditLog({
      userId: currentUser.id,
      action: "user.updated",
      entityType: "user",
      entityId: id,
      metadata: updateData as Record<string, unknown>,
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Failed to update staff member:", error);
    return { success: false, error: "Failed to update staff member" };
  }
}

export async function deactivateStaffMember(id: string): Promise<ActionResult> {
  try {
    const currentUser = await requireRole("admin");

    await db.update(users).set({ active: false }).where(eq(users.id, id));

    await createAuditLog({
      userId: currentUser.id,
      action: "user.deactivated",
      entityType: "user",
      entityId: id,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to deactivate staff member:", error);
    return { success: false, error: "Failed to deactivate staff member" };
  }
}

export async function resetPassword(
  id: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const currentUser = await requireRole("admin");

    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const passwordHash = await hash(newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));

    await createAuditLog({
      userId: currentUser.id,
      action: "user.password_reset",
      entityType: "user",
      entityId: id,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

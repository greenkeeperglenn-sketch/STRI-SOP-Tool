import { auth } from "./config";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/types";

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export async function requireRole(...roles: SessionUser["role"][]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function isManagerOrAbove(role: string): boolean {
  return role === "admin" || role === "manager";
}

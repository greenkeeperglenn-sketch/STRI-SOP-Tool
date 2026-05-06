import { requireRole } from "@/lib/auth/utils";
import { StaffPageClient } from "./staff-client";

export default async function StaffPage() {
  await requireRole("admin", "manager");
  return <StaffPageClient />;
}

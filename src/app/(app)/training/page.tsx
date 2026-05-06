import { requireAuth } from "@/lib/auth/utils";
import { TrainingPageClient } from "./training-client";

export default async function TrainingPage() {
  const user = await requireAuth();
  return <TrainingPageClient user={user} />;
}

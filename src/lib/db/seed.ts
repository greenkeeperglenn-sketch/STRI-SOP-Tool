/**
 * Seed script — run with: npx tsx src/lib/db/seed.ts
 * Creates an initial admin user so you can log in for the first time.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "bcryptjs";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@stri.si.edu";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123456";
  const adminName = process.env.SEED_ADMIN_NAME ?? "System Administrator";

  // Check if admin already exists
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existing) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await hash(adminPassword, 12);

  const [admin] = await db
    .insert(schema.users)
    .values({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
      department: "Administration",
      active: true,
    })
    .returning({ id: schema.users.id, email: schema.users.email });

  console.log(`✓ Admin user created: ${admin.email} (id: ${admin.id})`);
  console.log(`  Password: ${adminPassword}`);
  console.log("  Please change the password after first login.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

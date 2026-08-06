// ============================================================
// Cleanup Script - Removes all test users except the admin
// ============================================================
// Run with: npx tsx prisma/cleanup.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete all non-admin users (cascades to their profiles)
  const result = await prisma.user.deleteMany({
    where: { role: { not: "ADMIN" } },
  });

  console.log(`Deleted ${result.count} test users`);

  // List remaining users
  const users = await prisma.user.findMany({
    select: { email: true, role: true, status: true },
  });
  console.log("Remaining users:", users);
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
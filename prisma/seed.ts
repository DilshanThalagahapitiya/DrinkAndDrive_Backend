// ============================================================
// Seed Script - Creates the default Admin account
// ============================================================
// Run with: npm run db:seed
//
// Creates:
//   Admin: admin@dad.com / admin123
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@dad.com" },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists. Skipping.");
    return;
  }

  // Hash the default admin password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Create the admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@dad.com",
      password: hashedPassword,
      firstName: "System",
      lastName: "Admin",
      initials: "SA",
      fullName: "System Admin",
      phone: "0000000000",
      role: "ADMIN",
      status: "APPROVED", // Admin is always approved
    },
  });

  console.log("✅ Admin created:");
  console.log("   Email: admin@dad.com");
  console.log("   Password: admin123");
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
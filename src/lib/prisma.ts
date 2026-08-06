// ============================================================
// Prisma Client Singleton
// ============================================================
// This file creates a single shared PrismaClient instance.
// In development, Next.js hot-reload can create multiple
// connections - using a global singleton prevents this.
// ============================================================

import { PrismaClient } from "@prisma/client";

// Use globalThis to persist the client across hot-reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse existing client if it exists, otherwise create a new one
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

// Save client on globalThis in development only
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
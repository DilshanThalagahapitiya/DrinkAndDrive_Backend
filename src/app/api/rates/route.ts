// ============================================================
// Rates API — Rate Table (KM + Waiting pricing)
// ============================================================
// GET  /api/rates  - Get current rate table (any authenticated user)
// PATCH /api/rates - Update rate table values (ADMIN only)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

// Get first rate table row (create default if none exists)
async function getRateRow() {
  let row = await prisma.rateTable.findFirst();
  if (!row) {
    row = await prisma.rateTable.create({
      data: {
        baseFare: 100,
        perKmRate: 50,
        kmTierLimit: 10,
        kmTier2Rate: 60,
        kmMaxRate: 100,
        waitingRatePerMin: 20,
        freeWaitingMin: 2,
      },
    });
  }
  return row;
}

// GET — public (landing page + dashboards show rate table)
export async function GET(req: NextRequest) {
  try {
    const rate = await getRateRow();
    return successResponse({ rate }, "Rate table retrieved successfully");
  } catch (error) {
    console.error("Get rate table error:", error);
    return errorResponse("Failed to retrieve rate table.", 500);
  }
}

// PATCH — admin only, update rate table
export async function PATCH(req: NextRequest) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }
  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    const body = await req.json();
    const { baseFare, perKmRate, kmTierLimit, kmTier2Rate, kmMaxRate, waitingRatePerMin, freeWaitingMin, contactPhone } = body;

    const existing = await getRateRow();

    const updated = await prisma.rateTable.update({
      where: { id: existing.id },
      data: {
        ...(baseFare !== undefined ? { baseFare: Number(baseFare) } : {}),
        ...(perKmRate !== undefined ? { perKmRate: Number(perKmRate) } : {}),
        ...(kmTierLimit !== undefined ? { kmTierLimit: Number(kmTierLimit) } : {}),
        ...(kmTier2Rate !== undefined ? { kmTier2Rate: Number(kmTier2Rate) } : {}),
        ...(kmMaxRate !== undefined ? { kmMaxRate: Number(kmMaxRate) } : {}),
        ...(waitingRatePerMin !== undefined ? { waitingRatePerMin: Number(waitingRatePerMin) } : {}),
        ...(freeWaitingMin !== undefined ? { freeWaitingMin: Number(freeWaitingMin) } : {}),
        ...(contactPhone !== undefined ? { contactPhone: String(contactPhone) } : {}),
      },
    });

    return successResponse({ rate: updated }, "Rate table updated successfully!");
  } catch (error) {
    console.error("Update rate table error:", error);
    return errorResponse("Failed to update rate table.", 500);
  }
}
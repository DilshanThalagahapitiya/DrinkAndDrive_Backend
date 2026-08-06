// ============================================================
// GET /api/driver/rides - Driver's Received Tickets
// ============================================================
// Returns rides/tickets assigned to the logged-in driver.
// Statuses: ASSIGNED (ticket sent - can accept/cancel), UPCOMING, ONGOING, COMPLETED
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    // Get all rides where this user is the assigned driver
    const rides = await prisma.ride.findMany({
      where: {
        driverId: authUser.userId,
      },
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        rider: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ rides }, "Tickets retrieved successfully");
  } catch (error) {
    console.error("Driver tickets error:", error);
    return errorResponse("Failed to retrieve tickets.", 500);
  }
}
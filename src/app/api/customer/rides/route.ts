// ============================================================
// GET /api/customer/rides - Customer's Ride Requests & Status
// ============================================================
// Returns all rides requested by the logged-in customer.
// Includes driver/rider info, acceptance & cancellation flags
// so the customer app can show the latest request status.
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }
  if (!hasRole(authUser, ["CUSTOMER"])) {
    return errorResponse("Forbidden. Customer access required.", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit"); // e.g. "1" for latest only

    // Get all rides where this user is the requesting customer
    const rides = await prisma.ride.findMany({
      where: {
        customerId: authUser.userId,
      },
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        rider: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limitParam ? { take: Number(limitParam) } : {}),
    });

    return successResponse({ rides }, "Customer rides retrieved successfully");
  } catch (error) {
    console.error("Customer rides error:", error);
    return errorResponse("Failed to retrieve rides.", 500);
  }
}
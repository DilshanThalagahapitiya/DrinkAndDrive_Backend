// ============================================================
// PATCH /api/rider/rides/[id] - Rider Accept/Cancel Ticket
// ============================================================
// Rider accepts or cancels an ASSIGNED ticket ride.
// ACCEPT: tracks riderAccepted=true — UPCOMING only when BOTH accepted
// CANCEL: returns ride to PENDING_REQUEST for re-assignment
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action as string; // "ACCEPT" | "CANCEL"

    // Find the ride
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, fullName: true } },
        rider: { select: { id: true, fullName: true } },
      },
    });

    if (!ride) {
      return errorResponse("Ride not found", 404);
    }

    // Verify the logged-in user is the assigned rider of this ride
    if (ride.riderId !== authUser.userId) {
      return errorResponse("This ticket is not assigned to you.", 403);
    }

    if (action === "ACCEPT") {
      // Rider accepts — track separately (riderAccepted=true)
      // Ride only becomes UPCOMING when the DRIVER has ALSO accepted
      if (ride.status !== "ASSIGNED") {
        return errorResponse("Ticket can only be accepted when it is ASSIGNED.", 400);
      }

      const updatedRide = await prisma.ride.update({
        where: { id },
        data: {
          riderAccepted: true,
          // Clear cancellation flag when rider re-accepts
          riderCancelled: false,
          // Only move to UPCOMING when the driver has also accepted
          ...(ride.driverAccepted ? { status: "UPCOMING", startedAt: null } : {}),
        },
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          rider: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return successResponse(
        { ride: updatedRide },
        ride.driverAccepted
          ? "Both accepted! The ride is now scheduled (UPCOMING)."
          : "Ticket accepted! Waiting for the driver to accept too."
      );
    }

    if (action === "CANCEL") {
      // Rider cancels: track who cancelled, deselect rider only (keep driver for re-assign)
      const updatedRide = await prisma.ride.update({
        where: { id },
        data: {
          status: "PENDING_REQUEST",
          riderId: null,
          riderAccepted: null,
          riderCancelled: true,
          driverCancelled: null,
          // Keep the driver assigned so admin only needs to re-assign a new rider
          startedAt: null,
        },
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          rider: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return successResponse({ ride: updatedRide }, "Ticket cancelled. The ride will be re-assigned.");
    }

    return errorResponse("Invalid action. Use 'ACCEPT' or 'CANCEL'.", 400);
  } catch (error) {
    console.error("Rider ticket action error:", error);
    return errorResponse("Failed to process ticket.", 500);
  }
}
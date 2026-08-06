// ============================================================
// Ride Management API - Admin: Single Ride
// ============================================================
// PATCH /api/admin/rides/[id] - Complete a ride
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

// ------------------------------------------------------------
// PATCH - Complete a ride
// ------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // --- Authorization: only ADMIN ---
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }
  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "COMPLETE" | "START" | "UPDATE"

    // Find the ride
    const ride = await prisma.ride.findUnique({
      where: { id },
    });

    if (!ride) {
      return errorResponse("Ride not found", 404);
    }

    // UPDATE: fill in driver/rider and other empty fields (for PENDING_REQUEST rides)
    if (action === "UPDATE") {
      const { driverId, riderId, pickupLocation, dropLocation, startTime, specialNote } = body;

      if (driverId) {
        const driver = await prisma.user.findUnique({ where: { id: driverId } });
        if (!driver || driver.role !== "DRIVER") {
          return errorResponse("Driver not found", 404);
        }
      }
      if (riderId) {
        const rider = await prisma.user.findUnique({ where: { id: riderId } });
        if (!rider || rider.role !== "RIDER") {
          return errorResponse("Rider not found", 404);
        }
      }

      const updatedRide = await prisma.ride.update({
        where: { id },
        data: {
          ...(driverId ? { driverId } : {}),
          ...(riderId ? { riderId } : {}),
          ...(pickupLocation ? { pickupLocation } : {}),
          ...(dropLocation ? { dropLocation } : {}),
          ...(startTime ? { startTime: new Date(startTime) } : {}),
          ...(specialNote !== undefined ? { specialNote } : {}),
          // Reset cancellation flags when admin re-assigns
          driverCancelled: false,
          riderCancelled: false,
          // Assigning both driver + rider sends ticket (ASSIGNED) — driver/rider must accept
          ...(driverId && riderId ? { status: "ASSIGNED", startedAt: null } : {}),
        },
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          rider: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return successResponse({ ride: updatedRide }, "Ride updated successfully!");
    }

    if (action === "START") {
      // Start an upcoming ride
      const startedRide = await prisma.ride.update({
        where: { id },
        data: {
          status: "ONGOING",
          startedAt: new Date(),
        },
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          rider: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return successResponse({ ride: startedRide }, "Ride started successfully!");
    }

    if (action === "COMPLETE") {
      // Mark the ride as completed
      const completedRide = await prisma.ride.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          rider: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return successResponse({ ride: completedRide }, "Ride completed successfully!");
    }

    return errorResponse("Invalid action. Use action: 'START' or 'COMPLETE'", 400);
  } catch (error) {
    console.error("Complete ride error:", error);
    return errorResponse("Failed to update ride.", 500);
  }
}

// ------------------------------------------------------------
// DELETE - Delete a ride
// ------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // --- Authorization: only ADMIN ---
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }
  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    const { id } = await params;

    const ride = await prisma.ride.findUnique({
      where: { id },
    });
    if (!ride) {
      return errorResponse("Ride not found", 404);
    }

    await prisma.ride.delete({
      where: { id },
    });

    return successResponse({ deletedId: id }, "Ride deleted successfully", 200);
  } catch (error) {
    console.error("Delete ride error:", error);
    return errorResponse("Failed to delete ride.", 500);
  }
}

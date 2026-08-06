// ============================================================
// Ride Management API - Admin
// ============================================================
// POST /api/admin/rides - Create a new ride
// GET  /api/admin/rides - List all rides (filter by status)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

// ------------------------------------------------------------
// POST - Create a new ride
// ------------------------------------------------------------
export async function POST(req: NextRequest) {
  // --- Authorization: only ADMIN ---
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }
  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    const { driverId, riderId, pickupLocation, dropLocation, startTime, customerName, customerNumber, vehicleType, transmission, specialNote, customerId, pickupLatitude, pickupLongitude, dropLatitude, dropLongitude } = await req.json();

    // ---- VALIDATION ----
    if (!pickupLocation || !dropLocation || !startTime) {
      return errorResponse("Please provide: pickupLocation, dropLocation, startTime", 400);
    }

    // If no driver/rider provided, this is a customer request (PENDING_REQUEST)
    if (!driverId || !riderId) {
      // Validate customer ID
      if (!customerId) {
        const authUser = authenticateRequest(req);
        // Allow authenticated customer to request without specifying customerId
        const profile = await prisma.user.findUnique({
          where: { id: authUser?.userId ?? "" },
          include: { customerProfile: true },
        });
        if (!profile?.customerProfile) {
          return errorResponse("Customer profile not found. Please register as a customer first.", 404);
        }
        // Auto-fill customer details from profile
        const ride = await prisma.ride.create({
          data: {
            customerId: profile.id,
            pickupLocation,
            dropLocation,
            startTime: new Date(startTime),
            customerName: profile.fullName,
            customerNumber: profile.phone,
            vehicleType: profile.customerProfile.vehicleType,
            transmission: profile.customerProfile.transmission,
            specialNote: specialNote || profile.customerProfile.specialNote || null,
            status: "PENDING_REQUEST",
            startedAt: null,
          },
        });
        return successResponse({ ride }, "Ride request submitted! Admin will assign a driver soon.", 201);
      }
    }

    // Verify driver exists and is approved
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
    });
    if (!driver || driver.role !== "DRIVER") {
      return errorResponse("Driver not found", 404);
    }
    if (driver.status !== "APPROVED") {
      return errorResponse("Driver is not approved yet", 400);
    }

    // Verify rider exists and is approved
    const rider = await prisma.user.findUnique({
      where: { id: riderId },
    });
    if (!rider || rider.role !== "RIDER") {
      return errorResponse("Rider not found", 404);
    }
    if (rider.status !== "APPROVED") {
      return errorResponse("Rider is not approved yet", 400);
    }

    // ---- CREATE RIDE ----
    const parsedStartTime = new Date(startTime);
    const now = new Date();

    // Admin-created ride with driver + rider: send as a TICKET (ASSIGNED)
    // so both the assigned driver and rider see it in their Upcoming view
    // and can Accept/Cancel it.
    const initialStatus = "ASSIGNED";

    const ride = await prisma.ride.create({
      data: {
        driverId,
        riderId,
        pickupLocation,
        dropLocation,
        startTime: parsedStartTime,
        startedAt: null,
        status: initialStatus,
        customerName: customerName || null,
        customerNumber: customerNumber || null,
        vehicleType: vehicleType || null,
        transmission: transmission || "AUTO",
        specialNote: specialNote || null,
        // Coordinates for route drawing
        pickupLatitude: pickupLatitude ?? null,
        pickupLongitude: pickupLongitude ?? null,
        dropLatitude: dropLatitude ?? null,
        dropLongitude: dropLongitude ?? null,
      },
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        rider: { select: { id: true, fullName: true, phone: true } },
      },
    });

    return successResponse({ ride }, "Ride created successfully", 201);
  } catch (error) {
    console.error("Create ride error:", error);
    return errorResponse("Failed to create ride.", 500);
  }
}

// ------------------------------------------------------------
// GET - List rides (filter by status)
// ------------------------------------------------------------
export async function GET(req: NextRequest) {
  // --- Authorization: only ADMIN ---
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }
  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // e.g. "UPCOMING" or "PENDING_REQUEST,UPCOMING"

    // Build where clause - support comma-separated statuses (e.g. "PENDING_REQUEST,UPCOMING")
    const where: Record<string, unknown> = {};
    if (status) {
      const statuses = status.split(",").filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else {
        where.status = { in: statuses };
      }
    }

    // Fetch rides with driver and rider info
    const rides = await prisma.ride.findMany({
      where,
      include: {
        driver: { select: { id: true, fullName: true, phone: true, email: true } },
        rider: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ rides }, "Rides retrieved successfully");
  } catch (error) {
    console.error("List rides error:", error);
    return errorResponse("Failed to retrieve rides.", 500);
  }
}
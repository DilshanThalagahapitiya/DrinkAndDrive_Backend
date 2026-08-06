// ============================================================
// POST /api/rides/request - Customer Ride Request
// ============================================================
// Customers submit a ride request from the Flutter app.
// Customer details are auto-filled from their profile.
// Request appears in admin portal as PENDING_REQUEST.
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Authenticate (customer must be logged in)
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    const { pickupLocation, dropLocation, startTime, specialNote } = await req.json();

    // ---- VALIDATION ----
    if (!pickupLocation || !dropLocation || !startTime) {
      return errorResponse("Please provide: pickupLocation, dropLocation, startTime", 400);
    }

    // Find the customer's profile
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { customerProfile: true },
    });

    if (!user?.customerProfile) {
      return errorResponse("Customer profile not found. Please register as a customer first.", 404);
    }

    // ---- CREATE RIDE REQUEST (auto-fill customer details) ----
    const ride = await prisma.ride.create({
      data: {
        customerId: user.id,
        pickupLocation,
        dropLocation,
        startTime: new Date(startTime),
        startedAt: null,
        // Auto-fill from customer profile
        customerName: user.fullName,
        customerNumber: user.phone,
        vehicleType: user.customerProfile.vehicleType,
        transmission: user.customerProfile.transmission,
        specialNote: specialNote || user.customerProfile.specialNote || null,
        status: "PENDING_REQUEST",
        // Driver/Rider not assigned yet
        driverId: null,
        riderId: null,
      },
    });

    return successResponse(
      { ride },
      "Ride request submitted! We will assign a driver to you soon.",
      201
    );
  } catch (error) {
    console.error("Customer ride request error:", error);
    return errorResponse("Failed to submit ride request.", 500);
  }
}
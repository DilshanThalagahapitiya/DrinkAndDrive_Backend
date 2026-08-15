// ============================================================
// GET  /api/auth/me  - Get Current Logged-in User
// PATCH /api/auth/me  - Update Own Profile
// ============================================================
// Returns the profile of the user associated with the
// JWT token sent in the Authorization header.
// PATCH allows the user to complete/update their own profile.
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Authenticate the request - must have valid token
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    // Fetch the full user record including their role-specific profile
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        driverProfile: true,
        riderProfile: true,
        hotelProfile: true,
        customerProfile: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Remove password from response
    const { password: _pw, ...userWithoutPassword } = user;

    return successResponse({ user: userWithoutPassword }, "User retrieved successfully");
  } catch (error) {
    console.error("Get user error:", error);
    return errorResponse("Failed to get user.", 500);
  }
}

// ------------------------------------------------------------
// PATCH - Update own profile (e.g. customer completing profile)
// ------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  // Authenticate the request - must have valid token
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    const body = await req.json();
    const {
      // Basic user fields
      firstName,
      lastName,
      fullName,
      address,
      city,
      // Customer profile fields
      customerLocation,
      customerVehicleType,
      customerTransmission,
      customerVehicleNumber,
      customerSpecialNote,
    } = body;

    // Fetch current user with profile
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { customerProfile: true },
    });
    if (!user) {
      return errorResponse("User not found", 404);
    }

    // ---- Update user basic fields ----
    const userData: Record<string, unknown> = {};
    if (firstName !== undefined) userData.firstName = firstName;
    if (lastName !== undefined) userData.lastName = lastName;
    if (fullName !== undefined) userData.fullName = fullName;
    if ((firstName !== undefined || lastName !== undefined) && fullName === undefined) {
      // Recompute fullName if firstName/lastName changed
      const newFirstName = firstName ?? user.firstName ?? "";
      const newLastName = lastName ?? user.lastName ?? "";
      userData.fullName = [user.initials || "", newFirstName, newLastName]
        .filter(Boolean).join(" ").trim();
    }

    // ---- Update customer profile ----
    if (user.role === "CUSTOMER") {
      if (user.customerProfile) {
        const customerData: Record<string, unknown> = {};
        if (customerLocation !== undefined) customerData.location = customerLocation;
        if (customerVehicleType !== undefined) customerData.vehicleType = customerVehicleType;
        if (customerTransmission !== undefined) customerData.transmission = customerTransmission;
        if (customerVehicleNumber !== undefined) customerData.vehicleNumber = customerVehicleNumber;
        if (customerSpecialNote !== undefined) customerData.specialNote = customerSpecialNote;

        if (Object.keys(customerData).length > 0) {
          await prisma.customerProfile.update({
            where: { userId: user.id },
            data: customerData,
          });
        }
      }
    }

    // ---- Apply user updates ----
    let updatedUser;
    if (Object.keys(userData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: userData,
        include: {
          driverProfile: true,
          riderProfile: true,
          hotelProfile: true,
          customerProfile: true,
        },
      });
    } else {
      updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          driverProfile: true,
          riderProfile: true,
          hotelProfile: true,
          customerProfile: true,
        },
      });
    }

    const { password: _pw, ...userWithoutPassword } = updatedUser!;
    return successResponse({ user: userWithoutPassword }, "Profile updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse("Failed to update profile.", 500);
  }
}
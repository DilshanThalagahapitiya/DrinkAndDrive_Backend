// ============================================================
// PATCH /api/admin/users/[id] - Admin: Update a User
// DELETE /api/admin/users/[id] - Admin: Delete a User
// ============================================================
// Allows the admin to:
//   - PATCH: Edit user details (basic info + role-specific profile)
//   - DELETE: Remove a user and their profile permanently
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

// ------------------------------------------------------------
// PATCH - Update user details
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

    // ---- FIND THE USER ----
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        driverProfile: true,
        riderProfile: true,
        hotelProfile: true,
      },
    });

    if (!targetUser) {
      return errorResponse("User not found", 404);
    }

    // Prevent editing another admin
    if (targetUser.role === "ADMIN") {
      return errorResponse("Cannot edit an admin account", 400);
    }

    // ---- BUILD UPDATE DATA ----
    // Basic user fields that can be edited
    const userData: Record<string, unknown> = {};
    if (body.fullName !== undefined) userData.fullName = body.fullName;
    if (body.email !== undefined) userData.email = body.email;
    if (body.phone !== undefined) userData.phone = body.phone;
    if (body.status !== undefined) userData.status = body.status;

    // Update the user basic info
    const updatedUser = await prisma.user.update({
      where: { id },
      data: userData,
    });

    // ---- UPDATE ROLE-SPECIFIC PROFILE ----
    // Driver profile update
    if (targetUser.role === "DRIVER" && targetUser.driverProfile) {
      const driverData: Record<string, unknown> = {};
      if (body.licenseNumber !== undefined) driverData.licenseNumber = body.licenseNumber;
      if (body.licenseIssuedDate !== undefined) driverData.licenseIssuedDate = new Date(body.licenseIssuedDate);
      if (body.licenseExpiryDate !== undefined) driverData.licenseExpiryDate = new Date(body.licenseExpiryDate);
      if (body.licenseFrontImage !== undefined) driverData.licenseFrontImage = body.licenseFrontImage;
      if (body.licenseBackImage !== undefined) driverData.licenseBackImage = body.licenseBackImage;
      if (body.licenseType !== undefined) driverData.licenseType = body.licenseType;
      if (body.vehicleType !== undefined) {
        // Convert array to comma-separated string for storage
        driverData.vehicleType = Array.isArray(body.vehicleType)
          ? body.vehicleType.join(",")
          : body.vehicleType;
      }
      if (body.preferredGear !== undefined) driverData.preferredGear = body.preferredGear;
      if (body.specialNote !== undefined) driverData.specialNote = body.specialNote;
      if (body.address !== undefined) driverData.address = body.address;
      if (body.city !== undefined) driverData.city = body.city;

      if (Object.keys(driverData).length > 0) {
        await prisma.driverProfile.update({
          where: { userId: id },
          data: driverData,
        });
      }
    }

    // Rider profile update
    if (targetUser.role === "RIDER" && targetUser.riderProfile) {
      const riderData: Record<string, unknown> = {};
      if (body.address !== undefined) riderData.address = body.address;
      if (body.city !== undefined) riderData.city = body.city;
      if (body.emergencyContactName !== undefined) riderData.emergencyContactName = body.emergencyContactName;
      if (body.emergencyContactPhone !== undefined) riderData.emergencyContactPhone = body.emergencyContactPhone;

      if (Object.keys(riderData).length > 0) {
        await prisma.riderProfile.update({
          where: { userId: id },
          data: riderData,
        });
      }
    }

    // Hotel profile update
    if (targetUser.role === "HOTEL" && targetUser.hotelProfile) {
      const hotelData: Record<string, unknown> = {};
      if (body.hotelName !== undefined) hotelData.hotelName = body.hotelName;
      if (body.hotelLicenseNumber !== undefined) hotelData.hotelLicenseNumber = body.hotelLicenseNumber;
      if (body.address !== undefined) hotelData.address = body.address;
      if (body.city !== undefined) hotelData.city = body.city;
      if (body.hotelImage !== undefined) hotelData.hotelImage = body.hotelImage;
      if (body.description !== undefined) hotelData.description = body.description;
      if (body.contactPhone !== undefined) hotelData.contactPhone = body.contactPhone;
      if (body.contactEmail !== undefined) hotelData.contactEmail = body.contactEmail;

      if (Object.keys(hotelData).length > 0) {
        await prisma.hotelProfile.update({
          where: { userId: id },
          data: hotelData,
        });
      }
    }

    // Fetch the updated user with profile to return
    const result = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        initials: true,
        dob: true,
        nic: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        tempPassword: true,
        mustChangePassword: true,
        driverProfile: true,
        riderProfile: true,
        hotelProfile: true,
      },
    });

    return successResponse({ user: result }, "User updated successfully", 200);
  } catch (error) {
    console.error("Admin update user error:", error);
    return errorResponse("Failed to update user.", 500);
  }
}

// ------------------------------------------------------------
// DELETE - Delete a user permanently
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

    // ---- FIND THE USER ----
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return errorResponse("User not found", 404);
    }

    // Prevent deleting another admin
    if (targetUser.role === "ADMIN") {
      return errorResponse("Cannot delete an admin account", 400);
    }

    // Delete the user (profiles cascade via onDelete: Cascade)
    await prisma.user.delete({
      where: { id },
    });

    return successResponse(
      { deletedId: id },
      `${targetUser.fullName} has been deleted successfully.`,
      200
    );
  } catch (error) {
    console.error("Admin delete user error:", error);
    return errorResponse("Failed to delete user.", 500);
  }
}
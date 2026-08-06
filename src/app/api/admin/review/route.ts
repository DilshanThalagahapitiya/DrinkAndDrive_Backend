// ============================================================
// PATCH /api/admin/review - Admin: Approve/Reject a User
// ============================================================
// Admin reviews a pending user registration and either:
//   - APPROVES them (user can now use the app)
//   - REJECTS them (user cannot use the app)
//
// Body: { userId, action: "APPROVE" | "REJECT" }
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  // --- Authorization: only ADMIN can review users ---
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    // Parse request body
    const { userId, action, practicalTestPassed, practicalTestPassedDate } = await req.json();

    // ---- VALIDATION ----
    if (!userId) {
      return errorResponse("Please provide the userId", 400);
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return errorResponse("Action must be APPROVE or REJECT", 400);
    }

    // ---- FIND THE TARGET USER ----
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    });

    if (!targetUser) {
      return errorResponse("User not found", 404);
    }

    // Prevent admin from approving/rejecting other admins
    if (targetUser.role === "ADMIN") {
      return errorResponse("Cannot review an admin account", 400);
    }

    // For DRIVERS: practical test must be marked passed before approving
    if (targetUser.role === "DRIVER" && action === "APPROVE") {
      if (practicalTestPassed === undefined) {
        return errorResponse("Please specify whether the driver passed the practical test (practicalTestPassed: true/false)", 400);
      }
      if (!practicalTestPassed) {
        return errorResponse("Driver cannot be approved - practical test not passed.", 400);
      }
    }

    // Set the new status based on the action
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // ---- UPDATE USER STATUS ----
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // If driver and approving, save practical test info to profile
    if (targetUser.role === "DRIVER" && action === "APPROVE" && targetUser.driverProfile) {
      await prisma.driverProfile.update({
        where: { userId },
        data: {
          practicalTestPassed: true,
          practicalTestPassedDate: practicalTestPassedDate ? new Date(practicalTestPassedDate) : new Date(),
        },
      });
    }

    const message =
      action === "APPROVE"
        ? `${updatedUser.fullName} has been approved successfully!`
        : `${updatedUser.fullName} has been rejected.`;

    return successResponse({ user: updatedUser }, message, 200);
  } catch (error) {
    console.error("Admin review error:", error);
    return errorResponse("Failed to update user status.", 500);
  }
}
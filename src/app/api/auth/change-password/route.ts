// ============================================================
// POST /api/auth/change-password - Change Password
// ============================================================
// Used when a driver logs in with their temporary password
// and must change it before proceeding. Also allows any
// user to change their password.
// ============================================================

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Authenticate the user
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    // ---- VALIDATION ----
    if (!currentPassword || !newPassword) {
      return errorResponse("Please provide currentPassword and newPassword", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("New password must be at least 6 characters long", 400);
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Current password is incorrect", 400);
    }

    // Hash and save the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        // Clear temp password fields after successful change
        tempPassword: null,
        mustChangePassword: false,
      },
    });

    return successResponse(null, "Password changed successfully!", 200);
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Failed to change password.", 500);
  }
}
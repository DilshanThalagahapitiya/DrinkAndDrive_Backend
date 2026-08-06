// ============================================================
// GET /api/auth/me - Get Current Logged-in User
// ============================================================
// Returns the profile of the user associated with the
// JWT token sent in the Authorization header.
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
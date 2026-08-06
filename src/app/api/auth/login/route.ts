// ============================================================
// POST /api/auth/login - User Login
// ============================================================
// Authenticates a user by email + password.
// Works for: ADMIN, DRIVER, RIDER, HOTEL
// Returns a JWT token on success.
// ============================================================

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { email, password } = await req.json();

    // ---- VALIDATION ----
    if (!email || !password) {
      return errorResponse("Please provide both email and password", 400);
    }

    // ---- FIND USER ----
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        driverProfile: true,
        riderProfile: true,
        hotelProfile: true,
      },
    });

    // User not found - use generic message for security
    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // ---- CHECK PASSWORD ----
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", 401);
    }

    // ---- GENERATE JWT TOKEN ----
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _pw, ...userWithoutPassword } = user;

    return successResponse(
      {
        user: userWithoutPassword,
        token,
      },
      "Login successful",
      200
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed. Please try again.", 500);
  }
}
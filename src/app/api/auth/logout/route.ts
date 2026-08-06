// ============================================================
// POST /api/auth/logout - Logout
// ============================================================
// In a JWT-based system, logout is handled on the client side
// by deleting the stored token. This endpoint exists to:
//   1. Provide a consistent API for the frontend
//   2. Allow future token blacklisting (e.g. Redis)
// ============================================================

import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Verify the user has a valid token before logging out
  const user = authenticateRequest(req);
  if (!user) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  // For now this is a no-op on the server.
  // The client must remove the token from localStorage.
  return successResponse(null, "Logout successful. Please remove your token.", 200);
}
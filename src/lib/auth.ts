// ============================================================
// Authentication & Authorization Middleware
// ============================================================
// Protects API routes by verifying JWT tokens.
// Also supports role-based access control (e.g. only ADMIN).
// ============================================================

import { NextRequest } from "next/server";
import { verifyToken, extractTokenFromHeader, type TokenPayload } from "./jwt";

// Authenticate a request - returns the user payload or null
export function authenticateRequest(req: NextRequest): TokenPayload | null {
  // Get the Authorization header
  const authHeader = req.headers.get("authorization");

  // Extract the Bearer token
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  try {
    // Verify the token is valid
    return verifyToken(token);
  } catch {
    // Token is invalid or expired
    return null;
  }
}

// Check if the authenticated user has one of the allowed roles
export function hasRole(user: TokenPayload | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
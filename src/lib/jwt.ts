// ============================================================
// JWT (JSON Web Token) Utilities
// ============================================================
// Handles creating and verifying authentication tokens.
// Tokens store the user's id so they don't need to
// re-login on every request.
// ============================================================

import jwt from "jsonwebtoken";

// JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "dad-super-secret-key-change-me-in-production-2024";

// Payload stored inside each token
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Create a signed token for a user
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); // Token valid for 7 days
}

// Verify a token and return its payload
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// Extract token from the Authorization header
// Format: "Bearer <token>"
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}
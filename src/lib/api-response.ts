// ============================================================
// API Response Helpers
// ============================================================
// Provides consistent JSON response format for all API routes.
// Every API returns: { success: true/false, data, message }
// ============================================================

import { NextResponse } from "next/server";

// CORS headers to allow the Flutter app (web/mobile) to access the API
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Success response with optional data
export function successResponse(data: unknown = null, message = "Success", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status, headers: corsHeaders() }
  );
}

// Error response with error message
export function errorResponse(message = "Something went wrong", status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status, headers: corsHeaders() }
  );
}

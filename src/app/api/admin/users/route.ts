// ============================================================
// GET /api/admin/users - Admin: List All Registered Users
// ============================================================
// Returns users filtered by role, status, and/or search text.
// Used by the admin portal to review pending registrations.
//
// Query params:
//   role   - ADMIN | DRIVER | RIDER | HOTEL (optional)
//   status - PENDING | APPROVED | REJECTED (optional)
//   search - Search by name, email, phone, license, vehicle (optional)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest, hasRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // --- Authorization: only ADMIN can view all users ---
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  if (!hasRole(authUser, ["ADMIN"])) {
    return errorResponse("Forbidden. Admin access required.", 403);
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");       // e.g. DRIVER
    const status = searchParams.get("status");   // e.g. PENDING
    const search = searchParams.get("search");   // e.g. "John"

    // Build the where clause dynamically
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;

    // Add search filter - searches across name, email, phone,
    // and role-specific fields (license number, vehicle number, etc.)
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        // Basic user fields
        { fullName: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
        // Driver-specific fields
        { driverProfile: { licenseNumber: { contains: term } } },
        { driverProfile: { licenseCategory: { contains: term } } },
        { driverProfile: { vehicleType: { contains: term } } },
        { driverProfile: { preferredGear: { contains: term } } },
        { driverProfile: { specialNote: { contains: term } } },
        { driverProfile: { city: { contains: term } } },
        // Rider-specific fields
        { riderProfile: { address: { contains: term } } },
        { riderProfile: { city: { contains: term } } },
        { riderProfile: { emergencyContactName: { contains: term } } },
        { riderProfile: { emergencyContactPhone: { contains: term } } },
        // Hotel-specific fields
        { hotelProfile: { hotelName: { contains: term } } },
        { hotelProfile: { hotelLicenseNumber: { contains: term } } },
        { hotelProfile: { city: { contains: term } } },
        // Customer-specific fields
        { customerProfile: { vehicleType: { contains: term } } },
        { customerProfile: { vehicleNumber: { contains: term } } },
        { customerProfile: { location: { contains: term } } },
      ];
    }

    // Fetch users (exclude password) with their profiles
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        // Personal details for drivers
        firstName: true,
        lastName: true,
        initials: true,
        dob: true,
        nic: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        // Include temp password so admin can view it anytime
        tempPassword: true,
        mustChangePassword: true,
        driverProfile: true,
        riderProfile: true,
        hotelProfile: true,
        customerProfile: true,
      },
      orderBy: {
        createdAt: "desc", // Newest first
      },
    });

    return successResponse({ users }, "Users retrieved successfully");
  } catch (error) {
    console.error("Admin list users error:", error);
    return errorResponse("Failed to retrieve users.", 500);
  }
}
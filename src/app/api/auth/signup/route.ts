// ============================================================
// POST /api/auth/signup - User Registration
// ============================================================
// Creates a new user account. Supports three roles:
//   1. DRIVER - requires license details & vehicle info
//   2. RIDER  - requires emergency contact info
//   3. HOTEL  - requires hotel details
//
// New users get status = PENDING until an admin approves them.
// Returns a JWT token after successful registration.
// ============================================================

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const {
      role,           // "DRIVER" | "RIDER" | "HOTEL"
      email,          // User's email (unique)
      password,       // Plain password (will be hashed)
      fullName,       // User's full name
      // NEW: Personal details
      firstName,
      lastName,
      initials,
      dob,
      nic,
      phone,          // Contact number
      // Driver-specific fields (NEW DESIGN)
      licenseNumber,
      licenseCategory,     // LIGHT_WEIGHT | HEAVY | BOTH
      licenseLightExpiryDate,
      licenseHeavyExpiryDate,
      licenseFrontImage,
      licenseBackImage,
      vehicleType,
      preferredGear,
      specialNote,
      // Rider-specific fields
      address,
      city,
      riderLicenseNumber,
      riderIdNumber,
      emergencyContactName,
      emergencyContactPhone,
      // Hotel-specific fields
      hotelName,
      hotelLicenseNumber,
      contactPhone,
      contactEmail,
      hotelImage,
      description,
      // Customer-specific fields
      customerLocation,
      customerVehicleType,
      customerTransmission,
      customerVehicleNumber,
      customerSpecialNote,
    } = body;

    // ---- VALIDATION ----
    // Basic required fields for everyone
    if (!role || !phone) {
      return errorResponse("Please provide: role, phone", 400);
    }

    // If email is not provided (optional), auto-generate a unique one
    const finalEmail = email || `user_${Date.now()}@dad.app`;

    // For ADMIN-created users (driver/rider/hotel), generate temp password automatically
    // For public signup, use provided password
    let finalPassword = password;
    let tempPassword = null;
    let mustChangePassword = false;

    if (!password) {
      // Auto-generate a temp password (e.g., DAD2026XXXX)
      tempPassword = `DAD${new Date().getFullYear()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      finalPassword = tempPassword;
      mustChangePassword = true; // User must change on first login
    }

    // Validate role is one of the allowed types
    if (!["DRIVER", "RIDER", "HOTEL", "CUSTOMER"].includes(role)) {
      return errorResponse("Role must be DRIVER, RIDER, HOTEL or CUSTOMER", 400);
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      return errorResponse("Please provide a valid email address", 400);
    }

    // Password validation (only if provided publicly)
    if (password && password.length < 6) {
      return errorResponse("Password must be at least 6 characters long", 400);
    }

    // Role-specific validation
    if (role === "DRIVER") {
      if (!licenseNumber || !licenseCategory || !licenseFrontImage || !licenseBackImage) {
        return errorResponse(
          "Driver registration requires: licenseNumber, licenseCategory, licenseFrontImage, licenseBackImage",
          400
        );
      }
      if (licenseCategory === "LIGHT_WEIGHT" && !licenseLightExpiryDate) {
        return errorResponse("Light weight license expiry date is required", 400);
      }
      if (licenseCategory === "HEAVY" && !licenseHeavyExpiryDate) {
        return errorResponse("Heavy license expiry date is required", 400);
      }
      if (licenseCategory === "BOTH" && (!licenseLightExpiryDate || !licenseHeavyExpiryDate)) {
        return errorResponse("Both light and heavy expiry dates are required", 400);
      }
    }

    if (role === "RIDER") {
      if (!emergencyContactName || !emergencyContactPhone) {
        return errorResponse(
          "Rider registration requires: emergencyContactName, emergencyContactPhone",
          400
        );
      }
    }

    if (role === "HOTEL") {
      if (!hotelName || !hotelLicenseNumber || !contactPhone || !contactEmail) {
        return errorResponse(
          "Hotel registration requires: hotelName, hotelLicenseNumber, contactPhone, contactEmail",
          400
        );
      }
    }

    // ---- CHECK DUPLICATES ----
    // Email must be unique
    const existingEmail = await prisma.user.findUnique({
      where: { email: finalEmail },
    });
    if (existingEmail) {
      return errorResponse("Email is already registered. Please login instead.", 409);
    }

    // ---- VEHICLE TYPE ----
    const vehicleTypeValue = role === "DRIVER" && vehicleType ? String(vehicleType) : "";

    // If driver: license number must be unique
    if (role === "DRIVER") {
      const existingLicense = await prisma.driverProfile.findUnique({
        where: { licenseNumber },
      });
      if (existingLicense) {
        return errorResponse("This license number is already registered.", 409);
      }
    }

    // If hotel: hotel license must be unique
    if (role === "HOTEL") {
      const existingHotelLicense = await prisma.hotelProfile.findUnique({
        where: { hotelLicenseNumber },
      });
      if (existingHotelLicense) {
        return errorResponse("This hotel license number is already registered.", 409);
      }
    }

    // ---- HASH PASSWORD ----
    // Hash the password so it's never stored as plain text
    const hashedPassword = await bcrypt.hash(finalPassword || "ChangeMe123!", 10);

    // ---- CREATE USER (and profile) ----
    let user;

    // ---- COMPUTE FULL NAME ----
    const computedFullName =
      fullName || [initials, firstName, lastName].filter(Boolean).join(" ") || finalEmail.split("@")[0];

    if (role === "DRIVER") {
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          password: hashedPassword,
          firstName: firstName || "",
          lastName: lastName || "",
          initials: initials || "",
          fullName: computedFullName,
          dob: dob ? new Date(dob) : null,
          nic: nic || null,
          phone,
          role: "DRIVER",
          status: "PENDING",
          tempPassword: tempPassword,
          mustChangePassword: mustChangePassword,
          driverProfile: {
            create: {
              licenseNumber,
              licenseCategory: licenseCategory || "LIGHT_WEIGHT",
              licenseLightExpiryDate: licenseLightExpiryDate ? new Date(licenseLightExpiryDate) : null,
              licenseHeavyExpiryDate: licenseHeavyExpiryDate ? new Date(licenseHeavyExpiryDate) : null,
              licenseFrontImage,
              licenseBackImage,
              vehicleType: vehicleTypeValue,
              preferredGear: preferredGear || "AUTO",
              specialNote: specialNote || null,
              address: address || "",
              city: city || "",
            },
          },
        },
        include: { driverProfile: true },
      });
    } else if (role === "RIDER") {
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          password: hashedPassword,
          firstName: firstName || "",
          lastName: lastName || "",
          initials: initials || "",
          fullName: computedFullName,
          dob: dob ? new Date(dob) : null,
          nic: nic || null,
          phone,
          role: "RIDER",
          status: "PENDING",
          tempPassword: tempPassword,
          mustChangePassword: mustChangePassword,
          riderProfile: {
            create: {
              licenseNumber: riderLicenseNumber || null,
              idNumber: riderIdNumber || null,
              address: address || "",
              city: city || "",
              emergencyContactName,
              emergencyContactPhone,
            },
          },
        },
        include: { riderProfile: true },
      });
    } else if (role === "CUSTOMER") {
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          password: hashedPassword,
          firstName: firstName || "",
          lastName: lastName || "",
          initials: initials || "",
          fullName: computedFullName,
          dob: dob ? new Date(dob) : null,
          nic: nic || null,
          phone,
          role: "CUSTOMER",
          status: "PENDING",
          tempPassword: tempPassword,
          mustChangePassword: mustChangePassword,
          customerProfile: {
            create: {
              location: customerLocation,
              vehicleType: customerVehicleType,
              transmission: customerTransmission || "AUTO",
              vehicleNumber: customerVehicleNumber,
              specialNote: customerSpecialNote || null,
            },
          },
        },
        include: { customerProfile: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          password: hashedPassword,
          firstName: firstName || "",
          lastName: lastName || "",
          initials: initials || "",
          fullName: computedFullName,
          dob: dob ? new Date(dob) : null,
          nic: nic || null,
          phone,
          role: "HOTEL",
          status: "PENDING",
          hotelProfile: {
            create: {
              hotelName,
              hotelLicenseNumber,
              address: address || "",
              city: city || "",
              hotelImage: hotelImage || null,
              description: description || null,
              contactPhone,
              contactEmail,
            },
          },
        },
        include: { hotelProfile: true },
      });
    }

    // ---- GENERATE JWT TOKEN ----
    // User can login immediately, but cannot use the app until approved
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from the response
    const { password: _pw, ...userWithoutPassword } = user;

    return successResponse(
      {
        user: userWithoutPassword,
        token,
        tempPassword: tempPassword,
        mustChangePassword: mustChangePassword,
      },
      tempPassword
        ? `Driver registered! Temporary password: ${tempPassword}`
        : "Registration successful! Your account is pending admin approval.",
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse("Registration failed. Please try again.", 500);
  }
}
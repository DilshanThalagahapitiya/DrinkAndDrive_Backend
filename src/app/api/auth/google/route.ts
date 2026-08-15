// ============================================================
// POST /api/auth/google - Google Sign-In
// ============================================================
// Verifies the Google ID token from the mobile app, then
// either logs in an existing user or creates a new one.
//
// IMPORTANT: Set GOOGLE_CLIENT_ID in .env.local to your
// Google OAuth 2.0 "Web Client ID" from the Google Cloud
// Console. This is REQUIRED for token verification.
// ============================================================

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { signToken } from "@/lib/jwt";

// Google token verification URL
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

// Client ID from environment (set in .env.local)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// Verify a Google ID token with Google's tokeninfo endpoint
async function verifyGoogleToken(idToken: string) {
  const url = `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Invalid Google token (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  console.log("[GoogleAuth] 🔑 POST /api/auth/google called");
  try {
    const body = await req.json();
    const { idToken, role } = body;
    console.log("[GoogleAuth] Received idToken length:", idToken?.length ?? 0, "role:", role);

    if (!idToken) {
      console.log("[GoogleAuth] ❌ Missing idToken");
      return errorResponse("Please provide a Google ID token.", 400);
    }

    // Verify the token with Google
    let payload: any;
    try {
      payload = await verifyGoogleToken(idToken);
      console.log("[GoogleAuth] ✅ Token verified with Google");
      console.log("[GoogleAuth]   - email:", payload.email);
      console.log("[GoogleAuth]   - email_verified:", payload.email_verified, "(type:", typeof payload.email_verified, ")");
      console.log("[GoogleAuth]   - aud:", payload.aud);
      console.log("[GoogleAuth]   - azp:", payload.azp);
      console.log("[GoogleAuth]   - iss:", payload.iss);
      console.log("[GoogleAuth]   - exp:", payload.exp);
      console.log("[GoogleAuth]   - name:", payload.name);
    } catch (err: any) {
      console.log("[GoogleAuth] ❌ Token verification failed:", err.message);
      return errorResponse(err.message || "Invalid Google token.", 401);
    }

    // Log env config
    console.log("[GoogleAuth] GOOGLE_CLIENT_ID env set:", GOOGLE_CLIENT_ID ? "YES (" + GOOGLE_CLIENT_ID + ")" : "NO (skipping audience check)");

    // Google User Info
    const googleEmail = payload.email;
    const googleName = payload.name || "";
    const googlePicture = payload.picture || null;
    // tokeninfo returns email_verified as "true"/"false" STRING, not boolean
    const googleEmailVerified =
      payload.email_verified === true || payload.email_verified === "true";

    if (!googleEmail) {
      console.log("[GoogleAuth] ❌ No email in token payload");
      return errorResponse("Google email is missing.", 401);
    }
    if (!googleEmailVerified) {
      console.log("[GoogleAuth] ❌ Email not verified. email_verified =", payload.email_verified);
      return errorResponse("Google email is not verified.", 401);
    }
    console.log("[GoogleAuth] ✅ Email verified:", googleEmail);

    // If a GOOGLE_CLIENT_ID is configured, verify audience matches.
    // Accept either the configured client ID OR any client ID from the
    // same Google Cloud project (allows iOS/Android/Web client IDs to all work).
    if (GOOGLE_CLIENT_ID) {
      const aud = String(payload.aud || "");
      const projectPrefix = GOOGLE_CLIENT_ID.split("-")[0];
      const audPrefix = aud.split("-")[0];
      console.log("[GoogleAuth] Audience check: aud =", aud, ", env prefix =", projectPrefix, ", token prefix =", audPrefix);
      if (aud !== GOOGLE_CLIENT_ID && audPrefix !== projectPrefix) {
        console.log("[GoogleAuth] ❌ Audience mismatch! aud:", aud, "expects:", GOOGLE_CLIENT_ID);
        return errorResponse("Google token audience does not match.", 401);
      }
      console.log("[GoogleAuth] ✅ Audience check passed");
    }

    // ---- FIND OR CREATE USER ----
    console.log("[GoogleAuth] Searching for existing user:", googleEmail);
    let user: any = await prisma.user.findUnique({
      where: { email: googleEmail },
      include: { customerProfile: true, driverProfile: true, riderProfile: true, hotelProfile: true },
    });
    console.log("[GoogleAuth] Existing user:", user ? "YES (id: " + user.id + ", role: " + user.role + ")" : "NO - will create new");

    if (!user) {
      // Create a new user with the selected role (default CUSTOMER)
      const selectedRole = ["DRIVER", "RIDER", "HOTEL", "CUSTOMER"].includes(role)
        ? role
        : "CUSTOMER";
      console.log("[GoogleAuth] Creating new user with role:", selectedRole);

      // Generate a random password (user will login via Google only)
      const randomPassword = Math.random().toString(36).slice(-12) + "G!";

      // Create user based on role
      if (selectedRole === "CUSTOMER") {
        user = await prisma.user.create({
          data: {
            email: googleEmail,
            password: await bcrypt.hash(randomPassword, 10),
            firstName: googleName.split(" ")[0] || "",
            lastName: googleName.split(" ").slice(1).join(" ") || "",
            fullName: googleName,
            phone: "",
            role: "CUSTOMER",
            status: "PENDING",
            customerProfile: {
              create: {
                location: "",
                vehicleType: "",
                transmission: "AUTO",
                vehicleNumber: "",
              },
            },
          },
          include: { customerProfile: true },
        });
      } else if (selectedRole === "DRIVER") {
        // Google signup for driver - needs license info later
        user = await prisma.user.create({
          data: {
            email: googleEmail,
            password: await bcrypt.hash(randomPassword, 10),
            firstName: googleName.split(" ")[0] || "",
            lastName: googleName.split(" ").slice(1).join(" ") || "",
            fullName: googleName,
            phone: "",
            role: "DRIVER",
            status: "PENDING",
            driverProfile: {
              create: {
                licenseNumber: "",
                licenseCategory: "LIGHT_WEIGHT",
                licenseFrontImage: "",
                licenseBackImage: "",
                vehicleType: "",
                preferredGear: "AUTO",
                address: "",
                city: "",
              },
            },
          },
          include: { driverProfile: true },
        });
      } else if (selectedRole === "RIDER") {
        user = await prisma.user.create({
          data: {
            email: googleEmail,
            password: await bcrypt.hash(randomPassword, 10),
            firstName: googleName.split(" ")[0] || "",
            lastName: googleName.split(" ").slice(1).join(" ") || "",
            fullName: googleName,
            phone: "",
            role: "RIDER",
            status: "PENDING",
            riderProfile: {
              create: {
                address: "",
                city: "",
                emergencyContactName: "",
                emergencyContactPhone: "",
              },
            },
          },
          include: { riderProfile: true },
        });
      } else {
        // HOTEL
        user = await prisma.user.create({
          data: {
            email: googleEmail,
            password: await bcrypt.hash(randomPassword, 10),
            firstName: googleName.split(" ")[0] || "",
            lastName: googleName.split(" ").slice(1).join(" ") || "",
            fullName: googleName,
            phone: "",
            role: "HOTEL",
            status: "PENDING",
            hotelProfile: {
              create: {
                hotelName: googleName,
                hotelLicenseNumber: "",
                address: "",
                city: "",
                contactEmail: googleEmail,
                contactPhone: "",
              },
            },
          },
          include: { hotelProfile: true },
        });
      }
    }

    // ---- GENERATE JWT TOKEN ----
    console.log("[GoogleAuth] ✅ Generating JWT for user:", user.id);
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    console.log("[GoogleAuth] ✅ Token generated, returning success response");

    // Remove password from response
    const { password: _pw, ...userWithoutPassword } = user;

    return successResponse(
      {
        user: userWithoutPassword,
        token,
        googleImage: googlePicture,
      },
      "Google sign-in successful!",
    );
  } catch (error: any) {
    console.error("[GoogleAuth] ❌ UNCAUGHT ERROR:", error);
    console.error("[GoogleAuth]   Stack:", error?.stack);
    return errorResponse(`Google sign-in failed: ${error?.message || "Unknown error"}`, 500);
  }
}
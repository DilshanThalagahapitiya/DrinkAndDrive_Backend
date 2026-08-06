// ============================================================
// POST /api/upload - Generic Image Upload
// ============================================================
// Accepts an image file (multipart/form-data) and saves it to
// /public/uploads. Returns the public URL path which can then
// be stored in the database.
//
// Used for: driver license photos, hotel images, etc.
// ============================================================

import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(req: NextRequest) {
  // --- Authentication: user must be logged in ---
  const user = authenticateRequest(req);
  if (!user) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    // Validate that a file was provided
    if (!file) {
      return errorResponse("No file uploaded. Please provide a 'file' field.", 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Invalid file type. Only JPG, PNG, WEBP, HEIC are allowed.", 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File too large. Maximum size is 5MB.", 400);
    }

    // Convert file to a Buffer for writing to disk
    const bytes = Buffer.from(await file.arrayBuffer());

    // Create a unique filename: timestamp + random + original extension
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;

    // Uploads directory: public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Full path where the file will be saved
    const filePath = path.join(uploadDir, filename);

    // Write the file to disk
    await writeFile(filePath, bytes);

    // Public URL path that will be stored in the database
    const publicUrl = `/uploads/${filename}`;

    return successResponse({ url: publicUrl, filename }, "File uploaded successfully", 201);
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse("Failed to upload file.", 500);
  }
}
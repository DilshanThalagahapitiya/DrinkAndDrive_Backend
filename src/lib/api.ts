// ============================================================
// Frontend API Client
// ============================================================
// Helper functions for making API calls from browser components.
// Automatically attaches the JWT token to every request.
// ============================================================

// Base URL - same origin in development
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Get the token from localStorage (client-side only)
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dad_token");
}

// Save the token after login
export function setToken(token: string) {
  localStorage.setItem("dad_token", token);
}

// Remove the token on logout
export function removeToken() {
  localStorage.removeItem("dad_token");
}

// Main request helper - attaches auth header automatically
export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    isFormData?: boolean; // true if body is FormData (file upload)
    auth?: boolean; // whether to attach token (default: true)
  } = {},
): Promise<T> {
  const { method = "GET", body, isFormData = false, auth = true } = options;

  const headers: Record<string, string> = {};

  // Only set Content-Type for JSON (not FormData)
  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Attach JWT token if required
  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  // If not successful, throw an error with the server message
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// ============================================================
// Auth API calls
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  initials?: string;
  dob?: string | null;
  nic?: string | null;
  phone: string;
  role: "ADMIN" | "DRIVER" | "RIDER" | "HOTEL" | "CUSTOMER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  tempPassword?: string | null;
  mustChangePassword?: boolean;
  driverProfile?: any;
  riderProfile?: any;
  hotelProfile?: any;
  customerProfile?: any;
}

// Login with email + password
export const login = (email: string, password: string) =>
  apiRequest<ApiResponse<{ user: User; token: string }>>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });

// Register a new user (driver, rider, or hotel)
export const signup = (data: Record<string, unknown>) =>
  apiRequest<ApiResponse<{ user: User; token: string; tempPassword?: string | null; mustChangePassword?: boolean }>>("/api/auth/signup", {
    method: "POST",
    body: data,
    auth: false,
  });

// Get current logged-in user
export const getMe = () =>
  apiRequest<ApiResponse<{ user: User }>>("/api/auth/me", {
    method: "GET",
  });

// Logout
export const logout = () =>
  apiRequest<ApiResponse<null>>("/api/auth/logout", {
    method: "POST",
  });

// Upload a file (returns the public URL)
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<ApiResponse<{ url: string; filename: string }>>("/api/upload", {
    method: "POST",
    body: formData,
    isFormData: true,
  });
};

// ============================================================
// Admin API calls
// ============================================================

// Get all users (filterable by role, status, and search text)
export const adminGetUsers = (role?: string, status?: string, search?: string) => {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<ApiResponse<{ users: User[] }>>(`/api/admin/users${query}`, {
    method: "GET",
  });
};

// Update a user's details (basic info + role-specific profile)
export const adminUpdateUser = (userId: string, data: Record<string, unknown>) =>
  apiRequest<ApiResponse<{ user: User }>>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: data,
  });

// Delete a user permanently
export const adminDeleteUser = (userId: string) =>
  apiRequest<ApiResponse<{ deletedId: string }>>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });

// Approve or reject a user (for drivers, practical test data is required)
export const adminReviewUser = (
  userId: string,
  action: "APPROVE" | "REJECT",
  practicalTest?: { practicalTestPassed?: boolean; practicalTestPassedDate?: string }
) =>
  apiRequest<ApiResponse<{ user: User }>>("/api/admin/review", {
    method: "PATCH",
    body: { userId, action, ...practicalTest },
  });

// ============================================================
// Ride API calls
// ============================================================

export interface Ride {
  id: string;
  driverId: string;
  riderId: string;
  pickupLocation: string;
  dropLocation: string;
  startTime: string;
  startedAt?: string | null;
  customerName?: string | null;
  customerNumber?: string | null;
  vehicleType?: string | null;
  transmission?: string | null;
  specialNote?: string | null;
  status: "PENDING_REQUEST" | "ASSIGNED" | "UPCOMING" | "ONGOING" | "COMPLETED";
  driverAccepted?: boolean | null;
  riderAccepted?: boolean | null;
  driverCancelled?: boolean | null;
  riderCancelled?: boolean | null;
  // Ride workflow fields
  rideStartedAt?: string | null;
  waitingSince?: string | null;
  waitingTotal?: number;
  waitingIntervals?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  dropLatitude?: number | null;
  dropLongitude?: number | null;
  odoStart?: number | null;
  odoEnd?: number | null;
  odoStartImage?: string | null;
  odoEndImage?: string | null;
  totalFare?: number | null;
  fareBreakdown?: string | null;
  driver?: { id: string; fullName: string; phone: string; email: string };
  rider?: { id: string; fullName: string; phone: string; email: string };
}

// Create a new ride
export const adminCreateRide = (data: {
  driverId: string;
  riderId: string;
  pickupLocation: string;
  dropLocation: string;
  startTime: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  dropLatitude?: number | null;
  dropLongitude?: number | null;
  customerName?: string;
  customerNumber?: string;
  vehicleType?: string;
  transmission?: string;
  specialNote?: string;
}) =>
  apiRequest<ApiResponse<{ ride: Ride }>>("/api/admin/rides", {
    method: "POST",
    body: data,
  });

// List rides (filter by status: ONGOING | COMPLETED)
export const adminGetRides = (status?: string) => {
  const query = status ? `?status=${status}` : "";
  return apiRequest<ApiResponse<{ rides: Ride[] }>>(`/api/admin/rides${query}`, {
    method: "GET",
  });
};

// Start an upcoming ride
export const adminStartRide = (rideId: string) =>
  apiRequest<ApiResponse<{ ride: Ride }>>(`/api/admin/rides/${rideId}`, {
    method: "PATCH",
    body: { action: "START" },
  });

// Complete a ride
export const adminCompleteRide = (rideId: string) =>
  apiRequest<ApiResponse<{ ride: Ride }>>(`/api/admin/rides/${rideId}`, {
    method: "PATCH",
    body: { action: "COMPLETE" },
  });

// Update a ride (assign driver/rider, fill empty fields)
export const adminUpdateRide = (rideId: string, data: Record<string, unknown>) =>
  apiRequest<ApiResponse<{ ride: Ride }>>(`/api/admin/rides/${rideId}`, {
    method: "PATCH",
    body: { ...data, action: "UPDATE" },
  });

// Delete a ride
export const adminDeleteRide = (rideId: string) =>
  apiRequest<ApiResponse<{ deletedId: string }>>(`/api/admin/rides/${rideId}`, {
    method: "DELETE",
  });

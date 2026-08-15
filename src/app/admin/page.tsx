// ============================================================
// Admin Dashboard - Ride Details First
// ============================================================
// Shows ride statistics + full ride details table as the main
// focus. Also includes a secondary section for pending user
// registrations that need admin approval.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  adminGetRides,
  adminStartRide,
  adminCompleteRide,
  adminGetUsers,
  adminReviewUser,
  Ride,
  User,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ViewRideModal from "@/components/ViewRideModal";

type RideTab = "ALL" | "PENDING_REQUEST" | "ONGOING" | "UPCOMING" | "COMPLETED";

export default function AdminDashboard() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  // ---- Ride state ----
  const [rides, setRides] = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [rideTab, setRideTab] = useState<RideTab>("ALL");
  const [viewingRide, setViewingRide] = useState<Ride | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---- User approval state (secondary section) ----
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userTab, setUserTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ------------------------------------------------------------
  // Fetch all rides (no status filter = all) for dashboard stats
  // ------------------------------------------------------------
  const fetchAllRides = useCallback(async () => {
    setRidesLoading(true);
    setError("");
    try {
      const response = await adminGetRides(); // no status = ALL
      setRides(response.data.rides);
    } catch (err: any) {
      setError(err.message || "Failed to load rides");
    } finally {
      setRidesLoading(false);
    }
  }, []);

  // ------------------------------------------------------------
  // Fetch pending users for approval section
  // ------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await adminGetUsers(undefined, userTab);
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [userTab]);

  useEffect(() => {
    fetchAllRides();
  }, [fetchAllRides]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ------------------------------------------------------------
  // Ride actions
  // ------------------------------------------------------------
  async function handleStart(rideId: string) {
    setActionLoading(rideId);
    setError("");
    try {
      await adminStartRide(rideId);
      setSuccess("Ride started successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchAllRides();
    } catch (err: any) {
      setError(err.message || "Failed to start ride");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(rideId: string) {
    setActionLoading(rideId);
    setError("");
    try {
      await adminCompleteRide(rideId);
      setSuccess("Ride completed successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchAllRides();
    } catch (err: any) {
      setError(err.message || "Failed to complete ride");
    } finally {
      setActionLoading(null);
    }
  }

  // ------------------------------------------------------------
  // User review actions
  // ------------------------------------------------------------
  async function handleReview(userId: string, action: "APPROVE" | "REJECT") {
    setActionLoading(userId);
    setError("");
    try {
      await adminReviewUser(userId, action);
      setSuccess(`User ${action === "APPROVE" ? "approved" : "rejected"} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
      await fetchUsers();
      setExpandedUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setActionLoading(null);
    }
  }

  // Handle logout
  async function handleLogout() {
    await logout();
    router.push("/");
  }

  // ------------------------------------------------------------
  // Derived ride stats
  // ------------------------------------------------------------
  const totalRides = rides.length;
  const ongoingRides = rides.filter((r) => r.status === "ONGOING").length;
  const upcomingRides = rides.filter((r) => r.status === "UPCOMING" || r.status === "ASSIGNED").length;
  const pendingRequests = rides.filter((r) => r.status === "PENDING_REQUEST").length;
  const completedRides = rides.filter((r) => r.status === "COMPLETED").length;
  const totalRevenue = rides
    .filter((r) => r.status === "COMPLETED" && r.totalFare != null)
    .reduce((sum, r) => sum + (r.totalFare || 0), 0);

  // Filter rides for table display
  const filteredRides = rideTab === "ALL" ? rides : rides.filter((r) => r.status === rideTab);

  // Assist status helper
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case "COMPLETED": return "bg-green-50 text-green-700";
      case "ONGOING": return "bg-yellow-50 text-yellow-700";
      case "UPCOMING": return "bg-indigo-50 text-indigo-700";
      case "ASSIGNED": return "bg-amber-50 text-amber-700";
      case "PENDING_REQUEST": return "bg-orange-50 text-orange-700";
      default: return "bg-slate-50 text-slate-700";
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString();
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          SECTION 1 - RIDE STATS SUMMARY CARDS
          ============================================================ */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">🚙 Ride Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-slate-500">
            <p className="text-sm text-slate-500">Total Rides</p>
            <p className="text-2xl font-bold text-slate-900">{totalRides}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-slate-500">🟢 Ongoing</p>
            <p className="text-2xl font-bold text-green-600">{ongoingRides}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-slate-500">🗓️ Upcoming</p>
            <p className="text-2xl font-bold text-indigo-600">{upcomingRides}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-slate-500">⚡ Pending Requests</p>
            <p className="text-2xl font-bold text-orange-600">{pendingRequests}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-emerald-500">
            <p className="text-sm text-slate-500">✅ Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{completedRides}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-slate-500">💰 Revenue</p>
            <p className="text-2xl font-bold text-yellow-600">Rs. {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Error / Success alerts */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          ✅ {success}
        </div>
      )}

      {/* ============================================================
          SECTION 2 - PENDING REQUEST CALL-OUT
          (Rides that need driver/rider assignment)
          ============================================================ */}
      {pendingRequests > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl">⚡</span>
            <div>
              <p className="font-semibold text-orange-800">
                {pendingRequests} ride{pendingRequests > 1 ? "s" : ""} need{pendingRequests === 1 ? "s" : ""} assignment
              </p>
              <p className="text-sm text-orange-600">Customers are waiting for a driver & rider to be assigned.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setRideTab("PENDING_REQUEST");
              document.getElementById("rides-table")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
          >
            View Pending →
          </button>
        </div>
      )}

      {/* ============================================================
          SECTION 3 - RIDE DETAILS TABLE (MAIN CONTENT)
          ============================================================ */}
      <div id="rides-table" className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table header + tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            🚙 Ride Details
            <span className="ml-2 text-sm font-normal text-slate-500">({filteredRides.length} rides)</span>
          </h3>
          <button
            onClick={() => router.push("/admin/rides")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            ➕ Set Ride / Full Management
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-2">
          {(["ALL", "PENDING_REQUEST", "ONGOING", "UPCOMING", "COMPLETED"] as RideTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setRideTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                rideTab === t
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "ALL" ? "📋 All" :
               t === "PENDING_REQUEST" ? "⚡ Pending" :
               t === "ONGOING" ? "🟢 Ongoing" :
               t === "UPCOMING" ? "🗓️ Upcoming" : "✅ Completed"}
            </button>
          ))}
        </div>

        {/* Table */}
        {ridesLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">No rides found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Driver</th>
                  <th className="px-4 py-3 font-semibold">Rider</th>
                  <th className="px-4 py-3 font-semibold">Pickup → Drop</th>
                  <th className="px-4 py-3 font-semibold">Scheduled</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Fare</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRides.map((ride, idx) => (
                  <tr
                    key={ride.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setViewingRide(ride)}
                  >
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    {/* Driver */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                          {ride.driver?.fullName?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-[120px]">
                            {ride.driver?.fullName || <span className="text-orange-500">Not assigned</span>}
                          </p>
                          <span className="text-xs text-slate-400">{ride.driver?.phone}</span>
                        </div>
                      </div>
                    </td>
                    {/* Rider */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                          {ride.rider?.fullName?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-[120px]">
                            {ride.rider?.fullName || <span className="text-orange-500">Not assigned</span>}
                          </p>
                          <span className="text-xs text-slate-400">{ride.rider?.phone}</span>
                        </div>
                      </div>
                    </td>
                    {/* Locations */}
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="text-slate-600 truncate">📍 {ride.pickupLocation}</p>
                        <p className="text-slate-600 truncate">↓ 🏁 {ride.dropLocation}</p>
                      </div>
                    </td>
                    {/* Scheduled time */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(ride.startTime)}
                    </td>
                    {/* Customer */}
                    <td className="px-4 py-3">
                      {ride.customerName ? (
                        <div>
                          <p className="font-medium text-slate-900">{ride.customerName}</p>
                          <span className="text-xs text-slate-400">{ride.customerNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {/* Status badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full w-fit ${getStatusBadgeClasses(ride.status)}`}>
                          {ride.status}
                        </span>
                        {/* Cancellation badges */}
                        {ride.driverCancelled === true && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-300 w-fit">
                            🚗 Driver Cancelled
                          </span>
                        )}
                        {ride.riderCancelled === true && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-300 w-fit">
                            🙋 Rider Cancelled
                          </span>
                        )}
                        {/* Acceptance badges */}
                        {ride.status === "ASSIGNED" && ride.driverAccepted === true && ride.riderAccepted === true && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 w-fit">
                            ✅ Ready
                          </span>
                        )}
                        {ride.status === "ASSIGNED" && ride.driverAccepted === true && ride.riderAccepted !== true && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-300 w-fit">
                            🚗 Driver Accepted
                          </span>
                        )}
                        {ride.status === "ASSIGNED" && ride.riderAccepted === true && ride.driverAccepted !== true && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-300 w-fit">
                            🙋 Rider Accepted
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Fare */}
                    <td className="px-4 py-3">
                      {ride.totalFare != null ? (
                        <span className="font-semibold text-green-700 whitespace-nowrap">
                          Rs. {ride.totalFare.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setViewingRide(ride)}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
                          title="View details"
                        >
                          👁️
                        </button>
                        {ride.status === "PENDING_REQUEST" && (
                          <button
                            onClick={() => router.push("/admin/rides")}
                            className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition"
                          >
                            ⚡ Assign
                          </button>
                        )}
                        {ride.status === "UPCOMING" && (
                          <button
                            onClick={() => handleStart(ride.id)}
                            disabled={actionLoading === ride.id}
                            className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            {actionLoading === ride.id ? "..." : "▶ Start"}
                          </button>
                        )}
                        {ride.status === "ONGOING" && (
                          <button
                            onClick={() => handleComplete(ride.id)}
                            disabled={actionLoading === ride.id}
                            className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {actionLoading === ride.id ? "..." : "✅ Complete"}
                          </button>
                        )}
                        {ride.status === "COMPLETED" && (
                          <span className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          SECTION 4 - PENDING USER APPROVALS (secondary)
          ============================================================ */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            📋 User Registrations
            <span className="ml-2 text-sm font-normal text-slate-500">(approval queue)</span>
          </h3>
          <button
            onClick={() => router.push("/admin/drivers")}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
          >
            Manage All Users →
          </button>
        </div>

        {/* User status tabs */}
        <div className="px-5 py-3 border-b border-slate-100 flex gap-2">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setUserTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                userTab === t
                  ? t === "PENDING"
                    ? "bg-yellow-500 text-white"
                    : t === "APPROVED"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No {userTab.toLowerCase()} users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id}>
                {/* User summary row */}
                <div
                  className="flex flex-wrap items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.fullName}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                      {user.role}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.status === "APPROVED"
                        ? "bg-green-50 text-green-700"
                        : user.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {user.status}
                    </span>
                    {/* Approve/Reject quick actions */}
                    {user.status === "PENDING" && (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleReview(user.id, "APPROVE")}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReview(user.id, "REJECT")}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    <span className="text-slate-400">{expandedUser === user.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded user details */}
                {expandedUser === user.id && (
                  <div className="px-6 pb-4 border-t border-slate-100 pt-4 bg-slate-50/50">
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      {/* Personal info */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Personal Details</h4>
                        <div className="space-y-1">
                          <p><span className="text-slate-500">Phone:</span> {user.phone}</p>
                          <p><span className="text-slate-500">Registered:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* Driver details */}
                        {user.driverProfile && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-slate-900 mb-2">Driver Details</h4>
                            <div className="space-y-1">
                              <p><span className="text-slate-500">License No:</span> {user.driverProfile.licenseNumber}</p>
                              <p><span className="text-slate-500">Vehicle:</span> {user.driverProfile.vehicleType} - {user.driverProfile.vehicleNumber}</p>
                              <p><span className="text-slate-500">Model:</span> {user.driverProfile.vehicleModel} ({user.driverProfile.vehicleColor})</p>
                              <p><span className="text-slate-500">Address:</span> {user.driverProfile.address}, {user.driverProfile.city}</p>
                            </div>
                            {user.driverProfile.licenseFrontImage && (
                              <img
                                src={user.driverProfile.licenseFrontImage}
                                alt="License Front"
                                className="mt-2 h-16 w-24 object-cover rounded-lg border"
                              />
                            )}
                          </div>
                        )}

                        {/* Rider details */}
                        {user.riderProfile && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-slate-900 mb-2">Rider Details</h4>
                            <div className="space-y-1">
                              <p><span className="text-slate-500">Address:</span> {user.riderProfile.address}, {user.riderProfile.city}</p>
                              <p><span className="text-slate-500">Emergency:</span> {user.riderProfile.emergencyContactName} ({user.riderProfile.emergencyContactPhone})</p>
                            </div>
                          </div>
                        )}

                        {/* Hotel details */}
                        {user.hotelProfile && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-slate-900 mb-2">Hotel Details</h4>
                            <div className="space-y-1">
                              <p><span className="text-slate-500">Hotel:</span> {user.hotelProfile.hotelName}</p>
                              <p><span className="text-slate-500">License:</span> {user.hotelProfile.hotelLicenseNumber}</p>
                              <p><span className="text-slate-500">Address:</span> {user.hotelProfile.address}, {user.hotelProfile.city}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}
      {viewingRide && (
        <ViewRideModal ride={viewingRide} onClose={() => setViewingRide(null)} />
      )}

      {/* Logout */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

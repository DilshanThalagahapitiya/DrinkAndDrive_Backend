// ============================================================
// Admin Dashboard - Review & Manage Users
// ============================================================
// Shows pending registrations with detailed profile info:
//   - Drivers: license details + photos + vehicle info
//   - Riders: emergency contact
//   - Hotels: hotel details
// Admin can APPROVE or REJECT each registration.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminGetUsers, adminReviewUser, User } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Tab = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function AdminDashboard() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("PENDING");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Fetch users when filters change
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = tab === "ALL" ? undefined : tab;
      const role = roleFilter || undefined;
      const response = await adminGetUsers(role, status);
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [tab, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Approve or reject a user
  async function handleReview(userId: string, action: "APPROVE" | "REJECT") {
    setActionLoading(userId);
    setError("");
    try {
      await adminReviewUser(userId, action);
      // Refresh the list after review
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

  // Count users by status for summary cards
  const pendingCount = users.filter((u) => u.status === "PENDING").length;
  const approvedCount = users.filter((u) => u.status === "APPROVED").length;
  const rejectedCount = users.filter((u) => u.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-indigo-500">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* ---- Controls ---- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status tabs */}
        <div className="flex bg-white rounded-lg shadow-sm p-1">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="DRIVER">Drivers</option>
          <option value="RIDER">Riders</option>
          <option value="HOTEL">Hotels</option>
        </select>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
        >
          Logout
        </button>
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* ---- User List ---- */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">No users found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* User summary row */}
              <div
                className="flex flex-wrap items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                onClick={() =>
                  setExpandedUser(expandedUser === user.id ? null : user.id)
                }
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role badge */}
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                    {user.role}
                  </span>
                  {/* Status badge */}
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.status === "APPROVED"
                        ? "bg-green-50 text-green-700"
                        : user.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {user.status}
                  </span>
                  <span className="text-slate-400">{expandedUser === user.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedUser === user.id && (
                <div className="px-6 pb-4 border-t border-slate-100 pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Personal info */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Personal Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-slate-500">Phone:</span> {user.phone}</p>
                        <p><span className="text-slate-500">Registered:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>

                      {/* Driver details */}
                      {user.driverProfile && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-slate-900 mb-2">Driver Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-slate-500">License No:</span> {user.driverProfile.licenseNumber}</p>
                            <p><span className="text-slate-500">Vehicle:</span> {user.driverProfile.vehicleType} - {user.driverProfile.vehicleNumber}</p>
                            <p><span className="text-slate-500">Model:</span> {user.driverProfile.vehicleModel} ({user.driverProfile.vehicleColor})</p>
                            <p><span className="text-slate-500">Address:</span> {user.driverProfile.address}, {user.driverProfile.city}</p>
                          </div>
                          {/* License images */}
                          <div className="flex gap-3 mt-3">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">License Front</p>
                              <img
                                src={user.driverProfile.licenseFrontImage}
                                alt="License Front"
                                className="h-20 w-32 object-cover rounded-lg border"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">License Back</p>
                              <img
                                src={user.driverProfile.licenseBackImage}
                                alt="License Back"
                                className="h-20 w-32 object-cover rounded-lg border"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rider details */}
                      {user.riderProfile && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-slate-900 mb-2">Rider Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-slate-500">Address:</span> {user.riderProfile.address}, {user.riderProfile.city}</p>
                            <p><span className="text-slate-500">Emergency Contact:</span> {user.riderProfile.emergencyContactName} ({user.riderProfile.emergencyContactPhone})</p>
                          </div>
                        </div>
                      )}

                      {/* Hotel details */}
                      {user.hotelProfile && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-slate-900 mb-2">Hotel Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-slate-500">Hotel:</span> {user.hotelProfile.hotelName}</p>
                            <p><span className="text-slate-500">License:</span> {user.hotelProfile.hotelLicenseNumber}</p>
                            <p><span className="text-slate-500">Address:</span> {user.hotelProfile.address}, {user.hotelProfile.city}</p>
                            <p><span className="text-slate-500">Contact:</span> {user.hotelProfile.contactPhone} / {user.hotelProfile.contactEmail}</p>
                          </div>
                          {user.hotelProfile.hotelImage && (
                            <img
                              src={user.hotelProfile.hotelImage}
                              alt="Hotel"
                              className="mt-2 h-20 w-32 object-cover rounded-lg border"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review actions */}
                  {user.status === "PENDING" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleReview(user.id, "APPROVE")}
                        disabled={actionLoading === user.id}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReview(user.id, "REJECT")}
                        disabled={actionLoading === user.id}
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
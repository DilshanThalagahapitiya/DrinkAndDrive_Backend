"use client";

import { useState, useEffect, useCallback } from "react";
import { adminGetUsers, adminUpdateUser, adminDeleteUser, adminReviewUser, User } from "@/lib/api";
import EditUserModal from "./EditUserModal";
import AddUserModal from "./AddUserModal";
import ViewUserModal from "./ViewUserModal";

interface UsersTableProps {
  role: "DRIVER" | "RIDER" | "HOTEL" | "CUSTOMER";
  title: string;
  icon: string;
}

export default function UsersTable({ role, title, icon }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");
  // Confirmation for approve/un-approve actions
  const [confirmAction, setConfirmAction] = useState<{
    user: User;
    action: "APPROVE" | "UNAPPROVE";
  } | null>(null);
  // Practical test state for driver approval
  const [practicalPassed, setPracticalPassed] = useState<boolean | null>(null);
  const [practicalDate, setPracticalDate] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminGetUsers(role, statusFilter || undefined, search || undefined);
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [role, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleSave(userId: string, data: Record<string, unknown>) {
    await adminUpdateUser(userId, data);
    showSuccess("User updated successfully!");
    await fetchUsers();
  }

  async function handleDeleteConfirm() {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      await adminDeleteUser(deletingUser.id);
      showSuccess(`${deletingUser.fullName} has been deleted.`);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReview(userId: string, action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    try {
      await adminReviewUser(userId, action);
      showSuccess(`User ${action.toLowerCase()}d successfully!`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  }

  // Confirm and execute approve/un-approve
  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      // For driver approvals: practical test must be passed
      const isDriver = confirmAction.user.role === "DRIVER";
      const isApprove = confirmAction.action === "APPROVE";

      if (isDriver && isApprove) {
        if (practicalPassed === null) {
          setError("Please select whether the driver passed the practical test.");
          setActionLoading(false);
          return;
        }
        if (!practicalPassed) {
          setError("Driver cannot be approved - practical test not passed.");
          setActionLoading(false);
          return;
        }
      }

      // APPROVE -> approve the user
      // UNAPPROVE -> set back to PENDING
      const actionForApi = confirmAction.action === "APPROVE" ? "APPROVE" : "REJECT";

      // Pass practical test data for driver approvals
      const practicalData =
        isDriver && isApprove
          ? { practicalTestPassed: true, practicalTestPassedDate: practicalDate || new Date().toISOString().split("T")[0] }
          : undefined;

      await adminReviewUser(confirmAction.user.id, actionForApi, practicalData);

      // If un-approving, set status to PENDING (not REJECTED)
      if (confirmAction.action === "UNAPPROVE") {
        // Use update API to set back to PENDING
        const { adminUpdateUser } = await import("@/lib/api");
        await adminUpdateUser(confirmAction.user.id, { status: "PENDING" });
      }

      showSuccess(
        confirmAction.action === "APPROVE"
          ? `${confirmAction.user.fullName} has been approved!`
          : `${confirmAction.user.fullName} has been un-approved (set back to pending).`
      );
      setConfirmAction(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  }

  function statusBadge(status: string) {
    const styles =
      status === "APPROVED"
        ? "bg-green-50 text-green-700"
        : status === "REJECTED"
        ? "bg-red-50 text-red-700"
        : "bg-yellow-50 text-yellow-700";
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles}`}>{status}</span>;
  }

  const inputClass =
    "px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-4">
      {/* Header + Search + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">
          {icon} {title}
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({users.length} {users.length === 1 ? "user" : "users"})
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`🔍 Search ${title.toLowerCase()}...`}
            className={`${inputClass} w-64`}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            + Add {title}
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">✅ {success}</div>
      )}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
      )}

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">
            No {title.toLowerCase()} found{search ? ` matching "${search}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                {role === "DRIVER" && (
                  <>
                    <th className="px-4 py-3 font-semibold">License No</th>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                  </>
                )}
                {role === "RIDER" && (
                  <>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Emergency Contact</th>
                  </>
                )}
                {role === "HOTEL" && (
                  <>
                    <th className="px-4 py-3 font-semibold">Hotel Name</th>
                    <th className="px-4 py-3 font-semibold">License No</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                  </>
                )}
                {role === "CUSTOMER" && (
                  <>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Vehicle No</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                  </>
                )}
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setViewingUser(user)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      {user.fullName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.phone}</td>
                  {role === "DRIVER" && user.driverProfile && (
                    <>
                      <td className="px-4 py-3 text-slate-600">{user.driverProfile.licenseNumber}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {/* Vehicle type + license type + gear badges */}
                        <div className="flex flex-wrap gap-1">
                          {user.driverProfile.vehicleType
                            .split(",")
                            .filter(Boolean)
                            .map((t: string) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full"
                              >
                                {t}
                              </span>
                            ))}
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
                            {user.driverProfile.licenseCategory}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                            ⚙️ {user.driverProfile.preferredGear}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.driverProfile.city}</td>
                    </>
                  )}
                  {role === "RIDER" && user.riderProfile && (
                    <>
                      <td className="px-4 py-3 text-slate-600">{user.riderProfile.address}</td>
                      <td className="px-4 py-3 text-slate-600">{user.riderProfile.city}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.riderProfile.emergencyContactName} ({user.riderProfile.emergencyContactPhone})
                      </td>
                    </>
                  )}
                  {role === "HOTEL" && user.hotelProfile && (
                    <>
                      <td className="px-4 py-3 text-slate-600">{user.hotelProfile.hotelName}</td>
                      <td className="px-4 py-3 text-slate-600">{user.hotelProfile.hotelLicenseNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{user.hotelProfile.city}</td>
                    </>
                  )}
                  {role === "CUSTOMER" && user.customerProfile && (
                    <>
                      <td className="px-4 py-3 text-slate-600">{user.customerProfile.vehicleType}</td>
                      <td className="px-4 py-3 text-slate-600">{user.customerProfile.vehicleNumber}</td>
                      <td className="px-4 py-3 text-slate-600">📍 {user.customerProfile.location}</td>
                    </>
                  )}
                  <td className="px-4 py-3">{statusBadge(user.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {user.status === "PENDING" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show confirmation before approving
                            setConfirmAction({ user, action: "APPROVE" });
                          }}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition disabled:opacity-50"
                          title="Approve"
                        >
                          ✅
                        </button>
                      )}
                      {user.status === "APPROVED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show confirmation before un-approving
                            setConfirmAction({ user, action: "UNAPPROVE" });
                          }}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-200 transition disabled:opacity-50"
                          title="Un-approve (set back to pending)"
                        >
                          ↩️
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUser(user);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingUser(user);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-red-100 hover:text-red-700 transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View User Modal (click on row) */}
      {viewingUser && (
        <ViewUserModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <AddUserModal
          role={role}
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            showSuccess(`${title} registered successfully!`);
            await fetchUsers();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />
      )}

      {/* Approve/Un-approve Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {confirmAction.action === "APPROVE" ? "✅ Approve User?" : "↩️ Un-approve User?"}
            </h3>

            {/* Practical test step for driver approvals */}
            {confirmAction.action === "APPROVE" && confirmAction.user.role === "DRIVER" && (
              <div className="mb-4 border-t border-slate-100 pt-3">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  🚗 Practical Test Status
                </p>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPracticalPassed(true)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                      practicalPassed === true
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-green-400"
                    }`}
                  >
                    ✅ Passed
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticalPassed(false)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                      practicalPassed === false
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-red-400"
                    }`}
                  >
                    ❌ Not Passed
                  </button>
                </div>
                {practicalPassed === true && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Passed Date
                    </label>
                    <input
                      type="date"
                      value={practicalDate}
                      onChange={(e) => setPracticalDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {practicalPassed === false && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                    Driver cannot be approved until the practical test is passed.
                  </p>
                )}
              </div>
            )}

            <p className="text-sm text-slate-600 mb-6">
              {confirmAction.action === "APPROVE" ? (
                <>
                  Are you sure you want to approve{" "}
                  <span className="font-semibold">{confirmAction.user.fullName}</span>?
                  This will allow them to use the app.
                </>
              ) : (
                <>
                  Are you sure you want to un-approve{" "}
                  <span className="font-semibold">{confirmAction.user.fullName}</span>?
                  Their status will be set back to <span className="font-semibold">PENDING</span>.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-6 py-2.5 text-white font-semibold rounded-lg transition disabled:opacity-50 ${
                  confirmAction.action === "APPROVE"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : confirmAction.action === "APPROVE"
                  ? "Yes, Approve"
                  : "Yes, Un-approve"}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete User?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deletingUser.fullName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeletingUser(null)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
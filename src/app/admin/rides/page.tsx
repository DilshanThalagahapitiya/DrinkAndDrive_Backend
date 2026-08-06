"use client";

import { useState, useEffect, useCallback } from "react";
import { adminGetRides, adminCompleteRide, adminStartRide, adminDeleteRide, Ride } from "@/lib/api";
import AddRideModal from "@/components/AddRideModal";
import ViewRideModal from "@/components/ViewRideModal";
import EditRideModal from "@/components/EditRideModal";

type Tab = "UPCOMING" | "ONGOING" | "COMPLETED";

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ONGOING");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingRide, setViewingRide] = useState<Ride | null>(null);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [deletingRide, setDeletingRide] = useState<Ride | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const statusFilter = tab === "COMPLETED" ? "COMPLETED" : tab === "UPCOMING" ? "PENDING_REQUEST,ASSIGNED,UPCOMING" : "ONGOING";
      const response = await adminGetRides(statusFilter);
      setRides(response.data.rides);
    } catch (err: any) {
      setError(err.message || "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  async function handleStart(rideId: string) {
    setActionLoading(rideId);
    setError("");
    try {
      await adminStartRide(rideId);
      setSuccess("Ride started successfully!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchRides();
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
      await fetchRides();
    } catch (err: any) {
      setError(err.message || "Failed to complete ride");
    } finally {
      setActionLoading(null);
    }
  }

  // Delete ride
  async function handleDeleteConfirm() {
    if (!deletingRide) return;
    setActionLoading(deletingRide.id);
    setError("");
    try {
      await adminDeleteRide(deletingRide.id);
      setSuccess("Ride deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      setDeletingRide(null);
      await fetchRides();
    } catch (err: any) {
      setError(err.message || "Failed to delete ride");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          🚙 Ride Details
          <span className="ml-2 text-sm font-normal text-slate-500">({rides.length} rides)</span>
        </h2>
        <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
          ➕ Set Ride
        </button>
      </div>

      <div className="flex bg-white rounded-lg shadow-sm p-1 w-fit">
        {(["ONGOING", "UPCOMING", "COMPLETED"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {t === "ONGOING" ? "🟢 Ongoing Rides" : t === "UPCOMING" ? "🗓️ Upcoming Rides" : "✅ Completed Rides"}
          </button>
        ))}
      </div>

      {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">✅ {success}</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500">No rides found in this section.</p>
          <p className="text-sm text-slate-400 mt-1">Click "+ Set Ride" to create a new ride.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Driver</th>
                <th className="px-4 py-3 font-semibold">Rider</th>
                <th className="px-4 py-3 font-semibold">Pickup</th>
                <th className="px-4 py-3 font-semibold">Drop</th>
                <th className="px-4 py-3 font-semibold">Special Note</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((ride, idx) => (
                <tr key={ride.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setViewingRide(ride)}>
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">{ride.driver?.fullName?.charAt(0) || "?"}</div>
                      {ride.driver?.fullName || "N/A"}
                    </div>
                    <span className="text-xs text-slate-400">{ride.driver?.phone}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">{ride.rider?.fullName?.charAt(0) || "?"}</div>
                      {ride.rider?.fullName || "N/A"}
                    </div>
                    <span className="text-xs text-slate-400">{ride.rider?.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">📍 {ride.pickupLocation}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">📍 {ride.dropLocation}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{ride.specialNote || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ride.status === "COMPLETED" ? "bg-green-50 text-green-700" : ride.status === "ONGOING" ? "bg-yellow-50 text-yellow-700" : ride.status === "ASSIGNED" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>
                        {ride.status}
                      </span>
                      {/* Cancelled badges — show who cancelled + need for re-assignment */}
                      {ride.driverCancelled === true && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-300">
                          🚗 Driver Cancelled — re-select driver
                        </span>
                      )}
                      {ride.riderCancelled === true && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-300">
                          🙋 Rider Cancelled — re-select rider
                        </span>
                      )}
                      {/* Acceptance status badges in status column */}
                      {ride.driverAccepted === true && ride.riderAccepted === true && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">✅ Ready</span>
                      )}
                      {ride.driverAccepted === true && ride.riderAccepted !== true && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-300">🚗 Driver Accepted</span>
                      )}
                      {ride.riderAccepted === true && ride.driverAccepted !== true && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-300">🙋 Rider Accepted</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Edit button - lets admin assign driver/rider to PENDING_REQUEST rides */}
                      <button
                        onClick={() => setEditingRide(ride)}
                        className="px-2.5 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition"
                        title="Edit / Assign"
                      >
                        ✏️
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => setDeletingRide(ride)}
                        className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition"
                        title="Delete ride"
                      >
                        🗑️
                      </button>
                      {ride.status === "UPCOMING" && (
                        <button onClick={() => handleStart(ride.id)} disabled={actionLoading === ride.id} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                          {actionLoading === ride.id ? "..." : "▶ Start Ride"}
                        </button>
                      )}
                      {ride.status === "ONGOING" && (
                        <button onClick={() => handleComplete(ride.id)} disabled={actionLoading === ride.id} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50">
                          {actionLoading === ride.id ? "..." : "✅ Complete"}
                        </button>
                      )}
                      {ride.status === "PENDING_REQUEST" && (
                        <button onClick={() => setEditingRide(ride)} disabled={actionLoading === ride.id} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition">
                          ⚡ Assign
                        </button>
                      )}
                      {ride.status === "COMPLETED" && (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold">✓ Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddRideModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            setSuccess("Ride created successfully!");
            setTimeout(() => setSuccess(""), 3000);
            await fetchRides();
          }}
        />
      )}

      {viewingRide && (
        <ViewRideModal ride={viewingRide} onClose={() => setViewingRide(null)} />
      )}

      {editingRide && (
        <EditRideModal
          ride={editingRide}
          onClose={() => setEditingRide(null)}
          onSuccess={async () => {
            setSuccess("Ride updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
            await fetchRides();
          }}
        />
      )}

      {deletingRide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Ride?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this ride from{" "}
              <span className="font-semibold">{deletingRide.pickupLocation}</span> to{" "}
              <span className="font-semibold">{deletingRide.dropLocation}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading === deletingRide.id}
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {actionLoading === deletingRide.id ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeletingRide(null)}
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
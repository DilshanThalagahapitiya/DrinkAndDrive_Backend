// ============================================================
// EditRideModal - Admin: Assign Driver/Rider to Pending Request
// ============================================================
// For PENDING_REQUEST rides: admin fills the empty fields
// (driver, rider, location, time, notes). Once driver + rider
// assigned, the ride moves to UPCOMING.
// ============================================================

"use client";

import { useState, FormEvent, useEffect } from "react";
import { adminGetUsers, adminUpdateRide, Ride, User } from "@/lib/api";

interface EditRideModalProps {
  ride: Ride;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function EditRideModal({ ride, onClose, onSuccess }: EditRideModalProps) {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [driverId, setDriverId] = useState(ride.driverId || "");
  const [riderId, setRiderId] = useState(ride.riderId || "");
  const [pickupLocation, setPickupLocation] = useState(ride.pickupLocation);
  const [dropLocation, setDropLocation] = useState(ride.dropLocation);
  const [startTime, setStartTime] = useState(
    ride.startTime ? new Date(ride.startTime).toISOString().slice(0, 16) : ""
  );
  const [specialNote, setSpecialNote] = useState(ride.specialNote || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  useEffect(() => {
    async function loadLists() {
      try {
        const [driversRes, ridersRes] = await Promise.all([
          adminGetUsers("DRIVER", "APPROVED"),
          adminGetUsers("RIDER", "APPROVED"),
        ]);
        setDrivers(driversRes.data.users);
        setRiders(ridersRes.data.users);
      } catch (err: any) {
        setError(err.message || "Failed to load drivers and riders");
      }
    }
    loadLists();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminUpdateRide(ride.id, {
        driverId: driverId || undefined,
        riderId: riderId || undefined,
        pickupLocation: pickupLocation || undefined,
        dropLocation: dropLocation || undefined,
        startTime: startTime || undefined,
        specialNote: specialNote || undefined,
      });
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update ride");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">✏️ Edit Ride</h2>
            <p className="text-xs text-slate-500">
              Customer: {ride.customerName} • {ride.customerNumber}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

          {/* Assigned customer info (auto-filled, read-only display) */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1">👤 Customer Details (Auto-filled)</p>
            <p className="text-xs text-slate-700">🚘 {ride.vehicleType} • ⚙️ {ride.transmission}</p>
          </div>

          {/* Driver assignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Driver</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputClass}>
              <option value="">-- Select Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.fullName} ({d.phone})</option>
              ))}
            </select>
          </div>

          {/* Rider assignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Rider</label>
            <select value={riderId} onChange={(e) => setRiderId(e.target.value)} className={inputClass}>
              <option value="">-- Select Rider --</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>{r.fullName} ({r.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Location</label>
            <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Drop Location</label>
            <input type="text" value={dropLocation} onChange={(e) => setDropLocation(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Special Note</label>
            <textarea value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} rows={2} className={inputClass} />
          </div>

          {driverId && riderId && (
            <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
              ✅ Both driver and rider assigned — ride will move to UPCOMING.
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
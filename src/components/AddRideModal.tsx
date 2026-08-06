"use client";

import { useState, FormEvent, useEffect } from "react";
import { adminGetUsers, adminCreateRide, User, Ride } from "@/lib/api";

interface AddRideModalProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

// Ride summary view with print/PDF support (shown after creation)
function RideSummary({ ride, onDone }: { ride: Ride; onDone: () => void }) {
  const formatDate = (d: string) => new Date(d).toLocaleString();

  const handleSharePdf = () => {
    // Use browser print dialog -> "Save as PDF" option
    window.print();
  };

  const handleShareSocial = async () => {
    const summary = `🚗 DAD Ride Details\n\n👤 Driver: ${ride.driver?.fullName}\n🙋 Rider: ${ride.rider?.fullName}\n📍 Pickup: ${ride.pickupLocation}\n📍 Drop: ${ride.dropLocation}\n🕐 Time: ${formatDate(ride.startTime)}${ride.customerName ? `\n👤 Customer: ${ride.customerName}` : ""}${ride.customerNumber ? `\n📞 Customer No: ${ride.customerNumber}` : ""}${ride.vehicleType ? `\n🚘 Vehicle: ${ride.vehicleType}` : ""}${ride.transmission ? `\n⚙️ Transmission: ${ride.transmission}` : ""}${ride.specialNote ? `\n📝 Notes: ${ride.specialNote}` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "DAD Ride Details", text: summary });
      } else {
        await navigator.clipboard.writeText(summary);
        alert("Ride summary copied to clipboard! You can paste it anywhere.");
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">🎉 Ride Created Successfully!</h2>
          <button onClick={onDone} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
        </div>

        {/* Printable ride summary */}
        <div id="ride-summary" className="p-6">
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">✅</div>
            <h3 className="font-bold text-slate-900 text-lg">DAD Ride Summary</h3>
            <p className="text-xs text-slate-400">Drink and Drive • Ride Confirmation</p>
          </div>

          {/* General details */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b pb-1">General Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">🚗 Driver</span><span className="font-semibold text-slate-900">{ride.driver?.fullName} ({ride.driver?.phone})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">🙋 Rider</span><span className="font-semibold text-slate-900">{ride.rider?.fullName} ({ride.rider?.phone})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📍 Pickup</span><span className="font-semibold text-slate-900">{ride.pickupLocation}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">🕐 Pickup Time</span><span className="font-semibold text-slate-900">{formatDate(ride.startTime)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📍 Drop</span><span className="font-semibold text-slate-900">{ride.dropLocation}</span></div>
            </div>
          </div>

          {/* Customer details */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 border-b pb-1">Customer Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">👤 Name</span><span className="font-semibold text-slate-900">{ride.customerName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📞 Number</span><span className="font-semibold text-slate-900">{ride.customerNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">🚘 Vehicle</span><span className="font-semibold text-slate-900">{ride.vehicleType || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">⚙️ Transmission</span><span className="font-semibold text-slate-900">{ride.transmission || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📝 Notes</span><span className="font-semibold text-slate-900">{ride.specialNote || "—"}</span></div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2">
          <button onClick={handleSharePdf} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
            📄 Save as PDF
          </button>
          <button onClick={handleShareSocial} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
            📤 Share
          </button>
          <button onClick={onDone} className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddRideModal({ onClose, onSuccess }: AddRideModalProps) {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // General details
  const [driverId, setDriverId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  // Coordinates for route drawing (from MapPicker onLocationChange)
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropLat, setDropLat] = useState<number | null>(null);
  const [dropLng, setDropLng] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [transmission, setTransmission] = useState("AUTO");
  const [specialNote, setSpecialNote] = useState("");

  // Summary state
  const [createdRide, setCreatedRide] = useState<Ride | null>(null);

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
      } finally {
        setLoadingLists(false);
      }
    }
    loadLists();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await adminCreateRide({
        driverId,
        riderId,
        pickupLocation,
        dropLocation,
        startTime,
        pickupLatitude: pickupLat ?? undefined,
        pickupLongitude: pickupLng ?? undefined,
        dropLatitude: dropLat ?? undefined,
        dropLongitude: dropLng ?? undefined,
        customerName: customerName || undefined,
        customerNumber: customerNumber || undefined,
        vehicleType: vehicleType || undefined,
        transmission,
        specialNote: specialNote || undefined,
      });
      // Show summary instead of just closing
      setCreatedRide(res.data.ride);
      await onSuccess();
      setSaving(false);
    } catch (err: any) {
      setError(err.message || "Failed to create ride");
      setSaving(false);
    }
  }

  // If ride was created, show summary modal
  if (createdRide) {
    return <RideSummary ride={createdRide} onDone={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">➕ Set Ride</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

          {loadingLists ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* GENERAL DETAILS */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">General Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Driver *</label>
                    <select value={driverId} onChange={(e) => setDriverId(e.target.value)} required className={inputClass}>
                      <option value="">Select a driver...</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.fullName} ({d.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rider *</label>
                    <select value={riderId} onChange={(e) => setRiderId(e.target.value)} required className={inputClass}>
                      <option value="">Select a rider...</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>{r.fullName} ({r.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pick Up Location *</label>
                    <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required placeholder="Type pickup location manually e.g. Colombo 07" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pick Up Time *</label>
                    <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Drop Location *</label>
                    <input type="text" value={dropLocation} onChange={(e) => setDropLocation(e.target.value)} required placeholder="Type drop location manually e.g. Galle" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* CUSTOMER DETAILS */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Customer Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Number</label>
                    <input type="tel" value={customerNumber} onChange={(e) => setCustomerNumber(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                    <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. Toyota Prius" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transmission</label>
                    <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={inputClass}>
                      <option value="AUTO">Auto</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Special Notes</label>
                    <textarea value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} rows={2} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {saving ? "Creating..." : "OK"}
                </button>
                <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">Cancel</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
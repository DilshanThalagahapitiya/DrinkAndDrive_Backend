// ============================================================
// EditUserModal - Admin: Edit User Details
// ============================================================
// A shared modal for editing driver, rider, or hotel details.
// Dynamically shows fields based on the user's role.
// ============================================================

"use client";

import { useState, FormEvent } from "react";
import { User } from "@/lib/api";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, data: Record<string, unknown>) => Promise<void>;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  // ---- Basic fields (all roles) ----
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [status, setStatus] = useState(user.status);

  // ---- Driver fields ----
  const [licenseNumber, setLicenseNumber] = useState(user.driverProfile?.licenseNumber || "");
  // License category (LIGHT_WEIGHT | HEAVY | BOTH)
  const [licenseCategory, setLicenseCategory] = useState(
    user.driverProfile?.licenseCategory || "LIGHT_WEIGHT"
  );
  const [lightExpiry, setLightExpiry] = useState(
    user.driverProfile?.licenseLightExpiryDate
      ? new Date(user.driverProfile.licenseLightExpiryDate).toISOString().split("T")[0]
      : ""
  );
  const [heavyExpiry, setHeavyExpiry] = useState(
    user.driverProfile?.licenseHeavyExpiryDate
      ? new Date(user.driverProfile.licenseHeavyExpiryDate).toISOString().split("T")[0]
      : ""
  );
  const [vehicleType, setVehicleType] = useState(user.driverProfile?.vehicleType || "CAR");
  const [preferredGear, setPreferredGear] = useState(user.driverProfile?.preferredGear || "AUTO");
  const [specialNote, setSpecialNote] = useState(user.driverProfile?.specialNote || "");
  const [driverAddress, setDriverAddress] = useState(user.driverProfile?.address || "");
  const [driverCity, setDriverCity] = useState(user.driverProfile?.city || "");
  // Personal details
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [initials, setInitials] = useState(user.initials || "");
  const [dob, setDob] = useState(
    user.dob ? new Date(user.dob).toISOString().split("T")[0] : ""
  );
  const [nic, setNic] = useState(user.nic || "");

  // ---- Rider fields ----
  const [riderAddress, setRiderAddress] = useState(user.riderProfile?.address || "");
  const [riderCity, setRiderCity] = useState(user.riderProfile?.city || "");
  const [emergencyContactName, setEmergencyContactName] = useState(
    user.riderProfile?.emergencyContactName || ""
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    user.riderProfile?.emergencyContactPhone || ""
  );

  // ---- Hotel fields ----
  const [hotelName, setHotelName] = useState(user.hotelProfile?.hotelName || "");
  const [hotelLicenseNumber, setHotelLicenseNumber] = useState(
    user.hotelProfile?.hotelLicenseNumber || ""
  );
  const [hotelAddress, setHotelAddress] = useState(user.hotelProfile?.address || "");
  const [hotelCity, setHotelCity] = useState(user.hotelProfile?.city || "");
  const [hotelPhone, setHotelPhone] = useState(user.hotelProfile?.contactPhone || "");
  const [hotelEmail, setHotelEmail] = useState(user.hotelProfile?.contactEmail || "");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Build the update payload based on role
      const data: Record<string, unknown> = {
        fullName,
        email,
        phone,
        status,
      };

      if (user.role === "DRIVER") {
        Object.assign(data, {
          firstName,
          lastName,
          initials,
          dob: dob || undefined,
          nic,
          licenseNumber,
          licenseCategory,
          licenseLightExpiryDate: licenseCategory !== "HEAVY" ? lightExpiry : undefined,
          licenseHeavyExpiryDate: licenseCategory !== "LIGHT_WEIGHT" ? heavyExpiry : undefined,
          vehicleType,
          preferredGear,
          specialNote,
          address: driverAddress,
          city: driverCity,
        });
      } else if (user.role === "RIDER") {
        Object.assign(data, {
          address: riderAddress,
          city: riderCity,
          emergencyContactName,
          emergencyContactPhone,
        });
      } else if (user.role === "HOTEL") {
        Object.assign(data, {
          hotelName,
          hotelLicenseNumber,
          address: hotelAddress,
          city: hotelCity,
          contactPhone: hotelPhone,
          contactEmail: hotelEmail,
        });
      }

      await onSave(user.id, data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
      setSaving(false);
    }
  }

  // Common input styling
  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Edit {user.role === "DRIVER" ? "Driver" : user.role === "RIDER" ? "Rider" : "Hotel"} - {user.fullName}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* ---- Basic Details ---- */}
          <h3 className="font-semibold text-slate-900 pt-2 border-t border-slate-200">Basic Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className={inputClass}
              >
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {/* ---- Driver Fields ---- */}
          {user.role === "DRIVER" && (
            <>
              <h3 className="font-semibold text-slate-900 pt-2 border-t border-slate-200">Driver Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="CAR">🚗 Car</option>
                    <option value="VAN">🚐 Van</option>
                    <option value="LORRY">🚛 Lorry</option>
                    <option value="BUS">🚌 Bus</option>
                    <option value="BIKE">🏍️ Motor Bike</option>
                    <option value="TUKTUK">🛺 Three Wheeler</option>
                    <option value="SUV">🚙 SUV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Category</label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    className={inputClass}
                  >
                    <option value="LIGHT_WEIGHT">Light Weight</option>
                    <option value="HEAVY">Heavy</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                {licenseCategory !== "HEAVY" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Light License Expiry</label>
                    <input
                      type="date"
                      value={lightExpiry}
                      onChange={(e) => setLightExpiry(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                )}
                {licenseCategory !== "LIGHT_WEIGHT" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Heavy License Expiry</label>
                    <input
                      type="date"
                      value={heavyExpiry}
                      onChange={(e) => setHeavyExpiry(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Gear Type</label>
                  <select
                    value={preferredGear}
                    onChange={(e) => setPreferredGear(e.target.value)}
                    className={inputClass}
                  >
                    <option value="AUTO">⚙️ Auto</option>
                    <option value="MANUAL">⚙️ Manual</option>
                    <option value="BOTH">⚙️ Both</option>
                  </select>
                </div>
              </div>

              {/* Special Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Special Note (Optional)</label>
                <textarea
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Available only on weekends, prefer night driving, etc."
                  className={inputClass}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={driverAddress}
                    onChange={(e) => setDriverAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={driverCity}
                    onChange={(e) => setDriverCity(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* ---- Rider Fields ---- */}
          {user.role === "RIDER" && (
            <>
              <h3 className="font-semibold text-slate-900 pt-2 border-t border-slate-200">Rider Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={riderAddress}
                    onChange={(e) => setRiderAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={riderCity}
                    onChange={(e) => setRiderCity(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* ---- Hotel Fields ---- */}
          {user.role === "HOTEL" && (
            <>
              <h3 className="font-semibold text-slate-900 pt-2 border-t border-slate-200">Hotel Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Name</label>
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel License No</label>
                  <input
                    type="text"
                    value={hotelLicenseNumber}
                    onChange={(e) => setHotelLicenseNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={hotelPhone}
                    onChange={(e) => setHotelPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={hotelEmail}
                    onChange={(e) => setHotelEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          {/* ---- Buttons ---- */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
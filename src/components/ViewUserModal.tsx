// ============================================================
// ViewUserModal - Admin: View User Full Details
// ============================================================
// Opens when clicking on a table row.
// Shows complete details including role-specific profile,
// license images, emergency contacts, etc.
// ============================================================

"use client";

import { User } from "@/lib/api";

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

export default function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user.fullName}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ---- Status & Role Badges ---- */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
              {user.role}
            </span>
            {user.tempPassword && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-300">
                🔑 Temp: {user.tempPassword}
              </span>
            )}
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
          </div>

          {/* ---- Personal Details ---- */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
              Personal Details
            </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Full Name</p>
                  <p className="font-medium text-slate-900">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Initials</p>
                  <p className="font-medium text-slate-900">{user.initials || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Date of Birth</p>
                  <p className="font-medium text-slate-900">
                    {user.dob ? new Date(user.dob).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">NIC</p>
                  <p className="font-medium text-slate-900">{user.nic || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Phone</p>
                  <p className="font-medium text-slate-900">{user.phone}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Email</p>
                  <p className="font-medium text-slate-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Registered</p>
                  <p className="font-medium text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {user.tempPassword && (
                  <div>
                    <p className="text-slate-500 text-xs">Temporary Password</p>
                    <p className="font-medium text-amber-700 font-mono">{user.tempPassword}</p>
                  </div>
                )}
              </div>
          </div>

          {/* ---- Driver Profile ---- */}
          {user.driverProfile && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Driver Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">License Number</p>
                  <p className="font-medium text-slate-900">{user.driverProfile.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Vehicle Types</p>
                  <p className="font-medium text-slate-900">
                    {user.driverProfile.vehicleType
                      .split(",")
                      .filter(Boolean)
                      .map((t: string) => (
                        <span
                          key={t}
                          className="inline-block mr-1 mb-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">License Category</p>
                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                    {user.driverProfile.licenseCategory}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Preferred Gear</p>
                  <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
                    ⚙️ {user.driverProfile.preferredGear}
                  </span>
                </div>
                {user.driverProfile.licenseLightExpiryDate && (
                  <div>
                    <p className="text-slate-500 text-xs">Light License Expiry</p>
                    <p className="font-medium text-slate-900">
                      {new Date(user.driverProfile.licenseLightExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {user.driverProfile.licenseHeavyExpiryDate && (
                  <div>
                    <p className="text-slate-500 text-xs">Heavy License Expiry</p>
                    <p className="font-medium text-slate-900">
                      {new Date(user.driverProfile.licenseHeavyExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs">Practical Test</p>
                  {user.driverProfile.practicalTestPassed ? (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✅ Passed {user.driverProfile.practicalTestPassedDate
                        ? `(${new Date(user.driverProfile.practicalTestPassedDate).toLocaleDateString()})`
                        : ""}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      ❌ Not Tested
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Special Note</p>
                  <p className="font-medium text-slate-900">
                    {user.driverProfile.specialNote || "No special note"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Address</p>
                  <p className="font-medium text-slate-900">
                    {user.driverProfile.address}, {user.driverProfile.city}
                  </p>
                </div>
              </div>

              {/* License images */}
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">License Front</p>
                  <img
                    src={user.driverProfile.licenseFrontImage}
                    alt="License Front"
                    className="h-28 w-44 object-cover rounded-lg border"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">License Back</p>
                  <img
                    src={user.driverProfile.licenseBackImage}
                    alt="License Back"
                    className="h-28 w-44 object-cover rounded-lg border"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- Rider Profile ---- */}
          {user.riderProfile && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Rider Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Home Address</p>
                  <p className="font-medium text-slate-900">
                    {user.riderProfile.address}, {user.riderProfile.city}
                  </p>
                </div>
                {user.riderProfile.licenseNumber && (
                  <div>
                    <p className="text-slate-500 text-xs">License Number</p>
                    <p className="font-medium text-slate-900">{user.riderProfile.licenseNumber}</p>
                  </div>
                )}
                {user.riderProfile.idNumber && (
                  <div>
                    <p className="text-slate-500 text-xs">ID Number</p>
                    <p className="font-medium text-slate-900">{user.riderProfile.idNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs">Emergency Contact Name</p>
                  <p className="font-medium text-slate-900">{user.riderProfile.emergencyContactName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Emergency Contact Phone</p>
                  <p className="font-medium text-slate-900">{user.riderProfile.emergencyContactPhone}</p>
                </div>
              </div>
            </div>
          )}

          {/* ---- Customer Profile ---- */}
          {user.customerProfile && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Location</p>
                  <p className="font-medium text-slate-900">📍 {user.customerProfile.location}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Vehicle</p>
                  <p className="font-medium text-slate-900">{user.customerProfile.vehicleType}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Transmission</p>
                  <p className="font-medium text-slate-900">⚙️ {user.customerProfile.transmission}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Vehicle Number</p>
                  <p className="font-medium text-slate-900">{user.customerProfile.vehicleNumber}</p>
                </div>
                {user.customerProfile.specialNote && (
                  <div>
                    <p className="text-slate-500 text-xs">Special Note</p>
                    <p className="font-medium text-slate-900">{user.customerProfile.specialNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- Hotel Profile ---- */}
          {user.hotelProfile && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Hotel Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Hotel Name</p>
                  <p className="font-medium text-slate-900">{user.hotelProfile.hotelName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Hotel License Number</p>
                  <p className="font-medium text-slate-900">{user.hotelProfile.hotelLicenseNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">Address</p>
                  <p className="font-medium text-slate-900">
                    {user.hotelProfile.address}, {user.hotelProfile.city}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Contact Phone</p>
                  <p className="font-medium text-slate-900">{user.hotelProfile.contactPhone}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Contact Email</p>
                  <p className="font-medium text-slate-900">{user.hotelProfile.contactEmail}</p>
                </div>
                {user.hotelProfile.description && (
                  <div className="col-span-2">
                    <p className="text-slate-500 text-xs">Description</p>
                    <p className="font-medium text-slate-900">{user.hotelProfile.description}</p>
                  </div>
                )}
              </div>
              {user.hotelProfile.hotelImage && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-1">Hotel Image</p>
                  <img
                    src={user.hotelProfile.hotelImage}
                    alt="Hotel"
                    className="h-28 w-44 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
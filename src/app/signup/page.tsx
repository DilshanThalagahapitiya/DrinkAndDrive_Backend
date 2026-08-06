// ============================================================
// Signup Page - Registration for Driver, Rider, or Hotel
// ============================================================
// Multi-role registration form:
//   - Common fields: name, email, phone, password
//   - Driver fields: license info + 2 side images + vehicle info
//   - Rider fields: address, city, emergency contact
//   - Hotel fields: hotel name, license, contact, image
//
// Role can be pre-selected via URL: /signup?role=driver
// ============================================================

"use client";

import { useState, FormEvent, ChangeEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/api";

// Role type options
type Role = "DRIVER" | "RIDER" | "HOTEL";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role"); // "driver" | "rider" | "hotel"

  const { signup } = useAuth();

  // Selected role - default to "driver" if ?role=driver, else "rider"
  const [role, setRole] = useState<Role>(
    initialRole === "driver" ? "DRIVER" : initialRole === "hotel" ? "HOTEL" : "RIDER"
  );

  // Common form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Driver fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseIssuedDate, setLicenseIssuedDate] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [licenseFrontImage, setLicenseFrontImage] = useState("");
  const [licenseBackImage, setLicenseBackImage] = useState("");
  const [licenseType, setLicenseType] = useState("LIGHT_WEIGHT");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["CAR"]);
  const [preferredGear, setPreferredGear] = useState("AUTO");
  const [specialNote, setSpecialNote] = useState("");

  // Rider fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Hotel fields
  const [hotelName, setHotelName] = useState("");
  const [hotelLicenseNumber, setHotelLicenseNumber] = useState("");
  const [hotelImage, setHotelImage] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle license image upload (called from file input)
  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>, side: "front" | "back" | "hotel") {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const response = await uploadFile(file);
      const url = response.data.url;

      // Store the returned URL in the appropriate state
      if (side === "front") setLicenseFrontImage(url);
      else if (side === "back") setLicenseBackImage(url);
      else setHotelImage(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // Build the data object based on role
      const data: Record<string, unknown> = {
        role,
        fullName,
        email,
        phone,
        password,
      };

      if (role === "DRIVER") {
        Object.assign(data, {
          licenseNumber,
          licenseIssuedDate,
          licenseExpiryDate,
          licenseFrontImage,
          licenseBackImage,
          licenseType,
          vehicleType: vehicleTypes, // Send as array for multi-select
          preferredGear,
          specialNote,
          address,
          city,
        });
      } else if (role === "RIDER") {
        Object.assign(data, {
          address,
          city,
          emergencyContactName,
          emergencyContactPhone,
        });
      } else {
        // HOTEL
        Object.assign(data, {
          hotelName,
          hotelLicenseNumber,
          contactPhone: phone,
          contactEmail: email,
          address,
          city,
          hotelImage: hotelImage || null,
          description,
        });
      }

      await signup(data);

      // After successful registration, go home
      // (user will see "pending approval" status)
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white rounded-xl mx-auto flex items-center justify-center mb-3 shadow-lg">
            <span className="text-indigo-600 font-bold text-2xl">D</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Create Your Account</h1>
          <p className="text-white/70 text-sm mt-1">Join DAD Safety System</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {(["DRIVER", "RIDER", "HOTEL"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 rounded-xl font-semibold text-sm transition border-2 ${
                  role === r
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"
                }`}
              >
                {r === "DRIVER" ? "🚗 Driver" : r === "RIDER" ? "🙋 Rider" : "🏨 Hotel"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ---- COMMON FIELDS ---- */}
            <h2 className="text-lg font-semibold text-slate-900 pt-2 border-t border-slate-200">
              Account Details
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="0712345678"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="Colombo"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* ---- DRIVER FIELDS ---- */}
            {role === "DRIVER" && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 pt-4 border-t border-slate-200">
                  Driver License Details
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Number *</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    {/* Multi-select vehicle types */}
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Vehicle Types (Select All That Apply) *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "CAR", label: "🚗 Car" },
                        { value: "VAN", label: "🚐 Van" },
                        { value: "LORRY", label: "🚛 Lorry" },
                        { value: "BUS", label: "🚌 Bus" },
                        { value: "BIKE", label: "🏍️ Motor Bike" },
                        { value: "TUKTUK", label: "🛺 Three Wheeler" },
                        { value: "SUV", label: "🚙 SUV" },
                      ].map((v) => (
                        <label
                          key={v.value}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-medium cursor-pointer transition ${
                            vehicleTypes.includes(v.value)
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={vehicleTypes.includes(v.value)}
                            onChange={() => {
                              setVehicleTypes((prev) =>
                                prev.includes(v.value)
                                  ? prev.filter((t) => t !== v.value)
                                  : [...prev, v.value]
                              );
                            }}
                            className="accent-white"
                          />
                          {v.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Preferred Gear Type *
                    </label>
                    <select
                      value={preferredGear}
                      onChange={(e) => setPreferredGear(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="AUTO">⚙️ Auto</option>
                      <option value="MANUAL">⚙️ Manual</option>
                      <option value="BOTH">⚙️ Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Type *</label>
                    <select
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LIGHT_WEIGHT">Light Weight</option>
                      <option value="HEAVY">Heavy</option>
                      <option value="LONG_VEHICLE">Long Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Issued Date *</label>
                    <input
                      type="date"
                      value={licenseIssuedDate}
                      onChange={(e) => setLicenseIssuedDate(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Expiry Date *</label>
                    <input
                      type="date"
                      value={licenseExpiryDate}
                      onChange={(e) => setLicenseExpiryDate(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* License photos upload */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      License Front Image *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "front")}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {licenseFrontImage && (
                      <img src={licenseFrontImage} alt="License front" className="mt-2 h-24 w-40 object-cover rounded-lg border" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      License Back Image *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "back")}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {licenseBackImage && (
                      <img src={licenseBackImage} alt="License back" className="mt-2 h-24 w-40 object-cover rounded-lg border" />
                    )}
                  </div>
                </div>
                {uploadingImage && <p className="text-sm text-indigo-600">Uploading image...</p>}

                <h2 className="text-lg font-semibold text-slate-900 pt-4 border-t border-slate-200">
                  Special Note
                </h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Special Note (Optional)
                  </label>
                  <textarea
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    rows={3}
                    placeholder="e.g. Available only on weekends, prefer night driving, any health conditions, etc."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {/* ---- RIDER FIELDS ---- */}
            {role === "RIDER" && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 pt-4 border-t border-slate-200">
                  Address Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Home Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="123 Main Street"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <h2 className="text-lg font-semibold text-slate-900 pt-4 border-t border-slate-200">
                  Emergency Contact
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      required
                      placeholder="Next of kin"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emergency Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      required
                      placeholder="0771234567"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ---- HOTEL FIELDS ---- */}
            {role === "HOTEL" && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 pt-4 border-t border-slate-200">
                  Hotel Details
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      required
                      placeholder="Grand Hotel"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hotel License Number *
                    </label>
                    <input
                      type="text"
                      value={hotelLicenseNumber}
                      onChange={(e) => setHotelLicenseNumber(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="456 Beach Road"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Tell us about your hotel..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "hotel")}
                    className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {hotelImage && (
                    <img src={hotelImage} alt="Hotel" className="mt-2 h-24 w-40 object-cover rounded-lg border" />
                  )}
                </div>
                {uploadingImage && <p className="text-sm text-indigo-600">Uploading image...</p>}
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 mt-6"
            >
              {loading
                ? "Creating Account..."
                : `Register as ${role === "DRIVER" ? "Driver" : role === "RIDER" ? "Rider" : "Hotel Partner"}`}
            </button>
          </form>

          {/* Link to login */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
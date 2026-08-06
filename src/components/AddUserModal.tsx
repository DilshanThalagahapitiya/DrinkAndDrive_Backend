"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { signup, uploadFile } from "@/lib/api";

interface AddUserModalProps {
  role: "DRIVER" | "RIDER" | "HOTEL" | "CUSTOMER";
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function AddUserModal({ role, onClose, onSuccess }: AddUserModalProps) {
  // ---- PERSONAL DETAILS ----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initials, setInitials] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // ---- DRIVER AUTHORIZATION ----
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("LIGHT_WEIGHT");
  const [lightExpiry, setLightExpiry] = useState("");
  const [heavyExpiry, setHeavyExpiry] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");

  // ---- DRIVER PREPARATION ----
  const [vehicleType, setVehicleType] = useState("CAR");
  const [transmission, setTransmission] = useState("AUTO");
  const [specialNote, setSpecialNote] = useState("");

  // ---- RIDER/HOTEL FIELDS ----
  const [riderLicenseNumber, setRiderLicenseNumber] = useState("");
  const [riderIdNumber, setRiderIdNumber] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelLicense, setHotelLicense] = useState("");
  // Customer fields
  const [customerLocation, setCustomerLocation] = useState("");
  const [customerVehicleType, setCustomerVehicleType] = useState("");
  const [customerTransmission, setCustomerTransmission] = useState("AUTO");
  const [customerVehicleNumber, setCustomerVehicleNumber] = useState("");
  const [customerSpecialNote, setCustomerSpecialNote] = useState("");

  // ---- UI ----
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const input =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  async function handleUpload(e: ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadFile(file);
      if (side === "front") setFrontImage(res.data.url);
      else setBackImage(res.data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const data: Record<string, unknown> = { role, email, phone };

      if (role === "DRIVER") {
        // Admin-created driver: NO password sent -> temp password auto-generated
        Object.assign(data, {
          firstName, lastName, initials,
          dob: dob || undefined,
          nic, address, city,
          licenseNumber,
          licenseCategory,
          licenseLightExpiryDate: licenseCategory !== "HEAVY" ? lightExpiry : undefined,
          licenseHeavyExpiryDate: licenseCategory !== "LIGHT_WEIGHT" ? heavyExpiry : undefined,
          licenseFrontImage: frontImage,
          licenseBackImage: backImage,
          vehicleType,
          preferredGear: transmission,
          specialNote,
        });
      } else if (role === "RIDER") {
        Object.assign(data, {
          firstName, lastName, initials,
          dob: dob || undefined,
          nic,
          address, city,
          riderLicenseNumber,
          riderIdNumber,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
        });
      } else if (role === "CUSTOMER") {
        Object.assign(data, {
          firstName, lastName, initials,
          dob: dob || undefined,
          nic,
          customerLocation,
          customerVehicleType,
          customerTransmission,
          customerVehicleNumber,
          customerSpecialNote,
        });
      } else {
        Object.assign(data, { hotelName, hotelLicenseNumber: hotelLicense, contactPhone: phone, contactEmail: email, address, city });
      }

      const res = await signup(data);

      // Show temp password for admin-created users (driver/rider/hotel)
      if (res.data.tempPassword) {
        setGeneratedPassword(res.data.tempPassword);
        await onSuccess();
      } else {
        await onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setSaving(false);
    }
  }

  const roleLabel = role === "DRIVER" ? "Driver" : role === "RIDER" ? "Rider" : role === "CUSTOMER" ? "Customer" : "Hotel";

  // Password success screen
  if (generatedPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Driver Registered!</h2>
          <p className="text-sm text-slate-600 mb-4">
            Share this <span className="font-semibold">temporary password</span> with the driver.<br/>
            They must change it on first login.
          </p>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
            <p className="text-xs text-amber-700 mb-1">Temporary Password</p>
            <p className="text-2xl font-mono font-bold text-slate-900 tracking-wider">{generatedPassword}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Register New {roleLabel}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

          {role === "DRIVER" && (
            <>
              {/* PERSONAL DETAILS */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Personal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Initials</label>
                    <input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g. K.A." className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className={input} /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Address *</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">NIC *</label>
                    <input value={nic} onChange={(e) => setNic(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} /></div>
                </div>
              </div>

              {/* DRIVER AUTHORIZATION */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Driver Authorization Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">License Number *</label>
                    <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">License Category *</label>
                    <select value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)} className={input}>
                      <option value="LIGHT_WEIGHT">Light Weight</option>
                      <option value="HEAVY">Heavy</option>
                      <option value="BOTH">Both</option>
                    </select></div>

                  {/* Conditional expiry dates */}
                  {licenseCategory !== "HEAVY" && (
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Light License Expiry *</label>
                      <input type="date" value={lightExpiry} onChange={(e) => setLightExpiry(e.target.value)} required className={input} /></div>
                  )}
                  {licenseCategory !== "LIGHT_WEIGHT" && (
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Heavy License Expiry *</label>
                      <input type="date" value={heavyExpiry} onChange={(e) => setHeavyExpiry(e.target.value)} required className={input} /></div>
                  )}

                  {/* License upload - two separate buttons */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">License Front *</label>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "front")}
                      className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700" />
                    {frontImage && <img src={frontImage} alt="Front" className="mt-1 h-16 w-24 object-cover rounded border" />}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">License Rear *</label>
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "back")}
                      className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700" />
                    {backImage && <img src={backImage} alt="Back" className="mt-1 h-16 w-24 object-cover rounded border" />}
                  </div>
                </div>
                {uploading && <p className="text-xs text-indigo-600 mt-1">Uploading...</p>}
              </div>

              {/* DRIVER PREPARATION */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Driver Preparation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Preferred Vehicle Type *</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={input}>
                      <option value="CAR">Car</option><option value="VAN">Van</option>
                      <option value="LORRY">Lorry</option><option value="BUS">Bus</option>
                      <option value="BIKE">Motor Bike</option><option value="TUKTUK">Three Wheeler</option>
                      <option value="SUV">SUV</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Preferred Transmission *</label>
                    <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={input}>
                      <option value="AUTO">Auto</option><option value="MANUAL">Manual</option><option value="BOTH">Both</option>
                    </select></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Special Notes</label>
                    <textarea value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} rows={2} placeholder="Any notes..." className={input} /></div>
                </div>
              </div>
            </>
          )}

          {/* Rider form - same structure as driver */}
          {role === "RIDER" && (
            <>
              {/* PERSONAL DETAILS */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Personal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Initials</label>
                    <input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g. K.A." className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className={input} /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Address *</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">NIC *</label>
                    <input value={nic} onChange={(e) => setNic(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">License Number *</label>
                    <input value={riderLicenseNumber} onChange={(e) => setRiderLicenseNumber(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} /></div>
                </div>
              </div>

              {/* EMERGENCY CONTACT */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact Name *</label>
                    <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact Phone *</label>
                    <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required className={input} /></div>
                </div>
              </div>
            </>
          )}

          {/* Customer form */}
          {role === "CUSTOMER" && (
            <>
              {/* PERSONAL DETAILS */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">Personal Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Initials</label>
                    <input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g. K.A." className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className={input} /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Location (Google Maps) *</label>
                    <input value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} required placeholder="Enter location or search on Google Maps" className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">NIC</label>
                    <input value={nic} onChange={(e) => setNic(e.target.value)} className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} required className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Email (Optional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" className={input} /></div>
                </div>
              </div>

              {/* ABOUT VEHICLE */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">About Vehicle</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">What is your vehicle? *</label>
                    <input value={customerVehicleType} onChange={(e) => setCustomerVehicleType(e.target.value)} required placeholder="e.g. Toyota Prius, Nissan March" className={input} /></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Transmission Type *</label>
                    <select value={customerTransmission} onChange={(e) => setCustomerTransmission(e.target.value)} className={input}>
                      <option value="AUTO">Auto</option>
                      <option value="MANUAL">Manual</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Number *</label>
                    <input value={customerVehicleNumber} onChange={(e) => setCustomerVehicleNumber(e.target.value)} required placeholder="e.g. CAB-1234" className={input} /></div>
                  <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Special Note</label>
                    <textarea value={customerSpecialNote} onChange={(e) => setCustomerSpecialNote(e.target.value)} rows={2} className={input} /></div>
                </div>
              </div>
            </>
          )}

          {/* Hotel form */}
          {role === "HOTEL" && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Hotel Name *</label><input className={input} required value={hotelName} onChange={(e)=>setHotelName(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">License Number *</label><input className={input} required value={hotelLicense} onChange={(e)=>setHotelLicense(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Address *</label><input className={input} required value={address} onChange={(e)=>setAddress(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">City *</label><input className={input} required value={city} onChange={(e)=>setCity(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone *</label><input className={input} required value={phone} onChange={(e)=>setPhone(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Contact Email *</label><input type="email" className={input} required value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button type="submit" disabled={saving || uploading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? "Registering..." : `Register ${roleLabel}`}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
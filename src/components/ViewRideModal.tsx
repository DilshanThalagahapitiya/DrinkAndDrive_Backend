"use client";

import { Ride } from "@/lib/api";

interface ViewRideModalProps {
  ride: Ride;
  onClose: () => void;
}

export default function ViewRideModal({ ride, onClose }: ViewRideModalProps) {
  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">🚙 Ride Details</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status badge + acceptance status */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              ride.status === "COMPLETED" ? "bg-green-50 text-green-700" :
              ride.status === "ONGOING" ? "bg-yellow-50 text-yellow-700" :
              "bg-indigo-50 text-indigo-700"
            }`}>
              {ride.status}
            </span>
            {/* Acceptance status shown for ASSIGNED/READY rides */}
            {(ride as any).driverAccepted === true && (ride as any).riderAccepted === true && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                ✅ Ready
              </span>
            )}
            {(ride as any).driverAccepted === true && (ride as any).riderAccepted !== true && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-300">
                🚗 Driver Accepted
              </span>
            )}
            {(ride as any).riderAccepted === true && (ride as any).driverAccepted !== true && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-300">
                🙋 Rider Accepted
              </span>
            )}
            <span className="text-xs text-slate-400">Created: {formatDate(ride.createdAt)}</span>
          </div>

          {/* General Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-100">General Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">🚗 Driver</span><span className="font-semibold text-slate-900">{ride.driver?.fullName || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📞 Driver Phone</span><span className="font-semibold text-slate-900">{ride.driver?.phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">🙋 Rider</span><span className="font-semibold text-slate-900">{ride.rider?.fullName || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📞 Rider Phone</span><span className="font-semibold text-slate-900">{ride.rider?.phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📍 Pickup</span><span className="font-semibold text-slate-900">{ride.pickupLocation}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">🕐 Pickup Time</span><span className="font-semibold text-slate-900">{formatDate(ride.startTime)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📍 Drop</span><span className="font-semibold text-slate-900">{ride.dropLocation}</span></div>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-100">Customer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">👤 Customer Name</span><span className="font-semibold text-slate-900">{ride.customerName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📞 Customer Number</span><span className="font-semibold text-slate-900">{ride.customerNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">🚘 Vehicle Type</span><span className="font-semibold text-slate-900">{ride.vehicleType || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">⚙️ Transmission</span><span className="font-semibold text-slate-900">{ride.transmission || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">📝 Special Notes</span><span className="font-semibold text-slate-900">{ride.specialNote || "—"}</span></div>
            </div>
          </div>

          {/* Odometer Summary */}
          {(ride.odoStart != null || ride.odoEnd != null) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-100">🛣️ Odometer Summary</h3>
              <div className="space-y-2 text-sm">
                {ride.odoStart != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">▶ Start Odometer</span>
                    <span className="font-semibold text-slate-900">{ride.odoStart} km</span>
                  </div>
                )}
                {ride.odoEnd != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">🏁 End Odometer</span>
                    <span className="font-semibold text-slate-900">{ride.odoEnd} km</span>
                  </div>
                )}
                {ride.odoStart != null && ride.odoEnd != null && ride.odoEnd >= ride.odoStart && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">📏 Distance</span>
                    <span className="font-bold text-indigo-700">{ride.odoEnd - ride.odoStart} km</span>
                  </div>
                )}

                {/* Start odo photo */}
                {ride.odoStartImage && (
                  <div>
                    <span className="text-slate-500 text-sm">📸 Start Odo Photo</span>
                    <div className="mt-1">
                      {/* If image is a URL (uploaded path) show it */}
                      {ride.odoStartImage.startsWith("http") || ride.odoStartImage.startsWith("/") ? (
                        <a href={ride.odoStartImage} target="_blank" rel="noreferrer">
                          <img src={ride.odoStartImage} alt="Start odometer" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">📎 {String(ride.odoStartImage).split('/').pop()}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* End odo photo */}
                {ride.odoEndImage && (
                  <div>
                    <span className="text-slate-500 text-sm">📷 End Odo Photo</span>
                    <div className="mt-1">
                      {ride.odoEndImage.startsWith("http") || ride.odoEndImage.startsWith("/") ? (
                        <a href={ride.odoEndImage} target="_blank" rel="noreferrer">
                          <img src={ride.odoEndImage} alt="End odometer" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">📎 {String(ride.odoEndImage).split('/').pop()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fare Summary (computed from Rate Table on ride completion) */}
          {ride.totalFare != null && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-100">💵 Fare Summary</h3>
              {(() => {
                try {
                  const b = ride.fareBreakdown ? JSON.parse(ride.fareBreakdown) : null;
                  if (b) {
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">🚦 Base Fare</span><span className="font-semibold text-slate-900">Rs. {b.baseFare}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">📏 Distance ({b.distanceKm} km)</span><span className="font-semibold text-slate-900">Rs. {b.distanceCost}</span></div>
                        {b.waitingMin > 0 && (
                          <div className="flex justify-between"><span className="text-slate-500">⏱️ Waiting ({b.waitingMin} min, {b.chargedWaitingMin} charged)</span><span className="font-semibold text-slate-900">Rs. {b.waitingCost}</span></div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 pt-2">
                          <span className="font-bold text-slate-800">💰 Total Fare</span>
                          <span className="font-bold text-green-700 text-base">Rs. {ride.totalFare}</span>
                        </div>
                      </div>
                    );
                  }
                } catch {}
                return (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">💰 Total Fare</span>
                    <span className="font-bold text-green-700">Rs. {ride.totalFare}</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Waiting Times (for Billing) */}
          {(ride as any).waitingIntervals && (ride as any).waitingIntervals !== "" && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-100">⏱️ Waiting Times (for Billing)</h3>
              <div className="space-y-1.5 text-sm">
                {(() => {
                  try {
                    const intervals = JSON.parse((ride as any).waitingIntervals);
                    return intervals.map((iv: any, i: number) => (
                      <div key={i} className="flex justify-between bg-orange-50 rounded px-2 py-1">
                        <span className="text-slate-600 font-medium">Waiting {i + 1}</span>
                        <span className="font-semibold text-slate-900">
                          {String(Math.floor((iv.seconds || 0) / 60)).padStart(2, "0")}:
                          {String((iv.seconds || 0) % 60).padStart(2, "0")}
                          <span className="text-slate-400 text-xs"> ({new Date(iv.start).toLocaleTimeString()} → {new Date(iv.end).toLocaleTimeString()})</span>
                        </span>
                      </div>
                    ));
                  } catch {
                    return null;
                  }
                })()}
                {(ride as any).waitingTotal > 0 && (
                  <div className="flex justify-between pt-2 mt-1 border-t border-orange-200">
                    <span className="font-bold text-slate-700">Total Waiting</span>
                    <span className="font-bold text-orange-700">
                      {String(Math.floor(((ride as any).waitingTotal || 0) / 60)).padStart(2, "0")}:
                      {String(((ride as any).waitingTotal || 0) % 60).padStart(2, "0")} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status times */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-100">Status Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">🕐 Created</span><span className="font-semibold text-slate-900">{formatDate(ride.createdAt)}</span></div>
              {ride.startedAt && (
                <div className="flex justify-between"><span className="text-slate-500">▶ Started</span><span className="font-semibold text-slate-900">{formatDate(ride.startedAt)}</span></div>
              )}
              {ride.completedAt && (
                <div className="flex justify-between"><span className="text-slate-500">✅ Completed</span><span className="font-semibold text-slate-900">{formatDate(ride.completedAt)}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
          >
            📄 Download PDF
          </button>
          <button
            onClick={() => {
              // Build the ride summary text for sharing
              const summary =
                `🚙 DAD Ride Details\n\n` +
                `🚗 Driver: ${ride.driver?.fullName || "N/A"} (${ride.driver?.phone || "—"})\n` +
                `🙋 Rider: ${ride.rider?.fullName || "N/A"} (${ride.rider?.phone || "—"})\n` +
                `📍 Pickup: ${ride.pickupLocation}\n` +
                `🕐 Pickup Time: ${formatDate(ride.startTime)}\n` +
                `📍 Drop: ${ride.dropLocation}\n\n` +
                `👤 Customer: ${ride.customerName || "—"}\n` +
                `📞 Customer No: ${ride.customerNumber || "—"}\n` +
                `🚘 Vehicle: ${ride.vehicleType || "—"}\n` +
                `⚙️ Transmission: ${ride.transmission || "—"}\n` +
                `📝 Notes: ${ride.specialNote || "—"}\n\n` +
                `📊 Status: ${ride.status}`;

              // Use navigator.share if available, otherwise copy to clipboard
              if (navigator.share) {
                navigator.share({ title: "DAD Ride Details", text: summary });
              } else {
                navigator.clipboard.writeText(summary).then(() => {
                  alert("Ride summary copied to clipboard! You can paste it anywhere.");
                });
              }
            }}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            📤 Share
          </button>
          <button onClick={onClose} className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">Close</button>
        </div>
      </div>
    </div>
  );
}
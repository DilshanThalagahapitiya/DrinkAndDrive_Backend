"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

interface Rate {
  baseFare: number;
  perKmRate: number;
  kmTierLimit: number;
  kmTier2Rate: number;
  kmMaxRate: number;
  waitingRatePerMin: number;
  freeWaitingMin: number;
}

export default function RatesPage() {
  const [rate, setRate] = useState<Rate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadRates();
  }, []);

  async function loadRates() {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/api/rates", { method: "GET" });
      setRate(res.data.rate);
    } catch (err: any) {
      setError(err.message || "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!rate) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiRequest("/api/rates", { method: "PATCH", body: rate });
      setRate(res.data.rate);
      setSuccess("Rate table updated! All dashboards will now show the new rates.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save rates");
    } finally {
      setSaving(false);
    }
  }

  const field = (
    label: string,
    key: keyof Rate,
    suffix: string,
    color: string
  ) => (
    <div className={`border-l-4 ${color} pl-3 py-2`}>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={rate?.[key] ?? 0}
          onChange={(e) => setRate((r) => r ? { ...r, [key]: Number(e.target.value) } : r)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-xs text-slate-400 whitespace-nowrap">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">💰 Rate Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving || !rate}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "💾 Save Rates"}
        </button>
      </div>

      {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">✅ {success}</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KM Pricing Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              <h3 className="font-semibold text-slate-900">📏 Distance (KM) Pricing</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {field("💰 Base Fare (every ride)", "baseFare", "LKR", "border-indigo-400")}
              {field("🚗 Per KM (1st tier)", "perKmRate", "LKR/km", "border-green-400")}
              {field("📐 KM Tier Limit", "kmTierLimit", "km", "border-blue-400")}
              {field("🚙 Per KM (2nd tier)", "kmTier2Rate", "LKR/km", "border-orange-400")}
              {field("⚠️ Max KM Rate", "kmMaxRate", "LKR/km", "border-red-400")}
            </div>
          </div>

          {/* Waiting Pricing Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              <h3 className="font-semibold text-slate-900">⏱️ Waiting Time Pricing</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("⏳ Waiting Rate", "waitingRatePerMin", "LKR/min", "border-amber-400")}
              {field("🆓 Free Waiting Minutes", "freeWaitingMin", "min", "border-green-400")}
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="font-semibold text-indigo-900 mb-3">👁️ Live Rate Preview (shown on all dashboards)</h3>
            {rate && (
              <div className="text-sm space-y-1 text-indigo-900">
                <p>• Base fare: <b>{rate.baseFare} LKR</b></p>
                <p>• First {rate.kmTierLimit} km: <b>{rate.perKmRate} LKR/km</b></p>
                <p>• After {rate.kmTierLimit} km: <b>{rate.kmTier2Rate} LKR/km</b> (max {rate.kmMaxRate} LKR/km)</p>
                <p>• Waiting: first <b>{rate.freeWaitingMin} min FREE</b>, then <b>{rate.waitingRatePerMin} LKR/min</b></p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
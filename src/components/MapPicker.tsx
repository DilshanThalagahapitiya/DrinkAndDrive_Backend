"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// MapPicker — Google Maps location picker (no autocomplete)
// Flow:
//   1. Admin types a location (address/place name)
//   2. Clicks "🔍 Find on Map" → Google Geocoder finds it
//   3. Map centers on it, marker drops, lat/lng captured
//   4. Admin can click anywhere on the map to fine-tune
//   5. onLocationChange gives { lat, lng } for storage
// ============================================================

const FALLBACK_KEY = "AIzaSyACJNwHL1hGXVwkWxh72-cJiOYwWyxAfLA";
const API_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) || FALLBACK_KEY;

declare global {
  interface Window {
    google?: any;
  }
}

// Only true when the exact constructors we call exist (Map + Geocoder + Marker)
function isMapsReady(): boolean {
  return !!(
    typeof window !== "undefined" &&
    window.google?.maps?.Map &&
    window.google?.maps?.Geocoder &&
    window.google?.maps?.Marker
  );
}

// ---- Module-level singleton loader ----
let mapsPromise: Promise<any> | null = null;

function loadMaps(): Promise<any> {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if (isMapsReady()) {
      resolve(window.google.maps);
      return;
    }
    const existing = document.getElementById("dad-maps-script");
    const script = (existing as HTMLScriptElement) || document.createElement("script");

    const waitForGoogle = (attempts = 0) => {
      if (isMapsReady()) resolve(window.google.maps);
      else if (attempts > 200) reject(new Error("Google Maps timed out loading."));
      else setTimeout(() => waitForGoogle(attempts + 1), 100);
    };

    if (!existing) {
      script.id = "dad-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`; // NO places library needed
      script.async = true;
      script.defer = true;
      script.onload = () => waitForGoogle();
      script.onerror = () => reject(new Error("Google Maps script failed to load."));
      document.head.appendChild(script);
    } else {
      waitForGoogle();
    }
  });

  return mapsPromise;
}

interface MapPickerProps {
  value?: string; // existing address (e.g., existing pickup location)
  onChange: (address: string) => void;
  onLocationChange?: (loc: { lat: number; lng: number }) => void;
  label?: string;
}

export default function MapPicker({ value = "", onChange, onLocationChange, label = "Pickup Location" }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loadError, setLoadError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState("");

  // Load maps once
  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (!cancelled) setLoaded(true);
      })
      .catch((e: any) => {
        if (!cancelled) setLoadError("❌ " + String(e?.message || e));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init map after the div exists
  useEffect(() => {
    if (loaded && isMapsReady()) initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function initMap() {
    if (!mapRef.current || !isMapsReady() || mapInstance.current) return;
    try {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka
        zoom: 12,
        fullscreenControl: true,
      });

      // Modal resize fix
      const forceResize = () => {
        try {
          if (mapInstance.current) window.google.maps.event.trigger(mapInstance.current, "resize");
        } catch {}
      };
      setTimeout(forceResize, 400);
      setTimeout(forceResize, 1000);
      if (typeof ResizeObserver !== "undefined" && mapRef.current) {
        new ResizeObserver(forceResize).observe(mapRef.current);
      }

      markerRef.current = new window.google.maps.Marker({ map: mapInstance.current });

      // Click on map → reverse geocode + capture lat/lng
      mapInstance.current.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        markerRef.current.setPosition(e.latLng);
        setCoords({ lat, lng });
        onLocationChange?.({ lat, lng });
        new window.google.maps.Geocoder().geocode({ location: e.latLng }, (results: any, s: string) => {
          if (s === "OK" && results[0]) {
            onChange(results[0].formatted_address);
            if (inputRef.current) inputRef.current.value = results[0].formatted_address;
          }
        });
      });
    } catch (e) {
      setLoadError("❌ Maps initialization failed: " + String(e));
    }
  }

  // "Find on Map" — geocode typed address → center map + marker + lat/lng
  function findOnMap() {
    if (!inputRef.current || !isMapsReady()) return;
    const query = inputRef.current.value.trim();
    if (!query) {
      setStatus("⚠️ Please type a location first.");
      return;
    }
    setSearching(true);
    setStatus("🔍 Searching...");
    new window.google.maps.Geocoder().geocode({ address: query }, (results: any, s: string) => {
      setSearching(false);
      if (s === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        const addr = results[0].formatted_address || query;
        onChange(addr);
        inputRef.current!.value = addr;
        markerRef.current.setPosition(loc);
        mapInstance.current.setCenter(loc);
        mapInstance.current.setZoom(14);
        setCoords({ lat, lng });
        onLocationChange?.({ lat, lng });
        setStatus(`✅ Found: ${addr}`);
      } else {
        setStatus("❌ Location not found. Try a more specific address (e.g. city + area).");
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500">{label}</label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          defaultValue={value}
          placeholder="Type location e.g. Colombo 07"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={findOnMap}
          disabled={searching || !loaded}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {searching ? "Searching..." : "🔍 Find on Map"}
        </button>
      </div>
      {status && <p className="text-xs text-slate-500">{status}</p>}
      {coords && (
        <p className="text-xs text-green-700 font-medium">
          📍 Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
        </p>
      )}
      {loadError ? (
        <div className="w-full h-52 rounded-lg border border-red-300 bg-red-50 flex items-center justify-center p-4">
          <p className="text-red-600 text-xs text-center">{loadError}</p>
        </div>
      ) : !loaded ? (
        <div className="w-full h-52 rounded-lg border border-slate-200 flex items-center justify-center">
          <p className="text-slate-400 text-xs">🔄 Loading Google Maps...</p>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-52 rounded-lg border border-slate-200" />
      )}
      <p className="text-[11px] text-slate-400">Click on the map to fine-tune the exact location.</p>
    </div>
  );
}
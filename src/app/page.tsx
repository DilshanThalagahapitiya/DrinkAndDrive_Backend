// ============================================================
// Home Screen (Landing Page)
// ============================================================
// The main landing page for the DAD app.
// Users can register as a Driver, Rider, or Hotel partner.
// Also provides access to the Admin Portal.
// ============================================================

"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 via-indigo-500 to-slate-50">
      {/* Header/Navbar */}
      <nav className="bg-indigo-600/90 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-xl">D</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">DAD</span>
              <span className="block text-white/70 text-xs">Drink & Drive Safety</span>
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-10 bg-white/20 animate-pulse rounded-lg" />
            ) : user ? (
              <>
                {/* If admin, show Dashboard link */}
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Show user status badge */}
                <span className="px-3 py-2 text-white/80 text-sm bg-white/10 rounded-lg">
                  {user.fullName}
                </span>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-white font-medium rounded-lg hover:bg-white/10 transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-16 pb-20 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Don't Drive Drunk.
            <span className="block text-2xl md:text-3xl mt-2 text-white/80 font-medium">
              Get Home Safely with DAD.
            </span>
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
            DAD connects intoxicated drivers with verified safe drivers, riders,
            and partner hotels — so everyone gets home safely.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?role=driver"
              className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition shadow-lg"
            >
              Register as Driver
            </Link>
            <Link
              href="/signup?role=rider"
              className="px-6 py-3 bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-800 transition shadow-lg"
            >
              Register as Rider
            </Link>
            <Link
              href="/signup?role=hotel"
              className="px-6 py-3 bg-transparent text-white border-2 border-white/50 font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Partner Hotel
            </Link>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          How DAD Works
        </h2>

        {/* 3 Step Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Register</h3>
            <p className="text-slate-600">
              Create an account as a driver, rider, or hotel partner. Provide your
              details and verify your identity.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Get Approved</h3>
            <p className="text-slate-600">
              Our admin team reviews and approves your account to ensure a safe
              and trusted community.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Get Home Safe</h3>
            <p className="text-slate-600">
              Request a ride, connect with partner hotels, or offer your driving
              services — all through DAD.
            </p>
          </div>
        </div>

        {/* Admin Portal Link */}
        <div className="mt-16 text-center">
          <Link
            href="/login?redirect=admin"
            className="inline-block px-6 py-3 text-indigo-600 font-semibold border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition"
          >
            🔐 Admin Portal Access
          </Link>
          <p className="text-sm text-slate-500 mt-2">
            For administrators managing registrations
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/60 text-center py-6 text-sm">
        <p>© {new Date().getFullYear()} DAD - Drink and Drive Safety System. All rights reserved.</p>
        <p className="mt-1 text-white/40">Drive safe. Don't drink and drive.</p>
      </footer>
    </div>
  );
}
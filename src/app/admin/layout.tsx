// ============================================================
// Admin Portal Layout
// ============================================================
// Provides the admin sidebar with category navigation:
//   - Dashboard (overview)
//   - Drivers table
//   - Riders table
//   - Hotels table
// Also guards the route: only ADMINS can access.
// ============================================================

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Sidebar navigation items
const navItems = [
  { href: "/admin", label: "📊 Dashboard" },
  { href: "/admin/drivers", label: "🚗 Drivers" },
  { href: "/admin/riders", label: "🙋 Riders" },
  { href: "/admin/hotels", label: "🏨 Hotels" },
  { href: "/admin/customers", label: "👤 Customers" },
  { href: "/admin/rides", label: "🚙 Ride Details" },
  { href: "/admin/rates", label: "💰 Rate Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Guard: redirect non-admins away
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=admin");
      } else if (user.role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  // Show skeleton while checking auth
  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ---- Sidebar ---- */}
      <aside className="w-64 bg-slate-900 text-white shrink-0 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">D</div>
            <div>
              <p className="font-bold leading-none">DAD Admin</p>
              <p className="text-xs text-slate-400">Portal</p>
            </div>
          </Link>
        </div>

        {/* Category Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wider">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Home link */}
        <div className="px-3 pb-4">
          <Link
            href="/"
            className="block px-4 py-2.5 rounded-lg hover:bg-slate-800 font-medium text-sm text-slate-400"
          >
            🏠 Back to Home
          </Link>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-sm font-medium">{user.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">👤 {user.fullName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
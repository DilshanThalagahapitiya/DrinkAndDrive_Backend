// ============================================================
// Login Page
// ============================================================
// Login form for all user types (Admin, Driver, Rider, Hotel).
// After successful login:
//   - Admin → redirected to /admin dashboard
//   - Others → redirected to home screen
// ============================================================

"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect"); // e.g. "admin"
  const role = searchParams.get("role"); // e.g. "customer"

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      // Redirect based on role
      if (loggedInUser.role === "ADMIN") {
        router.push("/admin");
      } else if (redirect === "admin") {
        // Tried to access admin portal but not an admin
        setError("This account does not have admin access.");
        return;
      } else {
        // Go to home; home screen will show appropriate links based on role
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg">
            <span className="text-indigo-600 font-bold text-3xl">D</span>
          </div>
          <h1 className="text-white text-2xl font-bold">
            {role === "customer" ? "Hire a Driver" : "Welcome Back"}
          </h1>
          <p className="text-white/70 text-sm mt-1">
            {role === "customer" ? "Login to hire a safe driver" : "Login to DAD Safety System"}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
            Login to your account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Link to signup */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{" "}
            <Link
              href={role === "customer" ? "/signup?role=customer" : "/signup"}
              className="text-indigo-600 font-medium hover:underline"
            >
              Register here
            </Link>
          </p>

          {/* Admin hint */}
          <div className="mt-6 p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-xs text-slate-500">
              Admin demo: <span className="font-medium">admin@dad.com</span> /{" "}
              <span className="font-medium">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
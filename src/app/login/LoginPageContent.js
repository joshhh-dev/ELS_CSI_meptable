// app/login/LoginPageContent.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { HiEye, HiEyeOff } from "react-icons/hi";
import Image from "next/image";

export default function LoginPageContent() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectPath);
    }
  }, [user, loading, redirectPath, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingLogin(true);
    try {
      await login(email, password, redirectPath);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-white text-lg">
        Checking auth status...
      </p>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/els.svg" alt="Logo" width={48} height={48} className="mx-auto" />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-800">Welcome</h2>
          <p className="text-gray-500 mt-1">Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="text-red-600 bg-red-100 p-3 rounded-lg text-center text-sm animate-pulse">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              id="email"
              className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label
              htmlFor="email"
              className="absolute left-3 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500"
            >
              Email
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="peer w-full border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label
              htmlFor="password"
              className="absolute left-3 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingLogin ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

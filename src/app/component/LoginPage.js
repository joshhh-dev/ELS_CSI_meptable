// src/app/component/LoginPage.js
"use client";
import { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async () => {
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleEmailLogin}
          className="bg-blue-600 text-white px-4 py-2 w-full rounded"
        >
          Login
        </button>
        <button
          onClick={handleGoogleLogin}
          className="bg-red-500 text-white px-4 py-2 w-full rounded mt-2"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}

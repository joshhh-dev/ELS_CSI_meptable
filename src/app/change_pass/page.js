"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ChangePasswordPage() {
  const { changePassword, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setMessage("✅ Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Please login to change your password.</p>
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-800">
          Change Password
        </h2>

        {message && (
          <div
            className={`mb-4 rounded-md p-3 text-sm ${
              message.startsWith("✅")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

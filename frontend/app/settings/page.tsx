"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Edit3, LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/neo/spinner";
import { useUserStats } from "@/lib/hooks/useUserStats";
import { useState } from "react";
import { setUsername } from "@/app/_actions/cache";
import { useUserUsername } from "@/lib/hooks/useUserUsername";
import Link from "next/link";

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const { subscriptionPlan } = useUserStats(user ? user.id.toString() : "");
  const [editing, setEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Always call the hook, even if user is not ready
  const { username, refetch: refetchUsername } = useUserUsername(
    user ? user.id.toString() : ""
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  async function handleUsernameSave() {
    setUsernameLoading(true);
    setUsernameError(null);
    const newUsername = usernameInput.trim();
    await setUsername(user!.id.toString(), newUsername);
    setEditing(false);
    setUsernameInput(newUsername);
    refetchUsername();
    setUsernameLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#23272F] text-white py-8">
      <Link
        href="/dashboard"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-blue-400 hover:text-blue-200 text-sm font-semibold"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>
      <div className="max-w-md mx-auto py-12 px-4 sm:px-0 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-8 text-white text-center">
          Account
        </h2>
        {/* Avatar and Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-5xl select-none">
              <span role="img" aria-label="avatar">
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </span>
            </div>
          </div>
          <div className="text-white text-lg font-semibold mb-1">
            {username || user.login}
          </div>
          {username && (
            <div className="text-gray-400 text-sm mb-1">({user.login})</div>
          )}
          {editing ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <input
                className="w-full max-w-xs py-2 px-4 rounded-full bg-[#181A1F] text-gray-200 border border-[#353a45] focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter new username"
                disabled={usernameLoading}
                maxLength={32}
              />
              <div className="flex gap-2 w-full max-w-xs">
                <button
                  className="flex-1 py-2 rounded-full bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
                  onClick={handleUsernameSave}
                  disabled={usernameLoading}
                >
                  {usernameLoading ? "Saving..." : "Save"}
                </button>
                <button
                  className="flex-1 py-2 rounded-full bg-gray-600 text-white font-semibold hover:bg-gray-700 transition"
                  onClick={() => {
                    setEditing(false);
                    setUsernameError(null);
                  }}
                  disabled={usernameLoading}
                >
                  Cancel
                </button>
              </div>
              {usernameError && (
                <div className="text-red-400 text-sm mt-1">{usernameError}</div>
              )}
            </div>
          ) : (
            <button
              className="w-full max-w-xs py-2 px-6 rounded-full bg-[#181A1F] text-gray-200 font-medium flex items-center justify-center gap-2 mb-2 border border-[#353a45] hover:bg-blue-700 hover:text-white transition min-w-[180px]"
              onClick={() => {
                setEditing(true);
                setUsernameInput(user.username || "");
              }}
            >
              <Edit3 className="w-5 h-5 text-blue-400" />
              Edit Username
            </button>
          )}
        </div>
        <div className="flex flex-col items-center mb-6">
          <div className="text-white text-lg font-semibold mb-1">
            Current Plan:{" "}
            <span className="text-blue-400 font-semibold">
              {subscriptionPlan}
            </span>
          </div>
        </div>
        {/* Logout Button */}
        <button
          className="w-full max-w-xs py-3 rounded-full bg-[#181A1F] text-gray-200 font-semibold flex items-center justify-center gap-2 mt-8 border border-[#353a45] hover:bg-blue-700 hover:text-white transition"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 text-blue-400" />
          Logout
        </button>
      </div>
    </div>
  );
}

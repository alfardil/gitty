"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Edit3, LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/neo/spinner";

export default function Settings() {
  const { user, loading, logout } = useAuth();

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

  const nickname = user.login;

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#23272F] text-white py-8">
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
            {nickname}
          </div>
          <button className="w-full max-w-xs py-2 px-6 rounded-full bg-[#181A1F] text-gray-200 font-medium flex items-center justify-center gap-2 mb-2 border border-[#353a45] hover:bg-blue-700 hover:text-white transition min-w-[180px]">
            <Edit3 className="w-5 h-5 text-blue-400" />
            Edit Username
          </button>
        </div>
        <div className="flex flex-col items-center mb-6">
          <div className="text-white text-lg font-semibold mb-1">
            Current Plan: Free
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

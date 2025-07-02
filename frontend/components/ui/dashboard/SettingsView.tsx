"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

export function SettingsView({ handleSidebarNav }: { handleSidebarNav: (section: string) => void }) {
  const [nickname, setNickname] = useState("Sam");
  return (
    <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto py-12 px-4 sm:px-0">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Edit profile</h2>
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-200">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <button className="absolute -top-2 -left-2 bg-blue-700 border-4 border-white rounded-full w-7 h-7 flex items-center justify-center shadow">
            <Plus className="text-white w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your nickname"
          />
          <button
            type="button"
            className="w-full py-3 rounded-full bg-blue-700 text-white text-base font-bold tracking-wide shadow hover:bg-blue-800 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
      {/* Membership Card */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-center text-lg font-medium text-gray-700 flex flex-col items-center gap-4">
        <div>
          Membership status: <span className="font-bold text-blue-700">Member</span>
        </div>
      </div>
      {/* Manage subscription button below the card */}
      <button
        type="button"
        onClick={() => handleSidebarNav("billing")}
        className="mt-2 px-6 py-3 rounded-full bg-blue-700 text-white text-base font-bold tracking-wide shadow hover:bg-blue-800 transition mx-auto"
        style={{ display: 'block' }}
      >
        Manage subscription
      </button>
    </div>
  );
} 
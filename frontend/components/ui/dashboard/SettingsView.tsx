"use client";

import { Edit3, Fingerprint, Key, KeyRound, LogOut, Mail, Plus } from "lucide-react";
import { useState } from "react";

export function SettingsView({ handleSidebarNav }: { handleSidebarNav: (section: string) => void }) {
  const [nickname, setNickname] = useState("Sam Lee");
  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-0 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-8 text-white text-center">Account</h2>
      {/* Avatar and Name */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-5xl select-none">
            <span role="img" aria-label="avatar">😺</span>
          </div>
          <button className="absolute bottom-1 right-1 bg-blue-600 border-4 border-[#23272f] rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-blue-700 transition">
            <Plus className="text-white w-5 h-5" />
          </button>
        </div>
        <div className="text-white text-lg font-semibold mb-1">{nickname}</div>
        <button className="w-full max-w-xs py-2 px-6 rounded-full bg-[#2d313a] text-gray-200 font-medium flex items-center justify-center gap-2 mb-2 border border-[#353a45] hover:bg-blue-700 hover:text-white transition min-w-[180px]">
          <Edit3 className="w-5 h-5 text-blue-400" />
          Edit Details
        </button>
      </div>
      {/* Login Method Card */}
      <div className="w-full bg-[#23272f] rounded-2xl border border-blue-400/20 shadow p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-400" />
          <span className="text-gray-200 font-medium">Login Method</span>
        </div>
        <span className="text-gray-400 text-sm">samlee.mobbin+1@gmail.com</span>
      </div>
      {/* Authentication Section */}
      <div className="w-full mb-2">
        <div className="text-gray-400 text-xs font-semibold mb-1 ml-1">Authentication</div>
        <div className="bg-[#23272f] rounded-2xl border border-blue-400/20 shadow divide-y divide-[#353a45]">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-blue-400" />
              <span className="text-gray-200 font-medium">Password</span>
            </div>
            <span className="text-gray-400 text-sm">Enabled</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-blue-400" />
              <span className="text-gray-200 font-medium">Passkey</span>
            </div>
            <span className="text-gray-400 text-sm">1 Passkey</span>
          </div>
        </div>
      </div>
      {/* Advanced Section */}
      <div className="w-full mb-2">
        <div className="text-gray-400 text-xs font-semibold mb-1 ml-1">Advanced</div>
        <div className="bg-[#23272f] rounded-2xl border border-blue-400/20 shadow flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-blue-400" />
            <span className="text-gray-200 font-medium">Secret Keys</span>
          </div>
        </div>
      </div>
      {/* Logout Button */}
      <button className="w-full max-w-xs py-3 rounded-full bg-[#2d313a] text-gray-200 font-semibold flex items-center justify-center gap-2 mt-8 border border-[#353a45] hover:bg-blue-700 hover:text-white transition">
        <LogOut className="w-5 h-5 text-blue-400" />
        Logout
      </button>
    </div>
  );
} 
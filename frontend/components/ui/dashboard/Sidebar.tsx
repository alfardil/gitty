"use client";

import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { CreditCard, LogOut, Settings, X } from "lucide-react";
import React from "react";

// ChatGPTSidebarToggleLeft icon as provided by user
function ChatGPTSidebarToggleLeft({ className = "" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={32}
      height={32}
    >
      {/* Outer box */}
      <rect x="4" y="6" width="24" height="20" rx="2" ry="2" stroke="currentColor" fill="none" />

      {/* Vertical divider line */}
      <line x1="14" y1="6" x2="14" y2="26" stroke="currentColor" />

      {/* Two horizontal lines (hamburger menu) inside left panel */}
      <line x1="8" y1="12" x2="12" y2="12" stroke="currentColor" />
      <line x1="8" y1="18" x2="12" y2="18" stroke="currentColor" />
    </svg>
  );
}

export function Sidebar({
  user,
  sidebarOpen,
  setSidebarOpen,
  sidebarMobile,
  setSidebarMobile,
  showSection,
  handleSidebarNav,
  logout,
}: {
  user: any;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarMobile: boolean;
  setSidebarMobile: (open: boolean) => void;
  showSection: string;
  handleSidebarNav: (section: string) => void;
  logout: () => void;
}) {
  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-screen fixed z-30 left-0 top-0 bg-[#23272f] transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } border-r border-blue-400/20 rounded-r-xl shadow-lg`}
      >
        <div
          className={`flex items-center border-b border-blue-400/10 transition-all duration-300 ${
            sidebarOpen ? "p-4 justify-between" : "p-4 justify-center"
          }`}
          style={{ minHeight: "72px" }}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full">
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="w-10 h-10 rounded-full border-2 border-blue-400/60"
              />
              <div className="flex flex-col">
                <div className="font-semibold text-gray-100 text-sm">
                  {user.name || user.login}
                </div>
              </div>
              <button
                className="ml-auto p-2 rounded-lg text-gray-400 hover:bg-blue-400/10 hover:text-blue-400"
                onClick={() => setSidebarOpen(false)}
                aria-label="Collapse sidebar"
              >
                <ChatGPTSidebarToggleLeft className="w-7 h-7" />
              </button>
            </div>
          ) : (
            <button
              className="p-2 rounded-lg text-gray-400 hover:bg-blue-400/10 hover:text-blue-400"
              onClick={() => setSidebarOpen(true)}
              aria-label="Expand sidebar"
            >
              <ChatGPTSidebarToggleLeft className="w-7 h-7" />
            </button>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          {SIDEBAR_SECTIONS.map(
            ({
              key,
              label,
              icon: Icon,
            }: {
              key: string;
              label: string;
              icon: React.ElementType;
            }) => (
              <button
                key={key}
                className={`group flex items-center w-full gap-3 rounded-lg text-base font-medium transition-colors ${
                  showSection === key
                    ? "bg-blue-400/10 text-blue-400"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                } ${
                  sidebarOpen
                    ? "px-4 py-2 justify-start"
                    : "h-12 justify-center"
                }`}
                onClick={() => handleSidebarNav(key)}
              >
                <Icon className="w-6 h-6" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </button>
            )
          )}
        </nav>
        <div className="mt-auto px-3 py-4 border-t border-blue-400/10 flex flex-col gap-2">
          <button
            className={`flex items-center gap-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors ${
              sidebarOpen ? "px-4 py-2 justify-start" : "h-12 justify-center"
            }`}
            onClick={() => handleSidebarNav("billing")}
          >
            <CreditCard className="w-6 h-6" />
            {sidebarOpen && <span>Billing</span>}
          </button>
          <button
            className={`flex items-center gap-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors ${
              sidebarOpen ? "px-4 py-2 justify-start" : "h-12 justify-center"
            }`}
            onClick={() => handleSidebarNav("settings")}
          >
            <Settings className="w-6 h-6" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={logout}
            className={`flex items-center gap-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors ${
              sidebarOpen ? "px-4 py-2 justify-start" : "h-12 justify-center"
            }`}
          >
            <LogOut className="w-6 h-6" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarMobile && (
        <div className="fixed inset-0 z-40 flex">
          <div className="relative w-64 bg-[#191919] flex flex-col h-full border-r border-[#18CCFC]/30">
            <div
              className="flex items-center gap-3 px-4 py-4 border-b border-[#18CCFC]/30"
              style={{ minHeight: "72px" }}
            >
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="w-10 h-10 rounded-full border-2 border-[#18CCFC]"
              />
              <div className="flex flex-col">
                <div className="font-semibold text-white text-sm">
                  {user.name || user.login}
                </div>
              </div>
              <button
                className="ml-auto p-2 rounded-lg text-gray-400 hover:bg-[#18CCFC]/20 hover:text-[#18CCFC]"
                onClick={() => setSidebarMobile(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-2">
              {SIDEBAR_SECTIONS.map(
                ({
                  key,
                  label,
                  icon: Icon,
                }: {
                  key: string;
                  label: string;
                  icon: React.ElementType;
                }) => (
                  <button
                    key={key}
                    className={`group flex items-center w-full gap-3 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                      showSection === key
                        ? "bg-[#18CCFC]/20 text-[#18CCFC]"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    } justify-start`}
                    onClick={() => handleSidebarNav(key)}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="truncate">{label}</span>
                  </button>
                )
              )}
            </nav>
            <div className="mt-auto px-3 py-4 border-t border-[#18CCFC]/30 flex flex-col gap-2">
              <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white justify-start" onClick={() => handleSidebarNav("billing")}> 
                <CreditCard className="w-6 h-6" />
                <span>Billing</span>
              </button>
              <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white justify-start" onClick={() => handleSidebarNav("settings")}> 
                <Settings className="w-6 h-6" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white justify-start"
              >
                <LogOut className="w-6 h-6" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarMobile(false)}
          />
        </div>
      )}
    </>
  );
}

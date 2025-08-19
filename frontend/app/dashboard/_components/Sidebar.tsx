"use client";

import { SIDEBAR_SECTIONS } from "@/lib/constants/index";
import { CreditCard, LogOut, Settings, X, Gift } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { useUserUsername } from "@/lib/hooks/api/useUserUsername";
import { useRouter } from "next/navigation";
import { useIsAdminOfAnyEnterprise } from "@/lib/hooks/business/useIsAdminOfAnyEnterprise";

const ChatGPTSidebarToggleLeft = ({ className = "" }) => {
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
      <rect
        x="4"
        y="6"
        width="24"
        height="20"
        rx="2"
        ry="2"
        stroke="currentColor"
        fill="none"
      />

      {/* Vertical divider line */}
      <line x1="14" y1="6" x2="14" y2="26" stroke="currentColor" />

      {/* Two horizontal lines (hamburger menu) inside left panel */}
      <line x1="8" y1="12" x2="12" y2="12" stroke="currentColor" />
      <line x1="8" y1="18" x2="12" y2="18" stroke="currentColor" />
    </svg>
  );
};

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
  const { username } = useUserUsername(user ? user.id.toString() : "");
  const router = useRouter();
  const { data: isAdminOfAnyEnterprise } = useIsAdminOfAnyEnterprise(
    user?.uuid
  );

  const filteredSidebarSections = useMemo(() => {
    let sections = SIDEBAR_SECTIONS;
    if (!user?.developer) {
      sections = sections.filter((section) => section.key !== "developer");
    }
    if (!isAdminOfAnyEnterprise) {
      sections = sections.filter((section) => section.key !== "admin");
    }
    return sections;
  }, [user, isAdminOfAnyEnterprise]);

  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-screen fixed z-30 left-0 top-0 bg-[#0a0a0a]/95 backdrop-blur-md transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } border-r border-white/10`}
      >
        {/* Header */}
        <div
          className={`flex items-center border-b border-white/10 transition-all duration-300 ${
            sidebarOpen ? "p-4 justify-between" : "p-4 justify-center"
          }`}
          style={{ minHeight: "72px" }}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-white font-semibold text-lg">Thestral</span>
              </div>
              <button
                className="ml-auto p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Collapse sidebar"
              >
                <ChatGPTSidebarToggleLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Expand sidebar"
            >
              <ChatGPTSidebarToggleLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {filteredSidebarSections.map(
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
                className={`group flex items-center w-full gap-2.5 rounded-lg text-xs font-medium ${
                  showSection === key
                    ? "bg-white/10 text-white border border-white/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white/90"
                } ${
                  sidebarOpen
                    ? "px-3 py-2.5 justify-start"
                    : "h-10 justify-center"
                }`}
                onClick={() => router.push(`/dashboard?section=${key}`)}
              >
                <Icon className={`w-4 h-4 transition-colors ${
                  showSection === key ? "text-white" : "text-white/60"
                }`} />
                {sidebarOpen && <span className="truncate font-mono tracking-wider uppercase">{label}</span>}
              </button>
            )
          )}
        </nav>

        {/* User section */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className={`flex items-center gap-2.5 rounded-lg p-2.5 bg-white/5 border border-white/10 ${
            sidebarOpen ? "justify-start" : "justify-center"
          }`}>
            <img
              src={user.avatar_url}
              alt={user.name || user.login}
              className="w-6 h-6 rounded-full border border-white/20"
            />
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <div className="font-mono text-xs text-white/80 truncate">
                  {username || user.name || user.login}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-white/10 flex flex-col gap-0.5">
          <button
            onClick={() => router.push(`/dashboard?section=billing`)}
            className={`flex items-center gap-2.5 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-colors ${
              sidebarOpen ? "px-3 py-2 justify-start" : "h-9 justify-center"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {sidebarOpen && <span className="text-xs font-mono tracking-wider uppercase">BILLING</span>}
          </button>
          <button
            onClick={() => router.push(`/dashboard?section=settings`)}
            className={`flex items-center gap-2.5 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-colors ${
              sidebarOpen ? "px-3 py-2 justify-start" : "h-9 justify-center"
            }`}
          >
            <Settings className="w-4 h-4" />
            {sidebarOpen && <span className="text-xs font-mono tracking-wider uppercase">SETTINGS</span>}
          </button>
          <button
            onClick={logout}
            className={`flex items-center gap-2.5 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-colors ${
              sidebarOpen ? "px-3 py-2 justify-start" : "h-9 justify-center"
            }`}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="text-xs font-mono tracking-wider uppercase">LOGOUT</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarMobile && (
        <div className="fixed inset-0 z-40 flex">
          <div className="relative w-64 bg-[#0a0a0a]/95 backdrop-blur-md flex flex-col h-full border-r border-white/10">
            <div
              className="flex items-center gap-3 px-4 py-4 border-b border-white/10"
              style={{ minHeight: "72px" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-white font-semibold text-lg">Thestral</span>
              </div>
              <button
                className="ml-auto p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => setSidebarMobile(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-1">
              {filteredSidebarSections.map(
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
                    className={`group flex items-center w-full gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium ${
                      showSection === key
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white/90"
                    } justify-start`}
                    onClick={() => router.push(`/dashboard?section=${key}`)}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${
                      showSection === key ? "text-white" : "text-white/60"
                    }`} />
                    <span className="truncate font-mono tracking-wider uppercase">{label}</span>
                  </button>
                )
              )}
            </nav>
            <div className="mt-auto px-3 py-3 border-t border-white/10 flex flex-col gap-0.5">
                              <button
                  onClick={() => router.push(`/dashboard?section=billing`)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/60 hover:bg-white/5 hover:text-white justify-start"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-mono tracking-wider uppercase">BILLING</span>
                </button>
                <button
                  onClick={() => router.push(`/dashboard?section=settings`)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/60 hover:bg-white/5 hover:text-white justify-start"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-mono tracking-wider uppercase">SETTINGS</span>
                </button>
              <button
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/60 hover:bg-white/5 hover:text-white justify-start"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-mono tracking-wider uppercase">LOGOUT</span>
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

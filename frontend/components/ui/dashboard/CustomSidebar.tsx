"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Users, Folder, GitBranch, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomSidebarProps {
  user: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function CustomSidebar({
  user,
  activeTab,
  onTabChange,
  onLogout,
}: CustomSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const tabs = [
    { id: "repos", label: "Repos", icon: <Folder size={20} /> },
    { id: "orgs", label: "Orgs", icon: <Users size={20} /> },
    {
      id: "git-insights",
      label: "Git Insights",
      icon: <GitBranch size={20} />,
    },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[#18CCFC] text-black rounded-lg shadow-lg hover:bg-[#15b8e6] transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-80 bg-[#191919] border-r border-[#18CCFC] z-40 flex flex-col"
          >
            {/* User Profile Section */}
            <div className="p-6 border-b border-[#18CCFC]">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-full border-2 border-[#18CCFC]"
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {user.name || user.login}
                  </h3>
                  <p className="text-gray-400 text-sm">@{user.login}</p>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="flex-1 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-[#18CCFC] text-black font-semibold"
                        : "text-white hover:bg-[#18CCFC]/20 hover:text-[#18CCFC]"
                    )}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Logout Section */}
            <div className="p-4 border-t border-[#18CCFC]">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

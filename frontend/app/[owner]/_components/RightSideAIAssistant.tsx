import { useState, useEffect, useRef } from "react";
import { AIChatSection } from "./AIChatSection";

interface RightSideAIAssistantProps {
  owner: string;
  repo: string;
  selectedFilePath: string;
}

export const RightSideAIAssistant = ({
  owner,
  repo,
  selectedFilePath,
}: RightSideAIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-black/80 backdrop-blur-md hover:scale-105 transition-all duration-300 rounded-xl w-20 h-12 flex items-center justify-center border border-white/20 shadow-2xl"
          style={{ 
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.4)",
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)"
          }}
          onClick={() => setIsOpen(true)}
        >
          <span className="text-lg font-bold text-white tracking-tight">Mark</span>
        </button>
      )}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-[calc(100vh-32px)] z-50 border-l border-white/10 transition-all duration-500 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
        style={{
          width: "400px",
          maxWidth: "100vw",
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "15px 0 0 15px",
          margin: "16px 0 16px auto",
          boxShadow: "0 8px 64px 0 rgba(60, 60, 60, 0.8)",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-transparent relative">
          <button
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/15 transition-all duration-200"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI Assistant"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-current"
            >
              {/* Ominous close icon - three vertical bars */}
              <rect x="2" y="4" width="1" height="8" fill="currentColor" opacity="0.9" />
              <rect x="7" y="4" width="1" height="8" fill="currentColor" opacity="0.9" />
              <rect x="12" y="4" width="1" height="8" fill="currentColor" opacity="0.9" />
              
              {/* Subtle connecting lines */}
              <path
                d="M2 6L7 6M7 6L12 6M2 10L7 10M7 10L12 10"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeOpacity="0.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-white">
              Mark
            </h2>
          </div>
          <div className="w-8" />
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px-32px)] bg-transparent">
          <AIChatSection
            username={owner}
            repo={repo}
            selectedFilePath={selectedFilePath}
          />
        </div>
      </div>
    </>
  );
};

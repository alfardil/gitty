import { useState } from "react";
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

  return (
    <>
      {!isOpen && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-black/70 backdrop-blur-md hover:scale-105 transition-all rounded-lg w-20 h-12 flex items-center justify-center border-2 border-white/20 shadow-lg"
          style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)" }}
          onClick={() => setIsOpen(true)}
        >
          <span className="text-lg font-bold text-white">Mark</span>
        </button>
      )}
      <div
        className={`fixed top-0 right-0 h-[calc(100vh-32px)] z-50 border-l border-white/10 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          width: "400px",
          maxWidth: "100vw",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "2px solid rgba(255,255,255,0.18)",
          borderRadius: "32px 0 0 32px",
          margin: "16px 0 16px auto",
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-transparent relative">
          <div className="w-8" />
          <h2 className="flex-1 text-lg font-semibold text-white text-center">
            Meet Mark, your AI Assistant.
          </h2>
          <button
            className="text-white hover:text-gray-200 transition-colors p-2 rounded-full text-2xl"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI Assistant"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px-32px)] p-4 bg-transparent">
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

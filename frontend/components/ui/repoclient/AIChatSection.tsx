"use client";

import { FileSearch } from "lucide-react";
import FunctionAnalysisChat from "./FunctionAnalysisChat";

interface AIChatSectionProps {
  username: string;
  repo: string;
  fileContent?: string | null;
}

export function AIChatSection({ fileContent }: AIChatSectionProps) {
  return (
    <div className="flex flex-col h-full text-white/90 bg-black">
      {fileContent ? (
        <FunctionAnalysisChat fileContent={fileContent} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
          <div className="p-6 rounded-full bg-zinc-900/50 border border-white/10">
            <FileSearch className="w-10 h-10 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <p className="text-white text-xl font-semibold">No File Selected</p>
            <p className="text-zinc-500 text-base max-w-[280px]">
              Select a file from the explorer to analyze its functions and
              structure
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

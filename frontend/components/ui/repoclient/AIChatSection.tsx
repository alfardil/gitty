"use client";

import { FileSearch } from "lucide-react";
import FunctionAnalysisChat from "./FunctionAnalysisChat";
import { getGithubAccessTokenFromCookie } from "@/lib/fetchRepos";

interface AIChatSectionProps {
  username: string;
  repo: string;
  selectedFilePath: string;
}

export function AIChatSection({
  username,
  repo,
  selectedFilePath,
}: AIChatSectionProps) {
  const accessToken = getGithubAccessTokenFromCookie();

  if (!accessToken) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
        <div className="p-6 rounded-full bg-zinc-900/50 border border-white/10">
          <FileSearch className="w-10 h-10 text-indigo-500" />
        </div>
        <div className="space-y-3">
          <p className="text-white text-xl font-semibold">No GitHub Token</p>
          <p className="text-zinc-500 text-base max-w-[280px]">
            Please log in to GitHub to use the AI chat features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white/90 bg-black">
      <FunctionAnalysisChat
        owner={username}
        repo={repo}
        branch="main"
        accessToken={accessToken}
        selectedFilePath={selectedFilePath}
      />
    </div>
  );
}

"use client";

import { getGithubAccessTokenFromCookie } from "@/lib/utils/api/fetchRepos";
import { FileSearch } from "lucide-react";
import MarkChat from "./MarkChat";

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
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-4">
        <div className="p-6 rounded-lg border border-white/10 bg-white/5">
          <FileSearch className="w-8 h-8 text-white/60" />
        </div>
        <div className="space-y-2 max-w-[280px]">
          <p className="text-white text-lg font-medium">Access Denied</p>
          <p className="text-white/60 text-sm">
            Authentication required to proceed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white/90 bg-transparent">
      <MarkChat
        owner={username}
        repo={repo}
        branch="main"
        accessToken={accessToken}
        selectedFilePath={selectedFilePath}
      />
    </div>
  );
}

"use client";
import FunctionAnalysisChat from "@/components/ui/repoclient/FunctionAnalysisChat";

interface AIChatSectionProps {
  username: string;
  repo: string;
  fileContent?: string | null;
}

export function AIChatSection({
  username,
  repo,
  fileContent,
}: AIChatSectionProps) {
  return (
    <div className="w-[40%] flex flex-col">
      <div className="text-2xl font-bold mb-4">
        Ask about {username}/{repo}
      </div>
      <div className="bg-white rounded-xl shadow-lg p-8 border-4 border-black flex flex-col h-[800px]">
        {fileContent ? (
          <FunctionAnalysisChat fileContent={fileContent} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a file to analyze its functions
          </div>
        )}
      </div>
    </div>
  );
}

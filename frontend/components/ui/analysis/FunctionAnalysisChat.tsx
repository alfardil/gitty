"use client";

import { useAnalyze } from "@/lib/hooks/useAnalyze";
import { Bot } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "../neo/button";
import { Input } from "../neo/input";
import { CodeBlock } from "./CodeBlock";

interface FunctionAnalysisChatProps {
  owner: string;
  repo: string;
  branch?: string;
  accessToken: string;
  selectedFilePath: string;
}

export interface FunctionAnalysisChatRef {
  handleSubmit: (content: string) => void;
}

const FunctionAnalysisChat = forwardRef<
  FunctionAnalysisChatRef,
  FunctionAnalysisChatProps
>(({ owner, repo, branch = "main", accessToken, selectedFilePath }, ref) => {
  const [question, setQuestion] = useState("");
  const { analyzeRepoWithRAG, loading, error, response } = useAnalyze();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || !selectedFilePath) return;
    await analyzeRepoWithRAG({
      owner,
      repo,
      branch,
      accessToken,
      question,
      selectedFilePath,
    });
    setQuestion("");
  };

  useImperativeHandle(ref, () => ({
    handleSubmit: (content: string) => {
      setQuestion(content);
      handleSubmit();
    },
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Bot className="w-5 h-5 mt-1 text-red-400" />
            <div className="flex-1 text-sm text-red-200">{error}</div>
          </div>
        )}

        {!response && !error && !loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center mb-16">
            <div className="p-6 rounded-full bg-zinc-900/50 border border-white/10">
              <Bot className="w-10 h-10 text-indigo-500" />
            </div>
            <div className="space-y-3">
              <p className="text-white text-xl font-semibold">
                Ask me about this repository
              </p>
              <p className="text-zinc-500 text-base max-w-[280px]">
                I can help you understand the code structure, function
                parameters, and more.
              </p>
            </div>
          </div>
        )}

        {response && (
          <div className="prose prose-invert max-w-none">
            {response.split("```").map((part: string, index: number) => {
              if (index % 2 === 0) {
                // Regular text
                return (
                  <p key={index} className="text-white/90">
                    {part}
                  </p>
                );
              } else {
                // Code block
                const [lang, ...codeParts] = part.split("\n");
                const code = codeParts.join("\n").trim();
                return (
                  <CodeBlock
                    key={index}
                    code={code}
                    language={lang.trim() || "typescript"}
                  />
                );
              }
            })}
          </div>
        )}

        {loading && (
          <div className="flex items-start gap-3 px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-lg animate-pulse">
            <Bot className="w-5 h-5 mt-1 text-white/70" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 mt-8">
        <div className="flex gap-2">
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this repository..."
            disabled={loading}
            className="bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30"
          />
          <Button
            type="submit"
            disabled={loading}
            variant="default"
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            {loading ? "Analyzing..." : "Ask"}
          </Button>
        </div>
      </form>
    </div>
  );
});

FunctionAnalysisChat.displayName = "FunctionAnalysisChat";

export default FunctionAnalysisChat;

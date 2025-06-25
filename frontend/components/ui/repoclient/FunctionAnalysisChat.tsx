"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Bot, FileSearch } from "lucide-react";
import { useAnalyze } from "@/lib/hooks/useAnalyze";
import { CodeBlock } from "./CodeBlock";
import { Input } from "../neo/input";
import { Button } from "../neo/button";

interface FunctionAnalysisChatProps {
  fileContent: string | null;
}

export interface FunctionAnalysisChatRef {
  handleSubmit: (content: string) => void;
}

const FunctionAnalysisChat = forwardRef<
  FunctionAnalysisChatRef,
  FunctionAnalysisChatProps
>(({ fileContent }, ref) => {
  const [question, setQuestion] = useState("");
  const { analyzeFunction, loading, error, analysis, functionName } =
    useAnalyze();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || !fileContent) return;
    await analyzeFunction(question, fileContent);
    setQuestion("");
  };

  useImperativeHandle(ref, () => ({
    handleSubmit: (content: string) => {
      setQuestion(content);
      handleSubmit();
    },
  }));

  if (!fileContent) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Bot className="w-5 h-5 mt-1 text-red-400" />
            <div className="flex-1 text-sm text-red-200">{error}</div>
          </div>
        )}

        {!analysis && !error && !loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            <div className="p-6 rounded-full bg-zinc-900/50 border border-white/10">
              <Bot className="w-10 h-10 text-indigo-500" />
            </div>
            <div className="space-y-3">
              <p className="text-white text-xl font-semibold">
                Ask me about functions in this file
              </p>
              <p className="text-zinc-500 text-base max-w-[280px]">
                I can help you understand the code structure, function
                parameters, and more.
              </p>
            </div>
          </div>
        )}

        {functionName && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-200">
              Analyzing function:{" "}
              <code className="px-1 py-0.5 bg-indigo-500/20 rounded">
                {functionName}
              </code>
            </span>
          </div>
        )}

        {analysis && (
          <div className="prose prose-invert max-w-none">
            {analysis.split("```").map((part, index) => {
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

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about a function..."
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

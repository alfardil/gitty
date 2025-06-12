import { useState } from "react";
import { useAnalyze } from "@/lib/hooks/useAnalyze";
import { CodeBlock } from "./CodeBlock";
import { Input } from "../neo/input";
import { Button } from "../neo/button";

interface FunctionAnalysisChatProps {
  fileContent: string;
}

export default function FunctionAnalysisChat({
  fileContent,
}: FunctionAnalysisChatProps) {
  const [question, setQuestion] = useState("");
  const { analyzeFunction, loading, error, analysis, functionName } =
    useAnalyze();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    await analyzeFunction(question, fileContent);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
        )}
        {functionName && (
          <div className="text-sm text-gray-500">
            Analyzing function:{" "}
            <span className="font-mono">{functionName}</span>
          </div>
        )}
        {analysis && (
          <div className="prose max-w-none">
            {analysis.split("```").map((part, index) => {
              if (index % 2 === 0) {
                // Regular text
                return <p key={index}>{part}</p>;
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
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about a function..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading} variant="default">
            {loading ? "Analyzing..." : "Ask"}
          </Button>
        </div>
      </form>
    </div>
  );
}

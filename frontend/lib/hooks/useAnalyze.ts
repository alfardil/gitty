import { useState } from "react";

interface AnalyzeResponse {
  status:
    | "extracting"
    | "extracted"
    | "analyzing"
    | "analysis_chunk"
    | "complete";
  message?: string;
  function_name?: string;
  chunk?: string;
  error?: string;
}

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [functionName, setFunctionName] = useState<string | null>(null);

  const analyzeFunction = async (question: string, fileContent: string) => {
    setLoading(true);
    setError(null);
    setAnalysis("");
    setFunctionName(null);

    try {
      const response = await fetch("http://localhost:8000/chat/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          file_content: fileContent,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            switch (data.status) {
              case "extracting":
                setAnalysis("Extracting function name...");
                break;
              case "extracted":
                setFunctionName(data.function_name);
                setAnalysis("Function name extracted. Analyzing...");
                break;
              case "analyzing":
                setAnalysis("Analyzing function...");
                break;
              case "analysis_chunk":
                setAnalysis((prev) => prev + data.chunk);
                break;
              case "complete":
                setAnalysis((prev) => prev + data.analysis);
                break;
              case "error":
                throw new Error(data.error);
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeFunction,
    loading,
    error,
    analysis,
    functionName,
  };
}

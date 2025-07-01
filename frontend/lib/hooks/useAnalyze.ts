import { useState } from "react";
import { fetchFileTree, fetchFile } from "../fetchFile";

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");

  // Accept repo info, question, and selectedFilePath
  const analyzeRepoWithRAG = async ({
    owner,
    repo,
    branch = "main",
    accessToken,
    question,
    selectedFilePath,
  }: {
    owner: string;
    repo: string;
    branch?: string;
    accessToken: string;
    question: string;
    selectedFilePath: string;
  }) => {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      // 1. Get file tree
      const files = await fetchFileTree({ accessToken, owner, repo, branch });

      // 2. Fetch contents for each file (in parallel)
      const fileContents = await Promise.all(
        files.map(async (file: any) => {
          const content = await fetchFile({
            accessToken,
            owner,
            repo,
            branch,
            filePath: file.path,
          });
          return content ? { path: file.path, content } : null;
        })
      );

      // Filter out any nulls (files that couldn't be fetched)
      const validFiles = fileContents.filter(Boolean);

      // 3. Send to backend RAG endpoint (streaming)
      const baseUrl =
        process.env.NEXT_PUBLIC_API_DEV_URL ?? "https://gitty-api.fly.dev";
      const url = `${baseUrl}/chat/rag`;

      const ragResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          files: validFiles,
          selected_file_path: selectedFilePath,
        }),
      });

      if (!ragResponse.ok || !ragResponse.body) {
        throw new Error(`HTTP error! status: ${ragResponse.status}`);
      }

      // Streaming response handling
      const reader = ragResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.status === "llm_chunk" && data.chunk) {
                fullResponse += data.chunk;
              }
              if (data.status === "complete" && data.response) {
                fullResponse = data.response;
              }
              // Optionally handle other statuses for progress updates
            }
          }
        }
      }
      setResponse(fullResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeRepoWithRAG,
    loading,
    error,
    response,
  };
}

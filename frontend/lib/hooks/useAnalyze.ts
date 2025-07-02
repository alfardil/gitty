import { useState, useCallback } from "react";
import { fetchFileTree, fetchFile } from "../fetchFile";

interface StreamState {
  status:
    | "idle"
    | "embedding"
    | "embedded"
    | "retrieving"
    | "retrieved"
    | "llm_chunk"
    | "complete"
    | "error";
  message?: string;
  response?: string;
  error?: string;
}

interface StreamResponse {
  status: string;
  message?: string;
  chunk?: string;
  response?: string;
  error?: string;
}

export function useAnalyze() {
  const [state, setState] = useState<StreamState>({ status: "idle" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");

  // Accept repo info, question, and selectedFilePath
  const analyzeRepoWithRAG = useCallback(
    async ({
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
      setState({ status: "idle", message: "Preparing analysis..." });

      try {
        // 1. Get file tree
        setState({
          status: "idle",
          message: "Fetching repository files...",
        });
        const files = await fetchFileTree({ accessToken, owner, repo, branch });

        // 2. Fetch contents for each file (in parallel)
        setState({ status: "idle", message: "Loading file contents..." });
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

        const validFiles = fileContents.filter(Boolean);

        const baseUrl =
          process.env.NEXT_PUBLIC_API_DEV_URL ?? "https://gitty-api.fly.dev";
        const url = `${baseUrl}/chat/rag`;

        setState({ status: "idle", message: "Starting analysis..." });
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

        const reader = ragResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6)) as StreamResponse;

                    if (data.error) {
                      setState({
                        status: "error",
                        error: data.error,
                      });
                      setError(data.error);
                      return;
                    }

                    switch (data.status) {
                      case "embedding":
                        setState((prev) => ({
                          ...prev,
                          status: "embedding",
                          message: data.message || "Embedding files...",
                        }));
                        break;
                      case "embedded":
                        setState((prev) => ({
                          ...prev,
                          status: "embedding",
                          message:
                            data.message || "Files embedded successfully",
                        }));
                        break;
                      case "retrieving":
                        setState((prev) => ({
                          ...prev,
                          status: "retrieving",
                          message:
                            data.message || "Retrieving relevant chunks...",
                        }));
                        break;
                      case "retrieved":
                        setState((prev) => ({
                          ...prev,
                          status: "retrieving",
                          message: data.message || "Relevant chunks retrieved",
                        }));
                        break;
                      case "llm_chunk":
                        if (data.chunk) {
                          fullResponse += data.chunk;
                          setState((prev) => ({
                            ...prev,
                            status: "llm_chunk",
                            message: "Generating response...",
                            response: fullResponse,
                          }));
                          setResponse(fullResponse);
                        }
                        break;
                      case "complete":
                        if (data.response) {
                          fullResponse = data.response;
                        }
                        setState((prev) => ({
                          ...prev,
                          status: "complete",
                          message: "Analysis complete",
                          response: fullResponse,
                        }));
                        setResponse(fullResponse);
                        break;
                      case "error":
                        setState({
                          status: "error",
                          error: data.error || "An error occurred",
                        });
                        setError(data.error || "An error occurred");
                        break;
                    }
                  } catch (parseError) {
                    console.error("Error parsing SSE message:", parseError);
                    console.error("Problematic line:", line);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        };

        await processStream();
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "An error occurred";
        setError(errorMessage);
        setState({
          status: "error",
          error: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    analyzeRepoWithRAG,
    loading,
    error,
    response,
    state,
  };
}

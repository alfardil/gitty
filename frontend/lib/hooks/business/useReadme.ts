import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getGithubAccessTokenFromCookie } from "../../utils/api/fetchRepos";
import {
  getCachedReadme,
  getCachedReadmeInstructions,
  getLastReadmeGeneratedDate,
  cacheReadme,
} from "@/app/_actions/cache";

interface StreamState {
  status:
    | "idle"
    | "started"
    | "fetching"
    | "fetched"
    | "analyzing"
    | "generating"
    | "llm_chunk"
    | "complete"
    | "error";
  message?: string;
  readme?: string;
  error?: string;
  progress?: number;
  currentPhase?: "fetching" | "analyzing" | "generating" | "complete";
}

interface StreamResponse {
  status: StreamState["status"];
  message?: string;
  chunk?: string;
  readme?: string;
  error?: string;
}

export function useReadme(username: string, repo: string) {
  const [state, setState] = useState<StreamState>({ status: "idle" });
  const [readme, setReadme] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<
    "fetching" | "analyzing" | "generating" | "complete"
  >("fetching");
  const [currentInstructions, setCurrentInstructions] = useState<string>("");

  // Check for cached README on mount
  useEffect(() => {
    const checkCachedReadme = async () => {
      try {
        const cachedReadme = await getCachedReadme(username, repo);
        if (cachedReadme) {
          setReadme(cachedReadme);
          setState((prev) => ({
            ...prev,
            status: "complete",
            readme: cachedReadme,
          }));

          // Also load cached instructions if available
          const cachedInstructions = await getCachedReadmeInstructions(
            username,
            repo
          );
          if (cachedInstructions) {
            setCurrentInstructions(cachedInstructions);
            console.log("Cached instructions found:", cachedInstructions);
          }
        }
      } catch (error) {
        console.error("Error checking cached README:", error);
      }
    };

    void checkCachedReadme();
  }, [username, repo]);

  const generateReadme = useCallback(
    async (instructions: string = "") => {
      setCurrentInstructions(instructions);
      setState({
        status: "started",
        message: "Generating README...",
      });
      setLoading(true);
      setError("");

      const isProd = process.env.NODE_ENV === "production";

      const baseUrl = isProd
        ? process.env.NEXT_PUBLIC_API_DEV_URL
        : "http://localhost:8000";

      const url = `${baseUrl}/readme/generate/stream`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            repo,
            githubAccessToken: getGithubAccessTokenFromCookie() ?? "",
            instructions,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start streaming");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get reader");
        }

        let readmeContent = "";
        let phaseProgress = 0;

        const processStream = async () => {
          try {
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              buffer += chunk;

              // Process complete lines from the buffer
              const lines = buffer.split("\n");
              // Keep the last (potentially incomplete) line in the buffer
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const jsonData = line.slice(6).trim();

                  // Skip empty data lines
                  if (!jsonData) continue;

                  try {
                    const data = JSON.parse(jsonData) as StreamResponse;

                    if (data.error) {
                      setState({
                        status: "error",
                        error: data.error,
                      });
                      setError(data.error);
                      setLoading(false);
                      return;
                    }

                    switch (data.status) {
                      case "started":
                        setState((prev) => ({
                          ...prev,
                          status: "started",
                          message: data.message,
                          currentPhase: "fetching",
                          progress: 0,
                        }));
                        setCurrentPhase("fetching");
                        setProgress(0);
                        break;
                      case "fetching":
                        setState((prev) => ({
                          ...prev,
                          status: "fetching",
                          message: data.message,
                          currentPhase: "fetching",
                          progress: 10,
                        }));
                        setCurrentPhase("fetching");
                        setProgress(10);
                        break;
                      case "fetched":
                        setState((prev) => ({
                          ...prev,
                          status: "fetched",
                          message: data.message,
                          currentPhase: "analyzing",
                          progress: 30,
                        }));
                        setCurrentPhase("analyzing");
                        setProgress(30);
                        break;
                      case "analyzing":
                        setState((prev) => ({
                          ...prev,
                          status: "analyzing",
                          message: data.message,
                          currentPhase: "analyzing",
                          progress: 50,
                        }));
                        setCurrentPhase("analyzing");
                        setProgress(50);
                        break;
                      case "generating":
                        setState((prev) => ({
                          ...prev,
                          status: "generating",
                          message: data.message,
                          currentPhase: "generating",
                          progress: 70,
                        }));
                        setCurrentPhase("generating");
                        setProgress(70);
                        break;
                      case "llm_chunk":
                        if (data.chunk) {
                          readmeContent += data.chunk;
                          phaseProgress = Math.min(
                            95,
                            70 + (readmeContent.length / 1000) * 25
                          );
                          setState((prev) => ({
                            ...prev,
                            readme: readmeContent,
                            currentPhase: "generating",
                            progress: phaseProgress,
                          }));
                          setProgress(phaseProgress);
                        }
                        break;
                      case "complete":
                        const finalReadme = data.readme ?? readmeContent;
                        setState((prev) => ({
                          ...prev,
                          status: "complete",
                          readme: finalReadme,
                          currentPhase: "complete",
                          progress: 100,
                        }));
                        setCurrentPhase("complete");
                        setProgress(100);
                        setReadme(finalReadme);

                        // Cache the README to database
                        try {
                          await cacheReadme(
                            username,
                            repo,
                            finalReadme,
                            currentInstructions
                          );
                          console.log("README cached successfully");
                        } catch (cacheError) {
                          console.error("Failed to cache README:", cacheError);
                        }
                        break;
                      case "error":
                        setState({
                          status: "error",
                          error: data.error,
                        });
                        break;
                    }
                  } catch (error) {
                    // Only log parsing errors for non-empty data
                    if (jsonData) {
                      console.error(
                        "Error parsing SSE message:",
                        error,
                        "Data:",
                        jsonData
                      );
                    }
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        };
        await processStream();
      } catch (error) {
        setState({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    },
    [username, repo]
  );

  const getCost = useCallback(
    async (instructions: string = "") => {
      setCost("");
      setError("");

      const isProd = process.env.NODE_ENV === "production";

      const baseUrl = isProd
        ? process.env.NEXT_PUBLIC_API_DEV_URL
        : "http://localhost:8000";

      const url = `${baseUrl}/readme/cost`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            repo,
            githubAccessToken: getGithubAccessTokenFromCookie() ?? "",
            instructions,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get cost estimate");
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setCost(data.cost ?? "");
      } catch (error) {
        console.error("Error getting cost:", error);
        setError("Failed to get cost estimate");
      }
    },
    [username, repo]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(readme);
      toast.success("README copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setError("Failed to copy to clipboard. Please try again.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    readme,
    error,
    loading,
    cost,
    handleGenerate: generateReadme,
    handleGetCost: getCost,
    handleCopy,
    handleDownload,
    state,
    progress,
    currentPhase,
  };
}

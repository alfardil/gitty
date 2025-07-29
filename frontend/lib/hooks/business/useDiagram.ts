import { useCallback, useEffect, useState } from "react";
import { getCost } from "../../utils/api/fetchBackend";
import { toast } from "sonner";
import {
  cacheDiagramAndExplanation,
  getCachedDiagram,
  getLastGeneratedDate,
  getCachedExplanation,
} from "@/app/_actions/cache";
import { getGithubAccessTokenFromCookie } from "../../utils/api/fetchRepos";

interface StreamState {
  status:
    | "idle"
    | "started"
    | "explanation_sent"
    | "explanation"
    | "explanation_chunk"
    | "mapping_sent"
    | "mapping"
    | "mapping_chunk"
    | "diagram_sent"
    | "diagram"
    | "diagram_chunk"
    | "complete"
    | "error";
  message?: string;
  explanation?: string;
  mapping?: string;
  diagram?: string;
  error?: string;
  progress?: number;
  currentPhase?: "explanation" | "mapping" | "diagram" | "complete";
}

interface StreamResponse {
  status: StreamState["status"];
  message?: string;
  chunk?: string;
  explanation?: string;
  mapping?: string;
  diagram?: string;
  error?: string;
}

export function useDiagram(username: string, repo: string) {
  const [state, setState] = useState<StreamState>({ status: "idle" });
  const [diagram, setDiagram] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastGenerated, setLastGenerated] = useState<Date | undefined>();
  const [progress, setProgress] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<
    "explanation" | "mapping" | "diagram" | "complete"
  >("explanation");

  const generateDiagram = useCallback(
    async (instructions: string = "") => {
      setState({
        status: "started",
        message: "Generating diagram...",
      });

      const isProd = process.env.NODE_ENV === "production";

      const baseUrl = isProd
        ? process.env.NEXT_PUBLIC_API_DEV_URL
        : "http://localhost:8000";

      const url = `${baseUrl}/generate/stream`;

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

        let explanation = "";
        let mapping = "";
        let diagram = "";
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
                          currentPhase: "explanation",
                          progress: 0,
                        }));
                        setCurrentPhase("explanation");
                        setProgress(0);
                        break;
                      case "explanation_sent":
                        setState((prev) => ({
                          ...prev,
                          status: "explanation_sent",
                          message: data.message,
                          currentPhase: "explanation",
                          progress: 10,
                        }));
                        setCurrentPhase("explanation");
                        setProgress(10);
                        break;
                      case "explanation":
                        setState((prev) => ({
                          ...prev,
                          status: "explanation",
                          explanation: data.message,
                          currentPhase: "explanation",
                          progress: 20,
                        }));
                        setCurrentPhase("explanation");
                        setProgress(20);
                        break;
                      case "explanation_chunk":
                        if (data.chunk) {
                          explanation += data.chunk;
                          phaseProgress = Math.min(
                            90,
                            20 + (explanation.length / 1000) * 30
                          );
                          setState((prev) => ({
                            ...prev,
                            explanation,
                            currentPhase: "explanation",
                            progress: phaseProgress,
                          }));
                          setProgress(phaseProgress);
                        }
                        break;
                      case "mapping_sent":
                        setState((prev) => ({
                          ...prev,
                          status: "mapping_sent",
                          message: data.message,
                          currentPhase: "mapping",
                          progress: 35,
                        }));
                        setCurrentPhase("mapping");
                        setProgress(35);
                        break;
                      case "mapping":
                        setState((prev) => ({
                          ...prev,
                          status: "mapping",
                          mapping: data.message,
                          currentPhase: "mapping",
                          progress: 40,
                        }));
                        setCurrentPhase("mapping");
                        setProgress(40);
                        break;
                      case "mapping_chunk":
                        if (data.chunk) {
                          mapping += data.chunk;
                          phaseProgress = Math.min(
                            65,
                            40 + (mapping.length / 500) * 25
                          );
                          setState((prev) => ({
                            ...prev,
                            mapping,
                            currentPhase: "mapping",
                            progress: phaseProgress,
                          }));
                          setProgress(phaseProgress);
                        }
                        break;
                      case "diagram_sent":
                        setState((prev) => ({
                          ...prev,
                          status: "diagram_sent",
                          message: data.message,
                          currentPhase: "diagram",
                          progress: 70,
                        }));
                        setCurrentPhase("diagram");
                        setProgress(70);
                        break;
                      case "diagram":
                        setState((prev) => ({
                          ...prev,
                          status: "diagram",
                          diagram: data.message,
                          currentPhase: "diagram",
                          progress: 75,
                        }));
                        setCurrentPhase("diagram");
                        setProgress(75);
                        break;
                      case "diagram_chunk":
                        if (data.chunk) {
                          diagram += data.chunk;
                          phaseProgress = Math.min(
                            95,
                            75 + (diagram.length / 2000) * 20
                          );
                          setState((prev) => ({
                            ...prev,
                            diagram,
                            currentPhase: "diagram",
                            progress: phaseProgress,
                          }));
                          setProgress(phaseProgress);
                        }
                        break;
                      case "complete":
                        setState((prev) => ({
                          ...prev,
                          status: "complete",
                          explanation: data.explanation ?? prev.explanation,
                          mapping: data.mapping ?? prev.mapping,
                          diagram: data.diagram ?? prev.diagram,
                          currentPhase: "complete",
                          progress: 100,
                        }));
                        setCurrentPhase("complete");
                        setProgress(100);
                        const date = await getLastGeneratedDate(username, repo);
                        setLastGenerated(date ? new Date(date) : undefined);
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
        setLoading(false);
      }
    },
    [username, repo]
  );

  useEffect(() => {
    if (state.status === "complete" && state.diagram) {
      void cacheDiagramAndExplanation(
        username,
        repo,
        state.diagram,
        state.explanation || ""
      );
      setDiagram(state.diagram);
      void getLastGeneratedDate(username, repo).then((date) =>
        setLastGenerated(date ? new Date(date) : undefined)
      );
    } else if (state.status === "error") {
      setLoading(false);
    }
  }, [state.status, state.diagram]);

  const getDiagram = useCallback(async () => {
    setLoading(true);
    setError("");
    setCost("");

    try {
      // Check cache first - always allow access to cached diagrams
      const cached = await getCachedDiagram(username, repo);

      if (cached) {
        setDiagram(cached);
        const explanation = await getCachedExplanation(username, repo);
        setState((prev) => ({
          ...prev,
          status: "complete",
          explanation: explanation || "",
        }));
        const date = await getLastGeneratedDate(username, repo);
        setLastGenerated(date ? new Date(date) : undefined);
        setLoading(false);
        return;
      }

      const githubAccessToken = getGithubAccessTokenFromCookie();
      const costEstimate = await getCost(
        username,
        repo,
        githubAccessToken ?? "",
        ""
      );

      if (costEstimate.error) {
        console.error("Cost estimation failed: ", costEstimate.error);
        setError(costEstimate.error);
        return;
      }

      setCost(costEstimate.cost ?? "");

      await generateDiagram("");
    } catch (error) {
      console.error("Error getting diagram:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [username, repo, generateDiagram]);

  useEffect(() => {
    void getDiagram();
  }, [getDiagram]);

  const handleModify = async (instructions: string) => {
    setLoading(true);
    setError("");
    setCost("");
    try {
      // Start streaming generation with instructions
      await generateDiagram(instructions);
    } catch (error) {
      console.error("Error modifying diagram:", error);
      setError("Failed to modify diagram. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (instructions: string) => {
    setLoading(true);
    setError("");
    setCost("");
    try {
      const githubAccessToken = getGithubAccessTokenFromCookie();
      const costEstimate = await getCost(
        username,
        repo,
        githubAccessToken ?? "",
        ""
      );

      if (costEstimate.error) {
        console.error("Cost estimation failed:", costEstimate.error);
        setError(costEstimate.error);
        return;
      }

      setCost(costEstimate.cost ?? "");

      // Start streaming generation with instructions
      await generateDiagram(instructions);
    } catch (error) {
      console.error("Error regenerating diagram:", error);
      setError("Failed to regenerate diagram. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagram);
      toast.success("Diagram copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setError("Failed to copy to clipboard. Please try again.");
    }
  };

  const handleExportImage = () => {
    const svgElement = document.querySelector(".mermaid svg");
    if (!(svgElement instanceof SVGSVGElement)) return;

    try {
      const canvas = document.createElement("canvas");
      const scale = 4;

      const bbox = svgElement.getBBox();
      const transform = svgElement.getScreenCTM();
      if (!transform) return;

      const width = Math.ceil(bbox.width * transform.a);
      const height = Math.ceil(bbox.height * transform.d);
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();

      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);

        const a = document.createElement("a");
        a.download = "diagram.png";
        a.href = canvas.toDataURL("image/png", 1.0);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error("Error generating PNG:", error);
    }
  };

  return {
    diagram,
    error,
    loading,
    lastGenerated,
    cost,
    handleModify,
    handleRegenerate,
    handleCopy,
    handleExportImage,
    state,
    progress,
    currentPhase,
  };
}

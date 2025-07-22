import { useCallback, useEffect, useState } from "react";
import { getCost } from "../fetchBackend";
import { toast } from "sonner";
import {
  cacheDiagramAndExplanation,
  getCachedDiagram,
  getLastGeneratedDate,
  getCachedExplanation,
} from "@/app/_actions/cache";
import { getGithubAccessTokenFromCookie } from "../fetchRepos";

interface NonStreamState {
  status: "idle" | "loading" | "complete" | "error";
  message?: string;
  explanation?: string;
  mapping?: string;
  diagram?: string;
  error?: string;
}

interface NonStreamResponse {
  status: string;
  message?: string;
  explanation?: string;
  mapping?: string;
  diagram?: string;
  error?: string;
}

export function useNonStreamDiagram(username: string, repo: string) {
  const [state, setState] = useState<NonStreamState>({ status: "idle" });
  const [diagram, setDiagram] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastGenerated, setLastGenerated] = useState<Date | undefined>();

  const generateDiagram = useCallback(
    async (instructions: string = "") => {
      setState({
        status: "loading",
        message: "Generating diagram...",
      });

      const isProd = process.env.NODE_ENV === "production";

      const baseUrl = isProd
        ? process.env.NEXT_PUBLIC_API_DEV_URL
        : "http://localhost:8000";

      const url = `${baseUrl}/generate/non-stream`;

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
          throw new Error("Failed to generate diagram");
        }

        const data = (await response.json()) as NonStreamResponse;

        if (data.error) {
          setState({
            status: "error",
            error: data.error,
          });
          setError(data.error);
          setLoading(false);
          return;
        }

        if (data.status === "complete") {
          setState({
            status: "complete",
            explanation: data.explanation,
            mapping: data.mapping,
            diagram: data.diagram,
          });
        } else {
          setState({
            status: "error",
            error: "Unexpected response status",
          });
          setError("Unexpected response status");
          setLoading(false);
        }
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
      setLoading(false);
    } else if (state.status === "error") {
      setLoading(false);
    }
  }, [state.status, state.diagram, username, repo]);

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
      // Start non-streaming generation with instructions
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

      // Start non-streaming generation with instructions
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
  };
}

import React, { useState, useEffect } from "react";
import { useReadme } from "@/lib/hooks/business/useReadme";
import { ReadmeGenerationProgress } from "@/components/ui/readme/ReadmeGenerationProgress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/neo/textarea";
import { Card } from "@/components/ui/card";
import { Copy, Download, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getLastReadmeGeneratedDate } from "@/app/_actions/cache";
import { toast } from "sonner";

// Custom Badge component for README badges
const Badge = ({ children, ...props }: any) => {
  // Extract badge text from markdown image syntax
  const badgeText =
    typeof children === "string"
      ? children.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      : children;

  return (
    <span
      className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-md mr-2 mb-2 font-mono"
      {...props}
    >
      {badgeText}
    </span>
  );
};

interface ReadmeSectionProps {
  username: string;
  repo: string;
}

export function ReadmeSection({ username, repo }: ReadmeSectionProps) {
  const {
    readme,
    error,
    loading,
    cost,
    handleGenerate,
    handleGetCost,
    handleCopy,
    handleDownload,
    state,
    progress,
    currentPhase,
  } = useReadme(username, repo);

  const [instructions, setInstructions] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | undefined>();
  const [wasJustGenerated, setWasJustGenerated] = useState(false);

  // Get last generated date when README is loaded
  useEffect(() => {
    const getLastGenerated = async () => {
      if (readme && state.status === "complete") {
        try {
          const date = await getLastReadmeGeneratedDate(username, repo);
          setLastGenerated(date ? new Date(date) : undefined);
        } catch (error) {
          console.error("Error getting last generated date:", error);
        }
      }
    };

    void getLastGenerated();
  }, [readme, state.status, username, repo]);

  // Show success toast only when README is newly generated
  useEffect(() => {
    if (readme && state.status === "complete" && wasJustGenerated) {
      setWasJustGenerated(false);
      toast.success("README generated and saved successfully!");
    }
  }, [readme, state.status, wasJustGenerated]);

  const handleGenerateClick = async () => {
    setWasJustGenerated(true);
    await handleGenerate(instructions);
  };

  const handleGetCostClick = async () => {
    await handleGetCost(instructions);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white font-mono tracking-wide">
            README Generator
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {cost && (
            <span className="text-sm text-white/60 font-mono">
              Estimated cost: {cost}
            </span>
          )}
        </div>
      </div>

      {/* Instructions Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-blue-400 hover:text-blue-300 font-mono text-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {showInstructions ? "Hide" : "Add"} Custom Instructions
        </Button>
      </div>

      {/* Custom Instructions */}
      {showInstructions && (
        <Card className="p-4 bg-[#0a0a0a] border border-white/10">
          <label className="block text-sm font-medium text-white/90 mb-2 font-mono">
            Custom Instructions (Optional)
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add specific instructions for README generation (e.g., focus on API documentation, include deployment instructions, etc.)"
            className="w-full min-h-[100px] bg-[#0a0a0a] border border-white/10 text-white placeholder:text-white/50 focus:border-blue-400/50"
          />
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerateClick}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm"
        >
          {loading ? "Generating..." : "Generate README"}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-6 text-red-400 font-mono text-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="font-semibold">Error</span>
          </div>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <ReadmeGenerationProgress
          currentPhase={currentPhase}
          progress={progress}
          message={state.message}
        />
      )}

      {/* Generated README */}
      {readme && state.status === "complete" && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-mono text-xs"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-mono text-xs"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* README Content */}
          <Card className="p-8 bg-[#0a0a0a] border border-white/10 shadow-lg">
            {/* Last Generated Timestamp */}
            {lastGenerated && (
              <div className="text-xs text-white/40 mb-4 text-center font-mono tracking-wider border-b border-white/10 pb-2">
                Last generated: {lastGenerated.toLocaleString()}
              </div>
            )}
            <div className="max-w-none max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <ReactMarkdown
                components={{
                  h1: ({ children, ...props }: any) => (
                    <h1
                      className="text-xl font-semibold text-white mb-4 mt-6 first:mt-0 border-b border-white/10 pb-2 font-mono tracking-wide"
                      {...props}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }: any) => (
                    <h2
                      className="text-lg font-semibold text-white mb-3 mt-5 first:mt-0 font-mono tracking-wide"
                      {...props}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }: any) => (
                    <h3
                      className="text-base font-semibold text-white mb-2 mt-4 first:mt-0 font-mono tracking-wide"
                      {...props}
                    >
                      {children}
                    </h3>
                  ),
                  p: ({ children, ...props }: any) => (
                    <p
                      className="text-white/90 leading-relaxed mb-4 last:mb-0 text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }: any) => (
                    <ul
                      className="space-y-2 mb-4 text-white/80 text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }: any) => (
                    <ol
                      className="space-y-2 mb-4 text-white/80 text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }: any) => (
                    <li
                      className="text-white/80 leading-relaxed text-sm flex items-start font-mono"
                      {...props}
                    >
                      <span className="text-white/60 mr-2">•</span>
                      <span className="flex-1">{children}</span>
                    </li>
                  ),
                  strong: ({ children, ...props }: any) => (
                    <strong className="font-semibold text-white" {...props}>
                      {children}
                    </strong>
                  ),
                  em: ({ children, ...props }: any) => (
                    <em className="text-white/90 italic" {...props}>
                      {children}
                    </em>
                  ),
                  code: ({
                    node,
                    inline,
                    className,
                    children,
                    ...props
                  }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <pre
                        className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 overflow-x-auto mb-4"
                        {...props}
                      >
                        <code
                          className={`language-${match[1]} text-sm font-mono`}
                        >
                          {String(children).replace(/\n$/, "")}
                        </code>
                      </pre>
                    ) : (
                      <code
                        className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children, ...props }: any) => (
                    <blockquote
                      className="border-l-2 border-white/20 pl-3 py-2 my-4 bg-white/5 rounded-r text-sm italic"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                  hr: ({ ...props }: any) => (
                    <hr className="border-white/10 my-6" {...props} />
                  ),
                  a: ({ children, href, ...props }: any) => (
                    <a
                      href={href}
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt, ...props }: any) => (
                    <img
                      src={src}
                      alt={alt}
                      className="max-w-full h-auto rounded-lg border border-white/10 my-4"
                      {...props}
                    />
                  ),
                  table: ({ children, ...props }: any) => (
                    <div className="overflow-x-auto my-4">
                      <table
                        className="min-w-full border border-white/10 rounded-lg"
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }: any) => (
                    <th
                      className="border border-white/10 px-4 py-2 text-left text-white font-semibold bg-white/5"
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }: any) => (
                    <td
                      className="border border-white/10 px-4 py-2 text-white/80"
                      {...props}
                    >
                      {children}
                    </td>
                  ),
                  // Custom component for badges
                  span: ({ children, className, ...props }: any) => {
                    // Check if this looks like a badge
                    if (
                      typeof children === "string" &&
                      children.includes("![") &&
                      children.includes("](")
                    ) {
                      return <Badge {...props}>{children}</Badge>;
                    }
                    return (
                      <span className={className} {...props}>
                        {children}
                      </span>
                    );
                  },
                }}
              >
                {readme}
              </ReactMarkdown>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && !readme && !error && (
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] border border-white/10 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-2 font-mono tracking-wide">
            No README Generated Yet
          </h3>
          <p className="text-white/60 text-sm font-mono">
            Click &quot;Generate README&quot; to create a comprehensive README
            for this repository.
          </p>
        </div>
      )}
    </div>
  );
}

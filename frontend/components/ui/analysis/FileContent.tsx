"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Spinner } from "../neo/spinner";
import type { CSSProperties } from "react";

// Custom style to handle line wrapping while preserving indentation
const customStyle = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
};

function getLanguageFromExtension(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) return "text";
  if (["js", "jsx"].includes(ext)) return "javascript";
  if (["ts", "tsx"].includes(ext)) return "typescript";
  if (["py"].includes(ext)) return "python";
  if (["java"].includes(ext)) return "java";
  if (["rb"].includes(ext)) return "ruby";
  if (["go"].includes(ext)) return "go";
  if (["rs"].includes(ext)) return "rust";
  if (["json"].includes(ext)) return "json";
  if (["md"].includes(ext)) return "markdown";
  if (["css"].includes(ext)) return "css";
  if (["html", "htm"].includes(ext)) return "html";
  if (["sh", "bash", "makefile", "Makefile"].includes(ext)) return "makefile";
  if (["yml", "yaml"].includes(ext)) return "yaml";
  if (["c"].includes(ext)) return "c";
  if (["cpp", "cc", "cxx", "hpp", "h"].includes(ext)) return "cpp";
  if (["php"].includes(ext)) return "php";
  if (["swift"].includes(ext)) return "swift";
  if (["kt", "kts"].includes(ext)) return "kotlin";
  if (["pl"].includes(ext)) return "perl";
  if (["xml"].includes(ext)) return "xml";
  return "text";
}

export interface FileContentProps {
  selectedFile: string | null;
  fileContent: string | null;
  loading: boolean;
}

export function FileContent({
  selectedFile,
  fileContent,
  loading,
}: FileContentProps) {
  if (!selectedFile) return null;

  const language = getLanguageFromExtension(selectedFile);
  const isMarkdown = language === "markdown";

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      {/* File Path Display */}
      <div className="sticky top-0 z-10 px-6 py-3 text-sm text-gray-300 border-b border-gray-700 bg-[#252526] flex items-center justify-between">
        <span className="truncate">{selectedFile}</span>
        <span className="text-xs text-gray-500 ml-2">{language}</span>
      </div>

      <div className="flex-1 overflow-auto relative">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="relative">
            <SyntaxHighlighter
              language={language}
              style={customStyle}
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "#1E1E1E",
                minHeight: "100%",
                width: "100%",
              }}
              codeTagProps={{
                style: {
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  display: "inline-block",
                  width: "100%",
                },
              }}
              className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              showLineNumbers
              wrapLongLines={true}
              lineNumberStyle={{
                minWidth: "3em",
                paddingRight: "1em",
                textAlign: "right",
                userSelect: "none",
                color: "#6e7681",
                borderRight: "1px solid #30363d",
                marginRight: "1em",
              }}
              lineProps={{
                style: {
                  display: "block",
                  width: "fit-content",
                  minWidth: "100%",
                  wordBreak: "break-word",
                } as CSSProperties,
              }}
            >
              {fileContent || ""}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}

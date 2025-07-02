"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="relative rounded-lg overflow-hidden my-4">
      <div className="absolute top-0 right-0 px-4 py-1 text-xs text-white/50 bg-white/5 rounded-bl">
        {language}
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          background: "#18181B",
        }}
        className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

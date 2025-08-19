"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Spinner } from "../neo/spinner";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

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
  if (["sh", "bash"].includes(ext)) return "bash";
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

export function FileTree({
  tree,
  onFileClick,
  selectedFile,
  expanded,
  setExpanded,
}: {
  tree: FileNode[];
  onFileClick: (path: string) => void;
  selectedFile: string | null;
  expanded: { [key: string]: boolean };
  setExpanded: (expanded: { [key: string]: boolean }) => void;
}) {
  const renderNode = (node: FileNode, depth: number = 0) => {
    const isFolder = node.type === "folder";
    const isExpanded = expanded[node.path];
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`
            group flex items-center gap-2 py-1 cursor-pointer
            hover:bg-white/5 transition-colors relative
            ${isSelected ? "bg-white/10" : ""}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            if (isFolder) {
              setExpanded({ ...expanded, [node.path]: !isExpanded });
            } else {
              onFileClick(node.path);
            }
          }}
        >
          {isFolder && (
            <ChevronRight
              className={`w-3 h-3 text-white/40 transition-transform flex-shrink-0
                ${isExpanded ? "rotate-90" : ""}
              `}
            />
          )}
          <span className={`truncate z-10 text-xs font-mono text-white/70 ${isFolder ? "font-medium" : ""}`}>
            {node.name}
          </span>

          <div className="absolute inset-0 pointer-events-none bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="select-none py-2">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}

export function buildFileTree(files: { path: string }[]): FileNode[] {
  const root: { [key: string]: any } = {};

  files.forEach((file) => {
    const parts = file.path.split("/");
    let node = root;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        node[part] = { type: "file", name: part, path: file.path };
      } else {
        node[part] = node[part] || {
          type: "folder",
          name: part,
          path: parts.slice(0, idx + 1).join("/"),
          children: {},
        };
        node = node[part].children;
      }
    });
  });

  function convertToArray(obj: { [key: string]: any }): FileNode[] {
    return Object.entries(obj)
      .map(([name, node]) => {
        if (node.type === "file") {
          return {
            name: node.name,
            path: node.path,
            type: "file" as const,
          };
        } else {
          return {
            name: node.name,
            path: node.path,
            type: "folder" as const,
            children: convertToArray(node.children),
          };
        }
      })
      .sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return convertToArray(root);
}

export function FileContent({
  selectedFile,
  fileContent,
  loading,
}: {
  selectedFile: string | null;
  fileContent: string | null;
  loading: boolean;
}) {
  if (!selectedFile) return null;

  return (
    <div className="space-y-4">
      <div className="px-6 py-3 text-sm text-gray-500 border-b border-gray-200">
        {selectedFile}
      </div>

      <div className="px-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <pre className="text-sm overflow-x-auto">
            <code>{fileContent}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

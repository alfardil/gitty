"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type FileTreeNode =
  | { [key: string]: FileTreeNode }
  | { __file: true; path: string };

interface FileTreeProps {
  tree: FileTreeNode;
  onFileClick: (filePath: string) => void;
  selectedFile: string | null;
  expanded: { [key: string]: boolean };
  setExpanded: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  parentPath?: string;
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
  parentPath = "",
}: FileTreeProps) {
  return (
    <ul className="text-sm">
      {Object.entries(tree).map(([name, value]) => {
        const isFile = (value as any).__file;
        const fullPath = parentPath ? `${parentPath}/${name}` : name;
        if (isFile) {
          return (
            <li
              key={fullPath}
              className={`py-1 pl-4 border-b last:border-b-0 border-gray-200 cursor-pointer hover:bg-blue-100 ${
                selectedFile === (value as any).path
                  ? "font-bold text-blue-700"
                  : ""
              }`}
              onClick={() => onFileClick((value as any).path)}
            >
              {name}
            </li>
          );
        } else {
          const isOpen = expanded[fullPath];
          return (
            <li
              key={fullPath}
              className="py-1 border-b last:border-b-0 border-gray-200"
            >
              <div
                className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 pl-1"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [fullPath]: !isOpen }))
                }
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-semibold">{name}</span>
              </div>
              {isOpen && (
                <div className="pl-4">
                  <FileTree
                    tree={value as FileTreeNode}
                    onFileClick={onFileClick}
                    selectedFile={selectedFile}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    parentPath={fullPath}
                  />
                </div>
              )}
            </li>
          );
        }
      })}
    </ul>
  );
}

// Helper to build a nested tree from the flat file list
export function buildFileTree(files: { path: string }[]) {
  const root: any = {};
  files.forEach((file) => {
    const parts = file.path.split("/");
    let node = root;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        node[part] = { __file: true, path: file.path };
      } else {
        node[part] = node[part] || {};
        node = node[part];
      }
    });
  });
  return root;
}

interface FileContentProps {
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

  return (
    <div className="mt-6">
      <div className="font-semibold mb-2 break-all">{selectedFile}</div>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : fileContent ? (
        <SyntaxHighlighter
          language={getLanguageFromExtension(selectedFile)}
          style={vscDarkPlus}
          customStyle={{ borderRadius: 8, fontSize: 13, padding: 16 }}
          showLineNumbers
        >
          {fileContent}
        </SyntaxHighlighter>
      ) : null}
    </div>
  );
}

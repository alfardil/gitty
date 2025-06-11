"use client";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { fetchFile } from "@/lib/fetchFile";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useDiagram } from "@/lib/hooks/useDiagram";
import MermaidDiagram from "@/components/MermaidDiagram";
import { Spinner } from "@/components/ui/neo/spinner";
import { getCachedDiagram, getLastGeneratedDate } from "@/app/_actions/cache";

// Helper to build a nested tree from the flat file list
function buildFileTree(files: { path: string }[]) {
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

type FileTreeNode =
  | { [key: string]: FileTreeNode }
  | { __file: true; path: string };
type FileTreeProps = {
  tree: FileTreeNode;
  onFileClick: (filePath: string) => void;
  selectedFile: string | null;
  expanded: { [key: string]: boolean };
  setExpanded: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  parentPath?: string;
};

function FileTree({
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

export default function RepoClientPage({
  owner,
  repo,
  fileTree,
}: {
  owner: string;
  repo: string;
  fileTree: any[];
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top button when scrolled down (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFileClick = async (filePath: string) => {
    setSelectedFile(filePath);
    setFileContent(null);
    setLoading(true);
    try {
      // Get access token from cookies (client-side)
      const match = document.cookie.match(
        /(?:^|; )github_access_token=([^;]*)/
      );
      const accessToken = match ? decodeURIComponent(match[1]) : "";
      const content = await fetchFile({
        accessToken,
        owner,
        repo,
        filePath,
      });
      setFileContent(content);
    } catch (e) {
      setFileContent("Error loading file contents");
    } finally {
      setLoading(false);
    }
  };

  const tree = buildFileTree(fileTree || []);

  return (
    <div className="min-h-screen bg-primary relative">
      <Header />
      <div className="flex flex-row w-full max-w-7xl mx-auto pt-32 gap-8 px-4">
        {/* Main content: Diagram + file tree + file content */}
        <div className="w-[70%] bg-white rounded-xl shadow-lg p-8 border-4 border-black flex flex-col gap-6 min-w-[500px]">
          <div className="text-2xl font-bold mb-4">
            System Design Diagram for {owner}/{repo}
          </div>
          {/* Diagram generation */}
          <DiagramSection owner={owner} repo={repo} />
          <div>
            <div className="font-semibold mb-2">Files in this repository:</div>
            <div className="max-h-[520px] overflow-y-auto border rounded p-4 bg-gray-50">
              {fileTree.length === 0 ? (
                <div className="text-gray-400">
                  No files found or unable to fetch file tree.
                </div>
              ) : (
                <FileTree
                  tree={tree}
                  onFileClick={handleFileClick}
                  selectedFile={selectedFile}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              )}
            </div>
            {/* File content display below file tree */}
            {selectedFile && (
              <div className="mt-6">
                <div className="font-semibold mb-2 break-all">
                  {selectedFile}
                </div>
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
            )}
          </div>
        </div>

        {/* Chat placeholder - fixed height */}
        <div className="w-[40%] flex flex-col">
          <div className="text-2xl font-bold mb-4">
            AI Chat for {owner}/{repo}
          </div>
          <div className="text-gray-400">
            Chat with an AI about this repo here.
          </div>
          <div
            className="bg-white rounded-xl shadow-lg p-8 border-4 border-black flex flex-col items-center justify-center"
            style={{ minHeight: 320, maxHeight: 400 }}
          >
            <div className="text-lg font-semibold mb-2">
              AI Chat (coming soon)
            </div>
            <div className="text-gray-400">
              Chat with an AI about this repo here.
            </div>
          </div>
        </div>
      </div>
      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-blue-500 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center transition-all"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

function DiagramSection({ owner, repo }: { owner: string; repo: string }) {
  const { diagram, loading, error, state } = useDiagram(owner, repo);
  const [cachedDiagram, setCachedDiagram] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | undefined>();

  useEffect(() => {
    const checkCache = async () => {
      const cached = await getCachedDiagram(owner, repo);
      if (cached) {
        setCachedDiagram(cached);
        const date = await getLastGeneratedDate(owner, repo);
        setLastGenerated(date ?? undefined);
      }
    };
    void checkCache();
  }, [owner, repo]);

  const isComplete = state?.status === "complete" && !!diagram;
  const displayDiagram = cachedDiagram || diagram;

  return (
    <div className="bg-gray-100 border border-gray-300 rounded p-8 mb-6 text-center min-h-[120px] flex items-center justify-center">
      {loading ? (
        <Spinner>
          <div className="mt-2 text-gray-600">Generating diagram...</div>
          <div className="mt-1 text-gray-500 text-sm">
            Please allow a few seconds for the diagram of your project to
            generate.
          </div>
        </Spinner>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : displayDiagram ? (
        <div className="w-full flex flex-col items-center">
          <MermaidDiagram chart={displayDiagram} />
          {lastGenerated && (
            <div className="text-sm text-gray-500 mt-2">
              Last generated: {lastGenerated.toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400">No diagram available.</div>
      )}
    </div>
  );
}

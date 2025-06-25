"use client";
import { useState, useEffect, useRef } from "react";
import { fetchFile } from "@/lib/fetchFile";
import { ChevronUp, ChevronDown, Menu } from "lucide-react";
import { DiagramSection } from "./ui/repoclient/DiagramSection";
import { AIChatSection } from "./ui/repoclient/AIChatSection";
import { FileTree, buildFileTree } from "./ui/repoclient/FileTree";
import { FileContent } from "./ui/repoclient/FileContent";
import { useAuth } from "@/lib/hooks/useAuth";
import { Sidebar } from "./ui/dashboard/Sidebar";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/neo/spinner";
import { GitHubLoginButton } from "./LoginButton";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const FloatingAIAssistant = ({
  owner,
  repo,
  fileContent,
}: {
  owner: string;
  repo: string;
  fileContent: string | null;
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".handle")) return;

    const startX = e.pageX - position.x;
    const startY = e.pageY - position.y;
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.pageX - startX,
        y: e.pageY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`fixed z-50 ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        width: "400px",
        right: "1.5rem",
        bottom: "1.5rem",
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-in-out",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`
          bg-black backdrop-blur-xl rounded-2xl shadow-2xl 
          border border-white/10 overflow-hidden transition-all duration-300
          hover:shadow-indigo-500/10 hover:border-white/20
        `}
        style={{
          maxHeight: isMinimized ? "48px" : "calc(100vh - 400px)",
          transform: isMinimized
            ? "translateY(calc(100% - 48px))"
            : "translateY(0)",
        }}
      >
        <div className="handle border-b border-white/10 bg-black p-3 flex items-center justify-between cursor-move select-none">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
            </div>
            <h2 className="text-sm font-medium text-white/90">AI Assistant</h2>
          </div>
          <button
            className="text-white/70 hover:text-white/90 transition-colors p-1 hover:bg-zinc-900/50 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
        <div
          className="overflow-y-auto transition-all duration-300 bg-black"
          style={{
            height: isMinimized ? "0" : "calc(100vh - 500px)",
            opacity: isMinimized ? 0 : 1,
          }}
        >
          <div className="p-4">
            <AIChatSection
              username={owner}
              repo={repo}
              fileContent={fileContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
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

export default function RepoClientPage({
  owner,
  repo,
  fileTree,
}: {
  owner: string;
  repo: string;
  fileTree: any[];
}) {
  const { user, loading: userLoading, logout } = useAuth();
  const router = useRouter();
  const nodeRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  const [isAIMinimized, setIsAIMinimized] = useState(false);

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

  const handleSidebarNav = (key: string) => {
    router.push("/dashboard");
  };

  const tree = buildFileTree(fileTree || []);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-2xl font-bold">Please login to continue</div>
        <GitHubLoginButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarMobile={sidebarMobile}
        setSidebarMobile={setSidebarMobile}
        showSection={"analysis"}
        handleSidebarNav={handleSidebarNav}
        logout={logout}
      />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-200"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {owner}/{repo}
            </h1>
          </div>
        </header>
        <main className="flex-1 w-full max-w-8xl mx-auto px-2 md:px-4 py-6">
          {/* System Design Diagram */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
              <div className="text-2xl font-bold mb-4 text-center">
                System Design Diagram for {owner}/{repo}
              </div>
              <DiagramSection owner={owner} repo={repo} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex gap-6">
            {/* Left Side: IDE-like File Explorer + Code Viewer */}
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-300px)]">
                {/* IDE Content */}
                <div className="flex h-full">
                  {/* File Tree */}
                  <div className="w-[280px] border-r border-gray-200 flex flex-col">
                    <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center">
                      <h2 className="text-sm font-medium text-gray-600">
                        Explorer
                      </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 bg-gray-50">
                      {fileTree.length === 0 ? (
                        <div className="text-gray-400 text-center py-4">
                          No files found or unable to fetch file tree.
                        </div>
                      ) : (
                        <div className="py-2">
                          <FileTree
                            tree={tree}
                            onFileClick={handleFileClick}
                            selectedFile={selectedFile}
                            expanded={expanded}
                            setExpanded={setExpanded}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Code Viewer */}
                  <div className="flex-1 flex flex-col">
                    {selectedFile ? (
                      <>
                        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex-shrink-0">
                          <h3 className="text-sm font-medium text-black truncate">
                            {selectedFile}
                          </h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                          <FileContent
                            selectedFile={selectedFile}
                            fileContent={fileContent}
                            loading={loading}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                        Select a file to view its contents
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating AI Assistant */}
          <FloatingAIAssistant
            owner={owner}
            repo={repo}
            fileContent={fileContent}
          />

          {showScrollTop && (
            <button
              className="fixed top-8 right-8 z-50 bg-blue-500 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center transition-all"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Scroll to top"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}

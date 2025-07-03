"use client";
import { fetchFile } from "@/lib/fetchFile";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDiagram } from "@/lib/hooks/useDiagram";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GitHubLoginButton } from "./LoginButton";
import { AIChatSection } from "./ui/analysis/AIChatSection";
import { DiagramSection } from "./ui/analysis/DiagramSection";
import { FileContent } from "./ui/analysis/FileContent";
import { FileTree, buildFileTree } from "./ui/analysis/FileTree";
import { Sidebar } from "./ui/dashboard/Sidebar";
import { Switch } from "./ui/diagram/switch";
import { Spinner } from "./ui/neo/spinner";

const RightSideAIAssistant = ({
  owner,
  repo,
  selectedFilePath,
}: {
  owner: string;
  repo: string;
  selectedFilePath: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-black/70 backdrop-blur-md hover:scale-105 transition-all rounded-lg w-20 h-12 flex items-center justify-center border-2 border-white/20 shadow-lg"
          style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)" }}
          onClick={() => setIsOpen(true)}
        >
          <span className="text-lg font-bold text-white">Mark</span>
        </button>
      )}
      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-[calc(100vh-32px)] z-50 border-l border-white/10 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          width: "400px",
          maxWidth: "100vw",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "2px solid rgba(255,255,255,0.18)",
          borderRadius: "32px 0 0 32px",
          margin: "16px 0 16px auto",
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-transparent relative">
          <div className="w-8" />
          <h2 className="flex-1 text-lg font-semibold text-white text-center">
            Meet Mark, your AI Assistant.
          </h2>
          <button
            className="text-white hover:text-gray-200 transition-colors p-2 rounded-full text-2xl"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI Assistant"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px-32px)] p-4 bg-transparent">
          <AIChatSection
            username={owner}
            repo={repo}
            selectedFilePath={selectedFilePath}
          />
        </div>
      </div>
    </>
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
  const { handleExportImage, handleRegenerate } = useDiagram(owner, repo);
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

  const [zoomingEnabled, setZoomingEnabled] = useState(false);

  const [explorerHeight, setExplorerHeight] = useState(600);

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
    <div className="min-h-screen flex bg-[#181A20] text-white">
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
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-4 bg-[#23272f] border-b border-blue-400/10">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-blue-400/10"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-6 h-6 text-gray-200" />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {owner}/{repo}
            </h1>
          </div>
        </header>
        <main className="flex-1 w-full max-w-8xl mx-auto px-2 md:px-4 py-2 bg-[#181A20] text-white">
          {/* System Design Diagram */}
          <div className="mb-4">
            <div className="text-4xl font-bold mb-2 mt-8 text-center text-white">
              System Design Diagram
            </div>
            <div className="flex flex-row gap-3 mb-8 justify-center items-center">
              <button
                onClick={handleExportImage}
                className="bg-[#23272f] rounded-lg py-2 px-4 text-white font-medium hover:bg-blue-700 transition border border-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Download
              </button>
              <button
                onClick={() => handleRegenerate("")}
                className="bg-[#23272f] rounded-lg py-2 px-4 text-white font-medium hover:bg-blue-700 transition border border-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Regenerate
              </button>
              <div className="flex items-center gap-2 bg-[#23272f] rounded-lg py-2 px-4">
                <span className="text-white font-medium">Zoom</span>
                <Switch
                  checked={zoomingEnabled}
                  onCheckedChange={setZoomingEnabled}
                />
              </div>
            </div>
            <div className="flex items-center justify-center w-full">
              <DiagramSection
                owner={owner}
                repo={repo}
                zoomingEnabled={zoomingEnabled}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex gap-6">
            {/* Left Side: IDE-like File Explorer + Code Viewer */}
            <div className="w-full">
              <div
                className="bg-[#23272f] mb-8 mt-8 flex flex-col relative select-none rounded-2xl border border-blue-400/20"
                style={{
                  height: explorerHeight,
                  minHeight: 120,
                  maxHeight: 800,
                }}
              >
                {/* IDE Content */}
                <div className="flex h-full">
                  {/* File Tree */}
                  <div className="w-[280px] border-r border-blue-400/10 flex flex-col">
                    <div className="bg-[#20232a] border-b border-blue-400/10 p-3 flex items-center">
                      <h2 className="text-sm font-medium text-white">
                        Directory
                      </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 bg-[#23272f]">
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
                        <div className="bg-[#20232a] border-b border-blue-400/10 px-4 py-2 flex-shrink-0">
                          <h3 className="text-sm font-medium text-white truncate">
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
                      <div className="flex-1 flex items-center justify-center text-gray-400 bg-[#23272f]">
                        Select a file to view its contents
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side AI Assistant */}
          <RightSideAIAssistant
            owner={owner}
            repo={repo}
            selectedFilePath={selectedFile || ""}
          />
        </main>
      </div>
    </div>
  );
}

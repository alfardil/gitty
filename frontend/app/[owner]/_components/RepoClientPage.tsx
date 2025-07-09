"use client";
import { DiagramSection } from "@/app/[owner]/_components/DiagramSection";
import { RightSideAIAssistant } from "@/app/[owner]/_components/RightSideAIAssistant";
import { GitHubLoginButton } from "@/components/LoginButton";
import { FileContent } from "@/components/ui/analysis/FileContent";
import { FileTree, buildFileTree } from "@/components/ui/analysis/FileTree";
import { Sidebar } from "@/components/ui/dashboard/Sidebar";
import { Spinner } from "@/components/ui/neo/spinner";
import { fetchFile } from "@/lib/fetchFile";
import { getGithubAccessTokenFromCookie } from "@/lib/fetchRepos";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
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
      const accessToken = getGithubAccessTokenFromCookie();
      if (!accessToken) {
        throw new Error("No access token found");
      }
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
    if (key === "analysis") {
      router.push("/dashboard?section=analysis");
    } else if (key === "insights") {
      router.push("/dashboard?section=insights");
    } else {
      router.push("/dashboard");
    }
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
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={() => router.push("/dashboard?section=analysis")}
              className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/20 shadow-[0_4px_24px_rgba(110,31,255,0.18)] hover:shadow-[0_8px_32px_rgba(110,31,255,0.25)] text-purple-200 hover:text-white px-5 py-2 rounded-full font-semibold text-lg transition-all duration-200 group"
              style={{ minWidth: 120 }}
            >
              <span className="text-xl group-hover:-translate-x-1 transition-transform duration-200">←</span>
              Back
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {owner}/{repo}
            </h1>
          </div>
        </header>
        <main className="flex-1 w-full max-w-8xl mx-auto px-2 md:px-4 py-2 bg-[#181A20] text-white">
          {/* System Design Diagram */}
          <div className="mb-4">
            <div className="flex flex-col items-center justify-center mb-2 mt-8 relative w-full">
              <div className="text-4xl font-bold text-white text-center w-full">
                System Design Diagram
              </div>
            </div>

            <div className="flex items-center justify-center w-full">
              <DiagramSection owner={owner} repo={repo} />
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

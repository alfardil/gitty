"use client";
import { fetchFile } from "@/lib/utils/api/fetchFile";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { getGithubAccessTokenFromCookie } from "@/lib/utils/api/fetchRepos";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GitHubLoginButton } from "@/components/features/auth/LoginButton";
import { DiagramSection } from "@/app/[owner]/_components/DiagramSection";
import { ReadmeSection } from "@/app/[owner]/_components/ReadmeSection";
import { FileContent } from "@/components/ui/analysis/FileContent";
import { FileTree, buildFileTree } from "@/components/ui/analysis/FileTree";
import { RightSideAIAssistant } from "@/app/[owner]/_components/RightSideAIAssistant";
import { Sidebar } from "@/app/dashboard/_components/Sidebar";
import { Spinner } from "@/components/ui/neo/spinner";
import { addAnalyzedReposCount } from "@/app/_actions/cache";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const explorerHeight = 600;

  useEffect(() => {
    if (user && user.id) {
      const key = `analyzedRepo:${user.id}:${owner}/${repo}`;
      if (typeof window !== "undefined" && !localStorage.getItem(key)) {
        addAnalyzedReposCount(String(user.id));
        localStorage.setItem(key, "Viewed");
      }
    }
  }, [user, owner, repo, addAnalyzedReposCount]);

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
        <header className="flex items-center justify-between w-full px-4 md:px-8 py-3 bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] border-b border-white/10">
          <div className="flex items-center gap-3 w-full">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              onClick={() => setSidebarMobile(true)}
            >
              <Menu className="w-5 h-5 text-white/70" />
            </button>
            <h1 className="text-sm font-mono text-white/60 tracking-wider">
              {owner}/{repo}
            </h1>
          </div>
        </header>
        <main className="flex-1 w-full max-w-8xl mx-auto px-2 md:px-4 py-4 bg-[#0a0a0a] text-white">
          <div className="mb-6">
            <div className="flex items-center justify-center w-full">
              <DiagramSection owner={owner} repo={repo} />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-full">
              <div
                className="bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f] mb-8 mt-4 flex flex-col relative select-none rounded-xl border border-white/10 overflow-hidden"
                style={{
                  height: explorerHeight,
                  minHeight: 120,
                  maxHeight: 800,
                }}
              >
                <div className="flex h-full">
                  {/* Directory Panel */}
                  <div className="w-[280px] border-r border-white/10 flex flex-col bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
                    <div className="bg-gradient-to-r from-[#0a0a0a] to-[#111] border-b border-white/10 p-2 flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500/60 rounded-full mr-2"></div>
                      <h2 className="text-xs font-mono text-white/60 tracking-wider uppercase">
                        Directory
                      </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
                      {fileTree.length === 0 ? (
                        <div className="text-white/40 text-center py-4 font-mono text-xs">
                          <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-2 border border-white/10">
                            <svg
                              className="w-3 h-3 text-white/30"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
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

                  {/* File Content Panel */}
                  <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
                    {selectedFile ? (
                      <>
                        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#111] border-b border-white/10 px-3 py-2 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500/60 rounded-full"></div>
                            <h3 className="text-xs font-mono text-white/70 tracking-wide truncate">
                              {selectedFile}
                            </h3>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
                          <FileContent
                            selectedFile={selectedFile}
                            fileContent={fileContent}
                            loading={loading}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-white/40 bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-2 border border-white/10">
                            <svg
                              className="w-4 h-4 text-white/30"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <p className="font-mono text-xs tracking-wide">
                            Select a file to view its contents
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RightSideAIAssistant
            owner={owner}
            repo={repo}
            selectedFilePath={selectedFile || ""}
          />
        </main>

        {/* README Generation Section */}
        <div className="w-full bg-[#0a0a0a] border-t border-white/10">
          <div className="max-w-8xl mx-auto px-2 md:px-4 py-8">
            <ReadmeSection username={owner} repo={repo} />
          </div>
        </div>
      </div>
    </div>
  );
}

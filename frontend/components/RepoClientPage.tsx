"use client";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { fetchFile } from "@/lib/fetchFile";
import { ChevronUp } from "lucide-react";
import { DiagramSection } from "./ui/repoclient/DiagramSection";
import { AIChatSection } from "./ui/repoclient/AIChatSection";
import { FileTree, FileContent, buildFileTree } from "./ui/repoclient/FileTree";

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

  const tree = buildFileTree(fileTree || []);

  return (
    <div className="min-h-screen bg-primary relative">
      <Header />
      <div className="flex flex-row w-full max-w-7xl mx-auto pt-32 gap-8 px-4">
        <div className="w-[70%] bg-white rounded-xl shadow-lg p-8 border-4 border-black flex flex-col gap-6 min-w-[500px]">
          <div className="text-2xl font-bold mb-4">
            System Design Diagram for {owner}/{repo}
          </div>
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
            <FileContent
              selectedFile={selectedFile}
              fileContent={fileContent}
              loading={loading}
            />
          </div>
        </div>

        <AIChatSection username={owner} repo={repo} fileContent={fileContent} />
      </div>
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

"use client";

import { useAnalyze } from "@/lib/hooks/business/useAnalyze";
import { Bot } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "../../../components/ui/analysis/CodeBlock";

interface FunctionAnalysisChatProps {
  owner: string;
  repo: string;
  branch?: string;
  accessToken: string;
  selectedFilePath: string;
}

export interface FunctionAnalysisChatRef {
  handleSubmit: (content: string) => void;
}

const MarkChat = forwardRef<FunctionAnalysisChatRef, FunctionAnalysisChatProps>(
  ({ owner, repo, branch = "main", accessToken, selectedFilePath }, ref) => {
    const [question, setQuestion] = useState("");
    const { analyzeRepoWithRAG, loading, error, response } = useAnalyze();

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!question.trim()) return;
      await analyzeRepoWithRAG({
        owner,
        repo,
        branch,
        accessToken,
        question,
        selectedFilePath,
      });
      setQuestion("");
    };

    useImperativeHandle(ref, () => ({
      handleSubmit: (content: string) => {
        setQuestion(content);
        handleSubmit();
      },
    }));

    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [response, error, loading]);

    return (
      <div className="flex flex-col h-full">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-32"
        >
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Bot className="w-5 h-5 mt-1 text-red-400" />
              <div className="flex-1 text-sm text-red-200">{error}</div>
            </div>
          )}

          {!response && !error && !loading && (
            <div className="flex flex-col items-center space-y-6 text-center mt-24 mb-8">
              <div className="p-6 rounded-full border-2 border-white bg-transparent">
                <Bot className="w-10 h-10 text-indigo-500" />
              </div>
              <div className="space-y-3">
                <p className="text-white text-xl font-semibold">
                  <span className="text-white">
                    Ask me about this repository
                  </span>
                </p>
                <p className="text-white text-base max-w-[280px]">
                  I can help you understand the code structure, function
                  parameters, and more.
                </p>
              </div>
            </div>
          )}

          {response && (
            <div className="prose max-w-none text-white">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={
                  {
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock
                          code={String(children).replace(/\n$/, "")}
                          language={match[1]}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  } as any
                }
              >
                {response}
              </ReactMarkdown>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 px-4 py-3 border border-white/30 rounded-lg animate-pulse bg-transparent">
              <Bot className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Analyzing...</span>
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded w-3/4 bg-white/30" />
                <div className="h-4 rounded w-1/2 bg-white/30" />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-md shadow-lg border border-white/30 fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-[370px]"
          style={{ zIndex: 60 }}
        >
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Message Assistant"
              disabled={loading}
              className="flex-1 bg-transparent border-none outline-none text-black placeholder:text-gray-500 px-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 rounded-full hover:bg-blue-100 transition"
            ></button>
          </div>
        </form>
      </div>
    );
  }
);

MarkChat.displayName = "FunctionAnalysisChat";

export default MarkChat;

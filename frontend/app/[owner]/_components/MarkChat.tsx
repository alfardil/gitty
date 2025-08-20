"use client";

import { useAnalyze } from "@/lib/hooks/business/useAnalyze";
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

// Custom mysterious AI icon
const MysteriousAIIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white/60"
  >
    {/* Outer ring with subtle glow */}
    <circle
      cx="16"
      cy="16"
      r="14"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.3"
      fill="none"
    />
    
    {/* Inner neural network nodes */}
    <circle cx="12" cy="12" r="1.5" fill="currentColor" fillOpacity="0.8" />
    <circle cx="20" cy="12" r="1.5" fill="currentColor" fillOpacity="0.8" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" fillOpacity="0.8" />
    <circle cx="12" cy="20" r="1.5" fill="currentColor" fillOpacity="0.8" />
    <circle cx="20" cy="20" r="1.5" fill="currentColor" fillOpacity="0.8" />
    
    {/* Connecting lines */}
    <path
      d="M12 12L20 12M12 12L16 16M20 12L16 16M12 20L16 16M20 20L16 16M12 12L12 20M20 12L20 20"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeOpacity="0.6"
      strokeLinecap="round"
    />
    
    {/* Central core */}
    <circle
      cx="16"
      cy="16"
      r="3"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeOpacity="0.4"
      fill="none"
    />
    
    {/* Subtle inner glow */}
    <circle
      cx="16"
      cy="16"
      r="1"
      fill="currentColor"
      fillOpacity="0.3"
    />
  </svg>
);

const MarkChat = forwardRef<FunctionAnalysisChatRef, FunctionAnalysisChatProps>(
  ({ owner, repo, branch = "main", accessToken, selectedFilePath }, ref) => {
    const [question, setQuestion] = useState("");
    const { analyzeRepoWithRAG, loading, error, response } = useAnalyze();

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!question.trim()) return;
      
      const currentQuestion = question;
      setQuestion(""); // Clear input immediately

      // console.log("Right before API call - question:", currentQuestion);
      // console.log("Right before API call - selectedFilePath:", selectedFilePath);
      // console.log("Right before API call - full params:", {
      //   owner,
      //   repo,
      //   branch,
      //   accessToken,
      //   question: currentQuestion,
      //   selectedFilePath,
      // });
      
      await analyzeRepoWithRAG({
        owner,
        repo,
        branch,
        accessToken,
        question: currentQuestion,
        selectedFilePath,
      });
    };

    useImperativeHandle(ref, () => ({
      handleSubmit: (content: string) => {
        setQuestion(content);
        handleSubmit();
      },
    }));

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [question]);

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
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex-1 text-sm text-red-200">{error}</div>
            </div>
          )}

          {!response && !error && !loading && (
            <div className="flex flex-col items-center space-y-4 text-center mt-16 mb-8">
              <div className="p-6 rounded-lg border border-white/10 bg-white/5">
                <MysteriousAIIcon />
              </div>
              <div className="space-y-2 max-w-[280px]">
                <p className="text-white text-lg font-medium">
                  Intelligence awaits
                </p>
                <p className="text-white/60 text-sm">
                  Query the depths of your codebase
                </p>
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              <div className="p-4 border border-white/10 rounded-lg bg-white/5">
                <div className="prose prose-invert max-w-none text-white/90">
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
                            <code className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({ children, ...props }: any) => (
                          <p className="text-white/90 leading-relaxed mb-3 last:mb-0 text-sm" {...props}>
                            {children}
                          </p>
                        ),
                        h1: ({ children, ...props }: any) => (
                          <h1 className="text-lg font-semibold text-white mb-3 mt-5 first:mt-0 text-base border-b border-white/10 pb-2" {...props}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }: any) => (
                          <h2 className="text-base font-semibold text-white mb-2 mt-4 first:mt-0 text-sm text-white/90" {...props}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }: any) => (
                          <h3 className="text-sm font-semibold text-white mb-2 mt-3 first:mt-0 text-xs text-white/80" {...props}>
                            {children}
                          </h3>
                        ),
                        ul: ({ children, ...props }: any) => (
                          <ul className="space-y-2 mb-4 text-white/80 text-sm tracking-tight" {...props}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }: any) => (
                          <ol className="space-y-2 mb-4 text-white/80 text-sm tracking-tight" {...props}>
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }: any) => (
                          <li className="text-white/80 leading-relaxed text-sm tracking-tight flex items-start" {...props}>
                            <span className="text-white/60 mr-2">•</span>
                            <span className="flex-1">{children}</span>
                          </li>
                        ),
                        blockquote: ({ children, ...props }: any) => (
                          <blockquote className="border-l-2 border-white/20 pl-3 py-2 my-3 bg-white/5 rounded-r text-sm italic" {...props}>
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children, ...props }: any) => (
                          <strong className="font-semibold text-white" {...props}>
                            {children}
                          </strong>
                        ),
                        em: ({ children, ...props }: any) => (
                          <em className="text-white/90 italic" {...props}>
                            {children}
                          </em>
                        ),
                        hr: ({ ...props }: any) => (
                          <hr className="border-white/10 my-4" {...props} />
                        ),
                      } as any
                    }
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 p-3 border border-white/10 rounded-lg bg-white/5">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm">Analyzing</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded w-3/4 bg-white/20" />
                  <div className="h-2 rounded w-1/2 bg-white/20" />
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full px-4 py-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-[360px]"
          style={{ 
            zIndex: 60,
            boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.3)"
          }}
        >
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about code..."
            disabled={loading}
            rows={1}
            className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm resize-none overflow-hidden min-h-[20px] max-h-[120px] tracking-tight leading-normal"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </form>
      </div>
    );
  }
);

MarkChat.displayName = "FunctionAnalysisChat";

export default MarkChat;

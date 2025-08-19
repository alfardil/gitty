"use client";

import { useState, useEffect } from "react";
import { useWaitlist } from "@/lib/hooks/business/useWaitlist";
import { motion, AnimatePresence } from "motion/react";

export function WaitlistInput() {
  const { setEmail, isLoading, error, success, submitEmail, reset } =
    useWaitlist();

  const [showSuccess, setShowSuccess] = useState(false);
  const [email, setEmailLocal] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailLocal(value);
    setEmail(value);
  };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    await submitEmail();
  };

  // Handle success state separately
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      setEmailLocal(""); // Clear the input
      setTimeout(() => {
        setShowSuccess(false);
        reset();
      }, 10000);
    }
  }, [success, reset]);

  if (showSuccess) {
    return (
            <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl mx-auto"
      >
        <div className="bg-[#0a0a0a] border border-white/20 rounded-none font-mono text-sm p-6 shadow-2xl">
          {/* Code-like success message */}
          <div className="text-left space-y-2">
            <div className="text-white/40">{"{"}</div>
            <div className="ml-4 space-y-1">
              <div>
                <span className="text-blue-400">"status"</span>
                <span className="text-white/60">:</span>
                <span className="text-green-400 ml-2">"success"</span>
                <span className="text-white/60">,</span>
              </div>
              <div>
                <span className="text-blue-400">"message"</span>
                <span className="text-white/60">:</span>
                <span className="text-white/80 ml-2">"Welcome to the Thestral"</span>
                <span className="text-white/60">,</span>
              </div>
              <div>
                <span className="text-blue-400">"action"</span>
                <span className="text-white/60">:</span>
                <span className="text-white/80 ml-2">"Team will contact you soon"</span>
                <span className="text-white/60">,</span>
              </div>
              <div>
                <span className="text-blue-400">"queue"</span>
                <span className="text-white/60">:</span>
                <span className="text-yellow-400 ml-2">"secured"</span>
                <span className="text-white/60">,</span>
              </div>
              <div>
                <span className="text-blue-400">"access"</span>
                <span className="text-white/60">:</span>
                <span className="text-purple-400 ml-2">"early"</span>
              </div>
            </div>
            <div className="text-white/40">{"}"}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="Enter your work email"
            className="w-full px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-300 text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!email.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Joining..." : "Join"}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-red-400 text-sm text-center bg-black/60 backdrop-blur-md border border-red-500/30 rounded-lg p-4 relative overflow-hidden"
          >
            {/* Background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-4 h-4 border border-red-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
                <span className="font-mono font-bold tracking-wider">ACCESS DENIED</span>
              </div>
              <div className="text-xs font-mono text-red-300/80">
                ERROR CODE: <span className="text-red-400">AUTH_FAILED</span>
              </div>
              <div className="text-xs text-white/60 mt-2">{error}</div>
            </div>
            
            {/* Animated border */}
            <div className="absolute inset-0 border border-red-500/20 rounded-lg">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent animate-pulse"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-white/70 text-sm text-center bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4 relative overflow-hidden"
        >
          {/* Background scanning effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span className="font-mono font-bold tracking-wider">AUTHENTICATING</span>
            </div>
            <div className="text-xs font-mono text-blue-300/80">
              STATUS: <span className="text-blue-400">PROCESSING</span>
            </div>
            <div className="text-xs text-white/60 mt-2">Establishing secure connection to intelligence network...</div>
          </div>
          
          {/* Animated progress line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent">
            <div className="w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0 animate-pulse"></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

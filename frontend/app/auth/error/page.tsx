import { GitHubLoginButton } from "@/components/features/auth/LoginButton";
import { Button } from "@/components/ui/neo/button";
import Link from "next/link";
import { AlertTriangle, Home, Mail } from "lucide-react";

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-semibold text-white font-mono tracking-wide mb-3">
            Authentication Error
          </h1>
          <p className="text-white/60 font-mono tracking-wide text-lg">
            GitHub authentication failed
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#111111] border border-white/10 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <p className="text-white/80 font-mono tracking-wide leading-relaxed">
              There was a problem authenticating with GitHub. Please try again or contact support if the issue persists.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <GitHubLoginButton />
            <Button
              asChild
              className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-sm tracking-wide transition-all duration-200 h-12"
            >
              <Link href="/" className="flex items-center justify-center gap-3">
                <Home className="w-4 h-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-white/40 font-mono text-sm tracking-wide">
            <Mail className="w-4 h-4" />
            <span>Need help?</span>
            <Link
              href="mailto:marcus.chau@lexorstrategies.com"
              className="text-white/80 hover:text-white transition-colors duration-200 underline underline-offset-2"
            >
              marcus.chau@lexorstrategies.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

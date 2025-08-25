"use client";

import { GitHubLoginButton } from "@/components/features/auth/LoginButton";
import { useAuth } from "@/lib/hooks/business/useAuth";
import { Spinner } from "@/components/ui/neo/spinner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center space-y-4">
          <div className="font-mono text-sm text-white/60">AUTHENTICATING</div>
          <Spinner size="large" show={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="max-w-md mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-6 h-6 border border-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-white font-semibold text-xl">Thestral</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
              Access the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
                Intelligence System
              </span>
            </h1>

            <p className="text-white/60 text-lg leading-relaxed">
              Secure authentication required for startup intelligence platform
            </p>
          </div>

          {/* Login section */}
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6 opacity-60">
              <div className="w-16 h-px bg-white/30"></div>
              <span className="mx-4 text-white/60 text-sm tracking-widest font-mono">
                [AUTH]
              </span>
              <div className="w-16 h-px bg-white/30"></div>
            </div>

            <GitHubLoginButton />

            <div className="text-xs text-white/40 font-mono">
              Authorized personnel only
            </div>
          </div>
        </div>
      </div>

      {/* Visual design elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-bl from-white/5 to-transparent border border-white/10 rounded-full pointer-events-none"></div>
    </div>
  );
}

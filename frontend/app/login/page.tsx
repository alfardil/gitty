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
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
        <Spinner size="large" show={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
      <div className="text-3xl font-bold mb-6">Sign in to Gitty</div>
      <GitHubLoginButton />
    </div>
  );
}

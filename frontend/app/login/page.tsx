"use client";

import { GitHubLoginButton } from "@/components/LoginButton";
import { useAuth } from "@/lib/hooks/useAuth";
import { Spinner } from "@/components/ui/neo/spinner";

export default function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
        <Spinner size="large" show={true} />
      </div>
    );
  }

  if (user) {
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
      <div className="text-3xl font-bold mb-6">Sign in to Gitty</div>
      <GitHubLoginButton />
    </div>
  );
}

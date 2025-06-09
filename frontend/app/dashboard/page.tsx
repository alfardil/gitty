"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import Header from "@/components/Header";
import { GitHubLoginButton } from "@/components/LoginButton";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
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
    <div className="min-h-screen bg-primary">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen pt-32 gap-4">
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer font-bold py-2 px-4 rounded shadow"
          onClick={() => router.push("/diagram")}
        >
          Go to System Design Diagram
        </Button>
        <Button
          className="bg-green-500 hover:bg-green-600 text-white cursor-pointer font-bold py-2 px-4 rounded shadow"
          onClick={() => router.push("/chat")}
        >
          Go to Chat
        </Button>
      </div>
    </div>
  );
}

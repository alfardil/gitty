"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/neo/button";
import { Github, LogOut } from "lucide-react";
import Image from "next/image";
import { Spinner } from "@/components/ui/neo/spinner";
import { useIsMobile } from "@/hooks/use-mobile";

export function GitHubLoginButton() {
  const { user, loading, logout } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-white/90 p-2 rounded-lg shadow-lg min-w-[120px] min-h-[48px] mt-4 mb-4">
        <Spinner size="large" show={true} />
      </div>
    );
  }

  if (!user) {
    return (
      <Button
        variant="default"
        className="bg-blue-300 hover:bg-blue-400 text-black font-semibold px-6 py-2 rounded shadow flex items-center justify-center gap-2 transition-colors duration-200 sm:w-auto focus:outline-none cursor-pointer mt-4 mb-4"
        onClick={() => {
          window.location.href = "/api/auth/github";
        }}
      >
        <Github className="h-4 w-4" />
        Sign in with GitHub
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white/90 p-2 rounded-lg shadow-lg mt-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full overflow-hidden">
          <Image
            src={user.avatar_url}
            alt={user.name || user.login}
            fill
            sizes="100px"
            className="object-cover"
          />
        </div>
        {!isMobile && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {user.name || user.login}
            </span>
            <span className="text-xs text-gray-500">@{user.login}</span>
          </div>
        )}
      </div>
      {!isMobile && (
        <div className="flex items-center gap-2">
          <div className="flex gap-3 text-xs text-gray-600">
            <span>{user.followers} followers</span>
            <span>{user.following} following</span>
            <span>{user.public_repos} repos</span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
      {isMobile && (
        <Button
          variant="default"
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

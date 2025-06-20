"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/neo/button";
import { Github, LogOut } from "lucide-react";
import Image from "next/image";
import { Spinner } from "@/components/ui/neo/spinner";
import { useIsMobile } from "@/lib/hooks/useMobile";

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
        className="bg-black hover:bg-gray-800 border-white text-white font-semibold px-6 py-2 rounded shadow flex items-center justify-center gap-2 transition-colors duration-200 mt-4 mb-4"
        onClick={() => {
          window.location.href = "/api/auth/github";
        }}
      >
        <svg
          aria-label="GitHub logo"
          width="16"
          height="16"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="mr-2"
        >
          <path
            fill="currentColor"
            d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
        Login with GitHub
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

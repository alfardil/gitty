"use client";

import MainCard from "@/components/MainCard";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";

export default function Repo() {
  const params = useParams<{ username: string; repo: string }>();

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
      <Card className="bg-white rounded-xl shadow-lg p-8 border-4 border-black flex flex-col items-center gap-4">
        <MainCard username={params.username} repo={params.repo} />
        <div className="text-center text-lg font-medium">
          Your username is {params.username} and your repo is
          <a
            href={`https://github.com/${params.username}/${params.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 hover:underline transition-colors duration-150"
          >
            {params.repo}
          </a>
        </div>
      </Card>
    </div>
  );
}

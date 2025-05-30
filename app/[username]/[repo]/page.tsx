"use client";

import MainCard from "@/components/MainCard";
import { useParams } from "next/navigation";

export default function Repo() {
  const params = useParams<{ username: string; repo: string }>();

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
      <MainCard username={params.username} repo={params.repo} />
      Your username is {params.username} and your repo is {params.repo}.
    </div>
  );
}

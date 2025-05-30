"use client";
import { SendIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DiagramInputProps = {
  username?: string;
  repo?: string;
};

export default function DiagramInput({ username, repo }: DiagramInputProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (username && repo) {
      setUrl(`https://github.com/${username}/${repo}`);
    }
  }, [username, repo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
    if (match) {
      const [, user, repository] = match;
      router.push(`/${user}/${repository}`);
      return;
    }

    match = url.match(/^([^\/]+)\/([^\/]+)$/);
    if (match) {
      const [, user, repository] = match;
      router.push(`/${user}/${repository}`);
      return;
    }

    const errorMsg =
      "Please enter a valid GitHub repository URL or username/repo.";
    setError(errorMsg);
    toast.error(errorMsg);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 mb-4 w-full"
      >
        <Input
          type="text"
          placeholder="https://github.com/username/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <Button
          type="submit"
          className="bg-blue-300 hover:bg-blue-400 text-black font-semibold cursor-pointer px-6 py-2 rounded shadow flex items-center justify-center gap-2 transition-colors duration-200 w-full sm:w-auto focus:outline-none"
        >
          <SendIcon size={18} className="-ml-1" />
          Diagram
        </Button>
      </form>
    </>
  );
}

"use client";
import { SendIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/neo/button";
import { Input } from "@/components/ui/neo/input";
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

    const githubUrlPattern =
      /^https?:\/\/github\.com\/([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_\.]+)\/?$/;
    const match = githubUrlPattern.exec(url.trim());

    if (!match) {
      setError("Please enter a valid GitHub repository URL.");
      toast.error(error);
      return;
    }

    const [, username, repo] = match || [];
    if (!username || !repo) {
      setError("Invalid repository URL format.");
      toast.error(error);
      return;
    }

    const sanitizedUsername = encodeURIComponent(username);
    const sanitizedRepo = encodeURIComponent(repo);
    router.push(`/diagram/${sanitizedUsername}/${sanitizedRepo}`);
    toast.success("Navigated to repository!");
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 mb-4 w-full mt-4"
      >
        <Input
          type="text"
          placeholder="https://github.com/username/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-[250px] w-full px-3 py-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

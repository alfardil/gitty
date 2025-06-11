import { Button } from "@/components/ui/neo/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-6">Welcome to Gitty</h1>
      <p className="text-lg mb-8">
        Your GitHub-powered system design and repo explorer.
      </p>
      <Link href="/login">
        <Button className="bg-blue-400 text-black font-bold p-4 rounded-md cursor-pointer hover:bg-blue-500 text-xl">
          Get Started
        </Button>
      </Link>
    </div>
  );
}

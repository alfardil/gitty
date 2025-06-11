import { Button } from "@/components/ui/neo/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome to Gitty</h1>
      <p className="text-lg mt-4">
        This is the entry point of the app. Please navigate to the dashboard to
        get started.
      </p>
      <Link href="/dashboard" className="mt-4">
        <Button className="bg-blue-400 text-black font-bold p-2 rounded-md cursor-pointer hover:bg-blue-500">
          Dashboard
        </Button>
      </Link>
    </div>
  );
}

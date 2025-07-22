import { Button } from "@/components/ui/neo/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20] text-gray-100">
      <div className="bg-[#23272f] p-10 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full border border-blue-400/20">
        <h1 className="text-6xl font-extrabold text-blue-400 mb-2 drop-shadow-sm">
          404
        </h1>
        <h2 className="text-3xl font-bold text-white mb-3 text-center">
          Page Not Found
        </h2>
        <p className="text-gray-300 mb-6 text-lg text-center">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Button
          asChild
          className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold mb-4"
        >
          <Link href="/">Return Home</Link>
        </Button>
        <p className="text-gray-400 text-center">
          If you believe this is an error, please contact {""}
          <Link
            href="mailto:devboard.ai@gmail.com"
            className="text-blue-400 hover:text-blue-500"
          >
            devboard.ai@gmail.com
          </Link>{" "}
          for support.
        </p>
      </div>
    </div>
  );
}

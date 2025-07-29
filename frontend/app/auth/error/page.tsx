import { GitHubLoginButton } from "@/components/features/auth/LoginButton";
import { Button } from "@/components/ui/neo/button";
import Link from "next/link";

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20] text-gray-100">
      <div className="bg-[#23272f] p-10 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full border border-blue-400/20">
        <h1 className="text-4xl font-extrabold text-red-500 mb-3 drop-shadow-sm">
          Authentication Error
        </h1>
        <p className="text-gray-300 mb-6 text-lg text-center">
          There was a problem authenticating with GitHub.
          <br />
          Please try again.
        </p>
        <div className="w-full flex flex-col items-center gap-4 mb-4">
          <GitHubLoginButton />
          <Button
            asChild
            className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            <Link href="/">Return Home</Link>
          </Button>
        </div>
        <p className="text-gray-400 text-center mt-2">
          If the problem persists, contact support or try clearing your browser
          cookies.
        </p>
        <p className="text-gray-400 mt-4 text-center">
          Please contact {""}
          <Link
            href="mailto:devboard.ai@gmail.com"
            className="text-blue-400 hover:text-blue-500"
          >
            devboard.ai@gmail.com
          </Link>{" "}
          for further help.
        </p>
      </div>
    </div>
  );
}

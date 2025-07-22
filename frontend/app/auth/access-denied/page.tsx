import { Button } from "@/components/ui/neo/button";
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20] text-gray-100">
      <div className="bg-[#23272f] p-10 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full border border-blue-400/20">
        <h1 className="text-4xl font-extrabold text-red-500 mb-3 drop-shadow-sm">
          Access Denied
        </h1>
        <p className="text-gray-300 mb-6 text-lg text-center">
          You don&apos;t have permission to access this application.
          <br />
          <br />
          Only a select few users are currently allowed.
        </p>
        <p className="text-gray-400 mb-8 text-center">
          Please contact {""}
          <Link
            href="mailto:devboard.ai@gmail.com"
            className="text-blue-400 hover:text-blue-500"
          >
            devboard.ai@gmail.com
          </Link>{" "}
          for further access to the website.
        </p>
        <Button
          asChild
          className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/neo/button";
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this application. Only admin users
          are allowed.
        </p>
        <p className="text-gray-500 mb-8">
          If you believe this is an error, please contact the administrator.
        </p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}

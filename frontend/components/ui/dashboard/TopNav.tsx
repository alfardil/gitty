import { Button } from "@/components/ui/neo/button";
import { useRouter } from "next/navigation";

export function TopNav() {
  const router = useRouter();
  return (
    <div className="flex gap-4 mb-8 justify-center">
      <Button
        className="bg-blue-500 hover:bg-blue-600 text-black font-bold py-2 px-4 rounded shadow"
        onClick={() => router.push("/diagram")}
      >
        System Design Diagram
      </Button>
    </div>
  );
}

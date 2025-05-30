import DiagramInput from "@/components/DiagramInput";
import { Card } from "@/components/ui/card";

type MainCardProps = {
  username?: string;
  repo?: string;
};

export default function MainCard({ username, repo }: MainCardProps) {
  return <DiagramInput username={username} repo={repo} />;
}

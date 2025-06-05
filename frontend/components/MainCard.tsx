import DiagramInput from "@/components/DiagramInput";

type MainCardProps = {
  username?: string;
  repo?: string;
};

export default function MainCard({ username, repo }: MainCardProps) {
  return <DiagramInput username={username} repo={repo} />;
}

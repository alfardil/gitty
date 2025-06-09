import DiagramInput from "@/components/DiagramInput";

type MainCardProps = {
  username?: string;
  repo?: string;
};

export default function MainCard({ username, repo }: MainCardProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-lg font-bold">System Design Analysis</div>
      <DiagramInput username={username} repo={repo} />
    </div>
  );
}

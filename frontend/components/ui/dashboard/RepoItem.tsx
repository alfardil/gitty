import { Button } from "@/components/ui/neo/button";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function RepoItem({
  repo,
  expanded,
  onExpand,
  username,
}: {
  repo: any;
  expanded: boolean;
  onExpand: () => void;
  username: string;
}) {
  const router = useRouter();
  return (
    <div>
      <Button
        variant="noShadow"
        className="w-full justify-between cursor-default bg-blue-200"
        onClick={onExpand}
      >
        <div className="flex flex-col items-start">
          <span className="font-semibold">
            {repo.name} |{" "}
            <span className="text-sm text-gray-500">
              {repo.private ? "private" : "public"}
            </span>
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </Button>
      {expanded && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {repo.name}
                </a>
              </h3>
              <p className="text-sm text-gray-500">
                {repo.private ? "private" : "public"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                  className="w-6 h-6 rounded-full border"
                />
                <a
                  href={`https://github.com/${repo.owner.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:underline"
                >
                  {repo.owner.login}
                </a>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => router.push(`/diagram/${username}/${repo.name}`)}
            >
              Generate Diagram
            </Button>
          </div>
          <p className="text-gray-600">
            {repo.description || "No description available"}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>⭐ {repo.stargazers_count}</span>
            <span>🔀 {repo.forks_count}</span>
            <span>👁️ {repo.watchers_count}</span>
          </div>
        </div>
      )}
    </div>
  );
}

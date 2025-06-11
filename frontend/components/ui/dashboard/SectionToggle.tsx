import { Button } from "@/components/ui/neo/button";

type SectionToggleProps = {
  showRepos: boolean;
  showOrgs: boolean;
  onShowRepos: () => void;
  onShowOrgs: () => void;
};

export function SectionToggle({
  showRepos,
  showOrgs,
  onShowRepos,
  onShowOrgs,
}: SectionToggleProps) {
  return (
    <div className="flex gap-4 mb-6 justify-center">
      <Button
        variant={showRepos ? "default" : "noShadow"}
        className={showRepos ? "bg-blue-300" : "bg-blue-200"}
        onClick={onShowRepos}
      >
        See repos
      </Button>
      <Button
        variant={showOrgs ? "default" : "noShadow"}
        className={showOrgs ? "bg-blue-300" : "bg-blue-200"}
        onClick={onShowOrgs}
      >
        See organizations
      </Button>
    </div>
  );
}

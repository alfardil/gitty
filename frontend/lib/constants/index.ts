import { BarChart2, Folder, Users, GitBranch, FileText } from "lucide-react";

export const SIDEBAR_SECTIONS = [
  { key: "insights", label: "Insights", icon: BarChart2 },
  { key: "analysis", label: "Analysis", icon: FileText },
  { key: "repos", label: "Repositories", icon: Folder },
  { key: "orgs", label: "Organizations", icon: Users },
  { key: "commits", label: "Git Insights", icon: GitBranch },
];

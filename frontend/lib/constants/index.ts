import { BarChart2, FileText, Users, Map, Building2 } from "lucide-react";

export const SIDEBAR_SECTIONS = [
  { key: "insights", label: "Insights", icon: BarChart2 },
  { key: "roadmap", label: "RoadMap", icon: Map },
  { key: "analysis", label: "Analysis", icon: FileText },
  { key: "admin", label: "Admin", icon: Users },
  { key: "developer", label: "Internal", icon: Building2 },
];

export interface Project {
  id: string;
  name: string;
  description?: string;
  enterpriseId: string;
  createdById: string;
  status: "active" | "completed" | "on-hold";
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  estimatedTotalHours?: number;
  actualTotalHours?: number;
  createdAt: string;
  updatedAt: string;
}

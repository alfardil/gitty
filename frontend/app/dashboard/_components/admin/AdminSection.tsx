import { Spinner } from "@/components/ui/neo/spinner";
import React, { useEffect, useState } from "react";
import { useAdminEnterprises } from "./hooks/useAdminEnterprises";
import { useProjects } from "@/lib/hooks/api/useProjects";
import { Enterprise } from "@/lib/types/business/Enterprise";
import { User } from "@/lib/types/business/User";
import { useRouter, useSearchParams } from "next/navigation";
import { TeamPerformanceAnalytics } from "./TeamPerformanceAnalytics";
import { QualityMetricsDashboard } from "./QualityMetricsDashboard";
import { TimeTrackingDashboard } from "./TimeTrackingDashboard";
import { DependencyVisualization } from "./DependencyVisualization";
import { ProjectUserManagement } from "./ProjectUserManagement";
import { ComingSoonSection } from "./ComingSoonSection";
import { toast } from "sonner";
import { Target } from "lucide-react";

interface EnterpriseUser {
  id: string;
  githubId: string | null;
  githubUsername: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  subscription_plan: string | null;
  role: string;
}
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/neo/dropdown-menu";
import { InviteCodeForm } from "../developer/_components/CreateInvite";
import { useEnterpriseActions } from "../developer/hooks/useEnterpriseActions";

interface AdminSectionProps {
  userId: string;
}

function AdminSection({ userId }: AdminSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    | "users"
    | "analytics"
    | "quality"
    | "time"
    | "dependencies"
    | "project-users"
  >(
    (searchParams.get("adminTab") as
      | "users"
      | "analytics"
      | "quality"
      | "time"
      | "dependencies"
      | "project-users") || "users"
  );
  const {
    enterprises,
    selectedEnterprise,
    setSelectedEnterprise,
    users: allUsers,
    loading: enterprisesLoading,
  } = useAdminEnterprises(userId);

  const { projects, createProject, isCreating } = useProjects(
    selectedEnterprise || undefined
  );
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Filter users based on selected project
  const users = selectedProject
    ? allUsers.filter((user) => {
        // This will be filtered by the backend API when we implement project-based user filtering
        // For now, return all users
        return true;
      })
    : allUsers;

  // Auto-select first project if available and none selected
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  // Fake user object for useEnterpriseActions (only uuid is needed)
  const user = { uuid: userId } as User;
  const actions = useEnterpriseActions(user);
  const [analyzingTasks, setAnalyzingTasks] = useState(false);

  // Sync selected enterprise to invite forms
  useEffect(() => {
    if (selectedEnterprise) {
      actions.setMemberInviteEnterpriseId(selectedEnterprise);
      actions.setAdminInviteEnterpriseId(selectedEnterprise);
    }
  }, [selectedEnterprise]);

  // Handle tab changes and update URL
  const handleTabChange = (
    tab:
      | "users"
      | "analytics"
      | "quality"
      | "time"
      | "dependencies"
      | "project-users"
  ) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set("section", "admin");
    params.set("adminTab", tab);

    // Preserve enterpriseId if it exists
    const enterpriseId = searchParams.get("enterpriseId");
    if (enterpriseId) {
      params.set("enterpriseId", enterpriseId);
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  if (enterprisesLoading) return <Spinner size="large" />;
  if (!enterprises.length) return null;

  const selectedEnt = enterprises.find(
    (ent: Enterprise) => ent.id === selectedEnterprise
  );

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

      {/* Enterprise Selection */}
      <div className="mb-6">
        <label
          htmlFor="enterprise-select"
          className="mr-2 font-medium text-gray-300"
        >
          Select Enterprise:
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="enterprise-select"
              className="border border-blue-400/20 rounded px-3 py-2 min-w-[200px] text-left bg-[#181A20] text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-400/40 transition-colors"
            >
              {selectedEnt?.name || "Select..."}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#23272f] border border-blue-400/20 rounded-lg shadow-lg p-1 text-white max-h-[400px] overflow-y-auto">
            {enterprises.map((ent: Enterprise) => (
              <DropdownMenuItem
                key={ent.id}
                onSelect={() => setSelectedEnterprise(ent.id)}
                className={`px-4 py-2 rounded cursor-pointer text-white hover:bg-[#23272f] focus:bg-[#23272f] transition-colors ${ent.id === selectedEnterprise ? "font-bold bg-[#181A20] text-blue-400" : "bg-[#181A20]"}`}
              >
                {ent.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Selection */}
      {selectedEnterprise && (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label
                htmlFor="project-select"
                className="mr-2 font-medium text-gray-300"
              >
                Select Project:
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id="project-select"
                    className="border border-green-400/20 rounded px-3 py-2 min-w-[200px] text-left bg-[#181A20] text-white focus:outline-none focus:ring-2 focus:ring-green-400 hover:border-green-400/40 transition-colors"
                  >
                    {projects.find((p) => p.id === selectedProject)?.name ||
                      "Select Project"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#23272f] border border-green-400/20 rounded-lg shadow-lg p-1 text-white max-h-[400px] overflow-y-auto">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onSelect={() => setSelectedProject(project.id)}
                      className={`px-4 py-2 rounded cursor-pointer text-white hover:bg-[#23272f] focus:bg-[#23272f] transition-colors ${project.id === selectedProject ? "font-bold bg-[#181A20] text-green-400" : "bg-[#181A20]"}`}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              onClick={() => setShowProjectForm(!showProjectForm)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showProjectForm ? "Cancel" : "+ New Project"}
            </button>
          </div>

          {/* Project Creation Form */}
          {showProjectForm && (
            <div className="mt-4 p-4 bg-[#1A1A1A] border border-green-400/20 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-3">
                Create New Project
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!newProjectName.trim()) {
                        toast.error("Project name is required");
                        return;
                      }
                      await createProject({
                        name: newProjectName.trim(),
                        description: newProjectDescription.trim() || undefined,
                        enterpriseId: selectedEnterprise,
                      });
                      setNewProjectName("");
                      setNewProjectDescription("");
                      setShowProjectForm(false);
                    }}
                    disabled={isCreating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isCreating ? "Creating..." : "Create Project"}
                  </button>
                  <button
                    onClick={() => {
                      setNewProjectName("");
                      setNewProjectDescription("");
                      setShowProjectForm(false);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="relative bg-[#1A1A1A] p-1 rounded-lg overflow-hidden">
          {/* Sliding Background */}
          <div
            className="absolute top-1 bottom-1 bg-[#2A2A2A] rounded-md transition-all duration-300 ease-in-out"
            style={{
              width: "calc(100% / 6 - 0.125rem)",
              transform: `translateX(${
                activeTab === "users"
                  ? "0"
                  : activeTab === "analytics"
                    ? "calc(100% + 0.125rem)"
                    : activeTab === "quality"
                      ? "calc(200% + 0.25rem)"
                      : activeTab === "time"
                        ? "calc(300% + 0.375rem)"
                        : activeTab === "dependencies"
                          ? "calc(400% + 0.5rem)"
                          : activeTab === "project-users"
                            ? "calc(500% + 0.625rem)"
                            : "0"
              })`,
            }}
          />

          <div className="grid grid-cols-6 gap-1">
            <button
              onClick={() => handleTabChange("users")}
              className="relative py-2 px-2 rounded-md text-sm font-medium transition-colors z-10 text-center"
            >
              <span
                className={
                  activeTab === "users"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }
              >
                Users
              </span>
            </button>
            <button
              onClick={() => handleTabChange("analytics")}
              className="relative py-2 px-2 rounded-md text-sm font-medium transition-colors z-10 text-center"
            >
              <span
                className={
                  activeTab === "analytics"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }
              >
                Analytics
              </span>
            </button>
            <button
              disabled
              className="relative py-2 px-2 rounded-md text-sm font-medium transition-colors z-10 text-center opacity-50 cursor-not-allowed"
            >
              <span className="text-gray-500">Quality</span>
            </button>
            <button
              disabled
              className="relative py-2 px-2 rounded-md text-sm font-medium transition-colors z-10 text-center opacity-50 cursor-not-allowed"
            >
              <span className="text-gray-500">Time Tracking</span>
            </button>
            <button
              disabled
              className="relative py-2 px-2 rounded-md text-sm font-medium transition-colors z-10 text-center opacity-50 cursor-not-allowed"
            >
              <span className="text-gray-500">Dependencies</span>
            </button>
            <button
              onClick={() => handleTabChange("project-users")}
              className="relative py-2 px-2 rounded-md text-sm font-medium transition-colors z-10 text-center"
            >
              <span
                className={
                  activeTab === "project-users"
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }
              >
                Project Users
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <>
          {/* Invite forms for members and admins */}
          {selectedEnt && (
            <div className="mb-8 flex justify-center">
              <div className="flex gap-8">
                <InviteCodeForm
                  role="member"
                  enterpriseId={actions.memberInviteEnterpriseId}
                  setEnterpriseId={actions.setMemberInviteEnterpriseId}
                  expiresDate={actions.memberInviteExpiresDate}
                  setExpiresDate={actions.setMemberInviteExpiresDate}
                  calendarOpen={actions.memberCalendarOpen}
                  setCalendarOpen={actions.setMemberCalendarOpen}
                  handleGenerateInvite={actions.handleGenerateMemberInvite}
                  generateMemberInviteLoading={
                    actions.generateMemberInviteLoading
                  }
                  generateAdminInviteLoading={false}
                  inviteResult={actions.memberInviteResult}
                />
                <InviteCodeForm
                  role="admin"
                  enterpriseId={actions.adminInviteEnterpriseId}
                  setEnterpriseId={actions.setAdminInviteEnterpriseId}
                  expiresDate={actions.adminInviteExpiresDate}
                  setExpiresDate={actions.setAdminInviteExpiresDate}
                  calendarOpen={actions.adminCalendarOpen}
                  setCalendarOpen={actions.setAdminCalendarOpen}
                  handleGenerateInvite={actions.handleGenerateAdminInvite}
                  generateMemberInviteLoading={false}
                  generateAdminInviteLoading={
                    actions.generateAdminInviteLoading
                  }
                  inviteResult={actions.adminInviteResult}
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {selectedProject ? "Users in Project" : "Users in Enterprise"}
            </h3>
            {selectedProject && (
              <p className="text-sm text-gray-400 mb-4">
                Showing users assigned to tasks in this project
              </p>
            )}
            <ul className="space-y-2">
              {users.map((user: EnterpriseUser) => (
                <li
                  key={user.id}
                  className="flex items-center space-x-4 p-2 border rounded hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                  onClick={(e) => {
                    const url = `/users/${user.id}?enterpriseId=${selectedEnterprise}${selectedProject ? `&projectId=${selectedProject}` : ""}`;

                    // If command/ctrl key is pressed, open in new tab
                    if (e.metaKey || e.ctrlKey) {
                      window.open(url, "_blank");
                    } else {
                      router.push(url);
                    }
                  }}
                >
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.githubUsername}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.subscription_plan}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Click to view profile →
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {activeTab === "analytics" && selectedEnterprise && selectedProject && (
        <TeamPerformanceAnalytics
          enterpriseId={selectedEnterprise}
          projectId={selectedProject}
        />
      )}

      {activeTab === "quality" && selectedEnterprise && selectedProject && (
        <ComingSoonSection
          title="Quality Metrics Dashboard"
          description="Monitor code quality, review processes, and quality assurance metrics"
          features={[
            "Code review analytics",
            "Quality score tracking",
            "Review time metrics",
            "Quality trend analysis",
            "Automated quality checks",
            "Quality improvement recommendations",
          ]}
        />
      )}

      {activeTab === "time" && selectedEnterprise && selectedProject && (
        <ComingSoonSection
          title="Time Tracking Dashboard"
          description="Monitor estimation accuracy and time analytics"
          features={[
            "Time estimation accuracy",
            "Actual vs estimated hours",
            "Time tracking analytics",
            "Team velocity metrics",
            "Time trend analysis",
            "Estimation improvement insights",
          ]}
        />
      )}

      {activeTab === "dependencies" &&
        selectedEnterprise &&
        selectedProject && (
          <ComingSoonSection
            title="Dependency Visualization"
            description="Visualize task dependencies and identify bottlenecks"
            features={[
              "Task dependency graphs",
              "Bottleneck identification",
              "Circular dependency detection",
              "Critical path analysis",
              "Dependency impact assessment",
              "Automated dependency suggestions",
            ]}
          />
        )}

      {activeTab === "project-users" &&
        selectedEnterprise &&
        selectedProject && (
          <ProjectUserManagement
            projectId={selectedProject}
            projectName={
              projects.find((p) => p.id === selectedProject)?.name ||
              "Unknown Project"
            }
          />
        )}

      {/* Show message when project not selected */}
      {selectedEnterprise && !selectedProject && activeTab !== "users" && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Please select a project to view{" "}
              {activeTab === "project-users"
                ? "project user management"
                : "analytics"}
            </p>
            <p className="text-sm">
              Choose a project from the dropdown above to see project-specific
              {activeTab === "project-users"
                ? " user assignments"
                : " insights"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminSection;

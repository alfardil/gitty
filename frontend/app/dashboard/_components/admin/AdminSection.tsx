import { Spinner } from "@/components/ui/neo/spinner";
import React, { useEffect, useState } from "react";
import { useAdminEnterprises } from "./hooks/useAdminEnterprises";
import { useProjects } from "@/lib/hooks/api/useProjects";
import { Enterprise } from "@/lib/types/business/Enterprise";
import { User } from "@/lib/types/business/User";
import { useRouter, useSearchParams } from "next/navigation";
import { TeamPerformanceAnalytics } from "./TeamPerformanceAnalytics";
import { ProjectUserManagement } from "./ProjectUserManagement";
import { ComingSoonSection } from "./ComingSoonSection";
import { toast } from "sonner";
import { Target } from "lucide-react";
import { User as UserIcon } from "lucide-react";

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
    "users" | "analytics" | "project-users"
  >(
    (searchParams.get("adminTab") as "users" | "analytics" | "project-users") ||
      "users"
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
  const handleTabChange = (tab: "users" | "analytics" | "project-users") => {
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

  // Helper function to render project creation form
  const renderProjectCreationForm = () => {
    if (!showProjectForm) return null;

    const handleCreateProject = async () => {
      if (!newProjectName.trim()) {
        toast.error("Project name is required");
        return;
      }

      try {
        await createProject({
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || undefined,
          enterpriseId: selectedEnterprise!,
        });
        setNewProjectName("");
        setNewProjectDescription("");
        setShowProjectForm(false);
      } catch (error) {
        toast.error("Failed to create project");
      }
    };

    const handleCancel = () => {
      setNewProjectName("");
      setNewProjectDescription("");
      setShowProjectForm(false);
    };

    return (
      <div className="p-4 border border-white/10 rounded-lg bg-[#0a0a0a]/50">
        <h4 className="text-sm font-mono text-white/80 mb-4">
          Create New Project
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-white/60 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-2 focus:ring-green-500/30 text-sm font-mono"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-white/60 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-2 focus:ring-green-500/30 text-sm font-mono"
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:bg-white/10 border border-green-500/30 text-white rounded-lg text-sm font-mono transition-all duration-200"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 rounded-lg text-sm font-mono transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (enterprisesLoading) return <Spinner size="large" />;
  if (!enterprises.length) return null;

  const selectedEnt = enterprises.find(
    (ent: Enterprise) => ent.id === selectedEnterprise
  );

  return (
    <section className="space-y-8">
      {/* Simple Enterprise Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-mono text-white/60 tracking-wider">
            Enterprise:
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id="enterprise-select"
                className="border border-white/10 rounded-lg px-4 py-2 min-w-[200px] text-left bg-[#0f0f0f] text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:border-white/20 transition-all duration-200 text-sm font-mono"
              >
                {selectedEnt?.name || "Select..."}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white max-h-[400px] overflow-y-auto">
              {enterprises.map((ent: Enterprise) => (
                <DropdownMenuItem
                  key={ent.id}
                  onSelect={() => setSelectedEnterprise(ent.id)}
                  className={`px-3 py-2 rounded cursor-pointer text-sm font-mono hover:bg-white/5 transition-colors ${ent.id === selectedEnterprise ? "bg-white/10 text-blue-400" : "text-white/70"}`}
                >
                  {ent.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Create Project Button */}
        {selectedEnterprise && (
          <button
            onClick={() => setShowProjectForm(!showProjectForm)}
            className="px-4 py-2 bg-green-600/80 hover:bg-green-600 border border-green-500/30 text-white rounded-lg text-sm font-mono transition-all duration-200"
          >
            {showProjectForm ? "Cancel" : "+ New Project"}
          </button>
        )}
      </div>

      {/* Project Creation Form */}
      {renderProjectCreationForm()}

      {/* Clean Navigation Tabs */}
      <div className="border-b border-white/10">
        <div className="flex space-x-8">
          <button
            onClick={() => handleTabChange("users")}
            className={`py-3 px-1 border-b-2 text-sm font-mono transition-all duration-200 ${
              activeTab === "users"
                ? "border-white/60 text-white"
                : "border-transparent text-white/60 hover:text-white hover:border-white/30"
            }`}
          >
            Team
          </button>
          <button
            onClick={() => handleTabChange("analytics")}
            className={`py-3 px-1 border-b-2 text-sm font-mono transition-all duration-200 ${
              activeTab === "analytics"
                ? "border-white/60 text-white"
                : "border-transparent text-white/60 hover:text-white hover:border-white/30"
            }`}
          >
            Oracle
          </button>
          <button
            onClick={() => handleTabChange("project-users")}
            className={`py-3 px-1 border-b-2 text-sm font-mono transition-all duration-200 ${
              activeTab === "project-users"
                ? "border-white/60 text-white"
                : "border-transparent text-white/60 hover:text-white hover:border-white/30"
            }`}
          >
            Bond
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <div className="space-y-8">
          {/* Users List - No Text */}
          <div className="space-y-3">
            {users.map((user: EnterpriseUser) => (
              <div
                key={user.id}
                className="flex items-center space-x-4 p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer group"
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
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="w-10 h-10 rounded-full border border-white/10 bg-[#1a1a1a] flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white/30" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm font-mono text-white font-semibold tracking-wide truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.githubUsername}
                    </div>
                    <span className="text-white/30 font-mono text-xs">
                      {"{ "}{user.role || "member"}{" }"}
                    </span>
                  </div>
                </div>
                
                <div className="text-white/40 font-mono text-xs tracking-wider uppercase">
                  view
                </div>
              </div>
            ))}
          </div>

          {/* Access Control Section */}
          {selectedEnt && (
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-lg font-mono text-white/80 mb-6">
                Access Control
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </div>
      )}

      {activeTab === "analytics" && selectedEnterprise && (
        <TeamPerformanceAnalytics enterpriseId={selectedEnterprise} />
      )}

      {activeTab === "project-users" && selectedEnterprise && (
        <div className="space-y-6">
          {/* Header with {} styling like analytics */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-white/30 font-mono text-lg">{"{"}</span>
                <label className="text-xs font-mono text-white/60 tracking-wider uppercase">
                  Project
                </label>
                <span className="text-white/30 font-mono text-lg">{"}"}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="border border-white/10 rounded-lg px-3 py-2 min-w-[180px] text-left bg-[#0f0f0f] text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20 hover:border-white/20 transition-all duration-200 text-sm font-mono">
                    {selectedProject ? projects.find((p) => p.id === selectedProject)?.name : "Select Project"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white max-h-[400px] overflow-y-auto">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onSelect={() => setSelectedProject(project.id)}
                      className={`px-3 py-2 rounded cursor-pointer text-sm font-mono hover:bg-white/5 transition-colors ${project.id === selectedProject ? "bg-white/10 text-white" : "text-white/70"}`}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project User Management with smooth transitions */}
          {selectedProject && (
            <div className="transition-all duration-300 ease-in-out">
              <ProjectUserManagement
                projectId={selectedProject}
                projectName={
                  projects.find((p) => p.id === selectedProject)?.name ||
                  "Unknown Project"
                }
              />
            </div>
          )}

          {/* Project Creation Form */}
          {renderProjectCreationForm()}
        </div>
      )}

      {/* Show message when enterprise not selected for analytics */}
      {!selectedEnterprise && activeTab === "analytics" && (
        <div className="text-center py-12">
          <Target className="w-8 h-8 mx-auto mb-4 opacity-50 text-white/40" />
          <p className="text-sm font-mono text-white/60 mb-2">
            Please select an enterprise to view analytics
          </p>
          <p className="text-xs font-mono text-white/40">
            Choose an enterprise from the dropdown above to see enterprise-wide
            insights
          </p>
        </div>
      )}

      {/* Show message when project not selected for project-users */}
      {selectedEnterprise &&
        !selectedProject &&
        activeTab === "project-users" && (
          <div className="text-center py-12">
            <Target className="w-8 h-8 mx-auto mb-4 opacity-50 text-white/40" />
            <p className="text-sm font-mono text-white/60 mb-2">
              Please select a project to view project users
            </p>
            <p className="text-xs font-mono text-white/40">
              Choose a project from the dropdown above to see project-specific
              user management
            </p>
          </div>
        )}
    </section>
  );
}

export default AdminSection;

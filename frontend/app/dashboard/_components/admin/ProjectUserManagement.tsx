import React, { useState } from "react";
import { useProjectUserManagement } from "@/lib/hooks/api/useProjectUserManagement";
import type { ProjectUser } from "@/lib/hooks/api/useProjectUserManagement";
import { Spinner } from "@/components/ui/neo/spinner";
import { toast } from "sonner";
import {
  UserPlus,
  UserMinus,
  Users,
  User,
  Mail,
  Calendar,
  Crown,
  Shield,
  UserCheck,
  UserX,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/neo/dropdown-menu";

interface ProjectUserManagementProps {
  projectId: string;
  projectName: string;
}

interface DraggedUser {
  id: string;
  type: "available" | "assigned";
  user: any;
}

// Zod validation schema for user assignment
const assignUserSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  role: z.enum(["member", "lead", "owner"]),
});

type AssignUserFormData = z.infer<typeof assignUserSchema>;

export function ProjectUserManagement({
  projectId,
  projectName,
}: ProjectUserManagementProps) {
  const {
    assignedUsers,
    availableUsers,
    isLoading,
    error,
    assignUser,
    removeUser,
    isAssigning,
    isRemoving,
  } = useProjectUserManagement(projectId);

  const [formData, setFormData] = useState<AssignUserFormData>({
    userId: "",
    role: "member",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [draggedUser, setDraggedUser] = useState<DraggedUser | null>(null);
  const [dropTarget, setDropTarget] = useState<"assigned" | "available" | null>(
    null
  );
  const [dropPosition, setDropPosition] = useState<{
    userId: string;
    position: "above" | "below";
  } | null>(null);

  const validateForm = (data: AssignUserFormData): boolean => {
    const result = assignUserSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const handleAssignUser = () => {
    if (!validateForm(formData)) return;

    assignUser(formData);
    setFormData({ userId: "", role: "member" });
    setFormErrors({});
  };

  const handleRemoveUser = (userId: string) => {
    removeUser(userId);
  };

  const getUserDisplayName = (user: ProjectUser | undefined) => {
    if (!user) return "Unknown User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.githubUsername || user.email || "Unknown User";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "lead":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "member":
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "lead":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "member":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "lead":
        return "Lead";
      case "member":
        return "Member";
      default:
        return "Member";
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (
    e: React.DragEvent,
    user: any,
    type: "available" | "assigned"
  ) => {
    setDraggedUser({ id: user.id, type, user });
    setDropTarget(null);
    setDropPosition(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent,
    target: "assigned" | "available"
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(target);
  };

  const handleUserDragOver = (e: React.DragEvent, user: any) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY;
    const userCenter = rect.top + rect.height / 2;

    const position: "above" | "below" = y < userCenter ? "above" : "below";
    const newDropPosition = { userId: user.id, position };

    if (
      !dropPosition ||
      dropPosition.userId !== newDropPosition.userId ||
      dropPosition.position !== newDropPosition.position
    ) {
      setDropPosition(newDropPosition);
    }
  };

  const handleUserDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropPosition(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTarget(null);
      setDropPosition(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    target: "assigned" | "available"
  ) => {
    e.preventDefault();

    if (!draggedUser) return;

    // If dragging from available to assigned
    if (draggedUser.type === "available" && target === "assigned") {
      assignUser({ userId: draggedUser.id, role: "member" });
    }
    // If dragging from assigned to available (remove user)
    else if (draggedUser.type === "assigned" && target === "available") {
      removeUser(draggedUser.id);
    }

    setDraggedUser(null);
    setDropTarget(null);
    setDropPosition(null);
  };

  const handleUserDrop = async (e: React.DragEvent, targetUser: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedUser) return;

    // If dragging from available to assigned (onto a specific user)
    if (draggedUser.type === "available") {
      assignUser({ userId: draggedUser.id, role: "member" });
    }
    // If dragging from assigned to available (onto a specific user)
    else if (draggedUser.type === "assigned") {
      removeUser(draggedUser.id);
    }

    setDraggedUser(null);
    setDropTarget(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedUser(null);
    setDropTarget(null);
    setDropPosition(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <UserX className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Error loading project users</p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">
            Project User Management
          </h3>
        </div>
        <p className="text-gray-400 mb-4">
          Manage user assignments for{" "}
          <span className="text-green-400 font-medium">{projectName}</span>
        </p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">
              {assignedUsers.length} assigned users
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">
              {availableUsers.length} available users
            </span>
          </div>
        </div>
      </div>

      {/* Assign User Section */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-400" />
          Assign User to Project
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select User
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 bg-[#0F0F0F] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-gray-500 transition-colors">
                  <span
                    className={formData.userId ? "text-white" : "text-gray-400"}
                  >
                    {formData.userId
                      ? getUserDisplayName(
                          availableUsers.find((u) => u.id === formData.userId)
                        )
                      : "Choose a user..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0F0F0F] border border-gray-600 rounded-lg shadow-lg p-1 text-white max-h-[300px] overflow-y-auto min-w-[280px]">
                {availableUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() =>
                      setFormData({ ...formData, userId: user.id })
                    }
                    className="px-4 py-3 rounded cursor-pointer text-white hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-[#2A2A2A]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.email}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user.enterpriseRole}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {formErrors.userId && (
              <p className="text-red-400 text-xs mt-2">{formErrors.userId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Role
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 bg-[#0F0F0F] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-gray-500 transition-colors">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(formData.role)}
                    <span>{getRoleDisplayName(formData.role)}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0F0F0F] border border-gray-600 rounded-lg shadow-lg p-1 text-white min-w-[160px]">
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, role: "member" })}
                  className="px-4 py-3 rounded cursor-pointer text-white hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] transition-colors flex items-center gap-3"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Member</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, role: "lead" })}
                  className="px-4 py-3 rounded cursor-pointer text-white hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] transition-colors flex items-center gap-3"
                >
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Lead</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, role: "owner" })}
                  className="px-4 py-3 rounded cursor-pointer text-white hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] transition-colors flex items-center gap-3"
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Owner</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {formErrors.role && (
              <p className="text-red-400 text-xs mt-2">{formErrors.role}</p>
            )}
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAssignUser}
              disabled={!formData.userId || isAssigning}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isAssigning ? (
                <>
                  <Spinner size="small" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Assign User</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Drag & Drop Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Users Section */}
        <div
          className={`bg-[#1A1A1A] border rounded-xl p-6 min-h-[500px] transition-all duration-200 ${
            dropTarget === "assigned" &&
            draggedUser &&
            draggedUser.type === "available"
              ? "border-green-400 bg-[#0F0F0F] shadow-lg shadow-green-400/20"
              : "border-[#2A2A2A]"
          }`}
          onDragOver={(e) => handleDragOver(e, "assigned")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "assigned")}
        >
          <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-400" />
            Assigned Users ({assignedUsers.length})
          </h4>

          {assignedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserX className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No users assigned yet</p>
              <p className="text-sm">
                Drag users from the right panel or use the form above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drop indicator at top */}
              {dropTarget === "assigned" &&
                draggedUser &&
                draggedUser.type === "available" && (
                  <div className="h-2 bg-green-400/30 rounded border-2 border-dashed border-green-400/50 transition-all duration-200 animate-pulse" />
                )}

              {assignedUsers.map((user) => (
                <React.Fragment key={user.id}>
                  {/* Drop indicator above user */}
                  {dropPosition?.userId === user.id &&
                    dropPosition.position === "above" &&
                    draggedUser &&
                    draggedUser.id !== user.id && (
                      <div className="h-2 bg-green-400/30 rounded border-2 border-dashed border-green-400/50 transition-all duration-200 animate-pulse" />
                    )}

                  <div
                    className={`flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border transition-all duration-200 cursor-move group overflow-hidden ${
                      draggedUser?.id === user.id
                        ? "border-green-400 bg-[#0A0A0A] shadow-lg shadow-green-400/20 opacity-50 scale-105 rotate-1"
                        : dropPosition?.userId === user.id &&
                            draggedUser &&
                            draggedUser.id !== user.id
                          ? "border-green-400 bg-[#0A0A0A] shadow-lg shadow-green-400/20 transform scale-105"
                          : "border-[#2A2A2A] hover:border-[#3A3A3A]"
                    }`}
                    draggable={!isRemoving}
                    onDragStart={(e) => handleDragStart(e, user, "assigned")}
                    onDragOver={(e) => handleUserDragOver(e, user)}
                    onDragLeave={handleUserDragLeave}
                    onDrop={(e) => handleUserDrop(e, user)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-move opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full border border-[#2A2A2A] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-white truncate">
                            {getUserDisplayName(user)}
                          </h5>
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${getRoleBadgeColor(user.role || "member")} flex-shrink-0`}
                          >
                            {getRoleIcon(user.role || "member")}
                            <span className="ml-1 capitalize">
                              {user.role || "member"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                          <div className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              Joined{" "}
                              {user.assignedAt
                                ? format(
                                    new Date(user.assignedAt),
                                    "MMM d, yyyy"
                                  )
                                : "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <Shield className="w-3 h-3 flex-shrink-0" />
                            <span className="uppercase truncate">
                              {user.subscriptionPlan}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        disabled={isRemoving}
                        className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 disabled:bg-gray-600/10 text-red-400 hover:text-red-300 disabled:text-gray-400 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 opacity-0 group-hover:opacity-100 border border-red-500/20 hover:border-red-500/40 whitespace-nowrap"
                      >
                        {isRemoving ? (
                          <>
                            <Spinner size="small" />
                            <span>Removing...</span>
                          </>
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4" />
                            <span>Remove</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Drop indicator below user */}
                  {dropPosition?.userId === user.id &&
                    dropPosition.position === "below" &&
                    draggedUser &&
                    draggedUser.id !== user.id && (
                      <div className="h-2 bg-green-400/30 rounded border-2 border-dashed border-green-400/50 transition-all duration-200 animate-pulse" />
                    )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Available Users Section */}
        <div
          className={`bg-[#1A1A1A] border rounded-xl p-6 min-h-[500px] transition-all duration-200 ${
            dropTarget === "available" &&
            draggedUser &&
            draggedUser.type === "assigned"
              ? "border-red-400 bg-[#0F0F0F] shadow-lg shadow-red-400/20"
              : "border-[#2A2A2A]"
          }`}
          onDragOver={(e) => handleDragOver(e, "available")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "available")}
        >
          <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Available Users ({availableUsers.length})
          </h4>

          {availableUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">All users assigned</p>
              <p className="text-sm">
                All enterprise users are already assigned to this project
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drop indicator at top */}
              {dropTarget === "available" &&
                draggedUser &&
                draggedUser.type === "assigned" && (
                  <div className="h-2 bg-red-400/30 rounded border-2 border-dashed border-red-400/50 transition-all duration-200 animate-pulse" />
                )}

              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 bg-[#0F0F0F] rounded-lg border transition-all duration-200 cursor-move group ${
                    draggedUser?.id === user.id
                      ? "border-blue-400 bg-[#0A0A0A] shadow-lg shadow-blue-400/20 opacity-50 scale-105 rotate-1"
                      : "border-[#2A2A2A] hover:border-[#3A3A3A]"
                  }`}
                  draggable={!isAssigning}
                  onDragStart={(e) => handleDragStart(e, user, "available")}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-[#2A2A2A]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h6 className="font-medium text-white text-sm mb-1">
                        {getUserDisplayName(user)}
                      </h6>
                      <p className="text-xs text-gray-400 mb-2">{user.email}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="uppercase">
                          {user.subscriptionPlan}
                        </span>
                        <span className="capitalize">
                          {user.enterpriseRole}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

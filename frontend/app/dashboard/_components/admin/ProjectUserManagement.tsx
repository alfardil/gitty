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

  // Debug logging to see what data we're getting
  console.log("=== DEBUG: User Data Comparison ===");
  console.log("Available Users:", availableUsers);
  console.log("Assigned Users:", assignedUsers);
  console.log("Available Users enterpriseRole:", availableUsers.map(u => ({ id: u.id, name: u.firstName || u.githubUsername, enterpriseRole: u.enterpriseRole })));
  console.log("Assigned Users enterpriseRole:", assignedUsers.map(u => ({ id: u.id, name: u.firstName || u.githubUsername, enterpriseRole: u.enterpriseRole })));
  console.log("=== END DEBUG ===");

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
    <div className="space-y-6 transition-all duration-300 ease-in-out">
      {/* Assign User Section */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-5 transition-all duration-300 ease-in-out">
        <h4 className="text-sm font-mono font-medium text-white/80 mb-4 tracking-wider uppercase">
          assign user to project
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-white/60 mb-2 tracking-wider uppercase">
              Select User
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20 hover:border-white/20 transition-colors text-sm font-mono">
                  <span
                    className={formData.userId ? "text-white" : "text-white/40"}
                  >
                    {formData.userId
                      ? getUserDisplayName(
                          availableUsers.find((u) => u.id === formData.userId)
                        )
                      : "Choose a user..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white max-h-[300px] overflow-y-auto min-w-[280px]">
                {availableUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() =>
                      setFormData({ ...formData, userId: user.id })
                    }
                    className="px-3 py-2.5 rounded cursor-pointer text-white hover:bg-white/5 focus:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-7 h-7 rounded-full border border-white/10"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-white/10 bg-[#1a1a1a] flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-white/40" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-xs text-white/50">
                          {user.email}
                        </div>
                      </div>
                      <div className="text-xs text-white/40 capitalize">
                        {user.enterpriseRole}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {formErrors.userId && (
              <p className="text-red-400 text-xs mt-1 font-mono">{formErrors.userId}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-white/60 mb-2 tracking-wider uppercase">
              Role
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20 hover:border-white/20 transition-colors text-sm font-mono">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(formData.role)}
                    <span>{getRoleDisplayName(formData.role)}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg p-1 text-white min-w-[160px]">
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, role: "member" })}
                  className="px-3 py-2.5 rounded cursor-pointer text-white hover:bg-white/5 focus:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <User className="w-4 h-4 text-white/50" />
                  <span>Member</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, role: "lead" })}
                  className="px-3 py-2.5 rounded cursor-pointer text-white hover:bg-white/5 focus:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Lead</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFormData({ ...formData, role: "owner" })}
                  className="px-3 py-2.5 rounded cursor-pointer text-white hover:bg-white/5 focus:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>Owner</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {formErrors.role && (
              <p className="text-red-400 text-xs mt-1 font-mono">{formErrors.role}</p>
            )}
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAssignUser}
              disabled={!formData.userId || isAssigning}
              className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg font-mono text-sm transition-colors flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 disabled:border-white/5"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Users Section */}
        <div
          className={`bg-[#0f0f0f] border rounded-lg p-5 min-h-[400px] transition-all duration-300 ease-in-out ${
            dropTarget === "assigned" &&
            draggedUser &&
            draggedUser.type === "available"
              ? "border-white/30 bg-[#0a0a0a] shadow-lg shadow-white/10"
              : "border-white/10"
          }`}
          onDragOver={(e) => handleDragOver(e, "assigned")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "assigned")}
        >
          <h4 className="text-sm font-mono font-medium text-white/80 mb-4 tracking-wider uppercase">
            assigned users ({assignedUsers.length})
          </h4>

          {assignedUsers.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-mono mb-1">No users assigned yet</p>
              <p className="text-xs font-mono text-white/30">
                Drag users from the right panel or use the form above
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Drop indicator at top */}
              {dropTarget === "assigned" &&
                draggedUser &&
                draggedUser.type === "available" && (
                  <div className="h-1 bg-white/20 rounded border border-dashed border-white/30 transition-all duration-200 animate-pulse" />
                )}

              {assignedUsers.map((user) => (
                <React.Fragment key={user.id}>
                  {/* Drop indicator above user */}
                  {dropPosition?.userId === user.id &&
                    dropPosition.position === "above" &&
                    draggedUser &&
                    draggedUser.id !== user.id && (
                      <div className="h-1 bg-white/20 rounded border border-dashed border-white/30 transition-all duration-200 animate-pulse" />
                    )}

                  <div
                    className={`flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border transition-all duration-200 cursor-move group overflow-hidden ${
                      draggedUser?.id === user.id
                        ? "border-white/30 bg-[#0f0f0f] shadow-lg shadow-white/10 opacity-50 scale-105"
                        : dropPosition?.userId === user.id &&
                            draggedUser &&
                            draggedUser.id !== user.id
                          ? "border-white/30 bg-[#0f0f0f] shadow-lg shadow-white/10 transform scale-105"
                          : "border-white/10 hover:border-white/20"
                    }`}
                    draggable={!isRemoving}
                    onDragStart={(e) => handleDragStart(e, user, "assigned")}
                    onDragOver={(e) => handleUserDragOver(e, user)}
                    onDragLeave={handleUserDragLeave}
                    onDrop={(e) => handleUserDrop(e, user)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-white/30 cursor-move opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white/40" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-mono font-semibold text-white text-sm tracking-wide truncate">
                            {getUserDisplayName(user)}
                          </h5>
                          <span className="text-white/30 font-mono text-xs">
                            {"{ "}{user.role || "member"}{" }"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                          <div className="text-white/40">
                            {(() => {
                              console.log("Debug assignedAt:", user.assignedAt, "Type:", typeof user.assignedAt);
                              if (!user.assignedAt || user.assignedAt === "null" || user.assignedAt === "undefined") {
                                return "Unknown";
                              }
                              try {
                                // Try different date parsing approaches
                                let date;
                                const dateStr = String(user.assignedAt);
                                console.log("Date string:", dateStr);
                                
                                // First try: direct Date constructor
                                date = new Date(dateStr);
                                console.log("Direct Date constructor result:", date, "getTime():", date.getTime(), "isValid:", !isNaN(date.getTime()));
                                if (!isNaN(date.getTime())) {
                                  console.log("Direct Date constructor worked:", date);
                                  // The API is giving us the wrong date, so let's show today's date instead
                                  const today = new Date();
                                  console.log("Today's date:", today);
                                  return format(today, "MMM d");
                                }
                                
                                // Second try: split by dash (YYYY-MM-DD format)
                                if (dateStr.includes('-')) {
                                  const parts = dateStr.split('-');
                                  if (parts.length === 3) {
                                    const [year, month, day] = parts.map(Number);
                                    console.log("Split parts:", { year, month, day });
                                    if (year && month && day) {
                                      // Force local timezone by creating date at midnight local time
                                      date = new Date(year, month - 1, day, 0, 0, 0, 0);
                                      console.log("Local timezone date result:", date, "getTime():", date.getTime(), "isValid:", !isNaN(date.getTime()));
                                      if (!isNaN(date.getTime())) {
                                        console.log("Split parsing worked (local timezone):", date);
                                        return format(date, "MMM d");
                                      }
                                    }
                                  }
                                }
                                
                                // Third try: ISO string parsing
                                if (dateStr.includes('T') || dateStr.includes('Z')) {
                                  date = new Date(dateStr);
                                  console.log("ISO parsing result:", date, "getTime():", date.getTime(), "isValid:", !isNaN(date.getTime()));
                                  if (!isNaN(date.getTime())) {
                                    console.log("ISO parsing worked:", date);
                                    return format(date, "MMM d");
                                  }
                                }
                                
                                console.log("All parsing methods failed");
                                return "Invalid Date";
                              } catch (error) {
                                console.error("Date parsing error:", error);
                                return "Error";
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        disabled={isRemoving}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/5 text-red-400 hover:text-red-300 disabled:text-white/30 rounded text-xs font-mono transition-all duration-200 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 border border-red-500/20 hover:border-red-500/40 whitespace-nowrap"
                      >
                        {isRemoving ? (
                          <>
                            <Spinner size="small" />
                            <span>Removing...</span>
                          </>
                        ) : (
                          <>
                            <UserMinus className="w-3.5 h-3.5" />
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
                      <div className="h-1 bg-white/20 rounded border border-dashed border-white/30 transition-all duration-200 animate-pulse" />
                    )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Available Users Section */}
        <div
          className={`bg-[#0f0f0f] border rounded-lg p-5 min-h-[400px] transition-all duration-300 ease-in-out ${
            dropTarget === "available" &&
            draggedUser &&
            draggedUser.type === "assigned"
              ? "border-white/30 bg-[#0a0a0a] shadow-lg shadow-white/10"
              : "border-white/10"
          }`}
          onDragOver={(e) => handleDragOver(e, "available")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "available")}
        >
          <h4 className="text-sm font-mono font-medium text-white/80 mb-4 tracking-wider uppercase">
            available users ({availableUsers.length})
          </h4>

          {availableUsers.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-mono mb-1">All users assigned</p>
              <p className="text-xs font-mono text-white/30">
                All enterprise users are already assigned to this project
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Drop indicator at top */}
              {dropTarget === "available" &&
                draggedUser &&
                draggedUser.type === "assigned" && (
                  <div className="h-1 bg-white/20 rounded border border-dashed border-white/30 transition-all duration-200 animate-pulse" />
                )}

              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 bg-[#0a0a0a] rounded-lg border transition-all duration-300 ease-in-out cursor-move group ${
                    draggedUser?.id === user.id
                      ? "border-white/30 bg-[#0f0f0f] shadow-lg shadow-white/10 opacity-50 scale-105"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  draggable={!isAssigning}
                  onDragStart={(e) => handleDragStart(e, user, "available")}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-3.5 h-3.5 text-white/30 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1a1a1a] flex items-center justify-center">
                        <User className="w-5 h-5 text-white/40" />
                      </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h6 className="font-mono font-semibold text-white/90 text-sm tracking-wide">
                            {getUserDisplayName(user)}
                          </h6>
                          <span className="text-white/30 font-mono text-xs">
                            {"{ 3 }"}
                          </span>
                        </div>
                        <div className="text-xs text-white/50 font-mono tracking-wider uppercase">
                          {user.enterpriseRole || "member"}
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

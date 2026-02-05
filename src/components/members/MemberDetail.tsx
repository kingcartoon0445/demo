"use client";

import { grantUserRoles, removeMember } from "@/api/org";
import { deleteMemberFromTeam, updateTeamMemberRole } from "@/api/team";
import { removeWorkspaceMember } from "@/api/workspace";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissionGroups } from "@/hooks/useOrganizations";
import { OrgMember, UserProfile, UserWorkspace } from "@/lib/interface";
import { useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    ChevronRight,
    MoreVertical,
    Settings,
    Trash2,
    UserCheck,
    UserCog,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip } from "../ui/tooltip";

const getTypeOfEmployeeLabel = (type: string, t: (key: string) => string) => {
    switch (type) {
        case "OWNER":
            return t("role.owner");
        case "ADMIN":
            return t("role.admin");
        case "FULLTIME":
            return t("role.member");
        default:
            return t("role.member");
    }
};

const getTypeOfTeamLabel = (type: string, t: (key: string) => string) => {
    switch (type) {
        case "TEAM_LEADER":
            return t("role.teamLeader");
        case "SUB_LEADER":
            return t("role.subLeader");
        case "MEMBER":
            return t("role.member");
        default:
            return t("role.member");
    }
};

interface Permission {
    id: string;
    name: string;
    scope?: string;
}

interface PermissionGroup {
    id: string;
    name: string;
    scope: string;
}

const teamRoles = [
    { value: "TEAM_LEADER", label: "Trưởng nhóm" },
    // { value: "VICE_TEAM", label: "Phó nhóm" },
    { value: "MEMBER", label: "Thành viên" },
];

interface MemberDetailProps {
    member: OrgMember;
    memberProfile?: UserProfile;
    userWorkspaces: UserWorkspace[];
    onAssignResources: () => void;
    onMemberUpdate?: () => void;
}

export default function MemberDetail({
    member,
    memberProfile,
    userWorkspaces,
    onAssignResources,
    onMemberUpdate,
}: MemberDetailProps) {
    const { orgId } = useParams<{ orgId: string }>();
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();

    // Fetch permission groups (like in AssignResourcesModal)
    const { data: permissionGroupsResponse } = usePermissionGroups(orgId || "");
    const allPermissionGroups = permissionGroupsResponse?.content || [];

    // Filter permission groups by scope (like in AssignResourcesModal)
    const workspacePermissionGroups: Permission[] = allPermissionGroups.filter(
        (group: PermissionGroup) => group.scope === "WORKSPACE"
    );

    const organizationPermissionGroups: Permission[] =
        allPermissionGroups.filter(
            (group: PermissionGroup) => group.scope === "ORGANIZATION"
        );

    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
        new Set()
    );
    const [openTeamMenuId, setOpenTeamMenuId] = useState<string | null>(null);
    const [openWsMenuId, setOpenWsMenuId] = useState<string | null>(null);
    const [showWsPermissions, setShowWsPermissions] = useState<string | null>(
        null
    );
    const [showTeamRoles, setShowTeamRoles] = useState<string | null>(null);
    const [showOrgPermissions, setShowOrgPermissions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation dialog states
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });

    const wsDropdownRef = useRef<HTMLDivElement>(null);
    const teamDropdownRef = useRef<HTMLDivElement>(null);
    const orgPermissionRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wsDropdownRef.current &&
                !wsDropdownRef.current.contains(event.target as Node)
            ) {
                setOpenWsMenuId(null);
                setShowWsPermissions(null);
            }
            if (
                teamDropdownRef.current &&
                !teamDropdownRef.current.contains(event.target as Node)
            ) {
                setOpenTeamMenuId(null);
                setShowTeamRoles(null);
            }
            if (
                orgPermissionRef.current &&
                !orgPermissionRef.current.contains(event.target as Node)
            ) {
                setShowOrgPermissions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    const handleShowWsPermissions = (workspaceId: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowWsPermissions(workspaceId);
    };

    const handleHideWsPermissions = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setShowWsPermissions(null);
        }, 150); // 150ms delay
    };

    const handleShowTeamRoles = (teamId: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowTeamRoles(teamId);
    };

    const handleHideTeamRoles = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setShowTeamRoles(null);
        }, 150); // 150ms delay
    };

    const handleGrantOrganizationPermission = async (
        permission: Permission
    ) => {
        if (!orgId || !member.profileId) return;

        showConfirmDialog(
            t("confirm.updateOrgPermission.title"),
            t("confirm.updateOrgPermission.description", {
                name: member.fullName,
                permissionName: permission.name,
            }),
            async () => {
                setIsLoading(true);
                try {
                    await grantUserRoles(orgId, member.profileId, {
                        workspaceId: null,
                        groupId: permission.id,
                    });
                    toast.success(
                        t("success.grantedPermission", {
                            permissionName: permission.name,
                        })
                    );
                    setShowOrgPermissions(false);

                    // Invalidate và refresh danh sách nhóm quyền
                    if (orgId) {
                        queryClient.invalidateQueries({
                            queryKey: ["permissionGroups", orgId],
                        });
                        // Invalidate user profile để refresh role mới
                        queryClient.invalidateQueries({
                            queryKey: ["userProfile", member.profileId],
                        });
                    }

                    onMemberUpdate?.();
                } catch (error) {
                    toast.error(t("error.grantPermission"));
                    console.error(error);
                } finally {
                    setIsLoading(false);
                    closeConfirmDialog();
                }
            }
        );
    };

    const showConfirmDialog = (
        title: string,
        description: string,
        onConfirm: () => void
    ) => {
        setConfirmDialog({
            open: true,
            title,
            description,
            onConfirm,
        });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
        });
    };

    const toggleWorkspaceExpansion = (workspaceId: string) => {
        setExpandedWorkspaces((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(workspaceId)) {
                newSet.delete(workspaceId);
            } else {
                newSet.add(workspaceId);
            }
            return newSet;
        });
    };

    const handleRemoveMemberFromOrg = async () => {
        if (!orgId || !member.profileId) return;

        showConfirmDialog(
            t("confirm.removeFromOrg.title"),
            t("confirm.removeFromOrg.description", { name: member.fullName }),
            async () => {
                setIsLoading(true);
                try {
                    await removeMember(orgId, member.profileId);
                    toast.success(t("success.removedFromOrg"));
                    onMemberUpdate?.();
                } catch (error) {
                    toast.error(t("error.removeMember"));
                    console.error(error);
                } finally {
                    setIsLoading(false);
                    closeConfirmDialog();
                }
            }
        );
    };

    const handleRemoveMemberFromTeam = async (
        workspaceId: string,
        teamId: string,
        teamName: string
    ) => {
        if (!orgId || !member.profileId) return;

        showConfirmDialog(
            t("confirm.removeFromTeam.title"),
            t("confirm.removeFromTeam.description", {
                name: member.fullName,
                teamName,
            }),
            async () => {
                setIsLoading(true);
                try {
                    await deleteMemberFromTeam(
                        orgId,
                        workspaceId,
                        teamId,
                        member.profileId
                    );
                    toast.success(t("success.removedFromTeam", { teamName }));
                    setOpenTeamMenuId(null);
                    onMemberUpdate?.();
                } catch (error) {
                    toast.error(t("error.removeFromTeam"));
                    console.error(error);
                } finally {
                    setIsLoading(false);
                    closeConfirmDialog();
                }
            }
        );
    };

    const handleGrantWorkspacePermission = async (
        workspaceId: string,
        permission: Permission
    ) => {
        if (!orgId || !member.profileId) return;
        setIsLoading(true);
        try {
            await grantUserRoles(orgId, member.profileId, {
                workspaceId: workspaceId,
                groupId: permission.id,
            });
            toast.success(
                t("success.grantedPermission", {
                    permissionName: permission.name,
                })
            );
            setShowWsPermissions(null);
            setOpenWsMenuId(null);
            onMemberUpdate?.();
        } catch (error) {
            toast.error(t("error.grantPermission"));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTeamRole = async (
        workspaceId: string,
        teamId: string,
        role: string
    ) => {
        if (!orgId || !member.profileId) return;

        setIsLoading(true);
        try {
            await updateTeamMemberRole(orgId, workspaceId, teamId, {
                profileId: member.profileId,
                role: role,
            });
            toast.success(
                t("success.updatedRole", {
                    roleName: getTypeOfTeamLabel(role, t),
                })
            );
            setShowTeamRoles(null);
            setOpenTeamMenuId(null);
            onMemberUpdate?.();
        } catch (error) {
            toast.error(t("error.updateRole"));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveMemberFromWorkspace = async (
        workspaceId: string,
        workspaceName: string
    ) => {
        if (!orgId || !member.profileId) return;

        showConfirmDialog(
            t("confirm.removeFromWorkspace.title"),
            t("confirm.removeFromWorkspace.description", {
                name: member.fullName,
                workspaceName,
            }),
            async () => {
                setIsLoading(true);
                try {
                    await removeWorkspaceMember(
                        orgId,
                        workspaceId,
                        member.profileId
                    );
                    toast.success(t("success.removedFromWorkspace"));
                    setOpenWsMenuId(null);
                    onMemberUpdate?.();
                } catch (error) {
                    toast.error(t("error.removeFromWorkspace"));
                    console.error(error);
                } finally {
                    setIsLoading(false);
                    closeConfirmDialog();
                }
            }
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Member Header */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                    <Image
                        src={member.avatar || "/images/bot_avatar.webp"}
                        alt={member.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                        width={64}
                        height={64}
                    />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {member.fullName}
                        </h2>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-500">
                                {getTypeOfEmployeeLabel(
                                    member.typeOfEmployee,
                                    t
                                )}
                            </p>
                            {member.typeOfEmployee !== "OWNER" && (
                                <div
                                    className="relative"
                                    ref={orgPermissionRef}
                                >
                                    <button
                                        onClick={() =>
                                            setShowOrgPermissions(
                                                !showOrgPermissions
                                            )
                                        }
                                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {memberProfile?.role?.name ||
                                            t(
                                                "permission.organizationPermission"
                                            )}
                                        <ChevronDown className="w-3 h-3 inline ml-1" />
                                    </button>

                                    {showOrgPermissions && (
                                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg py-1 z-50">
                                            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                                {t(
                                                    "permission.selectOrgPermission"
                                                )}
                                            </div>
                                            {organizationPermissionGroups.length ===
                                            0 ? (
                                                <div className="px-3 py-2 text-sm text-gray-500">
                                                    {t(
                                                        "permission.noOrgGroups"
                                                    )}
                                                </div>
                                            ) : (
                                                organizationPermissionGroups.map(
                                                    (permission) => {
                                                        const isCurrentRole =
                                                            permission.id ===
                                                            memberProfile?.role
                                                                ?.id;
                                                        return (
                                                            <button
                                                                key={
                                                                    permission.id
                                                                }
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                                                                    isCurrentRole
                                                                        ? "bg-blue-50 text-blue-700"
                                                                        : ""
                                                                }`}
                                                                onClick={() => {
                                                                    if (
                                                                        !isCurrentRole
                                                                    ) {
                                                                        handleGrantOrganizationPermission(
                                                                            permission
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    isLoading ||
                                                                    isCurrentRole
                                                                }
                                                            >
                                                                <span>
                                                                    {
                                                                        permission.name
                                                                    }
                                                                </span>
                                                                {isCurrentRole && (
                                                                    <UserCheck className="w-4 h-4 text-blue-600" />
                                                                )}
                                                            </button>
                                                        );
                                                    }
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {member.typeOfEmployee !== "OWNER" && (
                    <div className="flex items-center gap-2">
                        <Tooltip content={t("member.assignResources")}>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={onAssignResources}
                            >
                                <UserCog className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        <Tooltip content={t("member.removeFromOrg")}>
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleRemoveMemberFromOrg}
                                disabled={isLoading}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* Member Information */}
            <>
                <ScrollArea className="flex-1 overflow-y-auto p-2 h-full">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t("member.information")}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("member.email")}
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {member.email}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("member.phone")}
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {memberProfile?.phone ||
                                            t("member.notUpdated")}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("member.address")}
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {memberProfile?.address ||
                                            member.address ||
                                            t("member.notUpdated")}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("member.position")}
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {memberProfile?.position ||
                                            t("member.notUpdated")}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("member.joinDate")}
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(
                                            member.createdDate
                                        ).toLocaleDateString(
                                            language === "vi"
                                                ? "vi-VN"
                                                : "en-US"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Workspace Roles */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {t("workspace.title")}
                            </h3>
                            <div className="space-y-2 h-[484px]">
                                {userWorkspaces.length === 0 ? (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">
                                            {t("workspace.noWorkspace")}
                                        </p>
                                    </div>
                                ) : (
                                    userWorkspaces.map((workspace) => (
                                        <div
                                            key={workspace.workspaceId}
                                            className="border border-gray-200 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                <button
                                                    type="button"
                                                    className="flex items-center space-x-2 flex-1 text-left"
                                                    onClick={() =>
                                                        toggleWorkspaceExpansion(
                                                            workspace.workspaceId
                                                        )
                                                    }
                                                >
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {
                                                            workspace.workspaceName
                                                        }
                                                    </span>
                                                </button>
                                                <div className="flex items-center space-x-2">
                                                    {workspace.groupName ? (
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                            {
                                                                workspace.groupName
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                            {t(
                                                                "permission.noPermission"
                                                            )}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-xs ${
                                                            workspace.teams
                                                                .length > 0
                                                                ? "text-green-600 bg-green-100"
                                                                : "text-gray-500 bg-gray-100"
                                                        } px-2 py-1 rounded`}
                                                    >
                                                        {workspace.teams
                                                            .length > 0
                                                            ? `${
                                                                  workspace
                                                                      .teams
                                                                      .length
                                                              } ${t(
                                                                  "team.teams"
                                                              )}`
                                                            : t("team.noTeams")}
                                                    </span>
                                                    {expandedWorkspaces.has(
                                                        workspace.workspaceId
                                                    ) ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    )}

                                                    {/* Workspace More Menu */}
                                                    <div
                                                        className="relative"
                                                        ref={wsDropdownRef}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenWsMenuId(
                                                                    openWsMenuId ===
                                                                        workspace.workspaceId
                                                                        ? null
                                                                        : workspace.workspaceId
                                                                );
                                                            }}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>

                                                        {openWsMenuId ===
                                                            workspace.workspaceId && (
                                                            <div className="absolute right-0 top-8 z-20 w-68 bg-white border rounded-lg py-1">
                                                                <div className="relative">
                                                                    <button
                                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                                        onMouseEnter={() =>
                                                                            handleShowWsPermissions(
                                                                                workspace.workspaceId
                                                                            )
                                                                        }
                                                                        onMouseLeave={() =>
                                                                            handleHideWsPermissions()
                                                                        }
                                                                    >
                                                                        <Settings className="w-4 h-4" />
                                                                        {t(
                                                                            "workspace.permissions"
                                                                        )}
                                                                    </button>

                                                                    <button
                                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                        onClick={() =>
                                                                            handleRemoveMemberFromWorkspace(
                                                                                workspace.workspaceId,
                                                                                workspace.workspaceName
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isLoading
                                                                        }
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        {t(
                                                                            "workspace.removeFromWorkspace"
                                                                        )}
                                                                    </button>
                                                                    {showWsPermissions ===
                                                                        workspace.workspaceId && (
                                                                        <div
                                                                            className="absolute right-full top-0 mr-1 w-48 bg-white border rounded-lg py-1"
                                                                            onMouseEnter={() =>
                                                                                handleShowWsPermissions(
                                                                                    workspace.workspaceId
                                                                                )
                                                                            }
                                                                            onMouseLeave={
                                                                                handleHideWsPermissions
                                                                            }
                                                                        >
                                                                            {workspacePermissionGroups
                                                                                .filter(
                                                                                    (
                                                                                        permission
                                                                                    ) =>
                                                                                        permission.id !==
                                                                                        workspace.groupId
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        permission
                                                                                    ) => (
                                                                                        <button
                                                                                            key={
                                                                                                permission.id
                                                                                            }
                                                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                                                            onMouseDown={(
                                                                                                e
                                                                                            ) => {
                                                                                                e.preventDefault();
                                                                                                handleGrantWorkspacePermission(
                                                                                                    workspace.workspaceId,
                                                                                                    permission
                                                                                                );
                                                                                            }}
                                                                                            disabled={
                                                                                                isLoading
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                permission.name
                                                                                            }
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                            {workspacePermissionGroups.filter(
                                                                                (
                                                                                    permission
                                                                                ) =>
                                                                                    permission.id !==
                                                                                    workspace.groupId
                                                                            )
                                                                                .length ===
                                                                                0 && (
                                                                                <div className="px-4 py-2 text-sm text-gray-500">
                                                                                    {t(
                                                                                        "workspace.noOtherPermissions"
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedWorkspaces.has(
                                                workspace.workspaceId
                                            ) && (
                                                <div className="border-t border-gray-200 p-3 bg-gray-50">
                                                    {workspace.teams.length ===
                                                    0 ? (
                                                        <p className="text-sm text-gray-500">
                                                            {t("team.noTeams")}
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {workspace.teams.map(
                                                                (team) => (
                                                                    <div
                                                                        key={
                                                                            team.teamId
                                                                        }
                                                                        className="relative flex items-center justify-between p-2 bg-white rounded border"
                                                                    >
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            {
                                                                                team.teamName
                                                                            }
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                                {getTypeOfTeamLabel(
                                                                                    team.role,
                                                                                    t
                                                                                )}
                                                                            </span>

                                                                            {/* Team More Menu */}
                                                                            <div
                                                                                className="relative"
                                                                                ref={
                                                                                    teamDropdownRef
                                                                                }
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() =>
                                                                                        setOpenTeamMenuId(
                                                                                            openTeamMenuId ===
                                                                                                team.teamId
                                                                                                ? null
                                                                                                : team.teamId
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <MoreVertical className="w-4 h-4" />
                                                                                </Button>

                                                                                {openTeamMenuId ===
                                                                                    team.teamId && (
                                                                                    <div className="absolute right-0 top-8 z-20 w-56 bg-white border rounded-lg py-1">
                                                                                        <div className="relative">
                                                                                            <button
                                                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                                                                onMouseEnter={() =>
                                                                                                    handleShowTeamRoles(
                                                                                                        team.teamId
                                                                                                    )
                                                                                                }
                                                                                                onMouseLeave={() =>
                                                                                                    handleHideTeamRoles()
                                                                                                }
                                                                                            >
                                                                                                <UserCheck className="w-4 h-4" />
                                                                                                {t(
                                                                                                    "team.updateRole"
                                                                                                )}
                                                                                            </button>

                                                                                            {showTeamRoles ===
                                                                                                team.teamId && (
                                                                                                <div
                                                                                                    className="absolute right-full top-0 mr-1 w-48 bg-white border rounded-lg py-1"
                                                                                                    onMouseEnter={() =>
                                                                                                        handleShowTeamRoles(
                                                                                                            team.teamId
                                                                                                        )
                                                                                                    }
                                                                                                    onMouseLeave={
                                                                                                        handleHideTeamRoles
                                                                                                    }
                                                                                                >
                                                                                                    {teamRoles
                                                                                                        .filter(
                                                                                                            (
                                                                                                                role
                                                                                                            ) =>
                                                                                                                role.value !==
                                                                                                                team.role
                                                                                                        )
                                                                                                        .map(
                                                                                                            (
                                                                                                                role
                                                                                                            ) => (
                                                                                                                <button
                                                                                                                    key={
                                                                                                                        role.value
                                                                                                                    }
                                                                                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                                                                                    onMouseDown={(
                                                                                                                        e
                                                                                                                    ) => {
                                                                                                                        e.preventDefault();
                                                                                                                        handleUpdateTeamRole(
                                                                                                                            workspace.workspaceId,
                                                                                                                            team.teamId,
                                                                                                                            role.value
                                                                                                                        );
                                                                                                                    }}
                                                                                                                    disabled={
                                                                                                                        isLoading
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        role.label
                                                                                                                    }
                                                                                                                </button>
                                                                                                            )
                                                                                                        )}
                                                                                                    {teamRoles.filter(
                                                                                                        (
                                                                                                            role
                                                                                                        ) =>
                                                                                                            role.value !==
                                                                                                            team.role
                                                                                                    )
                                                                                                        .length ===
                                                                                                        0 && (
                                                                                                        <div className="px-4 py-2 text-sm text-gray-500">
                                                                                                            {t(
                                                                                                                "team.noOtherRoles"
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>

                                                                                        <button
                                                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                                            onClick={() =>
                                                                                                handleRemoveMemberFromTeam(
                                                                                                    workspace.workspaceId,
                                                                                                    team.teamId,
                                                                                                    team.teamName
                                                                                                )
                                                                                            }
                                                                                            disabled={
                                                                                                isLoading
                                                                                            }
                                                                                        >
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                            {t(
                                                                                                "team.removeFromTeam"
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </>

            <Dialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                        <DialogDescription>
                            {confirmDialog.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeConfirmDialog}
                            disabled={isLoading}
                        >
                            {t("action.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDialog.onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? t("action.processing")
                                : t("action.confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

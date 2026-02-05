"use client";

import { grantUserRolesMultiple, grantUserTeamRolesMultiple } from "@/api/org";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissionGroups } from "@/hooks/useOrganizations";
import { OrgMember, PermissionGroup, Team, Workspace } from "@/lib/interface";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    ChevronRight,
    Check,
    Shield,
    Users,
    LayoutGrid,
    Building2,
    Ban
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// --- Sub-components ---

interface TeamItemProps {
    team: Team;
    level: number;
    teamRoles: Record<string, string>;
    onTeamRoleChange: (teamId: string, role: string) => void;
    getAvailableRoles: (team: Team) => { value: string; label: string }[];
    expandedTeams: Set<string>;
    onToggleExpand: (teamId: string) => void;
}

function TeamItem({
    team,
    level,
    teamRoles,
    onTeamRoleChange,
    getAvailableRoles,
    expandedTeams,
    onToggleExpand,
}: TeamItemProps) {
    const { t } = useLanguage();
    const hasChildren = team.childs && team.childs.length > 0;
    const isExpanded = expandedTeams.has(team.id);
    const availableRoles = getAvailableRoles(team);
    const currentRole = teamRoles[team.id];

    return (
        <div className="w-full">
            <div
                className={cn(
                    "group flex items-center justify-between py-2 px-3 rounded-md transition-colors border border-transparent hover:bg-muted/50 hover:border-gray-100",
                    currentRole && "bg-blue-50/50 border-blue-100"
                )}
                style={{ paddingLeft: `${level * 20 + 12}px` }}
            >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    {/* Expand/Collapse Trigger */}
                    <div className="flex-shrink-0 w-5 flex justify-center">
                        {hasChildren ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleExpand(team.id);
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded-sm text-gray-500 transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        ) : (
                            <div className="w-4" /> 
                        )}
                    </div>

                    {/* Team Info */}
                    <div className="flex flex-col truncate">
                        <span className={cn(
                            "text-sm font-medium truncate",
                            currentRole ? "text-blue-700" : "text-gray-700"
                        )}>
                            {team.name}
                        </span>
                        <div className="flex items-center gap-2">
                             {hasChildren && (
                                <span className="text-[10px] text-gray-400">
                                    {team.childs.length} {t("team.subteam").toLowerCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Role Selector */}
                <div className="flex-shrink-0 ml-4">
                    <Select
                        value={currentRole || ""}
                        onValueChange={(value) => onTeamRoleChange(team.id, value)}
                    >
                        <SelectTrigger 
                            className={cn(
                                "h-8 w-[130px] text-xs transition-all",
                                currentRole 
                                    ? "border-blue-200 bg-white text-blue-700 focus:ring-blue-100" 
                                    : "text-gray-500 border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <SelectValue placeholder={t("role.selectRole")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned" className="text-gray-400 italic">
                                {t("common.unassigned") || "Unassigned"}
                            </SelectItem>
                            {availableRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Recursive Children */}
            {hasChildren && isExpanded && (
                <div className="mt-1 relative">
                    {/* Optional: Vertical line guide could go here */}
                    {team.childs.map((childTeam: Team) => (
                        <TeamItem
                            key={childTeam.id}
                            team={childTeam}
                            level={level + 1}
                            teamRoles={teamRoles}
                            onTeamRoleChange={onTeamRoleChange}
                            getAvailableRoles={getAvailableRoles}
                            expandedTeams={expandedTeams}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Main Modal Component ---

interface AssignResourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: OrgMember | null;
    unJoinWorkspaces: Workspace[];
    orgId: string;
    selectedMemberId: string | null;
}

export default function AssignResourcesModal({
    isOpen,
    onClose,
    member,
    unJoinWorkspaces,
    orgId,
    selectedMemberId,
}: AssignResourcesModalProps) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    // -- State --
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [selectedPermissionGroup, setSelectedPermissionGroup] = useState<string>("");
    const [teamRoles, setTeamRoles] = useState<Record<string, string>>({});
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

    // -- Data --
    const { data: pgResponse } = usePermissionGroups(orgId);
    const permissionGroups: PermissionGroup[] = (pgResponse?.content ?? [])
        .filter((g: PermissionGroup) => g.scope === "WORKSPACE");

    const selectedWorkspace = unJoinWorkspaces.find(
        (w) => w.workspaceId === selectedWorkspaceId
    );

    // -- Helpers --
    const getAvailableRoles = (team: Team) => {
        const hasChildren = team.childs && team.childs.length > 0;
        return hasChildren
            ? [{ value: "MEMBER", label: t("role.member") }]
            : [
                  { value: "TEAM_LEADER", label: t("role.teamLeader") },
                  { value: "MEMBER", label: t("role.member") },
              ];
    };

    const handleTeamRoleChange = (teamId: string, role: string) => {
        setTeamRoles((prev) => {
            if (role === "unassigned") {
                const copy = { ...prev };
                delete copy[teamId];
                return copy;
            }
            return { ...prev, [teamId]: role };
        });
    };

    const handleToggleExpand = (teamId: string) => {
        setExpandedTeams((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) newSet.delete(teamId);
            else newSet.add(teamId);
            return newSet;
        });
    };

    const resetState = () => {
        setSelectedPermissionGroup("");
        setTeamRoles({});
        setSelectedWorkspaceId(null);
        setExpandedTeams(new Set());
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    // -- Mutation --
    const grantRolesMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMemberId || !selectedWorkspaceId) {
                throw new Error("Missing member ID or workspace ID");
            }
            if (!selectedPermissionGroup) {
                toast.error(t("workspace.permissionRequired"));
                throw new Error("Workspace permission is required");
            }


            // 1. Grant Workspace Level Role
            await grantUserRolesMultiple(orgId, selectedMemberId, {
                roles: [
                    {
                        workspaceId: selectedWorkspaceId,
                        groupId: selectedPermissionGroup,
                    },
                ],
            });

            // 2. Grant Team Level Roles (Optional)
            const teamRolesList = Object.entries(teamRoles).map(([teamId, role]) => ({
                teamId,
                role,
            }));
            
            if (teamRolesList.length > 0) {
                await grantUserTeamRolesMultiple(
                    orgId,
                    selectedMemberId,
                    selectedWorkspaceId,
                    { roles: teamRolesList }
                );
            }
        },
        onSuccess: () => {
            toast.success(t("permission.grantSuccess") || "Permissions granted successfully");
            handleClose();
            queryClient.invalidateQueries({
                queryKey: ["userWorkspaceRoles", orgId, selectedMemberId],
            });
        },
        onError: (error: any) => {
            console.error("Error granting roles:", error);
            const msg = error?.response?.data?.message || t("common.error") || "An error occurred";
            toast.error(msg);
        },
    });

    const isPending = grantRolesMutation.isPending;
    const isValid = selectedWorkspaceId && selectedPermissionGroup;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="w-full max-w-2xl p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        {t("permission.grantPermission")}
                    </DialogTitle>
                    {member && (
                        <p className="text-sm text-gray-500 mt-1">
                            {t("member.assigningTo")} <span className="font-semibold text-gray-900">{member.fullName}</span>
                        </p>
                    )}
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-6 space-y-8">
                        {/* 1. Workspace Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs">1</div>
                                {t("workspace.selectWorkspace")}
                            </div>
                            
                            {unJoinWorkspaces.length === 0 ? (
                                <div className="p-4 border border-dashed rounded-lg text-center text-sm text-gray-500 bg-gray-50">
                                    {t("workspace.noAvailableWorkspace")}
                                </div>
                            ) : (
                                <Select
                                    value={selectedWorkspaceId || ""}
                                    onValueChange={(val) => {
                                        setSelectedWorkspaceId(val);
                                        setSelectedPermissionGroup("");
                                        setTeamRoles({});
                                        setExpandedTeams(new Set());
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 border-gray-200 focus:ring-blue-100 focus:border-blue-400">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <SelectValue placeholder={t("workspace.selectWorkspacePlaceholder") || "Choose a workspace..."} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unJoinWorkspaces.map((ws) => (
                                            <SelectItem key={ws.workspaceId} value={ws.workspaceId}>
                                                {ws.workspaceName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {selectedWorkspaceId && selectedWorkspace && (
                            <>
                                {/* 2. Permission Group Section */}
                                <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs">2</div>
                                        {t("permission.workspaceRole")}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* No Permission Option */}
                                        {/* <div

                                            className={cn(
                                                "cursor-pointer relative flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 hover:shadow-md",
                                                selectedPermissionGroup === "" 
                                                    ? "border-gray-800 bg-gray-50 ring-1 ring-gray-800" 
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            )}
                                            onClick={() => setSelectedPermissionGroup("")}  
                                        >
                                             {selectedPermissionGroup === "" && (
                                                <div className="absolute top-2 right-2 text-gray-900">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            )}
                                            <Ban className="h-6 w-6 text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-gray-600 text-center">{t("permission.noPermission")}</span>
                                        </div> */}

                                        {permissionGroups.map((pg) => {
                                             const isSelected = selectedPermissionGroup === pg.id;
                                             return (
                                                <div
                                                    key={pg.id}
                                                    onClick={() => setSelectedPermissionGroup(pg.id)}
                                                    className={cn(
                                                        "cursor-pointer relative flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 hover:shadow-md",
                                                        isSelected
                                                            ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                                                            : "border-gray-200 bg-white hover:border-blue-200"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 text-blue-600">
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <Shield className={cn("h-6 w-6 mb-2", isSelected ? "text-blue-600" : "text-gray-400")} />
                                                    <span className={cn("text-sm font-medium text-center", isSelected ? "text-blue-900" : "text-gray-700")}>
                                                        {pg.name}
                                                    </span>
                                                </div>
                                             );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Teams Section */}
                                {selectedWorkspace.teams.length > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs">3</div>
                                                {t("team.assignTeams")}
                                            </div>
                                            <Badge variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-600">
                                                {t("common.selected") || "selected"} {Object.keys(teamRoles).length}
                                            </Badge>
                                        </div>
                                        
                                        <div className="border rounded-lg bg-gray-50/50 p-2 space-y-1">
                                            {selectedWorkspace.teams.map((team) => (
                                                <TeamItem
                                                    key={team.id}
                                                    team={team}
                                                    level={0}
                                                    teamRoles={teamRoles}
                                                    onTeamRoleChange={handleTeamRoleChange}
                                                    getAvailableRoles={getAvailableRoles}
                                                    expandedTeams={expandedTeams}
                                                    onToggleExpand={handleToggleExpand}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isPending}
                        className="hover:bg-gray-200"
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={() => grantRolesMutation.mutate()}
                        disabled={!isValid || isPending}
                        className={cn(
                            "min-w-[120px]",
                            isValid ? "bg-blue-600 hover:bg-blue-700" : "opacity-50"
                        )}
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                {t("permission.granting")}
                            </div>
                        ) : (
                            t("permission.grantPermission")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

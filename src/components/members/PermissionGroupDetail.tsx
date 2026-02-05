"use client";

import {
    getPermissionGroupMemberList,
    getPermissionGroupWorkspaceList,
    grantGroupRolesMultiple,
    grantUserRoles,
} from "@/api/permission_group";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { PermissionGroup } from "@/lib/interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Briefcase,
    Check,
    ChevronDown,
    ChevronUp,
    Edit3,
    Plus,
    Save,
    Shield,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ScrollArea } from "../ui/scroll-area";
import Loading from "../common/Loading";
import Avatar from "react-avatar";
import { getAvatarUrl } from "@/lib/utils";
import ConfirmDialog from "../common/ConfirmDialog";
import {
    useDeletePermissionGroup,
    useRemoveMemberFromGroup,
    useUpdateGroupName,
} from "@/hooks/useOrgV2";
interface PermissionGroupDetailProps {
    currentOrg: any | null;
    group: PermissionGroup;
    groupRolesContent: any[];
    orgId: string;
    isLoading: boolean;
}

export default function PermissionGroupDetail({
    currentOrg,
    group,
    groupRolesContent,
    orgId,
    isLoading,
}: PermissionGroupDetailProps) {
    const [isOpenConfirmDeleteGroup, setIsOpenConfirmDeleteGroup] =
        useState(false);
    const [isOpenConfirmDialog, setIsOpenConfirmDialog] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<any>(null);
    const [rolesData, setRolesData] = useState<any[]>(groupRolesContent);
    const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(
        new Set(),
    );
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(group.name);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<
        string | null
    >(null);
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const [showUnassignedMembers, setShowUnassignedMembers] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showUnassignedMembers && !target.closest(".assign-dropdown")) {
                setShowUnassignedMembers(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUnassignedMembers]);

    // Reset selected workspace when group changes
    useEffect(() => {
        setSelectedWorkspaceId(null);
    }, [group.id]);

    // Lấy danh sách workspace (chỉ cho workspace scope)
    const { data: workspacesData, isLoading: isWorkspacesLoading } = useQuery({
        queryKey: ["permissionGroupWorkspaces", orgId, group?.id],
        queryFn: () => getPermissionGroupWorkspaceList(orgId, group.id),
        enabled: !!orgId && !!group?.id && group?.scope === "WORKSPACE",
    });

    const queryWorkspaceId =
        group?.scope === "ORGANIZATION" ? null : selectedWorkspaceId;

    // Lấy danh sách thành viên (chỉ load khi có selectedWorkspaceId hoặc scope là ORGANIZATION)
    const { data: membersData, isLoading: isMembersLoading } = useQuery({
        queryKey: [
            "permissionGroupMembers",
            orgId,
            group?.id,
            queryWorkspaceId,
        ],
        queryFn: () =>
            getPermissionGroupMemberList(orgId, group.id, queryWorkspaceId),
        enabled:
            !!orgId &&
            !!group?.id &&
            (group?.scope === "ORGANIZATION" ||
                (group?.scope === "WORKSPACE" && !!selectedWorkspaceId)),
    });
    useEffect(() => {
        setRolesData(groupRolesContent);
        const init = new Set<string>();
        groupRolesContent.forEach((cat: any) =>
            cat.module.forEach((mod: any) =>
                mod.permission.forEach((p: any) => {
                    if (p.status === 0) init.add(p.id);
                }),
            ),
        );
        setCheckedPermissions(init);
    }, [groupRolesContent]);

    // Update editedName when group.name changes
    useEffect(() => {
        setEditedName(group.name);
    }, [group.name]);

    // Handle edit name functions
    const handleStartEditName = () => {
        if (isEditMode) {
            setIsEditingName(true);
            setEditedName(group.name);
        }
    };
    const updateGroupNameMutation = useUpdateGroupName(orgId, group.id);
    const handleSaveName = () => {
        if (editedName.trim() && editedName !== group.name) {
            updateGroupNameMutation.mutate({
                name: editedName,
                description: null,
            });
        }
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setEditedName(group.name);
        setIsEditingName(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSaveName();
        } else if (e.key === "Escape") {
            handleCancelEditName();
        }
    };

    // Handle select all permissions
    const handleSelectAll = () => {
        const allPermissionIds = new Set<string>();
        rolesData.forEach((cat: any) =>
            cat.module.forEach((mod: any) =>
                mod.permission.forEach((p: any) => {
                    allPermissionIds.add(p.id);
                }),
            ),
        );
        setCheckedPermissions(allPermissionIds);

        // Also update the rolesData to reflect all checked
        setRolesData((prev) => {
            return prev.map((cat: any) => ({
                ...cat,
                module: cat.module.map((mod: any) => ({
                    ...mod,
                    permission: mod.permission.map((p: any) => ({
                        ...p,
                        status: 0, // 0 means checked/active
                    })),
                })),
            }));
        });
    };

    const togglePermission = (id: string) => {
        setRolesData((prev) => {
            // Tìm permission được click
            let clickedPermission: any = null;
            let isAdminPermission = false;
            let isSelectAllPermission = false;

            // Tìm permission và kiểm tra xem có phải là Quản trị viên hoặc Tất cả không
            prev.forEach((cat: any) => {
                cat.module.forEach((mod: any) => {
                    mod.permission.forEach((perm: any) => {
                        if (perm.id === id) {
                            clickedPermission = perm;
                            isAdminPermission = perm.name === "Quản trị viên";
                            isSelectAllPermission = perm.name === "Tất cả";
                        }
                    });
                });
            });

            if (isSelectAllPermission && clickedPermission) {
                // Nếu click vào "Tất cả"
                const newStatus = clickedPermission.status === 1 ? 0 : 1;

                if (newStatus === 1) {
                    // Khi check "Tất cả": check tất cả permissions (bao gồm cả "Tất cả", trừ "Quản trị viên")
                    return prev.map((cat: any) => ({
                        ...cat,
                        module: cat.module.map((mod: any) => ({
                            ...mod,
                            permission: mod.permission.map((perm: any) => ({
                                ...perm,
                                status:
                                    perm.name === "Quản trị viên"
                                        ? perm.status
                                        : 1,
                            })),
                        })),
                    }));
                } else {
                    // Khi uncheck "Tất cả": uncheck tất cả permissions (bao gồm cả "Tất cả", trừ "Quản trị viên")
                    return prev.map((cat: any) => ({
                        ...cat,
                        module: cat.module.map((mod: any) => ({
                            ...mod,
                            permission: mod.permission.map((perm: any) => ({
                                ...perm,
                                status:
                                    perm.name === "Quản trị viên"
                                        ? perm.status
                                        : 0,
                            })),
                        })),
                    }));
                }
            } else if (isAdminPermission && clickedPermission) {
                // Nếu click vào Quản trị viên
                const newStatus = clickedPermission.status === 1 ? 0 : 1;

                if (newStatus === 1) {
                    // Khi check Quản trị viên: check tất cả permissions
                    return prev.map((cat: any) => ({
                        ...cat,
                        module: cat.module.map((mod: any) => ({
                            ...mod,
                            permission: mod.permission.map((perm: any) => ({
                                ...perm,
                                status: 1,
                            })),
                        })),
                    }));
                } else {
                    // Khi uncheck Quản trị viên: chỉ uncheck Quản trị viên
                    return prev.map((cat: any) => ({
                        ...cat,
                        module: cat.module.map((mod: any) => ({
                            ...mod,
                            permission: mod.permission.map((perm: any) =>
                                perm.id === id ? { ...perm, status: 0 } : perm,
                            ),
                        })),
                    }));
                }
            } else {
                // Logic bình thường cho các permissions khác
                const updatedData = prev.map((cat: any) => ({
                    ...cat,
                    module: cat.module.map((mod: any) => ({
                        ...mod,
                        permission: mod.permission.map((perm: any) =>
                            perm.id === id
                                ? { ...perm, status: perm.status === 1 ? 0 : 1 }
                                : perm,
                        ),
                    })),
                }));

                // Cập nhật trạng thái của checkbox "Tất cả" dựa trên trạng thái của các permissions khác
                let allOtherPermissionsChecked = true;
                let hasOtherPermissions = false;

                updatedData.forEach((cat: any) => {
                    cat.module.forEach((mod: any) => {
                        mod.permission.forEach((perm: any) => {
                            if (
                                perm.name !== "Tất cả" &&
                                perm.name !== "Quản trị viên"
                            ) {
                                hasOtherPermissions = true;
                                if (perm.status !== 1) {
                                    allOtherPermissionsChecked = false;
                                }
                            }
                        });
                    });
                });

                return updatedData.map((cat: any) => ({
                    ...cat,
                    module: cat.module.map((mod: any) => ({
                        ...mod,
                        permission: mod.permission.map((perm: any) => {
                            if (perm.name === "Tất cả") {
                                // Nếu tất cả permissions khác được check, check "Tất cả"
                                // Nếu có ít nhất một permission khác được uncheck, uncheck "Tất cả"
                                return {
                                    ...perm,
                                    status:
                                        hasOtherPermissions &&
                                        allOtherPermissionsChecked
                                            ? 1
                                            : 0,
                                };
                            }
                            return perm;
                        }),
                    })),
                }));
            }
        });

        setCheckedPermissions((prev) => {
            const next = new Set(prev);

            // Tìm permission được click để xác định loại
            let isSelectAllPermission = false;
            let isAdminPermission = false;

            rolesData.forEach((cat: any) => {
                cat.module.forEach((mod: any) => {
                    mod.permission.forEach((perm: any) => {
                        if (perm.id === id) {
                            isSelectAllPermission = perm.name === "Tất cả";
                            isAdminPermission = perm.name === "Quản trị viên";
                        }
                    });
                });
            });

            if (isSelectAllPermission) {
                // Nếu click vào "Tất cả", cập nhật tất cả permissions (bao gồm cả "Tất cả", trừ "Quản trị viên")
                const allPermissionIds = new Set<string>();
                rolesData.forEach((cat: any) => {
                    cat.module.forEach((mod: any) => {
                        mod.permission.forEach((perm: any) => {
                            if (perm.name !== "Quản trị viên") {
                                allPermissionIds.add(perm.id);
                            }
                        });
                    });
                });

                if (next.has(id)) {
                    // Nếu đang uncheck "Tất cả", remove tất cả permissions (bao gồm cả "Tất cả")
                    allPermissionIds.forEach((permId) => next.delete(permId));
                } else {
                    // Nếu đang check "Tất cả", add tất cả permissions (bao gồm cả "Tất cả")
                    allPermissionIds.forEach((permId) => next.add(permId));
                }
            } else if (isAdminPermission) {
                // Nếu click vào "Quản trị viên", cập nhật tất cả permissions
                const allPermissionIds = new Set<string>();
                rolesData.forEach((cat: any) => {
                    cat.module.forEach((mod: any) => {
                        mod.permission.forEach((perm: any) => {
                            allPermissionIds.add(perm.id);
                        });
                    });
                });

                if (next.has(id)) {
                    // Nếu đang uncheck "Quản trị viên", chỉ remove "Quản trị viên"
                    next.delete(id);
                } else {
                    // Nếu đang check "Quản trị viên", add tất cả permissions
                    allPermissionIds.forEach((permId) => next.add(permId));
                }
            } else {
                // Logic bình thường cho các permissions khác
                if (next.has(id)) next.delete(id);
                else next.add(id);

                // Cập nhật trạng thái của checkbox "Tất cả" dựa trên trạng thái của các permissions khác
                const allOtherPermissionIds = new Set<string>();
                let selectAllPermissionId = "";

                rolesData.forEach((cat: any) => {
                    cat.module.forEach((mod: any) => {
                        mod.permission.forEach((perm: any) => {
                            if (perm.name === "Tất cả") {
                                selectAllPermissionId = perm.id;
                            } else if (perm.name !== "Quản trị viên") {
                                allOtherPermissionIds.add(perm.id);
                            }
                        });
                    });
                });

                if (selectAllPermissionId) {
                    // Kiểm tra xem tất cả permissions khác có được check không
                    const allOtherChecked = Array.from(
                        allOtherPermissionIds,
                    ).every((permId) => next.has(permId));
                    const hasOtherPermissions = allOtherPermissionIds.size > 0;

                    if (hasOtherPermissions && allOtherChecked) {
                        next.add(selectAllPermissionId);
                    } else {
                        next.delete(selectAllPermissionId);
                    }
                }
            }

            return next;
        });
    };

    const handleEditToggle = () => {
        setIsEditMode(!isEditMode);
        if (isEditMode) {
            // Reset data when canceling edit
            setRolesData(groupRolesContent);
            const init = new Set<string>();
            groupRolesContent.forEach((cat: any) =>
                cat.module.forEach((mod: any) =>
                    mod.permission.forEach((p: any) => {
                        if (p.status === 0) init.add(p.id);
                    }),
                ),
            );
            setCheckedPermissions(init);
        }
    };

    const saveMutation = useMutation({
        mutationFn: () => {
            const roles: { permissionId: string; status: 0 | 1 }[] = [];
            rolesData.forEach((cat: any) =>
                cat.module.forEach((mod: any) =>
                    mod.permission.forEach((perm: any) => {
                        roles.push({
                            permissionId: perm.id,
                            status: perm.status as 0 | 1,
                        });
                    }),
                ),
            );
            return grantGroupRolesMultiple(orgId, group.id, roles);
        },
        onSuccess: () => {
            toast.success("Cập nhật quyền thành công");
            setIsEditMode(false);
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const queryKey = query.queryKey;
                    return (
                        queryKey[0] === "permissionGroupRoles" &&
                        queryKey[1] === orgId &&
                        queryKey[2] === group.id
                    );
                },
            });
        },
        onError: () => toast.error("Có lỗi xảy ra khi cập nhật quyền"),
    });

    // Mutation để gán quyền cho thành viên
    const assignMemberMutation = useMutation({
        mutationFn: ({ profileId }: { profileId: string }) => {
            return grantUserRoles(orgId, profileId, {
                workspaceId: selectedWorkspaceId,
                groupId: group.id,
            });
        },
        onSuccess: () => {
            toast.success(t("permission.assignSuccess"));

            // Refresh member list
            queryClient.invalidateQueries({
                queryKey: [
                    "permissionGroupMembers",
                    orgId,
                    group.id,
                    selectedWorkspaceId,
                ],
            });
            queryClient.invalidateQueries({
                queryKey: ["permissionGroups", orgId],
            });

            // Refresh workspace list để cập nhật hasRole status
            if (group.scope === "WORKSPACE") {
                queryClient.invalidateQueries({
                    queryKey: ["permissionGroupWorkspaces", orgId, group.id],
                });
            }

            // Refresh permission group roles để cập nhật permission changes
            const invalidated = queryClient.invalidateQueries({
                predicate: (query) => {
                    const queryKey = query.queryKey;
                    const matches =
                        queryKey[0] === "permissionGroupRoles" &&
                        queryKey[1] === orgId &&
                        queryKey[2] === group.id;
                    return matches;
                },
            });
        },
        onError: () => toast.error(t("permission.assignError")),
    });

    const removeMemberFromGroupMutation = useRemoveMemberFromGroup(
        orgId,
        group.id,
        selectedWorkspaceId,
    );

    const deleteGroupMutation = useDeletePermissionGroup(orgId, group.id);

    if (isLoading) {
        return <Loading />;
    }

    // Check if group is null/undefined after all hooks
    if (!group) {
        return <Loading />;
    }

    const getTotalPermissions = () => {
        let total = 0;
        let granted = 0;
        rolesData.forEach((cat: any) =>
            cat.module.forEach((mod: any) =>
                mod.permission.forEach((p: any) => {
                    if (p.id !== "00000000-0000-0000-0000-000000000000")
                        total++;
                    if (p.status === 1) granted++;
                }),
            ),
        );
        return { total, granted };
    };

    // Kiểm tra xem quyền Quản trị viên có được check không
    const isAdminPermissionChecked = () => {
        let isChecked = false;
        rolesData.forEach((cat: any) =>
            cat.module.forEach((mod: any) =>
                mod.permission.forEach((p: any) => {
                    if (p.name === "Quản trị viên" && p.status === 1) {
                        isChecked = true;
                    }
                }),
            ),
        );
        return isChecked;
    };

    // Kiểm tra xem một permission có phải là Quản trị viên không
    const isAdminPermission = (permissionName: string) => {
        return permissionName === "Quản trị viên";
    };

    // Kiểm tra xem tất cả permissions (trừ "Tất cả" và "Quản trị viên") có được check không
    const areAllOtherPermissionsChecked = () => {
        let allChecked = true;
        let hasOtherPermissions = false;

        rolesData.forEach((cat: any) => {
            cat.module.forEach((mod: any) => {
                mod.permission.forEach((perm: any) => {
                    if (
                        perm.name !== "Tất cả" &&
                        perm.name !== "Quản trị viên"
                    ) {
                        hasOtherPermissions = true;
                        if (perm.status !== 1) {
                            allChecked = false;
                        }
                    }
                });
            });
        });

        return hasOtherPermissions && allChecked;
    };

    const { total, granted } = getTotalPermissions();

    const handleAssignMember = (profileId: string) => {
        // Nếu là workspace scope và chưa chọn workspace, yêu cầu chọn workspace
        if (group.scope === "WORKSPACE" && !selectedWorkspaceId) {
            toast.error(t("permission.selectWorkspaceFirst"));
            return;
        }
        assignMemberMutation.mutate({ profileId });
    };

    const handleRemoveMemberFromGroup = (profileId: string) => {
        removeMemberFromGroupMutation.mutate(profileId);
    };

    const handleDeleteGroup = () => {
        deleteGroupMutation.mutate();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 ">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) =>
                                                setEditedName(e.target.value)
                                            }
                                            onKeyDown={handleKeyPress}
                                            onBlur={handleSaveName}
                                            className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none px-1 py-0"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveName}
                                            className="p-1 text-green-600 hover:text-green-700"
                                            title="Save"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleCancelEditName}
                                            className="p-1 text-red-600 hover:text-red-700"
                                            title="Cancel"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h2
                                            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={handleStartEditName}
                                        >
                                            {group.name}
                                        </h2>
                                        {isEditMode && (
                                            <button
                                                onClick={handleStartEditName}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit name"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span>
                                        {group.scope === "ORGANIZATION"
                                            ? t("permission.organization")
                                            : t("permission.workspace")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>
                                        {group.totalMembers}{" "}
                                        {t("common.members")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    <span>
                                        {granted}/{total}{" "}
                                        {t("permission.granted")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {isEditMode ? (
                            <>
                                <Tooltip content={t("common.cancel")}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEditToggle}
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    content={
                                        saveMutation.isPending
                                            ? t("common.saving")
                                            : t("common.save")
                                    }
                                >
                                    <Button
                                        variant="default"
                                        onClick={() => saveMutation.mutate()}
                                        disabled={saveMutation.isPending}
                                        className="text-white"
                                    >
                                        <Save className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                                <Tooltip
                                    content={
                                        t("common.edit") +
                                        " " +
                                        t("permission.permission")
                                    }
                                >
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleEditToggle}
                                        className="text-white"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                                {!group.isDefault &&
                                    (currentOrg.type === "OWNER" ||
                                        currentOrg.type === "ADMIN") && (
                                        <Tooltip
                                            content={
                                                t("common.delete") +
                                                " " +
                                                t("permission.permission")
                                            }
                                        >
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setIsOpenConfirmDeleteGroup(
                                                        true,
                                                    )
                                                }
                                                className="text-white bg-red-500 hover:bg-red-600 hover:text-white"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col">
                <div
                    className={`grid gap-6 p-2 lg:h-full ${
                        group.scope === "WORKSPACE"
                            ? selectedWorkspaceId
                                ? "grid-cols-1 xl:grid-cols-3 lg:grid-cols-2"
                                : "grid-cols-1 lg:grid-cols-2"
                            : "grid-cols-1 lg:grid-cols-2"
                    }`}
                >
                    {/* Permissions Section */}
                    <div className="bg-white rounded-lg border border-gray-200 flex flex-col lg:h-full lg:overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("permission.permissions")}
                                </h3>
                                {isEditMode && isAdminPermissionChecked() && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                        <Shield className="w-3 h-3" />
                                        <span className="font-medium">
                                            Quyền Quản trị viên đã được bật
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ScrollArea fix */}
                        <ScrollArea className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-200">
                            {rolesData.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3 rounded-full">
                                        <Shield className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                                        {t("permission.noPermissions")}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {t(
                                            "permission.noPermissionsDescription",
                                        )}
                                    </p>
                                </div>
                            ) : (
                                rolesData.map(
                                    (category: any, categoryIndex: number) => (
                                        <div key={categoryIndex}>
                                            <div className="px-2 py-2 bg-purple-50 border-b border-purple-100">
                                                <h4 className="font-medium text-purple-900 text-sm">
                                                    {category.name}
                                                </h4>
                                            </div>
                                            {category.module.map(
                                                (module: any) => (
                                                    <div key={module.id}>
                                                        {module.name &&
                                                            module.permission.filter(
                                                                (perm: any) =>
                                                                    isEditMode ||
                                                                    perm.status ===
                                                                        1,
                                                            ).length > 0 && (
                                                                <div className="px-2 py-2 bg-blue-50 border-b border-blue-200">
                                                                    <h5 className="font-medium text-blue-900 text-sm">
                                                                        {
                                                                            module.name
                                                                        }
                                                                    </h5>
                                                                </div>
                                                            )}
                                                        {module.permission
                                                            .filter(
                                                                (perm: any) =>
                                                                    isEditMode ||
                                                                    perm.status ===
                                                                        1,
                                                            )
                                                            .map(
                                                                (perm: any) => (
                                                                    <div
                                                                        key={
                                                                            perm.id
                                                                        }
                                                                        className={`px-2 py-3 flex items-center justify-between text-sm transition-colors border-l-2 ${
                                                                            perm.status ===
                                                                            1
                                                                                ? "bg-white border-gray-200"
                                                                                : "bg-white border-gray-200"
                                                                        } ${
                                                                            isEditMode
                                                                                ? isAdminPermissionChecked() &&
                                                                                  !isAdminPermission(
                                                                                      perm.name,
                                                                                  )
                                                                                    ? "cursor-not-allowed opacity-60"
                                                                                    : "hover:bg-blue-50 cursor-pointer"
                                                                                : "hover:bg-gray-50"
                                                                        }`}
                                                                        onClick={() => {
                                                                            if (
                                                                                !isEditMode
                                                                            )
                                                                                return;
                                                                            if (
                                                                                isAdminPermissionChecked() &&
                                                                                !isAdminPermission(
                                                                                    perm.name,
                                                                                )
                                                                            )
                                                                                return;
                                                                            togglePermission(
                                                                                perm.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3 flex-1">
                                                                            {isEditMode ? (
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={
                                                                                        perm.status ===
                                                                                        1
                                                                                    }
                                                                                    disabled={
                                                                                        isAdminPermissionChecked() &&
                                                                                        !isAdminPermission(
                                                                                            perm.name,
                                                                                        )
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        if (
                                                                                            isAdminPermissionChecked() &&
                                                                                            !isAdminPermission(
                                                                                                perm.name,
                                                                                            )
                                                                                        )
                                                                                            return;
                                                                                        togglePermission(
                                                                                            perm.id,
                                                                                        );
                                                                                    }}
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) =>
                                                                                        e.stopPropagation()
                                                                                    }
                                                                                    className={`h-4 w-4 rounded focus:ring-blue-500 flex-shrink-0 ${
                                                                                        isAdminPermissionChecked() &&
                                                                                        !isAdminPermission(
                                                                                            perm.name,
                                                                                        )
                                                                                            ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                                                                                            : "text-blue-600 border-gray-300"
                                                                                    }`}
                                                                                />
                                                                            ) : (
                                                                                // <div
                                                                                //     className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                                //         perm.status ===
                                                                                //         1
                                                                                //             ? "bg-green-500"
                                                                                //             : "bg-gray-300"
                                                                                //     }`}
                                                                                // >
                                                                                //     {perm.status ===
                                                                                //         1 && (
                                                                                //         <Check className="w-2.5 h-2.5 text-white" />
                                                                                //     )}
                                                                                // </div>
                                                                                ""
                                                                            )}
                                                                            <span className="text-sm text-gray-700 flex-1">
                                                                                {
                                                                                    perm.name
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ),
                                )
                            )}
                        </ScrollArea>
                    </div>

                    {/* Workspaces Section */}
                    {group.scope === "WORKSPACE" && (
                        <div className="bg-white rounded-lg border border-gray-200 flex flex-col lg:h-full lg:overflow-hidden">
                            <div className="p-2 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-orange-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {t("common.workspaces")}
                                        </h3>
                                    </div>
                                    {!selectedWorkspaceId && (
                                        <span className="text-xs text-blue-600 font-medium">
                                            {t("permission.clickToViewMembers")}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ScrollArea className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-200">
                                {isWorkspacesLoading ? (
                                    <Loading />
                                ) : workspacesData?.content?.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Briefcase className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                                            {t("permission.noWorkspaces")}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {t(
                                                "permission.noWorkspacesDescription",
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    workspacesData?.content.map(
                                        (workspace: any) => (
                                            <div
                                                key={workspace.workspaceId}
                                                className={`p-2 flex items-center justify-between cursor-pointer transition-colors rounded-md ${
                                                    selectedWorkspaceId ===
                                                    workspace.workspaceId
                                                        ? "bg-blue-50 border-r-2 border-blue-500"
                                                        : "hover:bg-gray-50"
                                                }`}
                                                onClick={() =>
                                                    setSelectedWorkspaceId(
                                                        selectedWorkspaceId ===
                                                            workspace.workspaceId
                                                            ? null
                                                            : workspace.workspaceId,
                                                    )
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                        <Briefcase className="w-4 h-4 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            {
                                                                workspace.workspaceName
                                                            }
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            {workspace.totalMember +
                                                                " " +
                                                                t(
                                                                    "common.members",
                                                                ).toLowerCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )
                                )}
                            </ScrollArea>
                        </div>
                    )}
                    {(group.scope === "ORGANIZATION" ||
                        (group.scope === "WORKSPACE" &&
                            selectedWorkspaceId)) && (
                        <div className="bg-white rounded-lg border border-gray-200 flex flex-col lg:h-full lg:overflow-hidden">
                            <div className="p-2 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="w-full flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {t("common.members")}
                                            </h3>
                                        </div>

                                        {/* Grant permission dropdown button */}
                                        <div className="relative assign-dropdown">
                                            <Tooltip
                                                content={t(
                                                    "permission.grantPermission",
                                                )}
                                            >
                                                <Button
                                                    size="sm"
                                                    className="text-white text-xs h-7 px-2"
                                                    onClick={() =>
                                                        setShowUnassignedMembers(
                                                            !showUnassignedMembers,
                                                        )
                                                    }
                                                >
                                                    <UserPlus className="w-3 h-3 mr-1" />
                                                    {showUnassignedMembers ? (
                                                        <ChevronUp className="w-3 h-3 ml-1" />
                                                    ) : (
                                                        <ChevronDown className="w-3 h-3 ml-1" />
                                                    )}
                                                </Button>
                                            </Tooltip>

                                            {/* Dropdown content for unassigned members */}
                                            {showUnassignedMembers && (
                                                <div className="absolute top-full right-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg z-50 max-h-80 overflow-hidden shadow-xl">
                                                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
                                                        <h5 className="text-xs font-medium text-blue-900 flex items-center gap-1">
                                                            <Plus className="w-3 h-3" />
                                                            {t(
                                                                "permission.availableToAssign",
                                                            )}{" "}
                                                            (
                                                            {membersData?.content?.filter(
                                                                (member: any) =>
                                                                    !member.hasRole,
                                                            )?.length || 0}
                                                            )
                                                        </h5>
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                                        {isMembersLoading ? (
                                                            <div className="flex items-center justify-center py-4">
                                                                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                                                            </div>
                                                        ) : membersData?.content?.filter(
                                                              (member: any) =>
                                                                  !member.hasRole,
                                                          )?.length === 0 ? (
                                                            <div className="p-4 text-center text-xs text-gray-500">
                                                                {t(
                                                                    "permission.allMembersHavePermission",
                                                                )}
                                                            </div>
                                                        ) : (
                                                            membersData?.content
                                                                ?.filter(
                                                                    (
                                                                        member: any,
                                                                    ) =>
                                                                        !member.hasRole,
                                                                )
                                                                .map(
                                                                    (
                                                                        member: any,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                member.profileId
                                                                            }
                                                                            className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-3 flex-1">
                                                                                {member.avatar ? (
                                                                                    <img
                                                                                        src={
                                                                                            member.avatar
                                                                                        }
                                                                                        alt={
                                                                                            member.fullName
                                                                                        }
                                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                                        <Users className="w-4 h-4 text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                                        {
                                                                                            member.fullName
                                                                                        }
                                                                                    </h4>
                                                                                    <p className="text-xs text-gray-500">
                                                                                        {t(
                                                                                            "permission.noPermissionStatus",
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    handleAssignMember(
                                                                                        member.profileId,
                                                                                    );
                                                                                    setShowUnassignedMembers(
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                                disabled={
                                                                                    assignMemberMutation.isPending
                                                                                }
                                                                                className="text-xs h-6 px-2 text-blue-600 border-blue-300 hover:bg-blue-50 ml-2"
                                                                            >
                                                                                {assignMemberMutation.isPending ? (
                                                                                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                                                ) : (
                                                                                    <>
                                                                                        <UserPlus className="w-3 h-3 mr-1" />
                                                                                        {t(
                                                                                            "permission.grantPermission",
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    ),
                                                                )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Members List */}
                            <ScrollArea className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-200">
                                {isMembersLoading ? (
                                    <Loading />
                                ) : membersData?.content?.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                                            {t("permission.noMembersAvailable")}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {t(
                                                "permission.noMembersDescription",
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    membersData?.content
                                        ?.filter(
                                            (member: any) => member.hasRole,
                                        )
                                        ?.map((member: any) => (
                                            <div
                                                key={member.profileId}
                                                className="p-2 flex items-center justify-between hover:bg-gray-50"
                                            >
                                                <div className="flex items-center justify-between gap-3 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar
                                                            name={
                                                                member.fullName
                                                            }
                                                            src={
                                                                getAvatarUrl(
                                                                    member.avatar,
                                                                ) || undefined
                                                            }
                                                            size="32"
                                                            className="object-cover"
                                                            round
                                                        />
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {
                                                                    member.fullName
                                                                }
                                                            </h4>
                                                            <p className="text-xs text-gray-500">
                                                                {member.hasRole
                                                                    ? t(
                                                                          "permission.hasPermission",
                                                                      )
                                                                    : t(
                                                                          "permission.noPermissionStatus",
                                                                      )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Tooltip
                                                        content={t(
                                                            "permission.removeFromGroup",
                                                        )}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            className="text-white bg-red-500 hover:bg-red-600 hover:text-white"
                                                            onClick={() => {
                                                                setMemberToRemove(
                                                                    member,
                                                                );
                                                                setIsOpenConfirmDialog(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </ScrollArea>
                            {isOpenConfirmDialog && (
                                <ConfirmDialog
                                    isOpen={isOpenConfirmDialog}
                                    onClose={() =>
                                        setIsOpenConfirmDialog(false)
                                    }
                                    onConfirm={() => {
                                        handleRemoveMemberFromGroup(
                                            memberToRemove.profileId,
                                        );
                                    }}
                                    title={t(
                                        "permission.removeFromGroupConfirm",
                                    )}
                                    description={t(
                                        "permission.removeFromGroupDescription",
                                        {
                                            name: memberToRemove.fullName,
                                            groupName: group.name,
                                        },
                                    )}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
            {isOpenConfirmDeleteGroup && (
                <ConfirmDialog
                    isOpen={isOpenConfirmDeleteGroup}
                    onClose={() => setIsOpenConfirmDeleteGroup(false)}
                    onConfirm={handleDeleteGroup}
                    title={
                        t("common.delete") + " " + t("permission.permission")
                    }
                    description={t("common.deleteConfirm", {
                        name: group.name,
                    })}
                />
            )}
        </div>
    );
}

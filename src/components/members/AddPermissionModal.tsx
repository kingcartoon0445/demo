import {
    createPermissionGroup,
    getPermissionModules,
    grantGroupRolesMultiple,
} from "@/api/permission_group";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentOrg } from "@/lib/authCookies";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Loading from "../common/Loading";

interface AddPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: {
        scope: "ORGANIZATION" | "WORKSPACE";
        name: string;
        description: string;
    }) => void;
}

interface Permission {
    id: string;
    name: string;
    type: string;
    status: number;
}

interface Module {
    id: string;
    name: string;
    permission: Permission[];
}

interface PermissionCategory {
    name: string;
    index: number;
    isWorkspace: boolean;
    module: Module[];
}

export default function AddPermissionModal({
    isOpen,
    onClose,
    onSave,
}: AddPermissionModalProps) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [scope, setScope] = useState<"ORGANIZATION" | "WORKSPACE">(
        "ORGANIZATION"
    );
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Permission states
    const [permissionData, setPermissionData] = useState<PermissionCategory[]>(
        []
    );
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );
    const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(
        new Set()
    );

    const fetchPermissions = useCallback(async () => {
        try {
            setIsLoading(true);
            const orgId = getCurrentOrg();
            if (!orgId) return;

            const response = await getPermissionModules(orgId, scope);
            if (response.code === 0) {
                setPermissionData(response.content || []);
                // Auto expand first category
                if (response.content && response.content.length > 0) {
                    setExpandedCategories(new Set([response.content[0].name]));
                }
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
            toast.error(t("common.error"));
        } finally {
            setIsLoading(false);
        }
    }, [scope, t]);

    // Fetch permissions when scope changes
    useEffect(() => {
        if (isOpen && scope) {
            fetchPermissions();
        }
    }, [isOpen, scope, fetchPermissions]);

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryName)) {
                next.delete(categoryName);
            } else {
                next.add(categoryName);
            }
            return next;
        });
    };

    const togglePermission = (permissionId: string) => {
        setCheckedPermissions((prev) => {
            const next = new Set(prev);

            // Tìm permission được click
            let clickedPermission: Permission | null = null;
            let isAdminPermission = false;
            let isSelectAllPermission = false;

            // Tìm permission và kiểm tra xem có phải là Quản trị viên không
            permissionData.forEach((category) => {
                category.module.forEach((module) => {
                    module.permission.forEach((perm) => {
                        if (perm.id === permissionId) {
                            clickedPermission = perm;
                            isAdminPermission = perm.name === "Quản trị viên";
                            isSelectAllPermission = perm.name === "Tất cả";
                        }
                    });
                });
            });

            if (isAdminPermission && clickedPermission) {
                // Nếu click vào Quản trị viên
                const isCurrentlyChecked = next.has(permissionId);

                if (!isCurrentlyChecked) {
                    // Khi check Quản trị viên: check tất cả permissions
                    const allPermissionIds = new Set<string>();
                    permissionData.forEach((category) => {
                        category.module.forEach((module) => {
                            module.permission.forEach((perm) => {
                                allPermissionIds.add(perm.id);
                            });
                        });
                    });
                    return allPermissionIds;
                } else {
                    // Khi uncheck Quản trị viên: chỉ uncheck Quản trị viên
                    next.delete(permissionId);
                    return next;
                }
            } else if (isSelectAllPermission && clickedPermission) {
                // Nếu click vào "Tất cả"
                const isCurrentlyChecked = next.has(permissionId);

                if (!isCurrentlyChecked) {
                    // Khi check "Tất cả": check tất cả permissions (ngoại trừ Quản trị viên để tránh khóa UI)
                    const allNonAdminPermissionIds = new Set<string>();
                    permissionData.forEach((category) => {
                        category.module.forEach((module) => {
                            module.permission.forEach((perm) => {
                                if (perm.name !== "Quản trị viên") {
                                    allNonAdminPermissionIds.add(perm.id);
                                }
                            });
                        });
                    });
                    return allNonAdminPermissionIds;
                } else {
                    // Khi uncheck "Tất cả": bỏ chọn tất cả permissions (ngoại trừ Quản trị viên)
                    permissionData.forEach((category) => {
                        category.module.forEach((module) => {
                            module.permission.forEach((perm) => {
                                if (perm.name !== "Quản trị viên") {
                                    next.delete(perm.id);
                                }
                            });
                        });
                    });
                    // Đảm bảo chính "Tất cả" cũng bị bỏ chọn
                    next.delete(permissionId);
                    return next;
                }
            } else {
                // Logic bình thường cho các permissions khác
                if (next.has(permissionId)) {
                    next.delete(permissionId);
                } else {
                    next.add(permissionId);
                }
                return next;
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const orgId = getCurrentOrg();
            if (!orgId) return;

            const trimmedName = name.trim();
            const trimmedDesc = desc.trim();

            if (!trimmedName) {
                toast.error(t("permission.nameRequired"));
                return;
            }

            // Create permission group first
            const createResponse = await createPermissionGroup(orgId, {
                name: trimmedName,
                description: trimmedDesc,
                scope: scope,
            });

            if (createResponse.code === 0) {
                const groupId = createResponse.content.id;

                // If permissions are selected, assign them to the group
                if (checkedPermissions.size > 0) {
                    const roles = Array.from(checkedPermissions).map(
                        (permissionId) => ({
                            permissionId: permissionId,
                            status: 1, // Granted
                        })
                    );

                    await grantGroupRolesMultiple(orgId, groupId, roles);
                }

                toast.success(t("permission.createSuccess"));

                // Invalidate và refresh danh sách nhóm quyền
                if (orgId) {
                    queryClient.invalidateQueries({
                        queryKey: ["permissionGroups", orgId],
                    });
                }

                onSave?.({
                    scope,
                    name: trimmedName,
                    description: trimmedDesc,
                });
                handleClose();
            } else {
                toast.error(createResponse.message || t("common.error"));
            }
        } catch (error) {
            console.error("Error creating permission group:", error);
            toast.error(t("common.error"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onClose();
        setName("");
        setDesc("");
        setScope("ORGANIZATION");
        setPermissionData([]);
        setExpandedCategories(new Set());
        setCheckedPermissions(new Set());
    };

    const getSelectedCount = () => checkedPermissions.size;

    // Kiểm tra xem quyền Quản trị viên có được check không
    const isAdminPermissionChecked = () => {
        let isChecked = false;
        permissionData.forEach((category) => {
            category.module.forEach((module) => {
                module.permission.forEach((perm) => {
                    if (
                        perm.name === "Quản trị viên" &&
                        checkedPermissions.has(perm.id)
                    ) {
                        isChecked = true;
                    }
                });
            });
        });
        return isChecked;
    };

    // Kiểm tra xem một permission có phải là Quản trị viên không
    const isAdminPermission = (permissionName: string) => {
        return permissionName === "Quản trị viên";
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("permission.addNew")}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Scope */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("common.source")}
                            </label>
                            <Select
                                value={scope}
                                onValueChange={(value) =>
                                    setScope(
                                        value as "ORGANIZATION" | "WORKSPACE"
                                    )
                                }
                                disabled={isSaving}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ORGANIZATION">
                                        {t("permission.organization")}
                                    </SelectItem>
                                    <SelectItem value="WORKSPACE">
                                        {t("permission.workspace")}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("permission.name")} *
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSaving}
                                placeholder={t("permission.enterName")}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t("common.description")}
                        </label>
                        <textarea
                            className="border rounded w-full p-2 h-20 resize-none"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            disabled={isSaving}
                            placeholder={t("permission.enterDescription")}
                        />
                    </div>

                    {/* Permissions Section */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-lg">
                                {t("permission.selectPermissions")}
                            </h3>
                            <div className="flex items-center gap-3">
                                {isAdminPermissionChecked() && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                        <span className="font-medium">
                                            Quyền Quản trị viên đã được bật
                                        </span>
                                    </div>
                                )}
                                <div className="text-sm text-gray-600">
                                    {t("permission.selectedCount", {
                                        count: getSelectedCount().toString(),
                                    })}
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <Loading />
                        ) : (
                            <div className="max-h-96 overflow-y-auto border rounded-md">
                                {permissionData.map(
                                    (category, categoryIndex) => (
                                        <div
                                            key={categoryIndex}
                                            className="border-b last:border-b-0"
                                        >
                                            {/* Category Header */}
                                            <div
                                                className="flex items-center gap-2 p-3 hover:bg-gray-50 cursor-pointer"
                                                onClick={() =>
                                                    toggleCategory(
                                                        category.name
                                                    )
                                                }
                                            >
                                                {expandedCategories.has(
                                                    category.name
                                                ) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                                <span className="font-medium">
                                                    {category.name}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    {category.isWorkspace
                                                        ? t(
                                                              "permission.workspace"
                                                          )
                                                        : t(
                                                              "permission.organization"
                                                          )}
                                                </span>
                                            </div>

                                            {/* Category Content */}
                                            {expandedCategories.has(
                                                category.name
                                            ) && (
                                                <div className="pb-3">
                                                    {category.module.map(
                                                        (
                                                            module,
                                                            moduleIndex
                                                        ) => (
                                                            <div
                                                                key={
                                                                    moduleIndex
                                                                }
                                                                className="ml-8"
                                                            >
                                                                {module.name && (
                                                                    <div className="font-medium text-sm text-gray-700 mb-2 px-3">
                                                                        {
                                                                            module.name
                                                                        }
                                                                    </div>
                                                                )}
                                                                <div className="space-y-1">
                                                                    {module.permission.map(
                                                                        (
                                                                            permission
                                                                        ) => (
                                                                            <label
                                                                                key={
                                                                                    permission.id
                                                                                }
                                                                                className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-colors ${
                                                                                    isAdminPermissionChecked() &&
                                                                                    !isAdminPermission(
                                                                                        permission.name
                                                                                    )
                                                                                        ? "cursor-not-allowed opacity-60 bg-gray-50"
                                                                                        : "hover:bg-gray-50"
                                                                                }`}
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    // Nếu Quản trị viên đã được check và đây không phải là Quản trị viên thì không cho click
                                                                                    if (
                                                                                        isAdminPermissionChecked() &&
                                                                                        !isAdminPermission(
                                                                                            permission.name
                                                                                        )
                                                                                    ) {
                                                                                        e.preventDefault();
                                                                                        return;
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={checkedPermissions.has(
                                                                                        permission.id
                                                                                    )}
                                                                                    onChange={() => {
                                                                                        // Kiểm tra disabled condition trong onChange
                                                                                        if (
                                                                                            isAdminPermissionChecked() &&
                                                                                            !isAdminPermission(
                                                                                                permission.name
                                                                                            )
                                                                                        ) {
                                                                                            return;
                                                                                        }
                                                                                        togglePermission(
                                                                                            permission.id
                                                                                        );
                                                                                    }}
                                                                                    disabled={
                                                                                        isSaving ||
                                                                                        (isAdminPermissionChecked() &&
                                                                                            !isAdminPermission(
                                                                                                permission.name
                                                                                            ))
                                                                                    }
                                                                                    className={`rounded ${
                                                                                        isAdminPermissionChecked() &&
                                                                                        !isAdminPermission(
                                                                                            permission.name
                                                                                        )
                                                                                            ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                                                                                            : ""
                                                                                    }`}
                                                                                />
                                                                                <span className="text-sm flex-1">
                                                                                    {
                                                                                        permission.name
                                                                                    }
                                                                                </span>
                                                                            </label>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {permissionData.length === 0 && !isLoading && (
                                    <div className="text-center py-8 text-gray-500">
                                        {t("permission.noPermissionsFound")}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name.trim() || isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSaving && (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        )}
                        {t("common.save")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

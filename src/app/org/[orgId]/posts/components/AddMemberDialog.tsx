"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "react-avatar";
import { postsApi } from "@/api/posts";
import { getFacebookMessageConnection } from "@/api/leadV2";
import { getAllMembers } from "@/api/org";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";

interface FacebookPage {
    id: string;
    uid: string;
    title: string;
    name: string;
    avatar: string;
    status: number;
}

interface OrgMember {
    profileId: string;
    fullName: string;
    email: string;
    avatar?: string;
}

interface PermissionRole {
    value: number;
    name: string;
    nameVi: string;
    description: string;
}

interface PostPermission {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string;
    role: number;
    roleName: string;
    roleNameVi: string;
    allowedChannelIds: string[];
}

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    onSuccess?: () => void;
    editingPermission?: PostPermission | null;
}

export function AddMemberDialog({
    open,
    onOpenChange,
    orgId,
    onSuccess,
    editingPermission,
}: AddMemberDialogProps) {
    // Data states
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [pagesLoading, setPagesLoading] = useState(false);
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [permissionRoles, setPermissionRoles] = useState<PermissionRole[]>(
        []
    );
    const [rolesLoading, setRolesLoading] = useState(false);

    // Form state
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
    const [selectedRoleValue, setSelectedRoleValue] = useState<number | null>(
        null
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Facebook pages
    const loadPages = async () => {
        if (!orgId) return;
        setPagesLoading(true);
        try {
            const response = await getFacebookMessageConnection(orgId);
            if (response.code === 0 && response.content) {
                setPages(response.content);
            }
        } catch (err) {
            console.error("Error loading Facebook pages:", err);
        } finally {
            setPagesLoading(false);
        }
    };

    // Load organization members
    const loadOrgMembers = async () => {
        if (!orgId) return;
        setMembersLoading(true);
        try {
            const res = await getAllMembers(orgId, {});
            const data = res?.content || res?.data || res || [];
            setOrgMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading org members:", err);
        } finally {
            setMembersLoading(false);
        }
    };

    // Load permission roles
    const loadPermissionRoles = async () => {
        if (!orgId) return;
        setRolesLoading(true);
        try {
            const res = await postsApi.getPostPermissionRoles(orgId);
            const data = res?.data || res || [];
            setPermissionRoles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading permission roles:", err);
        } finally {
            setRolesLoading(false);
        }
    };

    // Load data when dialog opens
    useEffect(() => {
        if (open && orgId) {
            if (pages.length === 0) loadPages();
            if (orgMembers.length === 0) loadOrgMembers();
            if (permissionRoles.length === 0) loadPermissionRoles();
        }
    }, [open, orgId]);

    // Reset or fill form when dialog opens
    useEffect(() => {
        if (open) {
            if (editingPermission) {
                // Edit mode
                setSelectedMemberId(editingPermission.userId);
                setSelectedPageIds(editingPermission.allowedChannelIds || []);
                setSelectedRoleValue(editingPermission.role);
            } else {
                // Create mode
                setSelectedMemberId("");
                setSelectedPageIds([]);
                setSelectedRoleValue(null);
            }
            setError(null);
        }
    }, [open, editingPermission]);

    // Toggle page selection
    const togglePageSelection = (pageId: string) => {
        setSelectedPageIds((prev) =>
            prev.includes(pageId)
                ? prev.filter((id) => id !== pageId)
                : [...prev, pageId]
        );
    };

    // Select/deselect all pages
    const toggleSelectAllPages = () => {
        if (selectedPageIds.length === pages.length) {
            setSelectedPageIds([]);
        } else {
            setSelectedPageIds(pages.map((p) => p.uid));
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!orgId) return;

        // Validation
        if (!selectedMemberId && !editingPermission) {
            setError("Vui lòng chọn thành viên.");
            return;
        }
        if (selectedPageIds.length === 0) {
            setError("Vui lòng chọn ít nhất một trang.");
            return;
        }
        if (selectedRoleValue === null) {
            setError("Vui lòng chọn vai trò.");
            return;
        }

        setError(null);
        setSaving(true);
        try {
            if (editingPermission) {
                // Update mode - call 2 APIs: update Role and update Pages
                await Promise.all([
                    postsApi.updateUserPostPermissionRole(
                        orgId,
                        editingPermission.userId,
                        { role: selectedRoleValue }
                    ),
                    postsApi.updateUserPostPermissionChannel(
                        orgId,
                        editingPermission.userId,
                        { channelIds: selectedPageIds }
                    ),
                ]);
            } else {
                // Create mode
                await postsApi.createPostPermission(orgId, {
                    userId: selectedMemberId,
                    role: selectedRoleValue,
                    allowedChannelIds: selectedPageIds,
                });
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            console.error("Error saving member permission:", err);
            setError(
                editingPermission
                    ? "Cập nhật thất bại. Vui lòng thử lại."
                    : "Thêm thành viên thất bại. Vui lòng thử lại."
            );
        } finally {
            setSaving(false);
        }
    };

    // Member options for SearchableSelect
    const memberOptions: SearchableSelectOption[] = useMemo(
        () =>
            orgMembers.map((member) => ({
                value: member.profileId,
                label: member.fullName || member.email || "Không có tên",
                description: member.email,
                icon: member.avatar ? (
                    <img
                        src={member.avatar}
                        alt={member.fullName}
                        className="h-5 w-5 rounded-full object-cover"
                    />
                ) : (
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {(member.fullName || member.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                    </div>
                ),
            })),
        [orgMembers]
    );

    // Role options for SearchableSelect
    const roleOptions: SearchableSelectOption[] = useMemo(
        () =>
            permissionRoles.map((role) => ({
                value: String(role.value),
                label: role.nameVi || role.name,
                description: role.description,
            })),
        [permissionRoles]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingPermission
                            ? "Cập nhật quyền thành viên"
                            : "Thêm thành viên phân quyền"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingPermission
                            ? "Cập nhật trang Facebook và vai trò của thành viên."
                            : "Chọn thành viên, trang Facebook và vai trò để cấp quyền đăng bài."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Member selector */}
                    {/* Member selector */}
                    <div className="space-y-2">
                        <Label>Thành viên</Label>
                        {editingPermission ? (
                            <div className="flex items-center gap-3 p-3 border rounded-md bg-slate-50 dark:bg-slate-800">
                                {editingPermission.userAvatar ? (
                                    <img
                                        src={editingPermission.userAvatar}
                                        alt={editingPermission.userName}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <Avatar
                                        name={editingPermission.userName}
                                        size="40"
                                        round
                                    />
                                )}
                                <div>
                                    <p className="font-medium text-sm">
                                        {editingPermission.userName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {editingPermission.userEmail}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <SearchableSelect
                                options={memberOptions}
                                value={selectedMemberId}
                                onChange={setSelectedMemberId}
                                placeholder={
                                    membersLoading
                                        ? "Đang tải..."
                                        : "Chọn thành viên..."
                                }
                                disabled={membersLoading}
                                searchPlaceholder="Tìm kiếm thành viên..."
                                emptyMessage="Không tìm thấy thành viên."
                            />
                        )}
                    </div>

                    {/* Pages multi-select */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Chọn trang Facebook được phép</Label>
                            {pages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleSelectAllPages}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {selectedPageIds.length === pages.length
                                        ? "Bỏ chọn tất cả"
                                        : "Chọn tất cả"}
                                </button>
                            )}
                        </div>
                        {pagesLoading ? (
                            <p className="text-sm text-slate-500">
                                Đang tải danh sách trang...
                            </p>
                        ) : pages.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Không có trang nào.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                {pages.map((page) => {
                                    const isSelected = selectedPageIds.includes(
                                        page.uid
                                    );
                                    return (
                                        <label
                                            key={page.uid}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? "bg-primary/10 border border-primary"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                                            }`}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    togglePageSelection(
                                                        page.uid
                                                    )
                                                }
                                            />
                                            {page.avatar ? (
                                                <img
                                                    src={page.avatar}
                                                    alt={page.name}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <Avatar
                                                    name={
                                                        page.name || page.title
                                                    }
                                                    size="32"
                                                    round
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {page.name || page.title}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    ID: {page.uid}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-xs text-slate-500">
                            Đã chọn {selectedPageIds.length} trang
                        </p>
                    </div>

                    {/* Role selector */}
                    <div className="space-y-2">
                        <Label>Chọn vai trò</Label>
                        <SearchableSelect
                            options={roleOptions}
                            value={
                                selectedRoleValue !== null
                                    ? String(selectedRoleValue)
                                    : ""
                            }
                            onChange={(val) =>
                                setSelectedRoleValue(parseInt(val, 10))
                            }
                            placeholder={
                                rolesLoading ? "Đang tải..." : "Chọn vai trò..."
                            }
                            disabled={rolesLoading}
                            searchPlaceholder="Tìm kiếm vai trò..."
                            emptyMessage="Không tìm thấy vai trò."
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">
                            {error}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving
                            ? "Đang lưu..."
                            : editingPermission
                            ? "Cập nhật"
                            : "Thêm thành viên"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { postsApi } from "@/api/posts";
import { getFacebookMessageConnection } from "@/api/leadV2";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { AddMemberDialog } from "./AddMemberDialog";
import { SyncConfigSection } from "./SyncConfigSection";
import { PostPermissionSection } from "./PostPermissionSection";

interface FacebookPage {
    id: string;
    uid: string;
    title: string;
    name: string;
    avatar: string;
    status: number;
}

interface SyncConfig {
    id?: string;
    channelIds: string[];
    isActive: boolean;
    syncIntervalMinutes?: number;
}

interface TokenInfo {
    isValid: boolean;
    expiresAt: string;
    hasRequiredPermissions: boolean;
    errorMessage: string | null;
}

interface ChannelInfo {
    id: string;
    name?: string;
    avatar?: string;
    tokenInfo?: TokenInfo | null;
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
    allowedChannels: FacebookPage[];
}

export function ChannelSettingsContent() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    // Sync config states
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [config, setConfig] = useState<SyncConfig>({
        id: undefined,
        channelIds: [],
        isActive: false,
        syncIntervalMinutes: 30,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [channelInfos, setChannelInfos] = useState<ChannelInfo[]>([]);
    const [checkingPermissions, setCheckingPermissions] = useState<{
        [channelId: string]: boolean;
    }>({});

    // Permission states
    const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
    const [postPermissions, setPostPermissions] = useState<PostPermission[]>(
        []
    );
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [editingPermission, setEditingPermission] =
        useState<PostPermission | null>(null);
    const [deletePermissionId, setDeletePermissionId] = useState<string | null>(
        null
    );
    const [showDeletePermissionDialog, setShowDeletePermissionDialog] =
        useState(false);
    const [isDeletingPermission, setIsDeletingPermission] = useState(false);

    // Load functions
    const loadPages = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const response = await getFacebookMessageConnection(orgId);
            if (response.code === 0 && response.content) {
                setPages(response.content);
            }
        } catch (err) {
            console.error("Error loading Facebook pages:", err);
            setError("Không tải được danh sách kênh.");
        } finally {
            setLoading(false);
        }
    };

    const loadConfig = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await postsApi.getFacebookSyncConfig(orgId);
            const data = (res as any)?.data || res;
            if (data) {
                setChannelInfos(data.channelInfos || []);
                setConfig({
                    id: data.id,
                    channelIds: data.channelIds || [],
                    isActive: !!data.isActive,
                    syncIntervalMinutes: data.syncIntervalMinutes,
                });
            }
        } catch (err) {
            console.error("Error loading sync config:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadPostPermissions = async () => {
        if (!orgId) return;
        setPermissionsLoading(true);
        try {
            const res = await postsApi.getPostPermission(orgId);
            const data = (res as any)?.data || res || [];
            if (Array.isArray(data)) {
                setPostPermissions(data);
            }
        } catch (err) {
            console.error("Error loading post permissions:", err);
        } finally {
            setPermissionsLoading(false);
        }
    };

    useEffect(() => {
        loadPages();
        loadConfig();
        loadPostPermissions();
    }, [orgId]);

    // Permission handlers
    const handleEditPermission = (permission: PostPermission) => {
        setEditingPermission(permission);
        setShowAddMemberDialog(true);
    };

    const handleSuccessPermission = async () => {
        await loadPostPermissions();
        setEditingPermission(null);
    };

    const handleCloseAddMemberDialog = (open: boolean) => {
        setShowAddMemberDialog(open);
        if (!open) {
            setEditingPermission(null);
        }
    };

    const handleDeletePermission = (permission: PostPermission) => {
        setDeletePermissionId(permission.userId);
        setShowDeletePermissionDialog(true);
    };

    const confirmDeletePermission = async () => {
        if (!orgId || !deletePermissionId) return;
        setIsDeletingPermission(true);
        try {
            await postsApi.deleteUserPostPermission(orgId, deletePermissionId);
            setShowDeletePermissionDialog(false);
            setDeletePermissionId(null);
            await loadPostPermissions();
        } catch (err) {
            console.error("Error deleting permission:", err);
        } finally {
            setIsDeletingPermission(false);
        }
    };

    const handleCheckPermission = async (channelId: string) => {
        if (!orgId || !config.id) return;

        setCheckingPermissions((prev) => ({ ...prev, [channelId]: true }));
        try {
            await postsApi.checkPagePermission(orgId, {
                configId: config.id,
                channelIds: [channelId],
            });
            await loadConfig();
        } catch (err) {
            console.error("Error checking permission:", err);
        } finally {
            setCheckingPermissions((prev) => ({ ...prev, [channelId]: false }));
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="flex flex-col bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="h-16 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold">
                            Cài đặt kênh &amp; Phân quyền
                        </h1>
                    </div>
                    <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
                        <span className="material-icons-outlined text-lg">
                            history
                        </span>
                        Lịch sử thay đổi
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100/60 dark:bg-slate-950/40">
                {/* Sync Config Section */}
                <SyncConfigSection
                    orgId={orgId}
                    config={config}
                    setConfig={setConfig}
                    channelInfos={channelInfos}
                    pages={pages}
                    loading={loading}
                    saving={saving}
                    setSaving={setSaving}
                    editing={editing}
                    setEditing={setEditing}
                    error={error}
                    setError={setError}
                    checkingPermissions={checkingPermissions}
                    onLoadPages={loadPages}
                    onLoadConfig={loadConfig}
                    onCheckPermission={handleCheckPermission}
                />

                {/* Post Permission Section */}
                <PostPermissionSection
                    postPermissions={postPermissions}
                    permissionsLoading={permissionsLoading}
                    onAddMember={() => setShowAddMemberDialog(true)}
                    onEditPermission={handleEditPermission}
                    onDeletePermission={handleDeletePermission}
                />
            </div>

            {/* Dialogs */}
            <CustomerAlertDialog
                open={showDeletePermissionDialog}
                setOpen={setShowDeletePermissionDialog}
                title="Xác nhận xóa thành viên"
                subtitle="Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách phân quyền? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                isSubmitting={isDeletingPermission}
                onSubmit={confirmDeletePermission}
            />

            <AddMemberDialog
                open={showAddMemberDialog}
                onOpenChange={handleCloseAddMemberDialog}
                orgId={orgId}
                editingPermission={editingPermission}
                onSuccess={handleSuccessPermission}
            />
        </div>
    );
}

import { useState } from "react";
import Avatar from "react-avatar";
import { postsApi } from "@/api/posts";
import { getFacebookPages } from "@/api/leadV2";
import { Switch } from "@/components/ui/switch";
import { ChannelCard } from "./ChannelCard";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { fbLogin } from "@/lib/fbSdk";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const FacebookPageSelectionModal = dynamic(
    () =>
        import(
            "@/app/org/[orgId]/leads/configs/form/components/facebook_page_selection_modal"
        ),
    { ssr: false }
);

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

interface ChannelInfo {
    id: string;
    name?: string;
    avatar?: string;
    tokenInfo?: {
        isValid: boolean;
        expiresAt: string;
        hasRequiredPermissions: boolean;
        errorMessage: string | null;
    } | null;
}

interface SyncConfigSectionProps {
    orgId: string;
    config: SyncConfig;
    setConfig: React.Dispatch<React.SetStateAction<SyncConfig>>;
    channelInfos: ChannelInfo[];
    pages: FacebookPage[];
    loading: boolean;
    saving: boolean;
    setSaving: React.Dispatch<React.SetStateAction<boolean>>;
    editing: boolean;
    setEditing: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    checkingPermissions: { [channelId: string]: boolean };
    onLoadPages: () => void;
    onLoadConfig: () => void;
    onCheckPermission: (channelId: string) => void;
}

export function SyncConfigSection({
    orgId,
    config,
    setConfig,
    channelInfos,
    pages,
    loading,
    saving,
    setSaving,
    editing,
    setEditing,
    error,
    setError,
    checkingPermissions,
    onLoadPages,
    onLoadConfig,
    onCheckPermission,
}: SyncConfigSectionProps) {
    const [syncing, setSyncing] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [showPageSelection, setShowPageSelection] = useState(false);
    const [facebookPages, setFacebookPages] = useState<any[]>([]);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const toggleChannel = (uid: string) => {
        setConfig((prev) => {
            const exists = prev.channelIds.includes(uid);
            return {
                ...prev,
                channelIds: exists
                    ? prev.channelIds.filter((id) => id !== uid)
                    : [...prev.channelIds, uid],
            };
        });
    };

    const handleSave = async () => {
        if (!orgId) return;
        if (config.channelIds.length === 0) {
            setError("Vui lòng chọn ít nhất một kênh để đồng bộ.");
            return;
        }

        setError(null);
        setSaving(true);
        try {
            if (config.id) {
                await postsApi.updateFacebookSyncConfig(orgId, config.id, {
                    channelIds: config.channelIds,
                    isActive: config.isActive,
                    syncIntervalMinutes: config.syncIntervalMinutes,
                });
            } else {
                const res = (await postsApi.createFacebookSyncConfig(orgId, {
                    channelIds: config.channelIds,
                    isActive: config.isActive,
                    syncIntervalMinutes: config.syncIntervalMinutes,
                })) as { id?: string };
                if (res?.id) {
                    setConfig((prev) => ({ ...prev, id: res.id }));
                }
            }
            setEditing(false);
        } catch (err) {
            console.error("Error saving sync config:", err);
            setError("Lưu cấu hình đồng bộ thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        if (!orgId) return;
        const nextActive = !config.isActive;

        if (!config.id && config.channelIds.length === 0) {
            setError("Vui lòng chọn kênh và lưu trước khi bật đồng bộ.");
            return;
        }

        setError(null);
        setSaving(true);
        try {
            if (config.id) {
                await postsApi.activeFacebookSyncConfig(orgId, config.id, {
                    isActive: nextActive,
                });
                setConfig((prev) => ({ ...prev, isActive: nextActive }));
            } else {
                const res = (await postsApi.createFacebookSyncConfig(orgId, {
                    channelIds: config.channelIds,
                    isActive: nextActive,
                    syncIntervalMinutes: config.syncIntervalMinutes,
                })) as { id?: string };
                if (res?.id) {
                    setConfig((prev) => ({
                        ...prev,
                        id: res.id,
                        isActive: nextActive,
                    }));
                }
            }
        } catch (err) {
            console.error("Error toggling sync active:", err);
            setError("Bật/tắt đồng bộ thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async () => {
        if (!orgId || !config.id) return;
        setSyncing(true);
        try {
            await postsApi.syncPost(orgId, config.id);
        } catch (err) {
            console.error("Sync error:", err);
            setError("Đồng bộ thất bại.");
        } finally {
            setSyncing(false);
        }
    };

    const handleReconnect = () => {
        setIsReconnecting(true);
        setPopoverOpen(false);

        fbLogin(
            "email,openid,pages_show_list,pages_messaging,instagram_basic,leads_retrieval,instagram_manage_messages,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_engagement,public_profile,pages_manage_posts"
        )
            .then(async (data) => {
                if (data.status !== "connected") {
                    setIsReconnecting(false);
                    toast.error("Đăng nhập Facebook thất bại hoặc bị hủy", {
                        position: "top-center",
                    });
                    return;
                }

                if (!data.authResponse) {
                    setIsReconnecting(false);
                    toast.error("Không thể lấy thông tin xác thực", {
                        position: "top-center",
                    });
                    return;
                }

                const { userID, accessToken } = data.authResponse;

                try {
                    toast.loading("Đang lấy danh sách trang Facebook...", {
                        position: "top-center",
                        id: "loading-pages",
                    });

                    const pagesResponse = await getFacebookPages(
                        userID,
                        accessToken
                    );

                    toast.dismiss("loading-pages");

                    if (pagesResponse?.data && pagesResponse.data.length > 0) {
                        setFacebookPages(pagesResponse.data);
                        setIsReconnecting(false);
                        setShowPageSelection(true);
                    } else {
                        setIsReconnecting(false);
                        toast.error(
                            "Không tìm thấy trang Facebook nào hoặc bạn chưa cấp quyền quản lý trang",
                            {
                                position: "top-center",
                            }
                        );
                    }
                } catch (error) {
                    setIsReconnecting(false);
                    toast.dismiss("loading-pages");
                    console.error("Error fetching Facebook pages:", error);
                    toast.error(
                        "Có lỗi xảy ra khi lấy danh sách trang Facebook",
                        {
                            position: "top-center",
                        }
                    );
                }
            })
            .catch((error) => {
                setIsReconnecting(false);
                console.error("Facebook login error:", error);
                toast.error("Có lỗi xảy ra khi đăng nhập Facebook", {
                    position: "top-center",
                });
            });
    };

    const handlePageConnect = async (selectedPages: any[]) => {
        setShowPageSelection(false);
        setFacebookPages([]);

        // Sau khi reconnect, gọi checkPagePermission cho tất cả channels đã chọn
        if (config.id && config.channelIds.length > 0) {
            toast.loading("Đang kiểm tra quyền các trang...", {
                position: "top-center",
                id: "checking-permissions",
            });

            try {
                await postsApi.checkPagePermission(orgId, {
                    configId: config.id,
                    channelIds: config.channelIds,
                });

                toast.dismiss("checking-permissions");
                toast.success("Đã cập nhật quyền thành công!", {
                    position: "top-center",
                });

                // Reload config để lấy tokenInfo mới
                onLoadConfig();
            } catch (err) {
                toast.dismiss("checking-permissions");
                console.error("Error checking permissions:", err);
                toast.error("Có lỗi xảy ra khi kiểm tra quyền", {
                    position: "top-center",
                });
            }
        }
    };

    return (
        <>
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <span className="material-icons-outlined text-primary">
                                sync
                            </span>
                            Đồng bộ bài viết
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Bật đồng bộ để tự động lấy bài viết từ các kênh đã
                            chọn.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {config.isActive && (
                            <Popover
                                open={popoverOpen}
                                onOpenChange={setPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <button
                                        className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Thao tác"
                                    >
                                        <span className="material-icons-outlined text-slate-600 dark:text-slate-400">
                                            more_vert
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-56 p-2"
                                    align="end"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={handleSync}
                                            disabled={
                                                !config.id ||
                                                syncing ||
                                                isReconnecting
                                            }
                                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                        >
                                            <span
                                                className={`material-icons-outlined text-lg ${
                                                    syncing
                                                        ? "animate-spin"
                                                        : ""
                                                }`}
                                            >
                                                {syncing ? "refresh" : "sync"}
                                            </span>
                                            <span>
                                                {syncing
                                                    ? "Đang đồng bộ..."
                                                    : "Đồng bộ ngay"}
                                            </span>
                                        </button>
                                        <button
                                            onClick={handleReconnect}
                                            disabled={isReconnecting || syncing}
                                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                        >
                                            <span className="material-icons-outlined text-lg">
                                                link
                                            </span>
                                            <span>
                                                {isReconnecting
                                                    ? "Đang kết nối..."
                                                    : "Kết nối lại"}
                                            </span>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                        <span className="text-sm text-slate-500">
                            Trạng thái
                        </span>

                        <Switch
                            checked={config.isActive}
                            onCheckedChange={handleToggleActive}
                            disabled={saving}
                            className={
                                saving ? "opacity-60 cursor-not-allowed" : ""
                            }
                        />

                        {!editing ? (
                            <button
                                onClick={() => {
                                    setEditing(true);
                                    if (!pages.length) onLoadPages();
                                }}
                                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-indigo-700"
                            >
                                <span className="material-icons-outlined text-sm">
                                    edit
                                </span>
                                Chỉnh sửa
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-1 bg-primary hover:bg-indigo-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-md text-sm font-medium"
                                >
                                    <span className="material-icons-outlined text-sm">
                                        save
                                    </span>
                                    {saving ? "Đang lưu..." : "Lưu"}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        onLoadConfig();
                                    }}
                                    disabled={saving}
                                    className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-md text-sm font-medium"
                                >
                                    <span className="material-icons-outlined text-sm">
                                        close
                                    </span>
                                    Hủy
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-3 text-sm text-red-500">{error}</div>
                )}

                {/* Kênh đã chọn */}
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        Kênh đang đồng bộ
                    </h4>
                    {config.channelIds.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            Chưa chọn kênh nào.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {channelInfos
                                .filter((c) => config.channelIds.includes(c.id))
                                .map((channel) => (
                                    <ChannelCard
                                        key={channel.id}
                                        channel={channel}
                                        isChecking={
                                            checkingPermissions[channel.id] ||
                                            false
                                        }
                                        onCheckPermission={onCheckPermission}
                                    />
                                ))}
                        </div>
                    )}
                </div>

                {/* Danh sách kênh (checkbox) */}
                {editing && (
                    <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                Thời gian định kì (phút)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    className="border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary w-32"
                                    value={config.syncIntervalMinutes || ""}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setConfig((prev) => ({
                                            ...prev,
                                            syncIntervalMinutes: isNaN(val)
                                                ? undefined
                                                : val,
                                        }));
                                    }}
                                    placeholder="Ví dụ: 30"
                                />
                                <span className="text-sm text-slate-500">
                                    phút
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Chọn kênh để đồng bộ
                            </h4>
                            <span className="text-xs text-slate-500">
                                {config.channelIds.length} kênh được chọn
                            </span>
                        </div>

                        {loading ? (
                            <div className="text-sm text-slate-500">
                                Đang tải danh sách kênh...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {pages.map((page) => {
                                    const checked = config.channelIds.includes(
                                        page.uid
                                    );
                                    return (
                                        <label
                                            key={page.uid}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                checked
                                                    ? "border-primary bg-primary/5"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                checked={checked}
                                                onChange={() =>
                                                    toggleChannel(page.uid)
                                                }
                                            />
                                            {page.avatar ? (
                                                <img
                                                    src={page.avatar}
                                                    alt={page.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <Avatar
                                                    name={
                                                        page.name || page.title
                                                    }
                                                    size="40"
                                                    round
                                                />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                    {page.name || page.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    ID: {page.uid}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Facebook Page Selection Modal */}
            <FacebookPageSelectionModal
                open={showPageSelection}
                setOpen={setShowPageSelection}
                pages={facebookPages}
                orgId={orgId}
                onConnect={handlePageConnect}
                isConnecting={false}
                showWorkspaceSelector={false}
            />
        </>
    );
}

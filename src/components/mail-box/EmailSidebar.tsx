import React from "react";

import {
    Inbox,
    Send,
    File,
    Archive,
    AlertCircle,
    Pencil,
    Plus,
    Settings,
    Loader2,
    X,
    Check,
    Trash2,
    MoreVertical,
    ChevronDown,
    ChevronUp,
    Folder as FolderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    getEmailTags,
    createEmailTag,
    deleteEmailTag,
    updateEmailTag,
    EmailTag,
} from "@/api/mail-box";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";

import { TagDialog } from "./TagDialog";

interface EmailSidebarProps {
    className?: string;
    activeFolder?: string;
    onFolderSelect?: (folder: string) => void;
    onComposeClick?: () => void;
    emailConfigs?: any[];
    selectedConfigId?: string;
    onConfigSelect?: (id: string) => void;
    onAddAccountClick?: () => void;
    onCollapse?: () => void;
    onSettingsClick?: () => void;
    onSelectLabel?: (tagId: string) => void;
    orgId?: string;
    isSettingsOpen?: boolean;
    availableTags?: EmailTag[];
    onTagsUpdate?: (refreshEmails?: boolean) => void;
    folders?: any[];
}

export function EmailSidebar({
    className,
    activeFolder = "Inbox",
    onFolderSelect,
    onComposeClick,
    emailConfigs = [],
    selectedConfigId,
    onConfigSelect,
    onAddAccountClick,
    onSettingsClick,
    onSelectLabel,
    orgId,
    isSettingsOpen = false,
    availableTags,
    onTagsUpdate,
    folders: apiFolders = [],
}: EmailSidebarProps) {
    const { t } = useLanguage();
    const selectedConfig = emailConfigs.find((c) => c.id === selectedConfigId);
    const foldersList = [
        {
            name: t("mail.inbox"),
            id: "INBOX",
            icon: Inbox,
            count: selectedConfig?.unreadEmails ?? 0,
        },
        { name: t("mail.sent"), id: "Sent", icon: Send, count: 0 },
        { name: t("mail.drafts"), id: "Drafts", icon: File, count: 0 },
        // { name: "Lưu trữ", id: "Archived", icon: Archive, count: 0 },
        // { name: "Spam", id: "Spam", icon: AlertCircle, count: 0 },
    ];

    const [labels, setLabels] = React.useState<EmailTag[]>(availableTags || []);
    const [showMoreFolders, setShowMoreFolders] = React.useState(false);

    // Identify folders already shown in the main list to exclude them
    const shownFolderIds = new Set(foldersList.map((f) => f.id));

    // Filter custom/extra folders
    // We map API folders to our structure or display them as is
    // API folder structure: { id, name, displayName, ... }
    const customFolders = (apiFolders || []).filter((f: any) => {
        // Exclude if it maps to a main folder we already show
        const normalizedName = (f.displayName || f.name).toLowerCase();
        // Check if this normalized name matches any of our main list IDs (normalized)
        if (
            normalizedName === "inbox" ||
            normalizedName === "drafts" ||
            normalizedName === "trash" ||
            normalizedName === "sent" ||
            normalizedName === "spam" ||
            normalizedName === "archive" ||
            normalizedName === "junk"
        )
            return false;

        return true;
    });

    React.useEffect(() => {
        if (availableTags) {
            setLabels(availableTags);
        }
    }, [availableTags]);
    const [isLoadingLabels, setIsLoadingLabels] = React.useState(false);

    // Create Dialog State
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [labelToDelete, setLabelToDelete] = React.useState<EmailTag | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingTag, setEditingTag] = React.useState<EmailTag | null>(null);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleSaveTag = async (name: string, color: string) => {
        if (!orgId || !editingTag) return;

        setIsUpdating(true);
        try {
            await updateEmailTag(orgId, selectedConfigId!, editingTag.id, {
                name,
                color,
            });
            setLabels((prev) =>
                prev.map((l) =>
                    l.id === editingTag.id ? { ...l, name, color } : l,
                ),
            );
            toast.success(t("mail.label.updateSuccess"));
            setEditDialogOpen(false);
            setEditingTag(null);
            onTagsUpdate?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Không thể cập nhật");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteLabel = async () => {
        if (!labelToDelete || !orgId) return;

        setIsDeleting(true);
        try {
            await deleteEmailTag(orgId, selectedConfigId!, labelToDelete.id);
            setLabels((prev) => prev.filter((l) => l.id !== labelToDelete.id));
            toast.success(t("mail.label.deleteSuccess"));
            setDeleteDialogOpen(false);
            setLabelToDelete(null);
            onTagsUpdate?.(); // Notify parent
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Không thể xóa nhãn");
        } finally {
            setIsDeleting(false);
        }
    };

    const colors = [
        { name: "Gray", value: "#6b7280" },
        { name: "Red", value: "#ef4444" },
        { name: "Green", value: "#22c55e" },
        { name: "Yellow", value: "#eab308" },
        { name: "Blue", value: "#3b82f6" },
        { name: "Purple", value: "#a855f7" },
    ];

    // Sync labels with availableTags prop
    React.useEffect(() => {
        if (availableTags) {
            setLabels(availableTags);
        }
    }, [availableTags]);

    const handleAddLabel = async (name: string, color: string) => {
        if (!orgId) return;

        setIsCreating(true);
        try {
            const result = await createEmailTag(orgId, selectedConfigId!, {
                name: name.trim(),
                color: color,
                description: "",
            });

            if (result?.content) {
                setLabels((prev) => [...prev, result.content]);
                toast.success(t("mail.label.createSuccess"));
                onTagsUpdate?.(false); // Do not reload emails for new tag
            } else if (result?.code === 201) {
                toast.success(t("mail.label.createSuccess"));
                onTagsUpdate?.(false); // Do not reload emails for new tag
            }
            setCreateDialogOpen(false);
            onTagsUpdate?.(); // Notify parent
        } catch (error: any) {
            console.error("Error creating label:", error);
            toast.error(error?.response?.data?.message || "Không thể tạo nhãn");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <div
                className={cn("flex flex-col h-full bg-transparent", className)}
            >
                <div className="p-4">
                    {/* Account Selector */}
                    <div className="relative mb-3 flex gap-2">
                        <Select
                            value={selectedConfigId}
                            onValueChange={(value) => onConfigSelect?.(value)}
                        >
                            <SelectTrigger className="flex-1 bg-white border-0 shadow-sm text-gray-700 max-w-[246px] min-w-0 rounded-lg h-10">
                                <SelectValue placeholder="Chọn tài khoản">
                                    {selectedConfig
                                        ? selectedConfig.emailAddress ||
                                          selectedConfig.displayName
                                        : "Chọn tài khoản"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 text-center">
                                    --- Chọn tài khoản ---
                                </div>
                                {emailConfigs.map((config) => (
                                    <SelectItem
                                        className="max-w-[246px] min-w-0 truncate"
                                        key={config.id}
                                        value={config.id}
                                    >
                                        {config.emailAddress ||
                                            config.displayName}
                                    </SelectItem>
                                ))}
                                {emailConfigs.length === 0 && (
                                    <div className="p-2 text-sm text-gray-500 text-center">
                                        Không có tài khoản
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                        {/* <Button
                            variant="outline"
                            size="icon"
                            onClick={onAddAccountClick}
                            className="shrink-0 bg-white border-gray-200 hover:bg-gray-50"
                            title="Thêm tài khoản email"
                        >
                            <Plus className="h-4 w-4" />
                        </Button> */}
                    </div>

                    {/* Compose Button */}
                    <button
                        onClick={() => {
                            // Check if any email accounts are configured
                            if (!emailConfigs || emailConfigs.length === 0) {
                                toast.error(
                                    "Chưa có tài khoản email nào. Vui lòng vào Thiết lập để cấu hình tài khoản email.",
                                    {
                                        duration: 5000,
                                    },
                                );
                                return;
                            }
                            onComposeClick?.();
                        }}
                        className="w-full text-white bg-sidebar-primary py-1.5 px-2 md:px-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Pencil className="h-4 w-4" />
                        {t("mail.compose")}
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-2">
                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {t("mail.folders")}
                    </h3>
                    <nav className="space-y-2 px-2">
                        {foldersList.map((folder) => {
                            const isActive =
                                !isSettingsOpen && activeFolder === folder.id;
                            return (
                                <button
                                    key={folder.name}
                                    onClick={() => onFolderSelect?.(folder.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group",
                                        isActive
                                            ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100/50"
                                            : "bg-transparent hover:bg-white/40",
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "p-2 rounded-lg transition-colors flex items-center justify-center",
                                                isActive
                                                    ? "bg-indigo-50 text-indigo-600"
                                                    : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600",
                                            )}
                                        >
                                            <folder.icon
                                                className={cn(
                                                    "h-4 w-4 shrink-0",
                                                )}
                                            />
                                        </div>
                                        <span
                                            className={cn(
                                                "font-semibold",
                                                isActive
                                                    ? "text-gray-900"
                                                    : "text-gray-600 group-hover:text-gray-900",
                                            )}
                                        >
                                            {folder.name}
                                        </span>
                                    </div>
                                    {folder.count > 0 && (
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 bg-indigo-600 text-white",
                                            )}
                                        >
                                            {folder.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* Custom Folders Section */}
                        {customFolders.length > 0 && (
                            <button
                                onClick={() =>
                                    setShowMoreFolders(!showMoreFolders)
                                }
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors mt-2 mx-1"
                            >
                                {showMoreFolders ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 shrink-0" />
                                        <span>{t("mail.showLess")}</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 shrink-0" />
                                        <span>{t("mail.showMore")}</span>
                                    </>
                                )}
                            </button>
                        )}
                        {customFolders.length > 0 && (
                            <>
                                {showMoreFolders && (
                                    <div className="mt-1 space-y-2">
                                        {customFolders.map((folder: any) => {
                                            const isActive =
                                                !isSettingsOpen &&
                                                activeFolder === folder.name;
                                            return (
                                                <button
                                                    key={folder.id}
                                                    onClick={() =>
                                                        onFolderSelect?.(
                                                            folder.name,
                                                        )
                                                    }
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm group",
                                                        isActive
                                                            ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100/50"
                                                            : "bg-transparent hover:bg-white/40",
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "p-2 rounded-lg transition-colors flex items-center justify-center",
                                                                isActive
                                                                    ? "bg-indigo-50 text-indigo-600"
                                                                    : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600",
                                                            )}
                                                        >
                                                            <FolderIcon
                                                                className={cn(
                                                                    "h-4 w-4 shrink-0",
                                                                )}
                                                            />
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                "font-semibold",
                                                                isActive
                                                                    ? "text-gray-900"
                                                                    : "text-gray-600 group-hover:text-gray-900",
                                                            )}
                                                        >
                                                            {folder.displayName ||
                                                                folder.name}
                                                        </span>
                                                    </div>
                                                    {(folder.unreadCount > 0 ||
                                                        folder.totalCount >
                                                            0) && (
                                                        <span
                                                            className={cn(
                                                                "text-xs font-bold px-2 py-1 rounded-lg",
                                                                isActive
                                                                    ? "bg-gray-100 text-gray-900"
                                                                    : "bg-gray-100/50 text-gray-500 group-hover:bg-gray-200",
                                                            )}
                                                        >
                                                            {folder.unreadCount ||
                                                                folder.totalCount}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </nav>

                    <div className="flex items-center justify-between px-4 mt-6 mb-2 group">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {t("mail.labels")}
                        </h3>
                        <button
                            className="text-gray-600 p-0.5 rounded-full bg-gray-100 opacity-100 transition-all hover:bg-gray-200"
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <nav className="space-y-0.5 px-2">
                        {isLoadingLabels ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                        ) : labels.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-2">
                                {t("mail.noLabels")}
                            </div>
                        ) : (
                            labels.map((label) => (
                                <div
                                    key={label.id}
                                    className="group flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                    onClick={() =>
                                        onSelectLabel && onSelectLabel(label.id)
                                    }
                                    onDoubleClick={() => {
                                        if (!label.isSystem) {
                                            setEditingTag(label);
                                            setEditDialogOpen(true);
                                        }
                                    }}
                                >
                                    <div className="flex items-center">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full mr-3"
                                            style={{
                                                backgroundColor: label.color,
                                            }}
                                        />
                                        <span className="text-black font-medium leading-tight cursor-pointer">
                                            {label.name}
                                        </span>
                                        {/* Unread count badge */}
                                        {(label.unreadCount ?? 0) > 0 && (
                                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                                                {label.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    {!label.isSystem && (
                                        <DropdownMenu
                                            onOpenChange={(open) => {
                                                if (open) {
                                                    onTagsUpdate?.();
                                                }
                                            }}
                                        >
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all focus:opacity-100"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-32"
                                            >
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingTag(label);
                                                        setEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="w-3.5 h-3.5 mr-2" />
                                                    Sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLabelToDelete(label);
                                                        setDeleteDialogOpen(
                                                            true,
                                                        );
                                                    }}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                    Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))
                        )}
                    </nav>
                </div>

                {/* Footer Settings */}
                <div className="p-4 border-t border-gray-200 mt-auto">
                    <button
                        onClick={onSettingsClick}
                        className={cn(
                            "flex items-center gap-3 transition-colors w-full px-3 py-2 rounded-lg group",
                            isSettingsOpen
                                ? "bg-white text-gray-900"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                        )}
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                        <span className="font-medium text-sm">
                            {t("mail.settings")}
                        </span>
                    </button>
                </div>
            </div>

            {/* Delete Label Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setLabelToDelete(null);
                }}
                onConfirm={handleDeleteLabel}
                title="Xóa nhãn"
                description={
                    (labelToDelete?.emailCount ?? 0) > 0
                        ? `Nhãn "${labelToDelete?.name}" đang được gán cho ${labelToDelete?.emailCount} email. Bạn có chắc chắn muốn xóa không?`
                        : `Bạn có chắc chắn muốn xóa nhãn "${labelToDelete?.name}" không?`
                }
                confirmText={isDeleting ? "Đang xóa..." : "Xóa"}
                cancelText="Hủy"
                variant="destructive"
            />
            {/* Create Tag Dialog */}
            <TagDialog
                isOpen={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSave={handleAddLabel}
                isSaving={isCreating}
                title="Tạo nhãn mới"
                confirmText="Tạo nhãn"
            />

            {/* Edit Tag Dialog */}
            <TagDialog
                isOpen={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setEditingTag(null);
                }}
                onSave={handleSaveTag}
                initialName={editingTag?.name || ""}
                initialColor={editingTag?.color || "#6b7280"}
                isSaving={isUpdating}
                title="Chỉnh sửa nhãn"
                confirmText="Lưu thay đổi"
            />
        </>
    );
}

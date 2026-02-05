import { useLanguage } from "@/contexts/LanguageContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
    useDeleteWorkspace,
    useOrgUsageStatistics,
    useUpdateWorkspace,
} from "@/hooks/useOrgV2";
import { WorkspaceListItem } from "@/lib/interface";
import { Check, List, PlusIcon, Settings, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { WorkspaceIcon } from "../icons";
import { Button } from "../ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import DealFilter from "./DealFilter";
import { useOrgStore } from "@/store/useOrgStore";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";

interface DealHeaderProps {
    orgId: string;
    editDeal: () => void;
    cancelEdit?: () => void; // Add cancel edit function
    isEditMode: boolean;
    viewMode: "kanban" | "list";
    onChangeView: (mode: "kanban" | "list") => void;
    workspaces: WorkspaceListItem[];
    selectedWorkspace?: string;
    onWorkspaceChange?: (workspaceId: string) => void;
    onAddNewDeal?: () => void;
    totalDeals?: number;
    totalPrice?: number;
    isCreatingWorkspace?: boolean;
    onCancelCreateWorkspace?: () => void;
    onConfirmCreateWorkspace?: (name: string) => void;
    isCreatingProcess?: boolean;
    hasNoStages?: boolean;
    onStartCreateProcess?: () => void;
    onConfirmCreateProcess?: () => void;
    // trạng thái đang lưu để disable nút Lưu
    isSaving?: boolean;
}

export const DealHeader = ({
    orgId,
    editDeal,
    cancelEdit,
    isEditMode,
    viewMode,
    onChangeView,
    workspaces,
    selectedWorkspace,
    onWorkspaceChange,
    onAddNewDeal,
    totalDeals,
    totalPrice,
    isCreatingWorkspace,
    isCreatingProcess,
    hasNoStages,
    onCancelCreateWorkspace,
    onConfirmCreateWorkspace,
    onStartCreateProcess,
    onConfirmCreateProcess,
    isSaving,
}: DealHeaderProps) => {
    const { t } = useLanguage();
    const breakpoint = useBreakpoint();
    // Prioritize selectedWorkspace prop over the first workspace in the list
    // This ensures that when wid param is present, that workspace is selected
    const [isOpenTeamSaleModal, setIsOpenTeamSaleModal] = useState(false);
    const defaultSelectedWorkspace =
        selectedWorkspace || (workspaces.length > 0 ? workspaces[0].id : "");

    const [newWorkspaceName, setNewWorkspaceName] = useState(
        "Không gian làm việc mới",
    );
    const [showNameActions, setShowNameActions] = useState(false);
    const [editingWorkspaceName, setEditingWorkspaceName] = useState("");
    const [originalWorkspaceName, setOriginalWorkspaceName] = useState("");
    const { data: usageStatistics } = useOrgUsageStatistics(orgId);

    const canCreateWorkspace =
        usageStatistics?.content?.countWorkspace <
        usageStatistics?.content?.maxWorkspace;

    // Get current workspace name
    const currentWorkspace = workspaces.find(
        (w) => w.id === defaultSelectedWorkspace,
    );
    const currentWorkspaceName = currentWorkspace?.name || "";

    // Initialize workspace name for editing
    useEffect(() => {
        if (isEditMode && currentWorkspaceName) {
            setEditingWorkspaceName(currentWorkspaceName);
            setOriginalWorkspaceName(currentWorkspaceName);
        }
    }, [isEditMode, currentWorkspaceName]);

    // Update workspace mutation
    const updateWorkspaceMutation = useUpdateWorkspace(
        orgId,
        defaultSelectedWorkspace,
        true,
    );

    // Handle save workspace name changes
    const handleSaveWorkspaceName = () => {
        if (
            editingWorkspaceName !== originalWorkspaceName &&
            editingWorkspaceName.trim()
        ) {
            updateWorkspaceMutation.mutate({
                Name: editingWorkspaceName.trim(),
            });
        }
    };

    const { orgDetail } = useOrgStore();
    const isAdminOrOwner =
        orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";

    const deleteWorkspaceMutation = useDeleteWorkspace(orgId);
    const [workspaceToDelete, setWorkspaceToDelete] =
        useState<WorkspaceListItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteWorkspace = () => {
        if (workspaceToDelete) {
            deleteWorkspaceMutation.mutate(workspaceToDelete.id, {
                onSuccess: () => {
                    setShowDeleteConfirm(false);
                    const remainingWorkspaces = workspaces.filter(
                        (w) => w.id !== workspaceToDelete.id,
                    );
                    if (remainingWorkspaces.length > 0 && onWorkspaceChange) {
                        onWorkspaceChange(remainingWorkspaces[0].id);
                    }

                    setWorkspaceToDelete(null);
                },
            });
        }
    };

    return (
        <>
            <div className="flex items-center justify-between gap-4 p-2 text-sm">
                <div className="flex items-center gap-2">
                    {!isCreatingWorkspace && (
                        <>
                            {!isEditMode ? (
                                <Select
                                    value={defaultSelectedWorkspace}
                                    onValueChange={onWorkspaceChange}
                                >
                                    <SelectTrigger className="w-[250px] data-[slot=select-value]:text-ellipsis data-[slot=select-value]:whitespace-nowrap data-[slot=select-value]:block">
                                        <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
                                            <WorkspaceIcon className="size-4 flex-shrink-0" />
                                            <SelectValue
                                                placeholder={t(
                                                    "workspace.selectWorkspace",
                                                )}
                                            />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workspaces.map((workspace) => (
                                            <SelectItem
                                                key={workspace.id}
                                                value={workspace.id}
                                                className="group"
                                            >
                                                <div className="flex items-center justify-between w-full min-w-[200px] gap-2">
                                                    <span>
                                                        {workspace.name}
                                                    </span>
                                                    {isAdminOrOwner &&
                                                        workspace.id ===
                                                            defaultSelectedWorkspace &&
                                                        workspace.name !==
                                                            "Mặc định" && (
                                                            <div
                                                                className="p-1 hover:bg-red-100 rounded-md text-muted-foreground hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"
                                                                onPointerDown={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    setWorkspaceToDelete(
                                                                        workspace,
                                                                    );
                                                                    setShowDeleteConfirm(
                                                                        true,
                                                                    );
                                                                }}
                                                                role="button"
                                                                tabIndex={0}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </div>
                                                        )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {canCreateWorkspace &&
                                            isAdminOrOwner && (
                                                <SelectItem value="__create_new_workspace__">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <PlusIcon className="size-4 text-primary" />
                                                        Thêm không gian làm việc
                                                        mới
                                                    </div>
                                                </SelectItem>
                                            )}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <WorkspaceIcon className="size-4" />
                                    <span className="text-sm text-muted-foreground">
                                        Tên không gian làm việc:
                                    </span>
                                    <input
                                        className="px-3 py-1.5 border rounded-md outline-none focus:ring-2 focus:ring-primary/30 w-[250px]"
                                        value={editingWorkspaceName}
                                        onChange={(e) =>
                                            setEditingWorkspaceName(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Nhập tên không gian làm việc"
                                    />
                                </div>
                            )}

                            {/* Only show view controls and stats when NOT in edit mode */}
                            {!isEditMode && (
                                <>
                                    {breakpoint == "2xl" ? (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                onChangeView("kanban")
                                            }
                                            className={
                                                viewMode === "kanban"
                                                    ? "flex items-center gap-2 border text-sidebar-primary border-sidebar-primary rounded-lg bg-sidebar-primary/5 font-medium"
                                                    : "flex items-center gap-2 border rounded-lg hover:bg-muted"
                                            }
                                        >
                                            <Image
                                                src="/icons/view_kanban.png"
                                                alt=""
                                                width={16}
                                                height={16}
                                            />
                                            {t("deal.pipeline")}
                                        </Button>
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip
                                                content={t("deal.pipeline")}
                                            >
                                                <Button
                                                    variant="outline"
                                                    className={
                                                        viewMode === "kanban"
                                                            ? "flex items-center gap-2 border text-sidebar-primary border-sidebar-primary rounded-lg bg-sidebar-primary/5 font-medium"
                                                            : "flex items-center gap-2 border rounded-lg hover:bg-muted"
                                                    }
                                                    onClick={() =>
                                                        onChangeView("kanban")
                                                    }
                                                >
                                                    <Image
                                                        src="/icons/view_kanban.png"
                                                        alt=""
                                                        width={16}
                                                        height={16}
                                                    />
                                                </Button>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {breakpoint == "2xl" ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => onChangeView("list")}
                                            className={
                                                viewMode === "list"
                                                    ? "flex items-center gap-2 border text-sidebar-primary border-sidebar-primary rounded-lg bg-sidebar-primary/5 font-medium"
                                                    : "flex items-center gap-2 border rounded-lg hover:bg-muted text-sm font-normal text-[#646A73]"
                                            }
                                        >
                                            <List className="size-4" />
                                            {t("deal.list")}
                                        </Button>
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip content={t("deal.list")}>
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        onChangeView("list")
                                                    }
                                                >
                                                    <List className="size-4" />
                                                </Button>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {/* Deal Filter - show in both views */}
                                    {selectedWorkspace && (
                                        <DealFilter
                                            workspaceId={selectedWorkspace}
                                        />
                                    )}
                                    <div className="h-5 w-px bg-border" />
                                    <span className="text-muted-foreground">
                                        {t("deal.allCustomers")}:{" "}
                                        <span className="font-bold">
                                            {totalDeals}
                                        </span>
                                    </span>
                                    <span className="text-muted-foreground">
                                        {t("deal.totalRevenue")}:{" "}
                                        <span className="font-bold">
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                                maximumFractionDigits: 0,
                                            }).format(totalPrice || 0)}
                                        </span>
                                    </span>
                                    {hasNoStages &&
                                        selectedWorkspace &&
                                        viewMode === "kanban" && (
                                            <button
                                                onClick={onStartCreateProcess}
                                                className="ml-2 border rounded-lg text-primary border-primary hover:bg-primary/5"
                                            >
                                                Thêm quy trình làm việc
                                            </button>
                                        )}
                                </>
                            )}
                        </>
                    )}

                    {isCreatingWorkspace && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm">
                                Tên không gian làm việc:
                            </span>
                            <input
                                className="px-3 py-1.5 border rounded-md outline-none focus:ring-2 focus:ring-primary/30 w-[320px]"
                                value={newWorkspaceName}
                                onChange={(e) =>
                                    setNewWorkspaceName(e.target.value)
                                }
                                onFocus={() => setShowNameActions(true)}
                            />
                            {showNameActions && (
                                <>
                                    <button
                                        className="text-red-500 hover:text-red-600"
                                        title="Hủy"
                                        onClick={() => {
                                            setNewWorkspaceName("");
                                            setShowNameActions(false);
                                        }}
                                    >
                                        <X className="size-4" />
                                    </button>
                                    <button
                                        className="text-primary hover:text-primary/80"
                                        title="Lưu"
                                        onClick={() => {
                                            // Name is already in state; just hide buttons
                                            setShowNameActions(false);
                                        }}
                                    >
                                        <Check className="size-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isEditMode &&
                        !isCreatingWorkspace &&
                        !isCreatingProcess &&
                        (breakpoint == "2xl" ? (
                            <Button onClick={onAddNewDeal}>
                                <PlusIcon className="size-4" />
                                {t("common.addNew")}
                            </Button>
                        ) : (
                            <TooltipProvider>
                                <Tooltip content={t("common.addNew")}>
                                    <Button onClick={onAddNewDeal}>
                                        <PlusIcon className="size-4" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                        ))}

                    {isEditMode && cancelEdit && (
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip content={t("common.cancel")}>
                                    <Button
                                        onClick={cancelEdit}
                                        variant="destructive"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip content={t("common.save")}>
                                    <Button
                                        onClick={
                                            isCreatingWorkspace
                                                ? () =>
                                                      onConfirmCreateWorkspace?.(
                                                          newWorkspaceName,
                                                      )
                                                : isCreatingProcess
                                                  ? onConfirmCreateProcess
                                                  : () => {
                                                        handleSaveWorkspaceName();
                                                        editDeal();
                                                    }
                                        }
                                        disabled={isSaving}
                                        variant="default"
                                    >
                                        <Check className="size-4" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                    {viewMode === "kanban" && !isEditMode && (
                        <TooltipProvider>
                            <Tooltip content={t("common.edit")}>
                                <Button
                                    onClick={editDeal}
                                    variant={isEditMode ? "default" : "outline"}
                                >
                                    <Settings className="size-4" />
                                </Button>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
            <CustomerAlertDialog
                open={showDeleteConfirm}
                setOpen={setShowDeleteConfirm}
                title={`Xóa không gian làm việc ${workspaceToDelete?.name}`}
                subtitle={
                    <span>
                        Nếu bạn tiếp tục, tất cả dữ liệu sẽ bị{" "}
                        <span className="font-bold text-red-500">
                            xóa vĩnh viễn
                        </span>{" "}
                        và{" "}
                        <span className="font-bold text-red-500">
                            không thể khôi phục
                        </span>
                        . Bạn có chắc chắn muốn xóa không gian làm việc này?
                    </span>
                }
                confirmText="Xóa"
                onSubmit={handleDeleteWorkspace}
                isSubmitting={deleteWorkspaceMutation.isPending}
            />
        </>
    );
};

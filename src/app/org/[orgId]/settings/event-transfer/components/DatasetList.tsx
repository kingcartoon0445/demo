import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent } from "@radix-ui/react-popover";
import React, { useState } from "react";
import {
    MdAddCircleOutline,
    MdDelete,
    MdDeleteOutline,
    MdExpandMore,
    MdKeyboardArrowRight,
    MdMoreVert,
    MdTune,
} from "react-icons/md";
import { Dataset } from "../types";

// Helper component for collapsible section within dataset list
const CollapsibleSection: React.FC<{
    title: string;
    count: number;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string; // Allow custom styling
    action?: React.ReactNode;
}> = ({
    title,
    count,
    children,
    defaultExpanded = false,
    className,
    action,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // if (count === 0) return null; // Removed to show empty workspaces

    return (
        <div
            className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}
        >
            <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <MdExpandMore className="text-gray-500 text-[20px]" />
                    ) : (
                        <MdKeyboardArrowRight className="text-gray-500 text-[20px]" />
                    )}
                    <span className="text-sm font-bold text-gray-700 uppercase">
                        {title}
                    </span>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                </div>
                {action && (
                    <div onClick={(e) => e.stopPropagation()}>{action}</div>
                )}
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200">{children}</div>
            )}
        </div>
    );
};

interface DatasetListProps {
    datasets: Dataset[];
    onOpenAddDialog: () => void;
    onOpenEditDialog: (dataset: Dataset) => void;
    onDeleteDataset: (id: string) => void;
    onUpdateStatus: (id: string, status: number) => void;
    onDeleteEvent?: (
        id: string,
        datasetId: string,
        workspaceId: string,
    ) => void;
    onAddDetail?: (dataset: Dataset) => void;
    onResetEvents?: (datasetId: string, workspaceId: string) => void;
    onToggleLead?: (datasetId: string, currentState: number) => void;
    onToggleDeal?: (datasetId: string, currentState: number) => void;
    onDeleteAllEvents?: (datasetId: string, workspaceId: string) => void;
    onDeleteWorkspace?: (datasetId: string, workspaceId: string) => void;
}

export const DatasetList: React.FC<DatasetListProps> = ({
    datasets,
    onOpenAddDialog,
    onOpenEditDialog,
    onDeleteDataset,
    onUpdateStatus,
    onDeleteEvent,
    onResetEvents,
    onToggleLead,
    onToggleDeal,
    onDeleteAllEvents,
    onDeleteWorkspace,
}) => {
    const [resetDialogState, setResetDialogState] = useState<{
        isOpen: boolean;
        datasetId: string;
        workspaceId: string;
    }>({
        isOpen: false,
        datasetId: "",
        workspaceId: "",
    });
    const [deleteDatasetDialogState, setDeleteDatasetDialogState] = useState<{
        isOpen: boolean;
        datasetId: string;
    }>({
        isOpen: false,
        datasetId: "",
    });

    // Helper to render event labels
    const renderEventLabels = (
        events: any[],
        datasetId: string,
        workspaceId: string,
    ) => {
        if (events.length === 0) {
            return (
                <div className="py-6 text-center text-sm text-gray-500">
                    Chưa có sự kiện nào được ánh xạ
                </div>
            );
        }
        return (
            <div className="flex flex-wrap gap-3 p-4">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="group relative inline-flex items-start gap-2.5 px-4 py-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 "
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-gray-900 leading-tight">
                                {event.stageName || "Không có tên"}
                            </span>
                        </div>
                        {/* <button
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-red-600 text-white transition-all duration-200"
                            onClick={() =>
                                onDeleteEvent &&
                                onDeleteEvent(
                                    event.id,
                                    datasetId,
                                    event.workspaceId || workspaceId,
                                )
                            }
                        >
                            <MdDeleteOutline className="text-[14px]" />
                        </button> */}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h3 className="text-gray-900 text-xl font-bold">
                    Danh sách Dataset
                </h3>
                <div className="flex items-center gap-3">
                    <Button
                        className="flex items-center gap-2 h-9 bg-primary hover:bg-[#3a0fc2] text-white font-bold shadow-sm"
                        onClick={onOpenAddDialog}
                    >
                        <MdAddCircleOutline className="w-[18px] h-[18px]" />
                        <span>Thêm Dataset</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {datasets.map((dataset) => {
                    const leadWorkspaces =
                        dataset.workspaces?.filter(
                            (ws) => ws.category === "LEAD",
                        ) || [];
                    const dealWorkspaces =
                        dataset.workspaces?.filter(
                            (ws) => ws.category === "DEAL",
                        ) || [];

                    const leadEvents = leadWorkspaces.flatMap((ws) =>
                        ws.events.map((e) => ({
                            ...e,
                            workspaceId: ws.workspaceId,
                        })),
                    );

                    return (
                        <div
                            key={dataset.id}
                            className="bg-white rounded-xl border border-gray-200 transition-all overflow-hidden"
                        >
                            <div className="p-5 flex flex-col gap-4">
                                {/* Header Row */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex gap-6 flex-1">
                                        <div className="flex-1 min-w-0">
                                            <span
                                                className="text-gray-900 text-lg font-bold rounded w-fit block truncate"
                                                title={dataset.title}
                                            >
                                                {dataset.title ||
                                                    "Không có tiêu đề"}
                                            </span>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                ID: {dataset.datasetId}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={dataset.status === 1}
                                                onCheckedChange={(checked) => {
                                                    const newStatus = checked
                                                        ? 1
                                                        : 2;
                                                    onUpdateStatus(
                                                        dataset.id,
                                                        newStatus,
                                                    );
                                                }}
                                            />
                                        </div>
                                        <div className="w-px h-6 bg-gray-200"></div>
                                        <Popover>
                                            <PopoverTrigger>
                                                <Button variant="ghost">
                                                    <MdMoreVert className="text-[28px]" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <div className="bg-white rounded-lg shadow-sm p-2 flex flex-col gap-2 h-full">
                                                    <Button
                                                        variant="ghost"
                                                        className="p-2 rounded-lg hover:text-primary hover:bg-primary/10 transition-colors justify-start"
                                                        onClick={() =>
                                                            onOpenEditDialog(
                                                                dataset,
                                                            )
                                                        }
                                                    >
                                                        <MdTune className="text-[20px]" />
                                                        Cấu hình
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className="p-2 rounded-lg hover:text-red-600 hover:bg-red-50 transition-colors justify-start"
                                                        onClick={() =>
                                                            setDeleteDatasetDialogState(
                                                                {
                                                                    isOpen: true,
                                                                    datasetId:
                                                                        dataset.id,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <MdDelete className="text-[20px]" />
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            {(leadEvents.length > 0 ||
                                dealWorkspaces.length > 0) && (
                                <div className="border-t border-gray-200 p-5 flex flex-col gap-6">
                                    <h4 className="text-gray-900 text-lg font-bold">
                                        Giai đoạn đồng bộ
                                    </h4>
                                    <div className="flex flex-col gap-4">
                                        {leadEvents.length > 0 && (
                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-between pl-1 pr-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-[4px] h-[20px] rounded-full bg-primary"></span>
                                                        <span className="text-sm font-bold text-gray-700 uppercase">
                                                            Chăm khách
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden">
                                                    {renderEventLabels(
                                                        leadEvents,
                                                        dataset.id,
                                                        leadWorkspaces[0]
                                                            ?.workspaceId || "",
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {dealWorkspaces.length > 0 && (
                                            <div className="flex flex-col gap-3">
                                                {/* <div className="flex items-center justify-between pl-1 pr-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-700 uppercase">
                                                            Giao dịch
                                                        </span>
                                                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {dealWorkspaces.reduce(
                                                                (acc, ws) =>
                                                                    acc +
                                                                    ws.events
                                                                        .length,
                                                                0
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Switch
                                                        checked={
                                                            dataset.isActiveDeal ===
                                                            1
                                                        }
                                                        onCheckedChange={() =>
                                                            onToggleDeal &&
                                                            onToggleDeal(
                                                                dataset.id,
                                                                dataset.isActiveDeal ||
                                                                    0
                                                            )
                                                        }
                                                    />
                                                </div> */}
                                                <div className="flex flex-col gap-4">
                                                    {dealWorkspaces.map(
                                                        (ws) => (
                                                            <div
                                                                key={
                                                                    ws.workspaceId
                                                                }
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-[4px] h-[20px] rounded-full bg-primary"></span>
                                                                        <span className="text-sm font-bold text-gray-700 uppercase">
                                                                            {ws.workspaceName ||
                                                                                "Không có tên"}
                                                                        </span>
                                                                    </div>
                                                                    {/* <div className="flex items-center gap-1">
                                                                        <TooltipProvider>
                                                                            <Tooltip content="Làm mới giai đoạn">
                                                                                <button
                                                                                    className="p-1.5 rounded hover:text-primary hover:bg-primary/10 transition-colors"
                                                                                    onClick={() =>
                                                                                        setResetDialogState(
                                                                                            {
                                                                                                isOpen: true,
                                                                                                datasetId:
                                                                                                    dataset.id,
                                                                                                workspaceId:
                                                                                                    ws.workspaceId,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <MdRefresh className="text-[20px]" />
                                                                                </button>
                                                                            </Tooltip>
                                                                        </TooltipProvider>

                                                                        <TooltipProvider>
                                                                            <Tooltip content="Xóa không gian làm việc ra khỏi dataset">
                                                                                <button
                                                                                    className="p-1.5 rounded hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                                    onClick={() =>
                                                                                        onDeleteWorkspace &&
                                                                                        onDeleteWorkspace(
                                                                                            dataset.id,
                                                                                            ws.workspaceId
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <MdDelete className="text-[20px]" />
                                                                                </button>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div> */}
                                                                </div>

                                                                <div className="bg-white">
                                                                    {renderEventLabels(
                                                                        ws.events.map(
                                                                            (
                                                                                e,
                                                                            ) => ({
                                                                                ...e,
                                                                                workspaceId:
                                                                                    ws.workspaceId,
                                                                            }),
                                                                        ),
                                                                        dataset.id,
                                                                        ws.workspaceId,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <CustomerAlertDialog
                open={resetDialogState.isOpen}
                setOpen={(isOpen) =>
                    setResetDialogState((prev) => ({ ...prev, isOpen }))
                }
                title="Làm mới giai đoạn?"
                subtitle="Bạn có chắc chắn muốn làm mới các giai đoạn trong dataset này không? Hành động này không thể hoàn tác."
                confirmText="Làm mới"
                onSubmit={() => {
                    if (
                        onResetEvents &&
                        resetDialogState.datasetId &&
                        resetDialogState.workspaceId
                    ) {
                        onResetEvents(
                            resetDialogState.datasetId,
                            resetDialogState.workspaceId,
                        );
                    }
                    setResetDialogState((prev) => ({ ...prev, isOpen: false }));
                }}
            />

            <CustomerAlertDialog
                open={deleteDatasetDialogState.isOpen}
                setOpen={(isOpen) =>
                    setDeleteDatasetDialogState((prev) => ({ ...prev, isOpen }))
                }
                title="Xóa Dataset?"
                subtitle="Bạn có chắc chắn muốn xóa Dataset này không? Hành động này không thể hoàn tác và sẽ xóa tất cả các cấu hình liên quan."
                confirmText="Xóa Dataset"
                onSubmit={() => {
                    if (onDeleteDataset && deleteDatasetDialogState.datasetId) {
                        onDeleteDataset(deleteDatasetDialogState.datasetId);
                    }
                    setDeleteDatasetDialogState((prev) => ({
                        ...prev,
                        isOpen: false,
                    }));
                }}
            />
        </div>
    );
};

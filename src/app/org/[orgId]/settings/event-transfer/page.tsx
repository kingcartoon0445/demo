"use client";

import { Glass } from "@/components/Glass";
import React, { useState, useEffect } from "react";
import { MdInfo } from "react-icons/md";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllDataset,
    createDataset,
    updateDataset,
    updateDatasetAccessToken,
    mappingDatasetEvents,
    getAllDatasetEvents,
    updateDatasetStatus,
    datasetForWorkspace,
    deleteEvent,
    deleteAllEvents,
    resetEvents,
    deleteDataset,
    activateDatasetOnLead,
    activateDatasetOnDeal,
    deleteWorkspaceConfig,
} from "@/api/facebook-capi";
import { useParams } from "next/navigation";
import { getStageList } from "@/api/workspace";
import toast from "react-hot-toast";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

import {
    Dataset,
    DatasetResponse,
    DatasetEventsResponse,
    EventMapping,
} from "./types";
import { EventTransferHeader } from "./components/EventTransferHeader";
import { EventMappingList } from "./components/EventMappingList";
import { DatasetList } from "./components/DatasetList";
import { AddDatasetDialog } from "./components/AddDatasetDialog";
import { EventMappingDialog } from "./components/EventMappingDialog";

// Mock data
const mockDatasets: Dataset[] = []; // Clear mock data as we fetch from API

const mockEventMappings: EventMapping[] = [
    {
        id: "1",
        fbEventName: "Purchase",
        crmEventName: "Confirmed Order",
        status: "active",
        icon: "purchase",
    },
    {
        id: "2",
        fbEventName: "Initiate Checkout",
        crmEventName: "New Order",
        status: "active",
        icon: "checkout",
    },
    {
        id: "3",
        fbEventName: "View Content",
        crmEventName: "Product View",
        status: "inactive",
        icon: "view",
    },
];

export default function EventTransferPage() {
    const { t } = useLanguage();
    const params = useParams();
    const orgId = params?.orgId as string;

    // Queries
    const queryClient = useQueryClient();
    const { data: datasetsData } = useQuery({
        queryKey: ["datasets", orgId],
        queryFn: () => getAllDataset(orgId) as Promise<any>,
        enabled: !!orgId,
    });

    // Mutations
    const createDatasetMutation = useMutation({
        mutationFn: ({ body, isUpdate }: { body: any; isUpdate: boolean }) =>
            createDataset(orgId, body),
        onSuccess: (data: any, variables) => {
            const { isUpdate } = variables;
            if (data?.code !== 0) {
                toast.error(
                    data?.message ||
                        (isUpdate
                            ? "Cập nhật Dataset thất bại"
                            : "Thêm mới Dataset thất bại"),
                );
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["datasets", orgId] });
            setIsAddDatasetDialogOpen(false);
            setNewDatasetId("");
            setNewAccessToken("");
            toast.success(
                isUpdate
                    ? "Cập nhật Dataset thành công"
                    : "Thêm mới Dataset thành công",
            );
        },
        onError: (error: any, variables) => {
            const { isUpdate } = variables;
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    (isUpdate
                        ? "Cập nhật Dataset thất bại"
                        : "Thêm mới Dataset thất bại"),
            );
        },
    });

    const updateDatasetStatusMutation = useMutation({
        mutationFn: (data: { id: string; body: any }) =>
            updateDatasetStatus(orgId, data.id, data.body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["datasets", orgId] });
            toast.success("Cập nhật trạng thái thành công");
        },
        onError: () => {
            toast.error("Cập nhật trạng thái thất bại");
        },
    });

    const refreshEventsMutation = useMutation({
        mutationFn: (data: { datasetId: string; workspaceId: string }) =>
            resetEvents(orgId, data.datasetId, data.workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["datasets", orgId] });
            toast.success("Làm mới giai đoạn thành công");
        },
        onError: () => {
            toast.error("Làm mới giai đoạn thất bại");
        },
    });

    const toggleLeadMutation = useMutation({
        mutationFn: (data: { datasetId: string; isActive: number }) =>
            activateDatasetOnLead(orgId, data.datasetId, {
                isActiveLead: data.isActive,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["datasets", orgId] });
            toast.success("Cập nhật trạng thái thành công");
        },
        onError: () => {
            toast.error("Cập nhật trạng thái thất bại");
        },
    });

    const toggleDealMutation = useMutation({
        mutationFn: (data: { datasetId: string; isActive: number }) =>
            activateDatasetOnDeal(orgId, data.datasetId, {
                isActiveDeal: data.isActive,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["datasets", orgId] });
            toast.success("Cập nhật trạng thái thành công");
        },
        onError: () => {
            toast.error("Cập nhật trạng thái thất bại");
        },
    });

    // States
    const [facebookSyncEnabled, setFacebookSyncEnabled] = useState(true);
    const [googleSyncEnabled, setGoogleSyncEnabled] = useState(false);
    const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
    const [eventMappings, setEventMappings] =
        useState<EventMapping[]>(mockEventMappings);
    const [selectedWorkspace, setSelectedWorkspace] = useState("");
    const [dialogSelectedWorkspaceIds, setDialogSelectedWorkspaceIds] =
        useState<string[]>([]);
    const [crmFields, setCrmFields] = useState<any[]>([]);
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
        new Set(),
    );

    const [mappingType, setMappingType] = useState<"lead" | "deal">("lead");
    const [isLeadSelected, setIsLeadSelected] = useState(false);
    const [isDealSelected, setIsDealSelected] = useState(false);
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
    const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

    const { data: datasetEvents } = useQuery<DatasetEventsResponse>({
        queryKey: ["datasetEvents", orgId],
        queryFn: () =>
            getAllDatasetEvents(orgId) as Promise<DatasetEventsResponse>,
        enabled: !!orgId,
    });

    const toggleWorkspace = (id: string) => {
        const newExpanded = new Set(expandedWorkspaces);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedWorkspaces(newExpanded);
    };

    // Sync API data to local state
    useEffect(() => {
        if (Array.isArray(datasetsData?.content)) {
            const mappedDatasets = datasetsData.content.map((d: any) => ({
                id: d.id,
                organizationId: d.organizationId,
                title: d.title,
                datasetId: d.pixelId,
                accessToken: d.accessToken || "", // API might not return token in list
                status: d.status,
                isActiveLead: d.isActiveLead,
                isActiveDeal: d.isActiveDeal,
                workspaces: d.workspaces || [],
            }));
            setDatasets(mappedDatasets);
        }
    }, [datasetsData]);

    // Load datasets mapping when workspace changes
    // Load datasets mapping when workspace changes - REMOVED or ADAPTED?
    // The previous logic for mappingType === "deal" etc seems less relevant if we are moving to per-dataset configuration in dialog.
    // However, the user might still need this for some "global" view or logic?
    // Wait, the previous code was using mappingType to filter/select datasets.
    // The user's request is specific to the "Cấu hình" (Config) dialog of a dataset.
    // So the previous logic about "selectedDatasetIds" which was for BULK ADDING might need to be kept or ignored if we focus on dialog.
    // But I changed mappingType state. I need to fix the effect dependent on it.
    useEffect(() => {
        const fetchMappedDatasets = async () => {
            // Logic adaptation: if we are in a mode where we need to know what is mapped?
            // Actually, the previous 'mappingType' state was used in the main page flow (maybe for the add dialog initially?).
            // Let's just keep the code compiling by removing mappingType dependency for now or adapting it if it was vital.
            // It seems related to `selectedDatasetIds` which was pushed to createWorkspaceConfig?
            // But now we are using the dialog to configure a single dataset or add one.
            // The old "bulk add" flow might be deprecated/hidden by new UI.
            // I will comment out the effect aimed at global selection to avoid errors with missing mappingType.
        };
        // fetchMappedDatasets();
    }, [selectedWorkspace, datasets, orgId]);

    // Dialog states
    const [isAddDatasetDialogOpen, setIsAddDatasetDialogOpen] = useState(false);
    const [isEventMappingDialogOpen, setIsEventMappingDialogOpen] =
        useState(false);

    // Form states
    const [newDatasetId, setNewDatasetId] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newAccessToken, setNewAccessToken] = useState("");
    const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
    const [selectedCrmEvent, setSelectedCrmEvent] = useState("");
    const [selectedFbEvent, setSelectedFbEvent] = useState("");
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [deleteMappingData, setDeleteMappingData] = useState<{
        id: string;
        datasetId: string;
        workspaceId: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Action State
    const [isBulkActionAlertOpen, setIsBulkActionAlertOpen] = useState(false);
    const [bulkActionData, setBulkActionData] = useState<{
        type: "reset" | "delete_all" | "delete_workspace";
        workspaceId: string;
        datasetId: string;
    } | null>(null);
    const [isBulkActionSubmitting, setIsBulkActionSubmitting] = useState(false);

    // Handlers
    const handleOpenAddDialog = () => {
        setEditingDataset(null);
        setEditingDataset(null);
        setNewDatasetId("");
        setNewTitle("");
        setNewAccessToken("");
        setIsLeadSelected(false);

        setIsDealSelected(false);
        setDialogSelectedWorkspaceIds([]);
        setIsAddDatasetDialogOpen(true);
    };

    const handleOpenEditDialog = (dataset: Dataset) => {
        setEditingDataset(dataset);
        setEditingDataset(dataset);
        setNewDatasetId(dataset.datasetId);
        setNewTitle(dataset.title || "");
        setNewAccessToken(dataset.accessToken);

        // Determine selected types based on existing workspaces
        const hasLead = dataset.workspaces?.some(
            (ws) => ws.category === "LEAD",
        );
        const hasDeal = dataset.workspaces?.some(
            (ws) => ws.category === "DEAL",
        );
        setIsLeadSelected(!!hasLead);
        setIsDealSelected(!!hasDeal);

        // Pre-select workspaces for DEAL
        const dealWorkspaces = Array.from(
            new Set(
                dataset.workspaces
                    ?.filter((ws) => ws.category === "DEAL")
                    .map((ws) => ws.workspaceId) || [],
            ),
        );
        setDialogSelectedWorkspaceIds(dealWorkspaces);

        setIsAddDatasetDialogOpen(true);
    };

    const handleSaveDataset = () => {
        if (newDatasetId && (newAccessToken || editingDataset)) {
            // Auto-activate Deal if workspaces are selected
            const hasWorkspaces = dialogSelectedWorkspaceIds.length > 0;

            const payload: any = {
                title: newTitle,
                pixelId: newDatasetId,
                isActiveLead: isLeadSelected ? 1 : 0,
                isActiveDeal: isDealSelected || hasWorkspaces ? 1 : 0,
                workspaceIds: dialogSelectedWorkspaceIds,
            };

            if (newAccessToken) {
                payload.accessToken = newAccessToken;
            }

            createDatasetMutation.mutate({
                body: payload,
                isUpdate: !!editingDataset,
            });
        }
    };

    const handleDeleteDataset = async (id: string) => {
        try {
            const res = (await deleteDataset(orgId, id)) as any;
            if (res?.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["datasets", orgId],
                });
                toast.success("Xóa dataset thành công");
            } else {
                toast.error(res?.message || "Xóa dataset thất bại");
            }
        } catch (error) {
            console.error("Error deleting dataset:", error);
            toast.error("Có lỗi xảy ra khi xóa dataset");
        }
    };

    const handleAddEventMapping = async () => {
        if (isDealSelected && !selectedWorkspace) {
            toast.error("Vui lòng chọn Workspace");
            return;
        }

        if (selectedDatasetIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một Dataset");
            return;
        }

        try {
            const payload = {
                type: mappingType === "lead" ? "Lead" : "Deal",
                workspaceId:
                    mappingType === "deal" ? selectedWorkspace : undefined,
                datasetIds: selectedDatasetIds,
            };

            const res = (await mappingDatasetEvents(orgId, payload)) as any;

            if (res?.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["datasetEvents", orgId],
                });
                setIsEventMappingDialogOpen(false);
                setSelectedDatasetIds([]);
                setMappingType("lead");
                toast.success("Thêm cấu hình thành công");
            } else {
                console.error("Error creating config:", res?.message);
                toast.error(res?.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Error creating config:", error);
            toast.error("Có lỗi xảy ra");
        }
    };

    const handleWorkspaceChange = async (workspaceId: string) => {
        setSelectedWorkspace(workspaceId);
        if (workspaceId && workspaceId !== "none") {
            try {
                const res = await getStageList(orgId, workspaceId);
                if (res?.code === 0) {
                    setCrmFields(res.content || []);
                } else {
                    setCrmFields([]);
                }
            } catch (error) {
                console.error("Error fetching stages:", error);
                setCrmFields([]);
            }
        } else {
            setCrmFields([]);
        }
    };

    const handleResetEvents = (datasetId: string, workspaceId: string) => {
        refreshEventsMutation.mutate({ datasetId, workspaceId });
    };

    const handleDeleteEventMapping = (
        id: string,
        datasetId: string,
        workspaceId: string,
    ) => {
        setDeleteMappingData({ id, datasetId, workspaceId });
        setIsDeleteAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteMappingData) return;
        setIsDeleting(true);
        try {
            const res = (await deleteEvent(
                orgId,
                deleteMappingData.id,
                deleteMappingData.workspaceId,
                deleteMappingData.datasetId,
            )) as any;
            if (res?.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["datasetEvents", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["datasets", orgId],
                });
                toast.success("Xóa thành công");
                setIsDeleteAlertOpen(false);
            } else {
                toast.error("Có lỗi xảy ra khi xóa");
            }
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAllEvents = (workspaceId: string, datasetId: string) => {
        setBulkActionData({ type: "delete_all", workspaceId, datasetId });

        setIsBulkActionAlertOpen(true);
    };

    const deleteAllEventsMutation = useMutation({
        mutationFn: (data: { datasetId: string; workspaceId: string }) =>
            deleteAllEvents(orgId, data.datasetId, data.workspaceId),
    });

    const deleteWorkspaceMutation = useMutation({
        mutationFn: (data: { datasetId: string; workspaceId: string }) =>
            deleteWorkspaceConfig(orgId, data.datasetId, data.workspaceId),
    });

    const handleDeleteWorkspace = (datasetId: string, workspaceId: string) => {
        setBulkActionData({ type: "delete_workspace", workspaceId, datasetId });
        setIsBulkActionAlertOpen(true);
    };

    const handleConfirmBulkAction = async () => {
        if (!bulkActionData) return;
        setIsBulkActionSubmitting(true);
        try {
            let res: any;
            if (bulkActionData.type === "reset") {
                res = await resetEvents(
                    orgId,
                    bulkActionData.datasetId,
                    bulkActionData.workspaceId,
                );
            } else if (bulkActionData.type === "delete_workspace") {
                res = await deleteWorkspaceMutation.mutateAsync({
                    datasetId: bulkActionData.datasetId,
                    workspaceId: bulkActionData.workspaceId,
                });
            } else {
                res = await deleteAllEventsMutation.mutateAsync({
                    datasetId: bulkActionData.datasetId,
                    workspaceId: bulkActionData.workspaceId,
                });
            }

            if (res?.code === 0 || (res && !res.code)) {
                // Mutation returns response data directly usually
                // Invalidate handled by mutation onSuccess, but reset is handled here manually?
                // Let's rely on mutations for consistency if I refactor both.
                // But for now, I'll just use the new mutation for delete all and keep reset as is or refactor later.
                // Actually, I should use the mutation.mutateAsync to wait for it.
            }

            if (res?.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["datasetEvents", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["datasets", orgId],
                });
                toast.success(
                    bulkActionData.type === "reset"
                        ? "Reset sự kiện thành công"
                        : bulkActionData.type === "delete_workspace"
                          ? "Xóa không gian làm việc thành công"
                          : "Xóa tất cả sự kiện thành công",
                );
                setIsBulkActionAlertOpen(false);
            } else {
                toast.error(
                    bulkActionData.type === "reset"
                        ? "Reset sự kiện thất bại"
                        : bulkActionData.type === "delete_workspace"
                          ? "Xóa không gian làm việc thất bại"
                          : "Xóa tất cả sự kiện thất bại",
                );
            }
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsBulkActionSubmitting(false);
        }
    };

    return (
        <div className="h-full">
            <Glass
                intensity="high"
                className="h-full rounded-2xl overflow-y-auto"
            >
                <div className="w-full py-6 flex flex-col gap-8 px-12">
                    <EventTransferHeader
                        onAddEvent={() => setIsEventMappingDialogOpen(true)}
                    />

                    <div className="flex flex-col gap-6">
                        <DatasetList
                            datasets={datasets}
                            onOpenAddDialog={handleOpenAddDialog}
                            onOpenEditDialog={handleOpenEditDialog}
                            onDeleteDataset={handleDeleteDataset}
                            onUpdateStatus={(id, status) => {
                                updateDatasetStatusMutation.mutate({
                                    id,
                                    body: { status },
                                });
                            }}
                            onDeleteEvent={handleDeleteEventMapping}
                            onResetEvents={handleResetEvents}
                            onToggleLead={(datasetId, currentState) =>
                                toggleLeadMutation.mutate({
                                    datasetId,
                                    isActive: currentState === 1 ? 0 : 1,
                                })
                            }
                            onToggleDeal={(datasetId, currentState) =>
                                toggleDealMutation.mutate({
                                    datasetId,
                                    isActive: currentState === 1 ? 0 : 1,
                                })
                            }
                            onDeleteAllEvents={handleDeleteAllEvents}
                            onDeleteWorkspace={handleDeleteWorkspace}
                        />
                    </div>
                </div>
            </Glass>

            <AddDatasetDialog
                isOpen={isAddDatasetDialogOpen}
                onOpenChange={setIsAddDatasetDialogOpen}
                editingDataset={editingDataset}
                datasetId={newDatasetId}
                accessToken={newAccessToken}
                onDatasetIdChange={setNewDatasetId}
                onAccessTokenChange={setNewAccessToken}
                title={newTitle}
                onTitleChange={setNewTitle}
                isLeadSelected={isLeadSelected}
                isDealSelected={isDealSelected}
                setIsLeadSelected={setIsLeadSelected}
                setIsDealSelected={setIsDealSelected}
                onSave={async () => {
                    handleSaveDataset();
                    if (newDatasetId && newAccessToken) {
                    }
                }}
                selectedWorkspaceIds={dialogSelectedWorkspaceIds}
                handleWorkspaceIdsChange={setDialogSelectedWorkspaceIds}
                handleWorkspaceChange={handleWorkspaceChange}
                mappingType={mappingType}
                setMappingType={setMappingType}
                orgId={orgId}
            />

            {/* Event Mapping Dialog */}
            <EventMappingDialog
                isOpen={isEventMappingDialogOpen}
                onOpenChange={setIsEventMappingDialogOpen}
                mappingType={mappingType}
                setMappingType={setMappingType}
                orgId={orgId}
                selectedWorkspace={selectedWorkspace}
                onWorkspaceChange={handleWorkspaceChange}
                datasets={datasets}
                selectedDatasetIds={selectedDatasetIds}
                setSelectedDatasetIds={setSelectedDatasetIds}
                isLoadingDatasets={isLoadingDatasets}
                onSave={handleAddEventMapping}
            />

            <CustomerAlertDialog
                open={isDeleteAlertOpen}
                setOpen={setIsDeleteAlertOpen}
                title="Xóa sự kiện"
                subtitle="Bạn có chắc chắn muốn xóa sự kiện này không? Hành động này không thể hoàn tác."
                onSubmit={handleConfirmDelete}
                isSubmitting={isDeleting}
                confirmText="Xóa"
            />

            <CustomerAlertDialog
                open={isBulkActionAlertOpen}
                setOpen={setIsBulkActionAlertOpen}
                title={
                    bulkActionData?.type === "reset"
                        ? "Reset sự kiện mặc định"
                        : bulkActionData?.type === "delete_workspace"
                          ? "Xóa không gian làm việc"
                          : "Xóa tất cả sự kiện"
                }
                subtitle={
                    bulkActionData?.type === "reset"
                        ? "Hành động này sẽ khôi phục các sự kiện về trạng thái mặc định. Bạn có chắc chắn muốn tiếp tục?"
                        : bulkActionData?.type === "delete_workspace"
                          ? "Bạn có chắc chắn muốn xóa không gian làm việc này không? Hành động này sẽ xóa tất cả cấu hình liên quan và không thể hoàn tác."
                          : "Bạn có chắc chắn muốn xóa TẤT CẢ sự kiện trong workspace này không? Hành động này không thể hoàn tác."
                }
                onSubmit={handleConfirmBulkAction}
                isSubmitting={isBulkActionSubmitting}
                confirmText={
                    bulkActionData?.type === "reset"
                        ? "Reset"
                        : bulkActionData?.type === "delete_workspace"
                          ? "Xóa Workspace"
                          : "Xóa tất cả"
                }
            />
        </div>
    );
}

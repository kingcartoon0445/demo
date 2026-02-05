"use client";

import { getOrderDetailWithProduct } from "@/api/productV2";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { useDealsFilter } from "@/hooks/deals_data";
import {
    useBusinessProcessStages,
    useBusinessProcessStagesSelector,
    useBusinessProcessTasksByWorkspace,
    useGetTasksAdvanced,
} from "@/hooks/useBusinessProcess";
import {
    useTaskColumnConfig,
    useUpdateTaskColumnConfig,
} from "@/hooks/useConfig";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { StagesSelector } from "@/components/componentsWithHook/StagesSelector";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    useBatchArchiveTask,
    useBatchDeleteTask,
    useBatchMoveStage,
} from "@/hooks/useBusinessProcessDetail";
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumns, DealRow } from "./column";
import DealDetailPanel from "./DealDetailPanel";

// Define our custom Deal type for this component
interface CustomDeal {
    id: string;
    orderId: string;
    title?: string;
    fullName?: string;
    stageName?: string;
    stageId?: string;
    workspaceId?: string;
    workspaceName?: string;
    assignees?: any[];
    orderDetail?: any;
    // Additional properties that might be needed
    stageGroupId?: string;
    stageGroupName?: string;
    createdDate?: string;
    lastModifiedDate?: string;
}

interface DealRowWithOriginal extends DealRow {
    originalDeal?: CustomDeal;
}

// Add types for column configuration
interface ColumnConfig {
    columnKey: string;
    label: string;
    visible: boolean;
    order?: number;
}

export default function DealList({
    orgId,
    workspaceId,
    onStatsUpdate,
}: {
    orgId: string;
    workspaceId?: string;
    onStatsUpdate?: (stats: { totalDeals: number; totalPrice: number }) => void;
}) {
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;
    const [selectedDealItem, setSelectedDealItem] = useState<CustomDeal | null>(
        null
    );
    const [isDealDetailOpen, setIsDealDetailOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState<Record<string, any>>({});
    const [allDealsInCurrentPage, setAllDealsInCurrentPage] = useState<
        CustomDeal[]
    >([]);

    // Filter state
    const { filter } = useDealsFilter();

    // Confirmation dialog states
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Stage change dialog states
    const [showStageChangeDialog, setShowStageChangeDialog] = useState(false);
    const [selectedNewStageId, setSelectedNewStageId] = useState<string>("");
    const [selectedNewStageName, setSelectedNewStageName] =
        useState<string>("");
    const [showStageChangeConfirm, setShowStageChangeConfirm] = useState(false);

    const { data: dealStagesResponse } = useBusinessProcessStagesSelector(
        orgId,
        workspaceId || ""
    );
    const stages = dealStagesResponse?.data || [];
    const stagesMap = stages.reduce(
        (acc: Record<string, string>, stage: any) => {
            if (stage && stage.id) {
                acc[stage.id] = stage.name;
            }
            return acc;
        },
        {}
    );

    // Check if user has applied filters
    const hasFilters = Boolean(filter?.isFilterApplied && filter?.filterBody);

    // Both APIs actually expect 1-indexed pages
    // currentPage is 0-indexed in UI, so convert to 1-indexed for both APIs
    const apiPageNumber = currentPage + 1;

    // Prepare parameters for advanced API call (only when filter is applied)
    const advancedParams = {
        page: apiPageNumber,
        pageSize: pageSize,
        workspaceId: workspaceId || "",

        ...(hasFilters &&
            filter?.filterBody?.startDate && {
                fromDate: filter.filterBody.startDate,
            }),
        ...(hasFilters &&
            filter?.filterBody?.endDate && {
                toDate: filter.filterBody.endDate,
            }),
        ...(hasFilters &&
            filter?.filterBody?.tags &&
            filter.filterBody.tags.length > 0 && {
                tags: filter.filterBody.tags,
            }),
        ...(hasFilters &&
            filter?.filterBody?.assignees &&
            filter.filterBody.assignees.length > 0 && {
                assigneeIds: filter.filterBody.assignees,
            }),
        ...(hasFilters &&
            filter?.filterBody?.status &&
            filter.filterBody.status.length > 0 && {
                statusList: filter.filterBody.status,
            }),
    };

    // Always call both hooks to avoid conditional hook issues
    const standardQuery = useBusinessProcessTasksByWorkspace(orgId, {
        workspaceId: workspaceId || "",
        page: apiPageNumber, // Both APIs expect 1-indexed pages
        pageSize: pageSize,
    });

    const advancedQuery = useGetTasksAdvanced(orgId, advancedParams, {
        enabled: hasFilters,
    });

    // Choose which result to use based on filter application
    const { data: dealsResponse, isLoading } = hasFilters
        ? advancedQuery
        : standardQuery;

    const deals = dealsResponse?.data || [];
    const totalItems = dealsResponse?.pagination?.totalRecords || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Debug pagination

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [filter?.filterBody]);

    // Initialize batch mutation hooks
    const batchArchiveMutation = useBatchArchiveTask(orgId);
    const batchDeleteMutation = useBatchDeleteTask(orgId);
    const batchMoveStageMutation = useBatchMoveStage(orgId);

    const [tableData, setTableData] = useState<DealRowWithOriginal[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Column configuration states
    const [isColumnConfigModalOpen, setIsColumnConfigModalOpen] =
        useState(false);
    const [columnVisibility, setColumnVisibility] = useState<
        Record<string, boolean>
    >({
        name: true,
        stage: true,
        product: true,
        customerName: true,
        orderValue: true,
        assignees: true,
    });
    const [columnLabels, setColumnLabels] = useState<Record<string, string>>({
        name: "Tên giao dịch",
        stage: "Giai đoạn",
        product: "Sản phẩm",
        customerName: "Khách hàng",
        orderValue: "Giá trị đơn hàng",
        assignees: "Người phụ trách",
        tags: "Nhãn",
    });

    // Column configuration hooks
    const { data: taskColumnConfig, isLoading: isColumnConfigLoading } =
        useTaskColumnConfig(orgId);
    const updateTaskColumnConfig = useUpdateTaskColumnConfig(orgId);

    // Update column visibility and labels when taskColumnConfig changes
    useEffect(() => {
        if (
            taskColumnConfig &&
            typeof taskColumnConfig === "object" &&
            "columns" in taskColumnConfig
        ) {
            const visibility: Record<string, boolean> = {};
            const labels: Record<string, string> = {};

            (taskColumnConfig as any).columns.forEach((col: any) => {
                visibility[col.columnKey] = col.visible;
                labels[col.columnKey] = col.label;
            });

            setColumnVisibility(visibility);
            setColumnLabels(labels);
        }
    }, [taskColumnConfig]);

    // Handle column configuration save
    const handleColumnConfigSave = (columns: ColumnConfig[]) => {
        const newVisibility: Record<string, boolean> = {};
        const newLabels: Record<string, string> = {};

        columns.forEach((col) => {
            newVisibility[col.columnKey] = col.visible;
            newLabels[col.columnKey] = col.label;
        });

        setColumnVisibility(newVisibility);
        setColumnLabels(newLabels);

        // Send to API
        const apiColumns = columns.map((col) => ({
            columnKey: col.columnKey,
            label: col.label,
            visible: col.visible,
        }));

        updateTaskColumnConfig.mutate({ columns: apiColumns });
    };

    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (
        updaterOrValue
    ) => {
        if (typeof updaterOrValue === "function") {
            setRowSelection(updaterOrValue);
        } else {
            setRowSelection(updaterOrValue);
        }
    };

    // Fetch order details for a deal
    const fetchOrderDetail = async (orderId: string, dealId: string) => {
        try {
            if (!orderId) {
                return null;
            }

            const response: any = await getOrderDetailWithProduct(
                orgId,
                orderId
            );

            // Đảm bảo response có data
            const orderData = response?.data || response;

            // Lưu với key là dealId để nhất quán
            setOrderDetails((prev) => {
                const updated = {
                    ...prev,
                    [dealId]: orderData,
                };
                return updated;
            });

            return orderData;
        } catch (error) {
            console.error("Error fetching order details:", error);
            return null;
        }
    };

    const handleDealClick = useCallback(
        async (deal: CustomDeal) => {
            const dealStage =
                deal.stageId && stagesMap[deal.stageId]
                    ? stagesMap[deal.stageId]
                    : "";

            // Fetch order details if not already loaded
            if (!orderDetails[deal.id]) {
                const orderData = await fetchOrderDetail(deal.orderId, deal.id);

                const enrichedDeal = {
                    ...deal,
                    stageName: dealStage || deal.stageName,
                    stageId: deal.stageId || "",
                    workspaceId: workspaceId || "",
                    workspaceName: deal.workspaceName || "",
                    orderDetail: orderData,
                };

                setSelectedDealItem(enrichedDeal);
                setIsDealDetailOpen(true);
            } else {
                const enrichedDeal = {
                    ...deal,
                    stageName: dealStage || deal.stageName,
                    stageId: deal.stageId || "",
                    workspaceId: workspaceId || "",
                    workspaceName: deal.workspaceName || "",
                    orderDetail: orderDetails[deal.id],
                };

                setSelectedDealItem(enrichedDeal);
                setIsDealDetailOpen(true);
            }
        },
        [orderDetails, workspaceId, stagesMap]
    );
    // Handle close deal detail
    const handleCloseDealDetail = useCallback(() => {
        setIsDealDetailOpen(false);
        setTimeout(() => setSelectedDealItem(null), 300);
    }, []);

    // Update allDealsInCurrentPage when deals data changes
    useEffect(() => {
        if (deals && deals.length > 0) {
            const formattedDeals = deals.map((deal: any) => ({
                id: deal.id,
                orderId: deal.orderId,
                title: deal.name,
                fullName: deal.customerName,
                stageName: deal.stageName,
                stageId: deal.stageId,
                workspaceId: workspaceId,
                workspaceName: deal.workspaceName,
                assignees: deal.assignedTo,
                orderDetail: orderDetails[deal.id],
            }));
            setAllDealsInCurrentPage(formattedDeals);
        } else {
            setAllDealsInCurrentPage([]);
        }
    }, [deals, workspaceId, orderDetails]);

    // Refresh pipeline data when a deal's stage changes
    const refreshData = () => {
        // Refetch the deals data
        // This will be handled by the React Query cache invalidation
    };

    // Get selected deals - memoized to prevent recalculation
    const selectedRowIds = useMemo(
        () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
        [rowSelection]
    );

    const selectedDeals = useMemo(
        () => tableData.filter((deal) => selectedRowIds.includes(deal.id)),
        [tableData, selectedRowIds]
    );

    const hasSelectedRows = useMemo(
        () => selectedRowIds.length > 0,
        [selectedRowIds]
    );

    // Handle bulk delete
    const handleBulkDelete = useCallback(() => {
        if (!hasSelectedRows) return;
        setShowDeleteConfirm(true);
    }, [hasSelectedRows]);

    // Confirm delete action
    const confirmDelete = useCallback(async () => {
        if (!hasSelectedRows) return;

        try {
            await batchDeleteMutation.mutateAsync({
                taskIds: selectedRowIds,
            });

            // Clear selection after successful delete
            setRowSelection({});
        } catch (error) {
            console.error("Error deleting deals:", error);
        }
    }, [hasSelectedRows, selectedRowIds, batchDeleteMutation]);

    // Handle bulk archive
    const handleBulkArchive = useCallback(() => {
        if (!hasSelectedRows) return;
        setShowArchiveConfirm(true);
    }, [hasSelectedRows]);

    // Confirm archive action
    const confirmArchive = useCallback(async () => {
        if (!hasSelectedRows) return;

        try {
            await batchArchiveMutation.mutateAsync({
                taskIds: selectedRowIds,
            });

            // Clear selection after successful archive
            setRowSelection({});
        } catch (error) {
            console.error("Error archiving deals:", error);
        }
    }, [hasSelectedRows, selectedRowIds, batchArchiveMutation]);

    // Handle bulk stage change
    const handleBulkStageChange = useCallback(() => {
        if (!hasSelectedRows) return;
        setShowStageChangeDialog(true);
    }, [hasSelectedRows]);

    // Handle stage selection
    const handleStageSelect = useCallback(
        (stageId: string, stageName: string) => {
            setSelectedNewStageId(stageId);
            setSelectedNewStageName(stageName);
        },
        []
    );

    // Handle save stage change
    const handleSaveStageChange = useCallback(() => {
        if (!selectedNewStageId) return;
        setShowStageChangeDialog(false);
        setShowStageChangeConfirm(true);
    }, [selectedNewStageId]);

    // Confirm stage change
    const confirmStageChange = useCallback(async () => {
        if (!hasSelectedRows || !selectedNewStageId) return;

        try {
            await batchMoveStageMutation.mutateAsync({
                taskIds: selectedRowIds,
                newStageId: selectedNewStageId,
            });

            // Clear selection and reset stage selection after successful change
            setRowSelection({});
            setSelectedNewStageId("");
            setSelectedNewStageName("");
        } catch (error) {
            console.error("Error changing stage for deals:", error);
        }
    }, [
        hasSelectedRows,
        selectedRowIds,
        selectedNewStageId,
        batchMoveStageMutation,
    ]);

    // Handle cancel stage change
    const handleCancelStageChange = useCallback(() => {
        setShowStageChangeDialog(false);
        setSelectedNewStageId("");
        setSelectedNewStageName("");
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setRowSelection({});
    }, []);

    // Handle deal navigation
    const handleDealChange = useCallback(
        async (newDeal: any) => {
            // Fetch order details for the new deal if not already loaded
            if (!orderDetails[newDeal.id]) {
                await fetchOrderDetail(newDeal.orderId, newDeal.id);
            }

            // Update selected deal with order details
            setSelectedDealItem({
                ...newDeal,
                orderDetail: orderDetails[newDeal.id] || null,
            });
        },
        [orderDetails, fetchOrderDetail]
    );

    // Handle next navigation
    const handleNext = useCallback(async () => {
        if (!selectedDealItem) return;

        const currentIndex = allDealsInCurrentPage.findIndex(
            (d) => d.id === selectedDealItem.id
        );

        if (currentIndex < allDealsInCurrentPage.length - 1) {
            // Navigate to next deal in current page
            const nextDeal = allDealsInCurrentPage[currentIndex + 1];
            await handleDealChange(nextDeal);
        } else if (currentPage < totalPages - 1) {
            // Navigate to first deal of next page
            setCurrentPage((prev) => prev + 1);
            // The new page data will be loaded automatically, then we'll select first deal
            setTimeout(async () => {
                if (allDealsInCurrentPage.length > 0) {
                    const firstDealOfNextPage = allDealsInCurrentPage[0];
                    await handleDealChange(firstDealOfNextPage);
                }
            }, 500); // Wait for page data to load
        }
    }, [
        selectedDealItem,
        allDealsInCurrentPage,
        handleDealChange,
        currentPage,
        totalPages,
    ]);

    // Handle previous navigation
    const handlePrevious = useCallback(async () => {
        if (!selectedDealItem) return;

        const currentIndex = allDealsInCurrentPage.findIndex(
            (d) => d.id === selectedDealItem.id
        );

        if (currentIndex > 0) {
            // Navigate to previous deal in current page
            const previousDeal = allDealsInCurrentPage[currentIndex - 1];
            await handleDealChange(previousDeal);
        } else if (currentPage > 0) {
            // Navigate to last deal of previous page
            setCurrentPage((prev) => prev - 1);
            // The new page data will be loaded automatically, then we'll select last deal
            setTimeout(async () => {
                if (allDealsInCurrentPage.length > 0) {
                    const lastDealOfPrevPage =
                        allDealsInCurrentPage[allDealsInCurrentPage.length - 1];
                    await handleDealChange(lastDealOfPrevPage);
                }
            }, 500); // Wait for page data to load
        }
    }, [
        selectedDealItem,
        allDealsInCurrentPage,
        handleDealChange,
        currentPage,
    ]);

    // Check navigation availability
    const canNavigatePrevious = useMemo(() => {
        if (!selectedDealItem) return false;
        const currentIndex = allDealsInCurrentPage.findIndex(
            (d) => d.id === selectedDealItem.id
        );
        // Can navigate if not first deal in current page, or if there are previous pages
        return currentIndex > 0 || currentPage > 0;
    }, [selectedDealItem, allDealsInCurrentPage, currentPage]);

    const canNavigateNext = useMemo(() => {
        if (!selectedDealItem) return false;
        const currentIndex = allDealsInCurrentPage.findIndex(
            (d) => d.id === selectedDealItem.id
        );
        const hasMoreInCurrent =
            currentIndex < allDealsInCurrentPage.length - 1;
        // Can navigate if not last deal in current page, or if there are next pages
        const hasNextPages = currentPage < totalPages - 1;
        return hasMoreInCurrent || hasNextPages;
    }, [selectedDealItem, allDealsInCurrentPage, currentPage, totalPages]);

    // Create columns - memoized to prevent re-creation
    const columns = useMemo(
        () => createColumns(columnVisibility, columnLabels),
        [columnVisibility, columnLabels]
    );

    // Callback for select all in bulk header
    const handleSelectAllInBulkHeader = useCallback(
        (checked: boolean) => {
            if (checked) {
                // Select all
                const newSelection: any = {};
                tableData.forEach((row) => {
                    newSelection[row.id] = true;
                });
                setRowSelection(newSelection);
            } else {
                // Deselect all
                setRowSelection({});
            }
        },
        [tableData]
    );

    // Custom header content for bulk actions - memoized
    const bulkActionsHeader = useMemo(
        () => (
            <div className="flex items-center justify-between w-full p-2 bg-[#F9F9F9]">
                <div className="flex items-center gap-6">
                    {/* Checkbox select all vẫn hiển thị */}
                    <div className="flex items-center">
                        <Checkbox
                            checked={
                                Object.keys(rowSelection).length ===
                                    tableData.length && tableData.length > 0
                                    ? true
                                    : Object.keys(rowSelection).length > 0
                                    ? "indeterminate"
                                    : false
                            }
                            onCheckedChange={handleSelectAllInBulkHeader}
                            aria-label="Select all"
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkArchive}
                        className="flex items-center gap-2 text-[#532AE7] hover:text-[#532AE7] h-auto font-normal"
                    >
                        <Image
                            src="/icons/archive.svg"
                            alt="archive"
                            width={16}
                            height={16}
                        />
                        Lưu trữ
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkStageChange}
                        className="text-[#532AE7] hover:text-[#532AE7] h-auto font-normal"
                    >
                        <Image
                            src="/icons/sync.svg"
                            alt="refresh"
                            width={16}
                            height={16}
                        />
                        Đổi giai đoạn
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={batchDeleteMutation.isPending}
                        className="flex items-center gap-2 text-[#532AE7] hover:text-[#532AE7] h-auto font-normal"
                    >
                        <Image
                            src="/icons/garbage.svg"
                            alt="trash"
                            width={16}
                            height={16}
                        />
                        {batchDeleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Xóa
                    </Button>
                </div>

                <div className="text-sm text-black font-medium">
                    Chọn: {selectedRowIds.length} giao dịch
                </div>
            </div>
        ),
        [
            rowSelection,
            tableData,
            handleSelectAllInBulkHeader,
            handleBulkArchive,
            handleBulkStageChange,
            handleBulkDelete,
            batchDeleteMutation.isPending,
            selectedRowIds,
        ]
    );

    useEffect(() => {
        let isMounted = true;

        const fetchDetails = async () => {
            if (!deals || deals.length === 0) {
                if (isMounted) {
                    setTableData([]);
                    setLoadingDetails(false);
                }
                return;
            }

            if (isMounted) {
                setLoadingDetails(true);
            }

            try {
                const enrichedDeals = await Promise.all(
                    deals.map(async (deal: any) => {
                        try {
                            const hasValidOrderId =
                                deal?.orderId !== "" &&
                                deal?.orderId !== null &&
                                deal?.orderId !== undefined;

                            if (!hasValidOrderId) {
                                return {
                                    id: deal.id,
                                    name: deal.name,
                                    stage: deal.stageName,
                                    product: "Không có sản phẩm",
                                    customerName: deal.customerName || "",
                                    customerAvatar: undefined,
                                    orderValue: "-",
                                    assignees: deal.assignedTo,
                                    assigneeAvatar: undefined,
                                    tags: deal.tags,
                                    // Store the original deal object for later use
                                    originalDeal: deal,
                                };
                            }
                            const orderInfo = (await getOrderDetailWithProduct(
                                orgId,
                                deal.orderId
                            )) as any;

                            const productNames =
                                orderInfo?.data?.orderDetails
                                    ?.map((od: any) => {
                                        // Try multiple possible property paths
                                        return od.product?.name;
                                    })
                                    .filter(Boolean) || [];

                            const totalValue = orderInfo?.data?.totalPrice
                                ? Number(
                                      orderInfo.data.totalPrice
                                  ).toLocaleString("vi-VN") + " đ"
                                : "-";

                            return {
                                id: deal.id,
                                name: deal.name,
                                stage: deal.stageName,
                                product:
                                    productNames.length > 0
                                        ? productNames.join(", ")
                                        : "Không có sản phẩm",
                                customerName: deal.customerName,
                                customerAvatar: undefined,
                                orderValue: totalValue,
                                assignees: deal.assignedTo,
                                assigneeAvatar: undefined,
                                tags: deal.tags,
                                // Store the original deal object for later use
                                originalDeal: deal,
                            };
                        } catch (error) {
                            // Trả về object fallback khi lỗi
                            return {
                                id: deal.id,
                                name: deal.name,
                                stage: deal.stageName,
                                product: "Không có sản phẩm",
                                customerName: deal.customerName || "",
                                customerAvatar: undefined,
                                orderValue: "-",
                                assignees: deal.assignedTo,
                                assigneeAvatar: undefined,
                                tags: deal.tags,
                                // Store the original deal object for later use
                                originalDeal: deal,
                            };
                        }
                    })
                );

                if (isMounted) {
                    setTableData(enrichedDeals);
                }
            } catch (err) {
                console.error(
                    "❌ Lỗi tổng thể khi fetch danh sách deals:",
                    err
                );
                // Set fallback data on error
                if (isMounted) {
                    const fallbackDeals = deals.map((deal: any) => ({
                        id: deal.id,
                        name: deal.name,
                        stage: deal.stageName,
                        product: "Không có sản phẩm",
                        customerName: deal.customerName || "",
                        customerAvatar: undefined,
                        orderValue: "-",
                        assignees: deal.assignedTo,
                        assigneeAvatar: undefined,
                        tags: deal.tags,
                        originalDeal: deal,
                    }));
                    setTableData(fallbackDeals);
                }
            } finally {
                if (isMounted) {
                    setLoadingDetails(false);
                }
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [deals, orgId]);

    // Calculate stats and update parent - using useMemo to prevent infinite loops
    const currentStats = useMemo(() => {
        // Only calculate when we have actual data to prevent unnecessary updates
        if (!totalItems) return null;

        const totalDeals = totalItems; // Use total from pagination for all filtered results
        const totalPrice = tableData.reduce((sum, deal) => {
            // Extract numeric value from orderValue (e.g., "1,000,000 đ" -> 1000000)
            const value = deal.orderValue;
            if (value && value !== "-") {
                const numericValue = value.replace(/[^\d]/g, "");
                return sum + parseInt(numericValue || "0", 10);
            }
            return sum;
        }, 0);

        return { totalDeals, totalPrice };
    }, [totalItems, tableData]);

    // Update parent with stats when they change - memoized callback to prevent infinite loops
    const memoizedOnStatsUpdate = useCallback(
        (stats: { totalDeals: number; totalPrice: number }) => {
            if (onStatsUpdate) {
                onStatsUpdate(stats);
            }
        },
        [onStatsUpdate]
    );

    // Update parent with stats when they change
    useEffect(() => {
        if (currentStats && memoizedOnStatsUpdate) {
            memoizedOnStatsUpdate(currentStats);
        }
    }, [currentStats, memoizedOnStatsUpdate]);

    const handlePreviousPage = useCallback(() => {
        setCurrentPage((prev) => {
            const newPage = Math.max(0, prev - 1);
            return newPage;
        });
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => {
            const newPage = Math.min(totalPages - 1, prev + 1);
            return newPage;
        });
    }, [totalPages]);

    // Không chặn toàn trang khi loading; chỉ hiển thị spinner trong table

    // Early return nếu có lỗi cơ bản
    if (!orgId) {
        console.error("❌ DealList: Missing orgId");
        return <div className="p-2">Missing orgId parameter</div>;
    }

    if (!workspaceId) {
        console.error("❌ DealList: Missing workspaceId");
        return <div className="p-2">Missing workspaceId parameter</div>;
    }

    return (
        <div className="p-2">
            {/* Settings button */}
            {/* <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsColumnConfigModalOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Settings className="h-4 w-4" />
                    Cấu hình cột
                </Button>
            </div> */}

            <DataTable
                key={`deals-table-${currentPage}`}
                columns={columns}
                data={tableData}
                isLoading={isLoading || loadingDetails}
                enableRowSelection={true}
                rowSelection={rowSelection}
                setRowSelection={handleRowSelectionChange}
                showCustomHeader={hasSelectedRows}
                customHeaderContent={bulkActionsHeader}
                onRowClick={useCallback(
                    (row: DealRowWithOriginal) => {
                        if (row.originalDeal) {
                            handleDealClick(row.originalDeal);
                        }
                    },
                    [handleDealClick]
                )}
            />

            {totalItems > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                        Hiển thị {currentPage * pageSize + 1} đến{" "}
                        {Math.min((currentPage + 1) * pageSize, totalItems)}{" "}
                        trong tổng số {totalItems} giao dịch
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Trước
                            </Button>
                            <div className="text-sm">
                                Trang {currentPage + 1} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage >= totalPages - 1}
                            >
                                Tiếp
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Deal detail panel */}
            {selectedDealItem && (
                <DealDetailPanel
                    workspaceId={workspaceId || ""}
                    deal={selectedDealItem as any}
                    isOpen={isDealDetailOpen}
                    onClose={handleCloseDealDetail}
                    stages={stages.map((stage: any) => ({
                        id: stage.id,
                        name: stage.name,
                        index: stage.index,
                        stageId: stage.id,
                    }))}
                    orgId={orgId}
                    customerId={selectedDealItem.id}
                    onStageChange={refreshData}
                    // Navigation props
                    allDealsInStage={allDealsInCurrentPage as any[]}
                    onDealChange={handleDealChange}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    canNavigatePrevious={canNavigatePrevious}
                    canNavigateNext={canNavigateNext}
                />
            )}

            {/* Archive Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={confirmArchive}
                title="Xác nhận lưu trữ"
                description={`Bạn có chắc chắn muốn lưu trữ ${selectedRowIds.length} giao dịch đã chọn? Các giao dịch sẽ được chuyển vào thư mục lưu trữ.`}
                confirmText="Lưu trữ"
                cancelText="Hủy"
                variant="default"
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Xác nhận xóa"
                description={`Bạn có chắc chắn muốn xóa ${selectedRowIds.length} giao dịch đã chọn? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="destructive"
            />

            {/* Stage Change Dialog */}
            <Dialog
                open={showStageChangeDialog}
                onOpenChange={setShowStageChangeDialog}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Đổi giai đoạn</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="mb-4 text-sm text-gray-600">
                            Chọn giai đoạn mới cho {selectedRowIds.length} giao
                            dịch đã chọn:
                        </div>
                        <StagesSelector
                            orgId={orgId}
                            selectedWorkspace={workspaceId || ""}
                            onStageSelect={handleStageSelect}
                            selectedStageId={selectedNewStageId}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelStageChange}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveStageChange}
                            disabled={!selectedNewStageId}
                        >
                            Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage Change Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showStageChangeConfirm}
                onClose={() => setShowStageChangeConfirm(false)}
                onConfirm={confirmStageChange}
                title="Xác nhận đổi giai đoạn"
                description={`Bạn có chắc chắn muốn chuyển ${selectedRowIds.length} giao dịch đã chọn sang giai đoạn "${selectedNewStageName}"?`}
                confirmText="Xác nhận"
                cancelText="Hủy"
                variant="default"
            />

            {/* Column Configuration Modal */}
            {/* <ColumnConfigModal
                isOpen={isColumnConfigModalOpen}
                onClose={() => setIsColumnConfigModalOpen(false)}
                onSave={handleColumnConfigSave}
                currentConfig={
                    taskColumnConfig &&
                    typeof taskColumnConfig === "object" &&
                    "columns" in taskColumnConfig
                        ? (taskColumnConfig as any).columns.map((col: any) => ({
                              columnKey: col.columnKey,
                              label: col.label,
                              visible: col.visible,
                              order: col.order || 0,
                          }))
                        : Object.keys(columnVisibility).map((key, index) => ({
                              columnKey: key,
                              label: columnLabels[key] || key,
                              visible: columnVisibility[key],
                              order: index,
                          }))
                }
                defaultConfig={[
                    {
                        columnKey: "name",
                        label: "Tên giao dịch",
                        visible: true,
                    },
                    { columnKey: "stage", label: "Giai đoạn", visible: true },
                    { columnKey: "product", label: "Sản phẩm", visible: true },
                    {
                        columnKey: "customerName",
                        label: "Khách hàng",
                        visible: true,
                    },
                    {
                        columnKey: "orderValue",
                        label: "Giá trị đơn hàng",
                        visible: true,
                    },
                    {
                        columnKey: "assignees",
                        label: "Người phụ trách",
                        visible: true,
                    },
                    { columnKey: "tags", label: "Nhãn", visible: false },
                ]}
            /> */}
        </div>
    );
}

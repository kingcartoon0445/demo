"use client";
import {
    batchCreateStage,
    batchDeleteStage,
    batchUpdateStageName,
    createBusinessProcessWos,
    getTasksAdvanced,
    moveBusinessProcessTask,
} from "@/api/businessProcess";
import { getOrderDetailWithProduct } from "@/api/productV2";
import Loading from "@/components/common/Loading";
import AddNewDealModal from "@/components/deals/AddNewDealModal";
import DealDetailPanel from "@/components/deals/DealDetailPanel";
import { DealHeader } from "@/components/deals/DealHeader";
import DealList from "@/components/deals/DealList";

import { createWorkspace } from "@/api/org";
import { DeleteStageDialog } from "@/components/deals/DeleteStageDialog";
import { KanbanColumn } from "@/components/deals/KanbanColumn";
import { useLanguage } from "@/contexts/LanguageContext";
import { batchUpdateStageColor } from "@/api/businessProcess";
import { useDealsFilter } from "@/hooks/deals_data";
import {
    useBusinessProcess,
    useDeleteBusinessProcessStage,
    useUpdateBusinessProcessStageIndex,
} from "@/hooks/useBusinessProcess";
import { useUpdateStage as useUpdateDealStage } from "@/hooks/useCustomerV2";
import { useWorkspaceList } from "@/hooks/useOrganizations";
import { getWorkspaceList } from "@/api/workspace";
import {
    BuinessProcessTask,
    BusinessProcess,
    BusinessProcessStage,
} from "@/interfaces/businessProcess";
import { WorkspaceListItem } from "@/lib/interface";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

interface DealCardProps {
    id: string;
    title: string;
    customer: string;
    username: string;
    email: string;
    phone: string;
    totalCalls: number;
    totalNotes: number;
    totalReminders: number;
    totalAttachments: number;
    lastModifiedDate: string;
    stageId?: string;
    stageName?: string;
    dealValue?: number;
    workspaceId?: string;
    workspaceName?: string;
    assignees?: string[];
    onClick?: (deal: Deal) => void;
}

export interface Deal extends DealCardProps {
    id: string;
    customerId: string;
    leadId: string;
    username: string;
    email: string;
    phone: string;
    orderId: string;
    avatar?: string;
    stage?: string;
    stageId?: string;
    stageName?: string;
    stageGroupId?: string;
    stageGroupName?: string;
    createdDate?: string;
    fullName?: string; // Add fullName to match usage in component
    orderDetail?: any; // Add orderDetail field to store API response
    activity?: {
        id: string;
        taskId: string;
        totalCalls: number;
        totalNotes: number;
        totalReminders: number;
        totalAttachments: number;
    };
}

export interface PipelineColumn {
    id: string; // Using stageId for UI operations
    apiId: string; // Using the actual id for API operations
    title: string;
    budget: string;
    deals: Deal[];
    totalDeals?: number;
    color?: string;
}

export default function DealsPage() {
    const { t } = useLanguage();
    const [pipeline, setPipeline] = useState<PipelineColumn[]>([]);
    const [originalPipeline, setOriginalPipeline] = useState<PipelineColumn[]>(
        [],
    );
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

    // Reset filtered stats when switching to kanban view
    useEffect(() => {
        if (viewMode === "kanban") {
            setFilteredStats(null);
        }
    }, [viewMode]);

    // Memoized callback for updating stats from DealList
    const handleStatsUpdate = useCallback(
        (stats: { totalDeals: number; totalPrice: number }) => {
            setFilteredStats(stats);
        },
        [],
    );
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingColumn, setEditingColumn] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [isDealDetailOpen, setIsDealDetailOpen] = useState(false);
    const [allDealsInStage, setAllDealsInStage] = useState<Deal[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [isCreatingProcess, setIsCreatingProcess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [orderDetails, setOrderDetails] = useState<Record<string, any>>({});
    const [dealValues, setDealValues] = useState<Record<string, number>>({});
    const [isAddNewDealOpen, setIsAddNewDealOpen] = useState(false);
    const hasInitializedWorkspaceRef = useRef(false);

    // State for filtered stats from DealList
    const [filteredStats, setFilteredStats] = useState<{
        totalDeals: number;
        totalPrice: number;
    } | null>(null);
    // Tổng tiền theo từng stage từ getTasksAdvanced
    const [stageTotalPrices, setStageTotalPrices] = useState<
        Record<string, number>
    >({});
    // Delete stage dialog states
    const [deleteStageDialogOpen, setDeleteStageDialogOpen] = useState(false);
    const [stageToDelete, setStageToDelete] = useState<{
        id: string;
        title: string;
    } | null>(null);
    // Pagination states
    const [paginationState, setPaginationState] = useState<
        Record<
            string,
            {
                offset: number;
                hasMore: boolean;
                isLoading: boolean;
                totalItems: number;
                loadedItems: number;
                initialLoading?: boolean; // Thêm trạng thái loading ban đầu cho từng stage (optional)
            }
        >
    >({});

    // Thêm state để theo dõi các thay đổi trong edit mode
    const [pendingChanges, setPendingChanges] = useState<{
        renamedStages: Record<string, string>; // stageId -> newName
        addedStages: PipelineColumn[]; // Các stage mới được thêm
        deletedStages: Array<{
            stageId: string;
            moveToStageId?: string; // Stage để di chuyển deals đến (deprecated, dùng targetId)
            targetId?: string | null; // Stage để di chuyển deals đến (null nếu delete_tasks)
            action: "delete_tasks" | "move_tasks"; // Hành động với deals
        }>; // Các stageId đã bị xóa
        reorderedStages: string[]; // Thứ tự mới của các stage
        hasReordered: boolean; // Flag để biết có thay đổi thứ tự không
        tempToRealIdMapping: Record<string, string>; // tempId -> realId mapping
        updatedColors: Record<string, string>; // stageId -> color hex
    }>({
        renamedStages: {},
        addedStages: [],
        deletedStages: [],
        reorderedStages: [],
        hasReordered: false,
        tempToRealIdMapping: {},
        updatedColors: {},
    });

    const { orgId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const widParam = searchParams.get("wid");
    const oidParam = searchParams.get("oid");
    const tidParam = searchParams.get("tid");
    const orderDetailsRef = useRef<Record<string, any>>({});
    const queryClient = useQueryClient();
    // Guard to prevent repeatedly opening the same cid
    const openedCidRef = useRef<string | null>(null);

    // Global filter shared with DealList (used for Kanban too)
    const { filter } = useDealsFilter();
    const hasFilters = Boolean(filter?.isFilterApplied && filter?.filterBody);

    const buildAdvancedParams = (
        overrides: Partial<{
            page: number;
            pageSize: number;
            stageId: string;
            workspaceId: string;
            taskStatus: number | undefined;
        }>,
    ) => {
        let params: any = {
            page: overrides.page ?? 1,
            pageSize: overrides.pageSize ?? 10,
            workspaceId: overrides.workspaceId ?? selectedWorkspace,
            stageId: overrides.stageId,
        };

        if (hasFilters && filter?.filterBody) {
            const body: any = filter.filterBody;
            if (body.startDate) params.fromDate = body.startDate;
            if (body.endDate) params.toDate = body.endDate;
            if (Array.isArray(body.tags) && body.tags.length > 0)
                params.tags = body.tags;
            if (Array.isArray(body.assignees) && body.assignees.length > 0)
                params.assigneeIds = body.assignees;
            if (Array.isArray(body.status) && body.status.length > 0)
                params.statusList = body.status;
        }

        // Nếu filterBody không có status hoặc status rỗng, và có taskStatus thì dùng taskStatus
        if (!params.statusList && overrides.taskStatus != undefined) {
            params.statusList = [overrides.taskStatus];
        }
        return params;
    };

    // Lấy danh sách workspace roles của người dùng
    const { data: workspacesResponse } = useWorkspaceList(orgId as string);

    const workspaces: WorkspaceListItem[] = workspacesResponse?.content || [];

    // Fetch order details for a deal when selected
    const fetchOrderDetail = useCallback(
        async (orderId: string, dealId: string) => {
            try {
                if (!orderId) {
                    return null;
                }

                const response: any = await getOrderDetailWithProduct(
                    orgId as string,
                    orderId,
                );

                // Đảm bảo response có data
                const orderData = response?.data || response;

                // Update both the state and the ref
                setOrderDetails((prev) => {
                    const updated = {
                        ...prev,
                        [dealId]: orderData,
                    };
                    orderDetailsRef.current = updated;
                    return updated;
                });

                // Cập nhật giá trị deal
                if (
                    orderData &&
                    typeof orderData === "object" &&
                    "totalPrice" in orderData
                ) {
                    const price = orderData.totalPrice as number;
                    setDealValues((prev) => ({
                        ...prev,
                        [dealId]: price,
                    }));
                }

                return orderData;
            } catch (error) {
                console.error("Error fetching order details:", error);
                return null;
            }
        },
        [orgId],
    );

    // Define handleDealClick function with useCallback before it's used in useEffect
    const handleDealClick = useCallback(
        async (deal: Deal) => {
            if (!isEditMode) {
                // Check ref instead of state to avoid circular dependency
                if (!orderDetailsRef.current[deal.id]) {
                    await fetchOrderDetail(deal.orderId, deal.id);
                }
                setSelectedDeal({
                    ...deal,
                    stageName: deal.stageName,
                    username: deal.username,
                    email: deal.email,
                    phone: deal.phone,
                    // Ensure all required properties are present
                    stageId: deal.stageId || "",
                    workspaceId: selectedWorkspace,
                    workspaceName: deal.workspaceName,
                    // Add order details if available
                    orderDetail: orderDetailsRef.current[deal.id] || null,
                } as Deal);
                setIsDealDetailOpen(true);
            }
        },
        [isEditMode, fetchOrderDetail, selectedWorkspace],
    );

    // Sync selected workspace from wid query param if present
    useEffect(() => {
        if (workspaces.length > 0 && widParam) {
            const isValid = workspaces.some((w) => w.id === widParam);
            if (isValid) {
                if (selectedWorkspace !== widParam) {
                    setSelectedWorkspace(widParam);
                    hasInitializedWorkspaceRef.current = true;
                }
            } else {
                // Invalid wid, select the first workspace
                const firstId = workspaces[0].id;
                if (selectedWorkspace !== firstId) {
                    setSelectedWorkspace(firstId);
                    hasInitializedWorkspaceRef.current = true;
                    // Update URL
                    const url = new URL(window.location.href);
                    url.searchParams.set("wid", firstId);
                    router.replace(
                        `${url.pathname}?${url.searchParams.toString()}`,
                    );
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widParam, workspaces]);

    // Initialize selected workspace from localStorage if no wid param
    useEffect(() => {
        if (!orgId) return;
        if (!workspaces || workspaces.length === 0) return;

        const storageKey = `deals:lastWid:${orgId}`;

        // If wid is present in URL, persist it
        if (widParam) {
            try {
                localStorage.setItem(storageKey, widParam);
            } catch {}
            hasInitializedWorkspaceRef.current = true;
            return;
        }

        // Otherwise, try to load last workspace from storage
        try {
            const lastWid = localStorage.getItem(storageKey);
            if (
                lastWid &&
                lastWid !== selectedWorkspace &&
                workspaces.some((w) => w.id === lastWid)
            ) {
                setSelectedWorkspace(lastWid);
                hasInitializedWorkspaceRef.current = true;
                // Update URL to include wid for shareable state
                const url = new URL(window.location.href);
                url.searchParams.set("wid", lastWid);
                router.replace(
                    `${url.pathname}?${url.searchParams.toString()}`,
                );
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, workspaces]);

    // Persist selected workspace changes to localStorage and URL
    useEffect(() => {
        if (!orgId) return;
        if (!selectedWorkspace) return;

        const storageKey = `deals:lastWid:${orgId}`;
        try {
            localStorage.setItem(storageKey, selectedWorkspace);
        } catch {}

        if (widParam !== selectedWorkspace) {
            const url = new URL(window.location.href);
            url.searchParams.set("wid", selectedWorkspace);
            router.replace(`${url.pathname}?${url.searchParams.toString()}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWorkspace, orgId]);

    // Auto-select first workspace when workspaces are loaded
    useEffect(() => {
        if (
            workspaces.length > 0 &&
            !selectedWorkspace &&
            !hasInitializedWorkspaceRef.current
        ) {
            setSelectedWorkspace(workspaces[0].id);
        }
    }, [workspaces, selectedWorkspace]);

    // Open deal detail panel if oid (orderId) or tid (task/deal id) parameter is present in URL
    useEffect(() => {
        const findAndOpenDeal = async () => {
            const hasAnyParam = Boolean(oidParam || tidParam);
            if (!hasAnyParam || pipeline.length === 0 || !selectedWorkspace) {
                return;
            }
            // Build a unique key for the currently requested target to avoid reopening
            const targetKey = tidParam ? `tid:${tidParam}` : `oid:${oidParam}`;
            if (openedCidRef.current === targetKey) {
                return;
            }

            if (pipeline.length > 0 && selectedWorkspace) {
                // Find the deal in all columns
                const allDeals = pipeline.flatMap((col) => col.deals);
                const dealToOpen = tidParam
                    ? allDeals.find((deal) => deal.id === tidParam)
                    : allDeals.find((deal) => deal.orderId === oidParam);

                if (dealToOpen) {
                    await handleDealClick(dealToOpen);
                    openedCidRef.current = targetKey;
                } else {
                    // If the deal is not in the currently loaded deals, we need to fetch it
                    try {
                        // Find the deal in any stage that matches the cid
                        for (const stage of pipeline) {
                            const response = await getTasksAdvanced(
                                orgId as string,
                                buildAdvancedParams({
                                    stageId: stage.id,
                                    page: 1,
                                    pageSize: 10,
                                    workspaceId: selectedWorkspace,
                                    taskStatus: 1,
                                }),
                            );

                            const deals = (response?.data ||
                                []) as unknown as Deal[];
                            const matched = tidParam
                                ? deals.find((d) => d.id === tidParam)
                                : deals.find((d) => d.orderId === oidParam);
                            if (matched) {
                                await fetchOrderDetail(
                                    matched.orderId,
                                    matched.id,
                                );
                                await handleDealClick(matched);
                                openedCidRef.current = targetKey;
                                break;
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching deal by ID:", error);
                    }
                }
            }
        };

        findAndOpenDeal();
    }, [
        oidParam,
        tidParam,
        pipeline,
        selectedWorkspace,
        orgId,
        handleDealClick,
        fetchOrderDetail,
    ]);
    const {
        data: businessProcessResponse,
        isLoading: isLoadingBusinessProcess,
    } = useBusinessProcess(orgId as string, selectedWorkspace);

    const businessProcess = useMemo(() => {
        return businessProcessResponse?.data as BusinessProcess[] | undefined;
    }, [businessProcessResponse]);

    // Reset pipeline stages when business process changes (workspace change)
    useEffect(() => {
        if (
            businessProcessResponse &&
            Array.isArray(businessProcessResponse.data)
        ) {
            // If the response is empty array, reset pipeline stages
            if (businessProcessResponse.data.length === 0) {
                setPipelineStages([]);
                setPaginationState({});
                setOrderDetails({});
                setDealValues({});
                setSelectedDeal(null);
                setAllDealsInStage([]);
                setPipeline([]);
                setOriginalPipeline([]);
                setFilteredStats(null);
                // Reset refs
                orderDetailsRef.current = {};
                openedCidRef.current = null;
            }
        }
    }, [businessProcessResponse]);

    const stages = useMemo(() => {
        return (businessProcess?.[0]?.processStages ??
            []) as BusinessProcessStage[];
    }, [businessProcess]);
    const hasNoStages = (stages?.length ?? 0) === 0;

    const stagesName = stages.map((stage) => {
        return {
            id: stage.id,
            name: stage.name,
            index: stage.orderIndex,
            stageId: stage.id,
        };
    });
    const [pipelineStages, setPipelineStages] = useState<
        {
            id: string;
            apiId: string;
            title: string;
            deals: BuinessProcessTask[];
            totalDeals?: number;
            isLoading?: boolean;
        }[]
    >([]);

    // State để lưu tổng totalRecords từ tất cả các stage
    const [totalRecordsFromStages, setTotalRecordsFromStages] =
        useState<number>(0);
    useEffect(() => {
        const fetchPipelineStages = async () => {
            if (!stages.length || !selectedWorkspace || !orgId) return;

            // Khởi tạo trạng thái loading cho từng stage
            const initialPaginationState = stages.reduce(
                (acc, group) => {
                    acc[group.id] = {
                        offset: 0,
                        hasMore: true,
                        isLoading: false,
                        initialLoading: true, // Bắt đầu với trạng thái loading
                        totalItems: 0,
                        loadedItems: 0,
                    };
                    return acc;
                },
                {} as Record<
                    string,
                    {
                        offset: number;
                        hasMore: boolean;
                        isLoading: boolean;
                        initialLoading: boolean;
                        totalItems: number;
                        loadedItems: number;
                    }
                >,
            );

            // Cập nhật trạng thái loading ban đầu
            setPaginationState(initialPaginationState);

            // Tạo một mảng rỗng cho các stages
            const initialStages = stages.map((group) => ({
                id: group.id,
                apiId: group.id,
                title: group.name,
                deals: [] as BuinessProcessTask[],
                totalDeals: 0,
                isLoading: true,
                color: group.color,
            }));

            // Hiển thị các stages trước, sau đó sẽ cập nhật dữ liệu
            setPipelineStages(initialStages);

            // Chia thành các batch, mỗi batch có tối đa 3 stages
            const BATCH_SIZE = 3;
            const stageBatches: BusinessProcessStage[][] = [];

            // Chia stages thành các batch nhỏ
            for (let i = 0; i < stages.length; i += BATCH_SIZE) {
                stageBatches.push(stages.slice(i, i + BATCH_SIZE));
            }

            // Hàm tải dữ liệu cho một stage
            const loadStageData = async (group: BusinessProcessStage) => {
                try {
                    const dealResponse = await getTasksAdvanced(
                        orgId as string,
                        buildAdvancedParams({
                            stageId: group.id,
                            page: 1,
                            pageSize: 10,
                            workspaceId: selectedWorkspace,
                            taskStatus: 1,
                        }),
                    );

                    const deals = dealResponse?.data;
                    // Cập nhật tổng tiền cho stage
                    const groupTotalPrice =
                        (dealResponse as any)?.totalPrice || 0;
                    setStageTotalPrices((prev) => ({
                        ...prev,
                        [group.id]: groupTotalPrice,
                    }));

                    // Lấy tổng số deals từ metadata.total hoặc pagination
                    const totalDeals =
                        dealResponse?.pagination?.totalRecords || deals.length;

                    // Kiểm tra xem có thêm deals để tải không
                    const hasMore = deals.length < totalDeals;

                    // Cập nhật pagination state cho stage này
                    setPaginationState((prev) => ({
                        ...prev,
                        [group.id]: {
                            offset: 0,
                            hasMore: hasMore,
                            isLoading: false,
                            initialLoading: false, // Đã tải xong
                            totalItems: totalDeals,
                            loadedItems: deals.length,
                        },
                    }));

                    // Cập nhật stage trong pipeline
                    setPipelineStages((prevStages) => {
                        const updatedStages = prevStages.map((stage) =>
                            stage.id === group.id
                                ? {
                                      ...stage,
                                      deals: deals as BuinessProcessTask[],
                                      totalDeals: totalDeals,
                                      isLoading: false,
                                  }
                                : stage,
                        );

                        // Tính tổng totalRecords từ tất cả các stage
                        const totalRecords = updatedStages.reduce(
                            (sum, stage) => {
                                return sum + (stage.totalDeals || 0);
                            },
                            0,
                        );

                        // Cập nhật tổng totalRecords
                        setTotalRecordsFromStages(totalRecords);

                        return updatedStages;
                    });

                    return { success: true, stageId: group.id };
                } catch (err) {
                    console.error(
                        `Error fetching deals for stageGroup ${group.id}`,
                        err,
                    );

                    // Cập nhật trạng thái lỗi
                    setPaginationState((prev) => ({
                        ...prev,
                        [group.id]: {
                            ...prev[group.id],
                            isLoading: false,
                            initialLoading: false,
                        },
                    }));

                    // Cập nhật stage với trạng thái lỗi
                    setPipelineStages((prevStages) => {
                        const updatedStages = prevStages.map((stage) =>
                            stage.id === group.id
                                ? {
                                      ...stage,
                                      isLoading: false,
                                  }
                                : stage,
                        );

                        // Tính tổng totalRecords từ tất cả các stage (kể cả khi có lỗi)
                        const totalRecords = updatedStages.reduce(
                            (sum, stage) => {
                                return sum + (stage.totalDeals || 0);
                            },
                            0,
                        );

                        // Cập nhật tổng totalRecords
                        setTotalRecordsFromStages(totalRecords);

                        return updatedStages;
                    });

                    return {
                        success: false,
                        stageId: group.id,
                        error: err,
                    };
                }
            };

            // Tải dữ liệu theo batch, chờ batch hiện tại hoàn thành mới tải batch tiếp theo
            const loadBatchesSequentially = async () => {
                for (
                    let batchIndex = 0;
                    batchIndex < stageBatches.length;
                    batchIndex++
                ) {
                    const batch = stageBatches[batchIndex];

                    // Tải đồng thời các stage trong cùng một batch
                    await Promise.all(
                        batch.map((group: BusinessProcessStage) =>
                            loadStageData(group),
                        ),
                    );
                }
            };

            // Bắt đầu tải dữ liệu theo batch
            loadBatchesSequentially();
        };

        fetchPipelineStages();
    }, [stages, selectedWorkspace, orgId, hasFilters, filter?.filterBody]);

    // Function to load more deals for a specific column
    const loadMoreDeals = async (columnId: string) => {
        // If already loading or no more deals, return
        if (
            !paginationState[columnId] ||
            paginationState[columnId].isLoading ||
            !paginationState[columnId].hasMore
        ) {
            return;
        }

        // Set loading state
        setPaginationState((prev) => ({
            ...prev,
            [columnId]: {
                ...prev[columnId],
                isLoading: true,
                initialLoading: false,
            },
        }));

        try {
            const currentOffset = paginationState[columnId].offset;
            const newOffset = currentOffset + 10; // Tăng offset thêm 10 (bằng với limit)
            const pageToFetch = Math.floor(newOffset / 10) + 1; // Bắt đầu từ page 1 cho offset 0, page 2 cho offset 10

            const dealResponse = await getTasksAdvanced(
                orgId as string,
                buildAdvancedParams({
                    stageId: columnId,
                    page: pageToFetch,
                    pageSize: 10,
                    workspaceId: selectedWorkspace,
                    taskStatus: 1,
                }),
            );

            const newDeals = dealResponse?.data;

            // Lấy tổng số deals từ metadata.total
            const totalDeals =
                dealResponse?.pagination?.totalRecords ||
                paginationState[columnId]?.totalItems ||
                0;

            // Update pipeline with new deals (avoid duplicates)
            setPipelineStages((prev) =>
                prev.map((stage) => {
                    if (stage.id === columnId) {
                        // Avoid duplicates by checking existing deal IDs
                        const existingIds = stage.deals.map((d) => d.id);
                        const uniqueNewDeals = newDeals.filter(
                            (deal) => !existingIds.includes(deal.id),
                        );

                        return {
                            ...stage,
                            deals: [
                                ...stage.deals,
                                ...uniqueNewDeals,
                            ] as BuinessProcessTask[],
                            totalDeals: totalDeals,
                        };
                    }
                    return stage;
                }),
            );

            const currentLoaded = paginationState[columnId]?.loadedItems || 0;
            const newTotalLoaded = currentLoaded + newDeals.length;

            // Kiểm tra xem đã tải hết deals chưa
            const hasMore = newTotalLoaded < totalDeals;

            // Update pagination state
            setPaginationState((prev) => ({
                ...prev,
                [columnId]: {
                    ...prev[columnId],
                    offset: newOffset,
                    hasMore: hasMore,
                    isLoading: false,
                    initialLoading: false,
                    totalItems: totalDeals,
                    loadedItems: newTotalLoaded,
                },
            }));

            // Cập nhật tổng tiền cho stage khi tải thêm (sử dụng tổng từ API, không cộng dồn)
            const stageAggregateTotalPrice = (dealResponse as any)?.totalPrice;
            setStageTotalPrices((prev) => ({
                ...prev,
                [columnId]:
                    typeof stageAggregateTotalPrice === "number"
                        ? stageAggregateTotalPrice
                        : prev[columnId] || 0,
            }));

            // Fetch order details for new deals
            newDeals.forEach((deal: BuinessProcessTask) => {
                if (deal && deal.id) {
                    fetchOrderDetail(deal.orderId, deal.id);
                }
            });
        } catch (error) {
            console.error(
                `Error loading more deals for column ${columnId}:`,
                error,
            );

            // Reset loading state on error
            setPaginationState((prev) => ({
                ...prev,
                [columnId]: {
                    ...prev[columnId],
                    isLoading: false,
                },
            }));
        }
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Fetch all order details for initial load
    useEffect(() => {
        // Chỉ fetch khi tất cả các stage đã load xong
        const allLoaded =
            pipelineStages.length > 0 &&
            pipelineStages.every((stage) => !stage.isLoading);
        if (!allLoaded) return;

        const fetchAllOrderDetails = async () => {
            const allDeals = pipelineStages.flatMap((stage) => stage.deals);
            const dealIds = allDeals.map((deal) => {
                return {
                    orderId: deal.orderId,
                    dealId: deal.id,
                };
            });

            // Fetch in batches to avoid too many concurrent requests
            const batchSize = 5;
            for (let i = 0; i < dealIds.length; i += batchSize) {
                const batch = dealIds.slice(i, i + batchSize);
                await Promise.all(
                    batch.map((deal) =>
                        fetchOrderDetail(deal.orderId, deal.dealId),
                    ),
                );
            }
        };

        fetchAllOrderDetails();
    }, [pipelineStages, orgId]);

    // Update allDealsInStage when selectedDeal or pipelineStages changes
    useEffect(() => {
        if (selectedDeal?.stageId && pipelineStages.length > 0) {
            const currentStage = pipelineStages.find(
                (stage) => stage.id === selectedDeal.stageId,
            );
            if (currentStage) {
                // Convert BuinessProcessTask to Deal format for navigation
                const dealsInStage = currentStage.deals.map((task) => ({
                    id: task.id,
                    title: task.name || "Không có tiêu đề",
                    customer: task.customerInfo?.fullName || "Không có tên",
                    username: task.username || "",
                    email: task.email || "",
                    phone: task.phone || "",
                    customerId: task.customerId,
                    orderId: task.orderId,
                    totalCalls: task.activity?.totalCalls || 0,
                    totalNotes: task.activity?.totalNotes || 0,
                    totalReminders: task.activity?.totalReminders || 0,
                    totalAttachments: task.activity?.totalAttachments || 0,
                    lastModifiedDate: task.updatedDate || "",
                    stageId: task.stageId,
                    stageName: currentStage.title,
                    dealValue: dealValues[task.id] || 0,
                    workspaceId: selectedWorkspace,
                    workspaceName: "",
                    assignees: task.assignedTo?.map((a) => a.id) || [],
                    avatar: task.customerInfo?.avatar || "",
                    stage: currentStage.title,
                    stageGroupId: "",
                    stageGroupName: "",
                    createdDate: task.createdDate,
                    fullName: task.customerInfo?.fullName || "",
                    orderDetail: orderDetails[task.id] || null,
                })) as Deal[];

                // Only update if the deals array actually changed
                setAllDealsInStage((prevDeals) => {
                    const prevIds = prevDeals.map((d) => d.id);
                    const newIds = dealsInStage.map((d) => d.id);

                    if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
                        return dealsInStage;
                    }
                    return prevDeals;
                });
            }
        } else {
            setAllDealsInStage([]);
        }
    }, [
        selectedDeal?.stageId,
        pipelineStages,
        dealValues,
        selectedWorkspace,
        orderDetails,
    ]);

    // Function to refresh pipeline data when a deal's stage changes
    const refreshSingleStageData = async (stageId: string) => {
        if (!stages.length || !selectedWorkspace || !orgId) {
            return;
        }

        try {
            // Tìm giai đoạn cần cập nhật
            const stageToUpdate = stages.find((stage) => stage.id === stageId);
            if (!stageToUpdate) {
                return;
            }

            const dealResponse = await getTasksAdvanced(
                orgId as string,
                buildAdvancedParams({
                    stageId: stageId,
                    page: 1,
                    pageSize: 10,
                    workspaceId: selectedWorkspace,
                    taskStatus: 1,
                }),
            );
            const deals = dealResponse?.data;
            // Làm mới tổng tiền cho stage được refresh
            const stageTotalPrice = (dealResponse as any)?.totalPrice || 0;
            setStageTotalPrices((prev) => ({
                ...prev,
                [stageId]: stageTotalPrice,
            }));

            // Lấy tổng số deals từ metadata.total
            const totalDeals = dealResponse.pagination?.totalRecords || 0;

            // Kiểm tra xem có thêm deals để tải không
            const hasMore = deals.length < totalDeals;

            // Cập nhật pagination state cho giai đoạn cụ thể
            setPaginationState((prev) => ({
                ...prev,
                [stageId]: {
                    offset: 0,
                    hasMore: hasMore,
                    isLoading: false,
                    initialLoading: false,
                    totalItems: totalDeals,
                    loadedItems: deals.length,
                },
            }));

            const updatedStage = {
                id: stageToUpdate.id,
                apiId: stageToUpdate.id,
                title: stageToUpdate.name,
                deals: deals as BuinessProcessTask[],
                totalDeals: totalDeals,
            };

            // Cập nhật pipeline stages chỉ cho giai đoạn cụ thể
            setPipelineStages((prevStages) => {
                const updatedStages = prevStages.map((stage) => {
                    if (stage.id === stageId) {
                        return updatedStage;
                    }
                    return stage;
                });
                return updatedStages;
            });

            // Nếu đang mở DealDetailPanel, cập nhật lại thông tin stage của deal đang được chọn
            if (selectedDeal && isDealDetailOpen) {
                const updatedDeal = updatedStage.deals.find(
                    (deal) => deal.id === selectedDeal.id,
                );

                if (updatedDeal) {
                    // Giữ nguyên trạng thái hiện tại của selectedDeal nhưng cập nhật thông tin stage
                    setSelectedDeal((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            stageId: updatedDeal.stageId || prev.stageId,
                            stageName:
                                stages.find((s) => s.id === updatedDeal.stageId)
                                    ?.name ||
                                prev.stageName ||
                                "",
                        };
                    });
                }
            }
        } catch (error) {
            console.error(`Error refreshing data for stage ${stageId}:`, error);
        }
    };

    const refreshPipelineData = async (stageUpdateInfo?: {
        oldStageId?: string;
        newStageId?: string;
    }) => {
        if (!stages.length || !selectedWorkspace || !orgId) return;

        try {
            // Xác định các giai đoạn cần cập nhật
            let stagesToUpdate: BusinessProcessStage[] = [];

            if (stageUpdateInfo) {
                // Nếu có thông tin về giai đoạn cũ và mới, chỉ cập nhật những giai đoạn đó
                stagesToUpdate = stages.filter(
                    (stage) =>
                        stage.id === stageUpdateInfo.oldStageId ||
                        stage.id === stageUpdateInfo.newStageId,
                );
            } else {
                // Nếu không có thông tin cụ thể, cập nhật tất cả các giai đoạn
                stagesToUpdate = stages;
            }

            const results = await Promise.all(
                stagesToUpdate.map(async (group) => {
                    try {
                        const dealResponse = await getTasksAdvanced(
                            orgId as string,
                            buildAdvancedParams({
                                stageId: group.id,
                                page: 1,
                                pageSize: 10,
                                workspaceId: selectedWorkspace,
                                taskStatus: 1,
                            }),
                        );
                        const deals = dealResponse?.data;
                        // Cập nhật tổng tiền cho stage
                        const batchTotalPrice =
                            (dealResponse as any)?.totalPrice || 0;
                        setStageTotalPrices((prev) => ({
                            ...prev,
                            [group.id]: batchTotalPrice,
                        }));

                        // Lấy tổng số deals từ metadata.total
                        const totalDeals =
                            dealResponse.pagination?.totalRecords || 0;

                        // Kiểm tra xem có thêm deals để tải không
                        const hasMore = deals.length < totalDeals;

                        // Cập nhật pagination state
                        setPaginationState((prev) => ({
                            ...prev,
                            [group.id]: {
                                offset: 0,
                                hasMore: hasMore,
                                isLoading: false,
                                initialLoading: false,
                                totalItems: totalDeals,
                                loadedItems: deals.length,
                            },
                        }));

                        return {
                            id: group.id,
                            apiId: group.id,
                            title: group.name,
                            deals: deals as BuinessProcessTask[],
                            totalDeals: totalDeals,
                            color: group.color,
                        };
                    } catch (err) {
                        console.error(
                            `Error fetching deals for stageGroup ${group.id}`,
                            err,
                        );
                        return {
                            id: group.id,
                            apiId: group.id,
                            title: group.name,
                            deals: [],
                            totalDeals: 0,
                            color: group.color,
                        };
                    }
                }),
            );

            // Cập nhật pipeline stages chỉ cho các giai đoạn đã được cập nhật
            setPipelineStages((prevStages) => {
                if (stageUpdateInfo) {
                    // Nếu chỉ cập nhật một số giai đoạn cụ thể
                    return prevStages.map((stage) => {
                        // Tìm giai đoạn đã được cập nhật trong kết quả mới
                        const updatedStage = results.find(
                            (r) => r.id === stage.id,
                        );
                        // Nếu tìm thấy, trả về giai đoạn đã cập nhật, ngược lại giữ nguyên
                        return updatedStage || stage;
                    });
                } else {
                    // Nếu cập nhật tất cả, trả về toàn bộ kết quả mới
                    return results;
                }
            });

            // Nếu đang mở DealDetailPanel, cập nhật lại thông tin stage của deal đang được chọn
            if (selectedDeal && isDealDetailOpen) {
                // Nếu chỉ cập nhật một số giai đoạn, chỉ tìm deal trong các giai đoạn đó
                const stagesToSearch = stageUpdateInfo
                    ? results
                    : pipelineStages;

                const updatedDeal = stagesToSearch
                    .flatMap((stage) => stage.deals)
                    .find((deal) => deal.id === selectedDeal.id);

                if (updatedDeal) {
                    // Giữ nguyên trạng thái hiện tại của selectedDeal nhưng cập nhật thông tin stage
                    setSelectedDeal((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            stageId: updatedDeal.stageId || prev.stageId,
                            stageName:
                                stages.find((s) => s.id === updatedDeal.stageId)
                                    ?.name ||
                                prev.stageName ||
                                "",
                        };
                    });
                }
            }
        } catch (error) {
            console.error("Error refreshing pipeline data:", error);
        }
    };

    // Tạo cấu trúc dữ liệu cho kanban
    // Truyền vào thêm data vào card thì vào đây
    const kanbanColumns = useMemo(() => {
        return pipelineStages.map((stage) => {
            const formattedDeals = stage.deals.map((deal) => {
                const value = dealValues[deal.id] || 0;

                return {
                    id: deal.id,
                    title: deal.name || "Không có tiêu đề",
                    customer: deal.customerInfo?.fullName || "Không có tên",
                    username: deal.username || "Không có tên",
                    email: deal.email || "Không có email",
                    phone: deal.phone || "Không có số điện thoại",
                    avatar: deal.customerInfo?.avatar || "",
                    totalCalls: deal.activity?.totalCalls || 0,
                    totalNotes: deal.activity?.totalNotes || 0,
                    totalReminders: deal.activity?.totalReminders || 0,
                    totalAttachments: deal.activity?.totalAttachments || 0,
                    lastModifiedDate: deal.updatedDate || "",
                    // Add required Deal properties
                    workspaceId: "",
                    workspaceName: "",
                    stageId: deal.stageId || stage.id,
                    stageName: stage.title,
                    assignees: deal.assignedTo || [],
                    fullName: "",
                    tags: Array.isArray(deal.tags)
                        ? deal.tags.map((t: any) => ({
                              id: t.id,
                              name: t.name,
                              textColor: t.textColor,
                              backgroundColor: t.backgroundColor,
                          }))
                        : [],
                    // Add deal value
                    dealValue: value,
                };
            });

            // Tính tổng giá trị cục bộ (fallback)
            let totalValue = 0;
            formattedDeals.forEach((deal) => {
                totalValue += deal.dealValue || 0;
            });
            // Ưu tiên dùng tổng tiền theo stage từ API nếu có, không cộng dồn theo local
            const stageTotal = stageTotalPrices[stage.id];
            const budgetValue =
                typeof stageTotal === "number" ? stageTotal : totalValue;
            const formattedTotalValue = formatCurrency(budgetValue);

            return {
                id: stage.id,
                apiId: stage.apiId,
                title: stage.title,
                budget: formattedTotalValue,
                deals: formattedDeals,
                color: (stage as any).color,
            };
        });
    }, [pipelineStages, dealValues, stageTotalPrices]);

    // Cập nhật pipeline khi kanbanColumns thay đổi
    useEffect(() => {
        if (kanbanColumns.length > 0) {
            setPipeline(kanbanColumns as unknown as PipelineColumn[]);
            setIsLoading(false);
        }
    }, [kanbanColumns]);

    // Định nghĩa tất cả các hàm xử lý sự kiện và logic khác của component

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        // Nếu không thay đổi vị trí, không cần làm gì
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Xử lý kéo thả cột (stage)
        if (type === "COLUMN") {
            const newPipeline = [...pipeline];
            const [removed] = newPipeline.splice(source.index, 1);
            newPipeline.splice(destination.index, 0, removed);
            setPipeline(newPipeline);

            // Nếu đang trong edit mode, lưu thay đổi thứ tự
            if (isEditMode) {
                setPendingChanges((prev) => ({
                    ...prev,
                    hasReordered: true,
                    reorderedStages: newPipeline.map((col) => col.id),
                }));
            }

            return;
        }

        // Xử lý kéo thả deals
        if (type === "DEAL") {
            const sourcePipelineIndex = pipeline.findIndex(
                (p) => p.id === source.droppableId,
            );
            const destPipelineIndex = pipeline.findIndex(
                (p) => p.id === destination.droppableId,
            );

            // Nếu source hoặc destination không tồn tại, không làm gì
            if (sourcePipelineIndex === -1 || destPipelineIndex === -1) return;

            // Tạo bản sao của pipeline
            const newPipeline = [...pipeline];

            // Trong cùng một cột
            if (source.droppableId === destination.droppableId) {
                const column = { ...newPipeline[sourcePipelineIndex] };
                const deals = [...column.deals];
                const [removed] = deals.splice(source.index, 1);
                deals.splice(destination.index, 0, removed);
                column.deals = deals;
                newPipeline[sourcePipelineIndex] = column;
            }
            // Giữa các cột khác nhau
            else {
                const sourceColumn = { ...newPipeline[sourcePipelineIndex] };
                const destColumn = { ...newPipeline[destPipelineIndex] };

                const sourceDeals = [...sourceColumn.deals];
                const destDeals = [...destColumn.deals];

                const [removed] = sourceDeals.splice(source.index, 1);

                // Gọi API để cập nhật stage của deal
                const movedDeal = removed;
                const newStageId = destination.droppableId;

                // Gọi API updateCustomerStage để cập nhật stage
                const updateStage = async () => {
                    try {
                        const previousStageId = source.droppableId;
                        const response = await moveBusinessProcessTask(
                            orgId as string,
                            movedDeal.id,
                            { newStageId: newStageId },
                        );
                        if (response.success) {
                            toast.success("Cập nhật giai đoạn thành công");
                        } else {
                            toast.error("Cập nhật giai đoạn thất bại");
                            console.error(response.message);
                        }

                        // Cập nhật thông tin stage của deal
                        movedDeal.stageId = newStageId;
                        movedDeal.stageName = destColumn.title;
                        refreshPipelineData({
                            oldStageId: previousStageId,
                            newStageId: newStageId,
                        });
                        // Cập nhật pipelineStages để đảm bảo tổng giá trị được tính lại
                        setPipelineStages((prevStages) => {
                            return prevStages.map((stage) => {
                                // Xóa deal khỏi stage nguồn
                                if (stage.id === source.droppableId) {
                                    return {
                                        ...stage,
                                        deals: stage.deals.filter(
                                            (d) => d.id !== movedDeal.id,
                                        ),
                                        totalDeals: Math.max(
                                            0,
                                            (stage.totalDeals || 0) - 1,
                                        ),
                                    };
                                }
                                // Thêm deal vào stage đích - convert Deal to BuinessProcessTask
                                if (stage.id === newStageId) {
                                    const businessProcessTask: BuinessProcessTask =
                                        {
                                            id: movedDeal.id,
                                            stageId:
                                                movedDeal.stageId || stage.id,
                                            name:
                                                movedDeal.title ||
                                                "Không có tiêu đề",
                                            username: movedDeal.username || "",
                                            email: movedDeal.email || "",
                                            phone: movedDeal.phone || "",
                                            description: "",
                                            customerId: movedDeal.customerId,
                                            leadId: movedDeal.leadId || "",
                                            buId: "",
                                            tags: [],
                                            activity: {
                                                id:
                                                    movedDeal.activity?.id ||
                                                    "",
                                                taskId: movedDeal.id,
                                                totalCalls:
                                                    movedDeal.activity
                                                        ?.totalCalls || 0,
                                                totalNotes:
                                                    movedDeal.activity
                                                        ?.totalNotes || 0,
                                                totalReminders:
                                                    movedDeal.activity
                                                        ?.totalReminders || 0,
                                                totalAttachments:
                                                    movedDeal.activity
                                                        ?.totalAttachments || 0,
                                            },
                                            orderId:
                                                movedDeal.orderDetail?.id || "",
                                            assignedTo:
                                                movedDeal.assignees?.map(
                                                    (item) => ({
                                                        id: item,
                                                        name: item,
                                                        avatar: "",
                                                        type: item,
                                                        saleTeamId: item,
                                                        saleTeamName: item,
                                                    }),
                                                ) || [],
                                            status: 0,
                                            notes: "",
                                            isBlocked: false,
                                            blockedReason: "",
                                            createdDate: "",
                                            createdBy: "",
                                            updatedDate:
                                                movedDeal.lastModifiedDate ||
                                                "",
                                            updatedBy: "",
                                            subTasks: [],
                                            stageHistory: [],
                                            customerName: "",
                                        };
                                    return {
                                        ...stage,
                                        deals: [
                                            ...stage.deals,
                                            businessProcessTask,
                                        ],
                                        totalDeals: (stage.totalDeals || 0) + 1,
                                    };
                                }
                                return stage;
                            });
                        });

                        // Cập nhật paginationState để đồng bộ với pipelineStages
                        setPaginationState((prev) => ({
                            ...prev,
                            [source.droppableId]: {
                                ...prev[source.droppableId],
                                totalItems: Math.max(
                                    0,
                                    (prev[source.droppableId]?.totalItems ||
                                        0) - 1,
                                ),
                                loadedItems: Math.max(
                                    0,
                                    (prev[source.droppableId]?.loadedItems ||
                                        0) - 1,
                                ),
                            },
                            [newStageId]: {
                                ...prev[newStageId],
                                totalItems:
                                    (prev[newStageId]?.totalItems || 0) + 1,
                                loadedItems:
                                    (prev[newStageId]?.loadedItems || 0) + 1,
                            },
                        }));
                    } catch (error) {
                        console.error("Error updating stage:", error);
                        // Revert UI changes if API call fails
                        setPipeline([...pipeline]);
                    }
                };

                updateStage();

                destDeals.splice(destination.index, 0, movedDeal);

                sourceColumn.deals = sourceDeals;
                destColumn.deals = destDeals;

                newPipeline[sourcePipelineIndex] = sourceColumn;
                newPipeline[destPipelineIndex] = destColumn;
            }

            setPipeline(newPipeline);
        }
    };

    const addColumn = async (insertIndex: number) => {
        // Tạo stage mới với ID tạm thời
        const tempId = `temp_${Date.now()}`;
        const newColumn: PipelineColumn = {
            id: tempId,
            apiId: tempId,
            title: "Stage mới",
            budget: "0 đ",
            deals: [],
            color: "#3B82F6", // Màu xanh dương mặc định
        };

        // Chuẩn bị pipeline mới với stage vừa được thêm
        setPipeline((prev) => {
            const newPipeline = [...prev];
            newPipeline.splice(insertIndex, 0, newColumn);

            // Đánh dấu đã thay đổi thứ tự để khi lưu sẽ gửi orderIndex lên server
            setPendingChanges((prevChanges) => ({
                ...prevChanges,
                addedStages: [
                    ...prevChanges.addedStages,
                    { ...newColumn, insertIndex },
                ],
                hasReordered: true,
                reorderedStages: newPipeline.map((col) => col.id),
            }));

            return newPipeline;
        });
    };

    const deleteColumn = (columnId: string) => {
        if (pipeline.length <= 1) {
            toast.error(t("error.cannotDeleteLastStage"));
            return;
        }

        const stageToDelete = pipeline.find((col) => col.id === columnId);
        if (stageToDelete) {
            // Mở confirm dialog thay vì xóa trực tiếp
            setStageToDelete({
                id: stageToDelete.id,
                title: stageToDelete.title,
            });
            setDeleteStageDialogOpen(true);
        }
    };

    const startEditingColumn = useCallback(
        (columnId: string, currentTitle: string) => {
            // Cập nhật state một lần duy nhất để tránh re-render nhiều lần
            setEditingColumn(columnId);
            setEditingTitle(currentTitle);

            // Sử dụng requestAnimationFrame để đảm bảo DOM đã được cập nhật
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            });
        },
        [],
    );

    // Tạo mutation hook ở ngoài các hàm xử lý sự kiện
    const updateDealStageMutation = useUpdateDealStage(orgId as string);
    const updateStageIndexMutation = useUpdateBusinessProcessStageIndex(
        orgId as string,
        selectedWorkspace as string,
    );

    // Sửa lại hàm saveColumnTitle để tách biệt việc chỉnh sửa và gọi API
    const saveColumnTitle = useCallback(
        (stageId: string) => {
            if (editingColumn) {
                // Lấy giá trị hiện tại từ input thay vì state
                const finalTitle = inputRef.current?.value || editingTitle;

                // Chỉ cập nhật khi tiêu đề thực sự thay đổi
                const currentColumn = pipeline.find(
                    (col) => col.id === stageId,
                );
                if (currentColumn && currentColumn.title !== finalTitle) {
                    // Lưu thay đổi vào pendingChanges thay vì gọi API ngay
                    setPendingChanges((prev) => ({
                        ...prev,
                        renamedStages: {
                            ...prev.renamedStages,
                            [stageId]: finalTitle,
                        },
                    }));

                    // Cập nhật UI ngay lập tức (optimistic update)
                    setPipeline((prev) =>
                        prev.map((col) =>
                            col.id === editingColumn
                                ? { ...col, title: finalTitle }
                                : col,
                        ),
                    );
                }
            }
            // Luôn reset trạng thái chỉnh sửa
            setEditingColumn(null);
            setEditingTitle("");
        },
        [editingColumn, editingTitle, pipeline],
    );

    // Xử lý thay đổi tiêu đề trực tiếp không cần debounce
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Sử dụng event.target.value trực tiếp thay vì cập nhật state
        // Điều này giúp tránh re-render toàn bộ component khi gõ
        e.persist && e.persist();
        setEditingTitle(e.target.value);
    };

    const cancelEditing = () => {
        setEditingColumn(null);
        setEditingTitle("");
    };

    const toggleEditMode = () => {
        if (!isEditMode) {
            setOriginalPipeline([...pipeline]);
            setPendingChanges({
                renamedStages: {},
                addedStages: [],
                deletedStages: [],
                reorderedStages: [],
                hasReordered: false,
                tempToRealIdMapping: {},
                updatedColors: {},
            });
        } else {
            applyPendingChanges();
        }
        setIsEditMode((prev) => !prev);
        setEditingColumn(null);
        setEditingTitle("");
    };

    const applyPendingChanges = async () => {
        try {
            const promises: Promise<any>[] = [];
            // Mapping cục bộ để đảm bảo có thể dùng ngay sau khi tạo stage (không phụ thuộc setState async)
            const tempToRealLocal: Record<string, string> = {};
            let hasSuccessfulChange = false;

            // Lấy danh sách các stage sẽ bị xóa
            const stagesToDelete = pendingChanges.deletedStages.map(
                (stage) => stage.stageId,
            );

            // 1. XÓA CÁC STAGE TRƯỚC (để tránh xung đột index) - dùng batch
            {
                const deletions = pendingChanges.deletedStages.filter(
                    (s) => !s.stageId.startsWith("temp_"),
                );
                if (deletions.length > 0) {
                    try {
                        // Gửi mảng các stage với format mới: { stageId, action, targetId }
                        const body = deletions.map((s) => {
                            const targetId =
                                s.action === "move_tasks"
                                    ? s.targetId || s.moveToStageId || null
                                    : null;

                            // Validation: nếu action là move_tasks thì targetId bắt buộc phải có
                            if (s.action === "move_tasks" && !targetId) {
                                throw new Error(
                                    `Stage ${s.stageId} có action move_tasks nhưng thiếu targetId`,
                                );
                            }

                            return {
                                stageId: s.stageId,
                                action: s.action,
                                targetId: targetId,
                            };
                        });
                        await batchDeleteStage(
                            orgId as string,
                            selectedWorkspace as string,
                            body,
                        );
                        hasSuccessfulChange = true;
                    } catch (error) {
                        console.error("Error batch deleting stages:", error);
                        toast.error("Xóa giai đoạn thất bại");
                    }
                }
            }

            // 2. TẠO CÁC STAGE MỚI (sau khi đã xóa) - dùng batch
            {
                const toCreate = pendingChanges.addedStages.filter(
                    (s) => !stagesToDelete.includes(s.id),
                );
                if (toCreate.length > 0) {
                    try {
                        const body = {
                            stages: toCreate.map((s) => ({
                                // Ưu tiên lấy tên từ renamedStages nếu stage đã được đổi tên
                                name:
                                    pendingChanges.renamedStages[s.id] ||
                                    s.title,
                            })),
                        } as any;
                        const res: any = await batchCreateStage(
                            orgId as string,
                            selectedWorkspace as string,
                            body,
                        );
                        if (res?.success && Array.isArray(res?.data)) {
                            // Giả định API trả về theo thứ tự input; tạo mapping theo index
                            const realStages: Array<{
                                id: string;
                                name: string;
                            }> = res.data;
                            toCreate.forEach((added, idx) => {
                                const real = realStages[idx];
                                if (real?.id) {
                                    tempToRealLocal[added.id] = real.id;
                                }
                            });

                            // Lưu vào state mapping và cập nhật pipeline sang real id
                            setPendingChanges((prev) => ({
                                ...prev,
                                tempToRealIdMapping: {
                                    ...prev.tempToRealIdMapping,
                                    ...Object.fromEntries(
                                        Object.entries(tempToRealLocal),
                                    ),
                                },
                            }));
                            setPipeline((prev) =>
                                prev.map((col) => {
                                    const mapped = tempToRealLocal[col.id];
                                    return mapped
                                        ? { ...col, id: mapped, apiId: mapped }
                                        : col;
                                }),
                            );
                            hasSuccessfulChange = true;
                        } else {
                            toast.error("Thêm giai đoạn thất bại");
                            console.error(res?.message);
                        }
                    } catch (error) {
                        console.error("Error batch creating stages:", error);
                        toast.error("Thêm giai đoạn thất bại");
                    }
                }
            }

            // 3. CẬP NHẬT TÊN CÁC STAGE (sau khi đã xóa và tạo) - dùng batch
            {
                // Chỉ giữ các stage thật và không nằm trong danh sách xóa
                const toRename = Object.entries(pendingChanges.renamedStages)
                    .filter(([stageId]) => !stageId.startsWith("temp_"))
                    .filter(([stageId]) => !stagesToDelete.includes(stageId));

                // Áp dụng mapping tạm -> thật nếu có (khi user đổi tên ngay sau khi thêm)
                const batchPayload = toRename.map(([stageId, name]) => ({
                    stageId:
                        tempToRealLocal[stageId] ||
                        pendingChanges.tempToRealIdMapping[stageId] ||
                        stageId,
                    name,
                }));

                // Loại bỏ các entry chưa resolve id
                const resolvedRenames = batchPayload.filter(
                    (r) => !r.stageId.startsWith("temp_"),
                );

                if (resolvedRenames.length > 0) {
                    try {
                        await batchUpdateStageName(
                            orgId as string,
                            selectedWorkspace as string,
                            { items: resolvedRenames },
                        );
                        hasSuccessfulChange = true;
                    } catch (error) {
                        console.error(
                            "Error batch updating stage names:",
                            error,
                        );
                        toast.error("Cập nhật tên giai đoạn thất bại");
                    }
                }
            }

            // 4. CẬP NHẬT MÀU CÁC STAGE (nếu có)
            {
                const colorItems = Object.entries(pendingChanges.updatedColors)
                    .map(([stageId, color]) => ({
                        stageId:
                            tempToRealLocal[stageId] ||
                            pendingChanges.tempToRealIdMapping[stageId] ||
                            stageId,
                        color,
                    }))
                    .filter((i) => !i.stageId.startsWith("temp_"));

                if (colorItems.length > 0) {
                    try {
                        await batchUpdateStageColor(
                            orgId as string,
                            selectedWorkspace as string,
                            { colors: colorItems },
                        );
                        hasSuccessfulChange = true;
                    } catch (error) {
                        console.error(
                            "Error batch updating stage colors:",
                            error,
                        );
                        toast.error("Cập nhật màu giai đoạn thất bại");
                    }
                }
            }

            // 5. CẬP NHẬT THỨ TỰ CÁC STAGE (CUỐI CÙNG)
            // Đảm bảo tất cả thay đổi đã hoàn thành trước khi update index
            // Chỉ update index khi có thay đổi thứ tự thực sự
            if (pipeline.length > 0 && pendingChanges.hasReordered) {
                const orderedIds =
                    pendingChanges.reorderedStages &&
                    pendingChanges.reorderedStages.length > 0
                        ? pendingChanges.reorderedStages
                        : pipeline.map((c) => c.id);

                const stagePositions = orderedIds
                    .map((id, index) => {
                        const resolvedId =
                            tempToRealLocal[id] ||
                            pendingChanges.tempToRealIdMapping[id] ||
                            id;
                        return {
                            stageId: resolvedId,
                            orderIndex: index,
                        };
                    })
                    .filter((pos) => !pos.stageId.startsWith("temp_"));

                if (stagePositions.length > 0) {
                    promises.push(
                        updateStageIndexMutation
                            .mutateAsync({
                                stages: stagePositions,
                            })
                            .then(() => {
                                hasSuccessfulChange = true;
                            })
                            .catch((error) => {
                                console.error(
                                    "Error updating stage order:",
                                    error,
                                );
                                toast.error(
                                    "Cập nhật thứ tự giai đoạn thất bại",
                                );
                            }),
                    );
                }
            }

            await Promise.all(promises);

            const hasRealChanges =
                pendingChanges.addedStages.length > 0 ||
                pendingChanges.deletedStages.length > 0 ||
                pendingChanges.hasReordered;
            const hasRenamedStages =
                Object.keys(pendingChanges.renamedStages).length > 0;

            setPendingChanges({
                renamedStages: {},
                addedStages: [],
                deletedStages: [],
                reorderedStages: [],
                hasReordered: false,
                tempToRealIdMapping: {},
                updatedColors: {},
            });

            if (hasRealChanges) {
                queryClient.invalidateQueries({
                    queryKey: ["businessProcess", orgId, selectedWorkspace],
                });

                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            const hasUpdatedColors =
                Object.keys(pendingChanges.updatedColors).length > 0;
            const hasAnyChanges =
                hasRealChanges || hasRenamedStages || hasUpdatedColors;

            if (hasAnyChanges && hasSuccessfulChange) {
                toast.success("Lưu thành công");
            }
        } catch (error) {
            console.error("Error applying pending changes:", error);
            toast.error("Có lỗi xảy ra khi lưu thay đổi");
        }
    };

    const cancelEditMode = async () => {
        setPendingChanges({
            renamedStages: {},
            addedStages: [],
            deletedStages: [],
            reorderedStages: [],
            hasReordered: false,
            tempToRealIdMapping: {},
            updatedColors: {},
        });

        await refreshPipelineData();

        // Reset edit mode
        setIsEditMode(false);
        setEditingColumn(null);
        setEditingTitle("");
        setIsCreatingWorkspace(false);
    };

    function AddColumnButton({ onClick }: { onClick: () => void }) {
        if (!isEditMode) return null;

        return (
            <div className="relative self-stretch flex flex-col justify-center -mx-3">
                <button
                    onClick={onClick}
                    className="size-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center shadow-md transition-colors border-2 border-white dark:border-gray-950"
                    title="Thêm stage"
                >
                    <Plus size={16} />
                </button>
            </div>
        );
    }

    const handleWorkspaceChange = (value: string) => {
        if (value === "__create_new_workspace__") {
            setIsCreatingWorkspace(true);
            setIsCreatingProcess(false);
            setIsEditMode(true);
            const defaultNames = [
                "Đã tiếp nhận",
                "Quan tâm",
                "Không quan tâm",
                "Giao dịch",
            ];
            const defaultColumns: PipelineColumn[] = defaultNames.map(
                (name, idx) => ({
                    id: `temp_new_${idx}`,
                    apiId: `temp_new_${idx}`,
                    title: name,
                    budget: "0 đ",
                    deals: [],
                    color: "#3B82F6", // Màu xanh dương mặc định
                }),
            );
            setPipeline(defaultColumns);
            return;
        } else {
            setPipelineStages([]);
            setPaginationState({});
            queryClient.invalidateQueries({
                queryKey: ["businessProcess", orgId, value],
            });
        }
        setIsCreatingWorkspace(false);
        setIsCreatingProcess(false);
        setIsEditMode(false);
        setSelectedWorkspace(value);
    };

    const loadMoreDealsForNavigation = async (
        stageId: string,
        currentIndex: number,
        totalLoaded: number,
    ) => {
        if (
            currentIndex >= totalLoaded - 2 &&
            paginationState[stageId]?.hasMore
        ) {
            await loadMoreDeals(stageId);
            return true;
        }
        return false;
    };

    const handleDealChange = (newDeal: any) => {
        const performDealChange = async () => {
            if (!orderDetails[newDeal.id]) {
                await fetchOrderDetail(newDeal.orderId, newDeal.id);
            }

            setSelectedDeal({
                ...newDeal,
                orderDetail: orderDetails[newDeal.id] || null,
            });
        };

        performDealChange();
    };

    const handleCloseDealDetail = () => {
        setIsDealDetailOpen(false);
        setTimeout(() => setSelectedDeal(null), 300);
    };

    const deleteStageHook = useDeleteBusinessProcessStage(
        orgId as string,
        selectedWorkspace as string,
    );

    const handleConfirmDeleteStage = async (
        moveToStageId?: string,
        options?: { targetId?: string },
    ) => {
        if (!stageToDelete) return;

        try {
            const action = moveToStageId ? "move_tasks" : "delete_tasks";
            // Lấy targetId từ options hoặc moveToStageId, null nếu delete_tasks
            const targetId =
                action === "move_tasks"
                    ? options?.targetId || moveToStageId || null
                    : null;

            setPipeline((prev) => {
                const updated = prev.filter(
                    (col) => col.id !== stageToDelete.id,
                );
                setPendingChanges((prevChanges) => ({
                    ...prevChanges,
                    deletedStages: [
                        ...prevChanges.deletedStages,
                        {
                            stageId: stageToDelete.id,
                            moveToStageId: moveToStageId, // Giữ lại để backward compatibility
                            targetId: targetId,
                            action: action,
                        },
                    ],
                    hasReordered: true,
                    reorderedStages: updated.map((c) => c.id),
                }));
                return updated;
            });

            setDeleteStageDialogOpen(false);
            setStageToDelete(null);

            const actionText =
                action === "move_tasks" ? "di chuyển deals và xóa" : "xóa";
            toast.success(
                `Đã ${actionText} giai đoạn "${stageToDelete.title}"`,
            );
        } catch (error) {
            console.error("Error preparing stage deletion:", error);
            toast.error("Có lỗi xảy ra khi chuẩn bị xóa giai đoạn");
        }
    };

    const handleCloseDeleteDialog = () => {
        setDeleteStageDialogOpen(false);
        setStageToDelete(null);
    };

    if (isLoadingBusinessProcess) {
        return <Loading />;
    }

    const totalDealsCount =
        viewMode === "list" && filteredStats
            ? filteredStats.totalDeals
            : hasFilters
              ? totalRecordsFromStages > 0
                  ? totalRecordsFromStages
                  : pipeline.flatMap((col) => col.deals).length
              : totalRecordsFromStages > 0
                ? totalRecordsFromStages
                : pipeline.flatMap((col) => col.deals).length;

    const totalPriceValue = (() => {
        if (viewMode === "list" && filteredStats)
            return filteredStats.totalPrice;
        const sumFromAdvanced = Object.values(stageTotalPrices).reduce(
            (a, b) => a + (b || 0),
            0,
        );
        if (sumFromAdvanced > 0) return sumFromAdvanced;
        return pipeline.reduce((acc, col) => {
            return (
                acc +
                col.deals.reduce((dealAcc, deal) => {
                    return dealAcc + (deal.dealValue || 0);
                }, 0)
            );
        }, 0);
    })();

    const handleCreateWorkspace = (name: string) => {
        if (name == "")
            return toast.error("Vui lòng nhập tên nhóm", {
                position: "top-center",
            });
        const formData = new FormData();
        formData.append("Name", name);
        createWorkspace(orgId as string, formData).then((res) => {
            if (res.code === 201) {
                const newWorkspaceId = res.content.id;
                if (newWorkspaceId) {
                    const bodyCreateBusinessProcess = {
                        name: name,
                        workspaceId: newWorkspaceId,
                        customStages: pipeline.map((col) => ({
                            name: col.title,
                        })),
                    };
                    createBusinessProcessWos(
                        orgId as string,
                        bodyCreateBusinessProcess,
                    ).then((res: any) => {
                        if (res.success) {
                            toast.success(t("success.createWorkspace"));
                            queryClient.invalidateQueries({
                                queryKey: ["allWorkspaces", orgId],
                            });
                            queryClient.invalidateQueries({
                                queryKey: [
                                    "businessProcess",
                                    orgId,
                                    newWorkspaceId,
                                ],
                            });
                            setSelectedWorkspace(newWorkspaceId);
                            setIsCreatingWorkspace(false);
                            setIsEditMode(false);
                        } else {
                            toast.error(t("error.createWorkspace"));
                        }
                    });
                }
            } else {
                toast.error("Tạo nhóm thất bại");
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col rounded-lg bg-gradient-to-br from-[#F4EAFB] via-white to-[#F4EAFB]">
            <DealHeader
                orgId={orgId as string}
                totalDeals={totalDealsCount}
                totalPrice={totalPriceValue}
                viewMode={viewMode}
                onChangeView={setViewMode}
                isEditMode={isEditMode}
                editDeal={toggleEditMode}
                cancelEdit={cancelEditMode}
                workspaces={workspaces}
                selectedWorkspace={selectedWorkspace}
                onWorkspaceChange={handleWorkspaceChange}
                isCreatingWorkspace={isCreatingWorkspace}
                // @ts-ignore add-on prop for process creation flow
                isCreatingProcess={isCreatingProcess}
                // @ts-ignore add-on prop for process creation flow
                hasNoStages={hasNoStages}
                onCancelCreateWorkspace={() => {
                    setIsCreatingWorkspace(false);
                    setIsCreatingProcess(false);
                    setIsEditMode(false);
                    // reload pipeline based on current workspace selection
                    refreshPipelineData();
                }}
                onConfirmCreateWorkspace={handleCreateWorkspace}
                // @ts-ignore add-on handler for starting process creation
                onStartCreateProcess={() => {
                    setIsCreatingWorkspace(false);
                    setIsCreatingProcess(true);
                    setIsEditMode(true);
                    const defaultNames = [
                        "Khách quan tâm",
                        "Gửi thông tin chi tiết",
                        "Đặt lịch xem dự án",
                        "Đã đi xem - chờ quyết định",
                        "Chốt cọc",
                    ];
                    const defaultColumns: PipelineColumn[] = defaultNames.map(
                        (name, idx) => ({
                            id: `temp_new_${idx}`,
                            apiId: `temp_new_${idx}`,
                            title: name,
                            budget: "0 đ",
                            deals: [],
                            color: "#3B82F6", // Màu xanh dương mặc định
                        }),
                    );
                    setPipeline(defaultColumns);
                }}
                // @ts-ignore add-on handler for confirming process creation
                onConfirmCreateProcess={() => {
                    if (!selectedWorkspace) {
                        return toast.error("Vui lòng chọn không gian làm việc");
                    }
                    const workspaceName =
                        workspaces.find((w) => w.id === selectedWorkspace)
                            ?.name || "Quy trình làm việc";
                    const bodyCreateBusinessProcess = {
                        name: workspaceName,
                        workspaceId: selectedWorkspace,
                        customStages: pipeline.map((col) => ({
                            name: col.title,
                        })),
                    };
                    createBusinessProcessWos(
                        orgId as string,
                        bodyCreateBusinessProcess as any,
                    ).then((res: any) => {
                        if (res.success) {
                            toast.success(t("success.update"));
                            queryClient.invalidateQueries({
                                queryKey: [
                                    "businessProcess",
                                    orgId,
                                    selectedWorkspace,
                                ],
                            });
                            setIsCreatingProcess(false);
                            setIsEditMode(false);
                        } else {
                            toast.error(t("error.common"));
                        }
                    });
                }}
                onAddNewDeal={() => setIsAddNewDealOpen(true)}
            />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {viewMode === "kanban" ? (
                    <div className="flex-1 min-h-0 overflow-auto">
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable
                                droppableId="board"
                                direction="horizontal"
                                type="COLUMN"
                            >
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex px-2 py-1 gap-2 overflow-x-auto"
                                        style={{
                                            minWidth: "max-content",
                                            minHeight: "100%",
                                        }}
                                    >
                                        {pipeline.map((column, index) => [
                                            <KanbanColumn
                                                key={column.id}
                                                column={column}
                                                index={index}
                                                isEditMode={isEditMode}
                                                editingColumn={editingColumn}
                                                editingTitle={editingTitle}
                                                inputRef={
                                                    inputRef as React.RefObject<HTMLInputElement>
                                                }
                                                handleTitleChange={
                                                    handleTitleChange
                                                }
                                                saveColumnTitle={
                                                    saveColumnTitle
                                                }
                                                cancelEditing={cancelEditing}
                                                startEditingColumn={
                                                    startEditingColumn
                                                }
                                                onColorChange={(
                                                    stageId,
                                                    color,
                                                ) => {
                                                    setPendingChanges(
                                                        (prev) => ({
                                                            ...prev,
                                                            updatedColors: {
                                                                ...prev.updatedColors,
                                                                [stageId]:
                                                                    color,
                                                            },
                                                        }),
                                                    );
                                                    setPipeline((prev) =>
                                                        prev.map((col) =>
                                                            col.id === stageId
                                                                ? {
                                                                      ...col,
                                                                      color,
                                                                  }
                                                                : col,
                                                        ),
                                                    );
                                                }}
                                                deleteColumn={deleteColumn}
                                                pipeline={pipeline}
                                                loadMoreDeals={loadMoreDeals}
                                                handleDealClick={
                                                    handleDealClick
                                                }
                                                paginationState={
                                                    paginationState
                                                }
                                            />,
                                            isEditMode ? (
                                                <AddColumnButton
                                                    key={`add-${column.id}`}
                                                    onClick={() =>
                                                        addColumn(index + 1)
                                                    }
                                                />
                                            ) : null,
                                        ])}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto ">
                        <DealList
                            orgId={orgId as string}
                            workspaceId={selectedWorkspace as string}
                            onStatsUpdate={handleStatsUpdate}
                        />
                    </div>
                )}
            </div>

            {selectedDeal && viewMode === "kanban" && (
                <DealDetailPanel
                    workspaceId={selectedWorkspace as string}
                    refreshSingleStageData={refreshSingleStageData}
                    deal={selectedDeal as any}
                    isOpen={isDealDetailOpen}
                    onClose={handleCloseDealDetail}
                    stages={stagesName}
                    orgId={orgId as string}
                    customerId={selectedDeal.id}
                    onStageChange={refreshPipelineData}
                    // Navigation props
                    allDealsInStage={allDealsInStage as any[]}
                    onDealChange={handleDealChange}
                    onOrderUpdated={({ dealId, order, totalPrice }) => {
                        // Sync order details cache and ref
                        setOrderDetails((prev) => {
                            const updated = { ...prev, [dealId]: order };
                            orderDetailsRef.current = updated;
                            return updated;
                        });
                        // Update dealValues used for kanban totals
                        setDealValues((prev) => ({
                            ...prev,
                            [dealId]: totalPrice,
                        }));
                        // Also update currently selectedDeal to prevent UI rollback
                        setSelectedDeal((prev) =>
                            prev && prev.id === dealId
                                ? { ...prev, orderDetail: order }
                                : prev,
                        );
                    }}
                    // Navigation with pagination support
                    onNext={async () => {
                        const currentIndex = allDealsInStage.findIndex(
                            (d) => d.id === selectedDeal.id,
                        );
                        const totalLoaded = allDealsInStage.length;

                        // Try to load more deals if we're near the end
                        if (selectedDeal.stageId) {
                            await loadMoreDealsForNavigation(
                                selectedDeal.stageId,
                                currentIndex,
                                totalLoaded,
                            );
                        }

                        // Wait a bit for state update then navigate
                        setTimeout(() => {
                            const updatedIndex = allDealsInStage.findIndex(
                                (d) => d.id === selectedDeal.id,
                            );

                            if (updatedIndex < allDealsInStage.length - 1) {
                                const nextDeal =
                                    allDealsInStage[updatedIndex + 1];
                                handleDealChange(nextDeal);
                            }
                        }, 500);
                    }}
                    onPrevious={() => {
                        const currentIndex = allDealsInStage.findIndex(
                            (d) => d.id === selectedDeal.id,
                        );
                        if (currentIndex > 0) {
                            const previousDeal =
                                allDealsInStage[currentIndex - 1];
                            handleDealChange(previousDeal);
                        }
                    }}
                    canNavigatePrevious={(() => {
                        const currentIndex = allDealsInStage.findIndex(
                            (d) => d.id === selectedDeal.id,
                        );
                        return currentIndex > 0;
                    })()}
                    canNavigateNext={(() => {
                        const currentIndex = allDealsInStage.findIndex(
                            (d) => d.id === selectedDeal.id,
                        );
                        const hasMoreInCurrent =
                            currentIndex < allDealsInStage.length - 1;
                        const hasMoreData = selectedDeal.stageId
                            ? paginationState[selectedDeal.stageId]?.hasMore
                            : false;
                        return hasMoreInCurrent || hasMoreData;
                    })()}
                />
            )}

            {isAddNewDealOpen && (
                <AddNewDealModal
                    isOpen={isAddNewDealOpen}
                    onClose={() => setIsAddNewDealOpen(false)}
                    orgId={orgId as string}
                    refreshSingleStageData={refreshSingleStageData}
                    workspaceId={selectedWorkspace as string}
                />
            )}

            {stageToDelete && (
                <DeleteStageDialog
                    isOpen={deleteStageDialogOpen}
                    onClose={handleCloseDeleteDialog}
                    stageId={stageToDelete.id}
                    stageName={stageToDelete.title}
                    dealCount={
                        pipeline.find((col) => col.id === stageToDelete.id)
                            ?.deals.length || 0
                    }
                    onConfirmDelete={handleConfirmDeleteStage}
                    otherStages={pipeline.filter(
                        (col) => col.id !== stageToDelete.id,
                    )}
                />
            )}
        </div>
    );
}

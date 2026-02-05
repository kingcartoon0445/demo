import { getCustomerDetail, rollbackLeadFlowStep } from "@/api/customerV2";
import { updateTransactionStatus } from "@/api/productV2";
import { CustomerUpdateProvider } from "@/contexts/CustomerUpdateContext";
import {
    useArchieveBusinessProcessTask,
    useBusinessProcessTaskById,
    useDeleteBusinessProcessTask,
    useDuplicateBusinessProcessTask,
    useMoveBusinessProcessTask,
    usePartialUpdateBusinessProcessTask,
    useRollbackBusinessProcessTask,
    useUnarchieveBusinessProcessTask,
    useUpdateBusinessProcessTaskStatus,
    useUpdateBusinessProcessTaskTags,
    useGetBusinessProcessTags,
    useCreateBusinessProcessTag,
} from "@/hooks/useBusinessProcess";
import { useCustomerOrLeadDetail } from "@/hooks/useCustomerOrLeadDetail";
import { useGetProducts, useOrder } from "@/hooks/useProduct";
import { useUserDetail } from "@/hooks/useUser";
import {
    BuinessProcessTask,
    BusinessProcessTag,
    CustomerInfo,
    MoveBusinessProcessTask,
} from "@/interfaces/businessProcess";
import { Deal as BaseDeal } from "@/lib/interface";
import { cn, getDaysInStage } from "@/lib/utils";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useQueryClient } from "@tanstack/react-query";
import {
    Archive,
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    DollarSign,
    Earth,
    EditIcon,
    Heart,
    MoreHorizontal,
    TagIcon,
    Trash2,
    User,
    X,
} from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import TabsUserDetail from "../common/TabsUserDetail";
import CustomerDetailSection from "../customer/CustomerDetailSection";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import EditableAssigneesValue from "../common/EditableAssigneesValue";
import { EditableFieldRow } from "../common/EditableFieldRow";
import EditableDealTagsValue from "../common/EditableDealTagsValue";
import FailDialog from "./FailDialog";
import ProductEditDialog from "./ProductEditDialog";
import InlineTagsEditor from "./InlineTagsEditor";
import Image from "next/image";
import EditableAssigneeValue from "../common/EditableAssigneeValue";
import { useLanguage } from "@/contexts/LanguageContext";

// Memoized heavy components to avoid re-rendering while editing light fields
const MemoTabsUserDetail = memo(TabsUserDetail);

// Component để hiển thị thông tin customer/lead
const CustomerDetailComponent = memo(function CustomerDetailComponent({
    taskDetail,
    orgId,
    workspaceId,
}: {
    taskDetail: BuinessProcessTask | null;
    orgId: string;
    workspaceId: string;
}) {
    const {
        data: customerOrLeadData,
        isCustomer,
        isLead,
    } = useCustomerOrLeadDetail({
        orgId,
        customerId: taskDetail?.customerId,
        leadId: taskDetail?.leadId,
        workspaceId,
        enabled: !!(
            taskDetail?.customerId ||
            taskDetail?.leadId ||
            taskDetail?.buId
        ),
    });

    if (
        !taskDetail ||
        (!taskDetail?.customerId && !taskDetail?.leadId && !taskDetail?.buId)
    ) {
        return null;
    }

    // Xác định provider type và các ID cần thiết
    const provider =
        taskDetail?.customerId || taskDetail?.buId ? "customer" : "lead";
    const customerId = taskDetail?.customerId || taskDetail?.buId || "";
    const leadId = taskDetail?.leadId || "";

    return (
        <div className="p-4">
            <CustomerUpdateProvider
                orgId={orgId}
                customerId={customerId}
                leadId={leadId}
                provider={provider}
            >
                <CustomerDetailSection
                    customerDetail={customerOrLeadData?.content}
                    customer={taskDetail.customerInfo}
                    orgId={orgId}
                    showCustomerName={true}
                />
            </CustomerUpdateProvider>
        </div>
    );
});

interface TitleEditorProps {
    name: string;
    onSave: (newName: string) => void;
}

const TitleEditor = memo(function TitleEditor({
    name,
    onSave,
}: TitleEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState<string>(name);

    useEffect(() => {
        setValue(name);
    }, [name]);

    const handleConfirm = () => {
        const newName = value.trim();
        if (!newName || newName === name) {
            setIsEditing(false);
            setValue(name);
            return;
        }
        setIsEditing(false);
        onSave(newName);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setValue(name);
    };

    return (
        <div className="group relative">
            {!isEditing ? (
                <div className="flex items-center gap-2">
                    <h2
                        className="text-lg font-medium cursor-pointer"
                        onClick={() => setIsEditing(true)}
                    >
                        {name || "Không có tiêu đề"}
                    </h2>
                    <button
                        type="button"
                        className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditing(true)}
                    >
                        <EditIcon className="size-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Input
                        autoFocus
                        value={value}
                        onChange={(e) =>
                            setValue((e.target as HTMLInputElement).value)
                        }
                        onBlur={() => {
                            // Cancel on blur to avoid accidental save
                            handleCancel();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleConfirm();
                            }
                            if (e.key === "Escape") {
                                handleCancel();
                            }
                        }}
                        className="flex-1"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleConfirm}
                        className="hover:bg-green-100"
                    >
                        <Check className="size-4 text-green-600" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleCancel}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
});

interface OrderDetail {
    id: string;
    customerId: string;
    workspaceId?: string;
    totalPrice: number;
    orderDetails: Array<{
        id: string;
        productId: string;
        quantity: number;
        product: {
            name: string;
            description: string;
            price: number;
            image: string;
            id: string;
            status: boolean;
        };
    }>;
}

interface Deal extends BaseDeal {
    flowStep: string;
    orderDetail?: OrderDetail | null;
}

interface DealDetailPanelProps {
    deal: Deal | null;
    isOpen: boolean;
    onClose: () => void;
    currentStageIndex?: number;
    totalStages?: number;
    daysInStage?: number;
    stages?: { id: string; name: string; index: number; stageId: string }[];
    orgId: string;
    customerId: string;
    workspaceId: string;
    onStageChange?: () => void;
    refreshSingleStageData?: (stageId: string) => void;
    onPrevious?: () => void;
    onNext?: () => void;
    canNavigatePrevious?: boolean;
    canNavigateNext?: boolean;
    // Thêm props để support navigation
    allDealsInStage?: Deal[];
    onDealChange?: (deal: Deal) => void;
    // Notify parent when order is updated so it can sync its caches
    onOrderUpdated?: (payload: {
        dealId: string;
        order: OrderDetail;
        totalPrice: number;
    }) => void;
}

export interface ProductWithQuantity {
    productId: string;
    quantity: number;
    name?: string;
    price?: number;
}

export default function DealDetailPanel({
    deal: initialDeal,
    isOpen,
    onClose,
    currentStageIndex = 2,
    totalStages = 5,
    daysInStage = 2,
    stages,
    orgId,
    customerId,
    workspaceId,
    onStageChange,
    refreshSingleStageData,
    onPrevious,
    onNext,
    canNavigatePrevious = true,
    canNavigateNext = true,
    allDealsInStage = [],
    onDealChange,
    onOrderUpdated,
}: DealDetailPanelProps) {
    const { t } = useLanguage();
    const [deal, setDeal] = useState<Deal | null>(initialDeal);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productsWithQuantity, setProductsWithQuantity] = useState<
        ProductWithQuantity[]
    >([]);
    const [isUpdatingProducts, setIsUpdatingProducts] =
        useState<boolean>(false);
    const [isFailureDialogOpen, setIsFailureDialogOpen] = useState(false);
    const [failureReason, setFailureReason] = useState("");
    const [failureNote, setFailureNote] = useState("");
    const [taskDetail, setTaskDetail] = useState<BuinessProcessTask | null>(
        null,
    );
    const [isProductEditDialogOpen, setIsProductEditDialogOpen] =
        useState(false);
    const [tempSelectedProductIds, setTempSelectedProductIds] = useState<
        string[]
    >([]);
    const [tempProductsWithQuantity, setTempProductsWithQuantity] = useState<
        ProductWithQuantity[]
    >([]);
    // Removed local editing state from parent; handled by TitleEditor
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    useEffect(() => {
        setDeal(initialDeal);
    }, [initialDeal]);

    // Navigation logic
    const getCurrentDealIndex = useCallback(() => {
        if (!deal || !allDealsInStage?.length) return -1;
        return allDealsInStage.findIndex((d) => d.id === deal.id);
    }, [deal, allDealsInStage]);

    const currentDealIndex = getCurrentDealIndex();
    const actualCanNavigatePrevious = currentDealIndex > 0;
    const actualCanNavigateNext =
        currentDealIndex < (allDealsInStage?.length || 0) - 1;

    // Navigation handlers
    const handlePrevious = useCallback(() => {
        if (onPrevious) {
            onPrevious();
        } else if (allDealsInStage && currentDealIndex > 0) {
            const previousDeal = allDealsInStage[currentDealIndex - 1];
            if (onDealChange) {
                onDealChange(previousDeal);
            } else {
                setDeal(previousDeal);
            }
        }
    }, [onPrevious, allDealsInStage, currentDealIndex, onDealChange]);

    const handleNext = useCallback(() => {
        if (onNext) {
            onNext();
        } else if (
            allDealsInStage &&
            currentDealIndex < allDealsInStage.length - 1
        ) {
            const nextDeal = allDealsInStage[currentDealIndex + 1];
            if (onDealChange) {
                onDealChange(nextDeal);
            } else {
                setDeal(nextDeal);
            }
        }
    }, [onNext, allDealsInStage, currentDealIndex, onDealChange]);
    const { data: productsResponse } = useGetProducts(orgId, {
        isManage: false,
    });
    const products = productsResponse?.data || [];
    const getCurrentStageIndex = useCallback(() => {
        const index = stages?.findIndex(
            (stage) => stage.stageId === deal?.stageId,
        );
        return index ?? 0;
    }, [deal?.stageId, stages]);

    const [selectedStageIndex, setSelectedStageIndex] = useState<number>(
        getCurrentStageIndex() ?? 0,
    );

    const queryClient = useQueryClient();
    const { data: userDetail } = useUserDetail();

    useEffect(() => {
        setSelectedStageIndex(getCurrentStageIndex() ?? 0);
    }, [deal?.stageId, stages, getCurrentStageIndex]);

    useEffect(() => {
        if (orgId && customerId && deal?.id) {
            queryClient.invalidateQueries({
                queryKey: ["orderDetailWithProduct", orgId, customerId],
            });
        }
    }, [queryClient, orgId, customerId, deal?.id]);

    useEffect(() => {
        if (deal?.orderDetail?.orderDetails) {
            const productIds = deal.orderDetail.orderDetails.map(
                (item) => item.product.id,
            );
            setSelectedProductIds(productIds);

            // Initialize products with quantity
            const productsWithQty = deal.orderDetail.orderDetails.map(
                (item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    name: item.product.name,
                    price: item.product.price,
                }),
            );
            setProductsWithQuantity(productsWithQty);
        } else {
            setSelectedProductIds([]);
            setProductsWithQuantity([]);
        }
    }, [deal?.orderDetail?.orderDetails]);

    const { data: taskDetailFromQuery, isLoading } = useBusinessProcessTaskById(
        orgId,
        deal?.id || "",
    );

    const { data: availableTagsData } = useGetBusinessProcessTags(
        orgId,
        workspaceId,
    );
    const availableTags = availableTagsData?.data || [];

    const createTagMutation = useCreateBusinessProcessTag(orgId);

    // Hook để cập nhật tags
    const updateTagsMutation = useUpdateBusinessProcessTaskTags(
        orgId,
        taskDetail?.id || "",
    );

    // State để quản lý tags đang edit
    const [editingTags, setEditingTags] = useState<BusinessProcessTag[]>([]);

    // Sync editingTags với taskDetail?.tags khi taskDetail thay đổi
    useEffect(() => {
        if (taskDetail?.tags) {
            setEditingTags(taskDetail.tags);
        }
    }, [taskDetail?.tags]);

    useEffect(() => {
        if (taskDetailFromQuery?.data) {
            setTaskDetail(taskDetailFromQuery.data);
            if (
                (taskDetailFromQuery.data.customerId &&
                    taskDetailFromQuery.data.customerId !== "") ||
                (taskDetailFromQuery.data.buId &&
                    taskDetailFromQuery.data.buId !== "")
            ) {
                const response = async () => {
                    const res = await getCustomerDetail(
                        orgId,
                        taskDetailFromQuery.data.customerId ||
                            taskDetailFromQuery.data.buId,
                    );
                    setCustomer(res.content);
                };
                response();
            }
        }
    }, [taskDetailFromQuery]);

    // Title input controlled inside TitleEditor

    if (!deal) return null;

    const orderDetail: OrderDetail | null = deal.orderDetail || null;

    const formatCurrency = (value: number | undefined | null) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "0 ₫";
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const stageHistory = stages?.map((stage, idx) => ({
        stage: stage.name,
        stageId: stage.stageId,
        date: idx === 0 ? "16/05/2025" : "",
        current: deal.stageId === stage.id,
    }));

    const { mutate: moveBusinessProcessTask } = useMoveBusinessProcessTask(
        orgId,
        deal.id,
    );

    const { mutate: updateOrder } = useOrder(orgId);

    const handleUpdateCustomerStage = (idx: number, stageId: string) => {
        setSelectedStageIndex(idx);
        const body: MoveBusinessProcessTask = {
            newStageId: stageId,
        };

        const newStageName =
            stages?.find((stage) => stage.stageId === stageId)?.name || "";

        const oldStageId = deal.stageId;
        setDeal((prevDeal) => {
            if (!prevDeal) return null;
            return {
                ...prevDeal,
                stageName: newStageName,
                stageId: stageId,
            };
        });

        moveBusinessProcessTask(body, {
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["businessProcessTaskById", orgId, deal.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ["dealDetail", orgId, deal.id],
                });

                if (oldStageId) {
                    queryClient.invalidateQueries({
                        queryKey: ["deals-by-stage", oldStageId],
                    });
                }
                queryClient.invalidateQueries({
                    queryKey: ["deals-by-stage", stageId],
                });

                if (onStageChange) {
                    const stageUpdateInfo = {
                        oldStageId,
                        newStageId: stageId,
                    };

                    // Gọi onStageChange với thông tin về các giai đoạn cần cập nhật
                    setTimeout(() => {
                        // @ts-ignore - Bỏ qua lỗi TypeScript nếu có
                        onStageChange(stageUpdateInfo);
                    }, 50);
                }

                // Refresh deal detail data sau khi invalidate
                // setTimeout(() => {
                //     if (deal.id) {
                //         getDealDetail(orgId, deal.id)
                //             .then((response) => {
                //                 if (response?.content) {
                //                     setDeal((prevDeal) => {
                //                         if (!prevDeal) return null;
                //                         return {
                //                             ...prevDeal,
                //                             ...response.content,
                //                             orderDetail: prevDeal.orderDetail,
                //                         };
                //                     });
                //                 }
                //             })
                //             .catch((error) => {
                //                 console.error(
                //                     "Error fetching updated deal:",
                //                     error
                //                 );
                //             });
                //     }
                // }, 100);
            },
        });
    };

    const handleProductsChange = (newSelectedProducts: string[]) => {
        setSelectedProductIds(newSelectedProducts);

        const updatedProductsWithQty = [...productsWithQuantity];

        // Remove products that are no longer selected
        const filteredProducts = updatedProductsWithQty.filter((p) =>
            newSelectedProducts.includes(p.productId),
        );

        // Add newly selected products with default quantity 1
        const existingProductIds = filteredProducts.map((p) => p.productId);
        const newProducts = newSelectedProducts
            .filter((id) => !existingProductIds.includes(id))
            .map((id) => {
                const productInfo = products.find((p) => p.id === id);
                return {
                    productId: id,
                    quantity: 1,
                    name: productInfo?.name,
                    price: productInfo?.price,
                };
            });

        setProductsWithQuantity([...filteredProducts, ...newProducts]);
    };

    const { mutate: updateFlowStep } = useUpdateBusinessProcessTaskStatus(
        orgId,
        deal.id,
    );
    const { mutateAsync: rollbackFlowStep } = useRollbackBusinessProcessTask(
        orgId,
        deal.id,
    );

    // Sửa hàm handleRollbackFlowStep để cập nhật UI tốt hơn
    const handleRollbackFlowStep = useCallback(async () => {
        // Optimistic UI update
        setDeal((prevDeal) => {
            if (!prevDeal) return null;
            return {
                ...prevDeal,
                flowStep: "",
            };
        });

        await rollbackFlowStep(undefined, {
            onSuccess: () => {
                updateTransactionStatus(orgId, taskDetail?.orderId || "", 1);
                setTaskDetail((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: 1,
                    };
                });
                if (refreshSingleStageData) {
                    refreshSingleStageData(taskDetail?.stageId || "");
                }
                onClose();
            },
        });
    }, [
        deal.id,
        deal.stageId,
        taskDetail,
        orgId,
        rollbackFlowStep,
        refreshSingleStageData,
        onClose,
    ]);
    // Sửa hàm handleUpdateFlowStep để cập nhật UI tốt hơn
    const handleUpdateFlowStep = useCallback(
        (isComplete = true, reason = "", note = "") => {
            updateFlowStep(
                {
                    isSuccess: isComplete,
                    note: reason,
                },
                {
                    onSuccess: () => {
                        setTaskDetail((prev) => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                status: isComplete ? 2 : 3,
                            };
                        });
                        updateTransactionStatus(
                            orgId,
                            taskDetail?.orderId || "",
                            isComplete ? 2 : 3,
                        );
                        if (refreshSingleStageData) {
                            refreshSingleStageData(taskDetail?.stageId || "");
                        }
                        onClose();
                    },
                },
            );
        },
        [
            deal.id,
            deal.stageId,
            taskDetail,
            orgId,
            onStageChange,
            queryClient,
            updateFlowStep,
            refreshSingleStageData,
            onClose,
        ],
    );

    // Sử dụng useCallback cho các hàm xử lý để tránh tạo lại mỗi khi render
    const handleFailureButtonClick = useCallback(() => {
        setIsFailureDialogOpen(true);
    }, []);

    const handleFailureConfirm = useCallback(() => {
        handleUpdateFlowStep(false, failureReason, failureNote);
        setIsFailureDialogOpen(false);
        setFailureReason("");
        setFailureNote("");
    }, [failureReason, failureNote, handleUpdateFlowStep]);

    // Update quantity for a product
    const updateQuantity = (productId: string, change: number) => {
        setProductsWithQuantity((prev) =>
            prev.map((item) => {
                if (item.productId === productId) {
                    const newQuantity = Math.max(1, item.quantity + change);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }),
        );
    };

    // Save product changes
    const saveProductChanges = () => {
        if (!deal || !customerId) return;

        setIsUpdatingProducts(true);

        // Get current user ID (actor) from user details
        const actorId = userDetail?.id || "current-user-id";

        // Calculate total price with safety checks
        const totalPrice = productsWithQuantity.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            const price = product?.price || 0;
            const quantity = item.quantity || 1;
            return sum + price * quantity;
        }, 0);

        // Prepare order body
        const orderBody = {
            id: deal.orderDetail?.id || "", // Include existing order ID if available
            customerId: customerId,
            actor: actorId,
            totalPrice: totalPrice,
            orderDetails: productsWithQuantity.map(
                ({ productId, quantity }) => ({
                    productId,
                    quantity: quantity || 1, // Ensure quantity is never undefined
                    unitPrice:
                        products.find((p) => p.id === productId)?.price || 0,
                }),
            ),
        };

        updateOrder(orderBody, {
            onSuccess: (response) => {
                // Check if response is valid
                if (response && typeof response === "object") {
                    try {
                        // Tạo một đối tượng OrderDetail từ response
                        const updatedOrderDetail: OrderDetail = {
                            id:
                                (response as any).id ||
                                deal.orderDetail?.id ||
                                "",
                            customerId: customerId,
                            totalPrice: totalPrice,
                            orderDetails: productsWithQuantity.map((item) => {
                                const product = products.find(
                                    (p) => p.id === item.productId,
                                );
                                return {
                                    id: "", // ID sẽ được tạo bởi server
                                    productId: item.productId,
                                    quantity: item.quantity || 1,
                                    product: {
                                        id: item.productId,
                                        name: product?.name || "Sản phẩm",
                                        description: product?.description || "",
                                        price: product?.price || 0,
                                        image: product?.image || "",
                                        status: true,
                                    },
                                };
                            }),
                        };

                        // Update local deal state with new order details
                        setDeal((prev) => {
                            if (!prev) return null;

                            const updatedDeal = {
                                ...prev,
                                orderDetail: updatedOrderDetail,
                            };

                            return updatedDeal;
                        });

                        // Inform parent to sync its caches (DealsPage)
                        try {
                            onOrderUpdated?.({
                                dealId: deal.id,
                                order: updatedOrderDetail,
                                totalPrice,
                            });
                        } catch {}

                        // Invalidate relevant queries to refresh data
                        queryClient.invalidateQueries({
                            queryKey: [
                                "orderDetailWithProduct",
                                orgId,
                                customerId,
                            ],
                        });

                        // Invalidate deals queries to update total values
                        queryClient.invalidateQueries({ queryKey: ["deals"] });
                        queryClient.invalidateQueries({
                            queryKey: ["deals-by-stage"],
                        });

                        // Force refetch to ensure fresh data
                        queryClient.refetchQueries({
                            queryKey: [
                                "orderDetailWithProduct",
                                orgId,
                                customerId,
                            ],
                        });

                        // Trigger pipeline refresh to update deal values in kanban
                        if (onStageChange) {
                            setTimeout(() => {
                                onStageChange();
                            }, 100);
                        }

                        setIsUpdatingProducts(false);
                        setIsEdit(false);
                        toast.success("Cập nhật sản phẩm thành công");
                    } catch (error) {
                        console.error("Error processing response:", error);
                        setIsUpdatingProducts(false);
                        toast.error("Lỗi xử lý phản hồi từ máy chủ");
                    }
                } else {
                    console.error("Invalid response format:", response);
                    setIsUpdatingProducts(false);
                    toast.error(
                        "Cập nhật thất bại: Định dạng phản hồi không hợp lệ",
                    );
                }
            },
            onError: (error) => {
                console.error("Error updating products:", error);
                setIsUpdatingProducts(false);
                toast.error("Cập nhật sản phẩm thất bại");
            },
        });
    };

    // Handle opening product edit dialog
    const handleOpenProductEditDialog = () => {
        // Initialize temp state with current values
        setTempSelectedProductIds(selectedProductIds);
        setTempProductsWithQuantity([...productsWithQuantity]);
        setIsProductEditDialogOpen(true);
    };

    // Handle closing product edit dialog
    const handleCloseProductEditDialog = () => {
        setIsProductEditDialogOpen(false);
        // Reset temp state
        setTempSelectedProductIds([]);
        setTempProductsWithQuantity([]);
    };

    // Handle saving product changes from dialog
    const handleSaveProductChangesFromDialog = () => {
        if (!deal || !customerId) return;

        setIsUpdatingProducts(true);

        // Get current user ID (actor) from user details
        const actorId = userDetail?.id || "current-user-id";

        // Calculate total price with safety checks
        const totalPrice = tempProductsWithQuantity.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            const price = product?.price || 0;
            const quantity = item.quantity || 1;
            return sum + price * quantity;
        }, 0);

        // Prepare order body
        const orderBody = {
            id: deal.orderDetail?.id || "", // Include existing order ID if available
            customerId: customerId,
            actor: actorId,
            totalPrice: totalPrice,
            workspaceId: workspaceId,
            orderDetails: tempProductsWithQuantity.map(
                ({ productId, quantity }) => ({
                    productId,
                    quantity: quantity || 1, // Ensure quantity is never undefined
                    unitPrice:
                        products.find((p) => p.id === productId)?.price || 0,
                }),
            ),
        };

        updateOrder(orderBody, {
            onSuccess: (response) => {
                // Update main state with temp values
                setSelectedProductIds(tempSelectedProductIds);
                setProductsWithQuantity(tempProductsWithQuantity);

                // Update deal state and invalidate queries (same logic as saveProductChanges)
                if (response && typeof response === "object") {
                    try {
                        const updatedOrderDetail: OrderDetail = {
                            id:
                                (response as any).id ||
                                deal.orderDetail?.id ||
                                "",
                            customerId: customerId,
                            workspaceId: workspaceId,
                            totalPrice: totalPrice,
                            orderDetails: tempProductsWithQuantity.map(
                                (item) => {
                                    const product = products.find(
                                        (p) => p.id === item.productId,
                                    );
                                    return {
                                        id: "",
                                        productId: item.productId,
                                        quantity: item.quantity || 1,
                                        product: {
                                            id: item.productId,
                                            name: product?.name || "Sản phẩm",
                                            description:
                                                product?.description || "",
                                            price: product?.price || 0,
                                            image: product?.image || "",
                                            status: true,
                                        },
                                    };
                                },
                            ),
                        };

                        setDeal((prev) => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                orderDetail: updatedOrderDetail,
                            };
                        });

                        // Optimistically update query cache so UI reflects new products immediately
                        try {
                            queryClient.setQueryData(
                                ["orderDetailWithProduct", orgId, customerId],
                                (prev: any) => {
                                    if (!prev)
                                        return { data: updatedOrderDetail };
                                    if (prev?.data) {
                                        return {
                                            ...prev,
                                            data: updatedOrderDetail,
                                        };
                                    }
                                    if (prev?.content) {
                                        return {
                                            ...prev,
                                            content: updatedOrderDetail,
                                        };
                                    }
                                    return updatedOrderDetail;
                                },
                            );
                        } catch (e) {
                            console.warn(
                                "Unable to set optimistic cache for order detail",
                                e,
                            );
                        }

                        // Inform parent to sync its caches (DealsPage)
                        try {
                            onOrderUpdated?.({
                                dealId: deal.id,
                                order: updatedOrderDetail,
                                totalPrice,
                            });
                        } catch {}

                        const doInvalidate = () => {
                            queryClient.invalidateQueries({
                                queryKey: [
                                    "orderDetailWithProduct",
                                    orgId,
                                    customerId,
                                ],
                            });
                            queryClient.invalidateQueries({
                                queryKey: ["deals"],
                            });
                            queryClient.invalidateQueries({
                                queryKey: ["deals-by-stage"],
                            });
                            queryClient.refetchQueries({
                                queryKey: [
                                    "orderDetailWithProduct",
                                    orgId,
                                    customerId,
                                ],
                            });
                        };

                        // Link order to current task if available, then invalidate
                        try {
                            const createdOrderId =
                                (response as any)?.data?.orderId ||
                                (response as any)?.id ||
                                updatedOrderDetail.id ||
                                "";
                            if (createdOrderId && taskDetail?.id) {
                                // Lazy import to avoid circulars at top
                                // eslint-disable-next-line @typescript-eslint/no-var-requires
                                const {
                                    linkOrder,
                                } = require("@/api/businessProcess");
                                linkOrder(orgId, taskDetail.id, createdOrderId)
                                    .then(() => doInvalidate())
                                    .catch((err: any) => {
                                        console.error("linkOrder error", err);
                                        doInvalidate();
                                    });
                                setTaskDetail((prev) =>
                                    prev
                                        ? { ...prev, orderId: createdOrderId }
                                        : prev,
                                );
                            } else {
                                doInvalidate();
                            }
                        } catch (e) {
                            console.error("Error linking order:", e);
                            doInvalidate();
                        }

                        if (onStageChange) {
                            setTimeout(() => {
                                onStageChange();
                            }, 100);
                        }

                        setIsUpdatingProducts(false);
                        setIsProductEditDialogOpen(false);
                        toast.success("Cập nhật sản phẩm thành công");
                    } catch (error) {
                        console.error("Error processing response:", error);
                        setIsUpdatingProducts(false);
                        toast.error("Lỗi xử lý phản hồi từ máy chủ");
                    }
                } else {
                    console.error("Invalid response format:", response);
                    setIsUpdatingProducts(false);
                    toast.error(
                        "Cập nhật thất bại: Định dạng phản hồi không hợp lệ",
                    );
                }
            },
            onError: (error) => {
                console.error("Error updating products:", error);
                setIsUpdatingProducts(false);
                toast.error("Cập nhật sản phẩm thất bại");
            },
        });
    };

    // Update quantity for temp products in dialog
    const updateTempQuantity = (productId: string, change: number) => {
        setTempProductsWithQuantity((prev) =>
            prev.map((item) => {
                if (item.productId === productId) {
                    const newQuantity = Math.max(1, item.quantity + change);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }),
        );
    };

    // Handle product selection change in dialog
    const handleTempProductsChange = (newProductIds: string[]) => {
        setTempSelectedProductIds(newProductIds);

        // Create new products with quantity for selected products
        const newProductsWithQuantity = newProductIds.map((productId) => {
            const existingProduct = tempProductsWithQuantity.find(
                (item) => item.productId === productId,
            );
            const product = products.find((p) => p.id === productId);

            return (
                existingProduct || {
                    productId,
                    quantity: 1,
                    name: product?.name || "",
                    price: product?.price || 0,
                }
            );
        });

        setTempProductsWithQuantity(newProductsWithQuantity);
    };

    const { mutate: archieveTask } = useArchieveBusinessProcessTask(
        orgId,
        deal.id,
    );

    const { mutate: unarchieveTask } = useUnarchieveBusinessProcessTask(
        orgId,
        deal.id,
    );

    const { mutate: duplicateTask } = useDuplicateBusinessProcessTask(
        orgId,
        deal.id,
    );

    const { mutate: deleteTask } = useDeleteBusinessProcessTask(orgId, deal.id);

    const handleArchieveTask = (stageId: string) => {
        archieveTask(undefined, {
            onSuccess: () => {
                if (refreshSingleStageData) {
                    refreshSingleStageData(stageId);
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ["deals-by-stage", stageId],
                    });
                }
                onClose();
            },
        });
    };
    const handleUnarchieveTask = (stageId: string) => {
        unarchieveTask(undefined, {
            onSuccess: () => {
                if (refreshSingleStageData) {
                    refreshSingleStageData(stageId);
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ["deals-by-stage", stageId],
                    });
                }
                onClose();
            },
        });
    };
    const handleDuplicateTask = (stageId: string) => {
        duplicateTask(undefined, {
            onSuccess: () => {
                if (refreshSingleStageData) {
                    refreshSingleStageData(stageId);
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ["deals-by-stage", stageId],
                    });
                }
                onClose();
            },
        });
    };
    const handleDeleteTask = (stageId: string) => {
        deleteTask(undefined, {
            onSuccess: () => {
                if (refreshSingleStageData) {
                    refreshSingleStageData(stageId);
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ["deals-by-stage", stageId],
                    });
                }
                onClose();
            },
        });
    };

    const { mutate: partialUpdateTask } = usePartialUpdateBusinessProcessTask(
        orgId,
        deal.id,
    );

    const handlePartialUpdateTask = (body: Partial<BuinessProcessTask>) => {
        partialUpdateTask(body, {
            onSuccess: () => {
                refreshSingleStageData?.(taskDetail?.stageId || "");
            },
            onError: (error) => {
                console.error(error);
            },
        });
    };

    const handleRevertToLead = async (stageId: string) => {
        if (!taskDetail?.leadId) return;
        const response = await rollbackLeadFlowStep(orgId, taskDetail.leadId);
        if (response.code === 0) {
            archieveTask(undefined, {
                onSuccess: () => {
                    if (refreshSingleStageData) {
                        refreshSingleStageData(stageId);
                    } else {
                        queryClient.invalidateQueries({
                            queryKey: ["deals-by-stage", stageId],
                        });
                    }
                },
            });
        }
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={onClose}
                />
            )}

            {/* Slide-out panel - 60% width */}
            <div
                className={cn(
                    "translate-x-0 fixed inset-y-0 right-0 w-[80%] bg-background border-l z-50 transition-transform duration-300 ease-out flex flex-col",
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                    <div className="flex items-center gap-4">
                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
                            <TooltipProvider>
                                <Tooltip content="Đóng">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={onClose}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                            <div className="w-px h-4 bg-border" />
                            <TooltipProvider>
                                <Tooltip content="Trước">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handlePrevious}
                                        disabled={!actualCanNavigatePrevious}
                                    >
                                        <ChevronUp className="size-4" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                            <div className="w-px h-4 bg-border" />
                            <TooltipProvider>
                                <Tooltip content="Tiếp theo">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handleNext}
                                        disabled={!actualCanNavigateNext}
                                    >
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">
                                {(stages?.find(
                                    (s) => s.stageId === deal.stageId,
                                )?.index ?? -1) + 1 || "1"}{" "}
                                trên {stages?.length || totalStages} trong giai
                                đoạn{" "}
                                <span className="font-bold text-black">
                                    {deal.stageName || ""}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {taskDetail?.status === 2 ? (
                            <>
                                <Button
                                    onClick={handleRollbackFlowStep}
                                    variant={"outline"}
                                >
                                    <span className="text-sm">Mở lại</span>
                                </Button>
                                <Button className="p-1 rounded bg-green-500 hover:bg-green-600">
                                    <Check className="size-4" />
                                    <span className="text-sm">
                                        Đã thành công
                                    </span>
                                </Button>
                            </>
                        ) : taskDetail?.status === 3 ? (
                            <>
                                <Button
                                    onClick={onClose}
                                    className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <X className="size-4" />
                                    <span className="text-sm">Đã thất bại</span>
                                </Button>
                                <Button
                                    onClick={handleRollbackFlowStep}
                                    variant={"outline"}
                                >
                                    <span className="text-sm">Mở lại</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleFailureButtonClick}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <X className="size-4" />
                                    <span className="text-sm">Thất bại</span>
                                </Button>
                                <Button
                                    onClick={() => handleUpdateFlowStep()}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                    <Check className="size-4" />
                                    <span className="text-sm">Thành công</span>
                                </Button>
                            </>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="p-1 rounded "
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <Button
                                    variant={"ghost"}
                                    className="w-full justify-start"
                                >
                                    <Earth className="size-4" />
                                    <span>Công khai</span>
                                </Button>
                                {taskDetail?.status === 1 && (
                                    <Button
                                        variant={"ghost"}
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleArchieveTask(
                                                taskDetail?.stageId || "",
                                            )
                                        }
                                    >
                                        <Archive className="size-4" />
                                        <span>Lưu trữ</span>
                                    </Button>
                                )}
                                {taskDetail?.status === 5 && (
                                    <Button
                                        variant={"ghost"}
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleUnarchieveTask(
                                                taskDetail.stageId,
                                            )
                                        }
                                    >
                                        <Archive className="size-4" />
                                        <span>Mở lại</span>
                                    </Button>
                                )}
                                {taskDetail?.leadId && (
                                    <Button
                                        variant={"ghost"}
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleRevertToLead(
                                                taskDetail?.stageId || "",
                                            )
                                        }
                                    >
                                        <Heart className="size-4" />
                                        <span>Chuyển sang chăm khách</span>
                                    </Button>
                                )}
                                <Button
                                    variant={"ghost"}
                                    className="w-full justify-start"
                                    onClick={() =>
                                        handleDuplicateTask(
                                            taskDetail?.stageId || "",
                                        )
                                    }
                                >
                                    <Copy className="size-4" />
                                    <span>Nhân bản</span>
                                </Button>
                                <Button
                                    variant={"ghost"}
                                    className="w-full justify-start"
                                    onClick={() =>
                                        handleDeleteTask(
                                            taskDetail?.stageId || "",
                                        )
                                    }
                                >
                                    <Trash2 className="size-4" />
                                    <span>Xóa</span>
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Body - Split into 2 columns */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Section - Deal Info & Contact - 30% */}

                    {/* Right Section - Stages & Activity - 70% */}
                    <div className="w-[60%] flex flex-col border-r h-full">
                        {/* Stage Progress */}
                        <div className="p-4 border-b">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TitleEditor
                                        name={taskDetail?.name || ""}
                                        onSave={(newName) => {
                                            setTaskDetail((prev) =>
                                                prev
                                                    ? { ...prev, name: newName }
                                                    : prev,
                                            );
                                            handlePartialUpdateTask({
                                                name: newName,
                                            });
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground ml-2">
                                        Ở giai đoạn này trong{" "}
                                        {getDaysInStage(
                                            taskDetail?.stageHistory.find(
                                                (item) =>
                                                    item.stageId ===
                                                    deal.stageId,
                                            )?.createdDate || "",
                                        )}{" "}
                                    </span>
                                </div>
                            </div>

                            {/* Horizontal pill-style stages */}
                            <div
                                className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2 cursor-grab active:cursor-grabbing"
                                style={{
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none",
                                    scrollBehavior: "smooth",
                                    userSelect: "none",
                                }}
                                onMouseDown={(e) => {
                                    const container = e.currentTarget;
                                    const startX =
                                        e.pageX - container.offsetLeft;
                                    const scrollLeft = container.scrollLeft;
                                    let isDown = true;

                                    const handleMouseMove = (e: MouseEvent) => {
                                        if (!isDown) return;
                                        e.preventDefault();
                                        const x =
                                            e.pageX - container.offsetLeft;
                                        const walk = (x - startX) * 2;
                                        container.scrollLeft =
                                            scrollLeft - walk;
                                    };

                                    const handleMouseUp = () => {
                                        isDown = false;
                                        document.removeEventListener(
                                            "mousemove",
                                            handleMouseMove,
                                        );
                                        document.removeEventListener(
                                            "mouseup",
                                            handleMouseUp,
                                        );
                                    };

                                    document.addEventListener(
                                        "mousemove",
                                        handleMouseMove,
                                    );
                                    document.addEventListener(
                                        "mouseup",
                                        handleMouseUp,
                                    );
                                }}
                                onTouchStart={(e) => {
                                    const container = e.currentTarget;
                                    const touch = e.touches[0];
                                    const startX =
                                        touch.pageX - container.offsetLeft;
                                    const scrollLeft = container.scrollLeft;
                                    let isDown = true;

                                    const handleTouchMove = (e: TouchEvent) => {
                                        if (!isDown) return;
                                        const touch = e.touches[0];
                                        const x =
                                            touch.pageX - container.offsetLeft;
                                        const walk = (x - startX) * 2;
                                        container.scrollLeft =
                                            scrollLeft - walk;
                                    };

                                    const handleTouchEnd = () => {
                                        isDown = false;
                                        document.removeEventListener(
                                            "touchmove",
                                            handleTouchMove,
                                        );
                                        document.removeEventListener(
                                            "touchend",
                                            handleTouchEnd,
                                        );
                                    };

                                    document.addEventListener(
                                        "touchmove",
                                        handleTouchMove,
                                        { passive: false },
                                    );
                                    document.addEventListener(
                                        "touchend",
                                        handleTouchEnd,
                                    );
                                }}
                            >
                                {stageHistory?.map((stage, idx) => {
                                    // Tìm stage history tương ứng từ taskDetail
                                    const stageHistoryItem =
                                        taskDetail?.stageHistory?.find(
                                            (item) =>
                                                item.stageId === stage.stageId,
                                        );

                                    // Tính số ngày ở giai đoạn này
                                    const stageDate =
                                        stageHistoryItem?.updatedDate ||
                                        stageHistoryItem?.createdDate;
                                    const daysInStage = getDaysInStage(
                                        stageDate || "",
                                    );

                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center"
                                        >
                                            <TooltipProvider>
                                                <Tooltip
                                                    content={
                                                        !daysInStage.includes(
                                                            "NaN",
                                                        ) && (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        daysInStage
                                                                    }
                                                                </span>
                                                            </div>
                                                        )
                                                    }
                                                >
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                "relative px-3 py-1.5 text-xs rounded-full border transition-all hover:shadow-sm whitespace-nowrap min-w-fit flex-shrink-0",
                                                                selectedStageIndex >=
                                                                    idx
                                                                    ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                                                                    : "bg-background text-muted-foreground border-border hover:border-sidebar-primary/30",
                                                            )}
                                                            onClick={() => {
                                                                handleUpdateCustomerStage(
                                                                    idx,
                                                                    stage.stageId,
                                                                );
                                                            }}
                                                            onMouseDown={(
                                                                e,
                                                            ) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            {stage.stage}
                                                            {/* Arrow connector for selected stage */}
                                                            {selectedStageIndex ===
                                                                idx &&
                                                                idx <
                                                                    stageHistory.length -
                                                                        1 && (
                                                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[8px] border-l-sidebar-primary border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
                                                                )}
                                                        </button>
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </TooltipProvider>
                                            {/* Connecting line */}
                                            {idx < stageHistory?.length - 1 && (
                                                <div
                                                    className={cn(
                                                        "w-4 h-0.5 mx-1 transition-colors flex-shrink-0",
                                                        selectedStageIndex > idx
                                                            ? "bg-sidebar-primary"
                                                            : "bg-border",
                                                    )}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {deal.workspaceId &&
                            (taskDetail?.customerId ||
                                taskDetail?.leadId ||
                                taskDetail?.buId) && (
                                <MemoTabsUserDetail
                                    taskId={taskDetail?.id || null}
                                    provider="bpt"
                                    customer={customer || ({} as CustomerInfo)}
                                    orgId={orgId}
                                    workspaceId={deal?.workspaceId}
                                    refreshStage={() =>
                                        refreshSingleStageData?.(
                                            taskDetail?.stageId || "",
                                        )
                                    }
                                />
                            )}
                    </div>

                    <ScrollArea className="w-[40%] overflow-y-auto">
                        {/* Deal Info Section */}
                        <div className="p-4 border-b">
                            <div className="space-y-3 text-sm">
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-medium flex items-center gap-1">
                                        Chi tiết
                                    </h4>
                                    <div className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4 text-muted-foreground" />
                                            <span className="text-muted-foreground w-20">
                                                Ngày tạo
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {taskDetail?.createdDate
                                                ? new Date(
                                                      taskDetail?.createdDate,
                                                  ).toLocaleDateString()
                                                : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="size-4 text-muted-foreground" />
                                            <span className="text-muted-foreground w-20">
                                                Giá trị
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {formatCurrency(
                                                orderDetail?.totalPrice || 0,
                                            )}
                                        </span>
                                    </div>

                                    <EditableFieldRow
                                        icon={
                                            <Image
                                                src={"/icons/tag.svg"}
                                                alt="tag"
                                                width={20}
                                                height={20}
                                            />
                                        }
                                        label="Nhãn"
                                    >
                                        <EditableDealTagsValue
                                            tags={editingTags}
                                            orgId={orgId}
                                            workspaceId={workspaceId}
                                            taskId={taskDetail?.id || ""}
                                            availableTags={availableTags}
                                            onTagsChange={(
                                                tagIds: string[],
                                            ) => {
                                                const newTags =
                                                    availableTags.filter(
                                                        (tag) =>
                                                            tagIds.includes(
                                                                tag.id,
                                                            ),
                                                    );
                                                setEditingTags(newTags);
                                                updateTagsMutation.mutate(
                                                    newTags.map(
                                                        (tag) => tag.id,
                                                    ),
                                                );
                                            }}
                                            onCreateTag={async (
                                                tag: Partial<BusinessProcessTag>,
                                            ) => {
                                                try {
                                                    await createTagMutation.mutateAsync(
                                                        {
                                                            workspaceId,
                                                            name:
                                                                tag.name || "",
                                                            textColor:
                                                                tag.textColor ||
                                                                "#FFFFFF",
                                                            backgroundColor:
                                                                tag.backgroundColor ||
                                                                "#3B82F6",
                                                        },
                                                    );
                                                } catch (error) {
                                                    console.error(
                                                        "Error creating tag:",
                                                        error,
                                                    );
                                                }
                                            }}
                                        />
                                    </EditableFieldRow>
                                    <EditableFieldRow
                                        icon={
                                            <User className="size-4 text-muted-foreground" />
                                        }
                                        label={t("common.assignee")}
                                    >
                                        <EditableAssigneeValue
                                            assignee={taskDetail?.assignedTo.find(
                                                (x) => x.type === "OWNER",
                                            )}
                                            orgId={orgId}
                                            taskId={taskDetail?.id || ""}
                                            followers={
                                                taskDetail?.assignedTo.filter(
                                                    (x) =>
                                                        x.type === "FOLLOWER",
                                                ) || []
                                            }
                                        />
                                    </EditableFieldRow>

                                    <EditableFieldRow
                                        icon={
                                            <Image
                                                src={
                                                    "/icons/user_circle_check.svg"
                                                }
                                                alt="user_circle_check"
                                                width={20}
                                                height={20}
                                            />
                                        }
                                        label={t("common.follower")}
                                        onSave={async () => {
                                            // Callback này sẽ được gọi khi user xác nhận trong EditableAssigneeValue
                                            // EditableAssigneeValue sẽ tự động gọi setIsEditing(false) sau khi hoàn thành
                                        }}
                                        onCancel={() => {
                                            // Callback này sẽ được gọi khi user hủy
                                        }}
                                        isDisplayButton={false}
                                    >
                                        <EditableAssigneesValue
                                            assignees={
                                                taskDetail?.assignedTo.filter(
                                                    (x) =>
                                                        x.type === "FOLLOWER",
                                                ) || []
                                            }
                                            orgId={orgId}
                                            taskId={taskDetail?.id || ""}
                                            // customerId={taskDetail?.id || ""}
                                            owner={
                                                taskDetail?.assignedTo.find(
                                                    (x) => x.type === "OWNER",
                                                )?.id || ""
                                            }
                                        />
                                    </EditableFieldRow>
                                </div>

                                {/* Hiển thị danh sách sản phẩm */}

                                <div className="mt-4 border-t pt-3">
                                    <div className="flex items-center justify-between gap-2 ">
                                        <h4 className="font-medium flex items-center gap-1">
                                            Sản phẩm
                                        </h4>
                                        <Button
                                            onClick={
                                                handleOpenProductEditDialog
                                            }
                                            variant={"ghost"}
                                            size={"icon"}
                                        >
                                            <EditIcon className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {orderDetail?.orderDetails &&
                                        Array.isArray(
                                            orderDetail.orderDetails,
                                        ) &&
                                        orderDetail.orderDetails.length > 0 ? (
                                            <>
                                                {orderDetail.orderDetails.map(
                                                    (item) => (
                                                        <div
                                                            key={
                                                                item.id ||
                                                                item.productId
                                                            }
                                                            className=""
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-muted-foreground w-7">
                                                                        x
                                                                        {item.quantity ||
                                                                            1}
                                                                    </span>
                                                                    <span className="text-muted-foreground w-40">
                                                                        {item
                                                                            .product
                                                                            ?.name ||
                                                                            "Sản phẩm"}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm font-medium text-muted-foreground mt-1">
                                                                    {formatCurrency(
                                                                        (item
                                                                            .product
                                                                            ?.price ||
                                                                            0) *
                                                                            (item.quantity ||
                                                                                1),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                                <div className="mt-3 flex justify-between font-medium">
                                                    <span>Tổng cộng:</span>
                                                    <span className="text-muted-foreground">
                                                        {formatCurrency(
                                                            orderDetail?.totalPrice,
                                                        )}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-center text-muted-foreground italic">
                                                Chưa có sản phẩm
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <CustomerDetailComponent
                            taskDetail={taskDetail}
                            orgId={orgId}
                            workspaceId={workspaceId}
                        />
                    </ScrollArea>
                </div>
            </div>

            {/* Failure Dialog */}
            {isFailureDialogOpen && (
                <FailDialog
                    isFailureDialogOpen={isFailureDialogOpen}
                    setIsFailureDialogOpen={setIsFailureDialogOpen}
                    failureReason={failureReason}
                    setFailureReason={setFailureReason}
                    failureNote={failureNote}
                    setFailureNote={setFailureNote}
                    handleFailureConfirm={handleFailureConfirm}
                />
            )}

            {/* Product Edit Dialog */}
            {isProductEditDialogOpen && (
                <ProductEditDialog
                    isOpen={isProductEditDialogOpen}
                    onClose={handleCloseProductEditDialog}
                    onSave={handleSaveProductChangesFromDialog}
                    orgId={orgId}
                    selectedProducts={tempSelectedProductIds}
                    onProductsChange={handleTempProductsChange}
                    productsWithQuantity={tempProductsWithQuantity}
                    onQuantityUpdate={updateTempQuantity}
                    products={products}
                    isLoading={isUpdatingProducts}
                />
            )}
        </>
    );
}

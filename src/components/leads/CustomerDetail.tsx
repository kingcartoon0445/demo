import { updateRating } from "@/api/customer";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CustomerUpdateProvider } from "@/contexts/CustomerUpdateContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    useLeadDetailApi,
    useUpdateLeadField,
} from "@/hooks/useCustomerDetail";
import {
    useArchiveLead,
    useArchiveRestoreLead,
    useDeleteLead,
    useUpdateLeadAvatar,
} from "@/hooks/useCustomerV2";
import { Customer, Lead } from "@/lib/interface";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Check,
    EditIcon,
    Loader2,
    MoreHorizontalIcon,
    PhoneIcon,
    Star as StarIcon,
    Trash,
    X,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import { BiArchiveIn } from "react-icons/bi";
import ConfirmDialog from "../common/ConfirmDialog";
import FindCustomerModal from "../common/FindCustomerModal";
import LinkCustomer from "../common/LinkCustomer";
import Loading from "../common/Loading";
import CustomerDetailSection from "../customer/CustomerDetailSection";
import LeadDetailSection from "../customer/LeadDetailSection";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import {
    ConvertToDealPopup,
    ConvertToDealFormValues,
} from "./ConvertToDealPopup";
import { getCustomerDetail, updateLeadAvatar } from "@/api/customerV2";

type ConvertToDealData = ConvertToDealFormValues;

interface CustomerDetailProps {
    customer: Lead | null;
    orgId?: string;
    workspaceId?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleteSuccess?: () => void;
    isArchiveMode?: boolean;
    onSelectCustomer?: (customer: Lead | null) => void;
    onProviderChange?: (provider: string) => void;
    onOpenAddCustomerModal?: () => void;
}

// Star Rating Component
const StarRating = ({
    rating = 0,
    orgId,
    workspaceId,
    customerId,
    onRatingUpdate,
}: {
    rating?: number;
    orgId?: string;
    workspaceId?: string;
    customerId?: string;
    onRatingUpdate?: () => void;
}) => {
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStarClick = async (starValue: number) => {
        if (!orgId || !workspaceId || !customerId || isUpdating) return;

        setIsUpdating(true);
        try {
            await updateRating(orgId, workspaceId, customerId, starValue);
            // Trigger callback to refresh data
            onRatingUpdate?.();
            toast.success(`Đã cập nhật đánh giá ${starValue} sao`);
        } catch (error) {
            console.error("Error updating rating:", error);
            toast.error("Có lỗi xảy ra khi cập nhật đánh giá");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex justify-center items-center gap-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                const isFilled = rating > 0 ? starValue <= rating : false;
                const isHovered =
                    hoveredStar !== null && starValue <= hoveredStar;
                const shouldShowYellow = isFilled || isHovered;

                return (
                    <button
                        key={index}
                        className={`transition-all duration-200 ${
                            isUpdating
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer hover:scale-110"
                        }`}
                        disabled={isUpdating}
                        onMouseEnter={() => setHoveredStar(starValue)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => handleStarClick(starValue)}
                    >
                        <StarIcon
                            className={`w-5 h-5 transition-colors duration-200 ${
                                shouldShowYellow
                                    ? "text-[#FFA500] fill-[#FFA500]"
                                    : "text-gray-300 fill-none"
                            }`}
                        />
                    </button>
                );
            })}
            {isUpdating && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin text-blue-500" />
            )}
        </div>
    );
};

export default function CustomerDetail({
    customer,
    orgId,
    workspaceId,
    open,
    onOpenChange,
    onDeleteSuccess,
    isArchiveMode,
    onSelectCustomer,
    onProviderChange,
    onOpenAddCustomerModal,
}: CustomerDetailProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isConvertPopupOpen, setIsConvertPopupOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const queryClient = useQueryClient();
    const [isFindCustomerModalOpen, setIsFindCustomerModalOpen] =
        useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    // Fetch customer detail data
    const {
        data: customerDetailResponse,
        isLoading,
        isError,
        error,
        refetch: refetchCustomerDetail,
    } = useLeadDetailApi(orgId || "", customer?.id || "");

    const customerDetail = customerDetailResponse?.content;
    const [customerFromLead, setCustomerFromLead] = useState<Customer | null>(
        null,
    );
    const handleConvertToDeal = (data: ConvertToDealData) => {
        // The actual API call is now handled inside the ConvertToDealPopup component
        // We'll refresh the data after the popup is closed
        refetchCustomerDetail();

        // Invalidate queries to refresh related data
        if (orgId && customer?.id) {
            queryClient.invalidateQueries({
                queryKey: ["customer-journey", orgId, customer.id],
            });
            queryClient.invalidateQueries({
                queryKey: ["infinite-customer-journey", orgId, customer.id],
            });
            // Invalidate deals queries if they exist
            queryClient.invalidateQueries({
                queryKey: ["dealStages"],
            });
            queryClient.invalidateQueries({
                queryKey: ["deals"],
            });
        }
    };

    useEffect(() => {
        if (customerDetail?.customer) {
            const getCustomer = async () => {
                const response = await getCustomerDetail(
                    orgId || "",
                    customerDetail?.customer?.id,
                );
                setCustomerFromLead(response.content);
            };
            getCustomer();
        }
    }, [customerDetail]);

    const handleSelectCustomer = (customer: {
        id: string;
        fullName: string;
        phone?: string;
    }) => {};

    const deleteCustomerMutation = useDeleteLead();

    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    const handleDeleteCustomer = async () => {
        if (orgId && customer?.id) {
            // Đóng sheet/panel nếu đang mở
            if (onOpenChange) {
                onOpenChange(false);
            }

            // Gọi API xóa khách hàng
            deleteCustomerMutation.mutate({
                orgId: orgId,
                customerId: customer.id,
                onDeleteSuccess: () => {
                    // Gọi callback từ props nếu có
                    if (onDeleteSuccess) {
                        onDeleteSuccess();
                    }
                },
            });
        }
    };

    const archiveCustomerMutation = useArchiveLead();
    const archiveRestoreCustomerMutation = useArchiveRestoreLead();

    const handleArchiveCustomer = () => {
        if (customer?.id) {
            // Đặt selectedCustomer về null ngay lập tức
            if (onSelectCustomer) {
                onSelectCustomer(null);
            }

            // Sau đó gọi API
            archiveCustomerMutation.mutate({
                orgId: orgId || "",
                customerId: customer.id || "",
                onArchiveSuccess: () => {
                    // Callback này vẫn được gọi sau khi API hoàn thành
                },
            });
        }
    };

    const handleRestoreCustomer = () => {
        if (customer?.id) {
            // Đặt selectedCustomer về null ngay lập tức
            if (onSelectCustomer) {
                onSelectCustomer(null);
            }

            // Sau đó gọi API
            archiveRestoreCustomerMutation.mutate({
                orgId: orgId || "",
                customerId: customer.id || "",
                onArchiveSuccess: () => {
                    // Callback này vẫn được gọi sau khi API hoàn thành
                },
            });
        }
    };

    const updateLeadFieldMutation = useUpdateLeadField(
        orgId || "",
        customer?.id || "",
    );

    interface TitleEditorProps {
        name: string;
        onSave: (newName: string) => void;
    }

    const handleOpenAddCustomerModal = () => {
        onProviderChange?.("customer");
        onOpenAddCustomerModal?.();
    };

    const updateLeadAvatarMutation = useUpdateLeadAvatar(
        orgId || "",
        customer?.id || "",
    );

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
                    <div className="ml-8 flex items-center gap-2 justify-center">
                        <h2
                            className="text-lg font-medium cursor-text"
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
                        >
                            <Check className="size-4" />
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

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            updateLeadAvatarMutation.mutate(formData);
        }
    };

    const renderContent = () => {
        if (!customer) {
            return (
                <div className="text-center text-muted-foreground p-6">
                    <p>Chọn khách hàng để xem thông tin</p>
                </div>
            );
        }

        if (isLoading) {
            return <Loading />;
        }

        if (isError) {
            return (
                <div className="text-center text-red-500 p-6">
                    <p>Lỗi tải thông tin: {error?.message}</p>
                </div>
            );
        }

        return (
            <>
                <div className="space-y-2 px-4 pb-4">
                    {/* Khối A - Thông tin tiêu đề */}
                    <div className="text-center space-y-2">
                        {/* Avatar */}
                        <div className="mx-auto w-[60px] h-[60px] relative">
                            <Avatar
                                name={
                                    getFirstAndLastWord(
                                        customerDetail?.fullName ||
                                            customer.fullName,
                                    ) || ""
                                }
                                src={
                                    getAvatarUrl(
                                        customerDetail?.avatar || "",
                                    ) || ""
                                }
                                round
                                size={"60"}
                                className="cursor-pointer"
                                onClick={() => {
                                    document
                                        .getElementById("avatar-upload")
                                        ?.click();
                                }}
                            />
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        {/* Tên */}
                        <h2 className="text-[18px] font-bold text-[#1F1F1F]">
                            <TitleEditor
                                name={customerDetail?.fullName || ""}
                                onSave={(newName) => {
                                    updateLeadFieldMutation.mutate({
                                        fieldName: "fullName",
                                        value: newName,
                                    });
                                }}
                            />
                        </h2>

                        {/* <div className="flex items-center justify-center">
                        <div className="flex-1 text-center">
                            <StarRating
                                rating={customerDetail?.rating || 0}
                                orgId={orgId}
                                workspaceId={workspaceId}
                                customerId={customer?.id}
                                onRatingUpdate={handleRatingUpdate}
                            />
                        </div>
                    </div> */}
                    </div>
                    {/* Khối B - Hành động chính */}
                    <div className="space-y-2">
                        {/* Button chính */}
                        <div className="flex justify-center gap-4">
                            <TooltipProvider>
                                <Tooltip
                                    content={t("common.call", {
                                        phone: customerDetail?.phone || "",
                                    })}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-8 h-8 border border-[#E8E8E8] flex items-center justify-center hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            if (customerDetail?.phone) {
                                                window.location.href = `tel:${customerDetail.phone}`;
                                            }
                                        }}
                                    >
                                        <PhoneIcon className="w-5 h-5 text-[#5E3BEE]" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                            {isArchiveMode ? (
                                <TooltipProvider>
                                    <Tooltip content={t("common.restore")}>
                                        <Button
                                            variant="outline"
                                            className="w-8 h-8 border border-[#E8E8E8] flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            onClick={handleRestoreCustomer}
                                        >
                                            <BiArchiveIn className="w-5 h-5 text-[#5E3BEE] transform rotate-180" />
                                        </Button>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip content={t("common.archive")}>
                                        <Button
                                            variant="outline"
                                            className="w-8 h-8 border border-[#E8E8E8] flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            onClick={handleArchiveCustomer}
                                        >
                                            <BiArchiveIn className="w-5 h-5 text-[#5E3BEE]" />
                                        </Button>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-8 h-8 border border-[#E8E8E8] flex items-center justify-center hover:bg-gray-50 transition-colors"
                                    >
                                        <MoreHorizontalIcon className="w-5 h-5 text-[#5E3BEE]" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56"
                                    align="start"
                                >
                                    {/* <DropdownMenuItem>
                                    <EarthIcon className="w-4 h-4 mr-2" />
                                    Công khai
                                </DropdownMenuItem> */}
                                    <DropdownMenuItem
                                        className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                        onClick={handleDeleteClick}
                                    >
                                        <Trash className="w-4 h-4 mr-2 text-red-500" />
                                        {t("common.deleteLead")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Button
                            variant="default"
                            onClick={() => setIsConvertPopupOpen(true)}
                            className="w-full font-bold text-[14px] h-[36px] rounded-[8px] hover:bg-[#5E3BEE]/90 transition-colors"
                        >
                            {t("common.convertToDeal")}
                        </Button>

                        {/* Icons hành động */}
                    </div>
                    {/* Khối C - Thông tin chi tiết */}
                    <LeadDetailSection
                        leadDetail={customerDetail}
                        orgId={orgId || ""}
                    />
                    {customerDetail?.customer ? (
                        <CustomerDetailSection
                            leadId={customer?.id}
                            customerDetail={customerFromLead}
                            orgId={orgId || ""}
                            showCustomerName={true}
                        />
                    ) : (
                        <LinkCustomer
                            setIsFindCustomerModalOpen={
                                setIsFindCustomerModalOpen
                            }
                            handleOpenAddCustomerModal={
                                handleOpenAddCustomerModal
                            }
                        />
                    )}
                </div>
                <FindCustomerModal
                    orgId={orgId || ""}
                    open={isFindCustomerModalOpen}
                    onOpenChange={setIsFindCustomerModalOpen}
                    onSelect={handleSelectCustomer}
                    conversationId={customer?.id}
                    provider="lead"
                />
            </>
        );
    };

    const customerContent = renderContent();

    return (
        <CustomerUpdateProvider
            orgId={orgId || ""}
            customerId={customerFromLead?.id || ""}
            leadId={searchParams.get("lid") || ""}
            provider="lead"
        >
            <>
                {open ? (
                    <Sheet open={open} onOpenChange={onOpenChange}>
                        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                            <SheetHeader className="mb-5">
                                <SheetTitle>
                                    {t("common.customerDetail")}
                                </SheetTitle>
                                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">
                                        {t("common.close")}
                                    </span>
                                </SheetClose>
                            </SheetHeader>
                            {customerContent}
                        </SheetContent>
                    </Sheet>
                ) : (
                    <div className="h-full bg-background overflow-y-auto mt-2">
                        {customerContent}
                    </div>
                )}

                {/* Convert to Deal Popup */}
                {isConvertPopupOpen && customer && (
                    <ConvertToDealPopup
                        isOpen={isConvertPopupOpen}
                        onClose={() => setIsConvertPopupOpen(false)}
                        onConfirm={handleConvertToDeal}
                        leadId={customer.id}
                        leadName={customerDetail?.fullName || customer.fullName}
                        orgId={orgId || ""}
                        customerId={customerFromLead?.id}
                        customerName={customerDetail?.customer?.fullName}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={isDeleteConfirmOpen}
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    onConfirm={handleDeleteCustomer}
                    title={t("common.confirmDelete")}
                    description={t("common.confirmDeleteDescription")}
                    confirmText={t("common.delete")}
                    cancelText={t("common.cancel")}
                    variant="destructive"
                />
            </>
        </CustomerUpdateProvider>
    );
}

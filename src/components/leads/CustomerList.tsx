import { useMultiSelect } from "@/contexts/MultiSelectContext";
import { useLeadsFilter } from "@/hooks/leads_data";
import { useLeadStore } from "@/store/useLeadStore";
import { useInfiniteLeadsWithBodyFilter } from "@/hooks/useCustomerV2";
import { Lead } from "@/lib/interface";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { Globe, Loader2, MessageCircle, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import LastModifiedTime from "../LastModifiedTime";
import Loading from "../common/Loading";
import { Checkbox } from "../ui/checkbox";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "../ui/context-menu";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

interface CustomerListProps {
    customers?: Lead[];
    onSelect?: (customer: Lead) => void;
    orgId?: string; // Thêm orgId để fetch data
    onTotalChange?: (total: number) => void; // Callback để báo total count
    selectedCustomerId?: string | null; // ID của customer được chọn từ parent
    scrollContainerRef?: React.RefObject<HTMLDivElement | null>; // Ref của container scroll
}

// Sample placeholder data

export default function CustomerList({
    customers = [],
    onSelect,
    orgId,
    onTotalChange,
    selectedCustomerId,
    scrollContainerRef: externalScrollContainerRef,
}: CustomerListProps) {
    const router = useRouter();
    const [activeCustomerId, setActiveCustomerId] = useState<string | null>(
        null,
    );
    const {
        isMultiSelectMode,
        selectedItems,
        toggleSelection,
        clearSelection,
    } = useMultiSelect();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const internalScrollContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef =
        externalScrollContainerRef || internalScrollContainerRef;
    const searchParams = useSearchParams();
    const { filter, archiveFilter } = useLeadsFilter();
    const { isArchiveMode } = useLeadStore();

    // Use appropriate filter based on mode
    const currentFilter = isArchiveMode ? archiveFilter : filter;

    // Get search text from URL for backward compatibility
    const searchText = searchParams.get("SearchText") || "";

    // Create filter body from Zustand store or fallback to URL params
    let filterBody = currentFilter.filterBody;

    if (!filterBody) {
        // Fallback: tạo filter body từ URL params, chỉ include field có giá trị
        filterBody = { limit: 20 };

        const startDate = searchParams.get("StartDate");
        const endDate = searchParams.get("EndDate");
        const tags = searchParams.getAll("Tags");
        const sourceIds = searchParams.getAll("SourceIds");
        const utmSources = searchParams.getAll("UtmSources");
        const assignees = searchParams.getAll("Assignees");

        if (startDate) filterBody.startDate = startDate;
        if (endDate) filterBody.endDate = endDate;
        if (tags.length > 0) filterBody.tags = tags;
        if (sourceIds.length > 0) filterBody.sourceIds = sourceIds;
        if (utmSources.length > 0) filterBody.utmSources = utmSources;
        if (assignees.length > 0) filterBody.assignees = assignees;
    }

    // Include search text nếu có
    if (searchText) {
        filterBody = { ...filterBody, searchText };
    }

    // Add channel filter based on source parameter
    const sourceParam = searchParams.get("source");
    if (sourceParam === "chance") {
        filterBody = { ...filterBody, channels: ["LEAD"] };
    } else if (sourceParam === "messenger") {
        filterBody = { ...filterBody, channels: ["FACEBOOK"] };
    } else if (sourceParam === "zalo") {
        filterBody = { ...filterBody, channels: ["ZALO"] };
    }

    // Add isArchive flag when in archive mode
    if (isArchiveMode) {
        filterBody = { ...filterBody, isArchive: true };
    }

    // Sử dụng hook mới với body filter
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteLeadsWithBodyFilter(orgId || "", filterBody);

    // Flatten all pages data
    const allCustomers =
        data?.pages.flatMap((page) =>
            page.content == null ? [] : page.content,
        ) || [];
    // Sử dụng data từ API nếu có, ngược lại dùng customers prop hoặc sample data
    const displayCustomers = orgId ? allCustomers : customers;
    useEffect(() => {
        if (data !== undefined) {
            if (data?.pages[0]?.code !== 0) {
                toast.error(data?.pages[0]?.message || "No more data");
            }
        }
    }, [data]);
    // Debug logs và callback total count
    useEffect(() => {
        if (orgId) {
            const total = data?.pages[0]?.metadata?.total || 0;
            // Báo total count lên parent component
            onTotalChange?.(total);
        }
    }, [orgId, data?.pages, onTotalChange]);

    // Sync activeCustomerId with selectedCustomerId from parent
    useEffect(() => {
        if (selectedCustomerId !== undefined) {
            setActiveCustomerId(selectedCustomerId);
        }
    }, [selectedCustomerId]);

    // Auto-select the first customer (only if no selectedCustomerId from parent)
    useEffect(() => {
        if (
            displayCustomers.length > 0 &&
            onSelect &&
            !activeCustomerId &&
            selectedCustomerId === undefined
        ) {
            setActiveCustomerId(displayCustomers[0].id);
            onSelect(displayCustomers[0]);
        }
    }, [displayCustomers, onSelect, activeCustomerId, selectedCustomerId]);

    // Intersection Observer để load more data
    const lastElementRef = useCallback(
        (node: HTMLLIElement | null) => {
            if (isLoading) return;
            if (observerRef.current) observerRef.current.disconnect();

            if (!node) return;

            // Sử dụng scrollContainerRef từ props hoặc tìm parent có overflow
            const scrollContainer =
                scrollContainerRef?.current ||
                (() => {
                    // Fallback: tìm container scroll từ parent
                    let element: HTMLElement | null = node.parentElement;
                    while (element) {
                        const style = window.getComputedStyle(element);
                        if (
                            style.overflowY === "auto" ||
                            style.overflowY === "scroll"
                        ) {
                            return element;
                        }
                        element = element.parentElement;
                    }
                    return null;
                })();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (
                            entry.isIntersecting &&
                            hasNextPage &&
                            !isFetchingNextPage &&
                            orgId
                        ) {
                            fetchNextPage();
                        }
                    });
                },
                {
                    root: scrollContainer, // Dùng container scroll làm root
                    rootMargin: "100px", // Load sớm hơn 100px

                    threshold: [0, 0.1, 0.5, 1.0], // Multiple thresholds để đảm bảo detect

                },
            );

            observerRef.current.observe(node);
        },

        [
            isLoading,
            hasNextPage,
            isFetchingNextPage,
            fetchNextPage,
            orgId,
            scrollContainerRef,
        ],
    );

    // Cleanup observer khi component unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Thêm scroll event listener như fallback
    useEffect(() => {
        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer || !hasNextPage || isFetchingNextPage || !orgId) {
            return;
        }

        const handleScroll = () => {
            const container = scrollContainer;
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const scrollBottom = scrollHeight - scrollTop - clientHeight;

            // Nếu còn cách đáy < 300px thì load more
            if (scrollBottom < 300 && hasNextPage && !isFetchingNextPage) {
                console.log("📜 Scroll detected - Loading more...", {
                    scrollBottom,
                    hasNextPage,
                    isFetchingNextPage,
                });
                fetchNextPage();
            }
        };

        scrollContainer.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            scrollContainer.removeEventListener("scroll", handleScroll);
        };
    }, [
        scrollContainerRef,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        orgId,
    ]);

    const handleSelect = (customer: Lead) => {
        // Nếu đang trong multi-select mode, toggle selection thay vì gọi onSelect
        if (isMultiSelectMode) {
            toggleSelection(customer.id);
            return;
        }

        // Bình thường: set active và gọi onSelect
        setActiveCustomerId(customer.id);
        onSelect?.(customer);

        // Persist selection in URL so it survives reloads/overlays
        try {
            const params = new URLSearchParams(window.location.search);
            // params.set("lid", customer.id);
            // Many flows map lead.id to conversation.id; set cid for consistency
            params.set("lid", customer.id);
            router.replace(`?${params.toString()}`);
        } catch {}
    };

    const isSelected = (customerId: string) => {
        return selectedItems.has(customerId);
    };

    // Loading state cho lần đầu
    if (isLoading && displayCustomers.length === 0) {
        return <Loading />;
    }

    // Error state
    if (isError) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="flex items-center justify-center h-32 text-red-500">
                    <span>Có lỗi xảy ra khi tải dữ liệu</span>
                </div>
            </div>
        );
    }

    // Helper to get source type for badge
    const getSourceType = (sourceName: string | undefined) => {
        if (!sourceName) return null;
        const lower = sourceName.toLowerCase();
        if (lower.includes("zalo")) return "zalo";
        if (lower.includes("messenger") || lower.includes("facebook"))
            return "messenger";
        if (lower.includes("livechat") || lower.includes("website"))
            return "livechat";
        return null;
    };

    return (
        <>
            {allCustomers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm italic flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <Users size={20} className="opacity-30" />
                    </div>
                    Chưa có khách hàng nào
                </div>
            ) : (
                <ul className="space-y-2 w-full">
                    {allCustomers.map((customer, index) => {
                        const sourceType = getSourceType(customer.sourceName);
                        const isCustomerSelected =
                            activeCustomerId === customer.id;
                        const isItemSelected = isSelected(customer.id);

                        const isLastElement = index === allCustomers.length - 1;
                        const shouldObserve = isLastElement && hasNextPage;

                        if (
                            process.env.NODE_ENV === "development" &&
                            isLastElement
                        ) {
                            console.log("Last element render", {
                                index,
                                total: allCustomers.length,
                                isLastElement,
                                hasNextPage,
                                shouldObserve,
                                customerId: customer.id,
                            });
                        }

                        return (
                            <li
                                key={customer.id}
                                ref={shouldObserve ? lastElementRef : null}
                            >
                                <ContextMenu>
                                    <ContextMenuTrigger asChild>
                                        <div
                                            onClick={() =>
                                                handleSelect(customer)
                                            }
                                            className={cn(
                                                "p-3 rounded-2xl cursor-pointer transition-all duration-300 border group relative",
                                                isCustomerSelected
                                                    ? "bg-white/90 border-indigo-200 shadow-md transform scale-[1.01]"
                                                    : "bg-white/40 border-white/30 hover:bg-white/60 hover:shadow-sm",
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center space-x-3">
                                                    {isMultiSelectMode && (
                                                        <Checkbox
                                                            checked={
                                                                isItemSelected
                                                            }
                                                            onCheckedChange={() =>
                                                                toggleSelection(
                                                                    customer.id,
                                                                )
                                                            }
                                                            className="flex-shrink-0"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        />
                                                    )}
                                                    <div className="relative">
                                                        <Avatar
                                                            name={
                                                                getFirstAndLastWord(
                                                                    customer.fullName,
                                                                ) || ""
                                                            }
                                                            src={
                                                                getAvatarUrl(
                                                                    customer?.avatar ||
                                                                        "",
                                                                ) || ""
                                                            }
                                                            round
                                                            size="40"
                                                            className="border-2 border-white shadow-sm"
                                                        />
                                                        {/* Platform Icon on Customer Avatar */}
                                                        {sourceType ===
                                                            "zalo" && (
                                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border shadow-sm">
                                                                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-[6px] text-white font-black">
                                                                    Z
                                                                </div>
                                                            </div>
                                                        )}
                                                        {sourceType ===
                                                            "messenger" && (
                                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border shadow-sm">
                                                                <MessageCircle
                                                                    size={10}
                                                                    className="text-blue-600 fill-current"
                                                                />
                                                            </div>
                                                        )}
                                                        {sourceType ===
                                                            "livechat" && (
                                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border shadow-sm">
                                                                <Globe
                                                                    size={10}
                                                                    className="text-green-500"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3
                                                            className={cn(
                                                                "font-bold text-sm",
                                                                isCustomerSelected
                                                                    ? "text-indigo-900"
                                                                    : "text-gray-800",
                                                            )}
                                                        >
                                                            {customer.fullName}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">
                                                            {customer.snippet ||
                                                                "Chưa có thông tin"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <LastModifiedTime
                                                        lastModifiedDate={
                                                            customer.lastModifiedDate
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-2 pl-13">
                                                <div
                                                    className={cn(
                                                        "text-xs px-2 py-1.5 rounded-lg inline-block max-w-full truncate",
                                                        isCustomerSelected
                                                            ? "bg-indigo-50 text-indigo-700"
                                                            : "bg-white/30 text-gray-600",
                                                    )}
                                                >
                                                    <span className="font-medium">
                                                        {customer.snippet ||
                                                            "Chưa có hoạt động"}
                                                    </span>
                                                </div>
                                                {customer.assignees &&
                                                    customer.assignees.length >
                                                        0 && (
                                                        <div className="mt-1 flex gap-1">
                                                            {customer.assignees
                                                                .length ===
                                                            1 ? (
                                                                <TooltipProvider>
                                                                    <Tooltip
                                                                        content={
                                                                            customer
                                                                                .assignees[0]
                                                                                .profileName ||
                                                                            customer
                                                                                .assignees[0]
                                                                                .teamName
                                                                        }
                                                                    >
                                                                        <div className="flex items-center gap-1">
                                                                            <Avatar
                                                                                name={getFirstAndLastWord(
                                                                                    customer
                                                                                        .assignees[0]
                                                                                        .profileName ||
                                                                                        customer
                                                                                            .assignees[0]
                                                                                            .teamName,
                                                                                )}
                                                                                size="16"
                                                                                round
                                                                                className="object-cover border-white"
                                                                                src={
                                                                                    getAvatarUrl(
                                                                                        customer
                                                                                            .assignees[0]
                                                                                            .avatar ||
                                                                                            "",
                                                                                    ) ||
                                                                                    ""
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ) : (
                                                                <div className="flex -space-x-2">
                                                                    {customer.assignees
                                                                        .slice(
                                                                            0,
                                                                            3,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                user,
                                                                                idx,
                                                                            ) => (
                                                                                <TooltipProvider
                                                                                    key={`${customer.id}-${user.profileId}-${idx}`}
                                                                                >
                                                                                    <Tooltip
                                                                                        content={
                                                                                            user.profileName ||
                                                                                            user.teamName
                                                                                        }
                                                                                    >
                                                                                        <div>
                                                                                            <Avatar
                                                                                                name={getFirstAndLastWord(
                                                                                                    user.profileName ||
                                                                                                        user.teamName,
                                                                                                )}
                                                                                                size="16"
                                                                                                round
                                                                                                className="object-cover border-white"
                                                                                                style={{
                                                                                                    zIndex:
                                                                                                        10 -
                                                                                                        idx,
                                                                                                }}
                                                                                                src={
                                                                                                    getAvatarUrl(
                                                                                                        user.avatar ||
                                                                                                            "",
                                                                                                    ) ||
                                                                                                    ""
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            ),
                                                                        )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem
                                            onClick={() =>
                                                toggleSelection(customer.id)
                                            }
                                        >
                                            {isSelected(customer.id)
                                                ? "Bỏ chọn"
                                                : "Chọn"}
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            </li>
                        );
                    })}

                    {/* Loading indicator cho infinite scroll */}
                    {isFetchingNextPage && (
                        <li className="p-4 text-center text-gray-500">
                            <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                            <span className="text-xs">Đang tải thêm...</span>
                        </li>
                    )}
                    {/* Debug info - có thể xóa sau */}
                    {process.env.NODE_ENV === "development" && (
                        <li className="p-2 text-xs text-gray-400 text-center">
                            Total: {allCustomers.length} | HasNext:{" "}
                            {hasNextPage ? "Yes" : "No"} | Fetching:{" "}
                            {isFetchingNextPage ? "Yes" : "No"}
                        </li>
                    )}
                </ul>
            )}
        </>
    );
}

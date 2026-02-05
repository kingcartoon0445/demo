import { useLeadsFilter } from "@/hooks/leads_data";
import { useInfiniteLeadsWithBodyFilter } from "@/hooks/useCustomerV2";
import { Lead } from "@/lib/interface";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import LastModifiedTime from "../LastModifiedTime";
import Loading from "../common/Loading";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import ChannelBadge from "./ChannelBadge";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "../ui/context-menu";
import { Checkbox } from "../ui/checkbox";
import { useMultiSelect } from "@/contexts/MultiSelectContext";

interface CustomerListProps {
    customers?: Lead[];
    onSelect?: (customer: Lead) => void;
    orgId?: string; // Thêm orgId để fetch data
    onTotalChange?: (total: number) => void; // Callback để báo total count
    selectedCustomerId?: string | null; // ID của customer được chọn từ parent
}

// Sample placeholder data

export default function CustomerList({
    customers = [],
    onSelect,
    orgId,
    onTotalChange,
    selectedCustomerId,
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
    const searchParams = useSearchParams();
    const { filter } = useLeadsFilter();

    // Get search text from URL for backward compatibility
    const searchText = searchParams.get("SearchText") || "";

    // Create filter body from Zustand store or fallback to URL params
    let filterBody = filter.filterBody;

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

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];

                    if (
                        entry.isIntersecting &&
                        hasNextPage &&
                        !isFetchingNextPage &&
                        orgId // Chỉ load thêm khi có orgId
                    ) {
                        fetchNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "100px", // Load sớm hơn 100px
                    threshold: 0.1,
                },
            );

            if (node) {
                observerRef.current.observe(node);
            }
        },
        [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, orgId],
    );

    // Cleanup observer khi component unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

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

    return (
        <div>
            {allCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                    <span>Chưa có khách hàng nào</span>
                </div>
            ) : (
                <ScrollArea className="max-w-[320px]">
                    <ul className="space-y-1 bg-white">
                        {allCustomers.map((customer, index) => {
                            return (
                                <li
                                    key={customer.id}
                                    ref={
                                        index === displayCustomers.length - 1 &&
                                        hasNextPage
                                            ? lastElementRef
                                            : null
                                    }
                                >
                                    <ContextMenu>
                                        <ContextMenuTrigger asChild>
                                            <button
                                                onClick={() =>
                                                    handleSelect(customer)
                                                }
                                                className={cn(
                                                    "w-full flex items-start justify-between gap-3 rounded-lg p-2 text-left hover:bg-muted transition-colors relative h-18",
                                                    activeCustomerId ===
                                                        customer.id &&
                                                        "bg-sidebar-accent/60 dark:bg-sidebar-accent/20",
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isMultiSelectMode && (
                                                        <Checkbox
                                                            checked={isSelected(
                                                                customer.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleSelection(
                                                                    customer.id,
                                                                )
                                                            }
                                                            className="flex-shrink-0"
                                                        />
                                                    )}
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
                                                        size={"32"}
                                                    />
                                                    <div className="flex-1 min-w-0 ">
                                                        <p className="text-sm truncate m-0 max-w-[170px] line-clamp-1">
                                                            {customer.fullName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/70 line-clamp-1 max-w-[170px]">
                                                            {customer.snippet}
                                                        </p>
                                                        <div className="text-text2 text-[11px] flex items-center gap-1 w-full">
                                                            {customer.assignees
                                                                .length > 0 ? (
                                                                customer
                                                                    .assignees
                                                                    .length ===
                                                                1 ? (
                                                                    <TooltipProvider>
                                                                        <Tooltip
                                                                            content={
                                                                                <span>
                                                                                    {customer
                                                                                        .assignees[0]
                                                                                        .profileName ||
                                                                                        customer
                                                                                            .assignees[0]
                                                                                            .teamName}
                                                                                </span>
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <Avatar
                                                                                    name={getFirstAndLastWord(
                                                                                        customer
                                                                                            .assignees[0]
                                                                                            .profileName ||
                                                                                            customer
                                                                                                .assignees[0]
                                                                                                .teamName,
                                                                                    )}
                                                                                    size="20"
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
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {customer
                                                                                        .assignees[0]
                                                                                        .profileName ||
                                                                                        customer
                                                                                            .assignees[0]
                                                                                            .teamName}
                                                                                </span>
                                                                            </div>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="flex -space-x-2">
                                                                            {customer.assignees.map(
                                                                                (
                                                                                    user,
                                                                                    idx,
                                                                                ) => (
                                                                                    <TooltipProvider
                                                                                        key={`${customer.id}-${user.profileId}-${idx}`}
                                                                                    >
                                                                                        <Tooltip
                                                                                            content={
                                                                                                <span>
                                                                                                    {user.profileName ||
                                                                                                        user.teamName}
                                                                                                </span>
                                                                                            }
                                                                                        >
                                                                                            <div>
                                                                                                <Avatar
                                                                                                    name={getFirstAndLastWord(
                                                                                                        user.profileName ||
                                                                                                            user.teamName,
                                                                                                    )}
                                                                                                    size="20"
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
                                                                    </div>
                                                                )
                                                            ) : (
                                                                ""
                                                            )}

                                                            <div className="flex flex-col ml-auto gap-1 whitespace-nowrap"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <LastModifiedTime
                                                        lastModifiedDate={
                                                            customer.lastModifiedDate
                                                        }
                                                    />
                                                    {customer.sourceName && (
                                                        <ChannelBadge
                                                            channel={
                                                                customer.sourceName
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </button>
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
                            </li>
                        )}
                    </ul>
                </ScrollArea>
            )}
        </div>
    );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { Lead } from "@/lib/interface";
import Avatar from "react-avatar";
import {
    useInfiniteLeads,
    useInfiniteLeadsV2,
    useInfiniteLeadsWithBodyFilter,
} from "@/hooks/useCustomerV2";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import LastModifiedTime from "../LastModifiedTime";
import Loading from "../common/Loading";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLeadsFilter } from "@/hooks/leads_data";
import { channel } from "diagnostics_channel";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "../ui/context-menu";
import { Checkbox } from "../ui/checkbox";
import { useMultiSelect } from "@/contexts/MultiSelectContext";

interface ArchivedCustomerListProps {
    onSelect?: (customer: Lead) => void;
    orgId?: string;
    onTotalChange?: (total: number) => void;
}

export default function ArchivedCustomerList({
    onSelect,
    orgId,
    onTotalChange,
}: ArchivedCustomerListProps) {
    const [activeCustomerId, setActiveCustomerId] = useState<string | null>(
        null
    );
    const {
        isMultiSelectMode,
        selectedItems,
        toggleSelection,
        clearSelection,
    } = useMultiSelect();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { archiveFilter } = useLeadsFilter();
    const { t } = useLanguage();

    // Get search text from URL for backward compatibility
    const searchText = searchParams.get("SearchText") || "";

    // Create filter body from archive filter in Zustand store or fallback to URL params
    let filterBody = archiveFilter?.filterBody;

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

    // Thêm isArchive=true vào filter body
    filterBody = { ...filterBody, isArchive: true, channels: ["LEAD"] };

    // Sử dụng useInfiniteLeadsWithBodyFilter với archive filter body
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteLeadsWithBodyFilter(orgId || "", filterBody);

    // Flatten all pages data
    const displayCustomers = data?.pages.flatMap((page) => page.content) || [];

    // Báo total count lên parent component
    useEffect(() => {
        if (orgId) {
            const total = data?.pages[0]?.metadata.total || 0;
            onTotalChange?.(total);
        }
    }, [orgId, data?.pages, onTotalChange]);

    // Auto-select the first customer
    useEffect(() => {
        if (displayCustomers.length > 0 && onSelect && !activeCustomerId) {
            setActiveCustomerId(displayCustomers[0].id);
            onSelect(displayCustomers[0]);
        }
    }, [displayCustomers, onSelect, activeCustomerId]);

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
                        orgId
                    ) {
                        fetchNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "100px",
                    threshold: 0.1,
                }
            );

            if (node) {
                observerRef.current.observe(node);
            }
        },
        [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, orgId]
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
            {displayCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                    <span>{t("common.noArchivedCustomers")}</span>
                </div>
            ) : (
                <ScrollArea>
                    <ul className="space-y-1 bg-white">
                        {displayCustomers.map((customer, index) => {
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
                                                        "bg-sidebar-accent/60 dark:bg-sidebar-accent/20"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isMultiSelectMode && (
                                                        <Checkbox
                                                            checked={isSelected(
                                                                customer.id
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleSelection(
                                                                    customer.id
                                                                )
                                                            }
                                                            className="flex-shrink-0"
                                                        />
                                                    )}
                                                    <Avatar
                                                        name={
                                                            getFirstAndLastWord(
                                                                customer.fullName
                                                            ) || ""
                                                        }
                                                        src={
                                                            getAvatarUrl(
                                                                customer?.avatar ||
                                                                    ""
                                                            ) || ""
                                                        }
                                                        round
                                                        size={"32"}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm truncate">
                                                            {customer.fullName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/70 line-clamp-1 max-w-[170px]">
                                                            {customer.snippet}
                                                        </p>
                                                        <div className="text-text2 text-[11px] flex items-center gap-1 w-full">
                                                            {customer.assignees
                                                                ?.length >
                                                                0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <div className="flex -space-x-2">
                                                                        {customer.assignees.map(
                                                                            (
                                                                                user,
                                                                                idx
                                                                            ) => (
                                                                                <TooltipProvider
                                                                                    key={`${customer.id}-${user.profileId}-${idx}`}
                                                                                >
                                                                                    <Tooltip
                                                                                        content={
                                                                                            user.profileName
                                                                                        }
                                                                                    >
                                                                                        <div>
                                                                                            <Avatar
                                                                                                name={getFirstAndLastWord(
                                                                                                    user.profileName
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
                                                                                                        user.avatar
                                                                                                    ) ||
                                                                                                    ""
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-col ml-auto gap-1 whitespace-nowrap"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <LastModifiedTime
                                                        lastModifiedDate={
                                                            customer.lastModifiedDate
                                                        }
                                                    />
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

"use client";

import * as React from "react";
import { useInfiniteCustomersV2ByPost } from "@/hooks/useCustomerV2";
import { useLinkToCustomer } from "@/hooks/useConversation";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";
import Loading2 from "../Loading2";
import { useLinkLeadToCustomer } from "@/hooks/useCustomerDetail";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomerSelectorProps {
    orgId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (customer: {
        id: string;
        fullName: string;
        phone?: string;
    }) => void;
    conversationId?: string; // if provided, enables link action
    provider?: string;
}

const CustomerSelector = React.memo(function CustomerSelector({
    orgId,
    open,
    onOpenChange,
    onSelect,
    conversationId,
    provider,
}: CustomerSelectorProps) {
    const { t } = useLanguage();
    const [searchText, setSearchText] = React.useState("");
    const [debouncedSearchText, setDebouncedSearchText] = React.useState("");
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    // Debounce search text to prevent excessive API calls
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 500); // 500ms delay to reduce API calls

        return () => clearTimeout(timer);
    }, [searchText]);

    const minLengthReached = (debouncedSearchText?.trim().length || 0) >= 3;
    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteCustomersV2ByPost(
        orgId,
        {
            limit: 20,
            offset: 0,
            searchText: debouncedSearchText,
        },
        {
            enabled: minLengthReached,
        }
    );

    const customers = React.useMemo(() => {
        const pages = (data as any)?.pages || [];
        return pages.flatMap((p: any) =>
            Array.isArray(p?.content)
                ? p.content
                : Array.isArray(p?.data)
                ? p.data
                : []
        );
    }, [data]);

    const linkMutation =
        provider === "lead"
            ? useLinkLeadToCustomer(orgId, conversationId || "")
            : useLinkToCustomer(orgId, conversationId || "");

    const handleLink = React.useCallback(async () => {
        if (!conversationId || !selectedId) return;
        await linkMutation.mutateAsync({ customerId: selectedId });
        onOpenChange(false);
    }, [conversationId, selectedId, linkMutation, onOpenChange]);

    const handleSelect = React.useCallback(() => {
        if (!selectedId) return;
        const selectedCustomer = customers.find(
            (c: any) => c.id === selectedId
        );
        if (selectedCustomer && onSelect) {
            onSelect({
                id: selectedCustomer.id,
                fullName: selectedCustomer.fullName,
                phone: selectedCustomer.phone,
            });
        }
        onOpenChange(false);
    }, [selectedId, customers, onSelect, onOpenChange]);

    const handleCustomerSelect = React.useCallback((customerId: string) => {
        setSelectedId(customerId);
    }, []);

    const handleCancel = React.useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    // Reset search when dialog opens/closes
    React.useEffect(() => {
        if (!open) {
            setSearchText("");
            setDebouncedSearchText("");
            setSelectedId(null);
        }
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        const sentinel = loadMoreRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            {
                root: null,
                rootMargin: "0px 0px 200px 0px",
                threshold: 0.1,
            }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [
        open,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        debouncedSearchText,
    ]);

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t("common.selectCustomer")}
            showCloseButton={true}
        >
            <Command shouldFilter={false}>
                <CommandInput
                    placeholder={t("common.enterAtLeast3Characters")}
                    value={searchText}
                    onValueChange={setSearchText}
                />
                <CommandList>
                    {!minLengthReached ? (
                        <div className="flex items-center justify-center py-8">
                            <CommandEmpty>
                                {t("common.enterAtLeast3Characters")}
                            </CommandEmpty>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-2 p-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center space-x-2 p-2 animate-pulse"
                                >
                                    <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <CommandEmpty>{t("common.noResult")}</CommandEmpty>
                        </div>
                    ) : (
                        <CommandGroup>
                            {customers.map((c: any) => (
                                <CommandItem
                                    key={c.id}
                                    value={c.id}
                                    onSelect={() => handleCustomerSelect(c.id)}
                                >
                                    <input
                                        type="radio"
                                        name="customer"
                                        className="mr-2"
                                        checked={selectedId === c.id}
                                        onChange={() =>
                                            handleCustomerSelect(c.id)
                                        }
                                    />
                                    <Avatar
                                        className="mr-2"
                                        name={
                                            getFirstAndLastWord(c.fullName) ||
                                            ""
                                        }
                                        src={c.avatar || ""}
                                        size="24"
                                        round
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm">
                                            {c.fullName}
                                        </span>
                                        <div className="flex flex-col gap-0.5">
                                            {c.phone && (
                                                <span className="text-xs text-muted-foreground">
                                                    {c.phone}
                                                </span>
                                            )}
                                            {c.email && (
                                                <span className="text-xs text-muted-foreground">
                                                    {c.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                            {(hasNextPage || isFetchingNextPage) && (
                                <div ref={loadMoreRef} className="py-2">
                                    <div className="w-full text-center text-sm text-muted-foreground">
                                        {isFetchingNextPage
                                            ? t("common.loading")
                                            : ""}
                                    </div>
                                </div>
                            )}
                        </CommandGroup>
                    )}
                </CommandList>
                {/* Footer actions */}
                {customers.length > 0 && (
                    <div className="flex items-center justify-end gap-2 border-t p-2">
                        <button
                            className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
                            onClick={handleCancel}
                        >
                            {t("common.cancel")}
                        </button>
                        {conversationId ? (
                            <button
                                className="px-3 py-1.5 text-sm rounded-md bg-sidebar-primary text-white disabled:opacity-50"
                                onClick={handleLink}
                                disabled={!selectedId || linkMutation.isPending}
                            >
                                {linkMutation.isPending
                                    ? t("common.linking")
                                    : t("common.link")}
                            </button>
                        ) : (
                            <button
                                className="px-3 py-1.5 text-sm rounded-md bg-sidebar-primary text-white disabled:opacity-50"
                                onClick={handleSelect}
                                disabled={!selectedId}
                            >
                                {t("common.select")}
                            </button>
                        )}
                    </div>
                )}
            </Command>
        </CommandDialog>
    );
});

export default CustomerSelector;

"use client";

import * as React from "react";
import { useInfiniteLeadsV2 } from "@/hooks/useCustomerV2";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import Avatar from "react-avatar";
import { getFirstAndLastWord } from "@/lib/utils";
import { useLinkToLead } from "@/hooks/useConversation";
import { useDebounce } from "@/hooks/useDebounce";
import Loading2 from "../Loading2";
import { useLanguage } from "@/contexts/LanguageContext";

interface FindLeadModalProps {
    orgId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (lead: { id: string; fullName: string; phone?: string }) => void;
    conversationId?: string;
}

export default function FindLeadModal({
    orgId,
    open,
    onOpenChange,
    onSelect,
    conversationId,
}: FindLeadModalProps) {
    const { t } = useLanguage();
    const [searchText, setSearchText] = React.useState("");
    const debouncedSearch = useDebounce(searchText, 500);
    const minLengthReached = (debouncedSearch.trim().length || 0) >= 3;
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const linkToLeadMutation = useLinkToLead(orgId, conversationId || "");
    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteLeadsV2(
            orgId,
            {
                offset: 0,
                limit: 5,
                searchText: debouncedSearch,
                channels: ["LEAD"],
            } as any,
            { enabled: minLengthReached && open }
        );

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
    }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, debouncedSearch]);

    const pages = (data as any)?.pages || [];
    const flattened = pages.flatMap((p: any) =>
        Array.isArray(p?.content)
            ? p.content
            : Array.isArray(p?.data)
            ? p.data
            : []
    );
    const leads = minLengthReached && open ? flattened : [];

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t("common.findLead")}
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
                    ) : leads.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <CommandEmpty>{t("common.noResult")}</CommandEmpty>
                        </div>
                    ) : (
                        <CommandGroup>
                            {leads.map((l: any) => (
                                <CommandItem
                                    key={l.id}
                                    value={l.id}
                                    onSelect={() => setSelectedId(l.id)}
                                >
                                    <input
                                        type="radio"
                                        className="mr-2"
                                        name="lead"
                                        checked={selectedId === l.id}
                                        onChange={() => setSelectedId(l.id)}
                                    />
                                    <Avatar
                                        className="mr-2"
                                        name={
                                            getFirstAndLastWord(l.fullName) ||
                                            ""
                                        }
                                        src={l.avatar || ""}
                                        size="24"
                                        round
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm">
                                            {l.fullName}
                                        </span>
                                        <div className="flex flex-col gap-0.5">
                                            {l.phone && (
                                                <span className="text-xs text-muted-foreground">
                                                    {l.phone}
                                                </span>
                                            )}
                                            {l.email && (
                                                <span className="text-xs text-muted-foreground">
                                                    {l.email}
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
                {leads.length > 0 && (
                    <div className="flex items-center justify-end gap-2 border-t p-2">
                        <button
                            className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            className="px-3 py-1.5 text-sm rounded-md bg-sidebar-primary text-white disabled:opacity-50"
                            onClick={async () => {
                                if (!conversationId || !selectedId) return;
                                await linkToLeadMutation.mutateAsync({
                                    leadId: selectedId,
                                });
                                onOpenChange(false);
                            }}
                            disabled={
                                !conversationId ||
                                !selectedId ||
                                linkToLeadMutation.isPending
                            }
                        >
                            {linkToLeadMutation.isPending
                                ? t("common.linking")
                                : t("common.link")}
                        </button>
                    </div>
                )}
            </Command>
        </CommandDialog>
    );
}

"use client";

import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    useLinkConversationToTask,
    useInfiniteSearchTask,
} from "@/hooks/useBusinessProcess";
import { useDebounce } from "@/hooks/useDebounce";
import * as React from "react";

interface FindDealModalProps {
    orgId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (task: { id: string; title: string }) => void;
    conversationId?: string;
}

export default function FindDealModal({
    orgId,
    open,
    onOpenChange,
    onSelect,
    conversationId,
}: FindDealModalProps) {
    const { t } = useLanguage();
    const [searchText, setSearchText] = React.useState("");
    const debouncedSearch = useDebounce(searchText, 500);
    const pageSize = 20;
    const minLengthReached = (debouncedSearch.trim().length || 0) >= 3;

    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteSearchTask(orgId, {
            searchText: minLengthReached ? debouncedSearch : "",
            pageSize,
        });

    const pages = (data as any)?.pages || [];
    const tasks =
        open && minLengthReached
            ? pages.flatMap((p: any) =>
                  Array.isArray(p?.data)
                      ? p.data
                      : Array.isArray(p?.content)
                      ? p.content
                      : []
              )
            : [];

    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const linkConvToTaskMutation = useLinkConversationToTask(orgId);

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
        debouncedSearch,
        minLengthReached,
    ]);

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t("common.findDealOrTask")}
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
                                    <div className="flex-1 space-y-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <CommandEmpty>{t("common.noResult")}</CommandEmpty>
                        </div>
                    ) : (
                        <CommandGroup>
                            {tasks.map((t: any) => (
                                <CommandItem
                                    key={t.id}
                                    value={t.id}
                                    onSelect={() => setSelectedId(t.id)}
                                >
                                    <input
                                        type="radio"
                                        className="mr-2"
                                        name="deal-task"
                                        checked={selectedId === t.id}
                                        onChange={() => setSelectedId(t.id)}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm">
                                            {t.name}
                                        </span>
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
                {tasks.length > 0 && (
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
                                await linkConvToTaskMutation.mutateAsync({
                                    conversationId,
                                    taskId: selectedId,
                                });
                                onOpenChange(false);
                            }}
                            disabled={
                                !conversationId ||
                                !selectedId ||
                                linkConvToTaskMutation.isPending
                            }
                        >
                            {linkConvToTaskMutation.isPending
                                ? t("common.linking")
                                : t("common.link")}
                        </button>
                    </div>
                )}
            </Command>
        </CommandDialog>
    );
}

"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Mail,
    MailOpen,
    Trash2,
    Paperclip,
    Loader2,
    Inbox,
    RotateCcw,
    Filter,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Glass } from "@/components/Glass";

interface EmailListProps {
    emails: any[];
    activeFolder: string;
    selectedEmailId: string | null;
    onSelectEmail: (id: string) => void;
    checkedEmailIds: string[];
    onToggleEmail: (id: string) => void;
    onSelectAll: (ids: string[]) => void;
    onClearSelection: () => void;
    isLoading: boolean;
    isSyncing?: boolean;
    onLoadMore: () => void;
    isLoadingMore: boolean;
    hasMore: boolean;
    onReload?: () => void;
    filterButton?: React.ReactNode;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
    onToggleRead?: (id: string, isRead: boolean, e: React.MouseEvent) => void;
}

export function EmailList({
    emails,
    activeFolder,
    selectedEmailId,
    onSelectEmail,
    checkedEmailIds,
    onToggleEmail,
    onSelectAll,
    onClearSelection,
    isLoading,
    isSyncing = false,
    onLoadMore,
    isLoadingMore,
    hasMore,
    onReload,
    filterButton,
    searchValue,
    onSearchChange,
    onDelete,
    onToggleRead,
}: EmailListProps) {
    const { t } = useLanguage();
    const isSelectionMode = checkedEmailIds.length > 0;

    // Handle "Select All"
    const handleSelectAllClick = () => {
        if (emails && Array.isArray(emails)) {
            if (checkedEmailIds.length === emails.length && emails.length > 0) {
                onClearSelection();
            } else {
                onSelectAll(emails.map((e) => e.id));
            }
        }
    };

    const allChecked =
        Array.isArray(emails) &&
        emails.length > 0 &&
        checkedEmailIds.length === emails.length;

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* Header / Search Bar */}
            <div className="p-3 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t("mail.searchPlaceholder")}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Second Row: Select All | Refresh | Filter */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={handleSelectAllClick}
                        >
                            <div
                                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${allChecked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}
                            >
                                {allChecked && (
                                    <div className="w-2 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5" />
                                )}
                            </div>
                            <span className="text-sm text-gray-600 font-medium select-none">
                                {t("mail.selectAll") || "Chọn tất cả"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onReload}
                            disabled={isSyncing}
                            className={`p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors ${isSyncing ? "animate-spin" : ""}`}
                            title={t("mail.refresh")}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Filter Button */}
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                            <Filter className="w-3.5 h-3.5" />
                            <span>{t("mail.filter") || "Bộ lọc"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar px-1">
                {isLoading && !isLoadingMore ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        {isSyncing ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                                <p className="text-sm text-blue-600 font-medium">
                                    {t("mail.syncing")}
                                </p>
                            </>
                        ) : (
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        )}
                    </div>
                ) : !emails || emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        {isSyncing ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                                <p className="text-sm text-blue-600 font-medium">
                                    {t("mail.syncing")}
                                </p>
                            </>
                        ) : (
                            <>
                                <Inbox className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-sm">{t("mail.noEmails")}</p>
                            </>
                        )}
                    </div>
                ) : (
                    Array.isArray(emails) &&
                    emails.map((email) => {
                        const isActive = selectedEmailId === email.id;
                        const isChecked = checkedEmailIds.includes(email.id);

                        return (
                            <div
                                key={email.id}
                                onClick={() => onSelectEmail?.(email.id)}
                                // intensity={isActive ? "high" : "low"}
                                // border={false}
                                className={cn(
                                    "group flex gap-3 p-4 mx-2 my-2 rounded-2xl cursor-pointer relative transition-all border",
                                    isActive
                                        ? "shadow-lg shadow-indigo-100/60 border-indigo-500 z-10 scale-[1.01] bg-white"
                                        : "border-transparent shadow-sm hover:shadow-md hover:border-gray-100/50 bg-white/70",
                                )}
                            >
                                {/* Avatar & Checkbox Section */}
                                <div className="shrink-0 relative w-12 h-12">
                                    {/* Avatar - Fades out on hover or checked */}
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shadow-inner transition-opacity duration-200 absolute inset-0",
                                            isChecked
                                                ? "opacity-0"
                                                : "opacity-100 group-hover:opacity-0",
                                            // Dynamic color based on name/id usually, static for now matching image feel
                                            [
                                                "bg-green-100 text-green-700",
                                                "bg-blue-100 text-blue-700",
                                                "bg-yellow-100 text-yellow-700",
                                                "bg-red-100 text-red-700",
                                            ][
                                                (email.fromName?.length || 0) %
                                                    4
                                            ],
                                        )}
                                    >
                                        {(email.fromName || email.from || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    {/* Checkbox - Fades in on hover or checked */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10 bg-white/50 backdrop-blur-sm rounded-full",
                                            isChecked
                                                ? "opacity-100"
                                                : "opacity-0 group-hover:opacity-100",
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() =>
                                                onToggleEmail?.(email.id)
                                            }
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    {/* Row 1: Name + Time */}
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-[15px] font-bold text-gray-900 truncate pr-2 leading-tight">
                                            {email.fromName ||
                                                email.from ||
                                                "Unknown"}
                                        </p>

                                        {/* Hover Actions - Only show on hover */}
                                        <div className="hidden group-hover:flex items-center gap-1 absolute right-3 top-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 p-0.5 z-20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleRead?.(
                                                        email.id,
                                                        !email.isRead,
                                                        e,
                                                    );
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                title={
                                                    email.isRead
                                                        ? t("mail.markAsUnread")
                                                        : t("mail.markAsRead")
                                                }
                                            >
                                                {email.isRead ? (
                                                    <Mail className="w-4 h-4" />
                                                ) : (
                                                    <MailOpen className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete?.(email.id, e);
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title={t("mail.delete")}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <span className="text-xs text-gray-400 shrink-0 font-medium group-hover:opacity-0 transition-opacity">
                                            {email.time ||
                                                (email.dateSent
                                                    ? new Date(
                                                          email.dateSent,
                                                      ).toLocaleTimeString([], {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      })
                                                    : "")}
                                        </span>
                                    </div>

                                    {/* Row 2: Phone/Email */}
                                    <p className="text-xs text-gray-500 truncate leading-tight">
                                        {/* Mocking Phone if not available, falling back to address */}
                                        {/* {email.phone || email.fromAddress || email.from || "No contact info"} */}
                                        {email.fromAddress ||
                                            email.from ||
                                            "No contact info"}
                                    </p>

                                    {/* Row 3: Snippet/Badges + Count */}
                                    <div className="flex justify-between items-end mt-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {email.tags &&
                                            email.tags.length > 0 ? (
                                                email.tags.map((tag: any) => (
                                                    <span
                                                        key={tag.id}
                                                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-600 border border-green-100" // Example style matching "Moi"
                                                        style={{
                                                            backgroundColor:
                                                                tag.color
                                                                    ? `${tag.color}15`
                                                                    : undefined,
                                                            color: tag.color,
                                                            borderColor:
                                                                tag.color
                                                                    ? `${tag.color}30`
                                                                    : undefined,
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-600 truncate max-w-[180px] line-clamp-1">
                                                    {email.subject ||
                                                        "(No Subject)"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Unread Count Badge or Status */}
                                        {/* Mocking logic: if unread, show dot or mock count */}
                                        {!email.isRead ? (
                                            <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
                                                1
                                            </div>
                                        ) : // Optional: Show read status or nothing
                                        null}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Infinite Scroll Sentinel */}
                {!isLoading && hasMore && (
                    <InfiniteScrollSentinel
                        onLoadMore={onLoadMore}
                        isLoadingMore={isLoadingMore}
                    />
                )}

                {/* Loading More Indicator */}
                {isLoadingMore && (
                    <div className="flex items-center justify-center p-4 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm">{t("mail.loadingMore")}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Infinite Scroll Sentinel Component
function InfiniteScrollSentinel({
    onLoadMore,
    isLoadingMore,
}: {
    onLoadMore: () => void;
    isLoadingMore: boolean;
}) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    onLoadMore();
                }
            },
            { rootMargin: "100px" },
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [onLoadMore, isLoadingMore]);

    return <div ref={sentinelRef} className="h-4 w-full" />;
}

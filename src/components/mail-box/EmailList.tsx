"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    Search,
    Loader2,
    RotateCw,
    Inbox,
    Paperclip,
    Trash2,
    Mail,
    MailOpen,
} from "lucide-react";
import { Email } from "@/data/mockEmails";
import { EmailFilterParams } from "@/components/mail-box/EmailFilter";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmailListProps {
    className?: string;
    activeFolder?: string;
    selectedEmailId?: string | null;
    onSelectEmail?: (id: string) => void;
    checkedEmailIds?: string[];
    onToggleEmail?: (id: string) => void;
    onSelectAll?: (ids: string[]) => void;
    onClearSelection?: () => void;
    emails: Email[];
    isLoading?: boolean;
    filters?: EmailFilterParams;
    onFilterChange?: (filters: EmailFilterParams) => void;
    filterButton?: React.ReactNode;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    onReload?: () => void;
    isSyncing?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
    onToggleRead?: (id: string, isRead: boolean, e: React.MouseEvent) => void;
}

export function EmailList({
    className,
    activeFolder = "Inbox",
    selectedEmailId,
    onSelectEmail,
    checkedEmailIds = [],
    onToggleEmail,
    onSelectAll,
    onClearSelection,
    emails,
    isLoading = false,
    filterButton,
    onLoadMore,
    isLoadingMore = false,
    hasMore = false,
    onReload,
    isSyncing = false,
    searchValue = "",
    onSearchChange,
    onDelete,
    onToggleRead,
}: EmailListProps) {
    const { t } = useLanguage();
    const allSelected =
        emails.length > 0 && checkedEmailIds.length === emails.length;
    const isIndeterminate =
        checkedEmailIds.length > 0 && checkedEmailIds.length < emails.length;

    // Logic xác định xem có đang ở chế độ chọn nhiều hay không
    const isSelectionMode = checkedEmailIds.length > 0;

    const handleMasterCheckboxChange = () => {
        if (allSelected) {
            onClearSelection?.();
        } else {
            onSelectAll?.(emails.map((e) => e.id));
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-white/40 backdrop-blur-xl border-r border-white/20 shadow-sm",
                className,
            )}
        >
            {/* Header / Search */}
            <div className="p-4.5 border-b border-white/20">
                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                        <input
                            className="w-full bg-white/40 border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-[#5c46e6] focus:border-[#5c46e6] outline-none text-gray-700 placeholder:text-gray-500 transition-colors hover:bg-white/60"
                            placeholder={t("mail.searchPlaceholder")}
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <input
                            className="rounded border-gray-300 text-[#5c46e6] focus:ring-[#5c46e6]"
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                                if (input) {
                                    input.indeterminate = isIndeterminate;
                                }
                            }}
                            onChange={handleMasterCheckboxChange}
                        />
                        <span>{t("mail.selectAll")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onReload && (
                            <button
                                onClick={onReload}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                                title={t("mail.reload")}
                                disabled={isLoading}
                            >
                                <RotateCw
                                    className={cn(
                                        "w-3.5 h-3.5",
                                        isLoading && "animate-spin",
                                    )}
                                />
                            </button>
                        )}
                        {filterButton}
                    </div>
                </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm">{t("mail.loading")}</p>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
                                className={cn(
                                    "group flex gap-3 p-4 border-b border-white/10 cursor-pointer relative transition-colors",
                                    isActive
                                        ? "bg-[#5c46e6]/10"
                                        : "hover:bg-white/30",
                                )}
                            >
                                {/* Checkbox Section */}
                                <div className="pt-1">
                                    <input
                                        className={cn(
                                            "rounded border-gray-300 text-[#5c46e6] focus:ring-[#5c46e6] transition-opacity duration-200",
                                            // LOGIC HIỂN THỊ CHECKBOX:
                                            // 1. isChecked: Email này đang được chọn -> Hiện.
                                            // 2. isSelectionMode: Đang có ít nhất 1 email bất kỳ được chọn -> Hiện tất cả.
                                            // 3. Còn lại: Ẩn đi, chỉ hiện khi hover vào dòng email.
                                            isChecked || isSelectionMode
                                                ? "opacity-100"
                                                : "opacity-0 group-hover:opacity-100",
                                        )}
                                        type="checkbox"
                                        checked={isChecked}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() =>
                                            onToggleEmail?.(email.id)
                                        }
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <p
                                            className={cn(
                                                "text-sm truncate m-0",
                                                email.isRead === false &&
                                                    "font-semibold text-gray-900",
                                            )}
                                        >
                                            {activeFolder === "Sent" ||
                                            activeFolder === "Drafts"
                                                ? `Tới: ${
                                                      email.toAddresses?.[0] ||
                                                      email.to ||
                                                      (activeFolder === "Drafts"
                                                          ? "(Không có người nhận)"
                                                          : "Unknown")
                                                  }`
                                                : email.fromName ||
                                                  email.sender?.name ||
                                                  email.fromAddress ||
                                                  email.from ||
                                                  "Unknown Sender"}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {/* Hover Actions - Only show on hover */}
                                            <div className="hidden group-hover:flex items-center gap-1 absolute right-4 top-3 bg-white/90 backdrop-blur-xs rounded-md shadow-xs p-0.5 z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleRead?.(
                                                            email.id,
                                                            !email.isRead,
                                                            e,
                                                        );
                                                    }}
                                                    className="p-1.5 text-gray-500 hover:text-[#5c46e6] hover:bg-[#5c46e6]/10 rounded-md transition-colors"
                                                    title={
                                                        email.isRead
                                                            ? t(
                                                                  "mail.markAsUnread",
                                                              )
                                                            : t(
                                                                  "mail.markAsRead",
                                                              )
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
                                            {email.isRead === false && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></span>
                                            )}
                                            {email.hasAttachments == true && (
                                                <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            )}
                                            <span
                                                className={cn(
                                                    "text-xs whitespace-nowrap group-hover:hidden",
                                                    isActive
                                                        ? "text-[#5c46e6] font-medium"
                                                        : "text-gray-500",
                                                )}
                                            >
                                                {email.time ||
                                                    email.date ||
                                                    (email.dateSent ||
                                                    email.dateReceived
                                                        ? new Date(
                                                              email.dateSent ||
                                                                  email.dateReceived ||
                                                                  "",
                                                          ).toLocaleDateString(
                                                              "vi-VN",
                                                              {
                                                                  year: "numeric",
                                                                  month: "short",
                                                                  day: "numeric",
                                                              },
                                                          )
                                                        : "")}
                                            </span>{" "}
                                        </div>
                                    </div>
                                    <p
                                        className={cn(
                                            "text-sm truncate mb-0.5",
                                            isActive
                                                ? "font-medium text-gray-800"
                                                : email.isRead === false
                                                  ? "font-semibold text-gray-900"
                                                  : "text-gray-600",
                                        )}
                                    >
                                        {email.subject}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-xs truncate",
                                            isActive
                                                ? "text-gray-500"
                                                : email.isRead === false
                                                  ? "font-medium text-gray-600"
                                                  : "text-gray-400",
                                        )}
                                    >
                                        {email.snippet}
                                    </p>
                                    {email.tags && email.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {email.tags.map(
                                                (tag, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className={cn(
                                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                                                            tag.className,
                                                        )}
                                                        style={
                                                            tag.color
                                                                ? {
                                                                      backgroundColor: `${tag.color}20`,
                                                                      color: tag.color,
                                                                  }
                                                                : {}
                                                        }
                                                    >
                                                        {tag.name || tag.label}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Active Marker (Thanh màu bên trái khi đang xem email này) */}
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5c46e6]"></div>
                                )}
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
    onLoadMore?: () => void;
    isLoadingMore: boolean;
}) {
    const sentinelRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !onLoadMore || isLoadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            {
                root: null,
                rootMargin: "100px",
                threshold: 0.1,
            },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [onLoadMore, isLoadingMore]);

    return <div ref={sentinelRef} className="h-4" />;
}

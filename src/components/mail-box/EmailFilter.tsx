"use client";

import React from "react";
import { Filter, X, Calendar, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { EmailTag } from "@/api/mail-box";
import { useLanguage } from "@/contexts/LanguageContext";

export interface EmailFilterParams {
    Folder?: string;
    IsRead?: boolean;
    HasAttachments?: boolean;
    From?: string;
    Subject?: string;
    DateFrom?: string;
    DateTo?: string;
    SortBy?: string;
    SortOrder?: string;
    TagIds?: string[];
}

interface EmailFilterProps {
    filters: EmailFilterParams;
    onFilterChange: (filters: EmailFilterParams) => void;
    onApply?: () => void;
    className?: string;
    availableTags?: EmailTag[];
}

export function EmailFilter({
    filters,
    onFilterChange,
    onApply,
    className,
    availableTags = [],
}: EmailFilterProps) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const [tempFilters, setTempFilters] =
        React.useState<EmailFilterParams>(filters);

    React.useEffect(() => {
        setTempFilters(filters);
    }, [filters]);

    const handleTempFilterChange = (
        key: keyof EmailFilterParams,
        value: any,
    ) => {
        setTempFilters({
            ...tempFilters,
            [key]: value,
        });
    };

    const handleClearFilters = () => {
        setTempFilters({});
        onFilterChange({});
        setIsOpen(false);
        onApply?.();
    };

    const handleApply = () => {
        onFilterChange(tempFilters);
        setIsOpen(false);
        onApply?.();
    };

    // Keys to ignore when counting active filters
    const ignoredKeys = ["Folder", "SortBy", "SortOrder", "Page", "PageSize"];

    const activeFilterCount = Object.keys(filters).filter(
        (key) =>
            !ignoredKeys.includes(key) &&
            filters[key as keyof EmailFilterParams] !== undefined,
    ).length;

    const hasActiveFilters = activeFilterCount > 0;
    const today = new Date().toISOString().split("T")[0];

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 px-1.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors",
                        hasActiveFilters &&
                            "bg-[#5c46e6]/10 border-[#5c46e6] text-[#5c46e6]",
                        className,
                    )}
                >
                    <Filter className="h-3 w-3" />
                    {t("mail.filter")}
                    {hasActiveFilters && (
                        <span className="px-1.5 py-0.5 bg-[#5c46e6] text-white text-xs rounded-full min-w-[20px] text-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[420px] p-0"
                align="start"
                sideOffset={8}
            >
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-sm text-gray-900">
                            {t("mail.filter")}
                        </h3>
                    </div>

                    {/* Filter Content */}
                    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                        {/* Theo thời gian */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("mail.filter.byDate")}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="date"
                                        value={tempFilters.DateFrom || ""}
                                        onChange={(e) =>
                                            handleTempFilterChange(
                                                "DateFrom",
                                                e.target.value || undefined,
                                            )
                                        }
                                        max={tempFilters.DateTo || today}
                                        placeholder={t("mail.filter.dateFrom")}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        value={tempFilters.DateTo || ""}
                                        onChange={(e) =>
                                            handleTempFilterChange(
                                                "DateTo",
                                                e.target.value || undefined,
                                            )
                                        }
                                        min={tempFilters.DateFrom}
                                        max={today}
                                        placeholder={t("mail.filter.dateTo")}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Trạng thái */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("mail.filter.status")}
                            </label>
                            <Select
                                value={
                                    tempFilters.IsRead === undefined
                                        ? "all"
                                        : tempFilters.IsRead
                                          ? "true"
                                          : "false"
                                }
                                onValueChange={(value) =>
                                    handleTempFilterChange(
                                        "IsRead",
                                        value === "all"
                                            ? undefined
                                            : value === "true",
                                    )
                                }
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue
                                        placeholder={t("mail.filter.all")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t("mail.filter.all")}
                                    </SelectItem>
                                    <SelectItem value="false">
                                        {t("mail.filter.unread")}
                                    </SelectItem>
                                    <SelectItem value="true">
                                        {t("mail.filter.read")}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tệp đính kèm */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("mail.filter.attachments")}
                            </label>
                            <Select
                                value={
                                    tempFilters.HasAttachments === undefined
                                        ? "all"
                                        : tempFilters.HasAttachments
                                          ? "true"
                                          : "false"
                                }
                                onValueChange={(value) =>
                                    handleTempFilterChange(
                                        "HasAttachments",
                                        value === "all"
                                            ? undefined
                                            : value === "true",
                                    )
                                }
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue
                                        placeholder={t("mail.filter.all")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t("mail.filter.all")}
                                    </SelectItem>
                                    <SelectItem value="true">
                                        {t("mail.filter.hasAttachments")}
                                    </SelectItem>
                                    <SelectItem value="false">
                                        {t("mail.filter.noAttachments")}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nhãn */}
                        {availableTags && availableTags.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("mail.filter.classification")}
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            role="combobox"
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent bg-white transition-colors"
                                        >
                                            <span className="truncate">
                                                {tempFilters.TagIds &&
                                                tempFilters.TagIds.length > 0
                                                    ? `${tempFilters.TagIds.length} ${t("mail.filter.selected")}`
                                                    : t(
                                                          "mail.filter.selectLabel",
                                                      )}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder={t("mail.search")}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {t(
                                                        "mail.filter.noLabelsFound",
                                                    )}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {availableTags.map(
                                                        (tag) => {
                                                            const isSelected =
                                                                tempFilters.TagIds?.includes(
                                                                    tag.id,
                                                                );
                                                            return (
                                                                <CommandItem
                                                                    key={tag.id}
                                                                    onSelect={() => {
                                                                        const currentTags =
                                                                            tempFilters.TagIds ||
                                                                            [];
                                                                        let newTags;
                                                                        if (
                                                                            isSelected
                                                                        ) {
                                                                            newTags =
                                                                                currentTags.filter(
                                                                                    (
                                                                                        id,
                                                                                    ) =>
                                                                                        id !==
                                                                                        tag.id,
                                                                                );
                                                                        } else {
                                                                            newTags =
                                                                                [
                                                                                    ...currentTags,
                                                                                    tag.id,
                                                                                ];
                                                                        }
                                                                        // Update temp filters
                                                                        handleTempFilterChange(
                                                                            "TagIds",
                                                                            newTags.length >
                                                                                0
                                                                                ? newTags
                                                                                : undefined,
                                                                        );
                                                                    }}
                                                                >
                                                                    <span
                                                                        className="w-2 h-2 rounded-full flex-shrink-0 mr-2"
                                                                        style={{
                                                                            backgroundColor:
                                                                                tag.color,
                                                                        }}
                                                                    />
                                                                    <span>
                                                                        {
                                                                            tag.name
                                                                        }
                                                                    </span>
                                                                    {isSelected && (
                                                                        <span className="ml-auto flex h-4 w-4 items-center justify-center">
                                                                            <Check className="h-4 w-4 text-[#5c46e6]" />
                                                                        </span>
                                                                    )}
                                                                </CommandItem>
                                                            );
                                                        },
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {/* Tiêu đề */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("mail.subject")}
                            </label>
                            <input
                                type="text"
                                value={tempFilters.Subject || ""}
                                onChange={(e) =>
                                    handleTempFilterChange(
                                        "Subject",
                                        e.target.value || undefined,
                                    )
                                }
                                placeholder={t("mail.filter.searchSubject")}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent"
                            />
                        </div>

                        {/* Sắp xếp */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("mail.filter.sortBy")}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    value={tempFilters.SortBy || "DateReceived"}
                                    onValueChange={(value) =>
                                        handleTempFilterChange("SortBy", value)
                                    }
                                >
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue
                                            placeholder={t(
                                                "mail.filter.dateReceived",
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DateReceived">
                                            {t("mail.filter.dateReceived")}
                                        </SelectItem>
                                        <SelectItem value="Subject">
                                            {t("mail.subject")}
                                        </SelectItem>
                                        <SelectItem value="From">
                                            {t("mail.from")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={tempFilters.SortOrder || "desc"}
                                    onValueChange={(value) =>
                                        handleTempFilterChange(
                                            "SortOrder",
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue
                                            placeholder={t(
                                                "mail.filter.newest",
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">
                                            {t("mail.filter.newest")}
                                        </SelectItem>
                                        <SelectItem value="asc">
                                            {t("mail.filter.oldest")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3 bg-gray-50">
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            {t("mail.filter.clear")}
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 bg-[#5c46e6] text-white text-sm font-medium rounded-lg hover:bg-[#4a38b8] transition-colors"
                        >
                            {t("mail.apply")}
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "./scroll-area";

export interface SearchableSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
    icon?: React.ReactNode;
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
    searchPlaceholder?: string;
    maxHeight?: number;
    groupBy?: (option: SearchableSelectOption) => string;
    renderOption?: (option: SearchableSelectOption) => React.ReactNode;
    onSearch?: (query: string) => void;
    renderEmptyComponent?: (searchQuery: string) => React.ReactNode;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Chọn một mục...",
    emptyMessage = "Không tìm thấy kết quả.",
    disabled = false,
    className,
    triggerClassName,
    contentClassName,
    searchPlaceholder = "Tìm kiếm...",
    maxHeight = 300,
    groupBy,
    renderOption,
    onSearch,
    renderEmptyComponent,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Đảm bảo options không có mục trùng lặp
    const uniqueOptions = React.useMemo(() => {
        const uniqueMap = new Map();
        options.forEach((option) => {
            if (!uniqueMap.has(option.value)) {
                uniqueMap.set(option.value, option);
            }
        });
        return Array.from(uniqueMap.values());
    }, [options]);

    // Xử lý tìm kiếm
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery || onSearch) return uniqueOptions;

        return uniqueOptions.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [uniqueOptions, searchQuery, onSearch]);

    // Xử lý thay đổi query tìm kiếm
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (onSearch) {
            onSearch(query);
        }
    };

    // Nhóm các tùy chọn nếu cần
    const groupedOptions = React.useMemo(() => {
        if (!groupBy) return { "": filteredOptions };

        return filteredOptions.reduce<Record<string, SearchableSelectOption[]>>(
            (groups, option) => {
                const group = groupBy(option);
                if (!groups[group]) groups[group] = [];
                groups[group].push(option);
                return groups;
            },
            {}
        );
    }, [filteredOptions, groupBy]);

    // Lấy nhãn của giá trị đã chọn
    const selectedLabel = React.useMemo(() => {
        const selectedOption = uniqueOptions.find(
            (option) => option.value === value
        );
        return selectedOption ? selectedOption.label : placeholder;
    }, [uniqueOptions, value, placeholder]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal",
                        disabled && "cursor-not-allowed opacity-50",
                        triggerClassName
                    )}
                    onClick={() => !disabled && setOpen(!open)}
                    disabled={disabled}
                >
                    <span className="truncate font-medium">
                        {selectedLabel}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("p-0", contentClassName)}
                align="start"
                sideOffset={5}
                style={{ width: "var(--radix-popover-trigger-width)" }}
            >
                <Command
                    className={cn("rounded-lg border shadow-md", className)}
                >
                    <CommandInput
                        placeholder={searchPlaceholder}
                        onValueChange={handleSearchChange}
                        value={searchQuery}
                        className="h-9"
                    />
                    <CommandList className={cn("max-h-[300px] overflow-auto")}>
                        {renderEmptyComponent ? (
                            <CommandEmpty>
                                {renderEmptyComponent(searchQuery)}
                            </CommandEmpty>
                        ) : (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        )}
                        {Object.entries(groupedOptions).map(
                            ([group, groupOptions]) => (
                                <CommandGroup
                                    key={group}
                                    heading={group || undefined}
                                    className="overflow-visible"
                                >
                                    <ScrollArea
                                        className={`max-h-[${maxHeight}px]`}
                                    >
                                        {groupOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                onSelect={() => {
                                                    onChange(option.value);
                                                    setOpen(false);
                                                    setSearchQuery("");
                                                }}
                                                disabled={option.disabled}
                                                className={cn(
                                                    "flex items-center gap-2",
                                                    option.disabled &&
                                                        "cursor-not-allowed opacity-50"
                                                )}
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4",
                                                        value === option.value
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                {option.icon && (
                                                    <span className="mr-1">
                                                        {option.icon}
                                                    </span>
                                                )}
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium">
                                                        {option.label}
                                                    </p>
                                                    {option.description && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {option.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            )
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

import { Badge } from "@/components/ui/badge";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { Check, ChevronsUpDown, Trash2, X } from "lucide-react";
import * as React from "react";
import Avatar from "react-avatar";

interface MultiSelectProps {
    options: {
        value: string;
        label: string;
        labelGroup?: string;
        avatar?: string;
        showAvatar?: boolean;
        hexCode?: string;
        useNameAsValue?: boolean;
        price?: number;
    }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    className?: string;
    textClassName?: string;
    buttonClassName?: string;
    maxHeight?: number;
    placeholder?: string;
    hideChevron?: boolean;
    hideBadges?: boolean;
    showAllBadges?: boolean; // New prop to force showing all badges instead of count
    onSearchChange?: (value: string) => void;
    renderNoResults?: () => React.ReactNode;
    renderSelectedItems?: () => React.ReactNode;
    onDeleteOption?: (value: string) => void;
}

// Memoized option item to prevent unnecessary re-renders
const OptionItem = React.memo(
    ({
        option,
        isSelected,
        onSelect,
        onDelete,
    }: {
        option: MultiSelectProps["options"][number];
        isSelected: boolean;
        onSelect: () => void;
        onDelete?: () => void;
    }) => {
        return (
            <CommandItem
                value={option.label}
                onSelect={onSelect}
                className="flex items-center gap-2 group justify-between"
            >
                <div
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        isSelected ? "bg-primary border-primary" : "opacity-50"
                    }`}
                >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                {option.showAvatar && option.avatar && (
                    <div
                        className="h-5 w-5 rounded-full bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${option.avatar})`,
                        }}
                    ></div>
                )}
                {option.showAvatar && !option.avatar && (
                    <Avatar
                        name={getFirstAndLastWord(option.label) || ""}
                        src={getAvatarUrl(option.avatar || "") || ""}
                        size={"20"}
                        round
                    />
                )}
                {option.hexCode && (
                    <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: option.hexCode }}
                    ></div>
                )}
                <div className="flex flex-col flex-1">
                    <span>{option.label}</span>
                    {option.price !== undefined && (
                        <span className="text-xs text-gray-500">
                            {option.price.toLocaleString()} đ
                        </span>
                    )}
                </div>
                {onDelete && (
                    <div
                        className="p-1 hover:bg-red-100 rounded cursor-pointer text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete();
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </div>
                )}
            </CommandItem>
        );
    },
);

OptionItem.displayName = "OptionItem";

// Memoized badge to prevent unnecessary re-renders
const SelectedBadge = React.memo(
    ({
        label,
        onRemove,
        hexCode,
    }: {
        label: string;
        onRemove: (e: React.MouseEvent) => void;
        hexCode?: string;
    }) => (
        <Badge
            variant="secondary"
            className="font-medium rounded-lg bg-white border-[1px] border-slate-700 py-1 px-2 hover:bg-transparent truncate max-w-[120px] flex-shrink-0"
            onClick={onRemove}
        >
            {hexCode && (
                <div
                    className="h-2 w-2 rounded-full mr-1 flex-shrink-0"
                    style={{ backgroundColor: hexCode }}
                />
            )}
            <span className="truncate">{label}</span>
            <div
                className="ml-1 ring-offset-background rounded-lg outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onRemove(e as unknown as React.MouseEvent);
                    }
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(e);
                }}
            >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </div>
        </Badge>
    ),
);

SelectedBadge.displayName = "SelectedBadge";

export const MultiSelect = React.memo(function MultiSelect({
    options = [],
    selected = [],
    onChange,
    className,
    textClassName,
    buttonClassName,
    maxHeight = 200,
    placeholder = "Tất cả",
    hideChevron = false,
    hideBadges = false,
    showAllBadges = false,
    onSearchChange,
    renderNoResults,
    renderSelectedItems,
    onDeleteOption,
    ...props
}: MultiSelectProps) {
    const { t } = useLanguage();
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const listRef = React.useRef<HTMLDivElement>(null);

    // Xử lý sự kiện wheel để scroll
    const handleWheel = React.useCallback((e: WheelEvent) => {
        if (listRef.current) {
            e.preventDefault();
            listRef.current.scrollTop += e.deltaY;
        }
    }, []);

    // Thêm và xóa event listener khi component mount/unmount
    React.useEffect(() => {
        const currentListRef = listRef.current;
        if (currentListRef) {
            currentListRef.addEventListener("wheel", handleWheel, {
                passive: false,
            });
            return () => {
                currentListRef.removeEventListener("wheel", handleWheel);
            };
        }
    }, [handleWheel, open]);

    const groupedOptions = React.useMemo(() => {
        const groups: Record<string, typeof options> = {};
        options.forEach((option) => {
            const group = option.labelGroup || "";
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(option);
        });
        return groups;
    }, [options]);

    const handleUnselect = React.useCallback(
        (item: string) => {
            onChange(selected.filter((i) => i !== item));
        },
        [onChange, selected],
    );

    // Lấy ra các tên của các item đã chọn
    const selectedLabels = React.useMemo(() => {
        return selected
            .map(
                (item) =>
                    options.find((option) => option.value === item)?.label ||
                    "",
            )
            .filter(Boolean);
    }, [selected, options]);

    // Hiển thị số lượng mục đã chọn thay vì tất cả các badge khi có nhiều mục
    // Unless showAllBadges is true, then always show badges
    const shouldShowCount =
        selected.length > 1 && !hideBadges && !showAllBadges;
    const displayCount = shouldShowCount ? selected.length : 0;

    const handleSelectOption = React.useCallback(
        (option: MultiSelectProps["options"][number]) => {
            const value = option.useNameAsValue ? option.label : option.value;
            onChange(
                selected.includes(value)
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
            );
        },
        [onChange, selected],
    );

    // Handle search input change
    const handleSearchInputChange = React.useCallback(
        (value: string) => {
            setSearchValue(value);
            if (onSearchChange) {
                onSearchChange(value);
            }
        },
        [onSearchChange],
    );

    // Custom empty content renderer (used inside CommandEmpty only)
    const renderEmptyContent = React.useCallback(() => {
        if (renderNoResults) return renderNoResults();
        return t("common.noResult");
    }, [renderNoResults, t]);

    // Reset search value when popover closes
    const handleOpenChange = React.useCallback(
        (newOpen: boolean) => {
            setOpen(newOpen);
            if (!newOpen) {
                setSearchValue("");
                if (onSearchChange) {
                    onSearchChange("");
                }
            }
        },
        [onSearchChange],
    );

    return (
        <Popover open={open} onOpenChange={handleOpenChange} {...props}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-full justify-between !items-start ${selected.length > 0 ? "!h-auto" : ""} ${
                        buttonClassName || ""
                    }`}
                    onClick={() => setOpen(!open)}
                >
                    <div className="flex items-start w-full gap-2">
                        {renderSelectedItems ? (
                            // Sử dụng renderSelectedItems tùy chỉnh nếu có
                            renderSelectedItems()
                        ) : (
                            <>
                                {selected.length === 0 && (
                                    <div
                                        className={`truncate ${
                                            textClassName || ""
                                        }`}
                                    >
                                        {placeholder}
                                    </div>
                                )}

                                {hideBadges && selected.length > 0 && (
                                    <div
                                        className={`text-left truncate ${
                                            textClassName || ""
                                        }`}
                                    >
                                        {placeholder !== "Tất cả"
                                            ? placeholder
                                            : selectedLabels.join(", ")}
                                    </div>
                                )}

                                {!hideBadges &&
                                    !shouldShowCount &&
                                    selected.length > 0 && (
                                        <div className="flex gap-2 flex-wrap flex-1 min-w-0 py-1">
                                            {selected.map((item, index) => {
                                                const option = options.find(
                                                    (e) => e.value === item,
                                                );
                                                return option ? (
                                                    <SelectedBadge
                                                        key={index}
                                                        label={option.label}
                                                        hexCode={option.hexCode}
                                                        onRemove={(e) => {
                                                            e.stopPropagation();
                                                            handleUnselect(
                                                                item,
                                                            );
                                                        }}
                                                    />
                                                ) : null;
                                            })}
                                        </div>
                                    )}

                                {shouldShowCount && (
                                    <div className="flex items-center">
                                        <Badge
                                            variant="secondary"
                                            className="font-medium rounded-lg bg-white border-[1px] border-slate-700 py-1"
                                        >
                                            {displayCount}{" "}
                                            {t("common.selected")}
                                        </Badge>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {!hideChevron && (
                        <ChevronsUpDown
                            className={`h-4 w-4 shrink-0 opacity-50 ${selected.length > 0 ? "mt-2 ml-2" : ""} `}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[300px] p-0"
                sideOffset={5}
            >
                <Command
                    className={`${className} overflow-hidden flex flex-col`}
                    filter={(value, search) => {
                        if (value.toLowerCase().includes(search.toLowerCase()))
                            return 1;
                        return 0;
                    }}
                >
                    <CommandInput
                        placeholder={t("common.search")}
                        value={searchValue}
                        onValueChange={handleSearchInputChange}
                    />
                    <CommandEmpty>{renderEmptyContent()}</CommandEmpty>
                    <div className="flex-1 overflow-hidden">
                        <CommandList
                            ref={listRef}
                            className="max-h-[200px] overflow-auto custom-scrollbar"
                        >
                            {Object.entries(groupedOptions).map(
                                ([group, groupOptions]) => (
                                    <CommandGroup key={group} heading={group}>
                                        {groupOptions.map((option, index) => (
                                            <OptionItem
                                                key={`${group}-${option.value}-${index}`}
                                                option={option}
                                                isSelected={selected.includes(
                                                    option.useNameAsValue
                                                        ? option.label
                                                        : option.value,
                                                )}
                                                onSelect={() => {
                                                    handleSelectOption(option);
                                                    setOpen(true);
                                                }}
                                                onDelete={
                                                    onDeleteOption
                                                        ? () =>
                                                              onDeleteOption(
                                                                  option.value,
                                                              )
                                                        : undefined
                                                }
                                            />
                                        ))}
                                    </CommandGroup>
                                ),
                            )}
                        </CommandList>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
});

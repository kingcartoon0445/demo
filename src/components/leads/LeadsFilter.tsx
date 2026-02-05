import { useLanguage } from "@/contexts/LanguageContext";
import { useMultiSelect } from "@/contexts/MultiSelectContext";
import { useLeadsFilter } from "@/hooks/leads_data";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@radix-ui/react-popover";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TimeDropdown from "../common/TimeDropDown";
import { CustomerTagsMultiSelector } from "../componentsWithHook/CustomerTagsMultiSelector";
import { OrgMembersMultiSelect } from "../componentsWithHook/MemberMultiSelector";
import { UtmSourceMultiSelector } from "../componentsWithHook/UtmSourceMultiSelector";
import { FilterListIcon } from "../icons";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { MultiSelect } from "../ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
    useBulkArchiveLead,
    useBulkArchiveRestoreLead,
    useBulkDeleteLead,
} from "@/hooks/useCustomerV2";

export default function LeadsFilter({
    isArchiveMode = false,
    breakpoint = "base",
}: {
    breakpoint?: string;
    isArchiveMode?: boolean;
}) {
    const { filter, archiveFilter, setFilter, setArchiveFilter } =
        useLeadsFilter();
    const { isMultiSelectMode, selectedItems, clearSelection } =
        useMultiSelect();

    // Chọn filter và setter dựa trên mode
    const currentFilter = isArchiveMode ? archiveFilter : filter;
    const setCurrentFilter = isArchiveMode ? setArchiveFilter : setFilter;
    const { orgId } = useParams<{ orgId: string }>();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    // State for date filtering - khởi tạo từ global state
    const [date, setDate] = useState({
        from: currentFilter.from || startOfDay(addDays(new Date(), -9999)),
        to: currentFilter.to || endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState<string>(
        currentFilter.dateSelected || "-9999"
    );

    // State for active tab
    const [activeTab, setActiveTab] = useState("manual");

    // State for filter values - khởi tạo từ global state
    const [selectedTags, setSelectedTags] = useState<string[]>(
        currentFilter.tagSelected || []
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        currentFilter.categorySelected || []
    );
    const [selectedUtmSources, setSelectedUtmSources] = useState<string[]>(
        currentFilter.sourceSelected || []
    );
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        currentFilter.assignTo || []
    );

    // State for system filters - khởi tạo từ global state
    const [selectedSystemFilters, setSelectedSystemFilters] = useState<
        string[]
    >(() => {
        // Ưu tiên từ systemFilters nếu có, không thì từ customConditions
        if (
            currentFilter.systemFilters &&
            currentFilter.systemFilters.length > 0
        ) {
            return currentFilter.systemFilters;
        }

        // Extract system filters từ customConditions trong filterBody
        const customConditions =
            currentFilter.filterBody?.customConditions || [];
        return customConditions
            .map((condition: any) => {
                if (
                    condition.field === "email" &&
                    condition.operator === "IS NOT NULL"
                ) {
                    return "has_email";
                }
                if (
                    condition.field === "phone" &&
                    condition.operator === "IS NOT NULL"
                ) {
                    return "has_phone";
                }
                return null;
            })
            .filter(Boolean);
    });

    // Sync local state với global state khi global state thay đổi
    useEffect(() => {
        // Đồng bộ date state
        if (currentFilter.from && currentFilter.to) {
            setDate({
                from: currentFilter.from,
                to: currentFilter.to,
            });
        }
        if (currentFilter.dateSelected) {
            setDateSelected(currentFilter.dateSelected);
        }

        // Đồng bộ filter values
        setSelectedTags(currentFilter.tagSelected || []);
        setSelectedCategories(currentFilter.categorySelected || []);
        setSelectedUtmSources(currentFilter.sourceSelected || []);
        setSelectedAssignees(currentFilter.assignTo || []);

        // Đồng bộ system filters - ưu tiên từ systemFilters nếu có, không thì từ customConditions
        if (
            currentFilter.systemFilters &&
            currentFilter.systemFilters.length > 0
        ) {
            setSelectedSystemFilters(currentFilter.systemFilters);
        } else {
            const customConditions =
                currentFilter.filterBody?.customConditions || [];
            const systemFilters = customConditions
                .map((condition: any) => {
                    if (
                        condition.field === "email" &&
                        condition.operator === "IS NOT NULL"
                    ) {
                        return "has_email";
                    }
                    if (
                        condition.field === "phone" &&
                        condition.operator === "IS NOT NULL"
                    ) {
                        return "has_phone";
                    }
                    return null;
                })
                .filter(Boolean);
            setSelectedSystemFilters(systemFilters);
        }
    }, [currentFilter]);

    // Initialize with default filter body if not set
    useEffect(() => {
        if (!currentFilter.filterBody) {
            const defaultFilterBody: any = {
                limit: 20,
            };

            // Chỉ thêm date nếu không phải là default range (-9999 days)
            const startDateFormatted = formatDateForApi(date.from);
            const endDateFormatted = formatDateForApi(date.to);

            // Chỉ thêm date nếu không phải là default "toàn bộ thời gian"
            if (dateSelected !== "-9999") {
                if (startDateFormatted) {
                    defaultFilterBody.startDate = startDateFormatted;
                }
                if (endDateFormatted) {
                    defaultFilterBody.endDate = endDateFormatted;
                }
            }

            // Set default filter body in global state
            setCurrentFilter({
                ...currentFilter,
                filterBody: defaultFilterBody,
            });
        }
    }, []);

    // System tab filter options với mapping cho customCondition
    const systemFilterOptions = [
        {
            label: "Khách hàng có mail",
            value: "has_email",
            field: "email",
            operator: "IS NOT NULL",
        },
        {
            label: "Khách hàng có số điện thoại",
            value: "has_phone",
            field: "phone",
            operator: "IS NOT NULL",
        },
    ];

    // Handle system filter checkbox change
    const handleSystemFilterChange = (value: string, checked: boolean) => {
        if (checked) {
            setSelectedSystemFilters((prev) => [...prev, value]);
        } else {
            setSelectedSystemFilters((prev) =>
                prev.filter((item) => item !== value)
            );
        }
    };

    // Category options
    const categoryOptions = [
        { value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82", label: "Nhập vào" },
        { value: "3b70970b-e448-46fa-af8f-6605855a6b52", label: "Form" },
        { value: "38b353c3-ecc8-4c62-be27-229ef47e622d", label: "AIDC" },
    ];

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    // Format date to API expected format: YYYY-MM-DD
    const formatDateForApi = (date: Date | null): string => {
        if (!date) return "";
        return format(date, "yyyy-MM-dd");
    };

    // Apply filter function
    const applyFilter = () => {
        if (activeTab === "manual") {
            // Format dates for API - luôn format dù có là -9999 hay không
            const startDateFormatted = formatDateForApi(date.from);
            const endDateFormatted = formatDateForApi(date.to);

            // Tạo filter body thay vì URL params - chỉ include field có giá trị
            const filterBody: any = {
                limit: 20,
            };

            // Chỉ thêm field nếu có giá trị
            if (startDateFormatted) {
                filterBody.startDate = startDateFormatted;
            }
            if (endDateFormatted) {
                filterBody.endDate = endDateFormatted;
            }
            if (selectedTags.length > 0) {
                filterBody.tags = selectedTags;
            }
            if (selectedCategories.length > 0) {
                filterBody.sourceIds = selectedCategories;
            }
            if (selectedUtmSources.length > 0) {
                filterBody.utmSources = selectedUtmSources;
            }
            if (selectedAssignees.length > 0) {
                filterBody.assignees = selectedAssignees;
            }

            // Thêm customCondition nếu có system filters được chọn
            if (selectedSystemFilters.length > 0) {
                const customConditions = selectedSystemFilters.map(
                    (filterValue) => {
                        const filterOption = systemFilterOptions.find(
                            (option) => option.value === filterValue
                        );
                        return {
                            field: filterOption?.field,
                            operator: filterOption?.operator,
                        };
                    }
                );
                filterBody.customConditions = customConditions;
            }

            // Update the filter state with all values để persist khi đóng/mở lại
            setCurrentFilter({
                ...currentFilter,
                from: date.from,
                to: date.to,
                dateSelected: dateSelected,
                startDate: startDateFormatted,
                endDate: endDateFormatted,
                tagSelected: selectedTags,
                categorySelected: selectedCategories,
                sourceSelected: selectedUtmSources,
                assignTo: selectedAssignees,
                filterBody: filterBody, // Lưu body filter vào state
            });

            // React Query sẽ tự fetch do queryKey thay đổi trong CustomerList
        } else if (activeTab === "system") {
            // Apply system filters
            const filterBody: any = {
                limit: 20,
            };

            // Thêm customCondition cho system filters
            if (selectedSystemFilters.length > 0) {
                const customConditions = selectedSystemFilters.map(
                    (filterValue) => {
                        const filterOption = systemFilterOptions.find(
                            (option) => option.value === filterValue
                        );
                        return {
                            field: filterOption?.field,
                            operator: filterOption?.operator,
                        };
                    }
                );
                filterBody.customConditions = customConditions;
            }

            // Update the filter state với system filters - cần lưu để restore lại
            setCurrentFilter({
                ...currentFilter,
                filterBody: filterBody,
                // Lưu system filters để có thể restore lại khi mở filter
                systemFilters: selectedSystemFilters,
            });

            // React Query sẽ tự fetch do queryKey thay đổi trong CustomerList
        }
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        // Check if date is not default range
        const isDefaultDate = dateSelected === "-9999";

        // Check if any filter values are selected
        const hasSelectedTags = selectedTags.length > 0;
        const hasSelectedCategories = selectedCategories.length > 0;
        const hasSelectedUtmSources = selectedUtmSources.length > 0;
        const hasSelectedAssignees = selectedAssignees.length > 0;
        const hasSelectedSystemFilters = selectedSystemFilters.length > 0;

        return (
            !isDefaultDate ||
            hasSelectedTags ||
            hasSelectedCategories ||
            hasSelectedUtmSources ||
            hasSelectedAssignees ||
            hasSelectedSystemFilters
        );
    };

    // Clear all filters
    const clearFilters = () => {
        setDate({
            from: startOfDay(addDays(new Date(), -9999)),
            to: endOfDay(new Date()),
        });
        setDateSelected("-9999");
        setSelectedTags([]);
        setSelectedCategories([]);
        setSelectedUtmSources([]);
        setSelectedAssignees([]);
        setSelectedSystemFilters([]);

        // Tạo filter body rỗng - chỉ có limit
        const emptyFilterBody = {
            limit: 20,
        };

        // Reset tất cả filter state về default
        setCurrentFilter({
            ...currentFilter,
            from: startOfDay(addDays(new Date(), -9999)),
            to: endOfDay(new Date()),
            dateSelected: "-9999",
            startDate: "",
            endDate: "",
            tagSelected: [],
            categorySelected: [],
            sourceSelected: [],
            assignTo: [],
            systemFilters: [], // Reset system filters
            filterBody: emptyFilterBody,
        });

        // React Query sẽ tự fetch do queryKey thay đổi trong CustomerList
    };

    const handleArchiveMutate = useBulkArchiveLead(orgId);
    const handleArchiveRestoreMutate = useBulkArchiveRestoreLead(orgId);
    const handleDeleteMutate = useBulkDeleteLead(orgId);

    const onArchiveClick = () => {
        const body = {
            leadIds: Array.from(selectedItems),
        };
        handleArchiveMutate.mutate(
            {
                body: body,
            },
            {
                onSuccess: () => {
                    clearSelection();
                },
            }
        );
    };

    const onRestoreClick = () => {
        const body = {
            leadIds: Array.from(selectedItems),
        };
        handleArchiveRestoreMutate.mutate(
            {
                body: body,
            },
            {
                onSuccess: () => {
                    clearSelection();
                },
            }
        );
    };

    const onDeleteClick = () => {
        const body = {
            leadIds: Array.from(selectedItems),
        };
        handleDeleteMutate.mutate(
            {
                body: body,
            },
            {
                onSuccess: () => {
                    clearSelection();
                },
            }
        );
    };

    // Nếu đang trong multi-select mode, hiển thị 2 nút thay vì filter
    if (isMultiSelectMode) {
        return (
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-sm font-normal text-[#646A73]"
                    onClick={() => {
                        if (isArchiveMode) {
                            // TODO: Implement restore functionality
                            onRestoreClick();
                        } else {
                            // TODO: Implement archive functionality
                            onArchiveClick();
                        }
                    }}
                >
                    {isArchiveMode ? (
                        <>
                            <RotateCcw className="size-4 mr-1" />
                            Khôi phục ({selectedItems.size})
                        </>
                    ) : (
                        <>
                            <Archive className="size-4 mr-1" />
                            Lưu trữ ({selectedItems.size})
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-sm font-normal text-red-600 hover:text-red-700"
                    onClick={() => {
                        // TODO: Implement delete functionality
                        onDeleteClick();
                    }}
                >
                    <Trash2 className="size-4 mr-1" />
                    Xóa ({selectedItems.size})
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-normal text-[#646A73]"
                    onClick={clearSelection}
                >
                    Hủy
                </Button>
            </div>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                {breakpoint == "xl" || breakpoint == "2xl" ? (
                    <Button
                        variant={hasActiveFilters() ? "default" : "outline"}
                        size="sm"
                        className={`text-sm font-normal ${
                            hasActiveFilters() ? "text-white" : "text-[#646A73]"
                        }`}
                    >
                        <FilterListIcon
                            className={`size-4 ${
                                hasActiveFilters()
                                    ? "text-white"
                                    : "text-[#646A73]"
                            }`}
                        />
                        {t("common.filter")}
                    </Button>
                ) : (
                    <Button
                        variant={hasActiveFilters() ? "default" : "outline"}
                        size="sm"
                        className={`text-sm font-normal ${
                            hasActiveFilters() ? "text-white" : "text-[#646A73]"
                        }`}
                    >
                        <FilterListIcon
                            className={`size-4 ${
                                hasActiveFilters()
                                    ? "text-white"
                                    : "text-[#646A73]"
                            }`}
                        />
                    </Button>
                )}
            </PopoverTrigger>

            <PopoverContent className="rounded-xl flex flex-col w-[350px] px-0 z-50 bg-white shadow-lg">
                <Tabs defaultValue="manual" onValueChange={handleTabChange}>
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="manual">Thủ công</TabsTrigger>
                        <TabsTrigger value="system">Hệ thống</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="leading-none font-medium p-4 mb-0">
                                    Bộ lọc
                                </h4>
                                <div className="border-b"></div>
                            </div>
                            <div className="flex flex-col gap-2 w-full px-4 pb-4">
                                <div className="w-full">
                                    <div className="font-medium text-[14px] items-start w-full flex flex-col gap-2">
                                        <Label>Theo thời gian</Label>
                                        <TimeDropdown
                                            date={date}
                                            setDate={setDate}
                                            dateSelect={dateSelected}
                                            setDateSelect={setDateSelected}
                                            className={"bg-[var(--bg2)]"}
                                            variant="none"
                                            align="start"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="maxWidth"
                                        className="text-sm"
                                    >
                                        Nhãn
                                    </Label>
                                    <CustomerTagsMultiSelector
                                        orgId={orgId}
                                        value={selectedTags}
                                        onChange={setSelectedTags}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="maxWidth"
                                        className="text-sm"
                                    >
                                        Phân loại
                                    </Label>
                                    <MultiSelect
                                        options={categoryOptions}
                                        selected={selectedCategories}
                                        onChange={setSelectedCategories}
                                        className="w-[300px]"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="maxWidth"
                                        className="text-sm"
                                    >
                                        Nguồn
                                    </Label>
                                    <UtmSourceMultiSelector
                                        orgId={orgId}
                                        onChange={setSelectedUtmSources}
                                        value={selectedUtmSources}
                                        placeholder="Chọn nguồn"
                                        hideChevron={false}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="height" className="text-sm">
                                        Phụ trách
                                    </Label>
                                    <OrgMembersMultiSelect
                                        orgId={orgId}
                                        onChange={setSelectedAssignees}
                                        value={selectedAssignees}
                                        placeholder="Chọn thành viên"
                                    />
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="text-sm"
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                    <Button
                                        onClick={applyFilter}
                                        className="bg-primary text-white text-sm"
                                    >
                                        Áp dụng
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="system">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="leading-none font-medium p-4 mb-0">
                                    Bộ lọc
                                </h4>
                                <div className="border-b"></div>
                            </div>
                            <div className="flex flex-col gap-2 w-full px-4 pb-4">
                                {systemFilterOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className="flex items-center space-x-2 py-2"
                                    >
                                        <Checkbox
                                            id={option.value}
                                            checked={selectedSystemFilters.includes(
                                                option.value
                                            )}
                                            onCheckedChange={(checked) =>
                                                handleSystemFilterChange(
                                                    option.value,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor={option.value}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {option.label}
                                        </Label>
                                    </div>
                                ))}
                                <div className="flex justify-between mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="text-sm"
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                    <Button
                                        onClick={applyFilter}
                                        className="bg-primary text-white text-sm"
                                    >
                                        Áp dụng
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}

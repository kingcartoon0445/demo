import { useCustomersFilter } from "@/hooks/customers_filter";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@radix-ui/react-popover";
import {
    addDays,
    addYears,
    differenceInDays,
    endOfDay,
    endOfYear,
    format,
    isSameDay,
    startOfDay,
    startOfYear,
} from "date-fns";
import { FilterIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TimeDropdown from "../common/TimeDropDown";
import { CustomerTagsMultiSelector } from "../componentsWithHook/CustomerTagsMultiSelector";
import { OrgMembersMultiSelect } from "../componentsWithHook/MemberMultiSelector";
import { UtmSourceMultiSelector } from "../componentsWithHook/UtmSourceMultiSelector";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { MultiSelect } from "../ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { FilterListIcon } from "../icons";

export default function CustomerFilter() {
    const { filter, setFilter } = useCustomersFilter();
    const { orgId } = useParams<{ orgId: string }>();

    // State for date filtering - khởi tạo từ global state
    const [date, setDate] = useState({
        from: filter.from || startOfDay(addDays(new Date(), -30)),
        to: filter.to || endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState<string>(
        filter.dateSelected || "-30",
    );

    // State for active tab
    const [activeTab, setActiveTab] = useState("manual");

    // State for filter values - khởi tạo từ global state
    const [selectedTags, setSelectedTags] = useState<string[]>(
        filter.tagSelected || [],
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        filter.categorySelected || [],
    );
    const [selectedUtmSources, setSelectedUtmSources] = useState<string[]>(
        filter.sourceSelected || [],
    );
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        filter.assignTo || [],
    );

    // State for system filters - khởi tạo từ global state
    const [selectedSystemFilters, setSelectedSystemFilters] = useState<
        string[]
    >(() => {
        // Ưu tiên từ systemFilters nếu có, không thì từ customConditions
        if (filter.systemFilters && filter.systemFilters.length > 0) {
            return filter.systemFilters;
        }

        // Extract system filters từ customConditions trong filterBody
        const customConditions = filter.filterBody?.customConditions || [];
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

    // Hàm phụ trợ - Xác định dateSelected dựa trên from và to
    const determineDateSelect = (from: Date, to: Date): string | null => {
        const today = new Date();
        const todayEnd = endOfDay(today);

        // Kiểm tra nếu là "Hôm nay"
        if (isSameDay(from, today) && isSameDay(to, today)) {
            return "0";
        }

        // Kiểm tra nếu là "Hôm qua"
        const yesterday = addDays(today, -1);
        if (isSameDay(from, yesterday) && isSameDay(to, yesterday)) {
            return "-1";
        }

        // Kiểm tra nếu là "7 ngày qua"
        const sevenDaysAgo = startOfDay(addDays(today, -7));
        if (isSameDay(from, sevenDaysAgo) && isSameDay(to, todayEnd)) {
            return "-7";
        }

        // Kiểm tra nếu là "30 ngày qua"
        const thirtyDaysAgo = startOfDay(addDays(today, -30));
        if (isSameDay(from, thirtyDaysAgo) && isSameDay(to, todayEnd)) {
            return "-30";
        }

        // Kiểm tra nếu là "Năm nay"
        const startThisYear = startOfYear(today);
        if (isSameDay(from, startThisYear) && isSameDay(to, todayEnd)) {
            return "thisyear";
        }

        // Kiểm tra nếu là "Năm ngoái"
        const lastYear = addYears(today, -1);
        const startLastYear = startOfYear(lastYear);
        const endLastYear = endOfYear(lastYear);
        if (isSameDay(from, startLastYear) && isSameDay(to, endLastYear)) {
            return "lastyear";
        }

        // Kiểm tra nếu là "Toàn bộ thời gian"
        const allTimeStart = startOfDay(addDays(today, -9999));
        if (
            Math.abs(differenceInDays(from, allTimeStart)) < 1 &&
            isSameDay(to, todayEnd)
        ) {
            return "-9999";
        }

        // Nếu không khớp với bất kỳ giá trị cố định nào, đây là custom range
        return null;
    };

    // Sync local state với global state khi global state thay đổi
    useEffect(() => {
        // Đồng bộ date state
        if (filter.from && filter.to) {
            setDate({
                from: filter.from,
                to: filter.to,
            });
        }
        if (filter.dateSelected) {
            setDateSelected(filter.dateSelected);
        }

        // Đồng bộ filter values
        setSelectedTags(filter.tagSelected || []);
        setSelectedCategories(filter.categorySelected || []);
        setSelectedUtmSources(filter.sourceSelected || []);
        setSelectedAssignees(filter.assignTo || []);

        // Đồng bộ system filters - ưu tiên từ systemFilters nếu có, không thì từ customConditions
        if (filter.systemFilters && filter.systemFilters.length > 0) {
            setSelectedSystemFilters(filter.systemFilters);
        } else {
            const customConditions = filter.filterBody?.customConditions || [];
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
    }, [filter]);

    // Initialize with default filter body if not set
    useEffect(() => {
        if (!filter.filterBody) {
            const defaultFilterBody: any = {
                limit: 20,
            };

            // Chỉ thêm date nếu không phải là default range (-9999 days)
            const startDateFormatted = formatDateForApi(date.from);
            const endDateFormatted = formatDateForApi(date.to);

            // Luôn thêm date cho filter mặc định 30 ngày qua
            if (startDateFormatted) {
                defaultFilterBody.startDate = startDateFormatted;
            }
            if (endDateFormatted) {
                defaultFilterBody.endDate = endDateFormatted;
            }

            // Set default filter body in global state
            setFilter({
                ...filter,
                filterBody: defaultFilterBody,
            });
        }
    }, []);

    // System tab filter options với mapping cho customConditions
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
                prev.filter((item) => item !== value),
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
                            (option) => option.value === filterValue,
                        );
                        return {
                            field: filterOption?.field,
                            operator: filterOption?.operator,
                        };
                    },
                );
                filterBody.customConditions = customConditions;
            }

            // Update the filter state with all values để persist khi đóng/mở lại
            setFilter({
                ...filter,
                from: date.from,
                to: date.to,
                dateSelected: dateSelected,
                startDate: startDateFormatted,
                endDate: endDateFormatted,
                tagSelected: selectedTags,
                categorySelected: selectedCategories,
                sourceSelected: selectedUtmSources,
                assignTo: selectedAssignees,
                systemFilters: selectedSystemFilters, // Lưu system filters
                filterBody: filterBody, // Lưu body filter vào state
            });

            // React Query sẽ tự fetch do queryKey thay đổi trong CustomerList
        } else if (activeTab === "system") {
            // Apply system filters - giữ lại các filter từ tab thủ công
            const startDateFormatted = formatDateForApi(date.from);
            const endDateFormatted = formatDateForApi(date.to);

            const filterBody: any = {
                limit: 20,
            };

            // Giữ lại các filter từ tab thủ công
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

            // Thêm customCondition cho system filters
            if (selectedSystemFilters.length > 0) {
                const customConditions = selectedSystemFilters.map(
                    (filterValue) => {
                        const filterOption = systemFilterOptions.find(
                            (option) => option.value === filterValue,
                        );
                        return {
                            field: filterOption?.field,
                            operator: filterOption?.operator,
                        };
                    },
                );
                filterBody.customConditions = customConditions;
            }

            // Update the filter state với system filters - lưu tất cả để persist
            setFilter({
                ...filter,
                from: date.from,
                to: date.to,
                dateSelected: dateSelected,
                startDate: startDateFormatted,
                endDate: endDateFormatted,
                tagSelected: selectedTags,
                categorySelected: selectedCategories,
                sourceSelected: selectedUtmSources,
                assignTo: selectedAssignees,
                systemFilters: selectedSystemFilters, // Lưu system filters để restore lại
                filterBody: filterBody,
            });

            // React Query sẽ tự fetch do queryKey thay đổi trong CustomerList
        }
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        // Check if date is not default range (30 days)
        const isDefaultDate = dateSelected === "-30";

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
            from: startOfDay(addDays(new Date(), -30)),
            to: endOfDay(new Date()),
        });
        setDateSelected("-30");
        setSelectedTags([]);
        setSelectedCategories([]);
        setSelectedUtmSources([]);
        setSelectedAssignees([]);
        setSelectedSystemFilters([]);

        // Tạo filter body với date mặc định 30 ngày qua
        const emptyFilterBody = {
            limit: 20,
            startDate: formatDateForApi(startOfDay(addDays(new Date(), -30))),
            endDate: formatDateForApi(endOfDay(new Date())),
        };

        // Reset tất cả filter state về default
        setFilter({
            ...filter,
            from: startOfDay(addDays(new Date(), -30)),
            to: endOfDay(new Date()),
            dateSelected: "-30",
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

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-10 px-4 rounded-lg shadow-sm text-sm font-normal transition-all ${
                        hasActiveFilters()
                            ? "bg-indigo-600  hover:bg-indigo-700 text-white"
                            : "bg-white hover:bg-gray-50 text-gray-600 border-0"
                    }`}
                >
                    <FilterListIcon
                        className={`size-4 mr-1.5 ${
                            hasActiveFilters() ? "text-white" : "text-gray-500"
                        }`}
                    />
                    Bộ lọc
                </Button>
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
                                        className="text-sm rounded-lg"
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                    <Button
                                        onClick={applyFilter}
                                        className="bg-primary text-white text-sm rounded-lg"
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
                                                option.value,
                                            )}
                                            onCheckedChange={(checked) =>
                                                handleSystemFilterChange(
                                                    option.value,
                                                    checked as boolean,
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
                                        className="text-sm rounded-lg"
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                    <Button
                                        onClick={applyFilter}
                                        className="bg-primary text-white text-sm rounded-lg"
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

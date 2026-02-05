import { useDealsFilter } from "@/hooks/deals_data";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
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
// import { FilterIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TimeDropdown from "../common/TimeDropDown";
import BusinessProcessTagMultiSelector from "../componentsWithHook/BusinessProcessTagMultiSelector";
import { OrgMembersMultiSelect } from "../componentsWithHook/MemberMultiSelector";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useUserDetail } from "@/hooks/useUser";
import { FilterListIcon } from "../icons";
import useBreakpoint from "@/hooks/useBreakpoint";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

export default function DealFilter({ workspaceId }: { workspaceId?: string }) {
    const breakpoint = useBreakpoint();
    const { filter, setFilter } = useDealsFilter();
    const { orgId } = useParams<{ orgId: string }>();
    const { data: currentUser } = useUserDetail();

    // State for date filtering - khởi tạo từ global state
    const [date, setDate] = useState({
        from: filter.from || startOfDay(addDays(new Date(), -9999)),
        to: filter.to || endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState<string>(
        filter.dateSelected || "-9999"
    );

    // State for active tab
    const [activeTab, setActiveTab] = useState("manual");

    // State for filter values - khởi tạo từ global state
    const [selectedTags, setSelectedTags] = useState<string[]>(
        filter.tagSelected || []
    );
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        filter.assignTo || []
    );

    // State for system filters (deal status) - khởi tạo từ global state
    const [selectedSystemFilters, setSelectedSystemFilters] = useState<
        number[]
    >(filter.statusSelected || [1]); // Default to "Đang xử lý"

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
        setSelectedAssignees(filter.assignTo || []);
        setSelectedSystemFilters(filter.statusSelected || [1]);
    }, [filter]);

    // Initialize default assignee when current user is available (but don't apply filter yet)
    useEffect(() => {
        // Set current user as default assignee if available (UI only, not applied)
        if (
            currentUser?.id &&
            selectedAssignees.length === 0 &&
            !filter.isFilterApplied
        ) {
            setSelectedAssignees([currentUser.id]);
        }
    }, [currentUser, filter.isFilterApplied]);

    // System tab filter options for deal status
    const systemFilterOptions = [
        {
            label: "Tất cả giao dịch Đang lưu trữ",
            value: 5,
        },
        {
            label: "Tất cả giao dịch Đang xử lý",
            value: 1,
            isDefault: true,
        },
        {
            label: "Tất cả giao dịch Thất bại",
            value: 3,
        },
        {
            label: "Tất cả giao dịch Thành công",
            value: 2,
        },
    ];

    // Handle system filter checkbox change
    const handleSystemFilterChange = (value: number, checked: boolean) => {
        if (checked) {
            setSelectedSystemFilters((prev) => [...prev, value]);
        } else {
            setSelectedSystemFilters((prev) =>
                prev.filter((item) => item !== value)
            );
        }
    };

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
            if (selectedAssignees.length > 0) {
                filterBody.assignees = selectedAssignees;
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
                assignTo: selectedAssignees,
                statusSelected: selectedSystemFilters, // Lưu system filters
                filterBody: filterBody, // Lưu body filter vào state
                isFilterApplied: true, // Mark that user has applied a filter
            });

            // React Query sẽ tự fetch do queryKey thay đổi trong DealList
        } else if (activeTab === "system") {
            // Apply system filters
            const filterBody: any = {
                limit: 20,
            };

            // Thêm status filter cho system filters
            if (selectedSystemFilters.length > 0) {
                filterBody.status = selectedSystemFilters;
            }

            // Update the filter state
            setFilter({
                ...filter,
                statusSelected: selectedSystemFilters,
                filterBody: filterBody,
                isFilterApplied: true, // Mark that user has applied a filter
            });

            // React Query sẽ tự fetch do queryKey thay đổi trong DealList
        }
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        // Check if date is not default range
        const isDefaultDate = dateSelected === "-9999";

        // Check if any filter values are selected
        const hasSelectedTags = selectedTags.length > 0;
        const hasSelectedAssignees = selectedAssignees.length > 0;
        const hasSelectedSystemFilters =
            selectedSystemFilters.length > 0 &&
            !(
                selectedSystemFilters.length === 1 &&
                selectedSystemFilters.includes(1)
            ); // Not just default "Đang xử lý"

        return (
            !isDefaultDate ||
            hasSelectedTags ||
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
        setSelectedAssignees([]);
        setSelectedSystemFilters([1]); // Reset to default "Đang xử lý"

        // Tạo filter body với default values
        const defaultFilterBody = {
            limit: 20,
            status: [1], // Default status
        };

        // Set current user as default assignee if available
        if (currentUser?.id) {
            setSelectedAssignees([currentUser.id]);
            (defaultFilterBody as any).assignedTo = [currentUser.id];
        }

        // Reset filter state
        setFilter({
            ...filter,
            startDate: "",
            endDate: "",
            tagSelected: [],
            assignTo: currentUser?.id ? [currentUser.id] : [],
            statusSelected: [1],
            filterBody: null, // Clear filter completely
            isFilterApplied: false, // Mark that no filter is applied
        });

        // React Query sẽ tự fetch do queryKey thay đổi trong DealList
    };

    return (
        <Popover>
            {breakpoint == "2xl" ? (
                <PopoverTrigger asChild>
                    <Button
                        variant={hasActiveFilters() ? "default" : "outline"}
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
                        Bộ lọc
                    </Button>
                </PopoverTrigger>
            ) : (
                <TooltipProvider>
                    <Tooltip content="Bộ lọc">
                        <PopoverTrigger asChild>
                            <Button
                                variant={
                                    hasActiveFilters() ? "default" : "outline"
                                }
                                className={`text-sm font-normal ${
                                    hasActiveFilters()
                                        ? "text-white"
                                        : "text-[#646A73]"
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
                        </PopoverTrigger>
                    </Tooltip>
                </TooltipProvider>
            )}
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
                                {workspaceId && (
                                    <div className="flex flex-col gap-2">
                                        <Label
                                            htmlFor="maxWidth"
                                            className="text-sm"
                                        >
                                            Nhãn
                                        </Label>
                                        <BusinessProcessTagMultiSelector
                                            orgId={orgId}
                                            workspaceId={workspaceId}
                                            selected={selectedTags}
                                            onChange={setSelectedTags}
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="height" className="text-sm">
                                        Người phụ trách
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
                                    Bộ lọc hệ thống
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
                                            id={option.value.toString()}
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
                                            htmlFor={option.value.toString()}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {option.label}
                                            {option.isDefault && (
                                                <span className="ml-2 text-xs text-gray-500">
                                                    (Mặc định)
                                                </span>
                                            )}
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

"use client";

import { Glass } from "@/components/Glass";
import { GlassTabs } from "@/components/common/GlassTabs";
import { TableLoading } from "@/components/common/TableLoading";
import AddOrganizationModal from "@/components/customers/AddOrganizationModal";
import CustomerFilter from "@/components/customers/CustomerFilter";
import AddCustomerModal from "@/components/leads/AddCustomerModal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomersFilter } from "@/hooks/customers_filter";
import { useCustomerListV2ByPost } from "@/hooks/useCustomerV2";
import { Customer } from "@/lib/interface";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, X, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createColumns } from "./columns";
import { toast } from "react-hot-toast";

export default function CustomersPage() {
    const { t } = useLanguage();
    const { orgId } = useParams();
    const router = useRouter();
    const { filter } = useCustomersFilter();
    const [offset, setOffset] = useState(0);
    const [limit] = useState(10);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [columnVisibility, setColumnVisibility] = useState({
        assignees: true,
        email: true,
        phone: true,
        status: true,
        source: true,
        lastInteraction: true,
    });
    const [tabValue, setTabValue] = useState("personal");
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [isAddOrganizationModalOpen, setIsAddOrganizationModalOpen] =
        useState(false);
    // Debounce search text
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchText]);

    // Reset data when search changes or filter changes
    useEffect(() => {
        setOffset(0);
        setAllCustomers([]);
        setHasMore(true);
    }, [debouncedSearchText, filter.filterBody, tabValue]);

    // Create filter body with pagination and search
    const filterBody = useMemo(() => {
        const body = {
            ...filter.filterBody,
            limit: limit,
            offset: offset,
            isBusiness: tabValue === "organization",
        };

        // Add search text if provided
        if (debouncedSearchText) {
            body.searchText = debouncedSearchText;
        }

        return body;
    }, [filter.filterBody, limit, offset, tabValue, debouncedSearchText]);

    // Fetch customers data using the new hook
    const { data, isLoading, error } = useCustomerListV2ByPost(
        orgId as string,
        filterBody,
    );

    useEffect(() => {
        if (data && data?.code !== 0) {
            toast.error(
                data?.message || "Có lỗi xảy ra khi tải danh sách thành viên",
            );
        }
    }, [data]);

    // Update customers list when new data arrives
    useEffect(() => {
        if (data?.content && Array.isArray(data.content)) {
            const newCustomers = data.content as Customer[];

            if (offset === 0) {
                // Reset list if this is the first load
                setAllCustomers(newCustomers);
            } else {
                // Append new data if loading more
                setAllCustomers((prev) => [...prev, ...newCustomers]);
            }

            // Check if there's more data to load
            // If response is empty or has fewer items than limit, no more data
            setHasMore(newCustomers.length === limit);
        } else if (
            data?.content &&
            Array.isArray(data.content) &&
            data.content.length === 0
        ) {
            // If response is empty array, no more data
            if (offset === 0) {
                setAllCustomers([]);
            }
            setHasMore(false);
        }
    }, [data, offset, limit]);
    // Define columns for DataTable
    const columns = createColumns();

    // Filter columns based on visibility
    const visibleColumns = useMemo(() => {
        return columns.filter((column) => {
            // Always show customer column and actions column
            if (column.id === "actions") return true;
            if (column.id === "customer") return true;
            if (column.id === "assignees") return columnVisibility.assignees;
            // For other columns, check if they should be visible based on id
            if (column.id === "email") return columnVisibility.email;
            if (column.id === "phone") return columnVisibility.phone;
            if (column.id === "status") return columnVisibility.status;
            if (column.id === "source") return columnVisibility.source;
            if (column.id === "lastInteraction")
                return columnVisibility.lastInteraction;

            return true; // Default to showing any other columns
        });
    }, [columns, columnVisibility]);

    // Handle load more
    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            setOffset((prev) => prev + limit);
        }
    };

    // Handle row click
    const handleRowClick = (customer: Customer) => {
        // Navigate to customer detail page
        router.push(`/org/${orgId}/customers/${customer.id}`);
    };

    // Check if there are active filters
    const hasActiveFilters = () => {
        const filterBody = filter.filterBody || {};
        const hasSearch =
            debouncedSearchText && debouncedSearchText.trim() !== "";
        const hasDateFilter = filterBody.startDate || filterBody.endDate;
        const hasTagFilter = filterBody.tagIds && filterBody.tagIds.length > 0;
        const hasSourceFilter =
            filterBody.sourceIds && filterBody.sourceIds.length > 0;
        const hasAssigneeFilter =
            filterBody.assignTo && filterBody.assignTo.length > 0;
        const hasCategoryFilter =
            filterBody.categoryIds && filterBody.categoryIds.length > 0;
        const hasSystemFilter =
            filterBody.customConditions &&
            filterBody.customConditions.length > 0;

        return (
            hasSearch ||
            hasDateFilter ||
            hasTagFilter ||
            hasSourceFilter ||
            hasAssigneeFilter ||
            hasCategoryFilter ||
            hasSystemFilter
        );
    };

    // Get active filter labels
    const getActiveFilterLabels = () => {
        const labels = [];
        const filterBody = filter.filterBody || {};
        // Category options mapping
        const categoryOptions = [
            {
                value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82",
                label: "Nhập vào",
            },
            { value: "3b70970b-e448-46fa-af8f-6605855a6b52", label: "Form" },
            { value: "38b353c3-ecc8-4c62-be27-229ef47e622d", label: "AIDC" },
        ];

        if (debouncedSearchText && debouncedSearchText.trim() !== "") {
            labels.push(`Tìm kiếm: "${debouncedSearchText}"`);
        }

        if (filterBody.startDate || filterBody.endDate) {
            const startDate = filterBody.startDate
                ? new Date(filterBody.startDate).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                  })
                : "";
            const endDate = filterBody.endDate
                ? new Date(filterBody.endDate).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                  })
                : "";
            labels.push(`Ngày: ${startDate} - ${endDate}`);
        }

        if (filterBody.tags && filterBody.tags.length > 0) {
            labels.push(`Nhãn`);
        }

        if (filterBody.utmSources && filterBody.utmSources.length > 0) {
            // Map source IDs to names
            const sourceNames = filterBody.utmSources.map((id: string) => {
                const option = categoryOptions.find((opt) => opt.value === id);
                return option ? option.label : id;
            });
            labels.push(`Nguồn`);
        }

        if (filterBody.assignees && filterBody.assignees.length > 0) {
            labels.push(`Người phụ trách`);
        }

        if (
            filterBody.customConditions &&
            filterBody.customConditions.length > 0
        ) {
            filterBody.customConditions.forEach((condition: any) => {
                if (condition.field === "email") {
                    labels.push(`Khách hàng có mail`);
                }
                if (condition.field === "phone") {
                    labels.push(`Khách hàng có số điện thoại`);
                }
            });
            // labels.push(``);
        }

        return labels.join(", ");
    };

    return (
        <Glass
            intensity="high"
            className="h-screen flex flex-col rounded-2xl overflow-hidden p-2"
        >
            <div className="flex justify-between items-center mb-2">
                {/* Tabs bên trái */}
                <GlassTabs
                    tabs={[
                        { id: "personal", label: t("common.personal") },
                        { id: "organization", label: t("common.company") },
                    ]}
                    activeTab={tabValue}
                    onChange={setTabValue}
                />
            </div>

            <div className="flex items-center justify-between w-full gap-2 mb-2">
                <div className="flex items-center gap-2">
                    {hasActiveFilters() && (
                        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 flex items-center gap-2">
                            <span>{getActiveFilterLabels()}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t("common.searchCustomer")}
                            className="w-full pl-11 pr-10 h-10 rounded-lg bg-white border-0 shadow-sm text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        {searchText && (
                            <button
                                onClick={() => setSearchText("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <CustomerFilter />

                    <Button
                        size="sm"
                        className="h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        onClick={() => {
                            if (tabValue === "organization") {
                                setIsAddOrganizationModalOpen(true);
                            } else {
                                setIsAddCustomerModalOpen(true);
                            }
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        {tabValue === "organization"
                            ? "Thêm công ty"
                            : "Thêm mới"}
                    </Button>
                </div>
            </div>

            {isLoading && offset === 0 ? (
                <TableLoading />
            ) : error ? (
                <div className="text-center text-red-500">
                    Đã xảy ra lỗi khi tải dữ liệu
                </div>
            ) : (
                <>
                    <DataTable
                        columns={visibleColumns as ColumnDef<Customer>[]}
                        data={allCustomers}
                        onRowClick={handleRowClick}
                        emptyMessage="Không có khách hàng nào"
                        headerClassName="bg-transparent border-b border-gray-100 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                        rowClassName="h-16 hover:shadow-lg transition-all duration-200 bg-white border-b border-gray-100 last:border-none hover:z-10 relative hover:border-transparent hover:bg-white cursor-pointer"
                        className="bg-white rounded-2xl shadow-sm border-none"
                    />

                    {allCustomers.length > 0 && (
                        <div className="flex items-center justify-center mt-4">
                            {hasMore ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={handleLoadMore}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang tải...
                                        </>
                                    ) : (
                                        "Tải thêm"
                                    )}
                                </Button>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Đã hiển thị tất cả {allCustomers.length}{" "}
                                    khách hàng
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            {isAddCustomerModalOpen && (
                <AddCustomerModal
                    isOpen={isAddCustomerModalOpen}
                    onClose={() => setIsAddCustomerModalOpen(false)}
                    orgId={orgId as string}
                    provider="customer1"
                />
            )}
            {isAddOrganizationModalOpen && (
                <AddOrganizationModal
                    isOpen={isAddOrganizationModalOpen}
                    onClose={() => setIsAddOrganizationModalOpen(false)}
                    orgId={orgId as string}
                />
            )}
        </Glass>
    );
}

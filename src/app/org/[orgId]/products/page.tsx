"use client";

import { GlassTabs } from "@/components/common/GlassTabs";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination";
import { useGetCategory, useGetProducts } from "@/hooks/useProduct";
import { Product } from "@/lib/interface";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Dispatch,
    memo,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
// Import FancyBox
import Loading from "@/components/common/Loading";
import TimeDropdown from "@/components/common/TimeDropDown";
import AddProductDropdown from "@/components/products/AddProductDropdown";
import CategoryManagementModal from "@/components/products/CategoryManagementModal";
import ColumnConfigModal from "@/components/products/ColumnConfigModal";
import CreateOrUpdateProductModal from "@/components/products/CreateOrUpdateProductModal";
import ImportProductModal from "@/components/products/ImportProductModal";
import { ProductCard } from "@/components/products/ProductCard";
import { Glass } from "@/components/Glass";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    FolderOpen,
    LayoutGrid,
    LayoutList,
    Plus,
    Search,
    Settings,
    X,
} from "lucide-react";
import { createColumns } from "./columns";

import { exportProduct } from "@/api/productV2";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import {
    useCreateMutipleProducts,
    useGetUserProductColumnConfig,
    useUpdateUserProductColumnConfig,
} from "@/hooks/useProduct";
import { useUserDetail } from "@/hooks/useUser";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useQueryClient } from "@tanstack/react-query";

// Add type interface before FilterComponent
interface FilterComponentProps {
    searchTerm: string;
    setSearchTerm: Dispatch<SetStateAction<string>>;
    dateRange: { from: Date; to: Date } | null;
    setDateRange: Dispatch<SetStateAction<{ from: Date; to: Date } | null>>;
    dateSelect: string | null;
    setDateSelect: Dispatch<SetStateAction<string | null>>;
    status: string;
    setStatus: Dispatch<SetStateAction<string>>;
    categoryId: string;
    setCategoryId: Dispatch<SetStateAction<string>>;
    pageSize: number;
    setPageSize: Dispatch<SetStateAction<number>>;
    categories: {
        id: string;
        name: string;
        status?: number;
    }[];
    pendingFilterChanges: boolean;
    setPendingFilterChanges: Dispatch<SetStateAction<boolean>>;
    handleApplyFilters: () => void;
    handleResetFilters: () => void;
    isPopoverOpen: boolean;
    setIsPopoverOpen: Dispatch<SetStateAction<boolean>>;
}

// Add types for column configuration
interface ColumnConfig {
    columnKey: string;
    label: string;
    visible: boolean;
    order?: number;
}

interface UserColumnConfigResponse {
    success: boolean;
    message: string;
    data: {
        userId: string;
        columns: ColumnConfig[];
    };
}

interface ColumnVisibility {
    [key: string]: boolean;
}

interface ColumnLabels {
    [key: string]: string;
}

// Price range filter options
const PRICE_RANGES = [
    { label: "Tất cả", value: "all", min: 0, max: Infinity },
    { label: "< 2 Tỷ", value: "lt2", min: 0, max: 2_000_000_000 },
    {
        label: "2 - 5 Tỷ",
        value: "2to5",
        min: 2_000_000_000,
        max: 5_000_000_000,
    },
    {
        label: "5 - 10 Tỷ",
        value: "5to10",
        min: 5_000_000_000,
        max: 10_000_000_000,
    },
    { label: "> 10 Tỷ", value: "gt10", min: 10_000_000_000, max: Infinity },
];

// Create a memoized filter component using Sheet
const FilterComponent = memo(
    ({
        searchTerm,
        setSearchTerm,
        dateRange,
        setDateRange,
        dateSelect,
        setDateSelect,
        status,
        setStatus,
        categoryId,
        setCategoryId,
        pageSize,
        setPageSize,
        categories,
        pendingFilterChanges,
        setPendingFilterChanges,
        handleApplyFilters,
        handleResetFilters,
        isPopoverOpen,
        setIsPopoverOpen,
    }: FilterComponentProps) => {
        const { t } = useLanguage();
        const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
        const [priceRange, setPriceRange] = useState("all");

        // Use the existing useDebounce hook to debounce the search term
        const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

        // Update parent state when debounced value changes
        useEffect(() => {
            if (debouncedSearchTerm !== searchTerm) {
                setSearchTerm(debouncedSearchTerm);
                setPendingFilterChanges(true);
            }
        }, [
            debouncedSearchTerm,
            searchTerm,
            setSearchTerm,
            setPendingFilterChanges,
        ]);

        return (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="rounded-lg flex items-center gap-2 border-gray-200"
                    >
                        <Filter className="h-4 w-4" />
                        Bộ lọc
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[340px] p-0 rounded-xl shadow-lg border-0"
                    align="end"
                    sideOffset={8}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">
                            Bộ lọc nâng cao
                        </h3>
                        <button
                            onClick={() => setIsPopoverOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Filter Content */}
                    <div className="p-4 space-y-5">
                        {/* Category Filter */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                DANH MỤC
                            </Label>
                            <Select
                                value={categoryId}
                                onValueChange={(value) => {
                                    setCategoryId(value);
                                    setPendingFilterChanges(true);
                                }}
                            >
                                <SelectTrigger className="w-full border-gray-200 rounded-lg h-10">
                                    <SelectValue placeholder="Tất cả danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tất cả danh mục
                                    </SelectItem>
                                    {categories.map(
                                        (category: {
                                            id: string;
                                            name: string;
                                        }) => (
                                            <SelectItem
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Price Range Filter */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                MỨC GIÁ
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PRICE_RANGES.map((range) => (
                                    <button
                                        key={range.value}
                                        type="button"
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                            priceRange === range.value
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                                        }`}
                                        onClick={() => {
                                            setPriceRange(range.value);
                                            setPendingFilterChanges(true);
                                        }}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 pt-3 border-t border-gray-100 flex gap-2">
                        <Button
                            onClick={handleResetFilters}
                            variant="outline"
                            className="flex-1 h-10 rounded-lg border-gray-200"
                        >
                            Xóa bộ lọc
                        </Button>
                        <Button
                            onClick={() => {
                                handleApplyFilters();
                                setIsPopoverOpen(false);
                            }}
                            className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700"
                        >
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        );
    },
);

FilterComponent.displayName = "FilterComponent";

// Create memoized data table component with proper typing
const MemoizedDataTable = memo<{
    columns: any[];
    data: Product[];
    isLoading?: boolean;
    onRowClick?: (row: Product) => void;
}>(({ columns, data, isLoading, onRowClick }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-none overflow-hidden">
            <DataTable
                columns={columns}
                data={data}
                isLoading={isLoading}
                onRowClick={onRowClick}
                emptyMessage="Không tìm thấy sản phẩm nào"
                rowClassName="h-16 hover:shadow-lg transition-all duration-200 bg-white border-b border-gray-100 last:border-none hover:z-10 relative hover:border-transparent"
                headerClassName="bg-transparent text-gray-500 font-medium border-b border-gray-100"
            />
        </div>
    );
});

MemoizedDataTable.displayName = "MemoizedDataTable";

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const { data: currentUser } = useUserDetail();
    const { t } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const orgId = params.orgId as string;
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);
    const [filterKey, setFilterKey] = useState(Date.now());
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(
        undefined,
    );
    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
        null,
    );
    const [dateSelect, setDateSelect] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("all");
    const [categoryId, setCategoryId] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [ascending, setAscending] = useState<boolean>(true);

    // Track if filters need to be applied
    const [pendingFilterChanges, setPendingFilterChanges] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // View mode state: 'grid' or 'list'
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const {
        data: userColumnConfig,
        isLoading: isColumnConfigLoading,
        refetch: refetchColumnConfig,
    } = useGetUserProductColumnConfig(orgId);
    const updateUserColumnConfig = useUpdateUserProductColumnConfig(orgId);

    // Cấu hình mặc định
    const defaultColumnVisibility: ColumnVisibility = {
        images: true,
        code: true,
        name: true,
        categories: true,
        price: true,
        status: true,
        createdDate: true,
        actions: true,
    };
    const defaultColumnLabels: ColumnLabels = {
        images: "Hình ảnh",
        code: "Mã sản phẩm",
        name: "Tên sản phẩm",
        categories: "Danh mục",
        price: "Giá",
        status: "Trạng thái",
        createdDate: "Ngày tạo",
        actions: "Thao tác",
    };

    // State quản lý ẩn/hiện cột và label
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
        defaultColumnVisibility,
    );
    const [columnLabels, setColumnLabels] =
        useState<ColumnLabels>(defaultColumnLabels);

    const [isColumnConfigModalOpen, setIsColumnConfigModalOpen] =
        useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Khi có userColumnConfig, cập nhật state
    useEffect(() => {
        if (userColumnConfig?.data?.columns) {
            const vis: ColumnVisibility = { ...defaultColumnVisibility };
            const labels: ColumnLabels = { ...defaultColumnLabels };
            userColumnConfig.data.columns.forEach((col: ColumnConfig) => {
                // Map API key to component key if needed
                const key =
                    col.columnKey === "image" ? "images" : col.columnKey;
                vis[key] = col.visible;
                labels[key] = col.label;
            });
            setColumnVisibility(vis);
            setColumnLabels(labels);

            // Config loaded from API
        }
    }, [userColumnConfig]);

    // Handle import products
    const createMultipleProductsMutation = useCreateMutipleProducts(orgId);

    const handleImportProducts = (products: any[]) => {
        const body = {
            products,
        };
        createMultipleProductsMutation.mutate(body, {
            onSuccess: () => {
                setIsImportModalOpen(false);
                // Refresh products list
                queryClient.invalidateQueries({
                    queryKey: ["products", orgId],
                });
            },
        });
    };

    // Handle export products with current filters
    const handleExportProducts = async () => {
        try {
            const exportParams = {
                searchText: searchTerm || undefined,
                status: status !== "all" ? status : undefined,
                categoryId: categoryId !== "all" ? categoryId : undefined,
                fromDate: dateRange?.from
                    ? dateRange.from.toISOString()
                    : undefined,
                toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
                dateSelect: dateSelect || undefined,
                isManage: true, // Enable advanced filtering
            };

            // Remove undefined values and convert to string
            const cleanParams = Object.fromEntries(
                Object.entries(exportParams)
                    .filter(([_, value]) => value !== undefined)
                    .map(([key, value]) => [key, String(value)]),
            );

            // Call exportProduct API function
            const response = await exportProduct(orgId, cleanParams);

            // Response should be a blob now due to responseType: 'blob'
            if (!(response instanceof Blob)) {
                throw new Error(
                    "Invalid response format from export API - expected blob",
                );
            }

            const blob = response;

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Use default filename since we can't get headers from exportProduct response
            const filename = `products_export_${
                new Date().toISOString().split("T")[0]
            }.xlsx`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            // You might want to show a toast notification here
        }
    };

    // Handle column configuration save from modal
    const handleColumnConfigSave = (columns: ColumnConfig[]) => {
        const newVisibility: ColumnVisibility = {};
        const newLabels: ColumnLabels = {};
        const columnOrder: { [key: string]: number } = {};

        columns.forEach((col) => {
            const key = col.columnKey === "image" ? "images" : col.columnKey;
            newVisibility[key] = col.visible;
            newLabels[key] = col.label;
            if (col.order !== undefined) {
                columnOrder[key] = col.order;
            }
        });

        setColumnVisibility(newVisibility);
        setColumnLabels(newLabels);

        // Send to API
        const apiColumns = columns.map((col) => ({
            columnKey: col.columnKey,
            label: col.label,
            visible: col.visible,
            order: col.order,
        }));

        updateUserColumnConfig.mutate(apiColumns, {
            onSuccess: (data) => {
                // Invalidate and refetch column config data
                queryClient.invalidateQueries({
                    queryKey: ["userProductColumnConfig", orgId],
                });
            },
        });
    };

    // Create column order map from API response
    const columnOrderMap = useMemo(() => {
        if (userColumnConfig?.data?.columns) {
            const orderMap: { [key: string]: number } = {};
            userColumnConfig.data.columns.forEach(
                (col: ColumnConfig, index: number) => {
                    const key =
                        col.columnKey === "image" ? "images" : col.columnKey;
                    orderMap[key] = col.order ?? index;
                },
            );
            return orderMap;
        }
        return {};
    }, [userColumnConfig]);

    const { data: categoryData } = useGetCategory(orgId);
    const categories = categoryData?.data || [];

    // Prepare query params for API - these will only update when filters are applied
    const [appliedFilters, setAppliedFilters] = useState({
        searchText: "",
        fromDate: "",
        toDate: "",
        status: "all",
        categoryId: "all",
        sortBy: undefined as string | undefined,
        ascending: true,
    });

    const queryParams = useMemo(
        () => ({
            page: currentPage,
            pageSize,
            ...(appliedFilters.searchText && {
                searchText: appliedFilters.searchText,
            }),
            ...(appliedFilters.fromDate && {
                fromDate: appliedFilters.fromDate,
            }),
            ...(appliedFilters.toDate && { toDate: appliedFilters.toDate }),
            ...(appliedFilters.status &&
                appliedFilters.status !== "all" && {
                    status: appliedFilters.status,
                }),
            ...(appliedFilters.categoryId &&
                appliedFilters.categoryId !== "all" && {
                    categoryId: appliedFilters.categoryId,
                }),
            ...(appliedFilters.sortBy && { sortBy: appliedFilters.sortBy }),
            ...(appliedFilters.sortBy && {
                ascending: appliedFilters.ascending.toString(),
            }),
            isManage: true,
        }),
        [appliedFilters, currentPage, pageSize],
    );

    const searchParams = useSearchParams();
    // Helper để cập nhật URL param
    const updateUrlParams = useCallback(
        (paramsObj: Record<string, any>) => {
            const params = new URLSearchParams();
            Object.entries(paramsObj).forEach(([key, value]) => {
                if (
                    value !== undefined &&
                    value !== "" &&
                    value !== "all" &&
                    value !== null
                )
                    params.set(key, value);
            });
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [router],
    );

    // Khi mount, đọc param để khởi tạo state filter
    useEffect(() => {
        setSearchTerm(searchParams.get("search") || "");
        setStatus(searchParams.get("status") || "all");
        setCategoryId(searchParams.get("categoryId") || "all");
        setSortBy(searchParams.get("sortBy") || undefined);
        setAscending(searchParams.get("ascending") === "false" ? false : true);
        setCurrentPage(Number(searchParams.get("page")) || 1);
        setPageSize(Number(searchParams.get("pageSize")) || 10);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setShouldFetch(true);
    }, []);

    const { data, isLoading, refetch } = useGetProducts(
        orgId,
        queryParams,
        shouldFetch,
    );
    const products = data?.data || [];
    const pagination = data?.pagination;

    // Initialize FancyBox
    useEffect(() => {
        Fancybox.bind("[data-fancybox]", {
            showClass: "fancybox-zoomIn",
            hideClass: "fancybox-zoomOut",
            // Use simple navigation controls
            on: {
                ready: (fancybox) => {},
            },
        });

        // Cleanup when component unmounts
        return () => {
            Fancybox.destroy();
        };
    }, [products]); // Only re-initialize when products change

    // Memoize handlers using useCallback
    const handleApplyFilters = useCallback(() => {
        setIsPopoverOpen(false);
        // Update the applied filters with current filter values
        setAppliedFilters({
            searchText: searchTerm,
            fromDate: dateRange?.from
                ? format(dateRange.from, "yyyy-MM-dd")
                : "",
            toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "",
            status: status,
            categoryId: categoryId,
            sortBy: sortBy,
            ascending: ascending,
        });

        setCurrentPage(1); // Reset to first page when filters change
        setPendingFilterChanges(false); // Clear pending changes flag
        setShouldFetch(true);
        refetch();
        updateUrlParams({
            search: searchTerm,
            status,
            categoryId,
            sortBy,
            ascending,
            page: 1,
            pageSize,
        });
    }, [
        searchTerm,
        dateRange,
        status,
        categoryId,
        sortBy,
        ascending,
        refetch,
        updateUrlParams,
        pageSize,
    ]);

    // Reset filters
    const handleResetFilters = useCallback(() => {
        // Reset UI filter states
        setSearchTerm("");
        setDateRange(null);
        setDateSelect("-9999"); // Toàn bộ thời gian
        setStatus("all");
        setCategoryId("all");
        setSortBy(undefined);
        setAscending(true);

        // Reset applied filters
        setAppliedFilters({
            searchText: "",
            fromDate: "",
            toDate: "",
            status: "all",
            categoryId: "all",
            sortBy: undefined,
            ascending: true,
        });

        setCurrentPage(1);
        setPendingFilterChanges(false);
        setShouldFetch(true);
        setFilterKey(Date.now());
        refetch();
        updateUrlParams({
            search: "",
            status: "all",
            categoryId: "all",
            sortBy: undefined,
            ascending: true,
            page: 1,
            pageSize,
        });
    }, [updateUrlParams, pageSize, refetch]);

    // Handle sort toggle
    const handleSort = useCallback(
        (column: string) => {
            let newSortBy = sortBy;
            let newAscending = ascending;
            if (sortBy === column) {
                newAscending = !ascending;
            } else {
                newSortBy = column;
                newAscending = true;
            }
            setSortBy(newSortBy);
            setAscending(newAscending);
            // Cập nhật appliedFilters ngay lập tức để truyền param sort vào API
            setAppliedFilters((prev) => ({
                ...prev,
                sortBy: newSortBy,
                ascending: newAscending,
            }));
            setCurrentPage(1);
            setShouldFetch(true);
            updateUrlParams({
                search: searchTerm,
                status,
                categoryId,
                sortBy: newSortBy,
                ascending: newAscending,
                page: 1,
                pageSize,
            });
        },
        [
            sortBy,
            ascending,
            searchTerm,
            status,
            categoryId,
            updateUrlParams,
            pageSize,
        ],
    );

    // Memoize columnLabels string to prevent unnecessary re-renders
    const columnLabelsString = useMemo(
        () => JSON.stringify(columnLabels),
        [columnLabels],
    );

    // Memoize columns to prevent unnecessary recalculations
    const columns = useMemo(
        () =>
            createColumns(
                sortBy,
                ascending,
                handleSort,
                router,
                orgId,
                t,
                columnLabels,
                columnOrderMap,
            ),
        [
            sortBy,
            ascending,
            handleSort,
            router,
            orgId,
            t,
            columnLabelsString,
            columnOrderMap,
        ],
    );

    // Lọc và sắp xếp columns theo columnVisibility và order
    const visibleColumns = useMemo(() => {
        const filteredColumns = columns.filter((column: any) => {
            // Luôn hiển thị cột actions
            const key = column.accessorKey || column.id;
            if (key === "actions") return true;

            // Nếu column có accessorKey và có trong columnVisibility thì kiểm tra
            if (key && columnVisibility.hasOwnProperty(key)) {
                return columnVisibility[key as keyof ColumnVisibility];
            }

            // Nếu không có trong config, mặc định hiển thị
            return true;
        });

        // Sắp xếp columns theo thứ tự từ userColumnConfig
        if (userColumnConfig?.data?.columns) {
            const orderMap = new Map();
            userColumnConfig.data.columns.forEach((col: ColumnConfig) => {
                const key =
                    col.columnKey === "image" ? "images" : col.columnKey;
                if (col.order !== undefined) {
                    orderMap.set(key, col.order);
                }
            });

            return filteredColumns.sort((a: any, b: any) => {
                const keyA = a.accessorKey || a.id;
                const keyB = b.accessorKey || b.id;

                // Actions column luôn ở cuối
                if (keyA === "actions") return 1;
                if (keyB === "actions") return -1;

                const orderA = orderMap.get(keyA) ?? 999;
                const orderB = orderMap.get(keyB) ?? 999;

                return orderA - orderB;
            });
        }

        return filteredColumns;
    }, [columns, columnVisibility, userColumnConfig]);

    const handleProductClick = (product: Product) => {
        router.push(`/org/${orgId}/products/${product.id}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlParams({
            search: searchTerm,
            status,
            categoryId,
            sortBy,
            ascending,
            page,
            pageSize,
        });
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setEditingProduct(undefined);
        refetch(); // Refresh the product list after creating a new product
    };

    const handleCategoryModalClose = () => {
        setIsCategoryModalOpen(false);
        refetch(); // Refresh the product list to show updated categories
    };

    const totalItems = pagination?.totalRecords || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Generate pagination items
    const generatePaginationItems = () => {
        if (!pagination) return null;

        const items = [];

        // Always show first page
        items.push(
            <PaginationItem key="first">
                <PaginationLink
                    onClick={() => handlePageChange(1)}
                    isActive={currentPage === 1}
                >
                    1
                </PaginationLink>
            </PaginationItem>,
        );

        // Show ellipsis if needed
        if (currentPage > 3) {
            items.push(
                <PaginationItem key="ellipsis-1">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        // Show current page and neighbors
        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            if (i === 1 || i === totalPages) continue; // Skip first and last as they're always shown
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={() => handlePageChange(i)}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
            items.push(
                <PaginationItem key="ellipsis-2">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        // Always show last page if there's more than one page
        if (totalPages > 1) {
            items.push(
                <PaginationItem key="last">
                    <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        isActive={currentPage === totalPages}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    return (
        <Glass intensity="high" className="rounded-2xl">
            <div className="space-y-4">
                {/* Page Header */}
                <div className="rounded-t-lg p-6 pb-4">
                    {/* Top Row: Title + Actions */}
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Title and Subtitle */}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Quản lý Sản phẩm
                            </h1>
                            <p className="text-sm text-gray-500">
                                Danh sách sản phẩm và dịch vụ
                            </p>
                        </div>

                        {/* Right: View Toggle + Add Button */}
                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            {/* View Toggle */}
                            <GlassTabs
                                activeTab={viewMode}
                                onChange={(id) =>
                                    setViewMode(id as "grid" | "list")
                                }
                                size="sm"
                                tabs={[
                                    {
                                        id: "grid",
                                        icon: (
                                            <LayoutGrid className="h-4 w-4" />
                                        ),
                                    },
                                    {
                                        id: "list",
                                        icon: (
                                            <LayoutList className="h-4 w-4" />
                                        ),
                                    },
                                ]}
                            />

                            {/* Add New Button */}
                            <Button
                                onClick={() => {
                                    setEditingProduct(undefined);
                                    setIsCreateModalOpen(true);
                                }}
                                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Thêm mới
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Row: Search + Filter */}
                    <div className="flex items-center justify-between gap-4 mt-4">
                        {/* Search Input */}
                        <div className="relative rounded-lg flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm sản phẩm..."
                                className="pl-9 bg-white/70 border-gray-200 rounded-lg"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPendingFilterChanges(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleApplyFilters();
                                    }
                                }}
                            />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {/* Category Management */}
                            <TooltipProvider>
                                <Tooltip content={t("common.category")}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={() =>
                                                setIsCategoryModalOpen(true)
                                            }
                                            variant="outline"
                                            size="icon"
                                            className="border-gray-200"
                                        >
                                            <FolderOpen className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Column Config (only for list view) */}
                            {viewMode === "list" && (
                                <TooltipProvider>
                                    <Tooltip content={t("common.columnConfig")}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-lg border-gray-200"
                                                onClick={() =>
                                                    setIsColumnConfigModalOpen(
                                                        true,
                                                    )
                                                }
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {/* Filter Dropdown */}
                            <FilterComponent
                                key={filterKey}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                dateRange={dateRange}
                                setDateRange={setDateRange}
                                dateSelect={dateSelect}
                                setDateSelect={setDateSelect}
                                status={status}
                                setStatus={setStatus}
                                categoryId={categoryId}
                                setCategoryId={setCategoryId}
                                pageSize={pageSize}
                                setPageSize={setPageSize}
                                categories={categories}
                                pendingFilterChanges={pendingFilterChanges}
                                setPendingFilterChanges={
                                    setPendingFilterChanges
                                }
                                handleApplyFilters={handleApplyFilters}
                                handleResetFilters={handleResetFilters}
                                isPopoverOpen={isPopoverOpen}
                                setIsPopoverOpen={setIsPopoverOpen}
                            />
                        </div>
                    </div>
                </div>
                {/* Main Content */}
                {viewMode === "list" ? (
                    /* List View */
                    <div className="px-6 pb-4">
                        <ScrollArea className="w-full h-[70vh] overflow-y-auto overflow-x-auto">
                            <div className="min-w-[900px]">
                                <MemoizedDataTable
                                    columns={visibleColumns}
                                    data={products}
                                    isLoading={isLoading}
                                    onRowClick={(product) =>
                                        handleProductClick(product)
                                    }
                                />
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                    /* Grid View */
                    <ScrollArea className="w-full h-[75vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loading />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
                                <p>Không tìm thấy sản phẩm nào</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        orgId={orgId}
                                        onClick={(p) => handleProductClick(p)}
                                        onEdit={(p) => {
                                            setEditingProduct(p);
                                            setIsCreateModalOpen(true);
                                        }}
                                        onDelete={(p) => {
                                            // TODO: Implement delete confirmation
                                            console.log(
                                                "Delete product:",
                                                p.id,
                                            );
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                )}
                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-500">
                            Hiển thị {(currentPage - 1) * pageSize + 1} đến{" "}
                            {Math.min(currentPage * pageSize, totalItems)} trong
                            tổng số {totalItems} sản phẩm
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Trước
                                </Button>
                                <div className="text-sm px-3 py-1 bg-gray-100 rounded">
                                    Trang {currentPage} / {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                    disabled={currentPage >= totalPages}
                                >
                                    Tiếp
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
                {/* </Glass> */}
                {/* Create Product Modal */}
                <CreateOrUpdateProductModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCreateModalClose}
                    orgId={orgId}
                    product={editingProduct}
                />
                {/* Category Management Modal */}
                <CategoryManagementModal
                    isOpen={isCategoryModalOpen}
                    onClose={handleCategoryModalClose}
                    orgId={orgId}
                />
                {/* Column Configuration Modal */}
                <ColumnConfigModal
                    isOpen={isColumnConfigModalOpen}
                    onClose={() => setIsColumnConfigModalOpen(false)}
                    onSave={handleColumnConfigSave}
                    currentConfig={
                        userColumnConfig?.data?.columns?.map(
                            (col: ColumnConfig) => ({
                                columnKey: col.columnKey,
                                label: col.label,
                                visible: col.visible,
                                order: col.order,
                            }),
                        ) ||
                        Object.keys(columnVisibility)
                            .map((key) => ({
                                columnKey: key === "images" ? "image" : key,
                                label:
                                    columnLabels[key as keyof ColumnLabels] ||
                                    key,
                                visible:
                                    columnVisibility[
                                        key as keyof ColumnVisibility
                                    ],
                            }))
                            .filter((col) => col.columnKey !== "actions")
                    }
                    defaultConfig={Object.keys(defaultColumnVisibility)
                        .map((key) => ({
                            columnKey: key === "images" ? "image" : key,
                            label:
                                defaultColumnLabels[
                                    key as keyof ColumnLabels
                                ] || key,
                            visible:
                                defaultColumnVisibility[
                                    key as keyof ColumnVisibility
                                ],
                        }))
                        .filter((col) => col.columnKey !== "actions")}
                />
                <ImportProductModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportProducts}
                    isLoading={createMultipleProductsMutation.isPending}
                />
            </div>
        </Glass>
    );
}

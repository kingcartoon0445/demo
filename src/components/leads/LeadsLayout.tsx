import { useLanguage } from "@/contexts/LanguageContext";
import { useChannelStatus } from "@/hooks/useConversation";
import useBreakpoint from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    HandCoins,
    Link2,
    Settings,
    SettingsIcon,
    Search,
    Filter,
    Plus,
    LayoutGrid,
    Archive,
    Users,
    MessageCircle,
    Globe,
    Facebook,
    Download,
    Upload,
    ImportIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { RiRobot2Line } from "react-icons/ri";
import { MultiConnectIcon } from "../icons";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useLeadStore } from "@/store/useLeadStore";
import CustomerList from "./CustomerList";
import ConversationList from "@/components/conversation/ConversationList";
import AddCustomerDropdown from "./AddCustomerDropdown";
import { Lead } from "@/lib/interface";
import { Glass } from "../Glass";
import { type Conversation } from "@/hooks/useConversation";
import { Button } from "../ui/button";
import { BiArchiveIn } from "react-icons/bi";
import { exportLeadsToExcel } from "@/api/customer";
import toast from "react-hot-toast";
import { SearchIcon, XIcon } from "lucide-react";
import {
    useState as useReactState,
    useRef as useReactRef,
    useEffect as useReactEffect,
    useCallback as useReactCallback,
    memo,
} from "react";
import { useLeadsFilter } from "@/hooks/leads_data";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import TimeDropdown from "../common/TimeDropDown";
import { CustomerTagsMultiSelector } from "../componentsWithHook/CustomerTagsMultiSelector";
import { OrgMembersMultiSelect } from "../componentsWithHook/MemberMultiSelector";
import { UtmSourceMultiSelector } from "../componentsWithHook/UtmSourceMultiSelector";
import { FilterListIcon } from "../icons";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { MultiSelect } from "../ui/multi-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface CustomerSource {
    id: string;
    name: string;
    icon?: React.ReactNode;
    count: number;
    color?: string;
    children?: CustomerSource[];
}

interface LeadsLayoutProps {
    children: React.ReactNode;
    onSourceChange?: (sourceId: string) => void;
    selectedSource?: string;
    orgId: string;
    // Props for CustomerList
    viewMode?:
        | "customers"
        | "conversations"
        | "config-messenger"
        | "config-zalo";
    selectedCustomer?: Lead | null;
    onCustomerSelect?: (customer: Lead) => void;
    isArchiveMode?: boolean;
    selectedCustomerId?: string | null;
    onTotalChange?: (total: number) => void;
    onAddCustomer?: () => void;
    // Props for ConversationList
    conversationProvider?: "FACEBOOK" | "ZALO";
    selectedConversation?: Conversation | null;
    onConversationSelect?: (conversation: Conversation) => void;
    onTotalConversationsChange?: (total: number) => void;
    // Props for Search and Filter
    totalCustomers?: number;
    onSearch?: (searchValue: string) => void;
    onImportCustomer?: () => void;
    onExportCustomer?: () => void;
    searchText?: string;
}

export default function LeadsLayout({
    children,
    onSourceChange,
    selectedSource = "chance",
    orgId,
    viewMode = "customers",
    selectedCustomer,
    onCustomerSelect,
    isArchiveMode = false,
    selectedCustomerId,
    onTotalChange,
    onAddCustomer,
    conversationProvider = "FACEBOOK",
    selectedConversation,
    onConversationSelect,
    onTotalConversationsChange,
    totalCustomers = 0,
    onSearch,
    onImportCustomer,
    onExportCustomer,
    searchText = "",
}: LeadsLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useLanguage();
    const breakpoint = useBreakpoint();
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
        { configs: false },
    );
    const { data: channelStatus } = useChannelStatus(orgId);
    const userAgent =
        typeof window !== "undefined" ? window.navigator.userAgent : "";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    // Quick filter state (for quick filter buttons)
    const [activeFilter, setActiveFilter] = useState<"all" | "archive">("all");
    const customerListScrollRef = useRef<HTMLDivElement>(null);

    // Filter panel state
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [source, setSource] = useState<string>("");
    const searchParams = useSearchParams();
    // Filter logic từ LeadsFilter
    const { filter, archiveFilter, setFilter, setArchiveFilter } =
        useLeadsFilter();
    const currentFilterLocal = isArchiveMode ? archiveFilter : filter;
    const setCurrentFilterLocal = isArchiveMode ? setArchiveFilter : setFilter;

    // State for date filtering
    const [date, setDate] = useState({
        from: currentFilterLocal.from || startOfDay(addDays(new Date(), -9999)),
        to: currentFilterLocal.to || endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState<string>(
        currentFilterLocal.dateSelected || "-9999",
    );

    // State for active tab
    const [activeTab, setActiveTab] = useState("manual");

    // State for filter values
    const [selectedTags, setSelectedTags] = useState<string[]>(
        currentFilterLocal.tagSelected || [],
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        currentFilterLocal.categorySelected || [],
    );
    const [selectedUtmSources, setSelectedUtmSources] = useState<string[]>(
        currentFilterLocal.sourceSelected || [],
    );
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        currentFilterLocal.assignTo || [],
    );

    // State for system filters
    const [selectedSystemFilters, setSelectedSystemFilters] = useState<
        string[]
    >(() => {
        if (
            currentFilterLocal.systemFilters &&
            currentFilterLocal.systemFilters.length > 0
        ) {
            return currentFilterLocal.systemFilters;
        }
        const customConditions =
            currentFilterLocal.filterBody?.customConditions || [];
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

    // Sync local state với global state
    useEffect(() => {
        if (currentFilterLocal.from && currentFilterLocal.to) {
            setDate({
                from: currentFilterLocal.from,
                to: currentFilterLocal.to,
            });
        }
        if (currentFilterLocal.dateSelected) {
            setDateSelected(currentFilterLocal.dateSelected);
        }
        setSelectedTags(currentFilterLocal.tagSelected || []);
        setSelectedCategories(currentFilterLocal.categorySelected || []);
        setSelectedUtmSources(currentFilterLocal.sourceSelected || []);
        setSelectedAssignees(currentFilterLocal.assignTo || []);
        if (
            currentFilterLocal.systemFilters &&
            currentFilterLocal.systemFilters.length > 0
        ) {
            setSelectedSystemFilters(currentFilterLocal.systemFilters);
        }
    }, [currentFilterLocal]);

    // Sync activeFilter with isArchiveMode
    useEffect(() => {
        setActiveFilter(isArchiveMode ? "archive" : "all");
    }, [isArchiveMode]);

    // System filter options
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

    // Category options
    const categoryOptions = [
        { value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82", label: "Nhập vào" },
        { value: "3b70970b-e448-46fa-af8f-6605855a6b52", label: "Form" },
        { value: "38b353c3-ecc8-4c62-be27-229ef47e622d", label: "AIDC" },
    ];

    const formatDateForApi = (date: Date | null): string => {
        if (!date) return "";
        return format(date, "yyyy-MM-dd");
    };

    const handleSystemFilterChange = (value: string, checked: boolean) => {
        if (checked) {
            setSelectedSystemFilters((prev) => [...prev, value]);
        } else {
            setSelectedSystemFilters((prev) =>
                prev.filter((item) => item !== value),
            );
        }
    };

    const applyFilter = () => {
        if (activeTab === "manual") {
            const startDateFormatted = formatDateForApi(date.from);
            const endDateFormatted = formatDateForApi(date.to);

            const filterBody: any = { limit: 20 };

            if (startDateFormatted) filterBody.startDate = startDateFormatted;
            if (endDateFormatted) filterBody.endDate = endDateFormatted;
            if (selectedTags.length > 0) filterBody.tags = selectedTags;
            if (selectedCategories.length > 0)
                filterBody.sourceIds = selectedCategories;
            if (selectedUtmSources.length > 0)
                filterBody.utmSources = selectedUtmSources;
            if (selectedAssignees.length > 0)
                filterBody.assignees = selectedAssignees;

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

            setCurrentFilterLocal({
                ...currentFilterLocal,
                from: date.from,
                to: date.to,
                dateSelected: dateSelected,
                startDate: startDateFormatted,
                endDate: endDateFormatted,
                tagSelected: selectedTags,
                categorySelected: selectedCategories,
                sourceSelected: selectedUtmSources,
                assignTo: selectedAssignees,
                filterBody: filterBody,
            });
        } else if (activeTab === "system") {
            const filterBody: any = { limit: 20 };

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

            setCurrentFilterLocal({
                ...currentFilterLocal,
                filterBody: filterBody,
                systemFilters: selectedSystemFilters,
            });
        }
        setShowFilterPanel(false);
    };

    const hasActiveFilters = () => {
        const isDefaultDate = dateSelected === "-9999";
        return (
            !isDefaultDate ||
            selectedTags.length > 0 ||
            selectedCategories.length > 0 ||
            selectedUtmSources.length > 0 ||
            selectedAssignees.length > 0 ||
            selectedSystemFilters.length > 0
        );
    };

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

        const emptyFilterBody = { limit: 20 };
        setCurrentFilterLocal({
            ...currentFilterLocal,
            from: startOfDay(addDays(new Date(), -9999)),
            to: endOfDay(new Date()),
            dateSelected: "-9999",
            startDate: "",
            endDate: "",
            tagSelected: [],
            categorySelected: [],
            sourceSelected: [],
            assignTo: [],
            systemFilters: [],
            filterBody: emptyFilterBody,
        });
    };

    const handleToggleFilter = () => {
        setShowFilterPanel(!showFilterPanel);
    };
    const handleAddCustomer = () => {
        setIsAddModalOpen(true);
        setSource("lead1");
    };

    const handleImportCustomer = () => {
        onImportCustomer?.();
    };

    const handleExportCustomer = async () => {
        try {
            const searchTextParam = searchParams?.get("SearchText") || "";
            let filterBody = currentFilterLocal.filterBody;

            if (!filterBody) {
                filterBody = { limit: 20 };
                const startDate = searchParams?.get("StartDate");
                const endDate = searchParams?.get("EndDate");
                const tags = searchParams?.getAll("Tags") || [];
                const sourceIds = searchParams?.getAll("SourceIds") || [];
                const assignees = searchParams?.getAll("Assignees") || [];

                if (startDate) filterBody.startDate = startDate;
                if (endDate) filterBody.endDate = endDate;
                if (tags.length > 0) filterBody.tags = tags;
                if (sourceIds.length > 0) filterBody.sourceIds = sourceIds;
                if (assignees.length > 0) filterBody.assignees = assignees;
            }

            // Add channel filter based on source parameter
            const sourceParam = searchParams?.get("source");
            let channels: string[] | undefined = undefined;
            if (sourceParam === "chance") {
                channels = ["LEAD"];
            } else if (sourceParam === "messenger") {
                channels = ["FACEBOOK"];
            } else if (sourceParam === "zalo") {
                channels = ["ZALO"];
            }

            await exportLeadsToExcel(
                orgId,
                "default", // workspaceId
                searchTextParam,
                currentFilterLocal.stageGroupId, // stageGroupId
                filterBody.startDate,
                filterBody.endDate,
                filterBody.categoryIds, // categoryList
                filterBody.sourceIds, // sourceList
                filterBody.rating,
                filterBody.stage,
                filterBody.tags,
                filterBody.assignees, // profileIds
                filterBody.teamIds,
                channels,
            ).then((blob: any) => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute(
                    "download",
                    `customers_export_${new Date().toISOString()}.xlsx`,
                );
                document.body.appendChild(link);
                link.click();
                link.remove();
            });

            toast.success(t("common.exportSuccess") || "Export successful");
        } catch (error) {
            console.error(error);
            toast.error(t("common.exportFailed") || "Export failed");
        }
    };
    const getCustomerSources = (): CustomerSource[] => [
        // {
        //     id: "potential",
        //     name: t("common.all"),
        //     icon: <UserIcon className="size-4" />,
        //     count: 0, // This would need to be calculated from total leads
        // },
        {
            id: "chance",
            name: t("common.customerCareOpportunities"),
            icon: <HandCoins className="size-4" />,
            count: 0, // This would need to be calculated from LEAD channel leads
        },
        {
            id: "messenger",
            name: "Messenger",
            icon: (
                <Image
                    src="/icons/messenger1.svg"
                    alt="Messenger"
                    width={16}
                    height={16}
                />
            ),
            count: (() => {
                try {
                    const items = (channelStatus as any)?.content as
                        | { provider: string; unreadCount: number }[]
                        | undefined;
                    if (!Array.isArray(items)) return 0;
                    const facebookItem = items.find(
                        (x) => x.provider === "FACEBOOK",
                    );
                    return facebookItem?.unreadCount || 0;
                } catch {
                    return 0;
                }
            })(),
            color: "text-blue-500",
            // children: [
            //     {
            //         id: "config-messenger",
            //         name: "Config Messenger",
            //         icon: <SettingsIcon className="size-4" />,
            //         count: 0,
            //     },
            // ],
        },
        {
            id: "zalo",
            name: "Zalo OA",
            icon: (
                <Image
                    src="/icons/zalo1.svg"
                    alt="Zalo"
                    width={16}
                    height={16}
                />
            ),
            count: (() => {
                try {
                    const items = (channelStatus as any)?.content as
                        | { provider: string; unreadCount: number }[]
                        | undefined;
                    if (!Array.isArray(items)) return 0;
                    const zaloItem = items.find((x) => x.provider === "ZALO");
                    return zaloItem?.unreadCount || 0;
                } catch {
                    return 0;
                }
            })(),
            color: "text-blue-400",
        },
        {
            id: "config-form",
            name: t("common.form"),
            icon: <MultiConnectIcon className="size-4 text-[#646A73]" />,
            count: 0,
        },
        {
            id: "config-aichatbot",
            name: t("common.aiChatbot"),
            icon: <RiRobot2Line className="size-4 text-[#646A73]" />,
            count: 0,
        },
    ];

    // Get customer sources with dynamic counts
    const customerSources = getCustomerSources();

    // Initialize expanded state based on current path
    useEffect(() => {
        // Check if current path includes any config routes
        if (pathname?.includes("/configs/")) {
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
        }
    }, [pathname]);

    const toggleExpand = (id: string) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    const {
        selectedLead,
        isArchiveMode: storeArchiveMode,
        toggleArchiveMode,
    } = useLeadStore();

    // SearchBox component
    const SearchBox = memo(function SearchBox({
        initialValue,
        onSearch,
    }: {
        initialValue: string;
        onSearch: (value: string) => void;
    }) {
        const { t } = useLanguage();
        const [value, setValue] = useReactState(initialValue || "");
        const timeoutRef = useReactRef<NodeJS.Timeout | null>(null);

        useReactEffect(() => {
            setValue(initialValue || "");
        }, [initialValue]);

        const triggerSearch = useReactCallback(
            (text: string) => {
                onSearch(text);
            },
            [onSearch],
        );

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const next = e.target.value;
            setValue(next);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => triggerSearch(next), 800);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                triggerSearch(value);
            }
        };

        const handleClear = () => {
            setValue("");
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            triggerSearch("");
        };

        useReactEffect(() => {
            return () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        }, []);

        return (
            <div className="relative w-full">
                <input
                    type="text"
                    placeholder={t("common.searchCustomer")}
                    className="w-full bg-white/50 border border-white/40 pl-9 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800 placeholder-gray-400 transition-all shadow-inner focus:bg-white"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                {value && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 hover:text-gray-700 transition-colors"
                        aria-label="Xóa tìm kiếm"
                    >
                        <XIcon className="size-4" />
                    </button>
                )}
            </div>
        );
    });

    // Quick filter options (for quick filter buttons)
    const filterOptions = [
        { id: "all", label: "Tất cả" },
        { id: "archive", label: "Lưu trữ" },
    ];

    // Helper to render platform badge on avatar
    const renderPlatformBadge = (type: string) => {
        switch (type) {
            case "facebook":
                return (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Facebook
                            size={10}
                            className="text-blue-600 fill-current"
                        />
                    </div>
                );
            case "zalo":
                return (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-[8px] font-black text-blue-500 font-sans">
                            Z
                        </span>
                    </div>
                );
            case "livechat":
                return (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Globe size={10} className="text-green-500" />
                    </div>
                );
            default:
                return null;
        }
    };

    const handleSourceSelect = (sourceId: string) => {
        // Handle navigation for config items
        if (sourceId === "config-messenger") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/fbconnect`);
            return;
        }
        if (sourceId === "config-zalo") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/zaloconnect`);
            return;
        }

        if (sourceId === "config-form") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/form`);
            return;
        }

        if (sourceId === "config-aichatbot") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/aichatbot`);
            return;
        }

        // For main sources (potential, messenger, zalo, chance), navigate to leads page with source parameter
        if (
            sourceId === "potential" ||
            sourceId === "messenger" ||
            sourceId === "zalo" ||
            sourceId === "chance"
        ) {
            if (isArchiveMode) {
                toggleArchiveMode();
            }
            router.push(`/org/${orgId}/leads?source=${sourceId}`);
            return;
        }

        // For other sources, call the parent handler
        onSourceChange?.(sourceId);
    };

    useEffect(() => {
        return () => {
            useLeadStore.getState().reset(); // Reset toàn bộ state trước khi unmount
        };
    }, []);

    const isProviderConnected = (provider: "FACEBOOK" | "ZALO") => {
        try {
            const items = (channelStatus as any)?.content as
                | { provider: string; status: number }[]
                | undefined;
            if (!Array.isArray(items)) return false;
            return items.some(
                (x) => x.provider === provider && Number(x.status) === 1,
            );
        } catch {
            return false;
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden  gap-4 animate-in fade-in duration-500 relative h-full">
            {/* Sidebar - Customer Source Selector + Customer List */}
            <div
                className={cn(
                    "flex-shrink-0 flex flex-col transition-all duration-300 h-full min-h-0",
                    selectedSource?.startsWith("config-")
                        ? "w-full md:w-[260px]"
                        : "w-full md:w-[500px] lg:w-[600px]",
                )}
            >
                <Glass
                    className="h-full flex flex-col overflow-hidden rounded-t-3xl rounded-b-none w-full border-white/40 min-h-0"
                    intensity="high"
                >
                    {/* --- TOP TOOLBAR --- */}
                    <div className="p-5 border-b border-white/20 flex items-center justify-between bg-white/20 backdrop-blur-md z-20 relative shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Only show workspace selector tabs on non-config pages */}
                            {!selectedSource?.startsWith("config-") && (
                                <div className="overflow-x-auto scrollbar-hide max-w-[160px] xs:max-w-[220px] sm:max-w-none">
                                    <div className="flex bg-white/30 p-1 rounded-2xl border border-white/20 backdrop-blur-sm shrink-0 w-max">
                                        <button
                                            onClick={() =>
                                                isArchiveMode &&
                                                toggleArchiveMode()
                                            }
                                            className={cn(
                                                "flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-sm font-bold transition-all",
                                                !isArchiveMode
                                                    ? "bg-white text-indigo-700 shadow-sm border border-white/50"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/20",
                                            )}
                                        >
                                            <LayoutGrid size={16} />
                                            <span className="whitespace-nowrap">
                                                Cơ hội
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                !isArchiveMode &&
                                                toggleArchiveMode()
                                            }
                                            className={cn(
                                                "flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-sm font-bold transition-all",
                                                isArchiveMode
                                                    ? "bg-white text-indigo-700 shadow-sm border border-white/50"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/20",
                                            )}
                                        >
                                            <Archive size={16} />
                                            <span className="whitespace-nowrap">
                                                Lưu trữ
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                            <div className="flex shadow-lg shadow-indigo-500/30 rounded-lg overflow-hidden border border-indigo-400/30">
                                <Button
                                    onClick={onAddCustomer}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white hover:bg-indigo-600 transition-colors font-bold text-sm rounded-l-lg rounded-r-none border-0"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">
                                        Thêm mới
                                    </span>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="px-2.5 bg-[#4F46E5] text-white border-l border-indigo-500/50 hover:bg-indigo-600 transition-colors rounded-l-none rounded-r-lg">
                                            <ChevronDown className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onClick={handleImportCustomer}
                                        >
                                            <ImportIcon className="size-4" />
                                            <span>{t("common.import")}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleExportCustomer}
                                        >
                                            <Download className="size-4" />
                                            <span>{t("common.export")}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* --- MAIN BODY --- */}
                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* LEFT: CONNECTED PAGES LIST (Replaces Tabs) */}
                        <div className="w-16 md:w-64 flex-shrink-0 border-r border-white/30 bg-white/30 flex flex-col py-2 overflow-hidden">
                            <div className="px-4 py-3 hidden md:block">
                                <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
                                    Kênh kết nối
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
                                {/* Channels Section */}
                                <ul className="space-y-1">
                                    {customerSources.map((source) => {
                                        const isExpanded =
                                            expandedMenus[source.id];
                                        const hasChildren =
                                            !!source.children?.length;
                                        const isSelected =
                                            selectedSource === source.id;

                                        return (
                                            <li key={source.id}>
                                                <button
                                                    onClick={() =>
                                                        hasChildren
                                                            ? toggleExpand(
                                                                  source.id,
                                                              )
                                                            : handleSourceSelect(
                                                                  source.id,
                                                              )
                                                    }
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-xl transition-all group relative",
                                                        isSelected
                                                            ? "bg-white shadow-sm ring-1 ring-black/5"
                                                            : "hover:bg-white/40",
                                                    )}
                                                >
                                                    {/* Avatar/Icon Area */}
                                                    <div className="relative flex-shrink-0">
                                                        {source.id ===
                                                        "chance" ? (
                                                            <div
                                                                className={cn(
                                                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                                                    isSelected
                                                                        ? "bg-indigo-100 text-indigo-600"
                                                                        : "bg-white/50 text-gray-500",
                                                                )}
                                                            >
                                                                <HandCoins
                                                                    size={20}
                                                                />
                                                            </div>
                                                        ) : source.id ===
                                                              "messenger" ||
                                                          source.id ===
                                                              "zalo" ? (
                                                            <div className="relative">
                                                                <div
                                                                    className={cn(
                                                                        "w-10 h-10 rounded-full flex items-center justify-center border border-white/50",
                                                                        isSelected
                                                                            ? "bg-white"
                                                                            : "bg-white/50",
                                                                    )}
                                                                >
                                                                    {
                                                                        source.icon
                                                                    }
                                                                </div>
                                                                {source.id ===
                                                                    "messenger" &&
                                                                    renderPlatformBadge(
                                                                        "facebook",
                                                                    )}
                                                                {source.id ===
                                                                    "zalo" &&
                                                                    renderPlatformBadge(
                                                                        "zalo",
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={cn(
                                                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                                                    isSelected
                                                                        ? "bg-indigo-100 text-indigo-600"
                                                                        : "bg-white/50 text-gray-500",
                                                                )}
                                                            >
                                                                {source.icon}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Text Info (Hidden on mobile) */}
                                                    <div className="hidden md:flex flex-1 flex-col items-start min-w-0">
                                                        <span
                                                            className={cn(
                                                                "text-sm truncate w-full text-left",
                                                                isSelected
                                                                    ? "font-bold text-gray-800"
                                                                    : "font-medium text-gray-600",
                                                            )}
                                                        >
                                                            {source.name}
                                                        </span>
                                                        {source.id !==
                                                            "chance" && (
                                                            <span className="text-[10px] text-gray-400 font-medium truncate">
                                                                {source.id ===
                                                                "messenger"
                                                                    ? "Fanpage"
                                                                    : source.id ===
                                                                        "zalo"
                                                                      ? "Zalo OA"
                                                                      : source.id ===
                                                                          "config-form"
                                                                        ? "Form"
                                                                        : "AI Chatbot"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Count Badge & Settings */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {source.count > 0 && (
                                                            <span className="text-white inline-flex items-center rounded-full text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/80 py-[1px] px-[5px]">
                                                                {source.count >
                                                                99
                                                                    ? "99+"
                                                                    : source.count}
                                                            </span>
                                                        )}

                                                        {/* Settings button for Messenger/Zalo */}
                                                        {(source.id ===
                                                            "messenger" ||
                                                            source.id ===
                                                                "zalo") && (
                                                            <div className="flex items-center">
                                                                {(() => {
                                                                    const connected =
                                                                        source.id ===
                                                                        "messenger"
                                                                            ? isProviderConnected(
                                                                                  "FACEBOOK",
                                                                              )
                                                                            : isProviderConnected(
                                                                                  "ZALO",
                                                                              );
                                                                    return (
                                                                        <>
                                                                            {connected ? (
                                                                                <TooltipProvider>
                                                                                    <Tooltip
                                                                                        content={t(
                                                                                            "common.settings",
                                                                                        )}
                                                                                    >
                                                                                        <span
                                                                                            role="button"
                                                                                            tabIndex={
                                                                                                0
                                                                                            }
                                                                                            className={cn(
                                                                                                "text-xs px-1.5 cursor-pointer transition-opacity duration-300",
                                                                                                isMobile
                                                                                                    ? "opacity-100"
                                                                                                    : "opacity-0 group-hover:opacity-100",
                                                                                            )}
                                                                                            onClick={(
                                                                                                e,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                if (
                                                                                                    source.id ===
                                                                                                    "messenger"
                                                                                                ) {
                                                                                                    handleSourceSelect(
                                                                                                        "config-messenger",
                                                                                                    );
                                                                                                } else if (
                                                                                                    source.id ===
                                                                                                    "zalo"
                                                                                                ) {
                                                                                                    handleSourceSelect(
                                                                                                        "config-zalo",
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <SettingsIcon className="size-4" />
                                                                                        </span>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            ) : (
                                                                                <TooltipProvider>
                                                                                    <Tooltip
                                                                                        content={t(
                                                                                            "common.connect",
                                                                                        )}
                                                                                    >
                                                                                        <span
                                                                                            role="button"
                                                                                            tabIndex={
                                                                                                0
                                                                                            }
                                                                                            className={cn(
                                                                                                "text-xs px-1.5 cursor-pointer transition-opacity duration-300",
                                                                                                isMobile
                                                                                                    ? "opacity-100"
                                                                                                    : "opacity-0 group-hover:opacity-100",
                                                                                            )}
                                                                                            onClick={(
                                                                                                e,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                if (
                                                                                                    source.id ===
                                                                                                    "messenger"
                                                                                                ) {
                                                                                                    handleSourceSelect(
                                                                                                        "config-messenger",
                                                                                                    );
                                                                                                } else if (
                                                                                                    source.id ===
                                                                                                    "zalo"
                                                                                                ) {
                                                                                                    handleSourceSelect(
                                                                                                        "config-zalo",
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Link2 className="size-4" />
                                                                                        </span>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                        {/* Chevron for expandable items */}
                                                        {hasChildren && (
                                                            <div className="shrink-0">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Submenu */}
                                                {hasChildren && isExpanded && (
                                                    <ul className="ml-6 mt-1 space-y-1">
                                                        {source.children!.map(
                                                            (child) => (
                                                                <li
                                                                    key={
                                                                        child.id
                                                                    }
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            handleSourceSelect(
                                                                                child.id,
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            "w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors",
                                                                            selectedSource ===
                                                                                child.id &&
                                                                                "bg-sidebar-accent/60 dark:bg-sidebar-accent/20",
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className={cn(
                                                                                    "shrink-0",
                                                                                    child.color,
                                                                                )}
                                                                            >
                                                                                {
                                                                                    child.icon
                                                                                }
                                                                            </span>
                                                                            {
                                                                                child.name
                                                                            }
                                                                        </div>
                                                                    </button>
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {/* Add Channel Button (Mock) */}
                            <div className="p-2 mt-auto border-t border-white/20 hidden md:block">
                                <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-200">
                                    <Plus size={14} /> Thêm kết nối
                                </button>
                            </div>
                        </div>

                        {/* MIDDLE: CUSTOMER LIST */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white/10 overflow-hidden">
                            {/* Search & Quick Filter - Style từ CustomerList.tsx - Hidden on config pages */}
                            {viewMode === "customers" &&
                                !selectedSource?.startsWith("config-") && (
                                    <div className="p-3 border-b border-white/20 bg-white/20 backdrop-blur-md space-y-3 shrink-0">
                                        {/* Search Input */}
                                        <div className="relative group">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors"
                                                size={16}
                                            />
                                            {onSearch ? (
                                                <div className="relative">
                                                    <SearchBox
                                                        initialValue={
                                                            searchText
                                                        }
                                                        onSearch={onSearch}
                                                    />
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm..."
                                                    className="w-full bg-white/50 border border-white/40 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800 placeholder-gray-400 transition-all shadow-inner focus:bg-white"
                                                />
                                            )}
                                        </div>

                                        {/* Filter Buttons */}
                                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                                            {/* Tất cả / Lưu trữ buttons first */}
                                            {/* {filterOptions.map((filter) => (
                                                <button
                                                    key={filter.id}
                                                    onClick={() => {
                                                        setActiveFilter(
                                                            filter.id as any,
                                                        );
                                                        // Toggle archive mode based on filter selection
                                                        if (
                                                            filter.id ===
                                                                "archive" &&
                                                            !isArchiveMode
                                                        ) {
                                                            toggleArchiveMode();
                                                        } else if (
                                                            filter.id === "all" &&
                                                            isArchiveMode
                                                        ) {
                                                            toggleArchiveMode();
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0",
                                                        activeFilter === filter.id
                                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                                                            : "bg-white/40 text-gray-600 border-white/30 hover:bg-white/60 hover:text-gray-800",
                                                    )}
                                                >
                                                    {filter.label}
                                                </button>
                                            ))} */}
                                            {/* 
                                            <div className="w-px h-4 bg-gray-300/50 shrink-0 mx-1"></div> */}

                                            {/* Advanced filter button */}
                                            <Popover
                                                open={showFilterPanel}
                                                onOpenChange={
                                                    setShowFilterPanel
                                                }
                                            >
                                                <PopoverTrigger asChild>
                                                    <button
                                                        ref={filterButtonRef}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border shrink-0",
                                                            showFilterPanel ||
                                                                hasActiveFilters()
                                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                                : "bg-white/40 text-gray-700 border-white/30 hover:bg-white/60",
                                                        )}
                                                    >
                                                        <Filter size={14} />
                                                        <span>Bộ lọc</span>
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    align="start"
                                                    className="w-[350px] p-0 z-[100000] bg-white shadow-xl rounded-2xl border-none overflow-hidden"
                                                >
                                                    <Tabs
                                                        value={activeTab}
                                                        onValueChange={
                                                            setActiveTab
                                                        }
                                                    >
                                                        <TabsList className="w-full grid grid-cols-2 rounded-t-2xl">
                                                            <TabsTrigger value="manual">
                                                                Thủ công
                                                            </TabsTrigger>
                                                            <TabsTrigger value="system">
                                                                Hệ thống
                                                            </TabsTrigger>
                                                        </TabsList>

                                                        <TabsContent
                                                            value="manual"
                                                            className="m-0"
                                                        >
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
                                                                            <Label>
                                                                                Theo
                                                                                thời
                                                                                gian
                                                                            </Label>
                                                                            <TimeDropdown
                                                                                date={
                                                                                    date
                                                                                }
                                                                                setDate={
                                                                                    setDate
                                                                                }
                                                                                dateSelect={
                                                                                    dateSelected
                                                                                }
                                                                                setDateSelect={
                                                                                    setDateSelected
                                                                                }
                                                                                className={
                                                                                    "bg-(--bg2)"
                                                                                }
                                                                                variant="none"
                                                                                align="start"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <Label
                                                                            htmlFor="tags"
                                                                            className="text-sm"
                                                                        >
                                                                            Nhãn
                                                                        </Label>
                                                                        <CustomerTagsMultiSelector
                                                                            orgId={
                                                                                orgId
                                                                            }
                                                                            value={
                                                                                selectedTags
                                                                            }
                                                                            onChange={
                                                                                setSelectedTags
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <Label
                                                                            htmlFor="category"
                                                                            className="text-sm"
                                                                        >
                                                                            Phân
                                                                            loại
                                                                        </Label>
                                                                        <MultiSelect
                                                                            options={
                                                                                categoryOptions
                                                                            }
                                                                            selected={
                                                                                selectedCategories
                                                                            }
                                                                            onChange={
                                                                                setSelectedCategories
                                                                            }
                                                                            className="w-full"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <Label
                                                                            htmlFor="source"
                                                                            className="text-sm"
                                                                        >
                                                                            Nguồn
                                                                        </Label>
                                                                        <UtmSourceMultiSelector
                                                                            orgId={
                                                                                orgId
                                                                            }
                                                                            onChange={
                                                                                setSelectedUtmSources
                                                                            }
                                                                            value={
                                                                                selectedUtmSources
                                                                            }
                                                                            placeholder="Chọn nguồn"
                                                                            hideChevron={
                                                                                false
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <Label
                                                                            htmlFor="assignee"
                                                                            className="text-sm"
                                                                        >
                                                                            Phụ
                                                                            trách
                                                                        </Label>
                                                                        <OrgMembersMultiSelect
                                                                            orgId={
                                                                                orgId
                                                                            }
                                                                            onChange={
                                                                                setSelectedAssignees
                                                                            }
                                                                            value={
                                                                                selectedAssignees
                                                                            }
                                                                            placeholder="Chọn thành viên"
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-between mt-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={
                                                                                clearFilters
                                                                            }
                                                                            className="text-sm"
                                                                        >
                                                                            Xóa
                                                                            bộ
                                                                            lọc
                                                                        </Button>
                                                                        <Button
                                                                            onClick={
                                                                                applyFilter
                                                                            }
                                                                            className="bg-primary text-white text-sm"
                                                                        >
                                                                            Áp
                                                                            dụng
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent
                                                            value="system"
                                                            className="m-0"
                                                        >
                                                            <div className="grid gap-4">
                                                                <div className="space-y-2">
                                                                    <h4 className="leading-none font-medium p-4 mb-0">
                                                                        Bộ lọc
                                                                    </h4>
                                                                    <div className="border-b"></div>
                                                                </div>
                                                                <div className="flex flex-col gap-2 w-full px-4 pb-4">
                                                                    {systemFilterOptions.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    option.value
                                                                                }
                                                                                className="flex items-center space-x-2 py-2"
                                                                            >
                                                                                <Checkbox
                                                                                    id={
                                                                                        option.value
                                                                                    }
                                                                                    checked={selectedSystemFilters.includes(
                                                                                        option.value,
                                                                                    )}
                                                                                    onCheckedChange={(
                                                                                        checked,
                                                                                    ) =>
                                                                                        handleSystemFilterChange(
                                                                                            option.value,
                                                                                            checked as boolean,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <Label
                                                                                    htmlFor={
                                                                                        option.value
                                                                                    }
                                                                                    className="text-sm font-normal cursor-pointer"
                                                                                >
                                                                                    {
                                                                                        option.label
                                                                                    }
                                                                                </Label>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                    <div className="flex justify-between mt-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={
                                                                                clearFilters
                                                                            }
                                                                            className="text-sm"
                                                                        >
                                                                            Xóa
                                                                            bộ
                                                                            lọc
                                                                        </Button>
                                                                        <Button
                                                                            onClick={
                                                                                applyFilter
                                                                            }
                                                                            className="bg-primary text-white text-sm"
                                                                        >
                                                                            Áp
                                                                            dụng
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TabsContent>
                                                    </Tabs>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                )}

                            {/* Customer List / Conversation List Section - Hidden on config pages */}
                            {viewMode === "customers" &&
                                !selectedSource?.startsWith("config-") && (
                                    <div
                                        ref={customerListScrollRef}
                                        className={cn(
                                            "flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 custom-scrollbar min-h-0",
                                            // "max-h-[calc(100vh-330px)]",
                                            // "sm:max-h-[calc(100vh-340px)]",
                                            // "md:max-h-[calc(100vh-350px)]",
                                            // "lg:max-h-[calc(100vh-360px)]",
                                            // "xl:max-h-[calc(100vh-200px)]",
                                        )}
                                    >
                                        {/* Hiển thị ConversationList khi chọn messenger hoặc zalo */}
                                        {selectedSource === "messenger" ||
                                        selectedSource === "zalo" ? (
                                            <ConversationList
                                                orgId={orgId}
                                                workspaceId="default"
                                                onConversationSelect={
                                                    onConversationSelect
                                                }
                                                selectedConversation={
                                                    selectedConversation ||
                                                    undefined
                                                }
                                                defaultProvider={
                                                    conversationProvider
                                                }
                                                onTotalChange={
                                                    onTotalConversationsChange
                                                }
                                            />
                                        ) : (
                                            <CustomerList
                                                orgId={orgId}
                                                onSelect={onCustomerSelect}
                                                onTotalChange={onTotalChange}
                                                selectedCustomerId={
                                                    selectedCustomerId
                                                }
                                                scrollContainerRef={
                                                    customerListScrollRef
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </Glass>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">{children}</div>
        </div>
    );
}

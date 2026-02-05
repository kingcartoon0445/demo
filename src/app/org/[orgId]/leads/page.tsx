"use client";

import ConversationDetailSheet from "@/components/conversation/ConversationDetailSheet";
import ConversationList from "@/components/conversation/ConversationList";
import ConversationTimeline from "@/components/conversation/ConversationTimeline";
import AddCustomerDropdown from "@/components/leads/AddCustomerDropdown";
import AddCustomerModal from "@/components/leads/AddCustomerModal";
import CustomerDetail from "@/components/leads/CustomerDetail";
import { CustomerTimeline } from "@/components/leads/CustomerTimeline";
import { BiArchiveIn } from "react-icons/bi";

import LeadsLayout from "@/components/leads/LeadsLayout";
import { CreateFromGGSheetDialog } from "@/components/leads/CreateFromGGSheetDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Glass } from "@/components/Glass";
import { type Conversation } from "@/hooks/useConversation";
import { useLeadDetailApi } from "@/hooks/useCustomerDetail";
import { ApiResponseSingle, Lead } from "@/lib/interface";

import { getDetailConversation } from "@/api/conversation";
import { ConvertToDealPopup } from "@/components/leads/ConvertToDealPopup";
import LeadsFilter from "@/components/leads/LeadsFilter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MultiSelectProvider } from "@/contexts/MultiSelectContext";
import { useLeadsFilter } from "@/hooks/leads_data";
import useBreakpoint from "@/hooks/useBreakpoint";
import { useInfiniteLeadsWithBodyFilter } from "@/hooks/useCustomerV2";
import { useLeadStore } from "@/store/useLeadStore";
import { useQueryClient } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { MdOutlineInbox } from "react-icons/md";

const SearchBox = React.memo(function SearchBox({
    initialValue,
    onSearch,
}: {
    initialValue: string;
    onSearch: (value: string) => void;
}) {
    const { t } = useLanguage();
    const [value, setValue] = React.useState(initialValue || "");
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        setValue(initialValue || "");
    }, [initialValue]);

    const triggerSearch = React.useCallback(
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

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
                type="text"
                placeholder={t("common.searchCustomer")}
                className="pl-9 pr-10 py-2 border-none rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-sidebar-primary/20"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-gray-700"
                    aria-label="Xóa tìm kiếm"
                >
                    <XIcon className="size-4" />
                </button>
            )}
        </div>
    );
});

export default function CustomersPage() {
    const breakpoint = useBreakpoint();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgId = params.orgId as string;
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { filter, archiveFilter, setFilter, setArchiveFilter } =
        useLeadsFilter();
    const [source, setSource] = useState<string>("");

    const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
    const [totalCustomers, setTotalCustomers] = useState<number>(0);
    const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConvertPopupOpen, setIsConvertPopupOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { selectedLead, isArchiveMode, toggleArchiveMode } = useLeadStore();

    // Conversation mode state
    const [viewMode, setViewMode] = useState<
        "customers" | "conversations" | "config-messenger" | "config-zalo"
    >("customers");
    const [conversationProvider, setConversationProvider] = useState<
        "FACEBOOK" | "ZALO"
    >("FACEBOOK");
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(null);
    const [totalConversations, setTotalConversations] = useState<number>(0);
    const [selectedSource, setSelectedSource] = useState<string>("chance");

    const lidParam = searchParams.get("lid");

    const { data: specificLeadData, isLoading: isLoadingSpecificLead } =
        useLeadDetailApi(orgId, lidParam || "");

    const searchText = searchParams.get("SearchText") || "";

    const currentFilter = isArchiveMode ? archiveFilter : filter;
    let filterBody: any = currentFilter.filterBody || { limit: 20 };
    if (searchText) {
        filterBody = { ...filterBody, searchText };
    }
    if (viewMode === "customers") {
        if (selectedSource === "chance") {
            filterBody = { ...filterBody, channels: ["LEAD"] };
        } else if (selectedSource === "messenger") {
            filterBody = { ...filterBody, channels: ["FACEBOOK"] };
        } else if (selectedSource === "zalo") {
            filterBody = { ...filterBody, channels: ["ZALO"] };
        } else {
            if (filterBody.channels) delete filterBody.channels;
        }
    }

    const { data: leadsData } = useInfiniteLeadsWithBodyFilter(
        orgId,
        filterBody,
    );
    const allCustomers = leadsData?.pages.flatMap((page) => page.content) || [];

    const [hasAutoSelectedFromLid, setHasAutoSelectedFromLid] = useState(false);

    const selectedCustomerId = selectedCustomer?.id || null;

    const handleCustomerSelect = useCallback(
        (customer: Lead) => {
            setSelectedCustomer(customer);
            if (lidParam && customer.id !== lidParam) {
                setHasAutoSelectedFromLid(true);
            }
        },
        [lidParam],
    );

    const isConversationChannel = (lead?: Lead | null) => {
        if (!lead) return false;
        const ch = (lead as any).channel?.toString().toLowerCase?.() || "";
        return ["facebook", "messenger", "livechat", "zalo"].includes(ch);
    };

    const handleOpenDetailPanel = () => {
        setIsDetailPanelOpen(true);
        setIsOpening(true);
        setIsClosing(false);
        setTimeout(() => {
            setIsOpening(false);
        }, 10);
    };

    const handleAddCustomer = () => {
        setIsAddModalOpen(true);
        setSource("lead1");
    };

    const handleImportCustomer = () => {
        setIsImportModalOpen(true);
    };

    const handleSubmitCustomer = (data: any) => {
        setIsAddModalOpen(false);
    };
    const executeSearch = useCallback(
        (searchValue: string) => {
            const currentFilterLocal = isArchiveMode ? archiveFilter : filter;
            const setCurrentFilterLocal = isArchiveMode
                ? setArchiveFilter
                : setFilter;

            const updatedFilterBody: any = {
                ...(currentFilterLocal.filterBody || {}),
            };

            if (searchValue.trim()) {
                updatedFilterBody.searchText = searchValue.trim();
            } else {
                delete updatedFilterBody.searchText;
            }

            if (viewMode === "customers") {
                if (selectedSource === "chance") {
                    updatedFilterBody.channels = ["LEAD"];
                } else if (selectedSource === "messenger") {
                    updatedFilterBody.channels = ["FACEBOOK"];
                } else if (selectedSource === "zalo") {
                    updatedFilterBody.channels = ["ZALO"];
                } else {
                    delete updatedFilterBody.channels;
                }
            } else if (viewMode === "conversations") {
                if (conversationProvider === "FACEBOOK") {
                    updatedFilterBody.channels = ["FACEBOOK"];
                } else if (conversationProvider === "ZALO") {
                    updatedFilterBody.channels = ["ZALO"];
                }
            }

            setCurrentFilterLocal({
                ...currentFilterLocal,
                filterBody: updatedFilterBody,
            });
        },
        [
            filter,
            archiveFilter,
            setFilter,
            setArchiveFilter,
            isArchiveMode,
            viewMode,
            selectedSource,
        ],
    );

    const handleConversationSelect = (conversation: Conversation) => {
        router.push(
            `/org/${orgId}/leads?source=${selectedSource}&cid=${conversation.id}`,
        );
        setSelectedConversation(conversation);
        setSelectedCustomer(null);
        // // Cập nhật URL mà không gây điều hướng lại (tránh giật)
        // if (typeof window !== "undefined") {
        //     const url = new URL(window.location.href);
        //     url.searchParams.set("source", selectedSource);
        //     url.searchParams.set("cid", conversation.id);
        //     window.history.replaceState(null, "", url.toString());
        // }
    };

    const handleSourceSelect = (source: string) => {
        setSelectedSource(source);
        if (source === "messenger") {
            setConversationProvider("FACEBOOK");
            setViewMode("customers"); // Giữ viewMode là customers để giữ LeadsLayout
            // Clear selectedCustomer khi chuyển sang messenger
            setSelectedCustomer(null);
        } else if (source === "zalo") {
            setConversationProvider("ZALO");
            setViewMode("customers"); // Giữ viewMode là customers để giữ LeadsLayout
            // Clear selectedCustomer khi chuyển sang zalo
            setSelectedCustomer(null);
        } else if (source === "config-messenger") {
            setViewMode("config-messenger");
        } else if (source === "config-zalo") {
            setViewMode("config-zalo");
        } else {
            setViewMode("customers");
            // Clear selectedConversation khi chuyển sang source khác (chance, etc.)
            setSelectedConversation(null);
        }
        setSelectedConversation(null);

        try {
            const params = new URLSearchParams(window.location.search);
            if (source) {
                params.set("source", source);
            } else {
                params.delete("source");
            }
            router.replace(`?${params.toString()}`);
        } catch {}

        const currentFilterLocal = isArchiveMode ? archiveFilter : filter;
        const setCurrentFilterLocal = isArchiveMode
            ? setArchiveFilter
            : setFilter;
        const nextFilterBody: any = {
            ...(currentFilterLocal.filterBody || {}),
            limit: (currentFilterLocal.filterBody || {}).limit || 20,
        };
        if (source === "chance") {
            nextFilterBody.channels = ["LEAD"];
        } else if (source === "messenger") {
            nextFilterBody.channels = ["FACEBOOK"];
        } else if (source === "zalo") {
            nextFilterBody.channels = ["ZALO"];
        } else {
            delete nextFilterBody.channels;
        }
        setCurrentFilterLocal({
            ...currentFilterLocal,
            filterBody: nextFilterBody,
        });
    };

    useEffect(() => {
        const sourceParam = searchParams.get("source");
        if (
            sourceParam &&
            ["potential", "messenger", "zalo", "chance"].includes(sourceParam)
        ) {
            setSelectedSource(sourceParam);
            handleSourceSelect(sourceParam);
        } else if (!sourceParam) {
            setSelectedSource("chance");
            handleSourceSelect("chance");
        }
    }, [searchParams]);

    useEffect(() => {
        setHasAutoSelectedFromLid(false);
    }, [lidParam]);
    useEffect(() => {
        const cid = searchParams.get("cid");
        if (!cid) return;
        if (selectedConversation?.id === cid) return;
        const getDetailConversationAction = async () => {
            const response = (await getDetailConversation(
                orgId,
                cid,
            )) as ApiResponseSingle<Conversation>;
            if (response.code != 0) {
                toast.error(response.message as any);
            } else {
                const conversation: Conversation = {
                    id: cid,
                    pageName: response.content.pageName,
                    pageAvatar: response.content.pageAvatar,
                    snippet: response.content.snippet,
                    channel: response.content.channel,
                    sourceName: response.content.sourceName,
                    fullName: response.content.personName || "",
                    avatar: response.content.personAvatar || "",
                    assignees: [],
                    createdDate: response.content.createdDate,
                    lastModifiedDate: response.content.lastModifiedDate,
                };
                setSelectedConversation(conversation);
            }
        };
        getDetailConversationAction();
    }, [searchParams, conversationProvider, selectedConversation?.id]);

    useEffect(() => {
        if (!lidParam || hasAutoSelectedFromLid) return;

        const leadInList = allCustomers?.find(
            (customer) => customer.id === lidParam,
        );

        if (leadInList) {
            setSelectedCustomer(leadInList);
            setHasAutoSelectedFromLid(true);
        } else if (specificLeadData?.content && !isLoadingSpecificLead) {
            const detailLead = specificLeadData.content;
            const leadData: Lead = {
                ...detailLead,
                customer:
                    detailLead.customer?.id || (detailLead.customer as any),
                createdDate: detailLead.createdDate || new Date().toISOString(),
                lastModifiedDate:
                    detailLead.lastModifiedDate || new Date().toISOString(),
            };
            setSelectedCustomer(leadData);
            setHasAutoSelectedFromLid(true);
        }
    }, [
        lidParam,
        allCustomers,
        specificLeadData,
        isLoadingSpecificLead,
        hasAutoSelectedFromLid,
    ]);

    const handleConvertToDeal = () => {
        setIsConvertPopupOpen(false);
    };

    return (
        <MultiSelectProvider>
            <TooltipProvider>
                <LeadsLayout
                    selectedSource={selectedSource}
                    onSourceChange={handleSourceSelect}
                    orgId={orgId}
                    viewMode={viewMode}
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={handleCustomerSelect}
                    isArchiveMode={isArchiveMode}
                    selectedCustomerId={selectedCustomerId}
                    onTotalChange={setTotalCustomers}
                    onAddCustomer={handleAddCustomer}
                    conversationProvider={conversationProvider}
                    selectedConversation={selectedConversation}
                    onConversationSelect={handleConversationSelect}
                    onTotalConversationsChange={setTotalConversations}
                    totalCustomers={totalCustomers}
                    onSearch={executeSearch}
                    onImportCustomer={handleImportCustomer}
                    searchText={currentFilter.filterBody?.searchText || ""}
                >
                    <div className="flex flex-col h-full overflow-hidden w-full">
                        {/* Toolbar cũ - đã được tích hợp vào LeadsLayout, ẩn đi */}
                        <div className="bg-background border-b flex-shrink-0 hidden">
                            {/* Toolbar */}
                            <div
                                className={`flex items-center justify-between  text-sm ${
                                    viewMode === "customers" ? "px-2 py-1" : ""
                                }`}
                            >
                                {/* Left side - Action buttons and search */}
                                {viewMode == "customers" && (
                                    <div className="flex items-center gap-4">
                                        {breakpoint == "xl" ||
                                        breakpoint == "2xl" ? (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    className={`font-normal p-2 border text-[#646A73] rounded-lg flex items-center gap-1 ${
                                                        isArchiveMode
                                                            ? "text-sidebar-primary border-sidebar-primary bg-sidebar-primary/5 hover:bg-sidebar-primary/10"
                                                            : "hover:bg-muted"
                                                    }`}
                                                    onClick={toggleArchiveMode}
                                                >
                                                    <BiArchiveIn className="size-4" />
                                                    {t("common.archive")}
                                                </Button>

                                                {viewMode === "customers" && (
                                                    <LeadsFilter
                                                        key={
                                                            isArchiveMode
                                                                ? "archive"
                                                                : "normal"
                                                        }
                                                        isArchiveMode={
                                                            isArchiveMode
                                                        }
                                                        breakpoint={breakpoint}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip
                                                            content={t(
                                                                "common.archive",
                                                            )}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                className={`font-normal p-2 border text-[#646A73] rounded-lg flex items-center gap-1 ${
                                                                    isArchiveMode
                                                                        ? "text-sidebar-primary border-sidebar-primary bg-sidebar-primary/5 hover:bg-sidebar-primary/10"
                                                                        : "hover:bg-muted"
                                                                }`}
                                                                onClick={
                                                                    toggleArchiveMode
                                                                }
                                                            >
                                                                <BiArchiveIn className="size-4" />
                                                            </Button>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {viewMode ===
                                                        "customers" && (
                                                        <LeadsFilter
                                                            key={
                                                                isArchiveMode
                                                                    ? "archive"
                                                                    : "normal"
                                                            }
                                                            isArchiveMode={
                                                                isArchiveMode
                                                            }
                                                            breakpoint={
                                                                breakpoint
                                                            }
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-muted-foreground text-left w-full">
                                                    {viewMode === "customers"
                                                        ? isArchiveMode
                                                            ? t(
                                                                  "common.archivedCustomers",
                                                              )
                                                            : t(
                                                                  "common.allCustomers",
                                                              )
                                                        : ""}
                                                    <span className="">
                                                        {viewMode ===
                                                        "customers" ? (
                                                            <>
                                                                :{" "}
                                                                <span className="font-medium text-black">
                                                                    {
                                                                        totalCustomers
                                                                    }
                                                                </span>
                                                            </>
                                                        ) : (
                                                            ``
                                                        )}
                                                    </span>
                                                </span>
                                            </div>
                                        )}

                                        {breakpoint == "xl" ||
                                            (breakpoint == "2xl" && (
                                                <span className="text-muted-foreground">
                                                    {viewMode === "customers"
                                                        ? isArchiveMode
                                                            ? t(
                                                                  "common.archivedCustomers",
                                                              )
                                                            : t(
                                                                  "common.allCustomers",
                                                              )
                                                        : ""}
                                                    <span className="">
                                                        {viewMode ===
                                                        "customers" ? (
                                                            <>
                                                                :{" "}
                                                                <span className="font-medium text-black">
                                                                    {
                                                                        totalCustomers
                                                                    }
                                                                </span>
                                                            </>
                                                        ) : (
                                                            ``
                                                        )}
                                                    </span>
                                                </span>
                                            ))}
                                    </div>
                                )}
                                {viewMode === "customers" && (
                                    <div className="flex items-center gap-2">
                                        <SearchBox
                                            initialValue={
                                                currentFilter.filterBody
                                                    ?.searchText || ""
                                            }
                                            onSearch={executeSearch}
                                        />
                                        {!isArchiveMode &&
                                            viewMode === "customers" && (
                                                <AddCustomerDropdown
                                                    onAddNew={handleAddCustomer}
                                                    onImport={
                                                        handleImportCustomer
                                                    }
                                                />
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Nav Bar */}

                        {/* Main content areas */}
                        <div className="flex-1 flex overflow-hidden gap-4 relative h-full w-full min-h-0">
                            {viewMode === "customers" ? (
                                <>
                                    {/* Hiển thị ConversationTimeline khi chọn conversation (messenger/zalo) */}
                                    {(selectedSource === "messenger" ||
                                        selectedSource === "zalo") &&
                                    selectedConversation ? (
                                        <>
                                            {/* Panel 3: Conversation Timeline */}
                                            <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden basis-[65%]">
                                                <Glass
                                                    className="h-full flex flex-col rounded-t-3xl rounded-b-none overflow-hidden border-white/40 min-h-0"
                                                    intensity="medium"
                                                >
                                                    <ConversationTimeline
                                                        conversation={
                                                            selectedConversation
                                                        }
                                                        orgId={orgId}
                                                    />
                                                </Glass>
                                            </div>

                                            {/* Panel 4: Conversation Detail */}
                                            {/* Panel 4: Conversation Detail - MOBLIE */}
                                            {isDetailPanelOpen && (
                                                <div className="xl:hidden">
                                                    <ConversationDetailSheet
                                                        conversation={
                                                            selectedConversation
                                                        }
                                                        orgId={orgId}
                                                        open={true}
                                                        onOpenChange={(
                                                            open,
                                                        ) => {
                                                            setIsDetailPanelOpen(
                                                                open,
                                                            );
                                                            if (!open) {
                                                                setIsClosing(
                                                                    true,
                                                                );
                                                                setTimeout(
                                                                    () => {
                                                                        setIsClosing(
                                                                            false,
                                                                        );
                                                                    },
                                                                    300,
                                                                );
                                                            }
                                                        }}
                                                        onProviderChange={
                                                            setSource
                                                        }
                                                        onOpenAddCustomerModal={() =>
                                                            setIsAddModalOpen(
                                                                true,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {/* Panel 4: Conversation Detail - DESKTOP */}
                                            <div className="hidden xl:block h-full min-h-0 overflow-hidden basis-[45%]">
                                                <Glass
                                                    className="h-full flex flex-col rounded-3xl overflow-hidden border-white/40 min-h-0"
                                                    intensity="medium"
                                                >
                                                    <ConversationDetailSheet
                                                        conversation={
                                                            selectedConversation
                                                        }
                                                        orgId={orgId}
                                                        open={false}
                                                        onOpenChange={(
                                                            open,
                                                        ) => {
                                                            setIsDetailPanelOpen(
                                                                open,
                                                            );
                                                            if (!open) {
                                                                setIsClosing(
                                                                    true,
                                                                );
                                                                setTimeout(
                                                                    () => {
                                                                        setIsClosing(
                                                                            false,
                                                                        );
                                                                    },
                                                                    300,
                                                                );
                                                            }
                                                        }}
                                                        onProviderChange={
                                                            setSource
                                                        }
                                                        onOpenAddCustomerModal={() =>
                                                            setIsAddModalOpen(
                                                                true,
                                                            )
                                                        }
                                                    />
                                                </Glass>
                                            </div>
                                        </>
                                    ) : selectedCustomer ? (
                                        <>
                                            {/* Panel 3: Customer Timeline & notes */}
                                            <div className="flex-1 flex flex-col min-w-0 min-h-0 basis-[65%]">
                                                <Glass
                                                    className="h-full w-full flex flex-col rounded-3xl overflow-hidden shadow-lg border-white/40"
                                                    intensity="medium"
                                                >
                                                    <CustomerTimeline
                                                        onShowCustomerDetail={
                                                            handleOpenDetailPanel
                                                        }
                                                        customer={
                                                            selectedCustomer
                                                        }
                                                        orgId={orgId}
                                                        onSelectCustomer={
                                                            setSelectedCustomer
                                                        }
                                                        isArchiveMode={
                                                            isArchiveMode
                                                        }
                                                    />
                                                </Glass>
                                            </div>

                                            {isDetailPanelOpen && (
                                                <CustomerDetail
                                                    customer={selectedCustomer}
                                                    orgId={orgId}
                                                    workspaceId={
                                                        selectedCustomer?.workspaceId ||
                                                        "default"
                                                    }
                                                    open={true}
                                                    onOpenChange={(open) => {
                                                        setIsDetailPanelOpen(
                                                            open,
                                                        );
                                                        if (!open) {
                                                            setIsClosing(true);
                                                            setTimeout(() => {
                                                                setIsClosing(
                                                                    false,
                                                                );
                                                            }, 300);
                                                        }
                                                    }}
                                                    onDeleteSuccess={() => {
                                                        setSelectedCustomer(
                                                            null,
                                                        );
                                                    }}
                                                    isArchiveMode={
                                                        isArchiveMode
                                                    }
                                                    onSelectCustomer={
                                                        setSelectedCustomer
                                                    }
                                                    onProviderChange={setSource}
                                                    onOpenAddCustomerModal={() =>
                                                        setIsAddModalOpen(true)
                                                    }
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-muted-foreground">
                                                    {selectedSource ===
                                                        "messenger" ||
                                                    selectedSource === "zalo"
                                                        ? "Chọn cuộc trò chuyện để xem"
                                                        : t(
                                                              "common.selectCustomerToViewTimeline",
                                                          )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : viewMode === "config-messenger" ? (
                                <div>Messenger config</div>
                            ) : viewMode === "config-zalo" ? (
                                <div>Zalo config</div>
                            ) : null}
                        </div>
                    </div>

                    {/* Add Customer Modal */}
                    {isAddModalOpen && (
                        <AddCustomerModal
                            isOpen={isAddModalOpen}
                            onClose={() => setIsAddModalOpen(false)}
                            onSubmit={handleSubmitCustomer}
                            orgId={orgId}
                            provider={source}
                            conversationId={
                                isConversationChannel(selectedCustomer)
                                    ? selectedCustomer?.id
                                    : selectedConversation
                                      ? selectedConversation.id
                                      : undefined
                            }
                            leadId={
                                !isConversationChannel(selectedCustomer)
                                    ? selectedCustomer?.id
                                    : undefined
                            }
                        />
                    )}

                    {/* Import Customer Modal */}
                    {isImportModalOpen && (
                        <CreateFromGGSheetDialog
                            open={isImportModalOpen}
                            setOpen={setIsImportModalOpen}
                        />
                    )}

                    {/* ConvertToDealPopup when needed */}
                    {selectedCustomer && isConvertPopupOpen && (
                        <ConvertToDealPopup
                            orgId={orgId}
                            isOpen={isConvertPopupOpen}
                            onClose={() => setIsConvertPopupOpen(false)}
                            onConfirm={handleConvertToDeal}
                            leadId={selectedCustomer?.id}
                            leadName={selectedCustomer?.fullName || ""}
                            onSelectCustomer={setSelectedCustomer}
                        />
                    )}

                    {isImportModalOpen && (
                        <CreateFromGGSheetDialog
                            open={isImportModalOpen}
                            setOpen={setIsImportModalOpen}
                        />
                    )}
                </LeadsLayout>
            </TooltipProvider>
        </MultiSelectProvider>
    );
}

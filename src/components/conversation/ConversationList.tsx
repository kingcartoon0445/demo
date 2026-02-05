"use client";

import { type Conversation } from "@/hooks/useConversation";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfiniteLeadsWithBodyFilter } from "@/hooks/useCustomerV2";
import { firebaseDb } from "@/lib/firebase";
import { Lead } from "@/lib/interface";
import { getAvatarUrl, getFirstAndLastWord, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { onChildAdded, onChildChanged, ref } from "firebase/database";
import { MessageCircle } from "lucide-react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import Loading from "../common/Loading";
import { Glass } from "../Glass";
interface ConversationListProps {
    orgId: string;
    workspaceId: string;
    onConversationSelect?: (conversation: Conversation) => void;
    defaultProvider?: "FACEBOOK" | "ZALO";
    onTotalChange?: (total: number) => void;
    selectedConversation?: Conversation;
}

const ConversationItem = ({
    conversation,
    onClick,
    selected = false,
}: {
    conversation: Conversation;
    onClick?: () => void;
    selected?: boolean;
}) => {
    const formatTime = (timestamp: number) => {
        try {
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutes < 1) return "Vừa xong";
            if (minutes < 60) return `${minutes} phút trước`;
            if (hours < 24) return `${hours} giờ trước`;
            if (days < 30) return `${days} ngày trước`;
            return new Date(timestamp).toLocaleDateString("vi-VN");
        } catch {
            return "";
        }
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-2xl cursor-pointer transition-all duration-300 border mb-2 mx-2",
                selected
                    ? "bg-white/90 border-indigo-200 shadow-md transform scale-[1.01]"
                    : "bg-white/40 border-white/30 hover:bg-white/60 hover:shadow-sm",
            )}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                        <Avatar
                            name={
                                getFirstAndLastWord(conversation.fullName) || ""
                            }
                            src={getAvatarUrl(conversation.avatar) || ""}
                            round
                            size={"40"}
                            className="border-2 border-white shadow-sm"
                        />
                    </div>

                    {/* Name and snippet */}
                    <div>
                        <h3
                            className={cn(
                                "font-bold text-sm",
                                selected ? "text-indigo-900" : "text-gray-800",
                            )}
                        >
                            {conversation.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">
                            {conversation.pageName || conversation.channel}
                        </p>
                    </div>
                </div>

                {/* Time */}
                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">
                        {formatTime(
                            new Date(conversation.lastModifiedDate).getTime(),
                        )}
                    </span>
                </div>
            </div>

            {/* Snippet below */}
            {conversation.snippet && (
                <div className="mt-2 pl-13 flex items-end justify-between gap-2">
                    <div
                        className={cn(
                            "text-xs px-2 py-1.5 rounded-lg inline-block truncate flex-1",
                            selected
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-white/30 text-gray-600",
                        )}
                    >
                        <span className="font-medium">
                            {conversation.snippet}
                        </span>
                    </div>
                    {/* Page Avatar */}
                    <Avatar
                        name={getFirstAndLastWord(conversation.pageName) || ""}
                        src={getAvatarUrl(conversation.pageAvatar) || ""}
                        round
                        size={"20"}
                        className="flex-shrink-0"
                    />
                </div>
            )}
        </div>
    );
};

export default function ConversationList({
    orgId,
    workspaceId,
    onConversationSelect,
    defaultProvider,
    onTotalChange,
    selectedConversation,
}: ConversationListProps) {
    const [activeTab, setActiveTab] = useState<"FACEBOOK" | "ZALO">(
        defaultProvider || "FACEBOOK",
    );
    const observerRef = useRef<IntersectionObserver | null>(null);

    const queryClient = useQueryClient();

    useEffect(() => {
        // Guard against missing orgId / workspaceId
        if (!orgId || !workspaceId) {
            return;
        }

        // Firebase DB reference
        const firebasePath = `root/OrganizationId: ${orgId}/CreateOrUpdateConversation`;
        const convRef = ref(firebaseDb, firebasePath);
        // Callback to refresh conversation lists
        const refreshLists = (snapshot?: any) => {
            const data = snapshot?.val?.();

            queryClient.invalidateQueries({
                queryKey: [
                    "infinite-leads-body-filter",
                    orgId,
                    {
                        channels: [data.Provider],
                        limit: 20,
                    },
                ],
            });
        };

        const refreshListsWithError = (error: any) => {
            console.error("ConversationList: Firebase listener error", error);
        };

        try {
            // Register listeners
            const offChildAdded = onChildAdded(convRef, refreshLists);
            const offChildChanged = onChildChanged(convRef, refreshLists);

            // Cleanup when component unmounts or ids change
            return () => {
                offChildAdded();
                offChildChanged();
            };
        } catch (error) {
            console.error(
                "ConversationList: Error setting up Firebase listeners",
                error,
            );
        }
    }, [orgId, queryClient]);

    // Sync activeTab with defaultProvider changes
    React.useEffect(() => {
        if (defaultProvider) {
            setActiveTab(defaultProvider);
        }
    }, [defaultProvider]);

    // Infinite queries for both providers
    const {
        data: facebookData,
        isLoading: facebookLoading,
        error: facebookError,
        fetchNextPage: fetchNextFacebook,
        hasNextPage: hasNextFacebook,
        isFetchingNextPage: isFetchingNextFacebook,
    } = useInfiniteLeadsWithBodyFilter(
        orgId,
        {
            channels: ["FACEBOOK"],
            limit: 20,
        },
        { enabled: activeTab === "FACEBOOK" },
    );

    const {
        data: zaloData,
        isLoading: zaloLoading,
        error: zaloError,
        fetchNextPage: fetchNextZalo,
        hasNextPage: hasNextZalo,
        isFetchingNextPage: isFetchingNextZalo,
    } = useInfiniteLeadsWithBodyFilter(
        orgId,
        {
            channels: ["ZALO"],
            limit: 20,
        },
        { enabled: activeTab === "ZALO" },
    );

    useEffect(() => {
        if (facebookData !== undefined) {
            if (facebookData?.pages[0]?.code === 403) {
                toast.error(facebookData?.pages[0]?.message || "No more data");
            }
        }
    }, [facebookData]);

    useEffect(() => {
        if (zaloData !== undefined) {
            if (zaloData?.pages[0]?.code === 403) {
                toast.error(zaloData?.pages[0]?.message || "No more data");
            }
        }
    }, [zaloData]);
    // Flatten all pages data
    const mapLeadsToConversations = (leads: Lead[]): Conversation[] => {
        return leads.map((lead) => ({
            id: lead.id,
            fullName: lead.fullName,
            avatar: lead.avatar || "",
            assignees: lead.assignees,
            createdDate: lead.createdDate,
            lastModifiedDate: lead.lastModifiedDate,
            snippet: lead.snippet || "",
            channel: lead.channel ?? "",
            sourceName: lead.sourceName ?? "",
            pageName: lead.pageName ?? "",
            pageAvatar: lead.pageAvatar ?? "",
        }));
    };

    const allFacebookConversations: Conversation[] = mapLeadsToConversations(
        (facebookData?.pages.flatMap((page) =>
            page.content == null ? [] : page.content,
        ) as Lead[]) || [],
    );
    const allZaloConversations: Conversation[] = mapLeadsToConversations(
        (zaloData?.pages.flatMap((page) =>
            page.content == null ? [] : page.content,
        ) as Lead[]) || [],
    );

    // Báo total count lên parent component
    useEffect(() => {
        const facebookTotal = facebookData?.pages[0]?.metadata?.total || 0;
        const zaloTotal = zaloData?.pages[0]?.metadata?.total || 0;
        const currentTotal =
            activeTab === "FACEBOOK" ? facebookTotal : zaloTotal;

        onTotalChange?.(currentTotal);
    }, [
        activeTab,
        facebookData?.pages,
        zaloData?.pages,
        allFacebookConversations.length,
        allZaloConversations.length,
        onTotalChange,
    ]);

    // Intersection Observer để load more data
    const observerCallbacks = useRef<{
        facebook?: () => void;
        zalo?: () => void;
    }>({});

    // Tạo observer một lần và không tạo lại
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const provider = entry.target.getAttribute(
                        "data-provider",
                    ) as "FACEBOOK" | "ZALO";

                    if (entry.isIntersecting) {
                        const isLoading =
                            provider === "FACEBOOK"
                                ? facebookLoading
                                : zaloLoading;
                        const hasNextPage =
                            provider === "FACEBOOK"
                                ? hasNextFacebook
                                : hasNextZalo;
                        const isFetchingNextPage =
                            provider === "FACEBOOK"
                                ? isFetchingNextFacebook
                                : isFetchingNextZalo;

                        if (hasNextPage && !isFetchingNextPage && !isLoading) {
                            if (provider === "FACEBOOK") {
                                fetchNextFacebook();
                            } else {
                                fetchNextZalo();
                            }
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: "300px", // Tăng rootMargin để trigger sớm hơn
                threshold: 0.1,
            },
        );

        observerRef.current = observer;

        return () => {
            observer.disconnect();
        };
    }, [
        facebookLoading,
        zaloLoading,
        hasNextFacebook,
        hasNextZalo,
        isFetchingNextFacebook,
        isFetchingNextZalo,
        fetchNextFacebook,
        fetchNextZalo,
    ]);

    // Callback để gắn ref vào element cuối cùng
    const lastElementRef = useCallback(
        (node: HTMLDivElement | null, provider: "FACEBOOK" | "ZALO") => {
            if (node && observerRef.current) {
                // Thêm attribute để identify provider
                node.setAttribute("data-provider", provider);
                observerRef.current.observe(node);
            }
        },
        [],
    );

    // Cleanup observer
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);
    const handleConversationClick = (conversation: Conversation) => {
        onConversationSelect?.(conversation);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value as "FACEBOOK" | "ZALO");
    };

    const renderConversationList = (
        conversations: Conversation[],
        isLoading: boolean,
        error: any,
        hasNextPage: boolean,
        isFetchingNextPage: boolean,
        provider: "FACEBOOK" | "ZALO",
        totalFromFirstPage?: number,
    ) => {
        if (isLoading && conversations.length === 0) {
            return <Loading />;
        }

        if (error) {
            return (
                <div className="text-center py-8 text-red-500">
                    Có lỗi xảy ra khi tải dữ liệu
                </div>
            );
        }

        if (conversations.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Không có cuộc trò chuyện nào</p>
                </div>
            );
        }

        return (
            <div className="space-y-0">
                {conversations
                    .filter((conversation) => conversation.channel === provider)
                    .map((conversation, index) => (
                        <div
                            key={conversation.id}
                            ref={
                                index === conversations.length - 1
                                    ? (node) => {
                                          lastElementRef(node, provider);
                                      }
                                    : null
                            }
                            className="w-full"
                        >
                            <ConversationItem
                                conversation={conversation}
                                onClick={() =>
                                    handleConversationClick(conversation)
                                }
                                selected={
                                    selectedConversation?.id === conversation.id
                                }
                            />
                        </div>
                    ))}

                {/* Loading indicator for infinite scroll */}
                {isFetchingNextPage && <Loading />}

                {/* Trigger element for infinite scroll */}
                {hasNextPage && !isFetchingNextPage && (
                    <div
                        ref={(node) => lastElementRef(node, provider)}
                        className="h-4 w-full"
                        style={{ background: "transparent" }}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="overflow-hidden h-full">
            {/* Show tabs only if no defaultProvider */}
            {!defaultProvider ? (
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="flex flex-col h-full"
                >
                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b shrink-0">
                        <TabsTrigger
                            value="FACEBOOK"
                            className="flex items-center gap-2"
                        >
                            <div className="w-4 h-4 bg-blue-600 rounded"></div>
                            Messenger
                        </TabsTrigger>
                        <TabsTrigger
                            value="ZALO"
                            className="flex items-center gap-2"
                        >
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            Zalo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="FACEBOOK"
                        className="m-0 flex-1 overflow-hidden flex flex-col"
                    >
                        <div className="overflow-y-auto h-full w-full">
                            {renderConversationList(
                                allFacebookConversations as unknown as Conversation[],
                                facebookLoading,
                                facebookError,
                                hasNextFacebook,
                                isFetchingNextFacebook,
                                "FACEBOOK",
                                facebookData?.pages[0]?.metadata?.total,
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="ZALO"
                        className="m-0 flex-1 overflow-hidden flex flex-col"
                    >
                        <div className="overflow-y-auto h-full w-full">
                            {renderConversationList(
                                allZaloConversations as unknown as Conversation[],
                                zaloLoading,
                                zaloError,
                                hasNextZalo,
                                isFetchingNextZalo,
                                "ZALO",
                                zaloData?.pages[0]?.metadata?.total,
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                // Show content directly if defaultProvider is set
                <div className="overflow-y-auto w-full h-full">
                    {activeTab === "FACEBOOK"
                        ? renderConversationList(
                              allFacebookConversations as unknown as Conversation[],
                              facebookLoading,
                              facebookError,
                              hasNextFacebook,
                              isFetchingNextFacebook,
                              "FACEBOOK",
                              facebookData?.pages[0]?.metadata?.total,
                          )
                        : renderConversationList(
                              allZaloConversations as unknown as Conversation[],
                              zaloLoading,
                              zaloError,
                              hasNextZalo,
                              isFetchingNextZalo,
                              "ZALO",
                              zaloData?.pages[0]?.metadata?.total,
                          )}
                </div>
            )}
        </div>
    );
}

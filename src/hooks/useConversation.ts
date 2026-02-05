import {
    getChannelStatus,
    getDetailConversation,
    linkToCustomer,
    linkToLead,
    unlinkToCustomer,
    unlinkToLead,
} from "@/api/conversation";
import {
    connectFacebook,
    connectFacebookLead,
    getConversationDetail,
    getConversationList,
    postConversationList,
    readConversation,
    updateSubscriptionStatus,
} from "@/api/facebook";
import { connectZaloform } from "@/api/lead";
import {
    getChatList,
    sendFbMessage,
    updateFacebookConnectStatus,
} from "@/api/leadV2";
import { useLanguage } from "@/contexts/LanguageContext";
import { LinkToCustomer, LinkToLead } from "@/interfaces/conversation";
import { Assignee } from "@/lib/interface";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

interface ConversationContact {
    workspaceId: string;
    workspaceName: string;
    contactId: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
}

interface Conversation {
    id: string;
    fullName: string;
    avatar: string;
    assignees: Assignee[];
    createdDate: string;
    lastModifiedDate: string;
    snippet: string;
    channel: string;
    sourceName: string;
    pageName: string;
    pageAvatar: string;
    personName?: string;
    personAvatar?: string;
}

interface ConversationListResponse {
    code: number;
    content: Conversation[];
    metadata: {
        total: number;
        count: number;
        offset: number;
        limit: number;
    };
}

interface ConversationParams {
    offset?: number;
    limit?: number;
    provider: "FACEBOOK" | "ZALO";
    sort?: string;
}

export const useConversationList = (
    orgId: string,
    workspaceId: string,
    params: ConversationParams,
    options?: { enabled?: boolean }
) => {
    const queryParams = {
        offset: params.offset || 0,
        limit: params.limit || 20,
        provider: params.provider,
        sort: params.sort || '[{ Column: "CreatedDate", Dir: "DESC" }]',
    };

    return useQuery<ConversationListResponse>({
        queryKey: ["conversationList", orgId, workspaceId, queryParams],
        queryFn: () => getConversationList(orgId, workspaceId, queryParams),
        enabled: options?.enabled !== false,
    });
};

export const useInfiniteConversationList = (
    orgId: string,
    workspaceId: string,
    provider: "FACEBOOK" | "ZALO",
    limit: number = 20,
    options?: { enabled?: boolean }
) => {
    return useInfiniteQuery<ConversationListResponse>({
        queryKey: ["infiniteConversationList", orgId, workspaceId, provider],
        queryFn: ({ pageParam = 0 }) => {
            const queryParams = {
                offset: pageParam as number,
                limit,
                provider,
                sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
            };
            return getConversationList(orgId, workspaceId, queryParams);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            // Tính tổng số items đã load
            const currentTotal = allPages.reduce(
                (sum, page) => sum + page.content.length,
                0
            );

            // Kiểm tra nếu page hiện tại không có data hoặc ít hơn limit thì dừng
            const hasMoreData =
                lastPage.content.length === limit &&
                currentTotal < lastPage.metadata.total;

            return hasMoreData ? currentTotal : undefined;
        },
        enabled: options?.enabled !== false,
    });
};

interface ChatMessage {
    id: string;
    integrationAuthId: string;
    conversationId: string;
    socialConversationId: string;
    messageId: string;
    timestamp: number;
    from: string;
    fromName: string;
    to: string;
    toName: string;
    message: string;
    isGpt: boolean;
    isPageReply: boolean;
    fullName: string;
    avatar?: string;
    profileId: string;
    status: number;
    type?: string;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    json?: string;
}

interface ChatListResponse {
    code: number;
    content: ChatMessage[];
    metadata: {
        total: number;
        count: number;
        offset: number;
        limit: number;
    };
}

export const useChatList = (orgId: string, convId: string, page: number) => {
    return useQuery<ChatListResponse>({
        queryKey: ["chatList", orgId, convId, page],
        queryFn: () =>
            getChatList(orgId, convId, page) as Promise<ChatListResponse>,
        enabled: !!orgId && !!convId,
    });
};

export const useInfiniteChatList = (
    orgId: string,
    convId: string,
    limit: number = 20,
    options?: { enabled?: boolean }
) => {
    return useInfiniteQuery<ChatListResponse>({
        queryKey: ["infiniteChatList", orgId, convId],
        queryFn: ({ pageParam = 0 }) => {
            // getChatList expects page number, not offset
            return getChatList(
                orgId,
                convId,
                pageParam as number
            ) as Promise<ChatListResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.metadata) {
                // Tính tổng số messages đã load
                const currentTotal = allPages.reduce(
                    (sum, page) => sum + page.content.length,
                    0
                );

                // Kiểm tra nếu page hiện tại không có data hoặc ít hơn limit thì dừng
                const hasMoreData =
                    lastPage.content.length === limit &&
                    currentTotal < lastPage.metadata.total;

                return hasMoreData ? allPages.length : undefined;
            }
        },
        enabled: options?.enabled !== false && !!orgId && !!convId,
    });
};

export const useSendMessage = (orgId: string, conversationId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        // Accept the dynamic payload at call time
        mutationFn: (messageData: any) =>
            sendFbMessage(orgId, conversationId, messageData),
        onSuccess: (res: any) => {
            // Refetch chat list after sending

            if (res.code !== 0) {
                toast.error(res.message);
            } else {
                queryClient.invalidateQueries({ queryKey: ["chatList"] });
                queryClient.invalidateQueries({
                    queryKey: ["infiniteChatList"],
                });
            }
        },
    });
};

export const useReadConversation = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId: string) =>
            readConversation(orgId, conversationId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                // Refresh conversation lists so read status updates
                queryClient.invalidateQueries({
                    queryKey: ["conversationList"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infiniteConversationList"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
    });
};

export const useConversationDetail = (
    orgId: string,
    conversationId: string
) => {
    return useQuery({
        queryKey: ["conversationDetail", orgId, conversationId],
        queryFn: () => getConversationDetail(orgId, conversationId),
        enabled: !!orgId && !!conversationId,
    });
};

export const useChannelStatus = (orgId: string) => {
    return useQuery({
        queryKey: ["channelStatus", orgId],
        queryFn: () => getChannelStatus(orgId),
    });
};

export const useConnectFacebook = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => connectFacebook(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
    });
};

export const useConnectFacebookLead = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => connectFacebookLead(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
    });
};

export const useConnectZalo = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => connectZaloform(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
    });
};

export const useConnectZaloLead = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => connectZaloform(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
    });
};

export const useUpdateSubscriptionStatus = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { subscriptionId: string; status: number }) =>
            updateFacebookConnectStatus(
                orgId,
                data.subscriptionId,
                data.status
            ),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            console.log(error);
        },
    });
};

export const useLinkToLead = (orgId: string, conversationId: string) => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: LinkToLead) =>
            linkToLead(orgId, conversationId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.linkLeadSuccess"));
                queryClient.invalidateQueries({
                    queryKey: ["detailConversation", orgId, conversationId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            console.log(error);
        },
    });
};

export const useLinkToCustomer = (orgId: string, conversationId: string) => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: LinkToCustomer) =>
            linkToCustomer(orgId, conversationId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.linkCustomerSuccess"));
                queryClient.invalidateQueries({
                    queryKey: ["detailConversation", orgId, conversationId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            console.log(error);
        },
    });
};

export const useUnlinkToCustomer = (orgId: string, conversationId: string) => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => unlinkToCustomer(orgId, conversationId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.unlinkCustomerSuccess"));
                queryClient.invalidateQueries({
                    queryKey: ["detailConversation", orgId, conversationId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            console.log(error);
        },
    });
};

export const useUnlinkToLead = (orgId: string, conversationId: string) => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => unlinkToLead(orgId, conversationId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.unlinkLeadSuccess"));
                queryClient.invalidateQueries({
                    queryKey: ["detailConversation", orgId, conversationId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            console.log(error);
        },
    });
};

export const useGetDetailConversation = (
    orgId: string,
    conversationId: string
) => {
    return useQuery({
        queryKey: ["detailConversation", orgId, conversationId],
        queryFn: () => getDetailConversation(orgId, conversationId),
        enabled: !!orgId && !!conversationId,
    });
};

export type {
    ChatListResponse,
    ChatMessage,
    Conversation,
    ConversationListResponse,
    ConversationParams,
};

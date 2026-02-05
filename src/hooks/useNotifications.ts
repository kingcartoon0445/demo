import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
} from "@/api/notify";
import { useQuery } from "@tanstack/react-query";

interface NotificationMetadata {
    OrganizationId: string;
    OrganizationName: string;
    WorkspaceId?: string;
    ConversationId?: string;
    PageName?: string;
    PageAvatar?: string;
    PageId?: string;
    PersonAvatar?: string;
    PersonId?: string;
    PersonName?: string;
    Provider?: string;
    Id: string;
    NotifyId: string;
    ContactId?: string;
    ContactName?: string;
    SourceName?: string;
    UtmSource?: string;
    WorkspaceName?: string;
    area?: string;
    taskId?: string;
}

interface Notification {
    id: string;
    organizationId: string;
    workspaceId?: string;
    profileId: string;
    category: string;
    type: string;
    title: string;
    content: string;
    contentHtml: string;
    isRead: boolean;
    metadata: string;
    assignTo: string;
    status: number;
    createdDate: string;
}

interface NotificationResponse {
    code: number;
    content: Notification[];
    metadata: {
        total: number;
        count: number;
        offset: number;
        limit: number;
    };
}

interface NotificationParams {
    offset?: number;
    limit?: number;
    sort?: string;
    orgId?: string;
}

export const useInfiniteNotifications = (
    limit: number = 20,
    options?: { enabled?: boolean; orgId?: string }
) => {
    // Get orgId from localStorage if not provided

    return useInfiniteQuery<NotificationResponse>({
        queryKey: ["infiniteNotifications"],
        queryFn: ({ pageParam = 0 }) => {
            const queryParams = {
                offset: pageParam as number,
                limit,
                sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
            };
            return getNotifications(queryParams);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const currentTotal = allPages.reduce(
                (sum, page) => sum + page.content.length,
                0
            );

            const hasMoreData =
                lastPage.content.length === limit &&
                currentTotal < lastPage.metadata.total;

            return hasMoreData ? currentTotal : undefined;
        },
        enabled: options?.enabled !== false,
    });
};

export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            markNotificationAsRead(notificationId),
        onSuccess: () => {
            // Refetch notification list
            queryClient.invalidateQueries({
                queryKey: ["infiniteNotifications"],
            });
            // Also refresh unread count
            queryClient.invalidateQueries({
                queryKey: ["unreadNotificationCount"],
            });
        },
    });
};

export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => markAllNotificationsAsRead(),
        onSuccess: () => {
            // Refetch notification list
            queryClient.invalidateQueries({
                queryKey: ["infiniteNotifications"],
            });
            // Also refresh unread count
            queryClient.invalidateQueries({
                queryKey: ["unreadNotificationCount"],
            });
        },
    });
};

export const useUnreadNotificationCount = (orgId?: string) => {
    // Get orgId from localStorage if not provided
    const currentOrgId =
        orgId ||
        (typeof window !== "undefined"
            ? localStorage.getItem("currentOrg")
            : null);

    return useQuery({
        queryKey: ["unreadNotificationCount", currentOrgId],
        queryFn: () => getUnreadNotificationCount(currentOrgId!),
        enabled: !!currentOrgId,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

export type { Notification, NotificationResponse, NotificationMetadata };

"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useInfiniteNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  type Notification,
  type NotificationMetadata,
} from "@/hooks/useNotifications";
import { BellIcon, CheckIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import Avatar from "react-avatar";
import Loading from "../common/Loading";

interface NotificationPanelProps {
  className?: string;
  onClose: () => void;
  onOpenJoinOrg?: (defaultTab: "join" | "request" | "invited") => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onClose,
  onOpenJoinOrg,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
  onOpenJoinOrg?: (defaultTab: "join" | "request" | "invited") => void;
}) => {
  const currentOrgId = localStorage.getItem("currentOrgId");
  const router = useRouter();
  const formatTime = (timestamp: string) => {
    try {
      const now = Date.now();
      const date = new Date(timestamp);
      const diff = now - date.getTime();
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

  // Parse metadata if available
  let metadata: NotificationMetadata | null = null;
  try {
    if (notification.metadata) {
      metadata = JSON.parse(notification.metadata);
    }
  } catch {
    // Invalid JSON, ignore
  }
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClose();
    if (notification.category === "REMINDER_SCHEDULE") {
      const area = metadata?.area?.toLowerCase();

      if (area === "lead") {
        const contactId = metadata?.ContactId || metadata?.Id;
        if (contactId) {
          router.push(
            `/org/${
              notification.organizationId
            }/leads?source=chance&lid=${encodeURIComponent(contactId)}`
          );
        }
        return;
      } else if (area === "bpt") {
        const taskId = metadata?.taskId;
        const workspaceId = notification.workspaceId;
        if (taskId) {
          router.push(
            `/org/${notification.organizationId}/deals?wid=${workspaceId}&tid=${taskId}`
          );
        }
        return;
      }
      router.push(`/org/${notification.organizationId}/reminders`);
    } else if (notification.category === "NEW_CONVERSATION") {
      const cid = metadata?.Id;
      if (cid) {
        router.push(
          `/org/${
            notification.organizationId
          }/leads?source=messenger&cid=${encodeURIComponent(cid)}`
        );
      }
    } else if (notification.category === "NEW_LEAD") {
      const contactId = metadata?.ContactId || metadata?.Id;
      if (contactId) {
        router.push(
          `/org/${
            notification.organizationId
          }/leads?source=chance&lid=${encodeURIComponent(contactId)}`
        );
      }
    } else if (notification.category === "INVITE_MEMBER") {
      onOpenJoinOrg && onOpenJoinOrg("request");
    } else if (
      notification.category === "REQUEST_ORGANIZATION" &&
      metadata?.OrganizationId !== currentOrgId
    ) {
      onOpenJoinOrg && onOpenJoinOrg("invited");
    } else if (notification.category === "REQUEST_ORGANIZATION") {
      router.push(
        `/org/${notification.organizationId}/members?subTab=requests`
      );
    } else if (notification.category === "NEW_CONTACT") {
      const contactId = metadata?.ContactId || metadata?.Id;
      router.push(
        `/org/${notification.organizationId}/leads?source=chance&lid=${contactId}`
      );
    }
    // else if (notification.category === "EVICTION") {
    //     const taskId = metadata?.taskId;
    //     if (taskId) {
    //         router.push(
    //             `/org/${notification.organizationId}/deals?wid=${workspaceId}&tid=${taskId}`
    //         );
    //     }
    // }
  };

  return (
    <div
      className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
        notification.status === 1 ? "bg-blue-50" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <Avatar
            size="35"
            src={`/icons/logo_without_text.svg`}
            className="p-[1px] h-[35px] aspect-square object-contain"
          />
          {notification.isRead && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900">
                {notification.title}
              </h4>
              <div
                className="text-sm text-gray-600"
                dangerouslySetInnerHTML={{
                  __html: notification.contentHtml,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTime(notification.createdDate)}
            </span>
          </div>

          {/* Category badge */}
          {/* <div className="mt-2">
                        <Badge
                            variant={
                                notification.category === "NEW_CONVERSATION"
                                    ? "default"
                                    : "secondary"
                            }
                            className="text-xs"
                        >
                            {notification.category === "NEW_CONVERSATION"
                                ? "Tin nhắn mới"
                                : notification.category === "NEW_CONTACT"
                                ? "Khách hàng mới"
                                : notification.category === "RETURN_CONTACT"
                                ? "Khách quay lại"
                                : notification.category}
                        </Badge>
                    </div> */}
        </div>
      </div>
    </div>
  );
};

export default function NotificationPanel({
  className = "",
  onClose,
  onOpenJoinOrg,
}: NotificationPanelProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications(20);

  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllNotificationsAsRead();

  // Flatten all pages data
  const allNotifications = data?.pages.flatMap((page) => page.content) || [];
  const totalCount = data?.pages[0]?.metadata.total || 0;
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry.isIntersecting &&
            hasNextPage &&
            !isFetchingNextPage &&
            !isLoading
          ) {
            fetchNextPage();
          }
        },
        {
          root: null,
          rootMargin: "100px",
          threshold: 0.1,
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]
  );

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (error) {
    console.error(error);
    return (
      <div className={`bg-white border rounded-lg ${className}`}>
        <div className="p-4 text-center text-red-500">
          Có lỗi xảy ra khi tải thông báo
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Thông báo</h3>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            className="text-primary hover:text-blue-700"
          >
            {isMarkingAllAsRead ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CheckIcon className="w-4 h-4 mr-1" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <ScrollArea className="h-96 overflow-y-auto">
        {isLoading && allNotifications.length === 0 ? (
          <Loading />
        ) : allNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <>
            {allNotifications.map((notification, index) => (
              <div
                key={notification.id}
                ref={
                  index === allNotifications.length - 1 && hasNextPage
                    ? lastElementRef
                    : null
                }
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={onClose}
                  onOpenJoinOrg={onOpenJoinOrg}
                />
              </div>
            ))}

            {/* Loading indicator for infinite scroll */}
            {isFetchingNextPage && <Loading />}
          </>
        )}
      </ScrollArea>
    </div>
  );
}

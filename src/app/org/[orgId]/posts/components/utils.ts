import { PostData } from "./types";

export const getStatusInfo = (status: number) => {
    switch (status) {
        case 1: // Nháp
            return {
                label: "Nháp",
                class: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600",
            };
        case 2: // Chờ duyệt
            return {
                label: "Chờ duyệt",
                class: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800",
            };
        case 3: // Chờ lên lịch
            return {
                label: "Chờ lên lịch",
                class: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800",
            };
        case 5: // Đã lên lịch
            return {
                label: "Đã lên lịch",
                class: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800",
            };
        case 6: // Đã đăng
            return {
                label: "Đã đăng",
                class: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800",
            };
        case 7: // Thất bại
            return {
                label: "Thất bại",
                class: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800",
            };
        case 8: // Đã hủy
            return {
                label: "Đã hủy",
                class: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
            };
        case 9: // Đã lưu trữ
            return {
                label: "Đã lưu trữ",
                class: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800",
            };
        default:
            return {
                label: "Nháp",
                class: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600",
            };
    }
};

export const getChannelInfo = (channelId?: string, channelAvatar?: string) => {
    return {
        icon: "facebook",
        color: "text-blue-600",
    };
};

export const formatDate = (dateString?: string | null) => {
    if (!dateString) return { date: "--/--/----", time: "--:--" };
    try {
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        const timeStr = date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
        return { date: dateStr, time: timeStr };
    } catch {
        return { date: "--/--/----", time: "--:--" };
    }
};

export const transformPostData = (post: any): PostData => {
    const statusInfo = getStatusInfo(post.status || 1);
    const channelInfo = getChannelInfo(post.channelId, post.channelAvatar);
    const dateTime = formatDate(post.scheduledTime || post.publishedTime);
    let thumbnail = "";
    try {
        const mediaData = JSON.parse(post.externalMediaData || "[]");
        if (Array.isArray(mediaData) && mediaData.length > 0) {
            thumbnail = mediaData[0]?.url || "";
        }
    } catch {
        thumbnail = "";
    }

    return {
        id: post.id,
        title: post.title || "",
        description: post.content || "",
        thumbnail: thumbnail || post.channelAvatar || "",
        channelIcon: channelInfo.icon,
        channelColor: channelInfo.color,
        channelName: post.channelName || "",
        channelAvatar: post.channelAvatar || "",
        statusLabel: statusInfo.label,
        statusClass: statusInfo.class,
        date: dateTime.date,
        time: dateTime.time,
        rawData: post,
    };
};

export const parseMedia = (
    post: any
): { url: string; type: "image" | "video" }[] => {
    if (!post?.externalMediaData) return [];
    try {
        const mediaData = JSON.parse(post.externalMediaData || "[]");
        if (Array.isArray(mediaData)) {
            return mediaData.map((m: any) => ({
                url: m.url || "",
                type: m.type || "image",
            }));
        }
    } catch {
        return [];
    }
    return [];
};

export type ViewMode = "list" | "grid" | "calendar";

export interface PostData {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelIcon: string;
    channelColor: string;
    channelName?: string;
    channelAvatar?: string;
    statusLabel: string;
    statusClass: string;
    date: string;
    time: string;
    // Lưu raw data để dùng cho detail
    rawData?: any;
}

export const POST_STATUSES = [
    {
        value: 1,
        label: "Nháp",
        description: "Bài viết dạng nháp, chưa hoàn thành",
    },
    { value: 2, label: "Chờ duyệt", description: "Đang chờ được duyệt" },
    {
        value: 3,
        label: "Chờ lên lịch",
        description: "Đã hoàn thành, chờ được lên lịch",
    },
    { value: 4, label: "Đã lên lịch", description: "Đã lên lịch đăng bài" },
    { value: 6, label: "Đã đăng", description: "Đã đăng bài thành công" },
    { value: 8, label: "Đã hủy", description: "Bài viết đã bị hủy" },
];

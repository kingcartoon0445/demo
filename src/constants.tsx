import {
    Phone,
    Users,
    Bell,
    Coffee,
    FileText,
    Video,
    Compass,
} from "lucide-react";

// Các loại lịch hẹn
export const scheduleTypes = [
    { id: "call", name: "Gọi điện", icon: <Phone className="h-5 w-5" /> },
    { id: "meeting", name: "Gặp gỡ", icon: <Users className="h-5 w-5" /> },
    { id: "reminder", name: "Nhắc nhở", icon: <Bell className="h-5 w-5" /> },
    { id: "meal", name: "Ăn uống", icon: <Coffee className="h-5 w-5" /> },
    {
        id: "document",
        name: "Tài liệu",
        icon: <FileText className="h-5 w-5" />,
    },
    { id: "video", name: "Video", icon: <Video className="h-5 w-5" /> },
    { id: "event", name: "Sự kiện", icon: <Compass className="h-5 w-5" /> },
];

// Các mức độ ưu tiên
export const priorityLevels = [
    { id: 2, name: "Cao", color: "bg-red-500" },
    { id: 1, name: "Trung bình", color: "bg-amber-500" },
    { id: 0, name: "Thấp", color: "bg-gray-400" },
];

export const repeatOptions = [
    { value: "T2", label: "Thứ hai" },
    { value: "T3", label: "Thứ ba" },
    { value: "T4", label: "Thứ tư" },
    { value: "T5", label: "Thứ năm" },
    { value: "T6", label: "Thứ sáu" },
    { value: "T7", label: "Thứ bảy" },
    { value: "CN", label: "Chủ nhật" },
];

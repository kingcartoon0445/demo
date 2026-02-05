import {
    Circle,
    CheckCircle,
    Clock,
    AlertCircle,
    CheckCircle2,
    Edit,
    Trash2,
    Phone,
    Users,
    Bell,
    Coffee,
    FileText,
    Video,
    Compass,
} from "lucide-react";
import { formatDistance, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord, cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import toast from "react-hot-toast";
import { tableViewUtils } from "./tableViewUtils";
import { useRouter } from "next/navigation";

// Các loại lịch hẹn
const scheduleTypes = [
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

// Component hiển thị một nhắc hẹn riêng lẻ
export default function ReminderItem({
    reminder,
    onEdit,
    onDelete,
    onToggleDone,
    getWorkspaceName,
}) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDone, setIsDone] = useState(reminder.IsDone || false);
    const [isOverdue, setIsOverdue] = useState(
        !isDone && reminder.EndTime
            ? tableViewUtils.isOverdue(reminder.EndTime)
            : false
    );
    const [timeRemaining, setTimeRemaining] = useState(
        tableViewUtils.getTimeRemaining(reminder.StartTime)
    );
    const [overdueTime, setOverdueTime] = useState("");

    const contact = tableViewUtils.parseContact(reminder.Contact);

    // Tìm icon tương ứng với loại lịch hẹn
    const scheduleType =
        scheduleTypes.find((t) => t.id === reminder.SchedulesType) ||
        scheduleTypes.find((t) => t.id === "reminder");

    // Cập nhật trạng thái sau mỗi phút
    useEffect(() => {
        const updateStatus = () => {
            if (!isDone) {
                // Cập nhật thời gian còn lại
                setTimeRemaining(
                    tableViewUtils.getTimeRemaining(reminder.StartTime)
                );

                // Kiểm tra lại trạng thái quá hạn
                if (reminder.EndTime) {
                    const isLate = tableViewUtils.isOverdue(reminder.EndTime);
                    setIsOverdue(isLate);

                    // Nếu quá hạn, tính thời gian quá hạn
                    if (isLate) {
                        setOverdueTime(
                            tableViewUtils.getOverdueTime(reminder.EndTime)
                        );
                    }
                }
            }
        };

        // Cập nhật ngay lần đầu
        updateStatus();

        // Thiết lập interval để cập nhật mỗi phút
        const intervalId = setInterval(updateStatus, 60000); // 60000ms = 1 phút

        // Dọn dẹp khi component unmount
        return () => clearInterval(intervalId);
    }, [reminder.StartTime, reminder.EndTime, isDone]);

    const statusText = isDone
        ? "Đã hoàn thành"
        : isOverdue
        ? `Đã quá hạn ${overdueTime}`
        : timeRemaining;

    const getStatusIcon = () => {
        if (isDone) {
            return <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />;
        } else if (isOverdue) {
            return <AlertCircle className="h-4 w-4 mr-1.5 text-red-400" />;
        } else {
            return <Clock className="h-4 w-4 mr-1.5 text-blue-500" />;
        }
    };

    const handleToggleDone = async (e) => {
        e.stopPropagation();
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            await onToggleDone(reminder, !isDone);
            setIsDone(!isDone);
            if (!isDone) {
                setIsOverdue(false);
            } else if (reminder.EndTime) {
                setIsOverdue(tableViewUtils.isOverdue(reminder.EndTime));
            }

            // Sử dụng toast khác nhau cho đánh dấu hoàn thành vs hủy đánh dấu
            if (isDone) {
                // Hủy đánh dấu hoàn thành - dùng toast error
                toast.error("Chưa hoàn thành");
            } else {
                // Đánh dấu hoàn thành - dùng toast success
                toast.success("Đã hoàn thành");
            }
        } catch (error) {
            console.error("Lỗi khi đánh dấu hoàn thành:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Hàm navigate đến trang khách hàng
    const handleCustomerClick = (e) => {
        e.stopPropagation();
        if (contact && reminder.WorkspaceId) {
            // Lấy orgId từ pathname hiện tại
            const pathParts = window.location.pathname.split("/");
            const orgId = pathParts[2]; // /org/[orgId]/...

            const customerUrl = `/org/${orgId}/workspace/${reminder.WorkspaceId}?cid=${contact.id}`;
            router.push(customerUrl);
        }
    };

    return (
        <tr
            key={reminder.Id}
            className={cn(
                "hover:bg-gray-50 transition-colors duration-200",
                isDone
                    ? "opacity-80 bg-green-50/30"
                    : isOverdue
                    ? "bg-red-50/20"
                    : ""
            )}
        >
            <td className="py-4 px-4 w-[200px] min-w-[180px]">
                <div className={cn("w-full", isDone && "text-gray-500")}>
                    <div
                        className={cn(
                            "font-medium text-gray-800 flex items-center gap-2 w-full",
                            isDone && "line-through text-gray-500",
                            isOverdue && !isDone && "text-red-600"
                        )}
                    >
                        <button
                            className={cn(
                                "flex-shrink-0 p-1 rounded-full transition-colors",
                                isDone
                                    ? "text-green-600 hover:bg-green-100"
                                    : isOverdue
                                    ? "text-red-400 hover:bg-red-50"
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                            onClick={handleToggleDone}
                            disabled={isUpdating}
                            aria-label="Đánh dấu hoàn thành"
                        >
                            {isDone ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <Circle className="h-5 w-5" />
                            )}
                        </button>
                        <div
                            className={cn(
                                "flex-shrink-0",
                                isDone ? "text-green-600/70" : "text-red-500"
                            )}
                        >
                            {scheduleType.icon}
                        </div>
                        <span className="truncate text-sm">
                            {reminder.Title || "Nhắc hẹn"}
                        </span>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4 w-[180px] min-w-[160px]">
                <div
                    className="flex items-center gap-3 w-full cursor-pointer hover:bg-gray-50 rounded-md p-1 -m-1 transition-colors"
                    onClick={handleCustomerClick}
                    title="Click để xem chi tiết khách hàng"
                >
                    <Avatar
                        name={
                            contact
                                ? getFirstAndLastWord(contact.fullName)
                                : "HT"
                        }
                        size="32"
                        round
                        src={contact ? getAvatarUrl(contact.Avatar) : undefined}
                        color="#4F46E5"
                        fgColor="#FFFFFF"
                        className="border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div
                            className={cn(
                                "font-medium text-sm truncate hover:text-indigo-600 transition-colors",
                                isDone && "line-through text-gray-500",
                                !isDone && isOverdue && "text-red-500"
                            )}
                            title={contact ? contact.fullName : "Hệ thống"}
                        >
                            {contact ? contact.fullName : "Hệ thống"}
                        </div>
                        {contact?.phone && (
                            <div
                                className="text-xs text-gray-500 truncate"
                                title={contact.phone}
                            >
                                {contact.phone}
                            </div>
                        )}
                        {contact?.phoneNumber && (
                            <div
                                className="text-xs text-gray-600 font-medium truncate"
                                title={contact.phoneNumber}
                            >
                                {contact.phoneNumber}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="py-4 px-4 w-[140px] min-w-[120px]">
                <div
                    className={cn(
                        "text-sm font-medium truncate",
                        isDone && "line-through text-gray-500",
                        !isDone && isOverdue && "text-red-500"
                    )}
                    title={
                        getWorkspaceName
                            ? getWorkspaceName(reminder.WorkspaceId)
                            : "N/A"
                    }
                >
                    {getWorkspaceName
                        ? getWorkspaceName(reminder.WorkspaceId)
                        : "N/A"}
                </div>
            </td>
            <td className="py-4 px-4 w-[180px] min-w-[160px]">
                {reminder.Content && (
                    <div
                        className={cn(
                            "text-sm text-gray-600 line-clamp-2 overflow-hidden",
                            isDone && "line-through text-gray-500",
                            isOverdue && !isDone && "text-red-500/70"
                        )}
                        title={reminder.Content}
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {reminder.Content}
                    </div>
                )}
            </td>
            <td className="py-4 px-4 w-[180px] min-w-[160px]">
                <div className="text-sm">
                    <div
                        className={cn(
                            "text-gray-900 font-medium text-xs",
                            isOverdue && !isDone && "text-red-600"
                        )}
                    >
                        {tableViewUtils.formatDateTimeRange(
                            reminder.StartTime,
                            reminder.EndTime
                        )}
                    </div>
                    {!tableViewUtils.isSameDay(
                        reminder.StartTime,
                        reminder.EndTime
                    ) &&
                        reminder.EndTime && (
                            <div
                                className={cn(
                                    "text-xs text-gray-500 mt-1 italic truncate",
                                    isOverdue && !isDone && "text-red-400"
                                )}
                            >
                                Kéo dài{" "}
                                {formatDistance(
                                    parseISO(reminder.StartTime),
                                    parseISO(reminder.EndTime),
                                    { locale: vi }
                                )}
                            </div>
                        )}
                </div>
            </td>
            <td className="py-4 px-4 w-[120px] min-w-[100px]">
                <div className="flex items-center w-full">
                    <div className="flex-shrink-0 mr-1.5">
                        {getStatusIcon()}
                    </div>
                    <span
                        className={cn(
                            "text-xs font-medium truncate",
                            isDone
                                ? "text-green-600"
                                : isOverdue
                                ? "text-red-500 font-medium"
                                : "text-blue-600"
                        )}
                        title={statusText}
                    >
                        {statusText}
                    </span>
                </div>
            </td>
            <td className="py-4 px-4 w-[100px] min-w-[90px]">
                <TooltipProvider>
                    <Tooltip
                        content={
                            <p>
                                Mức độ ưu tiên:{" "}
                                {tableViewUtils.getPriorityText(
                                    reminder.Priority
                                )}
                            </p>
                        }
                    >
                        <div className="flex items-center w-full">
                            <div
                                className={cn(
                                    "w-3 h-3 rounded-full mr-2 flex-shrink-0",
                                    tableViewUtils.getPriorityColor(
                                        reminder.Priority
                                    )
                                )}
                            ></div>
                            <span
                                className={cn(
                                    "text-xs truncate",
                                    reminder.Priority === 2
                                        ? "text-red-700 font-medium"
                                        : reminder.Priority === 1
                                        ? "text-amber-700"
                                        : "text-gray-700"
                                )}
                            >
                                {tableViewUtils.getPriorityText(
                                    reminder.Priority
                                )}
                            </span>
                        </div>
                    </Tooltip>
                </TooltipProvider>
            </td>
            <td className="py-4 px-4 text-center w-[100px] min-w-[90px]">
                <div className="flex justify-center space-x-1">
                    <TooltipProvider>
                        <Tooltip
                            className="bg-white"
                            content={<p>Chỉnh sửa</p>}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(reminder);
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-gray-100 flex-shrink-0"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip className="bg-white" content={<p>Xóa</p>}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(reminder);
                                }}
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-gray-100 flex-shrink-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </td>
        </tr>
    );
}

import { formatUtils } from "@/lib/formatUtil";
import { useState, useEffect } from "react";
import { scheduleTypes } from "@/constants";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Circle, CheckCircle, MoreVertical, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// Component hiển thị một nhắc hẹn
export const ReminderItemMd = ({
    reminder,
    onEdit,
    onDelete,
    onToggleDone,
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDone, setIsDone] = useState(reminder.IsDone || false);
    const [isOverdue, setIsOverdue] = useState(false);
    const [overdueTime, setOverdueTime] = useState("");
    const contact = formatUtils.parseContact(reminder.Contact);

    // Tìm icon tương ứng với loại lịch hẹn
    const scheduleType =
        scheduleTypes.find((t) => t.id === reminder.SchedulesType) ||
        scheduleTypes.find((t) => t.id === "reminder");

    // Tính thời gian còn lại đến khi bắt đầu sự kiện
    const timeRemaining = formatUtils.getTimeRemaining(reminder.StartTime);

    // Cập nhật trạng thái sau mỗi phút
    useEffect(() => {
        const updateStatus = () => {
            if (!isDone && reminder.EndTime) {
                const isLate = formatUtils.isOverdue(reminder.EndTime);
                setIsOverdue(isLate);

                // Nếu quá hạn, tính thời gian quá hạn
                if (isLate) {
                    setOverdueTime(
                        formatUtils.getOverdueTime(reminder.EndTime)
                    );
                }
            }
        };

        // Cập nhật ngay lần đầu
        updateStatus();

        // Thiết lập interval để cập nhật mỗi phút
        const intervalId = setInterval(updateStatus, 60000); // 60000ms = 1 phút

        // Dọn dẹp khi component unmount
        return () => clearInterval(intervalId);
    }, [reminder.EndTime, isDone]);

    // Hàm xử lý khi click vào nút đánh dấu hoàn thành
    const handleToggleDone = async (e) => {
        e.stopPropagation();
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            const success = await onToggleDone(reminder.Id, !isDone);
            if (success) {
                setIsDone(!isDone);
                if (!isDone) {
                    setIsOverdue(false); // Khi đánh dấu hoàn thành, không còn quá hạn nữa
                } else if (reminder.EndTime) {
                    // Khi đánh dấu chưa hoàn thành, kiểm tra lại trạng thái quá hạn
                    setIsOverdue(formatUtils.isOverdue(reminder.EndTime));
                }
                toast.success(isDone ? "Chưa hoàn thành" : "Đã hoàn thành");
            }
        } catch (error) {
            console.error("Lỗi khi đánh dấu hoàn thành:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Xác định trạng thái để hiển thị
    const statusText = isDone
        ? "Đã hoàn thành"
        : isOverdue
        ? `Đã quá hạn ${overdueTime}`
        : timeRemaining;

    // Xác định màu sắc cho chấm ưu tiên
    const getPriorityColor = () => {
        const priority = reminder.Priority || 0;

        switch (priority) {
            case 2: // Cao
                return "bg-red-500";
            case 1: // Trung bình
                return "bg-amber-500";
            case 0: // Thấp
            default:
                return "bg-gray-400";
        }
    };

    const priorityLabel = () => {
        const priority = reminder.Priority || 0;
        switch (priority) {
            case 2:
                return "Ưu tiên cao";
            case 1:
                return "Ưu tiên trung bình";
            case 0:
                return "Ưu tiên thấp";
            default:
                return "Ưu tiên thấp";
        }
    };

    return (
        <div
            className={cn(
                "flex gap-2 items-center px-3 py-2 hover:bg-gray-50 border rounded-md bg-card",
                isDone
                    ? "opacity-75 border-gray-200"
                    : isOverdue
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
            )}
        >
            <button
                className="flex-shrink-0 p-1 rounded-full text-gray-500"
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

            <div className="flex-shrink-0 h-8 w-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                {scheduleType.icon}
            </div>

            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center">
                    <span
                        className={cn(
                            "font-semibold truncate block",
                            isDone && "line-through text-gray-500",
                            !isDone && isOverdue && "text-red-600"
                        )}
                    >
                        {reminder.Title || "Nhắc hẹn"}
                    </span>

                    {!isDone && (
                        <TooltipProvider>
                            <Tooltip content={<p>{priorityLabel()}</p>}>
                                <div className="ml-1.5 flex items-center">
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full",
                                            getPriorityColor()
                                        )}
                                    ></div>
                                </div>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                <div className="flex items-center">
                    <TooltipProvider>
                        <Tooltip
                            content={
                                <div>
                                    <p>
                                        Bắt đầu:{" "}
                                        {formatUtils.formatDateTime(
                                            reminder.StartTime
                                        )}
                                    </p>
                                    <p>
                                        Kết thúc:{" "}
                                        {formatUtils.formatDateTime(
                                            reminder.EndTime
                                        )}
                                    </p>
                                    {isOverdue && !isDone && (
                                        <p className="text-red-500 font-medium">
                                            Đã quá hạn!
                                        </p>
                                    )}
                                </div>
                            }
                        >
                            <span
                                className={cn(
                                    "text-xs mr-2",
                                    isDone
                                        ? "text-gray-500"
                                        : isOverdue
                                        ? "text-red-500 font-medium"
                                        : "text-gray-500"
                                )}
                            >
                                {statusText}
                            </span>
                        </Tooltip>
                    </TooltipProvider>

                    {reminder.RepeatRule && reminder.RepeatRule.length > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                            {formatUtils.isEveryDayOfWeek(reminder.RepeatRule)
                                ? "Mỗi ngày"
                                : reminder.RepeatRule.map((r) => r.day).join(
                                      ", "
                                  )}
                        </span>
                    )}

                    <span
                        className={cn(
                            "text-xs truncate flex-1",
                            isDone
                                ? "text-gray-400 line-through"
                                : isOverdue
                                ? "text-red-500"
                                : "text-gray-500"
                        )}
                    >
                        {reminder.Content ? ` • ${reminder.Content}` : ""}
                    </span>
                </div>
            </div>

            <div className="flex-shrink-0">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="end">
                        <div className="flex flex-col">
                            <button
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md text-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(reminder);
                                }}
                            >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                            </button>
                            <button
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md text-left text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(reminder);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

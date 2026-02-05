import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { scheduleTypes } from "@/constants";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { addMonths, format, isSameMonth, isToday, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "react-avatar";
import ScheduleTypeFilter from "./ScheduleTypeFilter";
import { tableViewUtils } from "./tableViewUtils";

export default function CalendarView({
    currentMonth,
    setCurrentMonth,
    reminderList,
    getDaysInMonth,
    getRemindersForDay,
    weekdayNames,
    onEdit,
    onDelete,
    parseContact,
    isEveryDayOfWeek,
}) {
    const router = useRouter();

    // State cho việc lọc theo loại lịch hẹn - mặc định chọn tất cả
    const [selectedScheduleTypes, setSelectedScheduleTypes] = useState(
        scheduleTypes.map((type) => type.id)
    );

    const days = getDaysInMonth();

    // Hàm lấy icon tương ứng với loại lịch hẹn
    const getScheduleTypeIcon = (type) => {
        const scheduleType =
            scheduleTypes.find((t) => t.id === type) ||
            scheduleTypes.find((t) => t.id === "reminder");
        return scheduleType.icon;
    };

    // Hàm lấy màu sắc dựa trên trạng thái nhắc nhở
    const getReminderStatusColor = (reminder) => {
        const isDone = reminder.IsDone || false;
        const isOverdue =
            !isDone && reminder.EndTime
                ? tableViewUtils.isOverdue(reminder.EndTime)
                : false;

        if (isDone) return "border-green-500 bg-green-50";
        if (isOverdue) return "border-red-500 bg-red-50";
        return "border-primary bg-indigo-50";
    };

    // Hàm lọc reminder theo loại được chọn
    const getFilteredRemindersForDay = (day) => {
        const dayReminders = getRemindersForDay(day);
        return dayReminders.filter((reminder) => {
            // Filter theo loại lịch hẹn
            const typeMatch = selectedScheduleTypes.includes(
                reminder.SchedulesType || "reminder"
            );

            return typeMatch;
        });
    };

    // Hàm xử lý thay đổi filter từ component con
    const handleFilterChange = (newSelectedTypes) => {
        setSelectedScheduleTypes(newSelectedTypes);
    };

    // Hàm navigate đến trang khách hàng
    const handleCustomerClick = (reminder) => {
        const contact = parseContact(reminder.Contact);
        if (contact && reminder.WorkspaceId) {
            // Lấy orgId từ pathname hiện tại
            const pathParts = window.location.pathname.split("/");
            const orgId = pathParts[2]; // /org/[orgId]/...

            const customerUrl = `/org/${orgId}/workspace/${reminder.WorkspaceId}?cid=${contact.id}`;
            router.push(customerUrl);
        }
    };

    return (
        <div className="bg-white rounded-lg flex flex-col h-full w-full">
            {/* Filter & Calendar Navigation */}
            <div className="flex-shrink-0 pb-4 border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-shrink-0">
                        <ScheduleTypeFilter
                            onFilterChange={handleFilterChange}
                        />
                    </div>

                    {/* Calendar Navigation */}
                    <div className="flex items-center gap-3">
                        <div className="font-medium text-sm md:text-base min-w-0 flex-shrink-0">
                            {format(currentMonth, "MMMM yyyy", {
                                locale: vi,
                            }).replace(/^\w/, (c) => c.toUpperCase())}
                        </div>

                        <div className="flex items-center flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentMonth(subMonths(currentMonth, 1))
                                }
                                className="p-0 md:p-1 h-7 md:h-8 w-7 md:w-8 rounded-lg flex-shrink-0"
                            >
                                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setCurrentMonth(new Date())}
                                size="sm"
                                className="h-7 md:h-8 mx-1 md:mx-2 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
                            >
                                Hôm nay
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentMonth(addMonths(currentMonth, 1))
                                }
                                className="p-0 md:p-1 h-7 md:h-8 w-7 md:w-8 rounded-lg flex-shrink-0"
                            >
                                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Container với scroll */}
            <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                {/* Weekday Headers - Fixed Position */}
                <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {weekdayNames.map((day, index) => (
                        <div
                            key={index}
                            className="text-center font-medium text-xs md:text-sm text-gray-600 py-2 px-1 border-r last:border-r-0 border-gray-200"
                        >
                            <span className="truncate">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 auto-rows-fr min-h-full">
                        {days.map((day, index) => {
                            const dayReminders =
                                getFilteredRemindersForDay(day);
                            const isCurrentMonth = isSameMonth(
                                day,
                                currentMonth
                            );
                            const isDayToday = isToday(day);
                            const isLastColumn = index % 7 === 6; // Cột cuối cùng (Chủ nhật)
                            const isSecondLastColumn = index % 7 === 5; // Cột áp cuối (Thứ 7)
                            const isFirstOfMonth =
                                isCurrentMonth && format(day, "d") === "1";

                            // Xác định xem ô hiện tại có ở hàng cuối cùng không
                            const totalDays = days.length;
                            const totalRows = Math.ceil(totalDays / 7);
                            const currentRow = Math.floor(index / 7) + 1;
                            const isLastRow = currentRow === totalRows;

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "relative border-b border-r border-gray-200 flex flex-col",
                                        !isCurrentMonth &&
                                            "bg-gray-50 text-gray-400"
                                    )}
                                    style={{
                                        // Đảm bảo chiều cao tối thiểu cho mỗi ô ngày
                                        minHeight: "130px",
                                    }}
                                >
                                    {/* Day Header */}
                                    <div className="flex justify-between items-start p-1 md:p-2 flex-shrink-0">
                                        <div className="min-w-0 flex-1">
                                            {isFirstOfMonth && (
                                                <span className="text-[10px] md:text-xs text-gray-500 truncate block">
                                                    Tháng {format(day, "M")}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center justify-center h-5 w-5 md:h-6 md:w-6 text-xs md:text-sm rounded-full",
                                                    isDayToday &&
                                                        "bg-red-500 text-white font-medium"
                                                )}
                                            >
                                                {format(day, "d")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reminders Container */}
                                    <div className="flex-1 px-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-2">
                                        <div className="space-y-1 pb-1">
                                            {dayReminders.map(
                                                (reminder, idx) => {
                                                    const contact =
                                                        parseContact(
                                                            reminder.Contact
                                                        );
                                                    const isDone =
                                                        reminder.IsDone ||
                                                        false;
                                                    const isOverdue =
                                                        !isDone &&
                                                        reminder.EndTime
                                                            ? tableViewUtils.isOverdue(
                                                                  reminder.EndTime
                                                              )
                                                            : false;
                                                    const scheduleTypeIcon =
                                                        getScheduleTypeIcon(
                                                            reminder.SchedulesType
                                                        );

                                                    return (
                                                        <TooltipProvider
                                                            key={idx}
                                                        >
                                                            <Tooltip
                                                                className="bg-white"
                                                                side={
                                                                    isLastRow
                                                                        ? "top"
                                                                        : isLastColumn ||
                                                                          isSecondLastColumn
                                                                        ? "left"
                                                                        : "right"
                                                                }
                                                                content={
                                                                    <div className="p-0 overflow-hidden w-[280px] md:w-[320px] bg-white border shadow-lg rounded-md">
                                                                        <div
                                                                            className={cn(
                                                                                "relative border-l-4 p-3 md:p-4 bg-white",
                                                                                isDone
                                                                                    ? "border-green-500"
                                                                                    : isOverdue
                                                                                    ? "border-red-500"
                                                                                    : "border-indigo-500"
                                                                            )}
                                                                        >
                                                                            {/* Header chính - Icon Type + Title */}
                                                                            <div className="flex items-center justify-between mb-4">
                                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "flex-shrink-0 p-2 rounded-lg",
                                                                                            isDone
                                                                                                ? "bg-green-100 text-green-600"
                                                                                                : isOverdue
                                                                                                ? "bg-red-100 text-red-600"
                                                                                                : "bg-indigo-100 text-indigo-600"
                                                                                        )}
                                                                                    >
                                                                                        {
                                                                                            scheduleTypeIcon
                                                                                        }
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <h3
                                                                                            className={cn(
                                                                                                "font-bold text-lg text-gray-900 leading-tight",
                                                                                                isDone &&
                                                                                                    "line-through text-gray-500"
                                                                                            )}
                                                                                        >
                                                                                            {reminder.Title ||
                                                                                                "Nhắc hẹn"}
                                                                                        </h3>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex space-x-1 flex-shrink-0">
                                                                                    <button
                                                                                        className="text-gray-400 hover:text-indigo-600 p-1 rounded transition-colors"
                                                                                        onClick={() =>
                                                                                            onEdit(
                                                                                                reminder
                                                                                            )
                                                                                        }
                                                                                        title="Chỉnh sửa"
                                                                                    >
                                                                                        <Edit className="h-4 w-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                                                                        onClick={() =>
                                                                                            onDelete(
                                                                                                reminder
                                                                                            )
                                                                                        }
                                                                                        title="Xóa"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {/* Thời gian */}
                                                                            <div className="mb-3">
                                                                                <div className="text-sm font-medium text-gray-700 mb-1">
                                                                                    ⏰
                                                                                    Thời
                                                                                    gian
                                                                                </div>
                                                                                <div className="text-sm text-gray-600">
                                                                                    {tableViewUtils.formatDateTimeRange(
                                                                                        reminder.StartTime,
                                                                                        reminder.EndTime
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Nội dung */}
                                                                            {reminder.Content && (
                                                                                <div className="mb-3">
                                                                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                                                                        📝
                                                                                        Nội
                                                                                        dung
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-600 leading-relaxed">
                                                                                        {
                                                                                            reminder.Content
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Khách hàng */}
                                                                            <div className="mb-3">
                                                                                <div className="text-sm font-medium text-gray-700 mb-2">
                                                                                    👤
                                                                                    Khách
                                                                                    hàng
                                                                                </div>
                                                                                <div
                                                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md p-1 -m-1 transition-colors"
                                                                                    onClick={() =>
                                                                                        handleCustomerClick(
                                                                                            reminder
                                                                                        )
                                                                                    }
                                                                                    title="Click để xem chi tiết khách hàng"
                                                                                >
                                                                                    <Avatar
                                                                                        name={
                                                                                            contact
                                                                                                ? getFirstAndLastWord(
                                                                                                      contact.fullName
                                                                                                  )
                                                                                                : "HT"
                                                                                        }
                                                                                        size="20"
                                                                                        round
                                                                                        src={
                                                                                            contact
                                                                                                ? getAvatarUrl(
                                                                                                      contact.Avatar
                                                                                                  )
                                                                                                : undefined
                                                                                        }
                                                                                        color="#4F46E5"
                                                                                        fgColor="#FFFFFF"
                                                                                        className="flex-shrink-0"
                                                                                    />
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="text-gray-900 text-sm truncate hover:text-indigo-600 transition-colors">
                                                                                            {contact
                                                                                                ? contact.fullName
                                                                                                : "Hệ thống"}
                                                                                        </div>
                                                                                        {contact?.phone && (
                                                                                            <div className="text-xs text-gray-500 truncate">
                                                                                                {
                                                                                                    contact.phone
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Trạng thái và Ưu tiên */}
                                                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                                                {/* Trạng thái */}
                                                                                <div className="flex items-center">
                                                                                    {isDone ? (
                                                                                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                                                                    ) : isOverdue ? (
                                                                                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                                                                    ) : (
                                                                                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                                                                    )}
                                                                                    <span
                                                                                        className={cn(
                                                                                            "text-sm font-medium",
                                                                                            isDone
                                                                                                ? "text-green-600"
                                                                                                : isOverdue
                                                                                                ? "text-red-600"
                                                                                                : "text-blue-600"
                                                                                        )}
                                                                                    >
                                                                                        {isDone
                                                                                            ? "Đã hoàn thành"
                                                                                            : isOverdue
                                                                                            ? `Quá hạn ${tableViewUtils.getOverdueTime(
                                                                                                  reminder.EndTime
                                                                                              )}`
                                                                                            : tableViewUtils.getTimeRemaining(
                                                                                                  reminder.StartTime
                                                                                              )}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Ưu tiên */}
                                                                                <div className="flex items-center">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "w-3 h-3 rounded-full mr-2",
                                                                                            tableViewUtils.getPriorityColor(
                                                                                                reminder.Priority
                                                                                            )
                                                                                        )}
                                                                                    ></div>
                                                                                    <span
                                                                                        className={cn(
                                                                                            "text-sm",
                                                                                            reminder.Priority ===
                                                                                                2
                                                                                                ? "text-red-600 font-medium"
                                                                                                : reminder.Priority ===
                                                                                                  1
                                                                                                ? "text-amber-600 font-medium"
                                                                                                : "text-gray-600"
                                                                                        )}
                                                                                    >
                                                                                        {tableViewUtils.getPriorityText(
                                                                                            reminder.Priority
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Lặp lại */}
                                                                            {reminder.RepeatRule &&
                                                                                reminder
                                                                                    .RepeatRule
                                                                                    .length >
                                                                                    0 && (
                                                                                    <div className="mt-3 pt-2 border-t border-gray-100">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="text-sm font-medium text-gray-700">
                                                                                                🔄
                                                                                                Lặp
                                                                                                lại:
                                                                                            </div>
                                                                                            <div className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                                                                                {isEveryDayOfWeek(
                                                                                                    reminder.RepeatRule
                                                                                                )
                                                                                                    ? "Mỗi ngày"
                                                                                                    : reminder.RepeatRule.map(
                                                                                                          (
                                                                                                              r
                                                                                                          ) =>
                                                                                                              r.day
                                                                                                      ).join(
                                                                                                          ", "
                                                                                                      )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                }
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "group relative border-l-[3px] hover:bg-opacity-80 rounded-l-[3px] pl-1 md:pl-1.5 py-[2px] flex items-center justify-between cursor-pointer min-w-0",
                                                                        getReminderStatusColor(
                                                                            reminder
                                                                        )
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-1 truncate min-w-0 flex-1">
                                                                        <div
                                                                            className={cn(
                                                                                "flex-shrink-0",
                                                                                isDone
                                                                                    ? "text-green-600/70"
                                                                                    : isOverdue
                                                                                    ? "text-red-600/70"
                                                                                    : "text-indigo-500"
                                                                            )}
                                                                        >
                                                                            {
                                                                                scheduleTypeIcon
                                                                            }
                                                                        </div>
                                                                        <div className="truncate min-w-0 flex-1">
                                                                            <span
                                                                                className={cn(
                                                                                    "text-[10px] md:text-xs font-medium truncate block",
                                                                                    isDone
                                                                                        ? "text-gray-600"
                                                                                        : isOverdue
                                                                                        ? "text-red-700"
                                                                                        : "text-gray-800"
                                                                                )}
                                                                                title={
                                                                                    reminder.Title ||
                                                                                    "Nhắc hẹn"
                                                                                }
                                                                            >
                                                                                {reminder.Title ||
                                                                                    "Nhắc hẹn"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-shrink-0 ml-1">
                                                                        {isDone ? (
                                                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                                        ) : isOverdue ? (
                                                                            <AlertCircle className="h-3 w-3 text-red-500" />
                                                                        ) : (
                                                                            <Clock className="h-3 w-3 text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

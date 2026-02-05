import { markScheduleAsDone } from "@/api/schedule";
import { scheduleTypes } from "@/constants";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { Check, Loader2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import EmptyReminderState from "./EmptyReminderState";
import ReminderItem from "./ReminderItem";
import ScheduleTypeFilter from "./ScheduleTypeFilter";
import { tableViewUtils } from "./tableViewUtils";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";

// Helper function để lấy tên đầu và cuối

// Component riêng cho cột actions
function ReminderActions({
    reminder,
    onEdit,
    onDelete,
    onToggleDone,
    getWorkspaceName,
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDone, setIsDone] = useState(reminder.IsDone || false);

    const handleToggleDone = async () => {
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            const newDoneStatus = !isDone;
            await onToggleDone(reminder, newDoneStatus);
            setIsDone(newDoneStatus);
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex justify-center space-x-1">
            <TooltipProvider>
                <Tooltip content={"Chỉnh sửa"}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(reminder);
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-gray-100 flex-shrink-0"
                        title="Chỉnh sửa"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip content={"Xóa"}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(reminder);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-gray-100 flex-shrink-0"
                        title="Xóa"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip content={"Đánh dấu hoàn thành"}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDone();
                        }}
                        disabled={isUpdating}
                        className={`p-1.5 rounded-md flex-shrink-0 ${
                            isDone
                                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title={
                            isDone
                                ? "Đánh dấu chưa hoàn thành"
                                : "Đánh dấu hoàn thành"
                        }
                    >
                        {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : isDone ? (
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                    </button>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export default function TableView({
    reminders,
    onEdit,
    onDelete,
    onToggleDone,
    parseContact,
    isEveryDayOfWeek,
    searchTerm,
    setSearchTerm,
}) {
    // State cho việc lọc theo loại lịch hẹn - mặc định chọn tất cả
    const [selectedScheduleTypes, setSelectedScheduleTypes] = useState(
        scheduleTypes.map((type) => type.id)
    );

    // Lấy danh sách workspace để map tên
    const { workspaceList } = useWorkspaceList();

    // Hàm để lấy tên workspace từ WorkspaceId
    const getWorkspaceName = (workspaceId) => {
        const workspace = workspaceList.find(
            (ws) => ws.id === workspaceId || ws.Id === workspaceId
        );
        return workspace ? workspace.name || workspace.Name : "N/A";
    };

    // Hàm xử lý đánh dấu hoàn thành với API thực tế từ workspace ReminderItem.js
    const handleToggleDone = async (reminder, newDoneStatus) => {
        if (!reminder.Id) return false;

        try {
            // Gọi API markScheduleAsDone giống như trong workspace useReminders.js
            await markScheduleAsDone({
                ScheduleId: reminder.Id,
                IsDone: newDoneStatus,
            });

            // Gọi callback từ component cha để update local state
            if (onToggleDone && typeof onToggleDone === "function") {
                await onToggleDone(reminder.Id, newDoneStatus);
            }

            return true;
        } catch (error) {
            console.error("Lỗi khi đánh dấu hoàn thành:", error);
            toast.error("Không thể cập nhật trạng thái");
            throw error;
        }
    };

    // Hàm xử lý thay đổi filter từ component con
    const handleFilterChange = (newSelectedTypes) => {
        setSelectedScheduleTypes(newSelectedTypes);
    };

    // Lọc reminders theo loại được chọn
    const filteredReminders = reminders.filter((reminder) =>
        selectedScheduleTypes.includes(reminder.SchedulesType || "reminder")
    );

    // Sắp xếp danh sách nhắc hẹn đã được lọc
    const sortedReminders = tableViewUtils.sortReminders(filteredReminders);

    // Định nghĩa columns cho DataTable
    const columns = useMemo(
        () => [
            {
                accessorKey: "content",
                header: "Nội dung",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const scheduleType =
                        scheduleTypes.find(
                            (t) => t.id === reminder.SchedulesType
                        ) || scheduleTypes.find((t) => t.id === "reminder");
                    const isDone = reminder.IsDone || reminder.isDone || false;
                    const isOverdue =
                        !isDone && reminder.EndTime
                            ? tableViewUtils.isOverdue(reminder.EndTime)
                            : false;

                    return (
                        <div className="w-[220px] min-w-[220px]">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex-shrink-0 ${
                                        isDone
                                            ? "text-green-600/70"
                                            : "text-red-500"
                                    }`}
                                >
                                    {scheduleType.icon}
                                </div>
                                <span
                                    className={`truncate text-sm ${
                                        isDone
                                            ? "line-through text-gray-500"
                                            : ""
                                    } ${
                                        !isDone && isOverdue
                                            ? "text-red-500"
                                            : ""
                                    }`}
                                >
                                    {reminder.Title ||
                                        reminder.Content ||
                                        "Nhắc hẹn"}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "customer",
                header: "Khách hàng",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const contact = tableViewUtils.parseContact(
                        reminder.Contact
                    );
                    const isDone = reminder.IsDone || reminder.isDone || false;
                    const isOverdue =
                        !isDone && reminder.EndTime
                            ? tableViewUtils.isOverdue(reminder.EndTime)
                            : false;

                    return (
                        <div className="w-[200px] min-w-[200px]">
                            <div className="flex items-center gap-3 w-full">
                                <Avatar
                                    name={contact?.fullName}
                                    size="32"
                                    round={true}
                                />
                                <div className="min-w-0 flex-1">
                                    <div
                                        className={`font-medium text-sm truncate ${
                                            isDone
                                                ? "line-through text-gray-500"
                                                : ""
                                        } ${
                                            !isDone && isOverdue
                                                ? "text-red-500"
                                                : ""
                                        }`}
                                    >
                                        {contact
                                            ? contact.fullName
                                            : "Hệ thống"}
                                    </div>
                                    {contact?.phone && (
                                        <div className="text-xs text-gray-500 truncate">
                                            {contact.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "workspace",
                header: "Nhóm làm việc",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const isDone = reminder.IsDone || reminder.isDone || false;
                    const isOverdue =
                        !isDone && reminder.EndTime
                            ? tableViewUtils.isOverdue(reminder.EndTime)
                            : false;

                    return (
                        <div className="w-[150px] min-w-[150px]">
                            <div
                                className={`text-sm font-medium truncate ${
                                    isDone ? "line-through text-gray-500" : ""
                                } ${
                                    !isDone && isOverdue ? "text-red-500" : ""
                                }`}
                            >
                                {getWorkspaceName(
                                    reminder.WorkspaceId || reminder.workspaceId
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "description",
                header: "Mô tả",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const isDone = reminder.IsDone || reminder.isDone || false;
                    const isOverdue =
                        !isDone && reminder.EndTime
                            ? tableViewUtils.isOverdue(reminder.EndTime)
                            : false;

                    return (
                        <div className="w-[200px] min-w-[200px]">
                            {reminder.Content && (
                                <div
                                    className={`text-sm text-gray-600 overflow-hidden ${
                                        isDone
                                            ? "line-through text-gray-500"
                                            : ""
                                    } ${
                                        isOverdue && !isDone
                                            ? "text-red-500/70"
                                            : ""
                                    }`}
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
                        </div>
                    );
                },
            },
            {
                accessorKey: "time",
                header: "Thời gian",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const isOverdue =
                        !reminder.IsDone && reminder.EndTime
                            ? tableViewUtils.isOverdue(reminder.EndTime)
                            : false;

                    return (
                        <div className="w-[180px] min-w-[180px]">
                            <div className="text-sm">
                                <div
                                    className={`text-gray-900 font-medium text-xs ${
                                        isOverdue ? "text-red-600" : ""
                                    }`}
                                >
                                    {tableViewUtils.formatDateTimeRange(
                                        reminder.StartTime,
                                        reminder.EndTime
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const isDone = reminder.IsDone || reminder.isDone || false;
                    const isOverdue =
                        !isDone && reminder.EndTime
                            ? tableViewUtils.isOverdue(reminder.EndTime)
                            : false;

                    const getStatusIcon = () => {
                        if (isDone) {
                            return (
                                <svg
                                    className="h-4 w-4 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            );
                        } else if (isOverdue) {
                            return (
                                <svg
                                    className="h-4 w-4 text-red-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            );
                        } else {
                            return (
                                <svg
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            );
                        }
                    };

                    const statusText = isDone
                        ? "Hoàn thành"
                        : isOverdue
                        ? "Quá hạn"
                        : "Chờ xử lý";

                    return (
                        <div className="w-[120px] min-w-[120px]">
                            <div className="flex items-center w-full">
                                <div className="flex-shrink-0 mr-1.5">
                                    {getStatusIcon()}
                                </div>
                                <span
                                    className={`text-xs font-medium truncate ${
                                        isDone
                                            ? "text-green-600"
                                            : isOverdue
                                            ? "text-red-500 font-medium"
                                            : "text-blue-600"
                                    }`}
                                >
                                    {statusText}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "priority",
                header: "Độ ưu tiên",
                cell: ({ row }) => {
                    const reminder = row.original;
                    const priority = reminder.Priority || reminder.priority;

                    const getPriorityColor = (priority) => {
                        switch (priority) {
                            case 2:
                                return "bg-red-500";
                            case 1:
                                return "bg-amber-500";
                            default:
                                return "bg-gray-500";
                        }
                    };

                    const getPriorityText = (priority) => {
                        switch (priority) {
                            case 2:
                                return "Cao";
                            case 1:
                                return "Trung bình";
                            default:
                                return "Thấp";
                        }
                    };

                    return (
                        <div className="w-[120px] min-w-[120px]">
                            <div className="flex items-center w-full">
                                <div
                                    className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${getPriorityColor(
                                        priority
                                    )}`}
                                ></div>
                                <span
                                    className={`text-xs truncate ${
                                        priority === 2
                                            ? "text-red-700 font-medium"
                                            : priority === 1
                                            ? "text-amber-700"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {getPriorityText(priority)}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "actions",
                header: "Thao tác",
                cell: ({ row }) => (
                    <div className="w-[120px] min-w-[120px] text-center">
                        <ReminderActions
                            reminder={row.original}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleDone={handleToggleDone}
                            getWorkspaceName={getWorkspaceName}
                        />
                    </div>
                ),
            },
        ],
        [parseContact, getWorkspaceName, onEdit, onDelete, handleToggleDone]
    );

    return (
        <div className="bg-white rounded-lg flex flex-col h-full">
            {/* Filter and Search */}
            <div className="flex-shrink-0 pb-4 border-gray-200">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-shrink-0">
                        <ScheduleTypeFilter
                            onFilterChange={handleFilterChange}
                        />
                    </div>

                    {/* Search */}
                    <div className="relative max-w-xs min-w-0 flex-shrink">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhắc hẹn..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Custom Table */}
            <div className="flex-1 overflow-hidden">
                <div
                    className="h-full border border-gray-200 rounded-lg"
                    style={{
                        overflowX: "auto",
                        overflowY: "auto",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#cbd5e0 #f7fafc",
                    }}
                >
                    <div>
                        <table
                            className="w-full"
                            style={{ tableLayout: "fixed" }}
                        >
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Nội dung
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Khách hàng
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Nhóm làm việc
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Mô tả
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Thời gian
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Trạng thái
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Độ ưu tiên
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-foreground tracking-wider ">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sortedReminders.length === 0 ? (
                                    <EmptyReminderState colSpan={8} />
                                ) : (
                                    sortedReminders.map((reminder, index) => {
                                        const scheduleType =
                                            scheduleTypes.find(
                                                (t) =>
                                                    t.id ===
                                                    reminder.SchedulesType
                                            ) ||
                                            scheduleTypes.find(
                                                (t) => t.id === "reminder"
                                            );
                                        const isDone =
                                            reminder.IsDone ||
                                            reminder.isDone ||
                                            false;
                                        const isOverdue =
                                            !isDone && reminder.EndTime
                                                ? tableViewUtils.isOverdue(
                                                      reminder.EndTime
                                                  )
                                                : false;
                                        const contact =
                                            tableViewUtils.parseContact(
                                                reminder.Contact
                                            );
                                        const priority =
                                            reminder.Priority ||
                                            reminder.priority;

                                        return (
                                            <tr
                                                key={reminder.Id || index}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="py-4 px-4 w-[220px]">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex-shrink-0 ${
                                                                isDone
                                                                    ? "text-green-600/70"
                                                                    : "text-red-500"
                                                            }`}
                                                        >
                                                            {scheduleType.icon}
                                                        </div>
                                                        <span
                                                            className={`truncate text-sm ${
                                                                isDone
                                                                    ? "line-through text-gray-500"
                                                                    : ""
                                                            } ${
                                                                !isDone &&
                                                                isOverdue
                                                                    ? "text-red-500"
                                                                    : ""
                                                            }`}
                                                        >
                                                            {reminder.Title ||
                                                                reminder.Content ||
                                                                "Nhắc hẹn"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 w-[200px]">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <Avatar
                                                            name={
                                                                contact?.fullName
                                                            }
                                                            size="32"
                                                            round={true}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div
                                                                className={`font-medium text-sm truncate ${
                                                                    isDone
                                                                        ? "line-through text-gray-500"
                                                                        : ""
                                                                } ${
                                                                    !isDone &&
                                                                    isOverdue
                                                                        ? "text-red-500"
                                                                        : ""
                                                                }`}
                                                            >
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
                                                </td>
                                                <td className="py-4 px-4 w-[150px]">
                                                    <div
                                                        className={`text-sm font-medium truncate ${
                                                            isDone
                                                                ? "line-through text-gray-500"
                                                                : ""
                                                        } ${
                                                            !isDone && isOverdue
                                                                ? "text-red-500"
                                                                : ""
                                                        }`}
                                                    >
                                                        {getWorkspaceName(
                                                            reminder.WorkspaceId ||
                                                                reminder.workspaceId
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 w-[200px]">
                                                    {reminder.Content && (
                                                        <div
                                                            className={`text-sm text-gray-600 overflow-hidden ${
                                                                isDone
                                                                    ? "line-through text-gray-500"
                                                                    : ""
                                                            } ${
                                                                isOverdue &&
                                                                !isDone
                                                                    ? "text-red-500/70"
                                                                    : ""
                                                            }`}
                                                            style={{
                                                                display:
                                                                    "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient:
                                                                    "vertical",
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                        >
                                                            {reminder.Content}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 w-[180px]">
                                                    <div className="text-sm">
                                                        <div
                                                            className={`text-gray-900 font-medium text-xs ${
                                                                isOverdue
                                                                    ? "text-red-600"
                                                                    : ""
                                                            }`}
                                                        >
                                                            {tableViewUtils.formatDateTimeRange(
                                                                reminder.StartTime,
                                                                reminder.EndTime
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 w-[120px]">
                                                    <div className="flex items-center w-full">
                                                        <div className="flex-shrink-0 mr-1.5">
                                                            {isDone ? (
                                                                <svg
                                                                    className="h-4 w-4 text-green-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            ) : isOverdue ? (
                                                                <svg
                                                                    className="h-4 w-4 text-red-500"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="h-4 w-4 text-blue-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`text-xs font-medium truncate ${
                                                                isDone
                                                                    ? "text-green-600"
                                                                    : isOverdue
                                                                    ? "text-red-500 font-medium"
                                                                    : "text-blue-600"
                                                            }`}
                                                        >
                                                            {isDone
                                                                ? "Hoàn thành"
                                                                : isOverdue
                                                                ? "Quá hạn"
                                                                : "Chờ xử lý"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 w-[120px]">
                                                    <div className="flex items-center w-full">
                                                        <div
                                                            className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                                                                priority === 2
                                                                    ? "bg-red-500"
                                                                    : priority ===
                                                                      1
                                                                    ? "bg-amber-500"
                                                                    : "bg-gray-500"
                                                            }`}
                                                        ></div>
                                                        <span
                                                            className={`text-xs truncate ${
                                                                priority === 2
                                                                    ? "text-red-700 font-medium"
                                                                    : priority ===
                                                                      1
                                                                    ? "text-amber-700"
                                                                    : "text-gray-700"
                                                            }`}
                                                        >
                                                            {priority === 2
                                                                ? "Cao"
                                                                : priority === 1
                                                                ? "Trung bình"
                                                                : "Thấp"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 w-[120px] text-center">
                                                    <ReminderActions
                                                        reminder={reminder}
                                                        onEdit={onEdit}
                                                        onDelete={onDelete}
                                                        onToggleDone={
                                                            handleToggleDone
                                                        }
                                                        getWorkspaceName={
                                                            getWorkspaceName
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    getReminderConfigListByOrgId,
    deleteReminderConfig,
    toggleReminderConfigStatus,
    getReminderConfigDetail,
} from "@/api/automation";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MdLoop,
    MdAccessTime,
    MdOutlineNotifications,
    MdOutlineDelete,
    MdAlarmOn,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToastPromise } from "@/components/toast";
import toast from "react-hot-toast";
import ReminderConfigDialog from "./ReminderConfigDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStageStore } from "@/store/stage";

export default function ReminderList({ refreshTrigger }) {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [reminderList, setReminderList] = useState([]);
    const [configOpen, setConfigOpen] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [isUpdating, setIsUpdating] = useState({});
    const { workspaceList } = useWorkspaceList();
    const [alertOpen, setAlertOpen] = useState(false);
    const [reminderToDelete, setReminderToDelete] = useState(null);
    const [toggleAlertOpen, setToggleAlertOpen] = useState(false);
    const [reminderToToggle, setReminderToToggle] = useState(null);
    const { stageGroups, fetchStages } = useStageStore();
    const [workspaceStageMap, setWorkspaceStageMap] = useState({});

    useEffect(() => {
        const fetchReminders = async () => {
            setLoading(true);
            try {
                const response = await getReminderConfigListByOrgId(
                    params.orgId
                );
                if (response && Array.isArray(response)) {
                    // Chuẩn hóa dữ liệu, đảm bảo tất cả các khóa đều ở định dạng nhất quán
                    const normalizedReminders = response.map((item) => ({
                        ...item,
                        id: item.id || item.Id,
                        time: item.time || item.Time,
                        stages: item.stages || item.Stages || [],
                        hourFrame: item.hourFrame || item.HourFrame || [],
                        sourceIds: item.sourceIds || item.SourceIds || [],
                        utmSources: item.utmSources || item.UtmSources || [],
                        workspaceIds:
                            item.workspaceIds || item.WorkspaceIds || [],
                        notificationMessage:
                            item.notificationMessage ||
                            item.NotificationMessage ||
                            "",
                        organizationId:
                            item.organizationId || item.OrganizationId || "",
                        isActive:
                            item.isActive !== undefined
                                ? item.isActive
                                : item.IsActive !== undefined
                                ? item.IsActive
                                : false,
                        repeat:
                            item.repeat !== undefined
                                ? item.repeat
                                : item.Repeat !== undefined
                                ? item.Repeat
                                : 0,
                        repeatTime:
                            item.repeatTime !== undefined
                                ? item.repeatTime
                                : item.RepeatTime !== undefined
                                ? item.RepeatTime
                                : 0,
                        createdAt: item.createdAt || item.CreatedAt || "",
                    }));

                    setReminderList(normalizedReminders || []);
                }
            } catch (error) {
                console.error("Error fetching reminder configs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReminders();
    }, [params.orgId, refreshTrigger]);

    // Thêm effect để lắng nghe sự kiện custom refresh
    useEffect(() => {
        // Hàm xử lý sự kiện
        const handleRefreshEvent = () => {
            handleRefreshList();
        };

        // Đăng ký lắng nghe sự kiện
        window.addEventListener("refresh-reminder-configs", handleRefreshEvent);

        // Hủy đăng ký khi component unmount
        return () => {
            window.removeEventListener(
                "refresh-reminder-configs",
                handleRefreshEvent
            );
        };
    }, []);

    // Hàm tự refresh danh sách
    const handleRefreshList = () => {
        setLoading(true); // Bắt đầu loading để hiển thị skeleton
        const fetchReminders = async () => {
            try {
                const response = await getReminderConfigListByOrgId(
                    params.orgId
                );
                if (response && Array.isArray(response)) {
                    // Chuẩn hóa dữ liệu, đảm bảo tất cả các khóa đều ở định dạng nhất quán
                    const normalizedReminders = response.map((item) => ({
                        ...item,
                        id: item.id || item.Id,
                        time: item.time || item.Time,
                        stages: item.stages || item.Stages || [],
                        hourFrame: item.hourFrame || item.HourFrame || [],
                        sourceIds: item.sourceIds || item.SourceIds || [],
                        utmSources: item.utmSources || item.UtmSources || [],
                        workspaceIds:
                            item.workspaceIds || item.WorkspaceIds || [],
                        notificationMessage:
                            item.notificationMessage ||
                            item.NotificationMessage ||
                            "",
                        organizationId:
                            item.organizationId || item.OrganizationId || "",
                        isActive:
                            item.isActive !== undefined
                                ? item.isActive
                                : item.IsActive !== undefined
                                ? item.IsActive
                                : false,
                        repeat:
                            item.repeat !== undefined
                                ? item.repeat
                                : item.Repeat !== undefined
                                ? item.Repeat
                                : 0,
                        repeatTime:
                            item.repeatTime !== undefined
                                ? item.repeatTime
                                : item.RepeatTime !== undefined
                                ? item.RepeatTime
                                : 0,
                        createdAt: item.createdAt || item.CreatedAt || "",
                    }));

                    setReminderList(normalizedReminders || []);
                } else {
                    console.error("Error with API response:", response);
                }
            } catch (error) {
                console.error("Error refreshing reminder configs:", error);
            } finally {
                setLoading(false); // Kết thúc loading
            }
        };

        fetchReminders();
    };

    // Hàm chuyển đổi Time (phút) sang giờ:phút
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours} giờ ` : ""}${mins} phút`;
    };

    // Hàm lấy tên workspace từ ID
    const getWorkspaceName = (workspaceId) => {
        const workspace = workspaceList.find((ws) => ws.id === workspaceId);
        return workspace ? workspace.name : "Không xác định";
    };

    // Lấy workspaceId từ rule để fetch stages
    useEffect(() => {
        const fetchStagesForWorkspaces = async () => {
            if (!reminderList.length || !params.orgId) return;

            // Tạo danh sách workspaceId cần fetch
            const workspaceIds = reminderList
                .flatMap((reminder) => reminder.workspaceIds || [])
                .filter(Boolean)
                .filter((value, index, self) => self.indexOf(value) === index); // Unique values

            // Fetch stages cho từng workspace
            const stageMapPromises = workspaceIds.map(async (workspaceId) => {
                await fetchStages(params.orgId, workspaceId);
                return { workspaceId };
            });

            await Promise.all(stageMapPromises);
        };

        fetchStagesForWorkspaces();
    }, [reminderList, params.orgId, fetchStages]);

    // Hàm lấy tên của giai đoạn từ stageGroups
    const getStageName = (stageId) => {
        for (const group of stageGroups) {
            const stage = group.stages.find((s) => s.id === stageId);
            if (stage) return stage.name;
        }
        return "";
    };

    // Hàm toggle trạng thái kịch bản
    const toggleReminderStatus = async (reminder) => {
        setReminderToToggle(reminder);
        setToggleAlertOpen(true);
    };

    // Hàm thực hiện toggle sau khi xác nhận
    const handleToggleStatus = async () => {
        if (!reminderToToggle) return;

        setIsUpdating((prev) => ({ ...prev, [reminderToToggle.id]: true }));

        ToastPromise(async () => {
            try {
                const response = await toggleReminderConfigStatus(
                    params.orgId,
                    reminderToToggle.id
                );
                // Cập nhật state local không cần kiểm tra response.code
                setReminderList(
                    reminderList.map((r) =>
                        r.id === reminderToToggle.id
                            ? { ...r, isActive: !r.isActive }
                            : r
                    )
                );
                toast.success(
                    reminderToToggle.isActive
                        ? "Đã tắt kịch bản"
                        : "Đã kích hoạt kịch bản"
                );
                setToggleAlertOpen(false);
                return true;
            } catch (error) {
                console.error("Error updating reminder status:", error);
                toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
                return false;
            } finally {
                setIsUpdating((prev) => ({
                    ...prev,
                    [reminderToToggle.id]: false,
                }));
            }
        });
    };

    // Hàm xử lý xóa reminder
    const handleDeleteReminder = async () => {
        if (!reminderToDelete) return;

        ToastPromise(async () => {
            try {
                const response = await deleteReminderConfig(
                    params.orgId,
                    reminderToDelete.id
                );
                // Cập nhật state local không cần kiểm tra response.code
                setReminderList(
                    reminderList.filter((r) => r.id !== reminderToDelete.id)
                );
                toast.success("Đã xóa kịch bản thành công");
                setAlertOpen(false);
                return true;
            } catch (error) {
                console.error("Error deleting reminder:", error);
                toast.error("Có lỗi xảy ra khi xóa kịch bản");
                return false;
            }
        });
    };

    // Hàm mở config dialog
    const openConfigDialog = (reminder, e) => {
        e.stopPropagation();
        setSelectedReminder(reminder);
        setConfigOpen(true);
    };

    // Hàm xác nhận xóa reminder
    const confirmDeleteReminder = (reminder, e) => {
        e.stopPropagation();
        setReminderToDelete(reminder);
        setAlertOpen(true);
    };

    // Hàm render card cho mỗi reminder
    const renderReminderCard = (reminder) => {
        const workspaceName =
            reminder.workspaceIds && reminder.workspaceIds.length > 0
                ? getWorkspaceName(reminder.workspaceIds[0])
                : "Không xác định";
        const isActive = reminder.isActive;

        // Hiển thị thông tin stages nếu có
        const getStageText = () => {
            if (!reminder.stages || reminder.stages.length === 0) {
                return "trạng thái bất kỳ";
            }

            // Lấy danh sách tên của các trạng thái
            const stageNames = reminder.stages
                .map((stageId) => getStageName(stageId))
                .filter(Boolean);

            if (stageNames.length === 0) {
                return "trạng thái bất kỳ";
            }

            return stageNames.join(", ");
        };

        // Hàm rút gọn text nếu quá dài
        const truncateText = (text, maxLength = 25) => {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        };

        // Lấy nội dung trạng thái và kiểm tra độ dài
        const stageText = getStageText();
        const needsTruncation = stageText.length > 50;
        const displayText = needsTruncation
            ? truncateText(stageText, 50)
            : stageText;

        // Format title theo yêu cầu mới
        const reminderTime = formatDuration(reminder.time || reminder.Time);

        return (
            <Card
                key={reminder.id}
                className={`transition-all border-0 ${
                    isActive ? "bg-primary" : "bg-bg1"
                } cursor-pointer hover:shadow-md group`}
                onClick={(e) => openConfigDialog(reminder, e)}
            >
                <CardContent className="p-4 min-h-[160px] relative">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            {(reminder.hourFrame?.length > 0 ||
                                reminder.HourFrame?.length > 0) && (
                                <div className="flex">
                                    <MdAccessTime
                                        className={`text-lg ${
                                            isActive
                                                ? "text-white"
                                                : "text-gray-500"
                                        }`}
                                    />
                                </div>
                            )}

                            {(reminder.repeat > 0 || reminder.Repeat > 0) && (
                                <div className="flex">
                                    <MdLoop
                                        className={`text-lg ${
                                            isActive
                                                ? "text-white"
                                                : "text-gray-500"
                                        }`}
                                    />
                                </div>
                            )}
                        </div>

                        <Switch
                            checked={isActive}
                            onCheckedChange={() =>
                                toggleReminderStatus(reminder)
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={isUpdating[reminder.id]}
                            className={`${isActive ? "bg-white" : ""}`}
                        />
                    </div>

                    <div className="flex flex-col mt-1">
                        <div className="flex-1">
                            {needsTruncation ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p
                                                className={`text-base font-medium ${
                                                    isActive
                                                        ? "text-white"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                Gửi thông báo sau {reminderTime}{" "}
                                                tiếp nhận khách hàng thuộc{" "}
                                                {displayText}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Gửi thông báo sau {reminderTime}{" "}
                                                tiếp nhận khách hàng thuộc{" "}
                                                {stageText}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <p
                                    className={`text-base font-medium ${
                                        isActive
                                            ? "text-white"
                                            : "text-gray-700"
                                    }`}
                                >
                                    Gửi thông báo sau {reminderTime} tiếp nhận
                                    khách hàng thuộc {displayText}
                                </p>
                            )}

                            <p
                                className={`text-sm mt-1 ${
                                    isActive ? "text-white/80" : "text-gray-600"
                                }`}
                            >
                                Tại không gian làm việc: {workspaceName}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-3 bottom-3 p-1 h-7 w-7 ${
                            isActive
                                ? "text-white hover:text-white/80 hover:bg-primary-foreground/10"
                                : "text-gray-500 hover:text-gray-700"
                        } opacity-0 group-hover:opacity-100 transition-opacity`}
                        onClick={(e) => confirmDeleteReminder(reminder, e)}
                    >
                        <MdOutlineDelete className="text-lg text-red-500" />
                    </Button>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="mb-6">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="mb-4 bg-bg1 border-0">
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-5/6 mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-2 ml-6" />
                                <Skeleton className="h-4 w-3/4 ml-6" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : reminderList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reminderList.map((reminder) =>
                        renderReminderCard(reminder)
                    )}
                </div>
            ) : (
                <p className="text-gray-500">Chưa có kịch bản nhắc hẹn nào.</p>
            )}

            {/* Dialog chỉnh sửa */}
            {configOpen && selectedReminder && (
                <ReminderConfigDialog
                    open={configOpen}
                    setOpen={setConfigOpen}
                    editMode={true}
                    ruleData={selectedReminder}
                    onSuccess={handleRefreshList}
                />
            )}

            {/* Alert Dialog xác nhận xóa */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa kịch bản
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Bạn có chắc chắn muốn xóa kịch bản nhắc hẹn này?
                            </p>
                            <p>
                                Hành động này không thể hoàn tác sau khi thực
                                hiện.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteReminder}
                            className="bg-red-400 hover:bg-red-500"
                        >
                            Xóa kịch bản
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog xác nhận bật/tắt */}
            <AlertDialog
                open={toggleAlertOpen}
                onOpenChange={setToggleAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        {reminderToToggle?.isActive ? (
                            <AlertDialogTitle>
                                Xác nhận tắt kịch bản nhắc hẹn
                            </AlertDialogTitle>
                        ) : (
                            <AlertDialogTitle>
                                Xác nhận kích hoạt kịch bản
                            </AlertDialogTitle>
                        )}
                        <AlertDialogDescription className="space-y-2">
                            {reminderToToggle?.isActive ? (
                                <p>
                                    Bạn có chắc chắn muốn tắt kịch bản nhắc hẹn
                                    này?
                                </p>
                            ) : (
                                <p>
                                    Bạn có chắc chắn muốn kích hoạt kịch bản
                                    nhắc hẹn này?
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            className={
                                reminderToToggle?.isActive
                                    ? "bg-red-400 hover:bg-red-500"
                                    : "bg-green-400 hover:bg-green-500"
                            }
                        >
                            {reminderToToggle?.isActive
                                ? "Tắt kịch bản"
                                : "Kích hoạt kịch bản"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

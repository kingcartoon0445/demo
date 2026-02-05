import { useState, useEffect, useCallback } from "react";
import {
    getScheduleList,
    deleteSchedule,
    markScheduleAsDone,
} from "@/api/schedule";
import toast from "react-hot-toast";

// Custom hook để xử lý logic liên quan đến nhắc hẹn
export const useReminders = (orgId, workspaceId, cid, provider) => {
    const [reminderList, setReminderList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // Hàm để lấy danh sách nhắc hẹn từ API
    const fetchReminders = useCallback(async () => {
        if (provider === "bpt" && !cid) return;
        if (!orgId) return;

        setIsLoading(true);
        try {
            const params = {
                organizationId: orgId,
                workspaceId: workspaceId,
            };

            // Nếu đang xem chi tiết khách hàng, thêm contactId vào params
            if (cid) {
                params.contactId = cid;
            }

            const response = await getScheduleList(params);

            // Cập nhật xử lý response theo cấu trúc mới
            if (
                response &&
                response.Status === "Success" &&
                Array.isArray(response.Data)
            ) {
                setReminderList(response.Data);
            } else if (response && Array.isArray(response)) {
                // Xử lý tương thích ngược nếu API vẫn trả về mảng trực tiếp
                setReminderList(response);
            } else {
                setReminderList([]);
                if (
                    response &&
                    response.Message &&
                    response.StatusCode !== 200
                ) {
                    toast.error(
                        response.Message || "Không thể lấy danh sách nhắc hẹn"
                    );
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách nhắc hẹn:", error);
            toast.error("Không thể lấy danh sách nhắc hẹn");
        } finally {
            setIsLoading(false);
        }
    }, [orgId, workspaceId, cid]);

    // Hàm xóa nhắc hẹn
    const handleDeleteReminder = useCallback(
        async (reminderId) => {
            if (!reminderId) return;

            try {
                await toast.promise(deleteSchedule(reminderId), {
                    loading: "Đang xóa nhắc hẹn...",
                    success: "Xóa nhắc hẹn thành công",
                    error: "Không thể xóa nhắc hẹn",
                });

                // Refresh danh sách sau khi xóa
                fetchReminders();
            } catch (error) {
                console.error("Lỗi khi xóa nhắc hẹn:", error);
            }
        },
        [fetchReminders]
    );

    // Hàm đánh dấu nhắc hẹn đã hoàn thành hoặc chưa hoàn thành
    const handleToggleDone = useCallback(async (reminderId, isDone) => {
        if (!reminderId) return;

        try {
            await markScheduleAsDone({
                ScheduleId: reminderId,
                IsDone: isDone,
            });

            // Cập nhật lại trạng thái trong danh sách local
            setReminderList((prevList) =>
                prevList.map((item) =>
                    item.Id === reminderId ? { ...item, IsDone: isDone } : item
                )
            );

            return true;
        } catch (error) {
            console.error("Lỗi khi đánh dấu hoàn thành:", error);
            toast.error("Không thể cập nhật trạng thái");
            return false;
        }
    }, []);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    return {
        reminderList,
        isLoading,
        fetchReminders,
        handleDeleteReminder,
        handleToggleDone,
    };
};

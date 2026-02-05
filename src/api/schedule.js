import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

const calendarBaseUrl = "https://calendar.coka.ai";

// Lấy danh sách nhắc hẹn
export async function getScheduleList(params) {
    try {
        const api = createApiCall();
        const response = await api.get(`${calendarBaseUrl}/api/Schedule`, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy thông tin chi tiết của một nhắc hẹn
export async function getScheduleDetail(scheduleId) {
    try {
        const api = createApiCall();
        const response = await api.get(
            `${calendarBaseUrl}/api/Schedule/${scheduleId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Tạo mới nhắc hẹn
export async function createSchedule(body) {
    try {
        const api = createApiCall();
        const response = await api.post(
            `${calendarBaseUrl}/api/Schedule`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Cập nhật thông tin nhắc hẹn
export async function updateSchedule(body) {
    try {
        const api = createApiCall();
        const response = await api.put(`${calendarBaseUrl}/api/Schedule`, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Xóa nhắc hẹn
export async function deleteSchedule(scheduleId) {
    try {
        const api = createApiCall();
        const response = await api.delete(
            `${calendarBaseUrl}/api/Schedule/${scheduleId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Đánh dấu nhắc hẹn đã hoàn thành hoặc chưa hoàn thành
export async function updateScheduleStatus(scheduleId, body) {
    try {
        const api = createApiCall();
        const response = await api.patch(
            `${calendarBaseUrl}/api/Schedule/${scheduleId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getScheduleCalendar(params) {
    try {
        const api = createApiCall();
        const response = await api.get(
            `${calendarBaseUrl}/api/Schedule/calendar`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getScheduleReminders(params) {
    try {
        const api = createApiCall();
        const response = await api.get(
            `${calendarBaseUrl}/api/Schedule/reminders`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function markScheduleComplete(scheduleId, body) {
    try {
        const api = createApiCall();
        const response = await api.patch(
            `${calendarBaseUrl}/api/Schedule/${scheduleId}/complete`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function snoozeSchedule(scheduleId, body) {
    try {
        const api = createApiCall();
        const response = await api.patch(
            `${calendarBaseUrl}/api/Schedule/${scheduleId}/snooze`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function markScheduleAsDone(data) {
    try {
        const res = await fetch(
            `${calendarBaseUrl}/api/Schedule/mark-as-done`,
            {
                method: "PATCH",
                headers: {
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(data),
            }
        );

        if (!res.ok) {
            throw new Error(`Error marking schedule as done: ${res.status}`);
        }

        // Kiểm tra nếu không có body content
        if (res.headers.get("content-length") === "0") {
            return {
                Status: "Success",
                Data: null,
                Message: data.IsDone
                    ? "Schedule marked as done"
                    : "Schedule marked as not done",
                StatusCode: res.status,
            };
        }

        try {
            const dataJson = await res.json();
            return dataJson;
        } catch (parseError) {
            // Nếu không parse được JSON nhưng response là ok
            if (res.ok) {
                return {
                    Status: "Success",
                    Data: null,
                    Message: data.IsDone
                        ? "Schedule marked as done"
                        : "Schedule marked as not done",
                    StatusCode: res.status,
                };
            }
            throw parseError;
        }
    } catch (error) {
        console.error("Error marking schedule as done:", error);
        throw error;
    }
}

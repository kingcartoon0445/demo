import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";
import qs from "qs";
/**
 * Get notifications with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.offset - Offset for pagination
 * @param {number} params.limit - Limit for pagination
 * @param {string} params.sort - Sort configuration
 * @returns {Promise} API response
 */
export const getNotifications = async (params = {}) => {
    const defaultParams = {
        offset: 0,
        limit: 20,
        sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
    };

    const queryParams = { ...defaultParams, ...params };

    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
        }
    });
    const api = createApiCall(params.orgId);
    const response = await api.get(
        `${paths.notifyList}?${searchParams.toString()}`
    );
    return response.data;
};

/**
 * Mark notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 * @returns {Promise} API response
 */
export const markNotificationAsRead = async (notificationId) => {
    const api = createApiCall();
    const response = await api.patch(
        `${paths.notifySetIsRead}?notifyId=${notificationId}&status=0`
    );
    return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise} API response
 */
export const markAllNotificationsAsRead = async () => {
    const api = createApiCall();
    const response = await api.post(`${paths.notifySetReadAll}`);
    return response.data;
};

/**
 * Get unread notification count
 * @param {string} orgId - Organization ID
 * @returns {Promise} API response with unread count
 */
export const getUnreadNotificationCount = async (orgId) => {
    const api = createApiCall(orgId);
    const response = await api.get(paths.notifyUnreadCount);
    return response.data;
};

export async function getNotificationUnreadCount(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.notifyUnreadCount);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateFCMToken(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(paths.updateFCMTokenApi, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getNotificationSettings(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.notifySettingList);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateNotificationSetting(orgId, settingId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.notifySettingUpdate}/${settingId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getNotifySettingList() {
    try {
        const res = await fetch(paths.notifySettingList, {
            headers: {
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function updateNotifySetting(id, status) {
    try {
        const res = await fetch(
            `${paths.notifySettingUpdate.replace("{id}", id)}?status=${status}`,
            {
                headers: {
                    accept: "*/*",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                    "Content-Type": "application/json",
                },
                method: "PUT",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

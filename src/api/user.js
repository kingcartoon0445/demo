import { apiMethods, createApiCall } from "@/lib/api";
import paths from "@/lib/authConstants";

/**
 * Cập nhật thông tin hồ sơ người dùng
 * @param {FormData} formData - Form data chứa thông tin cần cập nhật (fullName, about, email, phone, dob, gender, address, avatar)
 * @returns {Promise} - Promise của kết quả API
 */
export async function updateProfile(formData) {
    try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`${paths.updateUserProfile}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}

/**
 * Lấy thông tin chi tiết hồ sơ người dùng
 * @returns {Promise} - Promise của kết quả API
 */
export async function getProfileDetail() {
    try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`${paths.apiBase}${paths.getProfile}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
}

export async function getUserProfileDetail(orgId, profileId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(`${paths.orgMemberDetail}${profileId}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateUserProfile(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.put(paths.updateUserProfile, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateUserProfileAvatar(body) {
    try {
        const response = await apiMethods.put(paths.updateUserProfile, body, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getUserWorkspaceRoles(orgId, profileId) {
    try {
        const api = createApiCall(orgId);
        const url = paths.getUserWorkspaceRoles.replace("{profileId}", profileId);
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getUserWorkspaceRolesV2(orgId, profileId) {
    try {
        const api = createApiCall(orgId);
        const url = paths.getUserWorkspaceRolesV2;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

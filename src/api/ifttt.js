import { apiMethods, createApiCall } from "@/lib/api";
import paths from "@/lib/authConstants";

const BASE_URL = "https://automation.coka.ai";

// Hàm tạo campaign IFTTT
export async function createIFTTTCampaign(campaignData) {
    try {
        const response = await apiMethods.post(
            `${BASE_URL}/api/ifttt/create`,
            campaignData
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error("Không thể tạo campaign IFTTT");
    }
}

// Hàm lấy danh sách campaign
export async function getIFTTTCampaigns(params) {
    try {
        const response = await apiMethods.get(`${BASE_URL}/api/ifttt/camlist`, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error("Không thể lấy danh sách campaign");
    }
}

// Hàm xóa campaign
export async function deleteIFTTTCampaign(campaignId) {
    try {
        const response = await apiMethods.delete(
            `${BASE_URL}/api/ifttt/camlist/${campaignId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error("Không thể xóa campaign");
    }
}

// Hàm chỉnh sửa campaign
export async function updateIFTTTCampaign(campaignId, updateData) {
    try {
        const response = await apiMethods.patch(
            `${BASE_URL}/api/ifttt/camlist/${campaignId}`,
            updateData
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error("Không thể cập nhật campaign");
    }
}

// Hàm cập nhật trạng thái campaign
export async function updateIFTTTCampaignStage(campaignId, newStage) {
    try {
        const response = await apiMethods.patch(
            `${BASE_URL}/api/ifttt/camlist/${campaignId}/update-stage`,
            null,
            {
                params: { stage: newStage },
            }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error("Bạn không có quyền cập nhật trạng thái");
    }
}

export async function getWebhookList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(`${paths.webhookApi}getlistpaging`, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createWebhook(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(`${paths.webhookApi}create`, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateWebhook(orgId, workspaceId, webhookId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.webhookApi}${webhookId}/update`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateWebhookStatus(orgId, workspaceId, webhookId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.webhookApi}${webhookId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteWebhook(orgId, workspaceId, webhookId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.webhookApi}${webhookId}/delete`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

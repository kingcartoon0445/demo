import { apiMethods, createApiCall } from "@/lib/api";
import paths from "@/lib/authConstants";

export const rocketBaseUrl = "https://demobe.aidc.xyz";
const authToken = "qsgAJObxtlJxPNaB3l0_UhoRPUkJDqAhh_4cDpcYtxJ";
const userId = "MExyZs2F5Tbd3x9p7";

export async function getRoomList() {
    try {
        const response = await apiMethods.get(
            `${rocketBaseUrl}/api/v1/rooms.get`,
            {
                headers: {
                    "X-Auth-Token": authToken,
                    "X-User-Id": userId,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getAllSubscriptions() {
    try {
        const response = await apiMethods.get(
            `${rocketBaseUrl}/api/v1/subscriptions.get`,
            {
                headers: {
                    "X-Auth-Token": authToken,
                    "X-User-Id": userId,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getChatList(orgId, workspaceId, params, signal) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.chatList, { params, signal });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function sendFacebookMessage(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.sendFbMessage, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

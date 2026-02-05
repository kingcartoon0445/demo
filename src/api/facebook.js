import { createApiCall } from "@/lib/api";
import paths, { pathsV2 } from "@/lib/authConstants";
import qs from "qs";

export async function connectFacebook(orgId, data) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.connectFB, data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function connectFacebookLead(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.fbLeadConnectApi, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getSubscriptionsList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.getSubscriptionsApi, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateSubscriptionStatus(orgId, subscriptionId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.updateSubscriptionsApi}${subscriptionId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getConversationList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.conversationList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function postConversationList(orgId, workspaceId, body, config) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.conversationList, body, config);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function assignConversation(
    orgId,
    workspaceId,
    conversationId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.conversationAssign}${conversationId}/assignto`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function convertToLead(orgId, workspaceId, conversationId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.convertToLead}${conversationId}/converttolead`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getConversationDetail(orgId, conversationId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${paths.conversationDetail}${conversationId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getChatList(orgId, convId, page) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.chatList, {
            params: {
                ConversationId: convId,
                offset: page * 20,
                limit: 20,
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function sendFbMessage(orgId, messageData) {
    try {
        // Prepare FormData for multipart/form-data request
        const formData = new FormData();
        formData.append("conversationId", messageData.conversationId);
        formData.append("messageId", messageData.messageId);
        formData.append("message", messageData.message);

        // Handle attachment if it exists
        if (messageData.attachment) {
            if (messageData.attachment instanceof File) {
                // If attachment is a File (e.g. from <input type="file" />)
                formData.append(
                    "Attachment",
                    messageData.attachment,
                    messageData.attachment.name
                );
            } else {
                // Otherwise assume base64 encoded string
                const byteCharacters = atob(messageData.attachment);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                // Use provided attachmentName or fallback to generic name
                const fileName = messageData.attachmentName || "file";
                const blob = new Blob([byteArray]);
                formData.append("Attachment", blob, fileName);
            }
        }

        // Use shared api helper (axios) with organization header
        const api = createApiCall(orgId);
        const response = await api.post(paths.sendFbMessage, formData, {
            headers: {
                // Let axios/browser set the correct boundary for multipart
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function readConversation(orgId, conversationId) {
    try {
        const api = createApiCall(orgId);
        const url = pathsV2.readConversation.replace(
            "{conversationId}",
            conversationId
        );
        const response = await api.patch(url);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

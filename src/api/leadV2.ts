import { createApiCall } from "@/lib/api";
import paths, { connectionPaths, pathsV2 } from "@/lib/authConstants";
import toast from "react-hot-toast";

export const deleteZaloForm = async (orgId: string, formId: string) => {
    const api = createApiCall(orgId);
    const response: any = await api.delete(
        `${connectionPaths.deleteZaloformApi.replace("{formId}", formId)}`
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const getFacebookMessageConnection = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response: any = await api.get(
        connectionPaths.getFacebookMessageConnectionApi
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

type FacebookConnectPayload =
    | string[]
    | {
          accessTokens: string[];
          workspaceId?: string;
      };

const buildFacebookPayload = (
    payload: FacebookConnectPayload
): { accessTokens: string[]; workspaceId?: string } => {
    if (Array.isArray(payload)) {
        return { accessTokens: payload };
    }
    const requestBody: { accessTokens: string[]; workspaceId?: string } = {
        accessTokens: payload?.accessTokens || [],
    };
    if (payload?.workspaceId) {
        requestBody.workspaceId = payload.workspaceId;
    }
    return requestBody;
};

export const connectFacebookMessage = async (
    orgId: string,
    body: FacebookConnectPayload
) => {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        connectionPaths.connectFacebookMessageApi,
        buildFacebookPayload(body)
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const connectFacebookLead = async (
    orgId: string,
    body: FacebookConnectPayload
) => {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        connectionPaths.connectFacebookLeadApi,
        buildFacebookPayload(body)
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const connectFacebookFeed = async (
    orgId: string,
    body: FacebookConnectPayload
) => {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        connectionPaths.connectFacebookFeedApi,
        buildFacebookPayload(body)
    );
    return response.data;
};

export const getTiktokAccounts = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response: any = await api.get(connectionPaths.getTiktokAccountsApi);
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const connectZaloform = async (orgId: string, body: any) => {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        connectionPaths.connectZaloformApi,
        body
    );
    if (response.data.code !== 0 && response.data.code !== 201) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const getFacebookLeadList = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response: any = await api.get(connectionPaths.getLeadListApi);
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const getFacebookFeedList = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response: any = await api.get(connectionPaths.getFacebookFeedListApi);
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export const updateStatusZaloform = async (
    orgId: string,
    formId: string,
    status: string
) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.patch(
            `${connectionPaths.updateStatusZaloformApi.replace(
                "{formId}",
                formId
            )}`,
            {
                status,
            }
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getZaloFormList = async (orgId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.get(
            `${connectionPaths.getZaloLeadConnectionApi}`
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export async function autoMappingZalo(orgId: string, body: any) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(
            connectionPaths.autoMappingZaloApi,
            {
                formUrl: body,
            }
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

// Lấy danh sách pages của user từ Facebook Graph API
export async function getFacebookPages(userID: string, accessToken: string) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${userID}/accounts?fields=id,name,picture.type(normal),access_token&access_token=${accessToken}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Facebook pages:", error);
        throw error;
    }
}

export const getZaloMessageConnection = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response: any = await api.get(
        connectionPaths.getZaloMessageConnectionApi
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
};

export async function webhookUpdateStatus(
    orgId: string,
    webhookId: string,
    status: string
) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.patch(
            `${connectionPaths.webhookApi}${webhookId}/status`,
            { status }
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookGetList(orgId: string) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.get(
            `${connectionPaths.webhookApi}getlist?limit=1000`
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookDelete(orgId: string, webhookId: string) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.delete(
            `${connectionPaths.webhookApi}${webhookId}/delete`
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function updateStatusWebform(
    orgId: string,
    websiteId: string,
    status: string
) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.patch(
            `${connectionPaths.updateStatusWebformApi.replace(
                "{websiteId}",
                websiteId
            )}?Status=${status}`
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function updateFacebookConnectStatus(
    orgId: string,
    connectionId: string,
    status: number
) {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        `${connectionPaths.updateFacebookConnectStatus.replace(
            "{connectionId}",
            connectionId
        )}`,
        { status }
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function deleteFacebookConnect(
    orgId: string,
    connectionId: string
) {
    const api = createApiCall(orgId);
    const response: any = await api.delete(
        `${connectionPaths.deleteFacebookConnect.replace(
            "{connectionId}",
            connectionId
        )}`
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function getChatList(
    orgId: string,
    conversationId: string,
    page: number
) {
    const api = createApiCall(orgId);
    const response: any = await api.get(
        `${connectionPaths.chatList.replace(
            "{conversationId}",
            conversationId
        )}`,
        {
            params: {
                offset: page * 20,
                limit: 20,
            },
        }
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function sendFbMessage(
    orgId: string,
    conversationId: string,
    messageData: any
) {
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
        const response: any = await api.post(
            connectionPaths.sendFbMessage.replace(
                "{conversationId}",
                conversationId
            ),
            formData,
            {
                headers: {
                    // Let axios/browser set the correct boundary for multipart
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteLeadConnection(
    orgId: string,
    connectionId: string,
    provider: string
) {
    const api = createApiCall(orgId);
    const response: any = await api.delete(
        `${connectionPaths.deleteLeadApi.replace(
            "{connectionId}",
            connectionId
        )}?provider=${provider}`
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function deleteZaloMessageConnection(
    orgId: string,
    connectionId: string
) {
    const api = createApiCall(orgId);
    const response: any = await api.delete(
        `${connectionPaths.deleteZaloMessageConnection.replace(
            "{connectionId}",
            connectionId
        )}`
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function updateZaloMessageConnection(
    orgId: string,
    connectionId: string,
    status: number
) {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        `${connectionPaths.updateZaloMessageConnection.replace(
            "{connectionId}",
            connectionId
        )}`,
        { status }
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function updateLeadStatus(
    orgId: string,
    connectionId: string,
    provider: string,
    status: number
) {
    const api = createApiCall(orgId);
    const response: any = await api.patch(
        `${connectionPaths.updateLeadStatusApi.replace(
            "{connectionId}",
            connectionId
        )}`,
        { status, provider }
    );
    return response.data;
}

export async function getAllLeadConnection(orgId: string) {
    const api = createApiCall(orgId);
    const response: any = await api.get(
        `${connectionPaths.getAllLeadConnectionApi}`
    );

    return response.data;
}

export async function getDetailZaloForm(orgId: string, formId: string) {
    const api = createApiCall(orgId);
    const response: any = await api.get(
        `${connectionPaths.getDetailZaloFormApi.replace("{formId}", formId)}`
    );
    return response.data;
}

export async function updateZaloForm(orgId: string, formId: string, body: any) {
    const api = createApiCall(orgId);
    const response: any = await api.patch(
        `${connectionPaths.updateZaloFormApi.replace("{formId}", formId)}`,
        body
    );
    if (response.data.code !== 0) {
        toast.error(response.data.message);
    }
    return response.data;
}

export async function getChatbotList(orgId: string) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.get(connectionPaths.getChatBotListApi);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function updateStatusChatBot(
    orgId: string,
    trainId: string,
    data: any
) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.patch(
            `${connectionPaths.updateStatusChatbotApi.replace(
                "{chatbotId}",
                trainId
            )}`,
            data
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function editChatBot(orgId: string, trainId: string, data: any) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.patch(
            `${connectionPaths.updateChatBotApi.replace(
                "{chatbotId}",
                trainId
            )}`,
            data
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function createChatBot(orgId: string, data: any) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(
            connectionPaths.createChatBotApi,
            data
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteChatBot(orgId: string, trainId: string) {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.delete(
            `${connectionPaths.deleteChatBotApi.replace(
                "{chatbotId}",
                trainId
            )}`
        );
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteAttachment(
    orgId: string,
    leadId: string,
    journeyId: string
) {
    const api = createApiCall(orgId);
    const response: any = await api.delete(
        `${pathsV2.deleteAttachment
            .replace("{leadId}", leadId)
            .replace("{journeyId}", journeyId)}`
    );
    return response.data;
}

export async function updateLeadAssignee(
    orgId: string,
    leadId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        `${pathsV2.updateLeadAssignee.replace("{leadId}", leadId)}`,
        body
    );
    return response.data;
}

export async function updateLeadFollower(
    orgId: string,
    leadId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        `${pathsV2.updateLeadFollower.replace("{leadId}", leadId)}`,
        body
    );
    return response.data;
}

export async function bulkArchiveLead(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response: any = await api.post(`${pathsV2.bulkArchiveLead}`, body);
    return response.data;
}

export async function bulkArchiveRestoreLead(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response: any = await api.post(
        `${pathsV2.bulkArchiveRestoreLead}`,
        body
    );
    return response.data;
}

export async function bulkDeleteLead(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response: any = await api.post(`${pathsV2.bulkDeleteLead}`, body);
    return response.data;
}

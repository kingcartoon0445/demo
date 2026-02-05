import { createApiCall } from "@/lib/api";
import { pathsV2 } from "@/lib/authConstants";

export const getChannelStatus = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response = await api.get(pathsV2.channelStatus);
    return response.data;
};

export const linkToLead = async (
    orgId: string,
    conversationId: string,
    data: any
) => {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.linkToLead.replace("{conversationId}", conversationId),
        data
    );
    return response.data;
};

export const linkToCustomer = async (
    orgId: string,
    conversationId: string,
    data: any
) => {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.linkToCustomer.replace("{conversationId}", conversationId),
        data
    );
    return response.data;
};

export async function unlinkToCustomer(orgId: string, conversationId: string) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.unlinkToCustomer.replace("{conversationId}", conversationId)
    );
    return response.data;
}

export async function unlinkToLead(orgId: string, conversationId: string) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.unlinkToLead.replace("{conversationId}", conversationId)
    );
    return response.data;
}

export async function getDetailConversation(
    orgId: string,
    conversationId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        pathsV2.getDetailConversation.replace(
            "{conversationId}",
            conversationId
        )
    );
    return response.data;
}

import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function tiktokLeadAuth(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.tiktokLeadAuthApi, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getTiktokFormList(orgId, accountId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${paths.getTiktokFormListApi}?organizationId=${orgId}&SubscribedId=${accountId}&IsConnect=${params}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getTiktokFormListConnected(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.getTiktokFormListConnectedApi, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getTiktokFormDetail(orgId, id, connectionId, pageId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${paths.getTiktokFormDetailApi.replace(
                "{id}",
                id
            )}?connectionId=${connectionId}&pageId=${pageId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createTiktokForm(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.createTiktokFormApi, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateTiktokForm(orgId, workspaceId, formId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.updateTiktokFormApi}${formId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateTiktokFormStatus(orgId, formId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.updateTiktokFormStatusApi.replace("{formId}", formId)}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteTiktokForm(orgId, formId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.deleteTiktokFormApi.replace("{formId}", formId)}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

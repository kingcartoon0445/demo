import { blockPaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getBlockList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(blockPaths.blockList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getBlockDetail(orgId, workspaceId, blockId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(`${blockPaths.blockDetail}${blockId}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createBlock(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(blockPaths.blockCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateBlock(orgId, workspaceId, blockId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${blockPaths.blockUpdate}${blockId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteBlock(orgId, workspaceId, blockId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${blockPaths.blockDelete}${blockId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateBlockStatus(orgId, workspaceId, blockId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${blockPaths.blockUpdateStatus}${blockId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function duplicateBlock(orgId, workspaceId, blockId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${blockPaths.blockDuplicate}${blockId}/duplicate`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getBlockCategories(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(blockPaths.blockCategories, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getBlockTemplates(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(blockPaths.blockTemplates, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createBlockFromTemplate(
    orgId,
    workspaceId,
    templateId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${blockPaths.blockFromTemplate}${templateId}/create`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function publishBlock(orgId, workspaceId, blockId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${blockPaths.blockPublish}${blockId}/publish`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function unpublishBlock(orgId, workspaceId, blockId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${blockPaths.blockUnpublish}${blockId}/unpublish`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

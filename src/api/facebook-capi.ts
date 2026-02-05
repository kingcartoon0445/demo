import { createApiCall } from "@/lib/api";
import { capiPaths } from "@/lib/authConstants";

export async function getAllDataset(orgId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(capiPaths.getAllDataset);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getDetailDataset(orgId: string, datasetId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            capiPaths.getDetailDataset.replace("{datasetId}", datasetId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getDatasetEvent(orgId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(capiPaths.getDatasetEvent);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createDataset(orgId: string, body: any) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(capiPaths.createDataset, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateDataset(
    orgId: string,
    datasetId: string,
    body: any
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            capiPaths.updateDataset.replace("{datasetId}", datasetId),
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateDatasetAccessToken(
    orgId: string,
    datasetId: string,
    body: any
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            capiPaths.updateDatasetAccessToken.replace(
                "{datasetId}",
                datasetId
            ),
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteDataset(orgId: string, datasetId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            capiPaths.deleteDataset.replace("{datasetId}", datasetId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateDatasetStatus(
    orgId: string,
    datasetId: string,
    body: any
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            capiPaths.updateDatasetStatus.replace("{datasetId}", datasetId),
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function activateDatasetOnDeal(
    orgId: string,
    datasetId: string,
    body: any
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            capiPaths.activateDatasetOnDeal.replace("{datasetId}", datasetId),
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function activateDatasetOnLead(
    orgId: string,
    datasetId: string,
    body: any
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            capiPaths.activateDatasetOnLead.replace("{datasetId}", datasetId),
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getWorkspaceConfigDetail(
    orgId: string,
    datasetId: string,
    workspaceId: string
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            capiPaths.getWorkspaceConfigDetail
                .replace("{datasetId}", datasetId)
                .replace("{workspaceId}", workspaceId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteWorkspaceConfig(
    orgId: string,
    datasetId: string,
    workspaceId: string
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            capiPaths.deleteWorkspaceConfig
                .replace("{datasetId}", datasetId)
                .replace("{workspaceId}", workspaceId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getDatasetWorkspaces(orgId: string, datasetId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            capiPaths.getDatasetWorkspaces.replace("{datasetId}", datasetId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createWorkspaceConfig(orgId: string, body: any) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(capiPaths.createWorkspaceConfig, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function mappingDatasetEvents(orgId: string, body: any) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(capiPaths.mappingDatasetEvents, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteMappingDatasetEvents(
    orgId: string,
    eventId: string
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            capiPaths.deleteMappingDatasetEvents.replace("{eventId}", eventId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getMappingDatasetEvents(orgId: string, eventId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            capiPaths.getMappingDatasetEvents.replace("{eventId}", eventId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function datasetForWorkspace(orgId: string, datasetId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            capiPaths.datasetForWorkspace.replace("{datasetId}", datasetId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getAllDatasetEvents(orgId: string) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(capiPaths.getAllDatasetEvents);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteEvent(
    orgId: string,
    eventId: string,
    workspaceId: string,
    datasetId: string
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            capiPaths.deleteEvent
                .replace("{eventId}", eventId)
                .replace("{workspaceId}", workspaceId)
                .replace("{datasetId}", datasetId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteAllEvents(
    orgId: string,
    datasetId: string,
    workspaceId: string
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            capiPaths.deleteAllEvents
                .replace("{datasetId}", datasetId)
                .replace("{workspaceId}", workspaceId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function resetEvents(
    orgId: string,
    datasetId: string,
    workspaceId: string
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            capiPaths.resetEvents
                .replace("{datasetId}", datasetId)
                .replace("{workspaceId}", workspaceId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

import { createApiCall } from "@/lib/api";
import { pathsV2 } from "@/lib/authConstants";

export async function updateStage(orgId: string, stageId: string, data: any) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        pathsV2.updateStage.replace("{id}", stageId),
        data
    );
    return response.data;
}

export async function deleteStage(
    orgId: string,
    stageId: string,
    targetId?: string
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.updateStage.replace("{id}", stageId),
        { targetId }
    );
    return response.data;
}

export async function updateStageIndex(orgId: string, data: any) {
    const api = createApiCall(orgId);
    const response = await api.patch(pathsV2.updateStageIndex, data);
    return response.data;
}

import { createApiCall } from "@/lib/api";
import { pathsV2 } from "@/lib/authConstants";
import { ApiResponse, DealStage } from "@/lib/interface";

export async function getDealStages(
    orgId: string,
    workspaceId: string
): Promise<ApiResponse<DealStage[]>> {
    const api = createApiCall(orgId);
    const response = await api.get(pathsV2.dealStages, {
        params: {
            workspaceId,
        },
    });
    return response.data as ApiResponse<DealStage[]>;
}

export async function convertToDeal(
    orgId: string,
    workspaceId: string,
    cid: string,
    data: any
) {
    const api = createApiCall(orgId, workspaceId);
    const response = await api.post(
        pathsV2.convertToDeal.replace("{id}", cid),
        data
    );
    return response.data as ApiResponse<DealStage[]>;
}

export async function updateFlowStep(orgId: string, cid: string, body: any) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.updateFlowStep.replace("{id}", cid),
        body
    );
    return response.data;
}

export async function createDeal(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.createDeal, body);
    return response.data;
}

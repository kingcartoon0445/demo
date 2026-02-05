import { automationPathsV2 } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getEvictionRuleListV2(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response = await api.get(automationPathsV2.getEvictionRuleList, body);
    return response.data;
}

export async function createEvictionRuleV2(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response = await api.post(automationPathsV2.createEvictionRule, body);
    return response.data;
}

export async function updateEvictionRuleV2(
    orgId: string,
    ruleId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        automationPathsV2.updateEvictionRule.replace("{ruleId}", ruleId),
        body
    );
    return response.data;
}

export async function deleteEvictionRuleV2(orgId: string, ruleId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        automationPathsV2.deleteEvictionRule.replace("{ruleId}", ruleId)
    );
    return response.data;
}

export async function updateStatusEvictionRuleV2(
    orgId: string,
    ruleId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        automationPathsV2.updateStatusEvictionRule.replace("{ruleId}", ruleId),
        body
    );
    return response.data;
}

export async function getDetailEvictionRuleV2(orgId: string, ruleId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(
        automationPathsV2.getDetailEvictionRule.replace("{ruleId}", ruleId)
    );
    return response.data;
}

export async function getAssignRatioListV2(orgId: string, params: any) {
    const api = createApiCall(orgId);
    const response = await api.get(automationPathsV2.getAssignRatioList, {
        params,
    });
    return response.data;
}

export async function createAssignRatioV2(orgId: string, body: any) {
    const api = createApiCall(orgId);
    const response = await api.post(automationPathsV2.createAssignRatio, body);
    return response.data;
}

export async function updateAssignRatioV2(
    orgId: string,
    ruleId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        automationPathsV2.updateAssignRatio.replace("{ruleId}", ruleId),
        body
    );
    return response.data;
}

export async function deleteAssignRatioV2(orgId: string, ruleId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        automationPathsV2.deleteAssignRatio.replace("{ruleId}", ruleId)
    );
    return response.data;
}

export async function getDetailAssignRatioV2(orgId: string, ruleId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(
        automationPathsV2.getDetailAssignRatio.replace("{ruleId}", ruleId)
    );
    return response.data;
}

export async function updateStatusAssignRatioV2(
    orgId: string,
    ruleId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        automationPathsV2.updateStatusAssignRatio.replace("{ruleId}", ruleId),
        body
    );
    return response.data;
}

export async function updateDistributionTargetV2(
    orgId: string,
    routingId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        automationPathsV2.updateDistributionTarget.replace(
            "{routingId}",
            routingId
        ),
        body
    );
    return response.data;
}

export async function getAllRulesV2(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(automationPathsV2.getAllRules);
    return response.data;
}

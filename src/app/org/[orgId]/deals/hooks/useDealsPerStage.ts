import { useDeals } from "@/hooks/useCustomerV2";

export function useDealsPerStageGroup(
    orgId: string,
    workspaceId: string,
    stageGroupIds: string[],
    enabled: boolean
) {
    const results = stageGroupIds.map((id) =>
        useDeals(
            orgId,
            { workspaceIds: workspaceId, stageGroupIds: [id] },
            enabled
        )
    );

    const dealsByGroup: Record<string, any[]> = {};
    let isLoading = false;

    stageGroupIds.forEach((id, index) => {
        const { data, isLoading: loading } = results[index];
        isLoading = isLoading || loading;
        dealsByGroup[id] = Array.isArray(data?.content)
            ? data.content
            : [data?.content].filter(Boolean);
    });

    return { dealsByGroup, isLoading };
}

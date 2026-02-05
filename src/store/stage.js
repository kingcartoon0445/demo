import { create } from "zustand";
import { getStageList, getHiddenStagesAndGroups } from "@/api/workspace";

export const useStageStore = create((set, get) => ({
    stages: [],
    stageGroups: [],
    hiddenStages: [],
    hiddenGroups: [],
    loading: false,
    error: null,

    fetchStages: async (orgId, workspaceId) => {
        try {
            set({ loading: true, error: null });
            const response = await getStageList(orgId, workspaceId);

            if (response?.content) {
                // Tổ chức dữ liệu theo nhóm
                const groupedStages = response.content.reduce((acc, stage) => {
                    const group = stage.stageGroup;
                    if (!acc[group.id]) {
                        acc[group.id] = {
                            ...group,
                            stages: [],
                        };
                    }
                    acc[group.id].stages.push(stage);
                    return acc;
                }, {});

                set({
                    stages: response.content,
                    stageGroups: Object.values(groupedStages),
                    loading: false,
                });

                // Sau khi tải stages, tải cấu hình ẩn hiện
                // await get().fetchHiddenStages(orgId, workspaceId);
            }
        } catch (error) {
            console.error("Error fetching stages:", error);
            set({ error: error.message, loading: false });
        }
    },

    fetchHiddenStages: async (orgId, workspaceId) => {
        try {
            const response = await getHiddenStagesAndGroups(orgId, workspaceId);

            if (response) {
                set({
                    hiddenStages: response.hiddenStages || [],
                    hiddenGroups: response.hiddenGroups || [],
                });
            }
        } catch (error) {
            console.error("Error fetching hidden stages:", error);
            // Không set lỗi vì đây là tính năng phụ
        }
    },

    isStageHidden: (stageId) => {
        const { hiddenStages } = get();
        return hiddenStages.includes(stageId);
    },

    isGroupHidden: (groupId) => {
        const { hiddenGroups } = get();
        return hiddenGroups.includes(groupId);
    },
}));

import { TaskColumnConfig } from "@/interfaces/config";
import { createApiCall } from "@/lib/api";
import { configPaths } from "@/lib/authConstants";

export const getTaskColumnConfig = async (orgId: string) => {
    const api = createApiCall(orgId);
    const response = await api.get(configPaths.config + "/task-columns");
    return response.data;
};

export const updateTaskColumnConfig = async (
    orgId: string,
    config: TaskColumnConfig
) => {
    const api = createApiCall(orgId);
    const response = await api.post(
        configPaths.config + "/task-columns",
        config
    );
    return response.data;
};

import { createApiCall } from "@/lib/api";
import { emailPaths, pathsV2 } from "@/lib/authConstants";
import { ApiResponse, UtmSource } from "@/lib/interface";

export async function getOrgUtmSource(
    orgId: string
): Promise<ApiResponse<UtmSource[]>> {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(pathsV2.categoryUtmSource);
        return response.data as ApiResponse<UtmSource[]>;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function sendEmail(orgId: string, data: any) {
    const api = createApiCall(orgId);
    const response = await api.post(emailPaths.sendEmail, data);
    return response.data;
}

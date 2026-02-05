import { variablePaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getLeadVariables() {
    const api = createApiCall();
    const response = await api.get(variablePaths.leadVariables);
    return response.data;
}

export async function getCustomerVariables() {
    const api = createApiCall();
    const response = await api.get(variablePaths.customerVariables);
    return response.data;
}

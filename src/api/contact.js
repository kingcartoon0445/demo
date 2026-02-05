import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export const getContactFields = async () => {
    try {
        const response = await fetch("https://dev.coka.ai/json/contact.json");
        if (!response.ok) {
            throw new Error("Failed to fetch contact fields");
        }
        const data = await response.json();
        return data.columns.map((column) => ({
            id: column.name,
            name: column.alias,
        }));
    } catch (error) {
        console.error("Error fetching contact fields:", error);
        return [];
    }
};

export async function getCurrentManagerList(orgId, workspaceId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.customerUserCurrentManagerList);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

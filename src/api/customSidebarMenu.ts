import { createApiCall } from "@/lib/api";
import { customSidebarMenuPaths } from "@/lib/authConstants";

export type SidebarMenuItem = {
    id: string;
    name: string;
    displayName?: string;
    displayNameEn?: string;
    displayNameVi?: string;
    icon?: string;
    url?: string;
    orderIndex?: number;
    isActive?: boolean;
    isVisible?: boolean;
    permissions?: string[];
    children?: SidebarMenuItem[];
};

export type ApiResponse<T> = {
    success: boolean;
    message: unknown | null;
    data: T;
    pagination?: unknown | null;
};

export async function getCustomSidebarMenu(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.get<ApiResponse<SidebarMenuItem[]>>(
        customSidebarMenuPaths.getTree
    );
    return response.data as ApiResponse<SidebarMenuItem[]>;
}

export async function updateCustomSidebarMenu(orgId: string, data: object) {
    const api = createApiCall(orgId);
    const response = await api.put(customSidebarMenuPaths.updateTree, data);
    return response.data;
}

export async function resetToDefaultCustomSidebarMenu(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.post(customSidebarMenuPaths.resetToDefault, {
        organizationId: orgId,
    });
    return response.data;
}

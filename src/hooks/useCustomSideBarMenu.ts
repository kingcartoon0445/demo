import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getCustomSidebarMenu,
    updateCustomSidebarMenu,
    resetToDefaultCustomSidebarMenu,
    type ApiResponse,
    type SidebarMenuItem,
} from "@/api/customSidebarMenu";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export function useCustomSidebarMenu(orgId: string) {
    return useQuery<ApiResponse<SidebarMenuItem[]>>({
        queryKey: ["customSidebarMenu", orgId],
        queryFn: () => getCustomSidebarMenu(orgId),
        enabled: !!orgId,
    });
}

export function useUpdateCustomSidebarMenu(orgId: string) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (data: object) => updateCustomSidebarMenu(orgId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["customSidebarMenu", orgId],
            });
            toast.success(t("common.updateSidebarMenuSuccess"));
        },
        onError: (error) => {
            console.error("Error updating custom sidebar menu:", error);
            toast.error(t("common.updateSidebarMenuFailed"));
        },
    });
}

export function useResetCustomSidebarMenu(orgId: string) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: () => resetToDefaultCustomSidebarMenu(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["customSidebarMenu", orgId],
            });
            toast.success(t("common.resetSidebarMenuSuccess"));
        },
        onError: (error) => {
            console.error("Error resetting custom sidebar menu:", error);
            toast.error(t("common.resetSidebarMenuFailed"));
        },
    });
}

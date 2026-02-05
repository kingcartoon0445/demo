import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrgUtmSource } from "@/api/orgV2";
import { UtmSource, ApiResponse } from "@/lib/interface";
import { getOrgDetail, getOrgUsageStatistics } from "@/api/org";
import {
    updateWorkspace as updateWorkspaceV2,
    deleteWorkspace,
} from "@/api/workspace";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    deletePermissionGroup,
    deletePermissionGroupNew,
    removeMemberFromGroup,
    updateGroupName,
} from "@/api/permission_group";

export function useOrgUtmSource(orgId: string) {
    return useQuery<ApiResponse<UtmSource[]>, Error>({
        queryKey: ["org-utm-source", orgId],
        queryFn: () => getOrgUtmSource(orgId),
        enabled: !!orgId,
    });
}

export function useOrgUsageStatistics(orgId: string) {
    return useQuery({
        queryKey: ["org-usage-statistics", orgId],
        queryFn: () => getOrgUsageStatistics(orgId),
        enabled: !!orgId,
    });
}

export function useUpdateWorkspace(
    orgId: string,
    workspaceId: string,
    showToast: boolean = false,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateWorkspaceV2(orgId, workspaceId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["allWorkspaces", orgId],
                });
                if (showToast) {
                    toast.success(t("success.updateWorkspace"));
                }
            } else {
                if (showToast) {
                    toast.error(res.message);
                }
            }
        },
        onError: (error) => {
            if (showToast) {
                toast.error(t("error.updateWorkspace"));
            }
            console.error("Error updating workspace:", error);
        },
    });
}

export function useDeleteWorkspace(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (workspaceId: string) =>
            deleteWorkspace(orgId, workspaceId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["allWorkspaces", orgId],
                    exact: false,
                });
                queryClient.invalidateQueries({
                    queryKey: ["org-usage-statistics", orgId],
                }); // Update usage stats ideally
                toast.success(t("success.deleteWorkspace"));
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteWorkspace"));
            console.error("Error deleting workspace:", error);
        },
    });
}

export function useRemoveMemberFromGroup(
    orgId: string,
    groupId: string,
    workspaceId: string | null = null,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profileId: string) =>
            removeMemberFromGroup(
                orgId,
                groupId,
                profileId,
                workspaceId as any,
            ),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.removedFromGroup"));
                queryClient.invalidateQueries({
                    queryKey: [
                        "permissionGroupMembers",
                        orgId,
                        groupId,
                        workspaceId,
                    ],
                });
                queryClient.invalidateQueries({
                    queryKey: ["permissionGroups", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.removedFromGroup"));
            console.error("Error removing member from group:", error);
        },
    });
}

export function useDeletePermissionGroup(orgId: string, groupId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deletePermissionGroupNew(orgId, groupId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.deletedGroup"));
                queryClient.invalidateQueries({
                    queryKey: ["permissionGroups", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deletedGroup"));
            console.error("Error deleting group:", error);
        },
    });
}

export function useUpdateGroupName(orgId: string, groupId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateGroupName(orgId, groupId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updatedGroupName"));
                queryClient.invalidateQueries({
                    queryKey: ["permissionGroups", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updatedGroupName"));
            console.error("Error updating group name:", error);
        },
    });
}

export function useGetOrgDetail(orgId: string) {
    return useQuery({
        queryKey: ["org-detail", orgId],
        queryFn: () => getOrgDetail(orgId),
        enabled: !!orgId,
        staleTime: 0,
    });
}

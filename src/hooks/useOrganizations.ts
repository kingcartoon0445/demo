import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getOrgList,
    getOrgAllMembers,
    getUserProfile,
    getAllWorkspaces,
    searchMemberToInv,
    invMemberToOrg,
    unJoinedWorkspace,
    leaveOrg,
    leaveWorkspace,
    getOrgUsageStatistics,
} from "@/api/org";
import { getStageList, getWorkspaceList } from "@/api/workspace";
import { getAccessToken } from "@/lib/authCookies";
import {
    getPermissionGroups,
    getPermissionGroupRoles,
    getPermissionList,
} from "@/api/permission_group";
import { getUserWorkspaceRoles } from "@/api/user";
import { removeWorkspaceMember } from "@/api/workspace";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";
import { ApiResponse, DealStage } from "@/lib/interface";
import { searchMembers } from "@/api/memberV2";

export function useOrganizations() {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["organizations"],
        queryFn: getOrgList,
        enabled: !!getAccessToken(),
        staleTime: 0, // 5 minutes
    });
}

export function useOrgMembers(orgId: string) {
    return useQuery({
        queryKey: ["orgMembers", orgId],
        queryFn: () => getOrgAllMembers(orgId),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useUserProfile(profileId: string, orgId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["userProfile", profileId],
        queryFn: () => getUserProfile(profileId, orgId),
        enabled: !!profileId && !!getAccessToken(),
        staleTime: 0, // 5 minutes
    });
}

export function usePermissionGroups(orgId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["permissionGroups", orgId],
        queryFn: () => getPermissionGroups(orgId),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function usePermissionGroupRoles(
    orgId: string,
    groupId: string,
    workspaceIds?: string[],
    roleOrganization = false
) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: [
            "permissionGroupRoles",
            orgId,
            groupId,
            workspaceIds,
            roleOrganization,
        ],
        queryFn: () =>
            getPermissionGroupRoles(
                orgId,
                groupId,
                workspaceIds,
                roleOrganization
            ),
        enabled: !!orgId && !!groupId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000,
    });
}

export function useUserWorkspaceRoles(orgId: string, profileId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["userWorkspaceRoles", orgId, profileId],
        queryFn: () => getUserWorkspaceRoles(orgId, profileId),
        enabled: !!orgId && !!profileId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useAllWorkspaces(orgId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["allWorkspaces", orgId],
        queryFn: () => getAllWorkspaces(orgId),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 0, // 5 minutes
    });
}

export function useWorkspaceList(orgId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["allWorkspaces", orgId],
        queryFn: () => getWorkspaceList(orgId, { limit: 1000 }),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 0, // 5 minutes
    });
}

export function useUnJoinedWorkspace(orgId: string, profileId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["unJoinedWorkspace", orgId, profileId],
        queryFn: () => unJoinedWorkspace(orgId, profileId),
        enabled: !!orgId && !!profileId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useSearchMember(orgId: string, search: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["searchMember", orgId, search],
        queryFn: () =>
            searchMembers(orgId, { searchText: search, offset: 0, limit: 20 }),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useInviteMember(orgId: string, profileId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["inviteMember", orgId, profileId],
        queryFn: () => invMemberToOrg(profileId, orgId),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function usePermissionList(orgId: string) {
    const { t } = useLanguage();
    return useQuery({
        queryKey: ["permissionList", orgId],
        queryFn: () => getPermissionList(orgId, { limit: 1000, offset: 0 }),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 0, // 5 minutes
    });
}

export function useRemoveMemberFromOrg(
    orgId: string,
    workspaceId: string,
    profileId: string
) {
    const { t } = useLanguage();
    return useMutation({
        mutationFn: () => removeWorkspaceMember(orgId, workspaceId, profileId),
    });
}

export function useLeaveOrg() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgId }: { orgId: string }) => leaveOrg(orgId),
        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["organizations"],
                });
                toast.success(t("common.leavedOrg"));
            } else {
                toast.error(res.message);
            }
        },
        onError: () => {
            toast.error(t("common.leavedOrgError"));
        },
    });
}

export function useLeaveWorkspace() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            orgId,
            workspaceId,
        }: {
            orgId: string;
            workspaceId: string;
        }) => leaveWorkspace(orgId, workspaceId),

        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["allWorkspaces", variables.orgId],
                });
                toast.success(t("common.leavedWorkspace"));
            } else {
                toast.error(res.message);
            }
        },
        onError: () => {
            toast.error(t("common.leavedWorkspaceError"));
        },
    });
}

export function useOrgUsageStatistics(orgId: string) {
    return useQuery({
        queryKey: ["org-usage-statistics", orgId],
        queryFn: () => getOrgUsageStatistics(orgId),
        enabled: !!orgId && !!getAccessToken(),
        staleTime: 0,
    });
}

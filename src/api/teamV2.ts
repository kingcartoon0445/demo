import { createApiCall } from "@/lib/api";
import paths, { teamPathsV2 } from "@/lib/authConstants";

export async function getTeamListV2(orgId: string, params: any) {
    const api = createApiCall(orgId);
    const response = await api.get(teamPathsV2.getTeamList, { params });
    return response.data;
}

export async function getTeamList(orgId: string, params: any) {
    const api = createApiCall(orgId);
    const response = await api.get(teamPathsV2.getAllTeams, { params });
    return response.data;
}

export async function createTeamV2(
    orgId: string,
    workspaceId: string,
    body: any
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(`${teamPathsV2.createTeam}`, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteTeamV2(
    orgId: string,
    workspaceId: string,
    teamId: string
) {
    const api = createApiCall(orgId, workspaceId);
    const response = await api.delete(
        `${teamPathsV2.deleteTeam.replace("{teamId}", teamId)}`
    );
    return response.data;
}

export async function updateTeamV2(
    orgId: string,
    workspaceId: string,
    teamId: string,
    body: any
) {
    const api = createApiCall(orgId, workspaceId);
    const response = await api.patch(
        `${teamPathsV2.updateTeam.replace("{teamId}", teamId)}`,
        body
    );
    return response.data;
}

export async function getMemberListFromTeamIdV2(orgId: string, teamId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(
        teamPathsV2.getMember.replace("{teamId}", teamId)
    );
    return response.data;
}

export async function addMemberToTeam(
    orgId: string,
    teamId: string,
    body: any
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        teamPathsV2.addMemberToTeam.replace("{teamId}", teamId),
        body
    );
    return response.data;
}

export async function deleteManagerFromTeam(
    orgId: string,
    teamId: string,
    profileId: string
) {
    try {
        const res = await fetch(
            `${teamPathsV2.deleteManagerFromTeam
                .replace("{teamId}", teamId)
                .replace("{profileId}", profileId)}`,
            {
                method: "DELETE",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify({ profileId }),
            }
        );
        if (res.status !== 200) {
            return {
                message: "Error deleting manager from team",
                status: -1,
            };
        }
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error deleting manager from team:", error);
        throw error;
    }
}

export async function deleteMemberFromTeam(
    orgId: string,
    teamId: string,
    profileId: string
) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        teamPathsV2.deleteMemberFromTeam
            .replace("{teamId}", teamId)
            .replace("{profileId}", profileId)
    );
    return response.data;
}

export async function getAvailableMembers(
    orgId: string,
    teamId: string,
    page: number,
    searchText: string
) {
    try {
        const api = createApiCall(orgId);

        const res = await api.get(
            teamPathsV2.getAvailableMembers.replace("{teamId}", teamId),
            { params: { searchText, offset: page * 20, limit: 1000 } }
        );
        return res.data;
    } catch (error) {
        console.log(error);
    }
}

export async function updateTeamMemberRole(
    orgId: string,
    teamId: string,
    profileId: string,
    role: string
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        teamPathsV2.updateTeamMemberRole
            .replace("{teamId}", teamId)
            .replace("{profileId}", profileId),
        { role }
    );
    return response.data;
}

export async function updateManagerInTeam(
    orgId: string,
    teamId: string,
    profileId: string
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        teamPathsV2.updateManagerInTeam.replace("{teamId}", teamId),
        { profileId }
    );
    return response.data;
}

export async function getTeams(orgId: string, params: any) {
    const api = createApiCall(orgId);
    const response = await api.get(teamPathsV2.getTeams, { params });
    return response.data;
}

export async function getTeamMemberships(orgId: string, teamId: string, params?: any) {
    const api = createApiCall(orgId);
    const response = await api.get(
        teamPathsV2.getTeamMemberships.replace("{teamId}", teamId),
        { params }
    );
    return response.data;
}

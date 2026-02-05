import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getTeamMemberList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${paths.customerApi}team/user/getlistpaging`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getUserCurrentManagerList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.customerUserCurrentManagerList, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getMemberListFromTeamId(
    orgId,
    workspaceId,
    teamId,
    params
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${paths.customerApi}team/${teamId}/user/getlistpaging`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getTeamList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${paths.customerApi}team/getlistpaging`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createTeam(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(`${paths.teamApi}/create`, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateTeam(orgId, workspaceId, teamId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.put(
            `${paths.teamApi}/update/${teamId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteTeam(orgId, workspaceId, teamId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(`${paths.teamApi}/delete/${teamId}`, {
            data: body,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addMember2Team(orgId, workspaceId, teamId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.teamApi}/${teamId}/user/add`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteMemberFromTeam(
    orgId,
    workspaceId,
    teamId,
    profileId
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.teamApi}/${teamId}/user/${profileId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateMemberRole(
    orgId,
    workspaceId,
    teamId,
    profileId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.teamApi}/${teamId}/user/${profileId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateTeamMemberRole(orgId, workspaceId, teamId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.teamApi}/${teamId}/user/role`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addLeader(orgId, workspaceId, teamId, profileId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.teamApi}/${teamId}/leader/${profileId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteLeader(orgId, workspaceId, teamId, profileId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.teamApi}/${teamId}/leader/${profileId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getRecall(orgId, workspaceId, teamId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(`${paths.teamApi}/${teamId}/recall/get`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateRouting(orgId, workspaceId, teamId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.teamApi}/${teamId}/recall/update`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

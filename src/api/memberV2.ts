import { memberPathsV2 } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";
import toast from "react-hot-toast";

export const searchMembers = async (
    orgId: string,
    params: Record<string, any>
) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.get(`${memberPathsV2.searchMembers}`, {
            params,
        });
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        toast.error(error.message);
        return null;
    }
};

export const acceptRequest = async (orgId: string, requestId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(
            memberPathsV2.acceptRequest.replace("{requestId}", requestId)
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const rejectRequest = async (orgId: string, requestId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(
            memberPathsV2.rejectRequest.replace("{requestId}", requestId)
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const getInvitationList = async (orgId: string, type: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.get(
            `${memberPathsV2.getInvitationList}?status=2&type=${type}`
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const inviteMembers = async (orgId: string, profileId: string) => {
    try {
        const body = {
            profileId,
        };
        const api = createApiCall(orgId);
        const response: any = await api.post(memberPathsV2.inviteMembers, body);
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const cancelInvitation = async (orgId: string, inviteId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.delete(
            memberPathsV2.cancelInvitation.replace("{inviteId}", inviteId)
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const searchOrganization = async (params: Record<string, any>) => {
    try {
        const api = createApiCall();
        const response: any = await api.get(
            `${memberPathsV2.searchOrganization}?${new URLSearchParams(
                params
            ).toString()}`
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const acceptInvitation = async (orgId: string, inviteId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(
            memberPathsV2.acceptInvitation.replace("{inviteId}", inviteId)
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const rejectInvitation = async (orgId: string, inviteId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(
            memberPathsV2.rejectInvitation.replace("{inviteId}", inviteId)
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const getRequestList = async (orgId: string, type: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.get(
            `${memberPathsV2.getRequestList}?type=${type}`
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const sendRequest = async (orgId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.post(memberPathsV2.sendRequest);
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

export const cancelRequest = async (orgId: string, requestId: string) => {
    try {
        const api = createApiCall(orgId);
        const response: any = await api.delete(
            memberPathsV2.cancelRequest.replace("{requestId}", requestId)
        );
        if (response.data?.code !== 0) {
            toast.error(response.data?.message);
        }
        return response.data;
    } catch (error: any) {
        console.error(error.message);
        return null;
    }
};

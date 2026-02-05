import paths from "@/lib/authConstants";
import { createApiCall, apiMethods } from "@/lib/api";

export async function loginApi(userName) {
    try {
        const response = await apiMethods.post(paths.login, { userName });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function verifyOtp(otpId, code) {
    try {
        const response = await apiMethods.post(paths.verifyOtp, {
            otpId,
            code,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function resendOtp(otpId) {
    try {
        const response = await apiMethods.post(paths.resendOtp, { otpId });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function refreshTokenApi() {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        // Using axios directly to avoid circular dependency with api.ts
        const api = createApiCall();
        const response = await api.post(paths.refreshToken, {
            refreshToken,
        });
        return response.data;
    } catch (error) {
        console.log("Error refreshing token:", error);
        throw error;
    }
}

export async function getProfile(orgId) {
    try {
        const response = await apiMethods.get(paths.getProfile, {
            headers: {
                organizationId: orgId,
            },
        });
        return response.data.content;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function socialLogin(accessToken, provider) {
    try {
        const response = await apiMethods.post(paths.socialLogin, {
            accessToken,
            provider,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

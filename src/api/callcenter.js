import { createApiCall } from "@/lib/api";
import { callcenterPaths, paymentPaths } from "@/lib/authConstants";

// Lấy danh sách gói thuê bao
export async function getCallcenterPackages(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.callcenterPackage, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function activeCallcenterPackage(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            paymentPaths.callcenterActivePackage,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterUsageStatistics(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            callcenterPaths.callcenterUsageStatistics,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterMembers(orgId, packageUsageId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcenterMembers}${packageUsageId}/getlistmember`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addRemoveCallcenterMember(orgId, packageUsageId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            `${callcenterPaths.callcenterMembers}${packageUsageId}/addorremoveuser`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function renewCallcenterPackage(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            paymentPaths.callcenterRenewPackage,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterRenewInfo(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.callcenterRenewInfo, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function callcenterSlotBuy(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paymentPaths.callcenterSlotBuy, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function callcenterSlotBuyCheck(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            paymentPaths.callcenterSlotBuyCheck,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function callcenterTracking(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            callcenterPaths.callcenterTracking,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterUserLine(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(callcenterPaths.callcenterUserLine);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterLineList(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(callcenterPaths.callcenterLineList);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Report functions
export async function getCallcenterReportHistory(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            callcenterPaths.callcenterReportHistory,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterReportByDate(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(callcenterPaths.callcenterReportByDate, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterRankByCredit(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(callcenterPaths.callcenterRankByCredit, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterRankByDuration(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            callcenterPaths.callcenterRankByDuration,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterRankByAnswer(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(callcenterPaths.callcenterRankByAnswer, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterReportByDirection(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            callcenterPaths.callcenterReportByDirection,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterReportByCredit(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            callcenterPaths.callcenterReportByCredit,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcenterReportByProvider(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            callcenterPaths.callcenterReportByProvider,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Campaign functions
export async function getCallcampaignList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(callcenterPaths.callcampaignList, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createCallcampaign(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            callcenterPaths.callcampaignCreate,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignDetail(orgId, camId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignDetail}${camId}/getdetail`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateCallcampaign(orgId, camId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${callcenterPaths.callcampaignUpdate}${camId}/update`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateCallcampaignContent(orgId, camId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${callcenterPaths.callcampaignUpdateContent}${camId}/updatecontent`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateCallcampaignStatus(orgId, camId, status) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${callcenterPaths.callcampaignUpdateStatus}${camId}/updatestatus`,
            { status }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignReport(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignReport}${camId}/summary`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignHistory(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignReport}${camId}/history`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignReportByDate(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignReport}${camId}/callbydate`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignReportByStage(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignReport}${camId}/statisticsbystage`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignRankByUser(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignReport}${camId}/rankbyuser`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignNextPhone(orgId, camId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignGetNextPhone}${camId}/autocall/getcontact`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignNextPhoneQueue(orgId, camId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignGetNextPhone}${camId}/autocall/contact/getlist`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCallcampaignContactList(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${callcenterPaths.callcampaignContact}${camId}/contact/getlist`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addCallcampaignContact(orgId, camId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            `${callcenterPaths.callcampaignContact}${camId}/contact/add`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removeCallcampaignContact(orgId, camId, contactId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${callcenterPaths.callcampaignContact}${camId}/contact/${contactId}/remove`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removeCallcampaignContacts(orgId, camId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${callcenterPaths.callcampaignContact}${camId}/contact/remove`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateContactStage(orgId, camId, contactId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${callcenterPaths.callcampaignContact}${camId}/contact/${contactId}/updatestage`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

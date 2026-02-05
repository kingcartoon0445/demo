import { createApiCall } from "@/lib/api";
import paths, { pathsV2 } from "@/lib/authConstants";
export async function getCustomersList(
    orgId,
    workspaceId,
    page,
    searchText,
    stageGroupId,
    startDate,
    endDate,
    categoryList,
    sourceList,
    rating,
    stage,
    tags,
    assignTo,
    teamId,
    signal,
    limit = 20,
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.customersList, {
            params: {
                searchText,
                stageGroupId,
                offset: page * 20,
                limit,
                startDate,
                endDate,
                categoryList,
                sourceList,
                rating,
                stage,
                tags,
                assignTo,
                teamId,
            },
            signal,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function assignToCustomer(orgId, workspaceId, cid, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.customerApi}${cid}/assignto`,
            body,
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function assignToCustomerV2(orgId, workspaceId, cid, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.customerApi}contact/${cid}/assigntov2`,
            body,
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateCustomer(orgId, workspaceId, cid, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.put(`${paths.customerApi}${cid}`, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteCustomer(orgId, workspaceId, cid) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(`${paths.customerApi}${cid}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createCustomer(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.customerCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateJourney(orgId, workspaceId, cid, stageId, note) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.customerJourneyList}${cid}/note`,
            {
                stageId,
                note,
            },
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateStageJourney(
    orgId,
    workspaceId,
    cid,
    stageId,
    note,
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.customerJourneyList}${cid}/updatestage`,
            {
                stageId,
                note,
            },
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateRating(orgId, workspaceId, cid, star) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${pathsV2.customerRating.replace("{customerId}", cid)}`,
            { rating: star },
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function generateGoogleSheetMapping(
    orgId,
    workspaceId,
    formUrl,
    targetRow,
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(`${paths.googlesheetMappingGenerate}`, {
            formUrl,
            targetRow,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function importGoogleSheet(
    orgId,
    workspaceId,
    formUrl,
    targetRow,
    rowCount,
    mappingField,
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(`${paths.googlesheetImport}`, {
            formUrl,
            targetRow,
            rowCount,
            mappingField,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function exportCustomersToExcel(
    orgId,
    workspaceId,
    searchText,
    stageGroupId,
    startDate,
    endDate,
    categoryList,
    sourceList,
    rating,
    stage,
    tags,
    profileIds,
    teamIds,
    channels,
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            paths.exportLeads,
            {
                searchText,
                stageGroupId,
                startDate,
                endDate,
                categoryList,
                sourceList,
                rating,
                stage,
                tags,
                profileIds,
                teamIds,
                channels,
            },
            {
                responseType: "blob",
            },
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCustomerDetail(orgId, workspaceId, cid, signal) {
    try {
        const res = await fetch(`${paths.customerDetail}/${cid}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            signal,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

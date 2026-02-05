import { createApiCall } from "@/lib/api";
import paths, { pathsV2 } from "@/lib/authConstants";
import { getAccessToken } from "@/lib/authCookies";

export async function getCustomerList(
    orgId,
    limit = 10,
    offset = 0,
    startDate = "",
    endDate = "",
    isBusiness = false,
    searchText = "",
) {
    const api = createApiCall(orgId);
    const response = await api.get(pathsV2.customersList, {
        params: {
            limit,
            offset,
            startDate,
            endDate,
            isBusiness,
            searchText,
        },
    });
    return response.data;
}

export async function getCustomerListByPost(orgId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.customersList, body);
    return response.data;
}

export async function getLeadList(
    orgId,
    limit = 10,
    offset = 0,
    startDate = "",
    endDate = "",
    tags = [],
    sourceIds = [],
    utmSources = [],
    assignees = [],
    searchText = "",
    isArchive = false,
) {
    const api = createApiCall(orgId);

    // Xây dựng query string thủ công để tránh dấu [] trong tham số mảng
    let url = `${pathsV2.leadsList}?limit=${limit}&offset=${offset}`;

    // Thêm tham số ngày nếu có
    if (startDate) {
        url += `&startDate=${encodeURIComponent(startDate)}`;
    }
    if (endDate) {
        url += `&endDate=${encodeURIComponent(endDate)}`;
    }

    // Thêm tham số tìm kiếm
    if (searchText && searchText.trim() !== "") {
        url += `&SearchText=${encodeURIComponent(searchText.trim())}`;
    }

    // Thêm tham số isArchive
    if (isArchive) {
        url += `&isArchive=${isArchive}`;
    }

    // Thêm các tham số mảng với format đúng (không có dấu [])
    if (tags && tags.length > 0) {
        tags.forEach((tag) => {
            if (tag) url += `&Tags=${encodeURIComponent(tag)}`;
        });
    }

    if (sourceIds && sourceIds.length > 0) {
        sourceIds.forEach((id) => {
            if (id) url += `&SourceIds=${encodeURIComponent(id)}`;
        });
    }

    if (utmSources && utmSources.length > 0) {
        utmSources.forEach((source) => {
            if (source) url += `&UtmSources=${encodeURIComponent(source)}`;
        });
    }

    if (assignees && assignees.length > 0) {
        assignees.forEach((assignee) => {
            if (assignee) url += `&Assignees=${encodeURIComponent(assignee)}`;
        });
    }

    const response = await api.get(url);
    return response.data;
}

export async function getLeadListV2(orgId, params) {
    const api = createApiCall(orgId);
    const response = await api.get(pathsV2.leadsListV2, { params });
    return response.data;
}

export async function getLeadListV2ByPost(orgId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.leadsListV2, body);
    return response.data;
}

export async function getCustomerListV2ByPost(orgId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.customersList, body);
    return response.data;
}

export async function getDealList(orgId, params) {
    const query = Object.keys(params)
        .map((key) => {
            return `${key}=${params[key]}`;
        })
        .join("&");
    const api = createApiCall(orgId);
    const response = await api.get(`${pathsV2.dealsList}?${query}`);
    return response.data;
}

export async function getCustomerDetail(orgId, cid) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${pathsV2.customerDetail.replace("{customerId}", cid)}`,
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getJourneyList(orgId, cid, offset, limit, type) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${pathsV2.customerJourneyList.replace("{customerId}", cid)}`,
            {
                params: {
                    offset: offset,
                    limit: limit,
                    type: type,
                },
            },
        );

        return response.data;
    } catch (error) {
        console.error("Error in getJourneyList:", error);
        throw error;
    }
}

export async function getLeadJourneyList(orgId, cid, offset, limit, type) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${pathsV2.leadJourneyList.replace("{customerId}", cid)}`,
            {
                params: {
                    offset: offset,
                    limit: limit,
                    type: type,
                },
            },
        );

        return response.data;
    } catch (error) {
        console.error("Error in getLeadJourneyList:", error);
        throw error;
    }
}

export async function getLeadDetail(orgId, cid) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${pathsV2.leadDetail.replace("{contactId}", cid)}`,
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getDealDetail(orgId, cid) {
    const api = createApiCall(orgId);
    const response = await api.get(
        `${pathsV2.dealDetail.replace("{contactId}", cid)}`,
    );
    return response.data;
}

export async function getCustomerTags(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(pathsV2.customerTags, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createCustomer(orgId, data) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.customerCreate, data);
    return response.data;
}

export async function createBusinessCustomer(orgId, data) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.customerCreate, {
        ...data,
        isBusiness: true,
    });
    return response.data;
}

export async function createLead(orgId, data) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.leadCreate, data);
    return response.data;
}

export async function updateCustomerStage(orgId, customerId, body) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        `${pathsV2.updateCustomerStage.replace("{customerId}", customerId)}`,
        body,
    );
    return response.data;
}

export async function noteCustomer(orgId, customerId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.noteCustomer.replace("{customerId}", customerId)}`,
        body,
    );
    return response.data;
}

export async function noteLead(orgId, leadId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.noteLead.replace("{leadId}", leadId)}`,
        body,
    );
    return response.data;
}

export async function archiveCustomer(orgId, customerId) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.archiveCustomer.replace("{customerId}", customerId)}`,
    );
    return response.data;
}

export async function archiveRestoreCustomer(orgId, customerId) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.archiveRestoreCustomer.replace("{customerId}", customerId)}`,
    );
    return response.data;
}

export async function deleteCustomer(orgId, customerId) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        `${pathsV2.deleteCustomer.replace("{customerId}", customerId)}`,
    );
    return response.data;
}

export async function archiveLead(orgId, customerId) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.archiveLead.replace("{customerId}", customerId)}`,
    );
    return response.data;
}

export async function archiveRestoreLead(orgId, customerId) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.archiveRestoreLead.replace("{customerId}", customerId)}`,
    );
    return response.data;
}

export async function deleteLead(orgId, customerId) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        `${pathsV2.deleteLead.replace("{customerId}", customerId)}`,
    );
    return response.data;
}

export async function uploadAttachment(orgId, leadId, body) {
    try {
        const accessToken = getAccessToken();

        // If body is not already FormData, convert JSON to FormData
        let formDataBody;
        if (body instanceof FormData) {
            formDataBody = body;
        } else {
            formDataBody = new FormData();
            // Convert JSON object to FormData
            Object.entries(body).forEach(([key, value]) => {
                if (Array.isArray(value) && value.length === 0) {
                    // Handle empty arrays specially
                    formDataBody.append(key, "");
                } else if (value === null) {
                    // Skip null values
                    return;
                } else {
                    formDataBody.append(key, value);
                }
            });
        }

        const res = await fetch(
            pathsV2.uploadAttachment.replace("{leadId}", leadId),
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    organizationId: orgId,
                    // Don't set Content-Type for FormData, browser will set it automatically
                },
                body: formDataBody,
            },
        );

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error uploading attachment:", error);
        throw error;
    }
}

export async function uploadAttachmentCustomer(orgId, customerId, body) {
    try {
        const accessToken = getAccessToken();

        // If body is not already FormData, convert JSON to FormData
        let formDataBody;
        if (body instanceof FormData) {
            formDataBody = body;
        } else {
            formDataBody = new FormData();
            // Convert JSON object to FormData
            Object.entries(body).forEach(([key, value]) => {
                if (Array.isArray(value) && value.length === 0) {
                    // Handle empty arrays specially
                    formDataBody.append(key, "");
                } else if (value === null) {
                    // Skip null values
                    return;
                } else {
                    formDataBody.append(key, value);
                }
            });
        }

        const res = await fetch(
            pathsV2.uploadAttachmentCustomer.replace(
                "{customerId}",
                customerId,
            ),
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    organizationId: orgId,
                    // Don't set Content-Type for FormData, browser will set it automatically
                },
                body: formDataBody,
            },
        );

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error uploading attachment:", error);
        throw error;
    }
}

export async function editNote(orgId, leadId, journeyId, body) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        `${pathsV2.editNote
            .replace("{leadId}", leadId)
            .replace("{journeyId}", journeyId)}`,
        body,
    );
    return response.data;
}

export async function deleteNote(orgId, leadId, journeyId) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        `${pathsV2.deleteNote
            .replace("{leadId}", leadId)
            .replace("{journeyId}", journeyId)}`,
    );
    return response.data;
}

export async function deleteCustomerNote(orgId, customerId, journeyId) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        `${pathsV2.customerDeleteNote
            .replace("{customerId}", customerId)
            .replace("{journeyId}", journeyId)}`,
    );
    return response.data;
}

export async function editCustomerNote(orgId, customerId, journeyId, body) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        `${pathsV2.customerEditNote
            .replace("{customerId}", customerId)
            .replace("{journeyId}", journeyId)}`,
        body,
    );
    return response.data;
}

export async function assignLead(orgId, leadId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.assignLead.replace("{leadId}", leadId)}`,
        body,
    );
    return response.data;
}

export async function updateLeadField(orgId, leadId, body) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        `${pathsV2.updateLeadField.replace("{leadId}", leadId)}`,
        body,
    );
    return response.data;
}

export async function updateCustomerField(orgId, customerId, body) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        `${pathsV2.updateCustomerField.replace("{customerId}", customerId)}`,
        body,
    );
    return response.data;
}

export async function updateLeadTags(orgId, leadId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.updateLeadTags.replace("{leadId}", leadId)}`,
        body,
    );
    return response.data;
}

export async function updateLeadStep(orgId, leadId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(
        `${pathsV2.updateLeadStep.replace("{leadId}", leadId)}`,
        body,
    );
    return response.data;
}

export async function linkLeadToCustomer(orgId, leadId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.linkLeadToCustomer.replace("{leadId}", leadId),
        body,
    );
    return response.data;
}

export async function unLinkLeadToCustomer(orgId, leadId) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.unlinkLeadToCustomer.replace("{leadId}", leadId),
    );
    return response.data;
}

export async function rollbackLeadFlowStep(orgId, cid) {
    const api = createApiCall(orgId);
    const response = await api.post(
        pathsV2.rollbackFlowStep.replace("{leadId}", cid),
    );
    return response.data;
}

export async function assignCustomer(orgId, customerId, body) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        `${pathsV2.assignCustomer.replace("{customerId}", customerId)}`,
        body,
    );
    return response.data;
}

export async function updateLeadAvatar(orgId, leadId, formData) {
    try {
        const accessToken = getAccessToken();
        const res = await fetch(
            `${pathsV2.updateLeadAvatar.replace("{leadId}", leadId)}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    organizationId: orgId,
                },
                body: formData,
            },
        );

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error updating lead avatar:", error);
        throw error;
    }
}

export async function createTag(orgId, body) {
    const api = createApiCall(orgId);
    const response = await api.post(pathsV2.createTag, body);
    return response.data;
}

export async function deleteTag(orgId, tagId) {
    const api = createApiCall(orgId);
    const response = await api.delete(pathsV2.deleteTag.replace("{id}", tagId));
    return response.data;
}

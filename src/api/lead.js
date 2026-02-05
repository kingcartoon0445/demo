import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getWebformList(orgId) {
    try {
        const res = await fetch(`${paths.getWebformListApi}?limit=1000`, {
            headers: {
                organizationId: orgId,
                workspaceId: "null",
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function addWebform(orgId, workspaceId, body) {
    try {
        const res = await fetch(`${paths.addWebformApi}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "POST",
            body,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteWebform(domainId, orgId, workspaceId) {
    try {
        const res = await fetch(
            `${paths.deleteWebformApi.replace("{websiteId}", domainId)}`,
            {
                method: "DELETE",
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function verifyWebform(domainId, orgId, workspaceId) {
    try {
        const res = await fetch(
            `${paths.verifyWebformApi.replace("{websiteId}", domainId)}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "POST",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function updateStatusWebform(
    domainId,
    orgId,
    workspaceId,
    status
) {
    try {
        const res = await fetch(
            `${paths.updateStatusWebformApi.replace(
                "{websiteId}",
                domainId
            )}?Status=${status}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "PATCH",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function updateStatusZaloform(orgId, workspaceId, formId, status) {
    try {
        const res = await fetch(
            `${paths.updateStatusZaloformApi.replace("{formId}", formId)}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify({ status }),
                method: "PATCH",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function connectZaloform(orgId, body) {
    try {
        const res = await fetch(`${paths.connectZaloformApi}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body,
            method: "POST",
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getLeadList(orgId) {
    try {
        const res = await fetch(`${paths.getLeadListApi}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getLeadDetail(orgId, workspaceId, leadId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(`${paths.leadDetail}${leadId}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createLead(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.leadCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateLead(orgId, workspaceId, leadId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(`${paths.leadUpdate}${leadId}`, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteLead(orgId, leadId, provider) {
    try {
        const body = {
            provider,
        };
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.deleteLeadApi}${leadId}/delete`,
            {
                data: body,
            }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateLeadStatus(orgId, workspaceId, leadId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.leadUpdateStatus}${leadId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function assignLead(orgId, workspaceId, leadId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.leadAssign}${leadId}/assign`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateLeadStage(orgId, workspaceId, leadId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.leadUpdateStage}${leadId}/updatestage`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateLeadRating(orgId, workspaceId, leadId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.leadUpdateRating}${leadId}/updaterating`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addLeadTag(orgId, workspaceId, leadId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.leadAddTag}${leadId}/addtag`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removeLeadTag(orgId, workspaceId, leadId, tagId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.leadRemoveTag}${leadId}/removetag/${tagId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function bulkUpdateLeads(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(paths.leadBulkUpdate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function bulkDeleteLeads(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(paths.leadBulkDelete, { data: body });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function importLeads(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.leadImport, body, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function exportLeads(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.leadExport, {
            params,
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function fbLeadConnect(orgId, body) {
    try {
        const res = await fetch(
            `${paths.fbLeadConnectApi}?accessToken=${body}&organizationId=${orgId}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "GET",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

// Lấy danh sách pages của user từ Facebook Graph API
export async function getFacebookPages(userID, accessToken) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${userID}/accounts?fields=id,name,picture.type(normal),access_token&access_token=${accessToken}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Facebook pages:", error);
        throw error;
    }
}

export async function updateStatusLeadgen(
    orgId,
    workspaceId,
    subscribedId,
    body
) {
    try {
        const res = await fetch(`${paths.updateLeadStatusApi}${subscribedId}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookGetList(orgId, workspaceId) {
    try {
        const res = await fetch(`${paths.webhookApi}getlist?limit=1000`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookGetDetail(orgId, workspaceId, webhookId) {
    try {
        const res = await fetch(`${paths.webhookApi}${webhookId}/getdetail`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookCreate(orgId, body) {
    try {
        const res = await fetch(`${paths.webhookApi}create`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "POST",
            body,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookUpdate(orgId, webhookId, body) {
    try {
        const res = await fetch(`${paths.webhookApi}${webhookId}/update`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookUpdateStatus(
    orgId,
    workspaceId,
    webhookId,
    status
) {
    try {
        const res = await fetch(`${paths.webhookApi}${webhookId}/status`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function webhookDelete(orgId, workspaceId, webhookId) {
    try {
        const res = await fetch(`${paths.webhookApi}${webhookId}/delete`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "DELETE",
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

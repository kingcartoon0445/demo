import paths from "@/lib/authConstants";
import qs from "qs";
import { createApiCall } from "@/lib/api";

// Lấy chi tiết rule thu hồi
export async function getEvictionRuleDetail(orgId, ruleId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${paths.automation}/eviction/rule/${ruleId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy danh sách quy tắc thu hồi
export async function getEvictionRuleList(orgId, params = {}) {
    try {
        const res = await fetch(
            `${paths.automation}/eviction/rule/getlistpaging?${qs.stringify(
                params
            )}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
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

// Cập nhật quy tắc thu hồi
export async function updateEvictionRule(orgId, ruleId, body) {
    try {
        const res = await fetch(
            `${paths.automation}/eviction/rule/${ruleId}/update`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "PATCH",
                body: JSON.stringify(body),
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

// Tạo quy tắc thu hồi
export async function createEvictionRule(orgId, body) {
    try {
        const res = await fetch(`${paths.automation}/eviction/rule/create`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "POST",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

// Xóa quy tắc thu hồi
export async function deleteEvictionRule(orgId, ruleId) {
    try {
        const res = await fetch(
            `${paths.automation}/eviction/rule/${ruleId}/delete`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "DELETE",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function updateStatusEvictionRule(orgId, ruleId, status) {
    try {
        const res = await fetch(
            `${paths.automation}/eviction/rule/${ruleId}/updatestatus`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "PATCH",
                body: JSON.stringify({ status }),
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getEvictionLogs(orgId, ruleId, params = {}) {
    try {
        const res = await fetch(
            `${paths.automation}/eviction/rule/${ruleId}/logs?${qs.stringify(
                params
            )}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
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

// API cho kịch bản nhắc hẹn
// Lấy danh sách cấu hình nhắc hẹn
export async function getReminderConfigList(orgId, params = {}) {
    const queryParams = {
        OrganizationId: orgId,
        ...params,
    };

    try {
        const res = await fetch(
            `https://calendar.coka.ai/api/ReminderConfig?${qs.stringify(
                queryParams
            )}`,
            {
                headers: {
                    accept: "*/*",
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
        throw error;
    }
}

// Lấy danh sách cấu hình nhắc hẹn theo organizationId
export async function getReminderConfigListByOrgId(orgId) {
    try {
        const res = await fetch(
            `https://calendar.coka.ai/api/ReminderConfig/organization/${orgId}`,
            {
                headers: {
                    accept: "*/*",
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
        throw error;
    }
}

// Tạo cấu hình nhắc hẹn mới
export async function createReminderConfig(orgId, body) {
    try {
        const res = await fetch(`https://calendar.coka.ai/api/ReminderConfig`, {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "POST",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy chi tiết cấu hình nhắc hẹn theo ID
export async function getReminderConfigDetail(orgId, configId) {
    const queryParams = {
        OrganizationId: orgId,
    };

    try {
        const res = await fetch(
            `https://calendar.coka.ai/api/ReminderConfig/${configId}?${qs.stringify(
                queryParams
            )}`,
            {
                headers: {
                    accept: "*/*",
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
        throw error;
    }
}

// Cập nhật cấu hình nhắc hẹn
export async function updateReminderConfig(orgId, configId, body) {
    try {
        const res = await fetch(
            `https://calendar.coka.ai/api/ReminderConfig/${configId}`,
            {
                headers: {
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "PUT",
                body: JSON.stringify(body),
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Xóa cấu hình nhắc hẹn
export async function deleteReminderConfig(orgId, configId) {
    const queryParams = {
        OrganizationId: orgId,
    };

    try {
        const res = await fetch(
            `https://calendar.coka.ai/api/ReminderConfig/${configId}?${qs.stringify(
                queryParams
            )}`,
            {
                headers: {
                    accept: "*/*",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "DELETE",
            }
        );
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Bật/tắt cấu hình nhắc hẹn
export async function toggleReminderConfigStatus(orgId, configId) {
    const queryParams = {
        OrganizationId: orgId,
    };

    try {
        const res = await fetch(
            `https://calendar.coka.ai/api/ReminderConfig/${configId}/toggle-active?${qs.stringify(
                queryParams
            )}`,
            {
                headers: {
                    accept: "*/*",
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
        throw error;
    }
}

export async function getAutomationList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.automationList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getAutomationDetail(orgId, workspaceId, automationId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${paths.automationDetail}${automationId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createAutomation(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.automationCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateAutomation(orgId, workspaceId, automationId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.automationUpdate}${automationId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteAutomation(orgId, workspaceId, automationId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.automationDelete}${automationId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateAutomationStatus(
    orgId,
    workspaceId,
    automationId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.automationUpdateStatus}${automationId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function triggerAutomation(
    orgId,
    workspaceId,
    automationId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.automationTrigger}${automationId}/trigger`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getAutomationLogs(
    orgId,
    workspaceId,
    automationId,
    params
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${paths.automationLogs}${automationId}/logs`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getAutomationTemplates(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.automationTemplates, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createAutomationFromTemplate(
    orgId,
    workspaceId,
    templateId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.automationFromTemplate}${templateId}/create`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function testAutomation(orgId, workspaceId, automationId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.automationTest}${automationId}/test`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getAutomationStatistics(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.automationStatistics, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function duplicateAutomation(
    orgId,
    workspaceId,
    automationId,
    body
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            `${paths.automationDuplicate}${automationId}/duplicate`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function exportAutomation(orgId, workspaceId, automationId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${paths.automationExport}${automationId}/export`,
            {
                responseType: "blob",
            }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function importAutomation(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.automationImport, body, {
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

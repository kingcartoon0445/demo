import paths from "@/lib/authConstants";
import qs from "qs";
import { createApiCall } from "@/lib/api";
import toast from "react-hot-toast";

// Tạo báo cáo tùy chỉnh
export async function createCustomReport(orgId, body) {
    try {
        const res = await fetch(`${paths.customReport}/layout/createv2`, {
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
        if (dataJson.code !== 0) {
            toast.error(dataJson.message);
        }
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

// Cập nhật báo cáo tùy chỉnh
export async function updateCustomReport(orgId, layoutId, body) {
    try {
        const res = await fetch(
            `${paths.customReport}/layout/${layoutId}/update`,
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
        if (dataJson.code !== 0) {
            toast.error(dataJson.message);
        }
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

// Xem cấu hình báo cáo tùy chỉnh
export async function getCustomReportConfig(orgId, layoutId) {
    try {
        const res = await fetch(`${paths.customReport}/layout/${layoutId}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        if (dataJson.code !== 0) {
            toast.error(dataJson.message);
        }
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getCustomReportPreview(orgId, body) {
    try {
        const res = await fetch(`${paths.customReport}/preview`, {
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
        if (dataJson.code !== 0) {
            toast.error(dataJson.message);
        }
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

// Lấy danh sách báo cáo tùy chỉnh
export async function getCustomReportList(orgId, params = {}) {
    try {
        const res = await fetch(
            `${paths.customReport}/layout/getlistpaging?${qs.stringify(
                params
            )}`,
            {
                headers: {
                    organizationId: orgId,
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

// Xóa báo cáo tùy chỉnh
export async function deleteCustomReport(orgId, layoutId) {
    try {
        const res = await fetch(
            `${paths.customReport}/layout/${layoutId}/delete`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "DELETE",
            }
        );
        const dataJson = await res.json();
        if (dataJson.code !== 0) {
            toast.error(dataJson.message);
        }
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getOrgReportSummary(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgReportSummary, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgReportDetails(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgReportDetails, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgUsageStatistics(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgUsageStatistics, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgMemberStatistics(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgMemberStatistics, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgWorkspaceStatistics(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgWorkspaceStatistics, {
            params,
        });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgPerformanceReport(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgPerformanceReport, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function exportOrgReport(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgReportExport, {
            params,
            responseType: "blob",
        });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgBillingReport(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgBillingReport, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgActivityLog(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgActivityLog, { params });
        if (response.data.code !== 0) {
            toast.error(response.data.message);
        }
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

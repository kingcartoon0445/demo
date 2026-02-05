import paths, { pathsV2 } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";
import qs from "qs";

export async function getWorkspaceList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.workspaceList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getWorkspaceDetail(orgId, workspaceId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.workspaceDetail);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createWorkspace(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.workspaceCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteWorkspace(orgId, workspaceId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            paths.workspaceDelete.replace("{workspaceId}", workspaceId),
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getSourceList(orgId, workspaceId) {
    try {
        const res = await fetch(`${paths.getSourceList}?limit=1000`, {
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

export async function getTagList(orgId, workspaceId) {
    try {
        const res = await fetch(`${paths.getTagPaging}?limit=1000`, {
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
        console.error("Get tag list error:", error);
        return [];
    }
}

export async function createTag(orgId, workspaceId, body) {
    try {
        const res = await fetch(`${paths.createTag}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
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
        console.error("Create tag error:", error);
        throw error;
    }
}

export async function getStageGroupList(orgId, workspaceId) {
    try {
        const res = await fetch(`${paths.getStageGroupList}?limit=1000`, {
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
        console.error("Get stage group list error:", error);
        return [];
    }
}

export async function createStageGroup(orgId, workspaceId, body) {
    try {
        const res = await fetch(`${paths.createStageGroup}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
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
        console.error("Create stage group error:", error);
        throw error;
    }
}

export async function updateStageGroup(orgId, workspaceId, stageGroupId, body) {
    try {
        const res = await fetch(`${paths.updateStageGroup}${stageGroupId}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Update stage group error:", error);
        throw error;
    }
}

export async function deleteStageGroup(orgId, workspaceId, stageGroupId) {
    try {
        const res = await fetch(`${paths.deleteStageGroup}${stageGroupId}`, {
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
        console.error("Delete stage group error:", error);
        throw error;
    }
}

export async function getStageList(orgId, workspaceId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(pathsV2.getStageList, {
            params: { limit: 1000, workspaceId: workspaceId },
        });
        return response.data;
    } catch (error) {
        console.error("Get stage list error:", error);
        return [];
    }
}

export async function createStage(orgId, workspaceId, body) {
    try {
        const res = await fetch(`${paths.createStage}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
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
        console.error("Create stage error:", error);
        throw error;
    }
}

export async function updateStage(orgId, workspaceId, stageId, body) {
    try {
        const res = await fetch(`${paths.updateStage}${stageId}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Update stage error:", error);
        throw error;
    }
}

export async function deleteStage(orgId, workspaceId, stageId) {
    try {
        const res = await fetch(`${paths.deleteStage}${stageId}`, {
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
        console.error("Delete stage error:", error);
        throw error;
    }
}

export async function getUtmSourceList(orgId, workspaceId) {
    try {
        const res = await fetch(`${pathsV2.getUtmSourceList}`, {
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
        console.error("Get utm source list error:", error);
        throw error;
    }
}

export async function createUtmSourceV2(orgId, body) {
    try {
        const res = await fetch(`${pathsV2.createUtmSource}`, {
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
        console.error("Create utm source error:", error);
        throw error;
    }
}

export async function createUtmSource(orgId, workspaceId, body) {
    try {
        const res = await fetch(`${paths.createUtmSource}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
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
        console.error("Create utm source error:", error);
        throw error;
    }
}

export async function updateUtmSource(orgId, workspaceId, utmSourceId, body) {
    try {
        const res = await fetch(`${paths.updateUtmSource}${utmSourceId}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Update utm source error:", error);
        throw error;
    }
}

export async function deleteUtmSource(orgId, workspaceId, utmSourceId) {
    try {
        const res = await fetch(`${paths.deleteUtmSource}${utmSourceId}`, {
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
        console.error("Delete utm source error:", error);
        throw error;
    }
}

export async function getTagListPaging(orgId, workspaceId) {
    try {
        const res = await fetch(`/api/v1/crm/category/tags/getpaging`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        if (dataJson.code === 0) {
            return {
                tags: dataJson.content.map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                    count: tag.count,
                    status: tag.status,
                    createdDate: tag.createdDate,
                    lastModifiedDate: tag.lastModifiedDate,
                })),
                metadata: dataJson.metadata,
            };
        }
        return {
            tags: [],
            metadata: {
                total: 0,
                count: 0,
                offset: 0,
                limit: 15,
            },
        };
    } catch (error) {
        console.error("Get tag list paging error:", error);
        return {
            tags: [],
            metadata: {
                total: 0,
                count: 0,
                offset: 0,
                limit: 15,
            },
        };
    }
}

export async function updateWorkspace(orgId, workspaceId, body) {
    try {
        const formData = new FormData();
        Object.keys(body).forEach((key) => {
            formData.append(key, body[key]);
        });

        const res = await fetch(`${paths.workspaceUpdate}${workspaceId}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PUT",
            body: formData,
        });

        const dataJson = await res.json();

        if (!res.ok) {
            const error = new Error(dataJson.message || "Có lỗi xảy ra");
            error.data = dataJson;
            throw error;
        }

        return dataJson;
    } catch (error) {
        console.error("Update workspace error:", error);
        throw error; // Ném lỗi để component có thể xử lý
    }
}

export async function updateTag(orgId, workspaceId, tagId, body) {
    try {
        const res = await fetch(`${paths.updateTag}${tagId}`, {
            headers: {
                organizationId: orgId,
                workspaceId: workspaceId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Update tag error:", error);
        throw error;
    }
}

export async function deleteTag(orgId, workspaceId, tagId) {
    try {
        const res = await fetch(`${paths.deleteTag}${tagId}`, {
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
        console.error("Delete tag error:", error);
        throw error;
    }
}

export async function getPivotData(
    orgId,
    workspaceId,
    startDate,
    endDate,
    searchText,
    profileIds,
    stageGroupId,
    categoryList,
    sourceList,
    rating,
    stage,
    tags,
    teamIds,
) {
    try {
        const params = Object.entries({
            workspaceId,
            StartDate: startDate,
            EndDate: endDate,
            SearchText: searchText,
            profileIds,
            stageGroupId,
            categoryList,
            sourceList,
            rating,
            stage,
            tags,
            teamIds,
        }).reduce((acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
        }, {});

        const res = await fetch(
            `${paths.customStatistics}?${qs.stringify(params)}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken",
                    )}`,
                },
            },
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu pivot:", error);
        throw error;
    }
}

export async function getWorkspaceMembers(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.workspaceMembers, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addWorkspaceMember(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(paths.workspaceMemberAdd, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removeWorkspaceMember(orgId, workspaceId, memberId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.workspaceRemoveMember}${memberId}`,
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateWorkspaceMemberRole(
    orgId,
    workspaceId,
    memberId,
    body,
) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.workspaceMemberUpdateRole}${memberId}/updaterole`,
            body,
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy danh sách trạng thái và nhóm bị ẩn
export async function getHiddenStagesAndGroups(orgId, workspaceId) {
    try {
        const res = await fetch(
            `/api/stages/visibility?workspaceId=${workspaceId}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken",
                    )}`,
                },
            },
        );

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error fetching hidden stages and groups:", error);
        throw error;
    }
}

// Cập nhật danh sách trạng thái và nhóm bị ẩn
export async function updateHiddenStagesAndGroups(
    orgId,
    workspaceId,
    hiddenStages,
    hiddenGroups,
) {
    try {
        const res = await fetch(`/api/stages/visibility`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                workspaceId,
                hiddenStages,
                hiddenGroups,
            }),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error updating hidden stages and groups:", error);
        throw error;
    }
}

// Cập nhật trạng thái ẩn hiện cho một stage
export async function toggleStageVisibility(
    orgId,
    workspaceId,
    stageId,
    isHidden,
) {
    try {
        const res = await fetch(`/api/stages/visibility`, {
            method: "PATCH",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                workspaceId,
                stageId,
                isHidden,
            }),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error toggling stage visibility:", error);
        throw error;
    }
}

// Cập nhật trạng thái ẩn hiện cho một group
export async function toggleGroupVisibility(
    orgId,
    workspaceId,
    groupId,
    isHidden,
) {
    try {
        const res = await fetch(`/api/stages/visibility`, {
            method: "PATCH",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                workspaceId,
                groupId,
                isHidden,
            }),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error toggling group visibility:", error);
        throw error;
    }
}

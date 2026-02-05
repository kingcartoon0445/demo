import paths from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";
import qs from "qs";

// Lấy danh sách nhóm quyền
export async function getPermissionGroups(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.permissionGroupGetAll);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

// Tạo mới nhóm quyền
export async function createPermissionGroup(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.permissionGroupCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Cập nhật thông tin nhóm quyền
export async function updatePermissionGroup(orgId, groupId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.permissionGroupUpdate}${groupId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Cập nhật trạng thái nhóm quyền
export async function updatePermissionGroupStatus(orgId, groupId, body) {
    try {
        const res = await fetch(
            `${paths.permissionGroupUpdateStatus}${groupId}/updatestatus`,
            {
                method: "PATCH",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(body),
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Xem thông tin chi tiết nhóm quyền
export async function getPermissionGroupDetail(orgId, groupId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${paths.permissionGroupDetail}${groupId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Xóa nhóm quyền
export async function deletePermissionGroup(orgId, groupId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.permissionGroupDelete}${groupId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy danh sách quyền của 1 nhóm
export async function getPermissionGroupRoles(
    orgId,
    groupId,
    workspaceIds,
    roleOrganization = false
) {
    try {
        const queryObj = {};
        if (roleOrganization) queryObj.RoleOrganization = true;
        if (workspaceIds && workspaceIds.length > 0)
            queryObj.WorkspaceId = workspaceIds;
        const query = qs.stringify(queryObj, { arrayFormat: "repeat" });
        const detailUrl = paths.permissionGroupDetailRoles.replace(
            "{groupId}",
            groupId
        );
        const res = await fetch(`${detailUrl}${query ? "?" + query : ""}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Phân quyền cho 1 nhóm
export async function grantPermissionGroupRoles(orgId, groupId, body) {
    try {
        const res = await fetch(
            `${paths.permissionGroupRolesGrant}${groupId}/roles/grant`,
            {
                method: "PATCH",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(body),
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// ===== PHÂN QUYỀN - THÀNH VIÊN TRONG NHÓM =====

// Lấy danh sách tất cả thành viên trong nhóm
export async function getPermissionGroupUsers(orgId, groupId) {
    try {
        const res = await fetch(
            `${paths.permissionGroupUserGetAll}${groupId}/user/getall`,
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
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Thêm thành viên vào nhóm - Sẽ xóa các thành viên cũ không có trong danh sách
export async function createOrUpdatePermissionGroupUsers(orgId, groupId, body) {
    try {
        const res = await fetch(
            `${paths.permissionGroupUserCreateOrUpdate}${groupId}/user/createorupdate`,
            {
                method: "POST",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(body),
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Thêm thành viên vào nhóm
export async function addPermissionGroupUsers(orgId, groupId, body) {
    try {
        const res = await fetch(
            `${paths.permissionGroupUserAdd}${groupId}/user/add`,
            {
                method: "POST",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(body),
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Xem chi tiết thành viên trong nhóm
export async function getPermissionGroupUserDetail(orgId, groupId, profileId) {
    try {
        const res = await fetch(
            `${paths.permissionGroupUserGetDetail}${groupId}/user/${profileId}/getdetail`,
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
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Xóa thành viên khỏi nhóm
export async function deletePermissionGroupUser(orgId, groupId, profileId) {
    try {
        const res = await fetch(
            `${paths.permissionGroupUserDelete}${groupId}/user/${profileId}/delete`,
            {
                method: "DELETE",
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
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// ===== PHÂN QUYỀN - THÀNH VIÊN =====
// Lấy danh sách nhóm của 1 thành viên
export async function getUserGroups(orgId, profileId) {
    try {
        const res = await fetch(
            `${paths.permissionUserRolesGetAll}${profileId}/group/all`,
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
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}
// Lấy danh sách quyền của 1 thành viên - merge với quyền trên group
export async function getUserRoles(
    orgId,
    profileId,
    workspaceIds,
    roleOrganization = false
) {
    try {
        const queryObj = {};
        if (roleOrganization) queryObj.RoleOrganization = true;
        if (workspaceIds && workspaceIds.length > 0)
            queryObj.WorkspaceId = workspaceIds;
        const query = qs.stringify(queryObj, { arrayFormat: "repeat" });
        const res = await fetch(
            `${paths.permissionUserRolesGetAll}${profileId}/roles/getall${
                query ? "?" + query : ""
            }`,
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
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Phân quyền lẻ cho 1 thành viên - không thông qua Group
export async function grantUserRoles(orgId, profileId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            paths.grantUserRoles.replace("{profileId}", profileId),
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getPermissionGroupList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.permissionGroupList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getPermissionList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.permissionList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function addPermissionToGroup(orgId, groupId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            `${paths.permissionGroupAddPermission}${groupId}/permissions`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removePermissionFromGroup(orgId, groupId, permissionId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.permissionGroupRemovePermission}${groupId}/permissions/${permissionId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getWorkspaceRoles(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(paths.permissionWorkspaceRoles, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createWorkspaceRole(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(
            paths.permissionWorkspaceRoleCreate,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateWorkspaceRole(orgId, workspaceId, roleId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.patch(
            `${paths.permissionWorkspaceRoleUpdate}${roleId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteWorkspaceRole(orgId, workspaceId, roleId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${paths.permissionWorkspaceRoleDelete}${roleId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function grantGroupRolesMultiple(orgId, groupId, roles) {
    const api = createApiCall(orgId);
    const url = paths.permissionGroupRolesGrantMultiple.replace(
        "{groupId}",
        groupId
    );
    const res = await api.post(url, { roles });
    return res.data;
}

export async function updateGroupName(orgId, groupId, body) {
    const api = createApiCall(orgId);
    try {
        const response = await api.patch(
            `${paths.permissionGroupUpdateName.replace("{groupId}", groupId)}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy danh sách module quyền theo scope
export async function getPermissionModules(orgId, scope) {
    try {
        const res = await fetch(
            `${paths.permissionModuleGetAll}?scope=${scope}`,
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
        return await res.json();
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy danh sách workspace theo nhóm quyền
export async function getPermissionGroupWorkspaceList(orgId, groupId) {
    try {
        const api = createApiCall(orgId);
        const url = paths.permissionGroupWorkspaceList.replace(
            "{groupId}",
            groupId
        );
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy danh sách thành viên có thể gán quyền cho nhóm
export async function getPermissionGroupMemberList(
    orgId,
    groupId,
    workspaceId
) {
    try {
        const api = createApiCall(orgId);
        const url = workspaceId
            ? `${paths.permissionGroupMemberList.replace(
                  "{groupId}",
                  groupId
              )}?workspaceId=${workspaceId}`
            : paths.permissionGroupMemberList.replace("{groupId}", groupId);
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function removeMemberFromGroup(
    orgId,
    groupId,
    profileId,
    workspaceId = null
) {
    try {
        const body = {
            groupId: groupId,
            workspaceId: workspaceId,
        };
        const api = createApiCall(orgId);
        const response = await api.post(
            `${paths.permissionGroupUserRemove.replace(
                "{profileId}",
                profileId
            )}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deletePermissionGroupNew(orgId, groupId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.permissionGroupRemove.replace("{groupId}", groupId)}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

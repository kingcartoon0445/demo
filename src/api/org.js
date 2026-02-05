import { apiMethods, createApiCall } from "@/lib/api";
import paths from "@/lib/authConstants";
import qs from "qs";

export async function getOrgList() {
    try {
        const response = await apiMethods.get(`${paths.orgList}?limit=1000`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgUsageStatistics(orgId) {
    try {
        const res = await fetch(
            `https://payment.coka.ai/api/v1/report/subscription/getusagestatistics`,
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

export async function createOrganization(body) {
    try {
        const res = await fetch(`${paths.orgCreate}`, {
            headers: {
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "POST",
            body: body,
        });
        if (res.status == 403) {
            return { code: -1, message: "Bạn không có quyền tạo tổ chức" };
        }
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function updateOrganization(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.put(paths.orgUpdate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateOrgAvatar(orgId, body) {
    try {
        const res = await fetch(`${paths.orgUpdateAvatar}/${orgId}`, {
            method: "PATCH",
            headers: {
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: body,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getOrgMemberDetail(profileId, orgId) {
    try {
        const res = await fetch(`${paths.orgMemberDetail}${profileId}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getOrgMembers(
    orgId,
    page,
    searchText,
    status = 1,
    workspaceId
) {
    try {
        console.log(
            qs.stringify({
                searchText,
                offset: page * 20,
                limit: 1000,
                status,
            })
        );
        const res = await fetch(
            `${paths.orgMembers}?${qs.stringify({
                searchText,
                offset: page * 20,
                limit: 1000,
                status,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId,
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

export async function getAllMembers(orgId, params) {
    const api = createApiCall(orgId);
    try {
        const res = await api.get(`${paths.getAllMember}`, { params });
        return res.data;
    } catch (error) {
        console.log(error);
    }
}

export async function searchMemberToInv(orgId, page, searchText) {
    try {
        const res = await fetch(
            `${paths.orgSearchToInv}?${qs.stringify({
                searchText,
                offset: page * 20,
                limit: 20,
            })}`,
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

export async function invMemberToOrg(profileId, orgId) {
    try {
        const res = await fetch(`${paths.orgInvMember}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ profileId }),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function changeRoleMember(profileId, orgId, role) {
    try {
        const res = await fetch(`${paths.orgChangeRole}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ profileMemberId: profileId, role }),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function removeMember(orgId, memberId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.orgRemoveMember.replace("{profileId}", memberId)}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateMemberRole(orgId, memberId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.orgMemberUpdateRole}${memberId}/updaterole`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateMemberStatus(orgId, memberId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.orgMemberUpdateStatus}${memberId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function searchOrgs(page, searchText) {
    try {
        const res = await fetch(
            `${paths.searchOrgToJoin}?${qs.stringify({
                searchText,
                offset: page ?? 0 * 20,
                limit: 1000,
            })}`,
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
    }
}

export async function joinToOrg(orgId) {
    try {
        const res = await fetch(`${paths.joinOrg}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function cancelJoinToOrg(orgId) {
    try {
        const res = await fetch(`${paths.joinOrg}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function acceptCancelJoinOrg(orgId, inviteId, isAccept) {
    try {
        const res = await fetch(
            `${paths.acceptCancelOrg}?${qs.stringify({
                InviteId: inviteId,
                IsAccept: isAccept,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                    "Content-Type": "application/json",
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

export async function cancelRequestJoinOrgApi(inviteId) {
    try {
        const res = await fetch(`${paths.cancelRequestJoinOrg}/${inviteId}`, {
            headers: {
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function cancelMemberInviteOrgApi(inviteId, orgId) {
    try {
        const res = await fetch(`${paths.cancelMemberInviteOrg}${inviteId}`, {
            headers: {
                accept: "*/*",
                organizationId: orgId,
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function acceptCancelRequestJoinOrg(orgId, inviteId, isAccept) {
    try {
        const res = await fetch(
            `${paths.acceptCancelRequestOrg}?${qs.stringify({
                InviteId: inviteId,
                IsAccept: isAccept,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                    "Content-Type": "application/json",
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

export async function getOrgInvitedList({ type = "INVITE" }) {
    try {
        const res = await fetch(
            `${paths.getOrgInvitedList}?${qs.stringify({
                offset: 0,
                limit: 1000,
                status: 2,
                type: type,
            })}`,
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
    }
}

export async function getOrgRequestList({ type = "REQUEST", orgId }) {
    try {
        const res = await fetch(
            `${paths.getOrgRequestList}?${qs.stringify({
                offset: 0,
                limit: 1000,
                status: 2,
                type: type,
            })}`,
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

export async function getOrgPivotData(
    orgId,
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
    workspaceIds
) {
    try {
        const params = Object.entries({
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
            workspaceIds,
        }).reduce((acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
        }, {});

        const res = await fetch(
            `${paths.orgCustomStatistics}?${qs.stringify(params)}`,
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
        console.error("Lỗi khi lấy dữ liệu pivot tổ chức:", error);
        throw error;
    }
}

export async function getOrgMembersByIds(orgId, memberIds) {
    try {
        if (!memberIds || memberIds.length === 0) {
            return { code: 0, content: [] };
        }

        // Sử dụng getOrgMembers để lấy tất cả thành viên, sau đó lọc theo ID
        const result = await getOrgMembers(orgId, 0);

        if (result?.code !== 0 || !result?.content) {
            return { code: -1, message: "Không thể lấy danh sách thành viên" };
        }

        // Lọc chỉ lấy những thành viên có ID trong danh sách
        const filteredMembers = result.content.filter((member) =>
            memberIds.includes(member.profileId)
        );

        // Thêm "Chưa phụ trách" nếu có trong danh sách
        if (memberIds.includes("00000000-0000-0000-0000-000000000000")) {
            filteredMembers.push({
                profileId: "00000000-0000-0000-0000-000000000000",
                fullName: "Chưa phụ trách",
                email: "",
                avatar: "",
            });
        }

        return { code: 0, content: filteredMembers };
    } catch (error) {
        console.log(error);
        return { code: -1, message: "Lỗi khi lấy thông tin thành viên" };
    }
}

export async function addOrgMember(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.orgMemberAdd, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgWorkspaces(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.orgWorkspaceList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createWorkspace(orgId, body) {
    try {
        const res = await fetch(`${paths.workspaceCreate}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
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

export async function updateWorkspace(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paths.orgWorkspaceUpdate}${workspaceId}/update`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteWorkspace(orgId, workspaceId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paths.orgWorkspaceDelete}${workspaceId}/delete`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getProfileById(profileId) {
    try {
        const response = await apiMethods.get(paths.getProfileById + profileId);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgAllMembers(orgId) {
    try {
        const response = await apiMethods.get(paths.orgPermissionGetAllMember, {
            params: {
                organizationId: orgId,
            },
            headers: {
                organizationId: orgId,
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getUserProfile(profileId, orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(`${paths.getUserProfile}/${profileId}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Lấy tất cả workspace trong tổ chức
export async function getAllWorkspaces(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paths.getAllWorkspaces);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}



export async function unJoinedWorkspace(orgId, profileId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${paths.unJoinedWorkspace.replace("{profileId}", profileId)}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Cấp quyền cho user
export async function grantUserRolesMultiple(orgId, profileId, body) {
    try {
        const api = createApiCall(orgId);
        const path = paths.grantUserRolesMultiple.replace(
            "{profileId}",
            profileId
        );
        const response = await api.post(path, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

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

// Cấp quyền team cho user
export async function grantUserTeamRolesMultiple(
    orgId,
    profileId,
    workspaceId,
    body
) {
    try {
        const api = createApiCall(orgId);
        const path = paths.grantUserTeamRolesMultiple
            .replace("{profileId}", profileId)
            .replace("{workspaceId}", workspaceId);
        const response = await api.post(path, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function leaveOrg(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(paths.orgLeave);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export async function leaveWorkspace(orgId, workspaceId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(paths.orgLeaveWorkspace);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getOrgDetail(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            paths.detailOrg.replace("{orgId}", orgId)
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getInviteMemberQRCode(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            paths.getInviteMemberQRCode.replace("{orgId}", orgId),
            { responseType: "blob" }
        );
        return response.data; // blob image
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function uploadFile(orgId, file) {
    try {
        const api = createApiCall(orgId);
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post(paths.uploadFile, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                organizationId: orgId,
            },
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function sendEmailInviteMember(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paths.sendEmailInviteMember, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateOrg(orgId, body) {
    try {
        const res = await fetch(`${paths.orgUpdate}/${orgId}`, {
            method: "PATCH",
            headers: {
                accept: "*/*",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: body,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

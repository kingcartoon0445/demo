"use client";

import Loading from "@/components/common/Loading";
import AddMemberModal from "@/components/members/AddMemberModal";
import AddPermissionModal from "@/components/members/AddPermissionModal";
import AssignResourcesModal from "@/components/members/AssignResourcesModal";
import InvitationDetail from "@/components/members/InvitationDetail";
import InvitationList from "@/components/members/InvitationList";
import MemberDetail from "@/components/members/MemberDetail";
import MemberList from "@/components/members/MemberList";
import PermissionGroupDetail from "@/components/members/PermissionGroupDetail";
import PermissionGroupsList from "@/components/members/PermissionGroupsList";
import RequestDetail from "@/components/members/RequestDetail";
import RequestList from "@/components/members/RequestList";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    useOrgMembers,
    useOrgUsageStatistics,
    usePermissionGroupRoles,
    usePermissionGroups,
    useUnJoinedWorkspace,
    useUserProfile,
    useUserWorkspaceRoles,
} from "@/hooks/useOrganizations";
import {
    OrgMember,
    PermissionGroup,
    UserWorkspace,
    Workspace,
} from "@/lib/interface";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Import API functions
import {
    acceptRequest,
    cancelInvitation,
    getInvitationList,
    rejectRequest,
} from "@/api/memberV2";
import { handleApiDataResponse } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useGetOrgDetail } from "@/hooks/useOrgV2";
import { useUserPermissions } from "@/hooks/useUserPermissions";

// Define interfaces for API responses
interface Invitation {
    id: string;
    organizationId: string;
    profileId: string;
    profile: {
        id: string;
        fullName: string;
        email: string;
        gender: number;
        isVerifyPhone: boolean;
        isVerifyEmail: boolean;
        createdDate: string;
    };
    typeOfEmployee: string;
    type: string;
    status: number;
    createdDate: string;
}

interface Request {
    id: string;
    organizationId: string;
    profileId: string;
    profile: {
        id: string;
        fullName: string;
        email: string;
        gender: number;
        isVerifyPhone: boolean;
        isVerifyEmail: boolean;
        createdDate: string;
    };
    typeOfEmployee: string;
    type: string;
    status: number;
    createdDate: string;
}

export default function MembersPage() {
    const { orgId, tab } = useParams<{ orgId: string; tab: string }>();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<"members" | "roles">("members");
    const [activeSubTab, setActiveSubTab] = useState<
        "members" | "invitations" | "requests"
    >("members");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
        null,
    );
    const [selectedInvitationId, setSelectedInvitationId] = useState<
        string | null
    >(null);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null,
    );
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [invitationSearchQuery, setInvitationSearchQuery] = useState("");
    const [requestSearchQuery, setRequestSearchQuery] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [openPermission, setOpenPermission] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // State for invitations and requests
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const { data: orgDetailResponse, isLoading: isOrgDetailLoading } =
        useGetOrgDetail(orgId || "");
    const [currentOrg, setCurrentOrg] = useState<null>(null);

    // Permission checks
    const { permissions, isManager } = useUserPermissions(orgId);
    const canInvite =
        isManager || permissions.has("ORGANIZATION_INVITE.CREATE");
    const canManageRoles =
        isManager || permissions.has("ORGANIZATION_ROLE.CREATE");

    useEffect(() => {
        if (orgDetailResponse) {
            setCurrentOrg(orgDetailResponse.content);
        }
    }, [orgDetailResponse]);
    // Track if component is mounted on client side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Check URL path parameter first
        if (tab === "requests") {
            setActiveSubTab("requests");
        } else if (tab === "invitations") {
            setActiveSubTab("invitations");
        } else if (tab === "members" || !tab) {
            // If user doesn't have role management permission, default to invitations if they can invite
            if (!canManageRoles && canInvite) {
                setActiveSubTab("invitations");
            } else {
                setActiveSubTab("members");
            }
        }

        // Also check query parameters as fallback
        const subTabFromQuery = searchParams.get("subTab");
        if (
            subTabFromQuery &&
            ["members", "invitations", "requests"].includes(subTabFromQuery)
        ) {
            // Only allow members sub-tab if user has permission
            if (subTabFromQuery === "members" && !canManageRoles) {
                setActiveSubTab("invitations");
            } else {
                setActiveSubTab(
                    subTabFromQuery as "members" | "invitations" | "requests",
                );
            }
        }
    }, [tab, searchParams, canManageRoles, canInvite]);

    // Fetch members - only when user has permission
    const {
        data: membersResponse,
        isLoading,
        error,
        refetch: refetchMembers,
    } = useOrgMembers(canManageRoles ? orgId || "" : "");
    const members = useMemo(
        () =>
            canManageRoles
                ? handleApiDataResponse(
                      membersResponse,
                      "Có lỗi xảy ra khi tải dữ liệu",
                      false,
                  ) || []
                : [],
        [membersResponse, canManageRoles],
    );

    // Fetch permission groups data - only when user has permission
    const {
        data: groupsResponse,
        isLoading: isGroupsLoading,
        error: groupsError,
    } = usePermissionGroups(canManageRoles ? orgId || "" : "");
    const permissionGroups = useMemo(
        () =>
            canManageRoles
                ? handleApiDataResponse(
                      groupsResponse,
                      "Có lỗi xảy ra khi tải dữ liệu",
                      false,
                  ) || []
                : [],
        [groupsResponse, canManageRoles],
    );

    // Fetch user workspace roles for selected member - must be called unconditionally
    const { data: workspaceRolesResponse, refetch: refetchWorkspaces } =
        useUserWorkspaceRoles(orgId || "", selectedMemberId || "");
    const userWorkspaces: UserWorkspace[] =
        handleApiDataResponse(
            workspaceRolesResponse,
            "Có lỗi xảy ra khi tải dữ liệu",
            false,
        ) || [];

    // Fetch all workspaces for assign modal - must be called unconditionally
    const { data: unJoinWorkspacesResponse } = useUnJoinedWorkspace(
        orgId || "",
        selectedMemberId || "",
    );
    const unJoinWorkspaces: Workspace[] =
        handleApiDataResponse(
            unJoinWorkspacesResponse,
            "Có lỗi xảy ra khi tải dữ liệu",
            false,
        ) || [];

    // Get selected member from list
    const selectedMember = members.find(
        (member: OrgMember) => member.profileId === selectedMemberId,
    );

    // Get selected invitation from list
    const selectedInvitation = invitations.find(
        (invitation: Invitation) => invitation.id === selectedInvitationId,
    );

    // Get selected request from list
    const selectedRequest = requests.find(
        (request: Request) => request.id === selectedRequestId,
    );

    // Fetch user profile for selected member - must be called unconditionally
    const { data: userProfileResponse } = useUserProfile(
        selectedMemberId || "",
        orgId || "",
    );
    const selectedMemberProfile = handleApiDataResponse(
        userProfileResponse,
        "Có lỗi xảy ra khi tải dữ liệu",
        false,
    );

    // Get selected group from list
    const selectedGroup = permissionGroups.find(
        (group: PermissionGroup) => group.id === selectedGroupId,
    );

    // Fetch roles of selected group - must be called unconditionally
    const { data: groupRolesResponse, isLoading: isRolesLoading } =
        usePermissionGroupRoles(orgId || "", selectedGroupId || "");

    const groupRolesContent =
        handleApiDataResponse(
            groupRolesResponse,
            "Có lỗi xảy ra khi tải dữ liệu",
            false,
        ) || [];

    // Show toast errors in effects to avoid setState during render
    useEffect(() => {
        if (membersResponse && membersResponse.code !== 0) {
            toast.error(
                membersResponse.message ||
                    "Có lỗi xảy ra khi tải danh sách thành viên",
            );
        }
    }, [membersResponse]);

    useEffect(() => {
        if (groupsResponse && groupsResponse.code !== 0) {
            toast.error(
                groupsResponse.message || "Có lỗi xảy ra khi tải nhóm quyền",
            );
        }
    }, [groupsResponse]);

    useEffect(() => {
        if (workspaceRolesResponse && workspaceRolesResponse.code !== 0) {
            toast.error(
                workspaceRolesResponse.message ||
                    "Có lỗi xảy ra khi tải quyền trong không gian làm việc",
            );
        }
    }, [workspaceRolesResponse]);

    useEffect(() => {
        if (unJoinWorkspacesResponse && unJoinWorkspacesResponse.code !== 0) {
            toast.error(
                unJoinWorkspacesResponse.message ||
                    "Có lỗi xảy ra khi tải danh sách workspace",
            );
        }
    }, [unJoinWorkspacesResponse]);

    useEffect(() => {
        if (userProfileResponse && userProfileResponse.code !== 0) {
            toast.error(
                userProfileResponse.message ||
                    "Có lỗi xảy ra khi tải hồ sơ người dùng",
            );
        }
    }, [userProfileResponse]);

    useEffect(() => {
        if (groupRolesResponse && groupRolesResponse.code !== 0) {
            toast.error(
                groupRolesResponse.message ||
                    "Có lỗi xảy ra khi tải quyền của nhóm",
            );
        }
    }, [groupRolesResponse]);

    // Filter members based on search query - must be called unconditionally
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return members;
        return members.filter(
            (member: OrgMember) =>
                member.fullName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                member.email.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [members, searchQuery]);

    // Filter invitations based on search query
    const filteredInvitations = useMemo(() => {
        if (!invitationSearchQuery) return invitations;
        return invitations.filter(
            (invitation: Invitation) =>
                invitation.profile?.fullName
                    ?.toLowerCase()
                    .includes(invitationSearchQuery.toLowerCase()) ||
                invitation.profile?.email
                    ?.toLowerCase()
                    .includes(invitationSearchQuery.toLowerCase()),
        );
    }, [invitations, invitationSearchQuery]);

    // Filter requests based on search query
    const filteredRequests = useMemo(() => {
        if (!requestSearchQuery) return requests;
        return requests.filter(
            (request: Request) =>
                request.profile?.fullName
                    ?.toLowerCase()
                    .includes(requestSearchQuery.toLowerCase()) ||
                request.profile?.email
                    ?.toLowerCase()
                    .includes(requestSearchQuery.toLowerCase()),
        );
    }, [requests, requestSearchQuery]);

    // Fetch invitations when tab changes
    useEffect(() => {
        if (activeSubTab === "invitations" && orgId) {
            fetchInvitations();
        }
    }, [activeSubTab, orgId]);

    // Fetch requests when tab changes
    useEffect(() => {
        if (activeSubTab === "requests" && orgId) {
            fetchRequests();
        }
    }, [activeSubTab, orgId]);

    const fetchInvitations = async () => {
        setIsLoadingInvitations(true);
        try {
            const response = await getInvitationList(orgId, "INVITE");
            const data = handleApiDataResponse(
                response,
                "Có lỗi xảy ra khi tải danh sách lời mời",
                true,
            );
            if (data) {
                setInvitations(data);
            }
        } catch (error) {
            console.error("Error fetching invitations:", error);
            toast.error("Có lỗi xảy ra khi tải danh sách lời mời");
        } finally {
            setIsLoadingInvitations(false);
        }
    };

    const fetchRequests = async () => {
        setIsLoadingRequests(true);
        try {
            const response = await getInvitationList(orgId, "REQUEST");
            const data = handleApiDataResponse(
                response,
                "Có lỗi xảy ra khi tải danh sách yêu cầu",
                true,
            );
            if (data) {
                setRequests(data);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Có lỗi xảy ra khi tải danh sách yêu cầu");
        } finally {
            setIsLoadingRequests(false);
        }
    };

    // Handle id from searchParams to select specific member
    useEffect(() => {
        if (!isMounted) return;

        const memberIdFromParams = searchParams.get("id");
        if (memberIdFromParams && members.length > 0) {
            // Tìm member theo profileId
            const foundMember = members.find(
                (member: OrgMember) => member.profileId === memberIdFromParams,
            );
            if (foundMember) {
                setActiveTab("members");
                setActiveSubTab("members");
                setSelectedMemberId(foundMember.profileId);
            }
        }
    }, [members, searchParams, isMounted]);

    // Set first member or group as selected when data loads (client-side only)
    useEffect(() => {
        if (!isMounted) return;

        // Skip auto-selection if id is in searchParams (handled by above effect)
        const memberIdFromParams = searchParams.get("id");
        if (memberIdFromParams) return;

        if (activeTab === "members") {
            if (
                activeSubTab === "members" &&
                members.length > 0 &&
                !selectedMemberId
            ) {
                setSelectedMemberId(members[0].profileId);
            } else if (
                activeSubTab === "invitations" &&
                invitations.length > 0 &&
                !selectedInvitationId
            ) {
                setSelectedInvitationId(invitations[0].id);
            } else if (
                activeSubTab === "requests" &&
                requests.length > 0 &&
                !selectedRequestId
            ) {
                setSelectedRequestId(requests[0].id);
            }
        } else {
            if (permissionGroups.length > 0 && !selectedGroupId) {
                setSelectedGroupId(permissionGroups[0].id);
            }
        }
    }, [
        members,
        invitations,
        requests,
        permissionGroups,
        activeTab,
        activeSubTab,
        selectedMemberId,
        selectedInvitationId,
        selectedRequestId,
        selectedGroupId,
        isMounted,
        searchParams,
    ]);

    const handleOpenAssignModal = () => {
        setShowAssignModal(true);
    };

    const handleCloseAssignModal = () => {
        setShowAssignModal(false);
    };

    const handleMemberUpdate = () => {
        refetchMembers();
        refetchWorkspaces();
    };

    const handleInvitationAccept = async (invitationId: string) => {
        try {
            const res = await acceptRequest(orgId, invitationId);
            if (res?.code === 0) {
                // Refresh invitations list
                await fetchInvitations();
                // Clear selection if the accepted invitation was selected
                if (selectedInvitationId === invitationId) {
                    setSelectedInvitationId(null);
                }
                toast.success("Chấp nhận lời mời thành công");
            }
        } catch (error) {
            console.error("Error accepting invitation:", error);
            toast.error("Có lỗi xảy ra khi chấp nhận lời mời");
        }
    };

    const handleInvitationReject = async (invitationId: string) => {
        try {
            const res = await cancelInvitation(orgId, invitationId);
            if (res?.code === 0) {
                // Refresh invitations list
                await fetchInvitations();
                // Clear selection if the rejected invitation was selected
                if (selectedInvitationId === invitationId) {
                    setSelectedInvitationId(null);
                }
                toast.success("Từ chối lời mời thành công");
            }
        } catch (error) {
            console.error("Error rejecting invitation:", error);
            toast.error("Có lỗi xảy ra khi từ chối lời mời");
        }
    };

    const handleRequestAccept = async (requestId: string) => {
        try {
            const res = await acceptRequest(orgId, requestId);
            if (res?.code === 0) {
                fetchRequests();
                if (selectedRequestId === requestId) {
                    setSelectedRequestId(null);
                }
                toast.success("Chấp nhận yêu cầu thành công");
            }
        } catch (error) {
            console.error("Error accepting request:", error);
            toast.error("Có lỗi xảy ra khi chấp nhận yêu cầu");
        }
    };

    const handleRequestReject = async (requestId: string) => {
        try {
            const res = await rejectRequest(orgId, requestId);
            if (res?.code === 0) {
                fetchRequests();
                if (selectedRequestId === requestId) {
                    setSelectedRequestId(null);
                }
                toast.success("Từ chối yêu cầu thành công");
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };

    // Loading and error states
    if (!orgId || !isMounted) {
        return <Loading />;
    }

    if (activeTab === "members" && isLoading) {
        return <Loading />;
    }

    if (activeTab === "members" && error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-red-500">{t("common.loadError")}</div>
            </div>
        );
    }

    if (activeTab === "roles" && isGroupsLoading) {
        return <Loading />;
    }

    if (activeTab === "roles" && groupsError) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-red-500">{t("common.loadError")}</div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex bg-white h-full overflow-hidden">
                {/* Left Panel */}
                <div className="w-96 border-r border-gray-200 flex flex-col">
                    {/* Main Tabs - Only show if user has role management permission */}
                    {canManageRoles && (
                        <div className="flex border-b border-gray-200">
                            <button
                                className={`flex-1 px-6 py-3 text-sm font-medium ${
                                    activeTab === "members"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                                onClick={() => setActiveTab("members")}
                            >
                                {t("common.members")}
                            </button>
                            <button
                                className={`flex-1 px-6 py-3 text-sm font-medium ${
                                    activeTab === "roles"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                                onClick={() => setActiveTab("roles")}
                            >
                                {t("permission.group")}
                            </button>
                        </div>
                    )}

                    {/* Conditional Content */}
                    {activeTab === "members" ? (
                        <>
                            {/* Sub Tabs for Members */}
                            <div className="flex border-b border-gray-100">
                                {canManageRoles && (
                                    <button
                                        className={`flex-1 px-4 py-2 text-xs font-medium ${
                                            activeSubTab === "members"
                                                ? "text-blue-600 border-b-2 border-blue-600"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                        onClick={() =>
                                            setActiveSubTab("members")
                                        }
                                    >
                                        Thành viên
                                    </button>
                                )}
                                {canInvite && (
                                    <>
                                        <button
                                            className={`flex-1 px-4 py-2 text-xs font-medium ${
                                                activeSubTab === "invitations"
                                                    ? "text-blue-600 border-b-2 border-blue-600"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                            onClick={() =>
                                                setActiveSubTab("invitations")
                                            }
                                        >
                                            Lời mời
                                        </button>
                                        <button
                                            className={`flex-1 px-4 py-2 text-xs font-medium ${
                                                activeSubTab === "requests"
                                                    ? "text-blue-600 border-b-2 border-blue-600"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                            onClick={() =>
                                                setActiveSubTab("requests")
                                            }
                                        >
                                            Yêu cầu
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Sub Tab Content */}
                            {activeSubTab === "members" && (
                                <MemberList
                                    members={filteredMembers}
                                    selectedMemberId={selectedMemberId}
                                    onMemberSelect={setSelectedMemberId}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onAddMember={() => setOpen(true)}
                                />
                            )}
                            {activeSubTab === "invitations" && (
                                <InvitationList
                                    invitations={filteredInvitations}
                                    selectedInvitationId={selectedInvitationId}
                                    onInvitationSelect={setSelectedInvitationId}
                                    searchQuery={invitationSearchQuery}
                                    onSearchChange={setInvitationSearchQuery}
                                    onAddInvitation={() => setOpen(true)}
                                />
                            )}
                            {activeSubTab === "requests" && (
                                <RequestList
                                    requests={filteredRequests}
                                    selectedRequestId={selectedRequestId}
                                    onRequestSelect={setSelectedRequestId}
                                    searchQuery={requestSearchQuery}
                                    onSearchChange={setRequestSearchQuery}
                                />
                            )}
                        </>
                    ) : (
                        <PermissionGroupsList
                            onAddPermission={() => setOpenPermission(true)}
                            permissionGroups={permissionGroups}
                            selectedGroupId={selectedGroupId}
                            onGroupSelect={setSelectedGroupId}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            currentOrg={currentOrg}
                        />
                    )}
                </div>

                {/* Right Panel */}
                {selectedMember &&
                activeTab === "members" &&
                activeSubTab === "members" ? (
                    <MemberDetail
                        member={selectedMember}
                        memberProfile={selectedMemberProfile}
                        userWorkspaces={userWorkspaces}
                        onAssignResources={handleOpenAssignModal}
                        onMemberUpdate={handleMemberUpdate}
                    />
                ) : selectedInvitation &&
                  activeTab === "members" &&
                  activeSubTab === "invitations" ? (
                    <InvitationDetail
                        invitation={selectedInvitation}
                        onAccept={handleInvitationAccept}
                        onReject={handleInvitationReject}
                    />
                ) : selectedRequest &&
                  activeTab === "members" &&
                  activeSubTab === "requests" ? (
                    <RequestDetail
                        request={selectedRequest}
                        onAccept={handleRequestAccept}
                        onReject={handleRequestReject}
                    />
                ) : activeTab === "roles" && selectedGroup ? (
                    <PermissionGroupDetail
                        currentOrg={currentOrg}
                        group={selectedGroup}
                        groupRolesContent={groupRolesContent}
                        orgId={orgId!}
                        isLoading={isRolesLoading}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <p>
                                {activeTab === "members" &&
                                activeSubTab === "members"
                                    ? t("member.selectToView")
                                    : activeTab === "members" &&
                                        activeSubTab === "invitations"
                                      ? "Chọn lời mời để xem chi tiết"
                                      : activeTab === "members" &&
                                          activeSubTab === "requests"
                                        ? "Chọn yêu cầu để xem chi tiết"
                                        : t("permission.selectToView")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Assign Resources Modal */}
                {showAssignModal && (
                    <AssignResourcesModal
                        isOpen={showAssignModal}
                        onClose={handleCloseAssignModal}
                        member={selectedMember}
                        unJoinWorkspaces={unJoinWorkspaces}
                        orgId={orgId!}
                        selectedMemberId={selectedMemberId}
                    />
                )}
                {/* Add Member Modal */}
                {open && (
                    <AddMemberModal
                        isOpen={open}
                        onClose={() => setOpen(false)}
                        orgId={orgId}
                        fetchInvitations={fetchInvitations}
                    />
                )}
                {/* Add Permission Modal */}
                {openPermission && (
                    <AddPermissionModal
                        isOpen={openPermission}
                        onClose={() => setOpenPermission(false)}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}

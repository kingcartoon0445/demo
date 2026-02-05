"use client";

import { getOrgList } from "@/api/org";
import { getUserWorkspaceRoles, getUserWorkspaceRolesV2 } from "@/api/user";
import Avatar from "react-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLeaveOrg, useLeaveWorkspace } from "@/hooks/useOrganizations";
import { useUserDetail, useUserUpdate } from "@/hooks/useUser";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    ChevronDown,
    ChevronRight,
    Edit,
    MoreVertical,
    Save,
    User,
    X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { useGetOrgDetail } from "@/hooks/useOrgV2";
import { getCurrentOrg } from "@/lib/authCookies";
import { EditOrgDialog } from "@/components/edit_org_dialog";
import { DatePicker } from "@/app/org/[orgId]/posts/componentsWithHook/DatePicker";

interface Organization {
    id: string;
    name: string;
    avatar?: string;
    subscription?: string;
    typeOfEmployee?: "OWNER" | "ADMIN" | "FULLTIME";
    type?: "OWNER" | "ADMIN" | "FULLTIME" | "MEMBER";
    Type?: "OWNER" | "ADMIN" | "FULLTIME" | "MEMBER";
}

interface UserWorkspaceTeam {
    workspaceId: string;
    teamId: string;
    teamName: string;
    role: string;
}

interface Workspace {
    workspaceId: string;
    workspaceName: string;
    groupId?: string;
    groupName?: string;
    teams: UserWorkspaceTeam[];
    status?: number;
    role?: string;
}

export default function MyAccountPage() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
    const [workspaceData, setWorkspaceData] = useState<{
        [orgId: string]: Workspace[];
    }>({});
    const [loadingWorkspaces, setLoadingWorkspaces] = useState<Set<string>>(
        new Set()
    );
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        address: "",
        about: "",
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [editOrgDialogOpen, setEditOrgDialogOpen] = useState(false);

    const currentUser = useUserDetail();
    const updateUserMutation = useUserUpdate();

    const { data: orgDetailResponse, isLoading: isOrgDetailLoading } =
        useGetOrgDetail(getCurrentOrg() || "");
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

    const [editOrgState, setEditOrgState] = useState<any>({
        isOpen: false,
        org: null,
        onSuccess: () => {
            // Refresh org list after update
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
    useEffect(() => {
        if (orgDetailResponse) {
            setCurrentOrg(orgDetailResponse.content);
        }
    }, [orgDetailResponse]);
    // Lấy danh sách tổ chức
    const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
        queryKey: ["organizations"],
        queryFn: getOrgList,
    });

    // Initialize form data when user data is loaded - Only update when data actually changes
    React.useEffect(() => {
        if (currentUser.data && !isEdit) {
            setFormData({
                fullName: currentUser.data.fullName || "",
                email: currentUser.data.email || "",
                phone: currentUser.data.phone || "",
                dob: currentUser.data.dob || "", // ISO string for DatePicker
                gender: currentUser.data.gender?.toString() || "",
                address: currentUser.data.address || "",
                about: currentUser.data.about || "",
            });
        }
    }, [currentUser.data, isEdit]);

    const organizationsList = organizations.content || [];

    // Toggle expand organization và load workspaces
    const toggleOrganization = async (orgId: string) => {
        const newExpanded = new Set(expandedOrgs);

        if (newExpanded.has(orgId)) {
            newExpanded.delete(orgId);
        } else {
            newExpanded.add(orgId);

            // Nếu chưa có data workspace thì load
            if (!workspaceData[orgId]) {
                setLoadingWorkspaces((prev) => new Set(prev).add(orgId));
                try {
                    const workspaces = await getUserWorkspaceRolesV2(
                        orgId,
                        currentUser.data?.id
                    );

                    setWorkspaceData((prev) => ({
                        ...prev,
                        [orgId]: workspaces?.content || [],
                    }));
                } catch (error) {
                    console.error("Lỗi khi load workspaces:", error);
                } finally {
                    setLoadingWorkspaces((prev) => {
                        const newLoading = new Set(prev);
                        newLoading.delete(orgId);
                        return newLoading;
                    });
                }
            }
        }

        setExpandedOrgs(newExpanded);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "OWNER":
                return "bg-red-100 text-red-800 border-red-200";
            case "ADMIN":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "FULLTIME":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getRoleText = (role: string) => {
        switch (role) {
            case "OWNER":
                return "Chủ tổ chức";
            case "ADMIN":
                return "Quản trị viên";
            case "FULLTIME":
                return "Thành viên";
            default:
                return "Thành viên";
        }
    };

    const getTeamRoleText = (role: string) => {
        switch (role) {
            case "TEAM_LEADER":
                return "Trưởng đội";
            case "TEAM_MEMBER":
                return "Thành viên";
            default:
                return "Thành viên";
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return "";
        }
    };

    // Form handlers - Memoized to prevent unnecessary re-renders
    const handleInputChange = React.useCallback(
        (field: string, value: string) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        },
        []
    );

    const handleSaveProfile = React.useCallback(async () => {
        try {
            const formDataToSend = new FormData();

            // Append valid form values
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    // Convert ISO string to yyyy-mm-dd format for dob field
                    if (key === "dob" && value) {
                        try {
                            const date = new Date(value as string);
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(
                                2,
                                "0"
                            );
                            const dd = String(date.getDate()).padStart(2, "0");
                            formDataToSend.append(key, `${yyyy}-${mm}-${dd}`);
                        } catch (e) {
                            // If parsing fails, send as is
                            formDataToSend.append(key, value);
                        }
                    } else {
                        formDataToSend.append(key, value);
                    }
                }
            });

            // Append avatar file if selected
            if (avatarFile) {
                formDataToSend.append("avatar", avatarFile);
            }

            await updateUserMutation.mutateAsync(formDataToSend);
            setIsEdit(false);
            setAvatarFile(null);
            setAvatarPreview(null);

            // Refresh user data
            await currentUser.refetch();
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    }, [formData, avatarFile, updateUserMutation, setIsEdit, currentUser]);

    const handleCancelEdit = React.useCallback(() => {
        // Reset form data to original user data
        if (currentUser.data) {
            setFormData({
                fullName: currentUser.data.fullName || "",
                email: currentUser.data.email || "",
                phone: currentUser.data.phone || "",
                dob: currentUser.data.dob || "",
                gender: currentUser.data.gender?.toString() || "",
                address: currentUser.data.address || "",
                about: currentUser.data.about || "",
            });
        }
        setIsEdit(false);
        setAvatarFile(null);
        setAvatarPreview(null);
    }, [currentUser.data, setIsEdit]);

    // Handle avatar file selection
    const handleAvatarChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith("image/")) {
                    alert("Vui lòng chọn file hình ảnh");
                    return;
                }

                // Validate file size (max 5MB)
                if (file.size > 1 * 1024 * 1024) {
                    alert("File không được vượt quá 1MB");
                    return;
                }

                setAvatarFile(file);

                // Create preview URL
                const reader = new FileReader();
                reader.onload = (e) => {
                    setAvatarPreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
            }
        },
        []
    );

    // Khởi tạo hooks ở top level
    const leaveOrgMutation = useLeaveOrg();
    const leaveWorkspaceMutation = useLeaveWorkspace();

    // Hàm reload workspace data cho một org
    const reloadWorkspaceData = async (orgId: string) => {
        if (!currentUser.data?.id) return;

        setLoadingWorkspaces((prev) => new Set(prev).add(orgId));
        try {
            const workspaces = await getUserWorkspaceRoles(
                orgId,
                currentUser.data.id
            );

            setWorkspaceData((prev) => ({
                ...prev,
                [orgId]: workspaces?.content || [],
            }));
        } catch (error) {
            console.error("Lỗi khi reload workspaces:", error);
        } finally {
            setLoadingWorkspaces((prev) => {
                const newLoading = new Set(prev);
                newLoading.delete(orgId);
                return newLoading;
            });
        }
    };

    const handleLeaveOrg = (orgId: string) => {
        leaveOrgMutation.mutate({ orgId });
    };
    const handleLeaveWorkspace = (orgId: string, workspaceId: string) => {
        leaveWorkspaceMutation.mutate(
            { orgId, workspaceId },
            {
                onSuccess: () => {
                    // Reload lại danh sách workspace sau khi rời thành công
                    reloadWorkspaceData(orgId);
                },
            }
        );
    };

    return (
        <TooltipProvider>
            {/* Left Column - Personal Info */}
            <div className="col-span-12 h-full">
                {/* THÔNG TIN CHUNG */}
                <div className="bg-white h-full overflow-y-auto">
                    <div className="pt-0 h-full">
                        <div className="bg-gray-50 px-6 py-2 h-full">
                            <div className="space-y-4">
                                <div className="flex flex-row items-center gap-2">
                                    <User className="w-5 h-5 text-gray-600" />
                                    <div className="text-base font-medium">
                                        {t("common.personalInfo")}
                                    </div>
                                    <div className="ml-auto flex gap-2">
                                        {!isEdit && (
                                            <Tooltip content={t("common.edit")}>
                                                <TooltipTrigger>
                                                    <Button
                                                        variant="default"
                                                        onClick={() =>
                                                            setIsEdit(true)
                                                        }
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                            </Tooltip>
                                        )}
                                        {isEdit && (
                                            <>
                                                <Tooltip
                                                    content={t("common.cancel")}
                                                >
                                                    <TooltipTrigger>
                                                        <Button
                                                            variant="outline"
                                                            onClick={
                                                                handleCancelEdit
                                                            }
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                </Tooltip>
                                                <Tooltip
                                                    content={t("common.save")}
                                                >
                                                    <TooltipTrigger>
                                                        <Button
                                                            variant="default"
                                                            onClick={
                                                                handleSaveProfile
                                                            }
                                                            disabled={
                                                                updateUserMutation.isPending
                                                            }
                                                        >
                                                            {updateUserMutation.isPending ? (
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Avatar Section */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <Avatar
                                            name={getFirstAndLastWord(
                                                currentUser.data?.fullName || ""
                                            )}
                                            src={
                                                getAvatarUrl(
                                                    currentUser.data?.avatar ||
                                                        ""
                                                ) || ""
                                            }
                                            size={"96"}
                                            round
                                            className="cursor-pointer"
                                            onClick={() => {
                                                if (isEdit) {
                                                    document
                                                        .getElementById(
                                                            "avatar-upload"
                                                        )
                                                        ?.click();
                                                }
                                            }}
                                        />
                                        {isEdit && (
                                            <>
                                                <div
                                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                "avatar-upload"
                                                            )
                                                            ?.click()
                                                    }
                                                >
                                                    <Edit className="w-6 h-6 text-white" />
                                                </div>
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={
                                                        handleAvatarChange
                                                    }
                                                    className="hidden"
                                                />
                                            </>
                                        )}
                                        {avatarFile && (
                                            <div className="absolute -bottom-2 -right-2">
                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label
                                            htmlFor="fullName"
                                            className="mb-2"
                                        >
                                            {t("common.fullName")}
                                        </Label>
                                        {isEdit ? (
                                            <Input
                                                id="fullName"
                                                value={formData.fullName}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "fullName",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={t(
                                                    "common.enterFullName"
                                                )}
                                                autoComplete="off"
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.fullName ||
                                                    "Chưa cập nhật"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4"></div>
                                    <div>
                                        <Label htmlFor="email" className="mb-2">
                                            {t("common.email")}
                                        </Label>
                                        {isEdit ? (
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "email",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={t(
                                                    "common.enterEmail"
                                                )}
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.email}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className="mb-2">
                                            {t("common.phone")}
                                        </Label>
                                        {isEdit ? (
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "phone",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={t(
                                                    "common.enterPhone"
                                                )}
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.phone}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="dob" className="mb-2">
                                            {t("common.dob")}
                                        </Label>
                                        {isEdit ? (
                                            <DatePicker
                                                value={formData.dob}
                                                onChange={(value) =>
                                                    handleInputChange(
                                                        "dob",
                                                        value
                                                    )
                                                }
                                                placeholder={t(
                                                    "common.enterDob"
                                                )}
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.dob
                                                    ? formatDate(
                                                          currentUser.data.dob
                                                      )
                                                    : ""}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="gender"
                                            className="mb-2"
                                        >
                                            {t("common.gender")}
                                        </Label>
                                        {isEdit ? (
                                            <Select
                                                value={formData.gender}
                                                onValueChange={(value) =>
                                                    handleInputChange(
                                                        "gender",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue
                                                        placeholder={t(
                                                            "common.selectGender"
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">
                                                        {t("common.male")}
                                                    </SelectItem>
                                                    <SelectItem value="0">
                                                        {t("common.female")}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.gender === 1
                                                    ? t("common.male")
                                                    : currentUser.data
                                                          ?.gender === 0
                                                    ? t("common.female")
                                                    : ""}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="address"
                                            className="mb-2"
                                        >
                                            {t("common.address")}
                                        </Label>
                                        {isEdit ? (
                                            <Input
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "address",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={t(
                                                    "common.enterAddress"
                                                )}
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.address}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="about" className="mb-2">
                                            {t("common.about")}
                                        </Label>
                                        {isEdit ? (
                                            <Input
                                                id="about"
                                                value={formData.about}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "about",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={t(
                                                    "common.enterAbout"
                                                )}
                                            />
                                        ) : (
                                            <div className="text-gray-500">
                                                {currentUser.data?.about}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4"></div>
                            </div>
                            <div className="flex flex-row items-center gap-2 py-4">
                                <Building2 className="w-5 h-5 text-gray-600" />
                                <div className="text-base font-medium">
                                    {t("common.organizationInfo")}
                                </div>
                            </div>
                            <div className="pb-4">
                                <div className="space-y-3">
                                    {isLoadingOrgs ? (
                                        <div className="text-center py-8 text-gray-500">
                                            {t("common.loading")}
                                        </div>
                                    ) : organizationsList.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            {t("common.noOrganization")}
                                        </div>
                                    ) : (
                                        organizationsList.map(
                                            (org: Organization) => (
                                                <div
                                                    key={org.id}
                                                    className="border rounded-lg overflow-hidden"
                                                >
                                                    {/* Organization Item */}
                                                    <div
                                                        className="flex items-center gap-3 p-4 hover:bg-[oklch(0.65_0.28_276_/_0.1)] cursor-pointer transition-colors bg-white"
                                                        onClick={() =>
                                                            toggleOrganization(
                                                                org.id
                                                            )
                                                        }
                                                    >
                                                        <Avatar
                                                            name={getFirstAndLastWord(
                                                                org.name
                                                            )}
                                                            src={
                                                                getAvatarUrl(
                                                                    org.avatar ||
                                                                        ""
                                                                ) || ""
                                                            }
                                                            size={"32"}
                                                            round
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">
                                                                {org.name}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {org.typeOfEmployee && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={getRoleColor(
                                                                        org.typeOfEmployee
                                                                    )}
                                                                >
                                                                    {getRoleText(
                                                                        org.typeOfEmployee
                                                                    )}
                                                                </Badge>
                                                            )}
                                                            {expandedOrgs.has(
                                                                org.id
                                                            ) ? (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                                            )}
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent>
                                                                    <div className="w-full space-y-1">
                                                                        {(() => {
                                                                            const orgType =
                                                                                (
                                                                                    org.type ||
                                                                                    org.Type ||
                                                                                    ""
                                                                                ).toLowerCase();
                                                                            return (
                                                                                orgType ===
                                                                                    "owner" ||
                                                                                orgType ===
                                                                                    "admin"
                                                                            );
                                                                        })() && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    setEditOrgState(
                                                                                        {
                                                                                            isOpen: true,
                                                                                            org: org,
                                                                                            onSuccess:
                                                                                                () => {
                                                                                                    // Refresh org list after update
                                                                                                    queryClient.invalidateQueries(
                                                                                                        {
                                                                                                            queryKey:
                                                                                                                [
                                                                                                                    "organizations",
                                                                                                                ],
                                                                                                        }
                                                                                                    );
                                                                                                },
                                                                                        }
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Cập
                                                                                nhật
                                                                                thông
                                                                                tin
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleLeaveOrg(
                                                                                    org.id
                                                                                );
                                                                            }}
                                                                        >
                                                                            {t(
                                                                                "common.leaveOrganization"
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </div>

                                                    {/* Workspaces List */}
                                                    {expandedOrgs.has(
                                                        org.id
                                                    ) && (
                                                        <div className="border-t bg-gray-50">
                                                            {loadingWorkspaces.has(
                                                                org.id
                                                            ) ? (
                                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                                    {t(
                                                                        "common.loading"
                                                                    )}
                                                                </div>
                                                            ) : workspaceData[
                                                                  org.id
                                                              ]?.length ===
                                                              0 ? (
                                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                                    {t(
                                                                        "common.noWorkspace"
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="p-4">
                                                                    <div className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                                                        {t(
                                                                            "common.workspaces"
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2 pb-6">
                                                                        {workspaceData[
                                                                            org
                                                                                .id
                                                                        ]?.map(
                                                                            (
                                                                                workspace: Workspace
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        workspace.workspaceId
                                                                                    }
                                                                                    className="bg-white rounded border overflow-hidden"
                                                                                >
                                                                                    {/* Workspace Header */}
                                                                                    <div className="flex items-center gap-3 p-3">
                                                                                        <div className="flex-1">
                                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                                {
                                                                                                    workspace.workspaceName
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                        {workspace.groupName ? (
                                                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                                                {
                                                                                                    workspace.groupName
                                                                                                }
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                                                                {t(
                                                                                                    "permission.noPermission"
                                                                                                )}
                                                                                            </span>
                                                                                        )}
                                                                                        <span
                                                                                            className={`text-xs ${
                                                                                                workspace
                                                                                                    .teams
                                                                                                    .length >
                                                                                                0
                                                                                                    ? "text-green-600 bg-green-100"
                                                                                                    : "text-gray-500 bg-gray-100"
                                                                                            } px-2 py-1 rounded`}
                                                                                        >
                                                                                            {workspace
                                                                                                .teams
                                                                                                .length >
                                                                                            0
                                                                                                ? `${
                                                                                                      workspace
                                                                                                          .teams
                                                                                                          .length
                                                                                                  } ${t(
                                                                                                      "team.teams"
                                                                                                  )}`
                                                                                                : t(
                                                                                                      "team.noTeams"
                                                                                                  )}
                                                                                        </span>

                                                                                        {/* <ChevronRight className="w-3 h-3 text-gray-400" /> */}
                                                                                        {workspace.groupName?.toLowerCase() !==
                                                                                            "quản trị viên" && (
                                                                                            <Popover>
                                                                                                <PopoverTrigger
                                                                                                    asChild
                                                                                                >
                                                                                                    <Button
                                                                                                        variant="ghost"
                                                                                                        onClick={(
                                                                                                            e
                                                                                                        ) =>
                                                                                                            e.stopPropagation()
                                                                                                        }
                                                                                                    >
                                                                                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                                                                                    </Button>
                                                                                                </PopoverTrigger>
                                                                                                <PopoverContent>
                                                                                                    <div className="w-full">
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                                                            onClick={(
                                                                                                                e
                                                                                                            ) => {
                                                                                                                e.stopPropagation();
                                                                                                                handleLeaveWorkspace(
                                                                                                                    org.id,
                                                                                                                    workspace.workspaceId
                                                                                                                );
                                                                                                            }}
                                                                                                        >
                                                                                                            {t(
                                                                                                                "common.leaveWorkspace"
                                                                                                            )}
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </PopoverContent>
                                                                                            </Popover>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Teams List */}
                                                                                    {workspace.teams &&
                                                                                        workspace
                                                                                            .teams
                                                                                            .length >
                                                                                            0 && (
                                                                                            <div className="border-t bg-gray-25 px-3 py-2">
                                                                                                <div className="text-xs font-medium text-gray-500 mb-2">
                                                                                                    {t(
                                                                                                        "common.teams"
                                                                                                    )}{" "}
                                                                                                    (
                                                                                                    {
                                                                                                        workspace
                                                                                                            .teams
                                                                                                            .length
                                                                                                    }

                                                                                                    )
                                                                                                </div>
                                                                                                <div className="space-y-1">
                                                                                                    {workspace.teams.map(
                                                                                                        (
                                                                                                            team
                                                                                                        ) => (
                                                                                                            <div
                                                                                                                key={
                                                                                                                    team.teamId
                                                                                                                }
                                                                                                                className="flex items-center justify-between text-xs p-2 bg-white rounded border"
                                                                                                            >
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                                                    <span className="text-gray-700 font-medium">
                                                                                                                        {
                                                                                                                            team.teamName
                                                                                                                        }
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                                                                        {getTeamRoleText(
                                                                                                                            team.role
                                                                                                                        )}
                                                                                                                    </span>
                                                                                                                    {/* <Popover>
                                                                                                                        <PopoverTrigger
                                                                                                                            asChild
                                                                                                                        >
                                                                                                                            <Button
                                                                                                                                variant="ghost"
                                                                                                                                onClick={(
                                                                                                                                    e
                                                                                                                                ) =>
                                                                                                                                    e.stopPropagation()
                                                                                                                                }
                                                                                                                            >
                                                                                                                                <MoreVertical className="w-4 h-4 text-gray-400" />
                                                                                                                            </Button>
                                                                                                                        </PopoverTrigger>
                                                                                                                        <PopoverContent>
                                                                                                                            <div className="w-full">
                                                                                                                                <Button
                                                                                                                                    variant="ghost"
                                                                                                                                    className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                                                                                    onClick={(
                                                                                                                                        e
                                                                                                                                    ) => {
                                                                                                                                        e.stopPropagation();
                                                                                                                                        // handleLeaveWorkspace(
                                                                                                                                        //     org.id,
                                                                                                                                        //     workspace.workspaceId
                                                                                                                                        // );
                                                                                                                                    }}
                                                                                                                                >
                                                                                                                                    {t(
                                                                                                                                        "common.leaveWorkspace"
                                                                                                                                    )}
                                                                                                                                </Button>
                                                                                                                            </div>
                                                                                                                        </PopoverContent>
                                                                                                                    </Popover> */}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {editOrgState.isOpen && (
                <EditOrgDialog
                    open={editOrgState.isOpen}
                    setOpen={setEditOrgState}
                    currentOrg={editOrgState.org}
                    onSuccess={editOrgState.onSuccess}
                />
            )}
        </TooltipProvider>
    );
}

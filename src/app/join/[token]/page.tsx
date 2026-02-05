"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/lib/authCookies";
import JoinOrganizationDialog from "@/components/organization/JoinOrganizationDialog";
import { getOrgDetail } from "@/api/org";
import toast from "react-hot-toast";
import { acceptInvitation, rejectInvitation } from "@/api/memberV2";
import { useQueryClient } from "@tanstack/react-query";

interface Organization {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    address?: string;
    fieldOfActivity?: string;
    website?: string;
    subscription?: string;
    memberCount?: number;
}

export default function JoinOrganizationPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgToken = params?.token as string;
    const [isDialogOpen, setIsDialogOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inviteId = searchParams?.get("inviteId") || "";
    const queryClient = useQueryClient();
    const searchString =
        typeof window !== "undefined"
            ? window.location.search.replace("?", "")
            : searchParams?.toString() ?? "";

    useEffect(() => {
        // Kiểm tra xem user đã đăng nhập chưa
        const accessToken = getAccessToken();
        setIsAuthenticated(!!accessToken);

        // Nếu chưa đăng nhập, redirect về sign-in với redirect param
        if (!accessToken) {
            const redirectPath = searchString
                ? `/join/${orgToken}?${searchString}`
                : `/join/${orgToken}`;
            const signInUrl = `/sign-in?redirect=${encodeURIComponent(
                redirectPath
            )}`;
            if (typeof window !== "undefined") {
                window.location.href = signInUrl;
            } else {
                router.replace(signInUrl);
            }
            return;
        }

        // Nếu đã đăng nhập, lấy thông tin organization
        if (accessToken && orgToken) {
            fetchOrganizationInfo(orgToken);
            setIsDialogOpen(true);
        }
    }, [orgToken, router, searchString]);

    const fetchOrganizationInfo = async (orgToken: string) => {
        try {
            setIsLoading(true);
            // Giả sử token chính là orgId, nếu không thì cần tạo API riêng để decode token
            const response = await getOrgDetail(orgToken);
            if (response?.code === 0 && response?.content) {
                setOrganization(response.content);
            } else {
                setError(
                    response?.message || "Không tìm thấy thông tin tổ chức"
                );
            }
        } catch (err: any) {
            console.error("Error fetching organization:", err);
            setError("Không thể tải thông tin tổ chức. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!organization) return;
        if (!inviteId) {
            toast.error("Không tìm thấy thông tin lời mời");
            return;
        }

        try {
            const response = await acceptInvitation(organization.id, inviteId);

            if (response?.code === 0 || response?.success) {
                toast.success("Tham gia tổ chức thành công!");
                if (typeof window !== "undefined") {
                    localStorage.setItem("currentOrgId", organization.id);
                }
                // Redirect về trang chủ hoặc trang organization
                queryClient.invalidateQueries({
                    queryKey: ["organizations"],
                });
                router.push(`/org/${organization.id}/leads`);
            } else {
            }
        } catch (err: any) {
            console.error("Error joining organization:", err);
            toast.error(
                "Có lỗi xảy ra khi tham gia tổ chức. Vui lòng thử lại."
            );
        }
    };

    const handleReject = async () => {
        if (!organization) {
            router.push("/");
            return;
        }
        if (!inviteId) {
            router.push("/");
            return;
        }

        try {
            const response = await rejectInvitation(organization.id, inviteId);

            if (response?.code === 0 || response?.success) {
                toast.success("Bạn đã từ chối lời mời");
            }
        } catch (err: any) {
            console.error("Error rejecting invitation:", err);
            toast.error("Có lỗi xảy ra khi từ chối lời mời");
        } finally {
            router.push("/");
        }
    };

    if (!isAuthenticated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-4 py-2 bg-primary text-white rounded"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f7ff] via-white to-[#eef2ff] px-4">
            {organization ? (
                <JoinOrganizationDialog
                    organization={organization}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    open={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        if (typeof window !== "undefined") {
                            const currentOrgId =
                                localStorage.getItem("currentOrgId") || "";
                            if (currentOrgId) {
                                router.push(`/org/${currentOrgId}/leads`);
                                return;
                            }
                        }
                        router.push("/");
                    }}
                />
            ) : (
                <div className="text-gray-500">
                    Không tìm thấy thông tin tổ chức
                </div>
            )}
        </div>
    );
}

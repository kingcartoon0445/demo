"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/lib/authCookies";
import { getOrgDetail } from "@/api/org";
import toast from "react-hot-toast";
import { sendRequest } from "@/api/memberV2";
import RequestOrganizationDialog from "@/components/organization/RequestOrganizationDialog";

interface Organization {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
}

export default function RequestJoinOrganizationPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgToken = params?.token as string;
    const [isDialogOpen, setIsDialogOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [error, setError] = useState<string | null>(null);

    const searchString =
        typeof window !== "undefined"
            ? window.location.search.replace("?", "")
            : searchParams?.toString() ?? "";

    useEffect(() => {
        const accessToken = getAccessToken();
        setIsAuthenticated(!!accessToken);

        if (!accessToken) {
            const redirectPath = searchString
                ? `/request/${orgToken}?${searchString}`
                : `/request/${orgToken}`;
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

        if (accessToken && orgToken) {
            fetchOrganizationInfo(orgToken);
            setIsDialogOpen(true);
        }
    }, [orgToken, router, searchString]);

    const fetchOrganizationInfo = async (orgToken: string) => {
        try {
            setIsLoading(true);
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
            // setError("Không thể tải thông tin tổ chức. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!organization) return;
        try {
            const res = await sendRequest(organization.id);
            if (res?.code === 0 || res?.success) {
                toast.success("Đã gửi yêu cầu tham gia tổ chức");
                router.push("/");
            } else {
                toast.error(res?.message || "Không thể gửi yêu cầu");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAuthenticated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f7ff] via-white to-[#eef2ff] px-4">
            {organization ? (
                <RequestOrganizationDialog
                    organization={organization}
                    onSendRequest={handleSendRequest}
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

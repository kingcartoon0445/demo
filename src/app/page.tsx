"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganizations";

export default function HomePage() {
    const router = useRouter();
    const { data: orgResponse, isLoading } = useOrganizations();
    const currentOrgId = localStorage.getItem("currentOrgId");
    const orgs = useMemo(() => orgResponse?.content || [], [orgResponse]);

    useEffect(() => {
        if (!isLoading && orgs.length > 0) {
            // Redirect to first organization's leads page
            router.replace(`/org/${currentOrgId || orgs[0].id}/leads`);
        }
    }, [orgs, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    if (orgs.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-semibold mb-2">
                        Chào mừng đến với Coka AI
                    </h1>
                    <p className="text-gray-500">Bạn chưa thuộc tổ chức nào.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-500">Đang chuyển hướng...</div>
        </div>
    );
}

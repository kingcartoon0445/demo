"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { postsApi } from "@/api/posts";
import { useOrgStore } from "@/store/useOrgStore";

export type PostsSubmenuKey =
    | "overview"
    | "create"
    | "schedule"
    | "seeding"
    | "library"
    | "settings";

const menuItems: { key: PostsSubmenuKey; icon: string; label: string }[] = [
    {
        key: "overview",
        icon: "dashboard",
        label: "Tổng quan",
    },
    {
        key: "create",
        icon: "post_add",
        label: "Tạo bài viết",
    },
    {
        key: "schedule",
        icon: "calendar_month",
        label: "Lịch đăng bài",
    },
    {
        key: "seeding",
        icon: "campaign",
        label: "Seeding",
    },
    {
        key: "settings",
        icon: "settings",
        label: "Cài đặt kênh",
    },
];

interface PostsSubmenuProps {
    activeKey?: PostsSubmenuKey;
}

export function PostsSubmenu({ activeKey = "overview" }: PostsSubmenuProps) {
    const router = useRouter();
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    const [userPermission, setUserPermission] = useState<{
        role: number;
        isOwner: boolean;
        loading: boolean;
    }>({
        role: 0,
        isOwner: false,
        loading: true,
    });

    const { orgDetail } = useOrgStore();

    useEffect(() => {
        const checkPermission = async () => {
            if (!orgId) return;
            try {
                if (
                    orgDetail &&
                    orgDetail.id === orgId &&
                    orgDetail.type === "OWNER"
                ) {
                    setUserPermission({
                        role: 3,
                        isOwner: true,
                        loading: false,
                    });
                    return;
                }
                const permRes = await postsApi.checkPermissionPost(orgId, {});
                const role = permRes?.data?.role || 0;
                setUserPermission({
                    role,
                    isOwner: false,
                    loading: false,
                });
            } catch (err) {
                console.error("Error checking permission:", err);
                setUserPermission((prev) => ({ ...prev, loading: false }));
            }
        };
        checkPermission();
    }, [orgId, orgDetail]);

    const getHrefByKey = (key: PostsSubmenuKey) => {
        if (!orgId) return "#";
        const base = `/org/${orgId}/posts`;
        switch (key) {
            case "overview":
                return base;
            case "create":
                return `${base}/create`;
            case "schedule":
                return `${base}/schedule`;
            case "seeding":
                return `${base}/seeding`;
            case "library":
                return `${base}/library`;
            case "settings":
                return `${base}/settings`;
            default:
                return base;
        }
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-lg">Quản lý bài viết</h2>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menuItems
                    .filter((item) => {
                        if (item.key === "create") {
                            // Only show if loaded AND allowed (Owner or Role > 0)
                            return (
                                !userPermission.loading &&
                                (userPermission.isOwner ||
                                    userPermission.role > 0)
                            );
                        }
                        return true;
                    })
                    .map((item) => {
                        const isActive = item.key === activeKey;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                    const href = getHrefByKey(item.key);
                                    if (href !== "#") {
                                        router.push(href);
                                    }
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? "bg-slate-100 text-primary font-medium dark:bg-slate-800"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
                                }`}
                            >
                                <span className="material-icons-outlined text-xl">
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
            </nav>
        </div>
    );
}

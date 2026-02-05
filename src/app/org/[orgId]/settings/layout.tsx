"use client";
import { useUserDetail } from "@/hooks/useUser";
import { useOrgStore } from "@/store/useOrgStore";
import { useMemo, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";

import { Glass } from "@/components/Glass";

import { User } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
    MdOutlineNotifications,
    MdOutlineUpgrade,
    MdPersonOutline,
    MdOutlineViewSidebar,
    MdSsidChart,
} from "react-icons/md";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const orgId = params.orgId;
    const { t } = useLanguage();
    const { data: userDetail } = useUserDetail();

    const permissions = useMemo(() => {
        const codes = new Set<string>();
        if (userDetail?.roles) {
            // Find role matching current orgId or check all if not strict
            // Usually we filter by current orgId
            const orgRole = userDetail.roles.find(
                (r: any) => r.organization?.id === orgId,
            );

            if (orgRole?.roles) {
                orgRole.roles.forEach((group: any) => {
                    if (group.modules) {
                        group.modules.forEach((mod: any) => {
                            if (mod.permissions) {
                                mod.permissions.forEach((p: any) =>
                                    codes.add(p.code),
                                );
                            }
                        });
                    }
                });
            }
        }
        return codes;
    }, [userDetail, orgId]);

    const { orgDetail, fetchOrgDetail } = useOrgStore();

    useEffect(() => {
        if (orgId) {
            fetchOrgDetail(orgId as string);
        }
    }, [orgId, fetchOrgDetail]);

    const isManager = useMemo(() => {
        return orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";
    }, [orgDetail?.type]);

    const menu = useMemo(() => {
        const items = [
            {
                label: t("common.personal"),
                href: `/org/${orgId}/settings/my-account`,
                icon: MdPersonOutline,
                permission: null, // Always show
            },
            {
                label: t("common.notifications"),
                href: `/org/${orgId}/settings/notifications`,
                icon: MdOutlineNotifications,
                permission: null, // Always show
            },
            {
                label: t("common.upgradeAccount"),
                href: `/org/${orgId}/settings/upgrade-account`,
                icon: MdOutlineUpgrade,
                permission: "SYSTEM_SUBSCRIPTION.UPDATE",
            },
            {
                label: t("common.sidebarConfig"),
                href: `/org/${orgId}/settings/sidebar`,
                icon: MdOutlineViewSidebar,
                permission: "SYSTEM_SIDEBAR.UPDATE",
            },
            {
                label: t("common.eventTransfer"),
                href: `/org/${orgId}/settings/event-transfer`,
                icon: MdSsidChart,
                permission: "CONVERSIONS_API.CREATE",
            },
        ];

        return items.filter((item) => {
            if (isManager || !item.permission) return true;
            return permissions.has(item.permission);
        });
    }, [orgId, t, permissions, isManager]);

    return (
        <div className="h-full p-1">
            <div className="flex h-full gap-4">
                {/* Sidebar Menu */}
                <Glass
                    intensity="high"
                    className="h-full shrink-0 w-[300px] border-r border-gray-200 flex flex-col rounded-2xl overflow-hidden"
                >
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            {t("common.settings")}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                        {menu.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                        isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/25"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                            isActive
                                                ? "bg-white/20 text-white"
                                                : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm"
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <p className="text-sm font-medium truncate">
                                            {item.label}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </Glass>

                {/* Main Content */}
                <div className="w-full h-full">
                    {/* Page Content */}
                    <div className="flex-1 h-full">{children}</div>
                </div>
            </div>
        </div>
    );
}

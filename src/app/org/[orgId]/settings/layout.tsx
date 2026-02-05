"use client";

import { useUserDetail } from "@/hooks/useUser";
import { useOrgStore } from "@/store/useOrgStore";
import { useMemo, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
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
        <div className="bg-gray-50 h-full">
            <div className="flex h-full">
                {/* Sidebar Menu */}
                <div className="w-70 h-full">
                    <div className="bg-white h-full">
                        <div className="text-[18px] font-medium text-gray-600 p-4">
                            {t("common.settings")}
                        </div>
                        <div className="flex flex-col px-4 space-y-2">
                            {menu.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex rounded-lg items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[oklch(0.65_0.28_276_/_0.1)] ${
                                            isActive
                                                ? "text-sidebar-primary font-bold bg-[oklch(0.65_0.28_276_/_0.1)]"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        <Icon className="w-6 h-6" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full h-full">
                    {/* Page Content */}
                    <div className="flex-1 h-full">{children}</div>
                </div>
            </div>
        </div>
    );
}

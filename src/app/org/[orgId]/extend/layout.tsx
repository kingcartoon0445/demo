"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { User } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
    MdOutlineNotifications,
    MdOutlineUpgrade,
    MdPersonOutline,
    MdOutlineViewSidebar,
    MdEmail,
    MdCall,
    MdPostAdd,
} from "react-icons/md";
import { useUserDetail } from "@/hooks/useUser";
import { useOrgStore } from "@/store/useOrgStore";
import { useMemo } from "react";
import { RiRobot2Line } from "react-icons/ri";

export default function ExtendLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const orgId = params.orgId; // Assuming orgId is string from params
    const { t } = useLanguage();
    const { data: userDetail } = useUserDetail();
    const { orgDetail } = useOrgStore();

    const permissions = useMemo(() => {
        const codes = new Set<string>();
        if (userDetail?.roles && orgId) {
            const orgRole = userDetail.roles.find(
                (r: any) => r.organization?.id === orgId,
            );

            if (orgRole?.roles) {
                orgRole.roles.forEach((group: any) => {
                    if (group.modules) {
                        group.modules.forEach((mod: any) => {
                            if (mod.moduleCode) codes.add(mod.moduleCode);
                            if (mod.permissions) {
                                mod.permissions.forEach((p: any) =>
                                    codes.add(p.code),
                                );
                            }
                        });
                    }
                });
            }

            if (orgRole?.workspaces) {
                orgRole.workspaces.forEach((ws: any) => {
                    if (ws.roles) {
                        ws.roles.forEach((group: any) => {
                            if (group.modules) {
                                group.modules.forEach((mod: any) => {
                                    if (mod.moduleCode)
                                        codes.add(mod.moduleCode);
                                    if (mod.permissions) {
                                        mod.permissions.forEach((p: any) =>
                                            codes.add(p.code),
                                        );
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
        return codes;
    }, [userDetail, orgId]);
    console.log("permissions", permissions);
    const isManager = useMemo(() => {
        return orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";
    }, [orgDetail?.type]);
    const menu = [
        {
            label: t("common.email"),
            href: `/org/${orgId}/extend/email`,
            icon: MdEmail,
            permission: "INTEGRATION_MAIL.CREATE",
        },
        {
            label: t("common.callcenter"),
            href: `/org/${orgId}/extend/callcenter`,
            icon: MdCall,
            permission: "CALL_CENTER.CREATE",
        },
        {
            label: t("common.aiChatbot"),
            href: `/org/${orgId}/extend/aichatbot`,
            icon: RiRobot2Line,
            permission: "CHATBOT.CREATE",
        },
    ];

    return (
        <div className="bg-gray-50 h-full">
            <div className="flex h-full">
                {/* Sidebar Menu */}
                <div className="w-70 h-full">
                    <div className="bg-white h-full">
                        <div className="text-[18px] font-medium text-gray-600 p-4">
                            {t("common.extend")}
                        </div>
                        <div className="flex flex-col px-4 space-y-2">
                            {menu
                                .filter((item) => {
                                    console.log(item);
                                    if (isManager) return true;
                                    if (!item.permission) return true;
                                    return permissions.has(item.permission);
                                })
                                .map((item) => {
                                    const Icon = item.icon;
                                    const isActive =
                                        pathname === item.href ||
                                        pathname.startsWith(item.href + "/");
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
                    {children}
                </div>
            </div>
        </div>
    );
}

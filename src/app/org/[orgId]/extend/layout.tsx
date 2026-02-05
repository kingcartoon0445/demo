"use client";

import { Glass } from "@/components/Glass";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { MdEmail, MdCall } from "react-icons/md";
import { User } from "lucide-react";

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
    const orgId = params.orgId;
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
        <div className="flex h-full gap-4">
            {/* Sidebar Menu */}
            <Glass
                intensity="high"
                className="w-70 h-full rounded-2xl flex flex-col overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-white/40">
                    <div className="text-lg font-medium text-title">
                        {t("common.extend")}
                    </div>
                </div>
                <div className="flex flex-col py-3">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            pathname === item.href ||
                            pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 p-3 transition-all duration-200 border-b border-gray-100 border-l-4",
                                    isActive
                                        ? "bg-white text-primary font-medium border-l-primary"
                                        : "text-gray-700 border-l-transparent hover:bg-gray-50",
                                )}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-[16px]">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </Glass>

            {/* Main Content */}
            <div className="flex-1 h-full overflow-auto">{children}</div>
        </div>
    );
}

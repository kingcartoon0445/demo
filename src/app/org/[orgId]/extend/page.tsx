"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useUserDetail } from "@/hooks/useUser";
import { useOrgStore } from "@/store/useOrgStore";

export default function ExtendPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params.orgId;
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

    const isManager = useMemo(() => {
        return orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";
    }, [orgDetail?.type]);

    const menu = [
        {
            href: `/org/${orgId}/extend/email`,
            permission: "INTEGRATION_MAIL.CREATE",
        },
        {
            href: `/org/${orgId}/extend/callcenter`,
            permission: "CALL_CENTER.CREATE",
        },
        {
            href: `/org/${orgId}/extend/aichatbot`,
            permission: "CHATBOT.CREATE",
        },
    ];

    useEffect(() => {
        if (!orgId) return;

        // Find first accessible item
        const firstItem = menu.find((item) => {
            if (isManager) return true;
            if (!item.permission) return true;
            return permissions.has(item.permission);
        });

        if (firstItem) {
            router.replace(firstItem.href);
        }
    }, [isManager, permissions, orgId, router]);

    return null; // Or a loading spinner
}

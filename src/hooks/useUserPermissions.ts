import { useUserDetail } from "@/hooks/useUser";
import { useOrgStore } from "@/store/useOrgStore";
import { useMemo, useEffect } from "react";

export function useUserPermissions(orgId?: string) {
    const { data: userDetail, isLoading: isUserLoading } = useUserDetail(orgId);
    const { orgDetail, fetchOrgDetail } = useOrgStore();

    useEffect(() => {
        if (orgId && (!orgDetail || orgDetail.id !== orgId)) {
            fetchOrgDetail(orgId);
        }
    }, [orgId, orgDetail, fetchOrgDetail]);

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

    return { permissions, isManager, isLoading: isUserLoading };
}

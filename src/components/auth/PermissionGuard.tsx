"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Map of protected routes to their required permissions
const PROTECTED_ROUTES = [
    // Extend sub-routes (check specific permissions first - longest paths first)
    { path: "/extend/email", code: "INTEGRATION_MAIL.CREATE" },
    { path: "/extend/callcenter", code: "CALL_CENTER.CREATE" },
    { path: "/extend/aichatbot", code: "CHATBOT.CREATE" },
    { path: "/extend", code: "EXTENSION" },

    // Other routes
    { path: "/leads", code: "LEAD" },
    { path: "/deals", code: "DEAL" },
    { path: "/customers", code: "CUSTOMER" },
    { path: "/automation", code: "AUTOMATION" },
    { path: "/reminders", code: "ACTIVITY" },
    { path: "/report", code: "REPORT" },
    { path: "/products", code: "PRODUCT" },
    { path: "/members", code: "USER" },
    { path: "/teams", code: "SALES_TEAM" },
    { path: "/mail-box", code: "INTEGRATION_MAILBOX.CREATE" },
];

export default function PermissionGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const orgId = params.orgId as string;

    const { permissions, isManager, isLoading } = useUserPermissions(orgId);

    useEffect(() => {
        // Skip check while loading or if user is manager
        if (isLoading || isManager) return;

        // Extract the path after /org/[orgId]
        const cleanPath = pathname?.replace(/^\/org\/[^\/]+/, "") || "";

        // Find matching protected route
        const matchedRoute = PROTECTED_ROUTES.find(
            (route) =>
                cleanPath === route.path ||
                cleanPath.startsWith(route.path + "/"),
        );

        // If route is protected and user doesn't have permission, redirect
        if (matchedRoute && !permissions.has(matchedRoute.code)) {
            router.push(`/org/${orgId}/no-permission`);
        }
    }, [pathname, permissions, isManager, isLoading, router]);

    // Show loading state while checking permissions
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}

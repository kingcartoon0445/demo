import { useLanguage } from "@/contexts/LanguageContext";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItem = {
    label: string;
    href?: string;
    translationKey?: string;
};

const buildNavItems = (
    orgId: string,
    t: (key: string) => string
): NavItem[] => [
    {
        label: t("nav.leads"),
        href: `/org/${orgId}/leads`,
        translationKey: "nav.leads",
    },
    {
        label: t("nav.deals"),
        href: `/org/${orgId}/deals`,
        translationKey: "nav.deals",
    },
    {
        label: t("nav.customers"),
        href: `/org/${orgId}/customers`,
        translationKey: "nav.customers",
    },
    {
        label: t("nav.automation"),
        href: `/org/${orgId}/automation`,
        translationKey: "nav.automation",
    },
    {
        label: t("common.activity"),
        href: `/org/${orgId}/reminders`,
        translationKey: "common.activity",
    },
    {
        label: t("common.report") || "Báo cáo",
        href: `/org/${orgId}/report`,
        translationKey: "common.report",
    },
    {
        label: t("common.products") || "Sản phẩm",
        href: `/org/${orgId}/products`,
        translationKey: "common.products",
    },
    {
        label: t("common.members") || "Thành viên",
        href: `/org/${orgId}/members`,
        translationKey: "common.members",
    },
    {
        label: t("nav.settings"),
        href: `/org/${orgId}/settings`,
        translationKey: "nav.settings",
    },
];

// Additional sub-page mappings
const getSubPageTitle = (
    pathname: string,
    t: (key: string) => string
): string | null => {
    // Extract sub-paths and return appropriate titles
    if (pathname.includes("/leads/configs")) {
        if (pathname.includes("/aichatbot")) return t("config.aichatbot");
        if (pathname.includes("/fbconnect")) return t("config.fbconnect");
        if (pathname.includes("/form")) return t("config.form");
        if (pathname.includes("/zaloconnect")) return t("config.zaloconnect");
        return t("config.title");
    }

    if (pathname.includes("/settings")) {
        if (pathname.includes("/my-account")) return t("settings.myAccount");
        return t("nav.settings");
    }

    if (pathname.includes("/wallet")) {
        if (pathname.includes("/deposit")) return t("wallet.deposit");
        return t("wallet.title");
    }

    if (pathname.includes("/extend/email")) {
        return t("common.email");
    }

    if (pathname.includes("/teams")) {
        return t("common.teams");
    }

    // Add more sub-page mappings as needed
    return null;
};

export const useCurrentPageTitle = (): string => {
    const pathname = usePathname();
    const { t } = useLanguage();

    return useMemo(() => {
        // Extract orgId from pathname
        const match = pathname.match(/^\/org\/([^\/]+)/);
        if (!match) return "Dashboard";

        const orgId = match[1];

        // Check for sub-page titles first
        const subPageTitle = getSubPageTitle(pathname, t);
        if (subPageTitle) return subPageTitle;

        // Build navigation items
        const navItems = buildNavItems(orgId, t);

        // Find matching navigation item
        const currentItem = navItems.find((item) => {
            if (!item.href) return false;

            // Exact match for shorter paths
            if (pathname === item.href) return true;

            // For longer paths, check if current path starts with the nav item path
            // but make sure we don't match partial segments
            const normalizedPathname = pathname.endsWith("/")
                ? pathname.slice(0, -1)
                : pathname;
            const normalizedHref = item.href.endsWith("/")
                ? item.href.slice(0, -1)
                : item.href;

            return (
                normalizedPathname.startsWith(normalizedHref + "/") ||
                normalizedPathname === normalizedHref
            );
        });

        return currentItem?.label || "Dashboard";
    }, [pathname, t]);
};

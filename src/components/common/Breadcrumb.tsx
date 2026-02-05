import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface BreadcrumbItem {
    label: string;
    href?: string;
    isActive?: boolean;
}

export const Breadcrumb = () => {
    const pathname = usePathname();
    const { t } = useLanguage();

    const breadcrumbItems = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);
        const items: BreadcrumbItem[] = [];

        // Always start with home/dashboard
        items.push({
            label: "Dashboard",
            href: "/",
        });

        // Extract orgId if present
        let orgId = "";
        if (segments[0] === "org" && segments[1]) {
            orgId = segments[1];
        }

        // Build breadcrumb based on path segments
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const isLast = i === segments.length - 1;

            if (segment === "org") continue; // Skip 'org' segment

            if (i === 1 && segments[0] === "org") {
                // This is the orgId segment, skip it
                continue;
            }

            let label = segment;
            let href = `/${segments.slice(0, i + 1).join("/")}`;

            // Map segments to translated labels
            switch (segment) {
                case "leads":
                    label = t("nav.leads");
                    break;
                case "deals":
                    label = t("nav.deals");
                    break;
                case "customers":
                    label = t("nav.customers");
                    break;
                case "automation":
                    label = t("nav.automation");
                    break;
                case "reminders":
                    label = t("nav.reminders");
                    break;
                case "report":
                    label = t("common.report");
                    break;
                case "products":
                    label = t("common.products");
                    break;
                case "members":
                    label = t("common.members");
                    break;
                case "settings":
                    label = t("nav.settings");
                    break;
                case "configs":
                    label = t("config.title");
                    break;
                case "aichatbot":
                    label = t("config.aichatbot");
                    break;
                case "fbconnect":
                    label = t("config.fbconnect");
                    break;
                case "form":
                    label = t("config.form");
                    break;
                case "zaloconnect":
                    label = t("config.zaloconnect");
                    break;
                case "my-account":
                    label = t("settings.myAccount");
                    break;
                case "wallet":
                    label = t("wallet.title");
                    break;
                case "deposit":
                    label = t("wallet.deposit");
                    break;
                case "join":
                    label = "";
                    break;
                default:
                    // For dynamic segments like IDs, use capitalized version
                    label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }

            items.push({
                label,
                href: isLast ? undefined : href,
                isActive: isLast,
            });
        }

        return items;
    }, [pathname, t]);

    return (
        <nav className="flex items-center space-x-1 text-sm text-gray-600">
            {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && (
                        <ChevronRightIcon className="w-4 h-4 mx-1 text-gray-400" />
                    )}
                    {index === 0 && (
                        <HomeIcon className="w-4 h-4 mr-1 text-gray-400" />
                    )}
                    {item.href && !item.isActive ? (
                        <Link
                            href={item.href}
                            className="hover:text-blue-600 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className={
                                item.isActive
                                    ? "text-blue-600 font-medium"
                                    : "text-gray-600"
                            }
                        >
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
};

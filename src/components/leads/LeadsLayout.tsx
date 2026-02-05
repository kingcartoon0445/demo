import { useLanguage } from "@/contexts/LanguageContext";
import { useChannelStatus } from "@/hooks/useConversation";
import useBreakpoint from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    HandCoins,
    Link2,
    Settings,
    SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { RiRobot2Line } from "react-icons/ri";
import { MultiConnectIcon } from "../icons";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useLeadStore } from "@/store/useLeadStore";

interface CustomerSource {
    id: string;
    name: string;
    icon?: React.ReactNode;
    count: number;
    color?: string;
    children?: CustomerSource[];
}

interface LeadsLayoutProps {
    children: React.ReactNode;
    onSourceChange?: (sourceId: string) => void;
    selectedSource?: string;
    orgId: string;
}

export default function LeadsLayout({
    children,
    onSourceChange,
    selectedSource = "chance",
    orgId,
}: LeadsLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useLanguage();
    const breakpoint = useBreakpoint();
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
        { configs: false }
    );
    const { data: channelStatus } = useChannelStatus(orgId);
    const userAgent = window.navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const getCustomerSources = (): CustomerSource[] => [
        // {
        //     id: "potential",
        //     name: t("common.all"),
        //     icon: <UserIcon className="size-4" />,
        //     count: 0, // This would need to be calculated from total leads
        // },
        {
            id: "chance",
            name: t("common.customerCareOpportunities"),
            icon: <HandCoins className="size-4" />,
            count: 0, // This would need to be calculated from LEAD channel leads
        },
        {
            id: "messenger",
            name: "Messenger",
            icon: (
                <Image
                    src="/icons/messenger1.svg"
                    alt="Messenger"
                    width={16}
                    height={16}
                />
            ),
            count: (() => {
                try {
                    const items = (channelStatus as any)?.content as
                        | { provider: string; unreadCount: number }[]
                        | undefined;
                    if (!Array.isArray(items)) return 0;
                    const facebookItem = items.find(
                        (x) => x.provider === "FACEBOOK"
                    );
                    return facebookItem?.unreadCount || 0;
                } catch {
                    return 0;
                }
            })(),
            color: "text-blue-500",
            // children: [
            //     {
            //         id: "config-messenger",
            //         name: "Config Messenger",
            //         icon: <SettingsIcon className="size-4" />,
            //         count: 0,
            //     },
            // ],
        },
        {
            id: "zalo",
            name: "Zalo OA",
            icon: (
                <Image
                    src="/icons/zalo1.svg"
                    alt="Zalo"
                    width={16}
                    height={16}
                />
            ),
            count: (() => {
                try {
                    const items = (channelStatus as any)?.content as
                        | { provider: string; unreadCount: number }[]
                        | undefined;
                    if (!Array.isArray(items)) return 0;
                    const zaloItem = items.find((x) => x.provider === "ZALO");
                    return zaloItem?.unreadCount || 0;
                } catch {
                    return 0;
                }
            })(),
            color: "text-blue-400",
            // children: [
            //     {
            //         id: "config-zalo",
            //         name: "Config Zalo",
            //         icon: <SettingsIcon className="size-4" />,
            //         count: 0,
            //     },
            // ],
        },
        // {
        //     id: "livechat",
        //     name: "Livechat",
        //     icon: (
        //         <Image
        //             src="/icons/livechat.svg"
        //             alt="Livechat"
        //             width={16}
        //             height={16}
        //         />
        //     ),
        //     count: 0, // No unreadCount data available for livechat
        //     color: "text-blue-400",
        // },
        {
            id: "config-form",
            name: t("common.form"),
            icon: <MultiConnectIcon className="size-4 text-[#646A73]" />,
            count: 0,
        },
        {
            id: "config-aichatbot",
            name: t("common.aiChatbot"),
            icon: <RiRobot2Line className="size-4 text-[#646A73]" />,
            count: 0,
        },
    ];

    // Get customer sources with dynamic counts
    const customerSources = getCustomerSources();

    // Initialize expanded state based on current path
    useEffect(() => {
        // Check if current path includes any config routes
        if (pathname?.includes("/configs/")) {
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
        }
    }, [pathname]);

    const toggleExpand = (id: string) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    const { selectedLead, isArchiveMode, toggleArchiveMode } = useLeadStore();

    const handleSourceSelect = (sourceId: string) => {
        // Handle navigation for config items
        if (sourceId === "config-messenger") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/fbconnect`);
            return;
        }
        if (sourceId === "config-zalo") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/zaloconnect`);
            return;
        }

        if (sourceId === "config-form") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/form`);
            return;
        }

        if (sourceId === "config-aichatbot") {
            // Set configs menu to expanded before navigation
            setExpandedMenus((prev) => ({
                ...prev,
                configs: true,
            }));
            router.push(`/org/${orgId}/leads/configs/aichatbot`);
            return;
        }

        // For main sources (potential, messenger, zalo, chance), navigate to leads page with source parameter
        if (
            sourceId === "potential" ||
            sourceId === "messenger" ||
            sourceId === "zalo" ||
            sourceId === "chance"
        ) {
            if (isArchiveMode) {
                toggleArchiveMode();
            }
            router.push(`/org/${orgId}/leads?source=${sourceId}`);
            return;
        }

        // For other sources, call the parent handler
        onSourceChange?.(sourceId);
    };

    useEffect(() => {
        return () => {
            useLeadStore.getState().reset(); // Reset toàn bộ state trước khi unmount
        };
    }, []);

    const isProviderConnected = (provider: "FACEBOOK" | "ZALO") => {
        try {
            const items = (channelStatus as any)?.content as
                | { provider: string; status: number }[]
                | undefined;
            if (!Array.isArray(items)) return false;
            return items.some(
                (x) => x.provider === provider && Number(x.status) === 1
            );
        } catch {
            return false;
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar - Customer Source Selector */}
            <div className="w-50 border-r bg-background h-full overflow-y-auto">
                <ul className="space-y-2 py-2 px-2">
                    {customerSources.map((source) => {
                        const isExpanded = expandedMenus[source.id];
                        const hasChildren = !!source.children?.length;

                        return (
                            <li key={source.id}>
                                <div className="flex flex-col">
                                    <button
                                        onClick={() =>
                                            hasChildren
                                                ? toggleExpand(source.id)
                                                : handleSourceSelect(source.id)
                                        }
                                        className={cn(
                                            "w-full group flex items-center gap-2 px-1 py-2 text-left text-sm hover:bg-muted transition-colors text-[#646A73] relative min-h-[44px]",
                                            selectedSource === source.id &&
                                                "bg-sidebar-accent/60 dark:bg-sidebar-accent/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span
                                                className={cn(
                                                    "shrink-0",
                                                    source.color
                                                )}
                                            >
                                                {source.icon}
                                            </span>
                                            <span className="text-black font-medium leading-tight">
                                                {source.name}
                                            </span>
                                        </div>

                                        {/* Chevron for expandable items */}
                                        {hasChildren && (
                                            <div className="shrink-0">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        )}

                                        {/* Right side container - fixed width to prevent layout shift */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Count badge - always visible when > 0 */}
                                            {source.count > 0 && (
                                                <span className="text-white inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80  py-[1px] px-[5px]">
                                                    {source.count > 99
                                                        ? "99+"
                                                        : source.count}
                                                </span>
                                            )}

                                            {/* Settings button for Messenger/Zalo - slides in from right */}
                                            {(source.id === "messenger" ||
                                                source.id === "zalo") && (
                                                <div className="flex items-center">
                                                    {(() => {
                                                        const connected =
                                                            source.id ===
                                                            "messenger"
                                                                ? isProviderConnected(
                                                                      "FACEBOOK"
                                                                  )
                                                                : isProviderConnected(
                                                                      "ZALO"
                                                                  );
                                                        return (
                                                            <>
                                                                {connected ? (
                                                                    <TooltipProvider>
                                                                        <Tooltip
                                                                            content={t(
                                                                                "common.settings"
                                                                            )}
                                                                        >
                                                                            <span
                                                                                role="button"
                                                                                tabIndex={
                                                                                    0
                                                                                }
                                                                                className={cn(
                                                                                    "text-xs px-1.5 cursor-pointer transition-opacity duration-300",
                                                                                    isMobile
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0 group-hover:opacity-100"
                                                                                )}
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    if (
                                                                                        source.id ===
                                                                                        "messenger"
                                                                                    ) {
                                                                                        handleSourceSelect(
                                                                                            "config-messenger"
                                                                                        );
                                                                                    } else if (
                                                                                        source.id ===
                                                                                        "zalo"
                                                                                    ) {
                                                                                        handleSourceSelect(
                                                                                            "config-zalo"
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                onKeyDown={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        e.key ===
                                                                                            "Enter" ||
                                                                                        e.key ===
                                                                                            " "
                                                                                    ) {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        if (
                                                                                            source.id ===
                                                                                            "messenger"
                                                                                        ) {
                                                                                            handleSourceSelect(
                                                                                                "config-messenger"
                                                                                            );
                                                                                        } else if (
                                                                                            source.id ===
                                                                                            "zalo"
                                                                                        ) {
                                                                                            handleSourceSelect(
                                                                                                "config-zalo"
                                                                                            );
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <SettingsIcon className="size-4" />
                                                                            </span>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                ) : (
                                                                    <TooltipProvider>
                                                                        <Tooltip
                                                                            content={t(
                                                                                "common.connect"
                                                                            )}
                                                                        >
                                                                            <span
                                                                                role="button"
                                                                                tabIndex={
                                                                                    0
                                                                                }
                                                                                className={cn(
                                                                                    "text-xs px-1.5 cursor-pointer transition-opacity duration-300",
                                                                                    isMobile
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0 group-hover:opacity-100"
                                                                                )}
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    if (
                                                                                        source.id ===
                                                                                        "messenger"
                                                                                    ) {
                                                                                        handleSourceSelect(
                                                                                            "config-messenger"
                                                                                        );
                                                                                    } else if (
                                                                                        source.id ===
                                                                                        "zalo"
                                                                                    ) {
                                                                                        handleSourceSelect(
                                                                                            "config-zalo"
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                onKeyDown={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        e.key ===
                                                                                            "Enter" ||
                                                                                        e.key ===
                                                                                            " "
                                                                                    ) {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        if (
                                                                                            source.id ===
                                                                                            "messenger"
                                                                                        ) {
                                                                                            handleSourceSelect(
                                                                                                "config-messenger"
                                                                                            );
                                                                                        } else if (
                                                                                            source.id ===
                                                                                            "zalo"
                                                                                        ) {
                                                                                            handleSourceSelect(
                                                                                                "config-zalo"
                                                                                            );
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Link2 className="size-4" />
                                                                            </span>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Submenu */}
                                    {hasChildren && isExpanded && (
                                        <ul className="ml-6 mt-1 space-y-1">
                                            {source.children!.map((child) => (
                                                <li key={child.id}>
                                                    <button
                                                        onClick={() =>
                                                            handleSourceSelect(
                                                                child.id
                                                            )
                                                        }
                                                        className={cn(
                                                            "w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors",
                                                            selectedSource ===
                                                                child.id &&
                                                                "bg-sidebar-accent/60 dark:bg-sidebar-accent/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "shrink-0",
                                                                    child.color
                                                                )}
                                                            >
                                                                {child.icon}
                                                            </span>
                                                            {child.name}
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-background">
                {children}
            </div>
        </div>
    );
}

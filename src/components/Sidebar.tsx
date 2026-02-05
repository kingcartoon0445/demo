"use client";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import NotificationPanel from "@/components/ui/notification-panel";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentPageTitle } from "@/hooks/useCurrentPageTitle";
// import { Breadcrumb } from "@/components/common/Breadcrumb";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useUserDetail } from "@/hooks/useUser";
import {
    getCurrentOrg,
    removeAuthTokens,
    setCurrentOrg,
} from "@/lib/authCookies";
import { Organization } from "@/lib/interface";
import {
    cn,
    defaultTitleHeader,
    getAvatarUrl,
    getFirstAndLastWord,
    playSound,
} from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
    BellIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ChevronsUpDown,
    LogOutIcon,
    PackageOpen,
    PanelLeftClose,
    PanelRightClose,
    PlusIcon,
    SearchIcon,
    Users,
    Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// -----------------------------
// Navigation tree definitions
// -----------------------------

import { useWalletDetail } from "@/hooks/usePayment";
import { initFacebookSdk } from "@/lib/fbSdk";
import WebSocketClient from "@/lib/websocket";
import type { LucideIcon } from "lucide-react";
import { IconType } from "react-icons";
import Loading from "./common/Loading";
import {
    AutomationIcon,
    CalendarIcon,
    CustomerIcon,
    DealIcon,
    HeartIcon,
    MembersIcon,
    ProductIcon,
    ReportIcon,
    SettingIcon,
} from "./icons";
import { MdMailOutline, MdOutlineGroupAdd } from "react-icons/md";
import { JoinOrg } from "./join_org";
import { Button } from "./ui/button";
import { useCustomSidebarMenu } from "@/hooks/useCustomSideBarMenu";
import Avatar from "react-avatar";
import { CreateOrgDialog } from "./create_org_dialog";
import { getOrgUsageStatistics } from "@/api/org";
import { useOrgStore } from "@/store/useOrgStore";
import UpgradeSupscriptionDialog from "./upgrade_subscription_dialog";
// import { Glass } from "./Glass";
import { Settings, Triangle, X, HeartHandshake } from "lucide-react";

type NavItem = {
    label: string;
    href?: string;
    icon?: LucideIcon | IconType;
    children?: NavItem[];
};
const buildNavTree = (
    orgId: string,
    t: (key: string) => string,
    permissions?: Set<string>,
): NavItem[] => {
    const allItems = [
        {
            label: t("nav.leads"),
            icon: HeartIcon,
            href: `/org/${orgId}/leads`,
            moduleCode: "LEAD",
        },
        {
            label: t("nav.deals"),
            icon: DealIcon,
            href: `/org/${orgId}/deals`,
            moduleCode: "DEAL",
        },
        {
            label: t("nav.customers"),
            icon: CustomerIcon,
            href: `/org/${orgId}/customers`,
            moduleCode: "CUSTOMER",
        },
        {
            label: t("nav.automation"),
            icon: AutomationIcon,
            href: `/org/${orgId}/automation`,
            moduleCode: "AUTOMATION",
        },
        {
            label: t("common.activity"),
            icon: CalendarIcon,
            href: `/org/${orgId}/reminders`,
            moduleCode: "ACTIVITY",
        },
        {
            label: t("common.report"),
            icon: ReportIcon,
            href: `/org/${orgId}/report`,
            moduleCode: "REPORT",
        },
        {
            label: t("common.products"),
            icon: ProductIcon,
            href: `/org/${orgId}/products`,
            moduleCode: "PRODUCT",
        },
        {
            label: t("common.members"),
            icon: MembersIcon,
            href: `/org/${orgId}/members`,
            moduleCode: "USER",
        },
        {
            label: t("nav.settings"),
            icon: SettingIcon,
            href: `/org/${orgId}/settings/my-account`,
            // Always show settings or check specific system permission?
            // Usually my-account is public for logged in user.
            moduleCode: null,
        },
        {
            label: t("common.extend"),
            icon: PackageOpen,
            href: `/org/${orgId}/extend`,
            moduleCode: "EXTENSION",
        },
        {
            label: t("common.teams"),
            icon: Users,
            href: `/org/${orgId}/teams`,
            moduleCode: "SALES_TEAM",
        },
        {
            label: t("common.mailBox"),
            icon: MdMailOutline,
            href: `/org/${orgId}/mail-box`,
            moduleCode: "EXTENSION",
            permission: "INTEGRATION_MAILBOX.CREATE",
        },
    ];

    return allItems.filter((item) => {
        if (!permissions) return true;

        if (item.permission) {
            return permissions.has(item.permission);
        }
        if (!item.moduleCode) return true;
        return permissions.has(item.moduleCode);
    });
};

// Map icon names from API to existing icon components
const iconNameToComponent: Record<string, LucideIcon | IconType | undefined> = {
    heart: HeartIcon,
    handshake: DealIcon,
    user: CustomerIcon,
    calendar: CalendarIcon,
    "chart-bar": ReportIcon,
    product: ProductIcon,
    users: MembersIcon,
    settings: SettingIcon,
    automation: AutomationIcon,
    extend: PackageOpen,
    teams: Users,
    mailbox: MdMailOutline,
};

const ensureLeadingSlash = (url: string) =>
    url.startsWith("/") ? url : `/${url}`;

const resolveUrl = (templateUrl: string, orgId: string) => {
    return ensureLeadingSlash(templateUrl.replace("{org_id}", orgId));
};

type ApiMenuItem = {
    id: string;
    name: string;
    displayName?: string;
    displayNameEn?: string;
    displayNameVi?: string;
    icon?: string;
    url?: string;
    children?: ApiMenuItem[];
};

const mapApiToNavItems = (
    items: ApiMenuItem[] = [],
    orgId: string,
    language?: string | null,
    permissions?: Set<string>,
): NavItem[] => {
    return items
        .filter((item) => {
            if (!item || !item.url) return false;

            // Check specific permission first
            const permCode = getPermissionFromUrl(item.url);
            if (permissions && permCode && !permissions.has(permCode))
                return false;

            const code = getModuleCodeFromUrl(item.url);
            if (permissions && code && !permissions.has(code)) return false;
            return true;
        })
        .map((item) => {
            let label = item.displayName || item.name;
            if (language === "vi") {
                label = item.displayNameVi || item.displayName || item.name;
            } else if (language === "en") {
                label = item.displayNameEn || item.displayName || item.name;
            }

            // Check if we also need to pass moduleCode to the NavItem explicitly
            // (though for the API items we are filtering upfront)
            const moduleCode = getModuleCodeFromUrl(item.url);

            return {
                label,
                href: resolveUrl(item.url as string, orgId),
                icon: item.icon
                    ? iconNameToComponent[item.icon.toLowerCase()]
                    : undefined,
                moduleCode: moduleCode,
                children:
                    item.children && item.children.length
                        ? mapApiToNavItems(
                              item.children,
                              orgId,
                              language,
                              permissions,
                          )
                        : undefined,
            };
        });
};
const getModuleCodeFromUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("/leads")) return "LEAD";
    if (lowerUrl.includes("/deals")) return "DEAL";
    if (lowerUrl.includes("/customers")) return "CUSTOMER";
    if (lowerUrl.includes("/automation")) return "AUTOMATION";
    if (lowerUrl.includes("/reminders")) return "ACTIVITY";
    if (lowerUrl.includes("/report")) return "REPORT";
    if (lowerUrl.includes("/products")) return "PRODUCT";
    if (lowerUrl.includes("/members")) return "USER";
    if (lowerUrl.includes("/extend")) return "EXTENSION";
    if (lowerUrl.includes("/mail-box")) return "EXTENSION";
    if (lowerUrl.includes("/teams")) return "SALES_TEAM";
    return null;
};

const getPermissionFromUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("/mail-box")) return "INTEGRATION_MAILBOX.CREATE";
    return null;
};

export default function Sidebar() {
    const { orgId } = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const { t, language } = useLanguage();
    const currentPageTitle = useCurrentPageTitle();
    const { data, isLoading } = useOrganizations();
    const orgs = useMemo(() => data?.content || [], [data?.content]);

    const wsClient = useRef<WebSocketClient | null>(null);
    const queryClient = useQueryClient();
    const [wsConnectionState, setWsConnectionState] = useState<
        "connecting" | "connected" | "disconnected" | "error"
    >("disconnected");
    const currentOrgId = localStorage.getItem("currentOrgId");
    const [showOrgSelector, setShowOrgSelector] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(
        orgs.find((org: Organization) => org.id === orgId) || null,
    );
    const { data: userDetail } = useUserDetail();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [openJoinOrg, setOpenJoinOrg] = useState(false);
    const [joinOrgDefaultTab, setJoinOrgDefaultTab] = useState<
        "join" | "request" | "invited"
    >("join");
    const [isOpenCreateOrg, setIsOpenCreateOrg] = useState(false);
    // Get unread notification count from dedicated API
    const { data: unreadCountData } = useUnreadNotificationCount(
        selectedOrg?.id,
    );
    const unreadCount = unreadCountData?.content || 0;

    // moved wallet detail fetch below where role is known (orgDetail)
    useEffect(() => {
        if (orgs && orgs.length > 0 && orgId) {
            const currOrg = orgs.find((org: Organization) => org.id === orgId);
            if (currOrg) {
                setSelectedOrg(currOrg);
            }
        }
    }, [orgs, orgId]);

    // Extract current orgId from pathname
    const getCurrentOrgId = useCallback(() => {
        const match = pathname.match(/^\/org\/([^\/]+)/);
        return match ? match[1] : null;
    }, [pathname]);
    useEffect(() => {
        initFacebookSdk().then(() => {
            console.log("FB SDK initialized");
        });
    }, []);
    // Set selected org based on storage first, then fallback (only when no orgId from URL)
    useEffect(() => {
        if (!orgs.length) return;

        // If we have orgId from URL, don't override with storage
        if (orgId) return;

        const storedOrgId = getCurrentOrg();

        // Priority 1: Use org from storage if it exists AND is valid in orgs
        if (storedOrgId) {
            const orgFromStorage = orgs.find(
                (org: Organization) => org.id === storedOrgId,
            );
            if (
                orgFromStorage &&
                (!selectedOrg || selectedOrg.id !== orgFromStorage.id)
            ) {
                setSelectedOrg(orgFromStorage);
                return;
            }
        }

        // Priority 2: Use first org as fallback
        if (!selectedOrg) {
            setSelectedOrg(orgs[0]);
            setCurrentOrg(orgs[0].id);
        }
    }, [orgs, selectedOrg, orgId]);

    const handleOrgSelect = (org: Organization) => {
        setSelectedOrg(org);
        setShowOrgSelector(false);

        // Save selected org to storage
        setCurrentOrg(org.id);

        const currentOrgId = getCurrentOrgId();
        if (currentOrgId !== org.id) {
            // Navigate to the same relative path but for the new org
            const newPath = pathname.replace(
                `/org/${currentOrgId}`,
                `/org/${org.id}`,
            );
            router.push(newPath);
        }
    };

    const [searchQuery, setSearchQuery] = useState("");
    const filteredOrgs = useMemo(() => {
        const keyword = (searchQuery || "").toLowerCase().trim();
        if (!keyword) return orgs;
        return orgs.filter((org: Organization) =>
            (org.name || "").toLowerCase().includes(keyword),
        );
    }, [orgs, searchQuery]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Expanded nodes for tree navigation
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const [subscription, setSubscription] = useState<any | null>(null);
    const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
    const [upgradeType, setUpgradeType] = useState<string | null>(null);
    const [isRenewal, setIsRenewal] = useState(false);

    const { orgDetail, fetchOrgDetail } = useOrgStore();

    useEffect(() => {
        if (selectedOrg?.id) {
            fetchOrgDetail(selectedOrg.id);
        }
    }, [selectedOrg?.id, fetchOrgDetail]);

    const isManager = useMemo(() => {
        return orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";
    }, [orgDetail?.type]);
    const { data: walletDetail } = useWalletDetail(
        isManager ? selectedOrg?.id || "" : "",
    );
    const wallet = walletDetail?.content;
    useEffect(() => {
        if (
            orgDetail &&
            (orgDetail.type === "OWNER" || orgDetail.type === "ADMIN")
        ) {
            getOrgUsageStatistics(selectedOrg?.id || "").then((res) => {
                setSubscription(res.content);
            });
        }
    }, [selectedOrg?.id, orgDetail]);

    const toggleNode = (key: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleNewMessage = useCallback(
        (message: any) => {
            try {
                // Kiểm tra tính hợp lệ của message trước khi xử lý
                if (!message) {
                    console.warn(
                        "[WebSocket Handler] Nhận được tin nhắn trống hoặc không hợp lệ",
                    );
                    return;
                }

                console.log(
                    "[WebSocket Handler] Xử lý tin nhắn:",
                    message.category || "unknown",
                    message.organizationId,
                );

                // Phát âm thanh thông báo
                try {
                    playSound(`${location.origin}/sounds/notify.wav`);
                } catch (soundError) {
                    console.error(
                        "[WebSocket Handler] Lỗi khi phát âm thanh thông báo:",
                        soundError,
                    );
                }

                // Xử lý chức năng thay đổi tiêu đề
                let intervalId: NodeJS.Timeout;
                const toggleTitle = () => {
                    try {
                        let isShowingMessage = true;
                        intervalId = setInterval(() => {
                            if (!document.hidden) {
                                clearInterval(intervalId);
                                document.title = defaultTitleHeader;
                            } else {
                                const content =
                                    message.content || "Có tin nhắn mới";
                                document.title = isShowingMessage
                                    ? content
                                    : defaultTitleHeader;
                                isShowingMessage = !isShowingMessage;
                            }
                        }, 1000);
                    } catch (titleError) {
                        console.error(
                            "[WebSocket Handler] Lỗi khi thay đổi tiêu đề:",
                            titleError,
                        );
                    }
                };

                if (document.hidden) {
                    toggleTitle();
                }
                // Xử lý refresh danh sách liên hệ nếu cần
                try {
                    const messageCategory =
                        message.Category || message.category;
                    const messageOrgId =
                        message.OrganizationId || message.organizationId;

                    if (
                        messageCategory &&
                        messageCategory == "NEW_LEAD" &&
                        messageOrgId === selectedOrg?.id &&
                        pathname.includes("/leads")
                    ) {
                        console.log(
                            "[WebSocket Handler] Refresh danh sách liên hệ",
                        );
                        queryClient.invalidateQueries({
                            queryKey: [
                                "infinite-leads-body-filter",
                                currentOrgId,
                            ],
                        });
                    } else {
                        console.log(
                            "[WebSocket Handler] Không refresh vì điều kiện không thỏa mãn",
                        );
                    }
                } catch (refreshError) {
                    console.error(
                        "[WebSocket Handler] Lỗi khi refresh danh sách:",
                        refreshError,
                    );
                }
                queryClient.invalidateQueries({
                    queryKey: ["unreadNotificationCount", currentOrgId],
                });

                // Note: Notification handling will be done through React Query invalidation

                console.log(
                    "[WebSocket Handler] Xử lý tin nhắn thành công:",
                    message,
                );
            } catch (error) {
                console.error(
                    "[WebSocket Handler] Lỗi khi xử lý tin nhắn:",
                    error,
                    message,
                );
            }
        },
        [pathname, queryClient],
    );

    useEffect(() => {
        try {
            if (userDetail?.id) {
                console.log("[WebSocket] Khởi tạo với user ID:", userDetail.id);
                setWsConnectionState("connecting");

                // Lấy token từ localStorage
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    console.error("[WebSocket] Không tìm thấy token xác thực");
                    setWsConnectionState("error");
                    return;
                }

                // Ngắt kết nối cũ nếu có
                if (wsClient.current) {
                    console.log(
                        "[WebSocket] Ngắt kết nối cũ trước khi tạo mới",
                    );
                    wsClient.current.disconnect();
                }

                // Khởi tạo WebSocketClient với hàm handleNewMessage
                const wsUrl = `wss://ws.coka.ai/?profileId=${userDetail.id}&token=${token}`;
                wsClient.current = new WebSocketClient(wsUrl, (message) => {
                    setWsConnectionState("connected");
                    handleNewMessage(message);
                });

                // Kết nối WebSocket
                if (wsClient.current) {
                    console.log("[WebSocket] Kết nối WebSocket");
                    wsClient.current.connect();
                }

                // Ngắt kết nối khi component bị hủy
                return () => {
                    if (wsClient.current) {
                        console.log(
                            "[WebSocket] Ngắt kết nối khi component unmount",
                        );
                        setWsConnectionState("disconnected");
                        wsClient.current.disconnect();
                    }
                };
            } else {
                setWsConnectionState("disconnected");
            }
        } catch (error) {
            console.error("[WebSocket] Lỗi khi thiết lập WebSocket:", error);
            setWsConnectionState("error");
        }
    }, [userDetail?.id, handleNewMessage]);

    // Map nesting level to Tailwind padding (must be literal strings for JIT)
    const indentCls = (level: number) => {
        switch (level) {
            case 0:
                return "";
            case 1:
                return "pl-6";
            case 2:
                return "pl-10";
            case 3:
                return "pl-14";
            default:
                return "pl-18"; // deeper levels
        }
    };

    // Function to render custom SVGs with specific animations
    const renderIcon = (id: string) => {
        switch (id) {
            case "care":
            case "leads": // Heart Handshake Icon
                return (
                    <HeartHandshake
                        className="icon-animate-hand-shake"
                        size={20}
                    />
                );
            case "members": // The old 'care' icon (Users hugging)
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {/* Left User */}
                        <g
                            className="icon-animate-hug-left"
                            style={{
                                transformOrigin: "center",
                                transformBox: "fill-box",
                            }}
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </g>
                        {/* Right User - Moves left to hug */}
                        <g
                            className="icon-animate-hug-right"
                            style={{
                                transformOrigin: "center",
                                transformBox: "fill-box",
                            }}
                        >
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </g>
                    </svg>
                );
            case "closing":
            case "deals": // Grid flying in
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect
                            x="3"
                            y="3"
                            width="7"
                            height="7"
                            className="icon-animate-grid-fly-tl"
                        />
                        <rect
                            x="14"
                            y="3"
                            width="7"
                            height="7"
                            className="icon-animate-grid-fly-tr"
                        />
                        <rect
                            x="14"
                            y="14"
                            width="7"
                            height="7"
                            className="icon-animate-grid-fly-br"
                        />
                        <rect
                            x="3"
                            y="14"
                            width="7"
                            height="7"
                            className="icon-animate-grid-fly-bl"
                        />
                    </svg>
                );
            case "customers": // Message zoom
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="icon-animate-chat-grow origin-bottom-left"
                    >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                );
            case "activity":
            case "reminders": // Heartbeat drawing
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path
                            d="M22 12h-4l-3 9L9 3l-3 9H2"
                            className="icon-animate-zap-draw"
                            strokeDasharray="60"
                        />
                    </svg>
                );
            case "report": // Pie chart slice
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                        <path
                            d="M22 12A10 10 0 0 0 12 2v10z"
                            className="icon-animate-pie-stick"
                        />
                    </svg>
                );
            case "automation": // Zap
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon
                            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                            className="group-hover:fill-yellow-400 group-hover:text-yellow-600 transition-colors duration-300"
                        />
                    </svg>
                );
            case "products": // Box opening
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path
                            d="m7.5 4.27 9 5.15"
                            className="icon-animate-box-open"
                        />
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                    </svg>
                );
            case "docs": // Text lines running
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line
                            x1="16"
                            x2="8"
                            y1="13"
                            y2="13"
                            className="icon-animate-text-write"
                            strokeDasharray="12"
                        />
                        <line
                            x1="16"
                            x2="8"
                            y1="17"
                            y2="17"
                            className="icon-animate-text-write icon-animate-text-write-delay-1"
                            strokeDasharray="12"
                        />
                        <line
                            x1="10"
                            x2="8"
                            y1="9"
                            y2="9"
                            className="icon-animate-text-write icon-animate-text-write-delay-2"
                            strokeDasharray="12"
                        />
                    </svg>
                );
            case "store":
            case "extend": // Bag lift
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <path d="M3 6h18" />
                        <path
                            d="M16 10a4 4 0 0 1-8 0"
                            className="icon-animate-bag-lift"
                        />
                    </svg>
                );
            case "settings": // Settings gear with spin animation
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:animate-spin"
                    >
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                );
            case "teams": // Teams/Users icon with animation
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="icon-animate-icon-scale"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Helper function to get icon id from href or label
    const getIconId = (href?: string, label?: string): string => {
        if (!href && !label) return "";
        const path = href || label || "";

        // Check path first
        if (path.includes("/leads")) return "leads";
        if (path.includes("/deals")) return "deals";
        if (path.includes("/customers")) return "customers";
        if (path.includes("/automation")) return "automation";
        if (path.includes("/reminders")) return "reminders";
        if (path.includes("/report")) return "report";
        if (path.includes("/products")) return "products";
        if (path.includes("/members")) return "members";
        if (path.includes("/extend")) return "extend";
        if (path.includes("/teams")) return "teams";
        if (path.includes("/settings")) return "settings";

        // Fallback to label - normalize Vietnamese text
        const labelLower = (label || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics for better matching

        // Exact matches first
        if (
            labelLower === "chăm khách" ||
            labelLower.includes("cham khach") ||
            labelLower.includes("lead")
        )
            return "leads";
        if (
            labelLower === "khách hàng" ||
            labelLower.includes("khach hang") ||
            labelLower.includes("customer")
        )
            return "customers";
        if (
            labelLower === "hoạt động" ||
            labelLower.includes("hoat dong") ||
            labelLower.includes("activity")
        )
            return "reminders";
        if (
            labelLower === "báo cáo" ||
            labelLower.includes("bao cao") ||
            labelLower.includes("report")
        )
            return "report";
        if (
            labelLower === "sản phẩm" ||
            labelLower.includes("san pham") ||
            labelLower.includes("product")
        )
            return "products";
        if (
            labelLower === "đội sale" ||
            labelLower.includes("doi sale") ||
            labelLower.includes("team")
        )
            return "teams";
        if (
            labelLower === "mở rộng" ||
            labelLower.includes("mo rong") ||
            labelLower.includes("extend")
        )
            return "extend";

        // Partial matches
        if (labelLower.includes("chăm") || labelLower.includes("cham"))
            return "leads";
        if (
            labelLower.includes("deal") ||
            labelLower.includes("chốt") ||
            labelLower.includes("chot")
        )
            return "deals";
        if (labelLower.includes("khách") || labelLower.includes("khach"))
            return "customers";
        if (labelLower.includes("automation")) return "automation";
        if (labelLower.includes("hoạt") || labelLower.includes("hoat"))
            return "reminders";
        if (labelLower.includes("báo") || labelLower.includes("bao"))
            return "report";
        if (labelLower.includes("sản") || labelLower.includes("san"))
            return "products";
        if (
            labelLower.includes("member") ||
            labelLower.includes("thành viên") ||
            labelLower.includes("thanh vien")
        )
            return "members";
        if (labelLower.includes("mở") || labelLower.includes("mo"))
            return "extend";
        if (
            labelLower.includes("setting") ||
            labelLower.includes("cài đặt") ||
            labelLower.includes("cai dat")
        )
            return "settings";
        if (labelLower.includes("đội") || labelLower.includes("doi"))
            return "teams";

        return "";
    };

    const renderItems = (items: NavItem[], level = 0): React.ReactNode => {
        return items.map((item) => {
            const key = item.href ?? item.label;
            const isActive = item.href && pathname.startsWith(item.href);
            const hasChildren = !!item.children?.length;
            const isOpen = expandedNodes.has(key);

            if (hasChildren) {
                return (
                    <li key={key} className="space-y-1">
                        <button
                            onClick={() => toggleNode(key)}
                            className={cn(
                                "flex items-center gap-2 w-full text-left px-4 py-2 rounded-md hover:bg-[oklch(0.65_0.28_276/0.05)]",
                                indentCls(level),
                                isCollapsed && "justify-center px-2",
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const iconId = getIconId(
                                        item.href,
                                        item.label,
                                    );
                                    const animatedIcon = iconId
                                        ? renderIcon(iconId)
                                        : null;
                                    return (
                                        animatedIcon ||
                                        (item.icon ? (
                                            <item.icon
                                                className="size-5 shrink-0 text-[#646A73]"
                                                style={{ color: "#646A73" }}
                                            />
                                        ) : null)
                                    );
                                })()}
                                {!isCollapsed && <span>{item.label}</span>}
                            </div>
                            {!isCollapsed && (
                                <span>
                                    {isOpen ? (
                                        <ChevronDownIcon className="size-4" />
                                    ) : (
                                        <ChevronRightIcon className="size-4" />
                                    )}
                                </span>
                            )}
                        </button>
                        {hasChildren && isOpen && !isCollapsed && (
                            <ul>{renderItems(item.children!, level + 1)}</ul>
                        )}
                    </li>
                );
            }

            return (
                <li key={key}>
                    <Link
                        href={item.href ?? "#"}
                        className={cn(
                            "group flex items-center gap-3 px-4 py-2 text-sm rounded-md hover:bg-[oklch(0.65_0.28_276/0.1)] transition-colors",
                            indentCls(level),
                            isActive && "bg-[oklch(0.65_0.28_276/0.1)]",
                            isCollapsed && "justify-center px-2",
                        )}
                        title={item.label}
                    >
                        {(() => {
                            const iconId = getIconId(item.href, item.label);
                            const animatedIcon = iconId
                                ? renderIcon(iconId)
                                : null;
                            return (
                                animatedIcon ||
                                (item.icon ? (
                                    <item.icon className="size-5 shrink-0 text-[#646A73]" />
                                ) : null)
                            );
                        })()}
                        {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                </li>
            );
        });
    };

    // Update CSS custom property when sidebar state changes
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--sidebar-width",
            isCollapsed ? "64px" : "192px",
        );
    }, [isCollapsed]);
    const sidebarWidth = isCollapsed ? "64px" : "192px";
    const { data: customMenuData } = useCustomSidebarMenu(
        selectedOrg?.id || "",
    );
    const permissions = useMemo(() => {
        const codes = new Set<string>();
        if (userDetail?.roles && selectedOrg) {
            const orgRole = userDetail.roles.find(
                (r: any) => r.organization?.id === selectedOrg.id,
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
    }, [userDetail, selectedOrg]);

    const navItems: NavItem[] = useMemo(() => {
        if (selectedOrg?.id && customMenuData?.data?.length) {
            return mapApiToNavItems(
                customMenuData.data,
                selectedOrg.id,
                language,
                isManager ? undefined : permissions,
            );
        }
        return selectedOrg ? buildNavTree(selectedOrg.id, t) : [];
    }, [customMenuData?.data, selectedOrg?.id, language, t]);

    // Banner thông báo hết hạn/gần hết hạn
    const [hideSubBanner, setHideSubBanner] = useState(() => {
        // Check localStorage on initial render
        if (typeof window !== "undefined") {
            return localStorage.getItem("hideSubscriptionBanner") === "true";
        }
        return false;
    });
    const bannerRef = useRef<HTMLDivElement | null>(null);
    const [bannerHeight, setBannerHeight] = useState(0);
    const daysRemaining = useMemo(() => {
        try {
            const expiry = subscription?.expiryDate;
            if (!expiry) return null;
            const now = new Date();
            const exp = new Date(expiry);
            const diffMs = exp.getTime() - now.getTime();
            return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        } catch {
            return null;
        }
    }, [subscription?.expiryDate]);
    const isExpired = useMemo(() => {
        if (daysRemaining == null) return false;
        return daysRemaining <= 0;
    }, [daysRemaining]);
    const expiryDateText = useMemo(() => {
        const expiry = subscription?.expiryDate;
        if (!expiry) return "";
        try {
            return new Date(expiry)
                .toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })
                .replace(/\./g, "/");
        } catch {
            return "";
        }
    }, [subscription?.expiryDate]);
    const shouldShowBanner = useMemo(() => {
        if (!subscription?.expiryDate || hideSubBanner) return false;
        if (isExpired) return true;
        if (daysRemaining == null) return false;
        return daysRemaining <= 7;
    }, [subscription?.expiryDate, isExpired, daysRemaining, hideSubBanner]);
    useEffect(() => {
        const updateHeight = () => {
            setBannerHeight(
                shouldShowBanner && bannerRef.current
                    ? bannerRef.current.offsetHeight
                    : 0,
            );
        };
        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, [shouldShowBanner]);
    useEffect(() => {
        try {
            document.documentElement.style.setProperty(
                "--banner-height",
                `${bannerHeight}px`,
            );
        } catch {}
    }, [bannerHeight]);

    // Listen for subscription banner hide event (e.g., after downgrade)
    useEffect(() => {
        const handleBannerHide = () => {
            setHideSubBanner(true);
            localStorage.setItem("hideSubscriptionBanner", "true");
        };

        // Check localStorage on mount
        if (typeof window !== "undefined") {
            if (localStorage.getItem("hideSubscriptionBanner") === "true") {
                setHideSubBanner(true);
            }
        }

        // Listen for custom event
        if (typeof window !== "undefined") {
            window.addEventListener("subscriptionBannerHide", handleBannerHide);
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener(
                    "subscriptionBannerHide",
                    handleBannerHide,
                );
            }
        };
    }, []);

    const dismissBanner = () => {
        setHideSubBanner(true);
        if (typeof window !== "undefined") {
            localStorage.setItem("hideSubscriptionBanner", "true");
        }
    };
    return (
        <>
            {showOrgSelector && (
                <>
                    <div
                        className="fixed inset-0 z-35 bg-black/20"
                        onClick={() => setShowOrgSelector(false)}
                    />

                    <div
                        className="fixed z-40 bg-background border border-border rounded-lg w-80 max-h-[calc(100vh-100px)] overflow-hidden"
                        style={{
                            left: isCollapsed ? "64px" : "192px",
                            bottom: "12px",
                        }}
                    >
                        <div className="p-3 border-b">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t("nav.searchOrg")}
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                            {filteredOrgs.map((org: Organization) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleOrgSelect(org)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
                                >
                                    <div className="size-8 relative">
                                        <Avatar
                                            name={getFirstAndLastWord(org.name)}
                                            src={
                                                getAvatarUrl(
                                                    org.avatar || "",
                                                ) || undefined
                                            }
                                            alt={org.name}
                                            size="32"
                                            round
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">
                                            {org.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {org.subscription == "BUSINESS"
                                                ? "Doanh nghiệp"
                                                : "Cá nhân"}
                                        </div>
                                    </div>
                                    {selectedOrg?.id === org.id && (
                                        <CheckIcon className="size-4 text-blue-600" />
                                    )}
                                </button>
                            ))}
                            {filteredOrgs.length === 0 && (
                                <div className="px-3 py-4 text-sm text-muted-foreground">
                                    {t("common.noResults")}
                                </div>
                            )}
                        </div>

                        <div className="border-t p-2">
                            <button
                                onClick={() => {
                                    setShowOrgSelector(false);
                                    setIsOpenCreateOrg(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                            >
                                <PlusIcon className="size-4" />
                                {t("nav.createOrg")}
                            </button>
                        </div>

                        {isLoading && <Loading />}
                    </div>
                </>
            )}

            {/* <nav
                className="hidden lg:flex h-[57px] bg-sidebar fixed right-0 transition-all duration-300 z-10 border-b"
                style={{
                    top: `${bannerHeight}px`,
                    left: isCollapsed ? "64px" : sidebarWidth,
                    width: isCollapsed
                        ? "calc(100% - 64px)"
                        : `calc(100% - ${sidebarWidth})`,
                }}
            >
                <div className="w-full flex items-center justify-between pr-6">
                    <div
                        className={`flex flex-col ${
                            isCollapsed ? "ml-8" : "ml-2"
                        }`}
                    >
                        <h2 className="text-xl font-medium">
                            {currentPageTitle}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <Popover
                            open={showNotifications}
                            onOpenChange={setShowNotifications}
                        >
                            <PopoverTrigger asChild>
                                <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors relative mr-2">
                                    <BellIcon className="size-5 text-sidebar-foreground" />
                                    {unreadCount > 0 && (
                                        <span className="text-white inline-flex items-center rounded-full border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 absolute -top-[2px] py-[1px] px-[5px] -right-[5px]">
                                            {unreadCount > 99
                                                ? "99+"
                                                : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0 w-96"
                                align="end"
                                sideOffset={10}
                            >
                                <NotificationPanel
                                    onClose={() => setShowNotifications(false)}
                                    onOpenJoinOrg={(defaultTab) => {
                                        setShowNotifications(false);
                                        setJoinOrgDefaultTab(defaultTab);
                                        setOpenJoinOrg(true);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="relative">
                            <Popover
                                open={showUserMenu}
                                onOpenChange={setShowUserMenu}
                            >
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-3 pl-3 border-l border-sidebar-border hover:bg-sidebar-accent rounded-md p-2 transition-colors">
                                        <div className="relative size-8">
                                            <Avatar
                                                name={userDetail?.fullName}
                                                src={
                                                    getAvatarUrl(
                                                        userDetail?.avatar || ""
                                                    ) || undefined
                                                }
                                                alt="User Avatar"
                                                size="32"
                                                round
                                            />
                                        </div>
                                        <span className="font-medium text-sidebar-foreground text-sm">
                                            {userDetail?.fullName}
                                        </span>
                                        <ChevronDownIcon className="size-4 text-sidebar-foreground" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 w-86"
                                    align="end"
                                    sideOffset={10}
                                >
                                    <div className="p-4 border-b bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="relative size-10">
                                                <Avatar
                                                    name={userDetail?.fullName}
                                                    src={
                                                        getAvatarUrl(
                                                            userDetail?.avatar ||
                                                                ""
                                                        ) || undefined
                                                    }
                                                    size="32"
                                                    round
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {userDetail?.fullName}
                                                </div>
                                                <div
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        router.push(
                                                            `/org/${selectedOrg?.id}/settings/my-account`
                                                        );
                                                    }}
                                                    className="text-xs text-muted-foreground underline cursor-pointer"
                                                >
                                                    {t("nav.viewProfile")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="">
                                        {isManager && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    router.push(
                                                        `/org/${selectedOrg?.id}/wallet`
                                                    );
                                                }}
                                                className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-[oklch(0.65_0.28_276_/_0.1)] !px-4 !py-2"
                                            >
                                                <Wallet className="size-4" />
                                                {t("nav.wallet")}:{" "}
                                                <span className="font-bold text-primary">
                                                    {wallet?.credit.toLocaleString(
                                                        "vi-VN"
                                                    )}{" "}
                                                    Coin
                                                </span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-[oklch(0.65_0.28_276_/_0.1)] !px-4 !py-2"
                                            onClick={() => {
                                                setOpenJoinOrg(true);
                                            }}
                                        >
                                            <MdOutlineGroupAdd className="size-4" />
                                            {t("common.joinOrg")}
                                        </Button>
                                        <LanguageSwitcher />
                                        <Button
                                            variant="outline"
                                            onClick={handleLogout}
                                            className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-red-50 hover:text-red-600 !px-4 !py-2"
                                        >
                                            <LogOutIcon className="size-4" />
                                            {t("nav.logout")}
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </nav> */}

            {shouldShowBanner && (
                <div
                    ref={bannerRef}
                    className={cn(
                        "hidden lg:flex items-center gap-3 fixed top-0 right-0 z-20 border-b px-4 py-2 transition-all duration-300 backdrop-blur-md bg-white/20",
                        isExpired
                            ? "text-red-700 border-red-200"
                            : "text-amber-700 border-amber-200",
                    )}
                    style={{
                        left: isCollapsed ? "64px" : sidebarWidth,
                        width: isCollapsed
                            ? "calc(100% - 64px)"
                            : `calc(100% - ${sidebarWidth})`,
                    }}
                >
                    <span className="text-sm">
                        {isManager
                            ? isExpired
                                ? `Gói thuê bao của tổ chức đã hết hạn${
                                      expiryDateText
                                          ? ` (hết hạn vào ngày ${expiryDateText})`
                                          : ""
                                  }. Vui lòng gia hạn để có trải nghiệm tốt nhất.`
                                : `Gói thuê bao sắp hết hạn. Vui lòng gia hạn trước ngày ${
                                      expiryDateText || "hết hạn"
                                  } để có trải nghiệm tốt nhất.`
                            : isExpired
                              ? "Gói thuê bao của tổ chức đã hết hạn. Vui lòng liên hệ với chủ tổ chức hoặc quản trị viên để gia hạn."
                              : `Gói thuê bao của tổ chức sẽ hết hạn vào ngày ${
                                    expiryDateText || "..."
                                }. Vui lòng liên hệ với chủ tổ chức hoặc quản trị viên để gia hạn.`}
                        {isManager && (
                            <button
                                onClick={() => {
                                    setUpgradeType(subscription?.name || null);
                                    setIsRenewal(true);
                                    setOpenUpgradeDialog(true);
                                }}
                                className={cn(
                                    "underline pl-1 pr-0 py-0 m-0 bg-transparent border-0 cursor-pointer align-baseline",
                                    "text-sm font-medium",
                                    isExpired
                                        ? "text-red-700 hover:text-red-800"
                                        : "text-amber-700 hover:text-amber-800",
                                )}
                            >
                                Gia hạn ngay
                            </button>
                        )}
                    </span>
                    {/* Close button removed as requested */}
                </div>
            )}

            <aside
                className={cn(
                    "hidden lg:flex flex-col transition-all duration-300 h-full min-w-64",
                )}
            >
                <div className="h-full flex flex-col w-full rounded-none md:rounded-2xl bg-sidebar border-r">
                    <div className="p-6 flex items-center justify-between border-b border-white/20">
                        <div className="flex items-center space-x-3">
                            <div className="group cursor-pointer">
                                <Image
                                    src="/icons/logo_without_text.svg"
                                    alt="COKA LOGO"
                                    width={40}
                                    height={40}
                                    className="transform transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            {!isCollapsed && (
                                <span className="font-bold text-2xl text-gray-800 tracking-tight drop-shadow-sm">
                                    COKA
                                </span>
                            )}
                        </div>

                        {/* {!isCollapsed && (
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <PanelLeftClose
                                    size={20}
                                    className="text-gray-600"
                                />
                            </button>
                        )} */}
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 space-y-1.5 px-4 custom-scrollbar">
                        {navItems.map((item) => {
                            const key = item.href ?? item.label;
                            let isActive =
                                item.href && pathname.startsWith(item.href);

                            // Special case for Settings to stay active on sub-pages
                            if (
                                item.href &&
                                item.href.includes("/settings") &&
                                pathname.includes("/settings")
                            ) {
                                isActive = true;
                            }
                            // Always try to get animated icon first
                            const iconId = getIconId(item.href, item.label);
                            const animatedIcon = iconId
                                ? renderIcon(iconId)
                                : null;
                            // Debug: uncomment to see what's being matched
                            // if (!animatedIcon && item.label) {
                            //     console.log("No animation for:", item.label, "iconId:", iconId);
                            // }

                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        if (item.href) {
                                            router.push(item.href);
                                        }
                                    }}
                                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                                        isActive
                                            ? "bg-white/40 text-gray-900 font-semibold shadow-lg border border-white/40 backdrop-blur-md"
                                            : "text-gray-600 hover:bg-white/20 hover:text-gray-900 hover:shadow-md hover:border hover:border-white/10"
                                    }`}
                                >
                                    <span
                                        className={`relative z-10 transition-colors duration-300 ${
                                            isActive
                                                ? "text-indigo-600"
                                                : "text-gray-500 group-hover:text-gray-800"
                                        }`}
                                    >
                                        {animatedIcon ||
                                            (item.icon ? (
                                                <item.icon className="size-5" />
                                            ) : null)}
                                    </span>
                                    {!isCollapsed && (
                                        <span className="relative z-10">
                                            {item.label}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* User Mini Profile */}
                    <div className="p-4 backdrop-blur-md mt-auto border-t border-white/20">
                        <button
                            onClick={() => setShowOrgSelector(!showOrgSelector)}
                            className="w-full flex items-center space-x-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md border border-white/20">
                                {selectedOrg?.name
                                    ? selectedOrg.name
                                          .substring(0, 2)
                                          .toUpperCase()
                                    : "ORG"}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">
                                        {selectedOrg?.name || "Organization"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate font-medium">
                                        {orgDetail?.planName ||
                                            orgDetail?.plan ||
                                            "Enterprise Plan"}
                                    </p>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-8 top-4 bg-white/40 backdrop-blur-md p-1 hover:bg-white/60 transition-colors z-10 rounded-md border border-white/50"
                    >
                        <PanelRightClose className="size-4 text-gray-600" />
                    </button>
                )}
            </aside>
            {openJoinOrg && (
                <JoinOrg
                    open={openJoinOrg}
                    setOpen={setOpenJoinOrg}
                    defaultTab={joinOrgDefaultTab}
                />
            )}
            {openUpgradeDialog && (
                <UpgradeSupscriptionDialog
                    open={openUpgradeDialog}
                    setOpen={(open: boolean) => {
                        setOpenUpgradeDialog(open);
                        if (!open) {
                            setIsRenewal(false);
                        }
                    }}
                    subscription={subscription}
                    upgradeType={upgradeType}
                    isRenewal={isRenewal}
                    onSuccess={() => {
                        setHideSubBanner(true);
                        setIsRenewal(false);
                        if (selectedOrg?.id) {
                            getOrgUsageStatistics(selectedOrg.id).then(
                                (res) => {
                                    setSubscription(res.content);
                                },
                            );
                        }
                    }}
                />
            )}
            {isOpenCreateOrg && (
                <CreateOrgDialog
                    open={isOpenCreateOrg}
                    setOpen={setIsOpenCreateOrg}
                />
            )}
        </>
    );
}

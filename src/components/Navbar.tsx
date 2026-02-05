"use client";
import React, { useState, useRef, useMemo } from "react";
import {
    Search,
    Bell,
    ChevronDown,
    Menu,
    X,
    CheckCircle,
    AlertTriangle,
    Info,
    Wallet,
    LogOutIcon,
} from "lucide-react";
import { Glass } from "./Glass";
import { cn } from "@/lib/utils";
import { useUserDetail } from "@/hooks/useUser";
import { useGetOrgDetail } from "@/hooks/useOrgV2";
import { useParams } from "next/navigation";
import { getAvatarUrl } from "@/lib/utils";
import NotificationPanel from "./ui/notification-panel";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import Avatar from "react-avatar";
import { Button } from "./ui/button";
import { MdOutlineGroupAdd } from "react-icons/md";
import { LanguageSwitcher } from "./ui/language-switcher";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWalletDetail } from "@/hooks/usePayment";
import { removeAuthTokens } from "@/lib/authCookies";
import { useQueryClient } from "@tanstack/react-query";
import { JoinOrg } from "./join_org";

interface NavbarProps {
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
    pageTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
    isSidebarOpen,
    onToggleSidebar,
    pageTitle = "COKA CRM",
}) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { t } = useLanguage();
    const { orgId } = useParams();
    const { data: userDetail } = useUserDetail();
    const { data: orgDetailResponse } = useGetOrgDetail(
        (orgId as string) || "",
    );
    const orgDetail = orgDetailResponse?.content;
    const { data: unreadCountData } = useUnreadNotificationCount(
        orgId as string,
    );
    const unreadCount = unreadCountData?.content || 0;

    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [openJoinOrg, setOpenJoinOrg] = useState(false);
    const [joinOrgDefaultTab, setJoinOrgDefaultTab] = useState<
        "join" | "request" | "invited"
    >("join");
    const userName = userDetail?.fullName || "User";
    const userAvatar = getAvatarUrl(userDetail?.avatar || "");
    const orgName = orgDetail?.name || "Organization";
    const isManager = useMemo(() => {
        return orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";
    }, [orgDetail?.type]);
    const { data: walletDetail } = useWalletDetail(
        isManager ? (orgId as string) : "",
    );
    const wallet = walletDetail?.content;

    const handleLogout = () => {
        // Remove auth tokens first
        removeAuthTokens();
        // Remove all queries without triggering refetch
        queryClient.removeQueries();
        router.push("/sign-in");
    };
    return (
        <>
            <div className="h-16 flex items-center justify-between px-2 mb-2 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2.5 bg-white/40 border border-white/50 rounded-xl shadow-sm backdrop-blur-md active:scale-95 transition-transform"
                    >
                        <Menu size={20} className="text-gray-800" />
                    </button>

                    <div className="px-4 py-2 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm hidden md:block">
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng, công việc..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 focus:bg-white/60 focus:ring-2 focus:ring-indigo-300/50 outline-none w-80 transition-all text-sm shadow-sm"
                        />
                        <Search
                            className="absolute left-3 top-2.5 text-gray-500"
                            size={18}
                        />
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <Popover
                            open={showNotifications}
                            onOpenChange={setShowNotifications}
                        >
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        "p-2.5 rounded-full border transition-all relative group shadow-sm",
                                        showNotifications
                                            ? "bg-white border-indigo-200"
                                            : "bg-white/40 backdrop-blur-md border border-white/50 hover:bg-white/60",
                                    )}
                                >
                                    <Bell
                                        size={20}
                                        className={cn(
                                            "transition-colors",
                                            showNotifications
                                                ? "text-indigo-600"
                                                : "text-gray-700 group-hover:animate-bell-ring",
                                        )}
                                    />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md ring-2 ring-white">
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
                                        // Handle join org logic here if needed
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="relative">
                        <Popover
                            open={showUserMenu}
                            onOpenChange={setShowUserMenu}
                        >
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-gray-800">
                                            {userName}
                                        </p>
                                        <p className="text-xs text-indigo-600 font-medium">
                                            {orgName}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg ring-2 ring-white/30 cursor-pointer hover:scale-105 transition-transform">
                                        <Avatar
                                            name={userName}
                                            src={userAvatar || undefined}
                                            size="40"
                                            className="object-cover"
                                            round
                                        />
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className="text-gray-600 hidden sm:block"
                                    />
                                </div>
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
                                                            "",
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
                                                        `/org/${orgId}/settings/my-account`,
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
                                                    `/org/${orgId}/wallet`,
                                                );
                                            }}
                                            className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-[oklch(0.65_0.28_276/0.1)] px-4! py-2!"
                                        >
                                            <Wallet className="size-4" />
                                            {t("nav.wallet")}:{" "}
                                            <span className="font-bold text-primary">
                                                {wallet?.credit.toLocaleString(
                                                    "vi-VN",
                                                )}{" "}
                                                Coin
                                            </span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-[oklch(0.65_0.28_276/0.1)] px-4! py-2!"
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
                                        className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-red-50 hover:text-red-600 px-4! py-2!"
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
            {openJoinOrg && (
                <JoinOrg
                    open={openJoinOrg}
                    setOpen={setOpenJoinOrg}
                    defaultTab={joinOrgDefaultTab}
                />
            )}
        </>
    );
};

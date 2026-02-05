"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getAccessToken } from "@/lib/authCookies";
import CallView from "./call_view";

interface Props {
    children: React.ReactNode;
}

export default function LayoutWrapper({ children }: Props) {
    const pathname = usePathname();
    const router = useRouter();

    // Hide sidebar on auth-related routes
    const hideSidebar =
        pathname.startsWith("/sign-in") || pathname.startsWith("/verify");

    // Client-side auth guard (covers static pages & dev mode)
    useEffect(() => {
        if (!hideSidebar) {
            const token = getAccessToken();
            if (!token) {
                router.replace(`/sign-in`);
            }
        }
    }, [hideSidebar, pathname, router]);

    if (hideSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main
                className="w-full main-content overflow-y-auto bg-white transition-[padding-top] duration-300"
                style={{ paddingTop: "calc(57px + var(--banner-height, 0px))" }}
            >
                {children}
            </main>
            {/* CallView được render ở đây để không bị ảnh hưởng bởi overflow của main */}
            <CallView />
        </div>
    );
}

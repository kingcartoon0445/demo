"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getAccessToken } from "@/lib/authCookies";
import CallView from "./call_view";
import { Navbar } from "./Navbar";

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
        <div className="relative h-screen w-full overflow-hidden text-gray-800 font-sans flex bg-slate-50">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
                <div className="absolute top-[5%] right-[-5%] w-[35vw] h-[35vw] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>
            </div>
            <div className="relative z-10 flex w-full h-full max-w-[1920px] mx-auto gap-1 md:gap-2 min-w-0">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    <Navbar onToggleSidebar={() => {}} />
                    <main className="flex-1 min-h-0 min-w-0 flex flex-col ">
                        {children}
                    </main>
                </div>
                <CallView />
            </div>
        </div>
        // <div className="flex h-screen">
        //     <Sidebar />
        //     <main
        //         className="w-full main-content overflow-y-auto bg-white transition-[padding-top] duration-300"
        //         style={{ paddingTop: "calc(57px + var(--banner-height, 0px))" }}
        //     >
        //         {children}
        //     </main>
        //     {/* CallView được render ở đây để không bị ảnh hưởng bởi overflow của main */}
        //     <CallView />
        // </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingPage from "./LoadingPage";

export default function LoadingWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    // Danh sách các trang không cần hiển thị loading
    const excludePages = ["/sign-in", "/verify"];
    const shouldShowLoading = !excludePages.some((page) =>
        pathname.startsWith(page)
    );

    useEffect(() => {
        if (!shouldShowLoading) {
            setIsLoading(false);
            return;
        }

        // Hiển thị loading trong 2 giây
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [shouldShowLoading]);

    // Nếu không cần hiển thị loading hoặc đã hết thời gian loading
    if (!shouldShowLoading || !isLoading) {
        return <>{children}</>;
    }

    // Hiển thị trang loading
    return <LoadingPage isAnimate={true} />;
}

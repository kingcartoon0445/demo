import { useEffect, useState } from "react";

const getBreakpoint = (width: number) => {
    if (width >= 1536) return "2xl";
    if (width >= 1280) return "xl";
    if (width >= 1024) return "lg";
    if (width >= 768) return "md";
    if (width >= 640) return "sm";
    return "base";
};

export default function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState(() => {
        if (typeof window !== "undefined") {
            return getBreakpoint(window.innerWidth);
        }
        return "base";
    });

    useEffect(() => {
        const handleResize = () => {
            const newBreakpoint = getBreakpoint(window.innerWidth);
            setBreakpoint(newBreakpoint);
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Gọi lần đầu

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return breakpoint;
}

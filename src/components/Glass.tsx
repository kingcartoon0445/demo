"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface GlassProps {
    children: React.ReactNode;
    className?: string;
    intensity?: "low" | "medium" | "high" | "dark";
    border?: boolean;
    striped?: boolean;
}

export const Glass: React.FC<GlassProps> = ({
    children,
    className = "",
    intensity = "medium",
    border = true,
    striped = false,
}) => {
    // Enhanced Glassmorphism: Lighter opacities, stronger blurs, crisp borders
    const bgIntensity = {
        low: "bg-white/10 backdrop-blur-md",
        medium: "bg-white/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]",
        high: "bg-white/60 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]",
        dark: "bg-black/20 backdrop-blur-xl", // For tooltips
    };

    const borderClass = border
        ? "border border-white/40 ring-1 ring-white/20"
        : "";

    const stripedClass = striped
        ? "bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:40px_40px]"
        : "";

    return (
        <div
            className={cn(
                bgIntensity[intensity],
                borderClass,
                stripedClass,
                className
            )}
        >
            {children}
        </div>
    );
};

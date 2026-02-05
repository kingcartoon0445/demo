"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    intensity?: "low" | "medium" | "high" | "dark";
    border?: boolean;
}

export const Glass: React.FC<GlassProps> = ({
    children,
    className = "",
    intensity = "medium",
    border = true,
    ...props
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

    return (
        <div
            className={cn(bgIntensity[intensity], borderClass, className)}
            {...props}
        >
            {children}
        </div>
    );
};

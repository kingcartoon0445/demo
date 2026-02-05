"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface TabItem {
    id: string;
    label?: React.ReactNode;

    icon?: React.ReactNode;
}

interface GlassTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
    size?: "sm" | "default";
    fullWidth?: boolean;
}

export function GlassTabs({
    tabs,
    activeTab,
    onChange,
    className,
    size = "default",
    fullWidth = false,
}: GlassTabsProps) {
    return (
        <div
            className={cn(
                "inline-flex border-b border-gray-200",
                fullWidth ? "w-full flex" : "",
                className,
            )}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 font-medium transition-all duration-200 z-10 rounded-xl",
                            size === "sm"
                                ? "px-5 py-2.5 text-sm"
                                : "px-6 py-3 text-[14px]",
                            isActive
                                ? "text-indigo-600 bg-indigo-50/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                            fullWidth ? "flex-1" : "",
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-underline"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-full -z-10"
                                transition={{ type: "spring", duration: 0.5 }}
                            />
                        )}
                        {tab.icon && (
                            <span
                                className={cn(
                                    "transition-colors duration-200",
                                    isActive
                                        ? "text-indigo-600"
                                        : "text-current",
                                )}
                            >
                                {tab.icon}
                            </span>
                        )}
                        {tab.label && <span>{tab.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}

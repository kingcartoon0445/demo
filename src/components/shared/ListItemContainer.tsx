import React from "react";
import { Glass } from "@/components/Glass";
import { cn } from "@/lib/utils";

interface ListItemContainerProps {
    variant?: "glass" | "default";
    selected?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    intensity?: "low" | "medium" | "high";
}

export const ListItemContainer: React.FC<ListItemContainerProps> = ({
    variant = "default",
    selected = false,
    onClick,
    children,
    className = "",
    intensity = "medium",
}) => {
    if (variant === "glass") {
        return (
            <Glass
                intensity={intensity}
                border={true}
                className={cn(
                    "p-3 mb-2 mx-2 rounded-lg hover:bg-white/40 cursor-pointer transition-all duration-200 w-auto group",
                    className,
                )}
                onClick={onClick}
            >
                <div className="flex items-start gap-3">{children}</div>
            </Glass>
        );
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-2xl cursor-pointer transition-all duration-300 border group relative",
                selected
                    ? "bg-white/90 border-indigo-200 shadow-md transform scale-[1.01]"
                    : "bg-white/40 border-white/30 hover:bg-white/60 hover:shadow-sm",
                className,
            )}
        >
            <div className="flex items-start gap-3">{children}</div>
        </div>
    );
};

"use client";

import * as React from "react";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

interface ListSkeletonProps {
    rows?: number;
    showAvatar?: boolean;
    showRadio?: boolean;
    hasSecondaryText?: boolean;
    className?: string;
}

/**
 * ListSkeleton renders a list-like skeleton placeholder with optional radio and avatar.
 * Useful for command lists, pickers, and search results.
 */
export function ListSkeleton({
    rows = 3,
    showAvatar = true,
    showRadio = true,
    hasSecondaryText = true,
    className,
}: ListSkeletonProps) {
    return (
        <div className={cn("space-y-2 p-2", className)}>
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center space-x-2 p-2 animate-pulse"
                >
                    {showRadio && <Skeleton className="w-4 h-4 rounded-full" />}
                    {showAvatar && (
                        <Skeleton className="w-8 h-8 rounded-full" />
                    )}
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        {hasSecondaryText && <Skeleton className="h-3 w-1/2" />}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ListSkeleton;

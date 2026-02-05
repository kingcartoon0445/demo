import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    /** Position of tooltip relative to the trigger. Defaults to 'top'. */
    side?: "top" | "right" | "bottom" | "left";
    /** Distance in pixels from the trigger. Default 4 */
    sideOffset?: number;
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
    return (
        <TooltipPrimitive.Provider delayDuration={200} skipDelayDuration={0}>
            {children}
        </TooltipPrimitive.Provider>
    );
}

export function Tooltip({
    children,
    content,
    side = "top",
    sideOffset = 4,
}: TooltipProps) {
    return (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
                {children}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side={side}
                    sideOffset={sideOffset}
                    className={cn(
                        "z-50 overflow-hidden rounded-md bg-white px-2 py-1.5 text-xs text-black shadow-md data-[state=delayed-open]:animate-fade-in",
                    )}
                >
                    {content}
                    <TooltipPrimitive.Arrow className="fill-white" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
}

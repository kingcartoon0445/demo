// File: components/CustomInput.tsx

import React, { memo } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export const CustomInput = memo(
    ({
        children,
        className,
        onChange,
        ...props
    }: React.ComponentPropsWithoutRef<typeof Input> & {
        children: React.ReactNode;
    }) => {
        return (
            <div className="flex border border-gray-300 rounded-lg">
                <div className="pl-3 pr-2 bg-[var(--bg1)] rounded-l-xl whitespace-nowrap flex-nowrap flex items-center justify-center">
                    <div className="border-r-[1px] pr-2 text-sm">
                        {children}
                    </div>
                </div>
                <input
                    {...props}
                    className={cn(
                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-none rounded-r-xl border-none bg-[var(--bg1)] px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-0",
                        className
                    )}
                    onChange={onChange}
                />
            </div>
        );
    }
);

CustomInput.displayName = "CustomInput";

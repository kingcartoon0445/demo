"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputOTPProps {
    className?: string;
    maxLength: number;
    value?: string;
    onChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

interface InputOTPGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
    index: number;
    className?: string;
    value?: string;
    isActive?: boolean;
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
    (
        {
            className,
            maxLength,
            value = "",
            onChange,
            onComplete,
            disabled,
            autoFocus,
            ...props
        },
        ref
    ) => {
        const [internalValue, setInternalValue] = React.useState(value);
        const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

        React.useEffect(() => {
            setInternalValue(value || "");
        }, [value]);

        React.useEffect(() => {
            if (autoFocus && inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        }, [autoFocus]);

        const handleChange = (index: number, newValue: string) => {
            // Handle paste operation - if multiple characters are pasted
            if (newValue.length > 1) {
                const pastedValue = newValue.slice(0, maxLength);
                const newInternalValue = pastedValue.split("");

                // Fill all slots with pasted characters
                const updatedValue = newInternalValue.join("");
                setInternalValue(updatedValue);
                onChange?.(updatedValue);

                // Focus the next empty slot or the last slot
                const nextEmptyIndex = Math.min(
                    pastedValue.length,
                    maxLength - 1
                );
                inputRefs.current[nextEmptyIndex]?.focus();

                if (updatedValue.length === maxLength) {
                    onComplete?.(updatedValue);
                }
                return;
            }

            const newInternalValue = internalValue.split("");
            newInternalValue[index] = newValue;
            const updatedValue = newInternalValue.join("").slice(0, maxLength);

            setInternalValue(updatedValue);
            onChange?.(updatedValue);

            if (newValue && index < maxLength - 1) {
                inputRefs.current[index + 1]?.focus();
            }

            if (updatedValue.length === maxLength) {
                onComplete?.(updatedValue);
            }
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
            if (e.key === "Backspace" && !internalValue[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        };

        const handlePaste = (e: React.ClipboardEvent) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData("text");
            const cleanData = pastedData.replace(/\D/g, ""); // Remove non-numeric characters

            if (cleanData.length > 0) {
                const pastedValue = cleanData.slice(0, maxLength);
                setInternalValue(pastedValue);
                onChange?.(pastedValue);

                // Focus the next empty slot or the last slot
                const nextEmptyIndex = Math.min(
                    pastedValue.length,
                    maxLength - 1
                );
                inputRefs.current[nextEmptyIndex]?.focus();

                if (pastedValue.length === maxLength) {
                    onComplete?.(pastedValue);
                }
            }
        };

        return (
            <div
                ref={ref}
                className={cn("flex items-center gap-2", className)}
                {...props}
            >
                {Array.from({ length: maxLength }, (_, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={internalValue[index] || ""}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={disabled}
                        className="h-11 w-11 md:h-14 md:w-14 text-center bg-[#F9F9F9] text-lg rounded-md shadow-md border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                ))}
            </div>
        );
    }
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<HTMLDivElement, InputOTPGroupProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex items-center gap-2", className)}
            {...props}
        >
            {children}
        </div>
    )
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
    ({ className, value, isActive, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex h-11 w-11 md:h-14 md:w-14 items-center justify-center bg-[#F9F9F9] text-lg transition-all rounded-md shadow-md",
                    isActive && "ring-2 ring-blue-500",
                    className
                )}
                {...props}
            >
                {value}
            </div>
        );
    }
);
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSlot };

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
    value?: string; // ISO string
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Chọn ngày",
    disabled = false,
    className,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Convert ISO string to Date
    const selectedDate = value ? new Date(value) : undefined;

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            // Convert to ISO string
            const isoString = date.toISOString();
            onChange(isoString);
        } else {
            onChange("");
        }
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Input
                        value={
                            selectedDate
                                ? format(selectedDate, "dd/MM/yyyy", {
                                      locale: vi,
                                  })
                                : ""
                        }
                        placeholder={placeholder}
                        className={cn(
                            "pr-8 cursor-pointer",
                            disabled && "cursor-not-allowed opacity-50",
                            className
                        )}
                        readOnly
                        disabled={disabled}
                        onClick={() => !disabled && setIsOpen(true)}
                    />
                    <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

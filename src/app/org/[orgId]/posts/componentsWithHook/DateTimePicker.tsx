"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/time-picker";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
    value?: string; // ISO string
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Chọn ngày và giờ",
    disabled = false,
    className,
}: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        value ? new Date(value) : undefined
    );
    const [selectedTime, setSelectedTime] = useState<{
        hour: number;
        minute: number;
    } | null>(
        value
            ? {
                  hour: new Date(value).getHours(),
                  minute: new Date(value).getMinutes(),
              }
            : null
    );

    // Sync state khi value thay đổi từ bên ngoài
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setSelectedDate(date);
            setSelectedTime({
                hour: date.getHours(),
                minute: date.getMinutes(),
            });
        } else {
            setSelectedDate(undefined);
            setSelectedTime(null);
        }
    }, [value]);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const newDate = new Date(date);
            if (selectedTime) {
                newDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
            } else {
                // Nếu chưa có time, dùng thời gian hiện tại
                const now = new Date();
                newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                setSelectedTime({
                    hour: now.getHours(),
                    minute: now.getMinutes(),
                });
            }
            setSelectedDate(newDate);
            onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
        } else {
            setSelectedDate(undefined);
            onChange("");
        }
    };

    const handleTimeChange = (time: { hour: number; minute: number }) => {
        setSelectedTime(time);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(time.hour, time.minute, 0, 0);
            setSelectedDate(newDate);
            onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
        } else {
            // Nếu chưa chọn date, dùng ngày hôm nay
            const today = new Date();
            today.setHours(time.hour, time.minute, 0, 0);
            setSelectedDate(today);
            onChange(format(today, "yyyy-MM-dd'T'HH:mm"));
        }
    };

    const displayValue = selectedDate
        ? format(selectedDate, "dd/MM/yyyy HH:mm", { locale: vi })
        : "";

    // TimePicker trong "@/components/time-picker" là JS + forwardRef không có kiểu props,
    // nên cần wrap lại thành any để tránh lỗi type khi truyền value/onChange.
    const AnyTimePicker: any = TimePicker;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Input
                        value={displayValue}
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
                    <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                    <div>
                        <div className="text-sm font-medium mb-2">
                            Chọn ngày
                        </div>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </div>
                    <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">Chọn giờ</div>
                        <AnyTimePicker
                            value={
                                selectedTime
                                    ? {
                                          hour: selectedTime.hour,
                                          minute: selectedTime.minute,
                                      }
                                    : undefined
                            }
                            onChange={(time: {
                                hour: number;
                                minute: number;
                            }) => {
                                handleTimeChange(time);
                            }}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

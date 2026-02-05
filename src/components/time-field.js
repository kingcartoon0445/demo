"use client"

import { useState, useEffect, forwardRef } from "react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

const TimeField = forwardRef((props, ref) => {
    const { value, onChange, isDisabled, disabled, className, maxHour = 999 } = props;
    const [hours, setHours] = useState("");
    const [minutes, setMinutes] = useState("");
    
    // Khởi tạo giá trị từ prop value nếu có
    useEffect(() => {
        if (value) {
            const timeValue = dayjs(value);
            // Lấy tổng số giờ (có thể lớn hơn 24)
            let totalHours = 0;
            if (typeof value === 'object' && value.hour !== undefined) {
                totalHours = value.hour;
                setMinutes(value.minute?.toString().padStart(2, '0') || "00");
            } else if (typeof value === 'string') {
                const parts = value.split(':');
                totalHours = parseInt(parts[0] || "0");
                setMinutes(parts[1] || "00");
            } else {
                totalHours = timeValue.hour();
                setMinutes(timeValue.minute().toString().padStart(2, '0'));
            }
            setHours(totalHours.toString());
        }
    }, [value]);

    // Xử lý khi giá trị thay đổi
    const handleTimeChange = (newHours, newMinutes) => {
        if (onChange) {
            const hoursNum = parseInt(newHours || "0");
            const minutesNum = parseInt(newMinutes || "0");
            
            // Đảm bảo giá trị hợp lệ
            const validHours = isNaN(hoursNum) ? 0 : Math.min(Math.max(0, hoursNum), maxHour);
            const validMinutes = isNaN(minutesNum) ? 0 : Math.min(Math.max(0, minutesNum), 59);
            
            onChange({
                hour: validHours,
                minute: validMinutes,
                toString: () => `${validHours}:${validMinutes.toString().padStart(2, '0')}`
            });
        }
    };

    // Sử dụng cả isDisabled và disabled để đảm bảo tính tương thích
    const isFieldDisabled = isDisabled || disabled;

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex h-10 w-full flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isFieldDisabled ? "cursor-not-allowed opacity-50" : "",
                className
            )}
        >
            <input
                type="number"
                min="0"
                max={maxHour}
                value={hours}
                onChange={(e) => {
                    setHours(e.target.value);
                    handleTimeChange(e.target.value, minutes);
                }}
                disabled={isFieldDisabled}
                className="w-8 bg-transparent outline-none text-right"
                placeholder="00"
            />
            <span className="mx-1">:</span>
            <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => {
                    setMinutes(e.target.value);
                    handleTimeChange(hours, e.target.value);
                }}
                disabled={isFieldDisabled}
                className="w-8 bg-transparent outline-none"
                placeholder="00"
            />
        </div>
    );
});

TimeField.displayName = "TimeField";

export { TimeField };

import { useState, useEffect } from "react";

/**
 * Custom hook để debounce một giá trị
 * @param value Giá trị cần debounce
 * @param delay Thời gian delay (ms)
 * @returns Giá trị đã được debounce
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Tạo một timeout để cập nhật giá trị debounced sau một khoảng thời gian
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Xóa timeout nếu giá trị thay đổi hoặc component unmount
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook để tạo một hàm debounced
 * @param callback Hàm cần debounce
 * @param delay Thời gian delay (ms)
 * @returns Hàm đã được debounce
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const debouncedCallback = (...args: Parameters<T>) => {
        // Xóa timeout hiện tại nếu có
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Tạo timeout mới
        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };

    // Xóa timeout khi component unmount
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return debouncedCallback;
}

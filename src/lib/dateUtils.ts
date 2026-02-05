/**
 * Tính toán thời gian tương đối từ một ngày đến hiện tại
 * @param dateString - Chuỗi ngày cần tính toán
 * @param t - Translation function từ useLanguage
 * @param isShort - Hiển thị ngắn gọn
 * @param isConvertFormat - Chuyển đổi định dạng
 * @returns Chuỗi thời gian tương đối (ví dụ: "1 năm trước", "2 tháng trước", "7 ngày trước")
 */
export function getRelativeTime(
    dateString: string,
    t: (key: string) => string,
    isShort: boolean = false,
    isConvertFormat: boolean = false
): string {
    let targetDate;
    if (isConvertFormat) {
        // Chuyển định dạng DD/MM/YYYY thành Date object
        const [day, month, year] = dateString.split("/").map(Number);
        targetDate = new Date(year, month - 1, day);
    } else {
        targetDate = new Date(dateString);
    }

    const now = new Date();
    const diffInMs = now.getTime() - targetDate.getTime();

    if (isNaN(targetDate.getTime())) {
        return t("common.invalidDate");
    }

    if (diffInMs < 0) {
        return t("common.justNow");
    }

    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) {
        return `${years} ${isShort ? t("common.year") : t("common.yearAgo")}`;
    }

    if (months > 0) {
        return `${months} ${
            isShort ? t("common.month") : t("common.monthAgo")
        }`;
    }

    if (days > 0) {
        return `${days} ${isShort ? t("common.day") : t("common.dayAgo")}`;
    }

    if (hours > 0) {
        return `${hours} ${isShort ? t("common.hour") : t("common.hourAgo")}`;
    }

    if (minutes > 0) {
        return `${minutes} ${
            isShort ? t("common.minute") : t("common.minuteAgo")
        }`;
    }

    return t("common.justNow");
}

/**
 * Tính toán thời gian tương đối với độ chính xác cao hơn
 * @param dateString - Chuỗi ngày cần tính toán
 * @returns Chuỗi thời gian tương đối chi tiết
 */
export function getPreciseRelativeTime(dateString: string): string {
    const targetDate = new Date(dateString);
    const now = new Date();

    if (now.getTime() - targetDate.getTime() < 0) {
        return "Vừa xong";
    }

    // Tính toán chính xác hơn bằng cách sử dụng Date methods
    let years = now.getFullYear() - targetDate.getFullYear();
    let months = now.getMonth() - targetDate.getMonth();
    let days = now.getDate() - targetDate.getDate();
    let hours = now.getHours() - targetDate.getHours();
    let minutes = now.getMinutes() - targetDate.getMinutes();

    // Điều chỉnh nếu có số âm
    if (minutes < 0) {
        minutes += 60;
        hours--;
    }

    if (hours < 0) {
        hours += 24;
        days--;
    }

    if (days < 0) {
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
    }

    if (months < 0) {
        months += 12;
        years--;
    }

    const parts: string[] = [];

    if (years > 0) parts.push(`${years} năm`);
    if (months > 0) parts.push(`${months} tháng`);
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0 && years === 0) parts.push(`${hours} giờ`);
    if (minutes > 0 && years === 0 && months === 0)
        parts.push(`${minutes} phút`);

    if (parts.length === 0) {
        return "Vừa xong";
    }

    return parts.slice(0, 2).join(" ");
}

/**
 * Format ngày giờ theo định dạng Việt Nam
 * @param dateString - Chuỗi ngày cần format
 * @returns Chuỗi ngày giờ đã format
 */
export function formatVietnameseDate(dateString: string): string {
    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

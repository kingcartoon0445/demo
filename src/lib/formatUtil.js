import {
    format,
    parseISO,
    formatDistance,
    differenceInMilliseconds,
    isAfter,
} from "date-fns";
import { vi } from "date-fns/locale";

// Utility functions cho reminder
export const formatUtils = {
    // Hàm chuyển đổi chuỗi Contact từ JSON sang đối tượng
    parseContact: (contactString) => {
        try {
            if (!contactString) return null;

            const contacts = JSON.parse(contactString);
            return Array.isArray(contacts) && contacts.length > 0
                ? contacts[0]
                : null;
        } catch (error) {
            console.error("Lỗi khi parse thông tin contact:", error);
            return null;
        }
    },

    // Hàm để format ngày từ ISO string
    formatDate: (isoString) => {
        try {
            return format(parseISO(isoString), "dd/MM/yyyy");
        } catch (error) {
            return "";
        }
    },

    // Hàm để format đầy đủ ngày giờ từ ISO string
    formatDateTime: (isoString) => {
        try {
            return format(parseISO(isoString), "HH:mm - dd/MM/yyyy", {
                locale: vi,
            });
        } catch (error) {
            return "";
        }
    },

    // Hàm tính thời gian còn lại đến khi bắt đầu sự kiện
    getTimeRemaining: (isoString) => {
        try {
            const startDate = parseISO(isoString);
            const now = new Date();

            // Nếu thời gian bắt đầu đã qua
            if (isAfter(now, startDate)) {
                return "Đã bắt đầu";
            }

            // Tính khoảng cách thời gian
            return formatDistance(startDate, now, {
                addSuffix: true,
                locale: vi,
            });
        } catch (error) {
            return "";
        }
    },

    // Hàm kiểm tra xem một nhắc hẹn đã quá hạn hay chưa
    isOverdue: (endTimeIso) => {
        try {
            const endTime = parseISO(endTimeIso);
            const now = new Date();

            // Nếu thời gian hiện tại đã vượt qua thời gian kết thúc
            return isAfter(now, endTime);
        } catch (error) {
            return false;
        }
    },

    // Hàm tính thời gian đã quá hạn
    getOverdueTime: (endTimeIso) => {
        try {
            const endTime = parseISO(endTimeIso);
            const now = new Date();
            if (isAfter(now, endTime)) {
                return formatDistance(endTime, now, {
                    locale: vi,
                    addSuffix: false,
                });
            }
            return "";
        } catch (error) {
            return "";
        }
    },

    // Hàm kiểm tra xem RepeatRule có chứa tất cả các ngày trong tuần hay không
    isEveryDayOfWeek: (repeatRule) => {
        if (
            !repeatRule ||
            !Array.isArray(repeatRule) ||
            repeatRule.length === 0
        ) {
            return false;
        }

        // Danh sách tất cả các ngày trong tuần
        const allDaysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

        // Tạo set các ngày từ RepeatRule
        const daysSet = new Set(repeatRule.map((rule) => rule.day));

        // Kiểm tra xem tất cả các ngày trong tuần có nằm trong set không
        return allDaysOfWeek.every((day) => daysSet.has(day));
    },
};

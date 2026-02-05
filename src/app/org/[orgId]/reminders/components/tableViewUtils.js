import { format, parseISO, formatDistance, isAfter } from "date-fns";
import { vi } from "date-fns/locale";

// Các hàm tiện ích cho TableView
export const tableViewUtils = {
  parseContact: (contactString) => {
    try {
      if (!contactString) return null;
      const contacts = JSON.parse(contactString);
      return Array.isArray(contacts) && contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      console.error("Lỗi khi parse thông tin contact:", error);
      return null;
    }
  },

  formatDateTime: (isoString) => {
    try {
      return format(parseISO(isoString), "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return "";
    }
  },
  
  formatTime: (isoString) => {
    try {
      return format(parseISO(isoString), "HH:mm", { locale: vi });
    } catch (error) {
      return "";
    }
  },
  
  formatDate: (isoString) => {
    try {
      return format(parseISO(isoString), "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return "";
    }
  },

  formatDateTimeRange: (startTime, endTime) => {
    try {
      if (!startTime) return "";
      
      const start = parseISO(startTime);
      const startDate = format(start, "dd/MM/yyyy", { locale: vi });
      const startTime24h = format(start, "HH:mm", { locale: vi });
      
      // Nếu không có thời gian kết thúc, chỉ hiển thị thời gian bắt đầu
      if (!endTime) {
        return `${startDate} ${startTime24h}`;
      }
      
      const end = parseISO(endTime);
      const endDate = format(end, "dd/MM/yyyy", { locale: vi });
      const endTime24h = format(end, "HH:mm", { locale: vi });
      
      // Nếu cùng ngày, chỉ hiển thị ngày một lần
      if (startDate === endDate) {
        return `${startDate} ${startTime24h} - ${endTime24h}`;
      }
      
      // Nếu khác ngày, hiển thị đầy đủ cả ngày và giờ
      return `${startDate} ${startTime24h} - ${endDate} ${endTime24h}`;
    } catch (error) {
      console.error("Lỗi khi format thời gian:", error);
      return "";
    }
  },

  getTimeRemaining: (isoString) => {
    try {
      const startDate = parseISO(isoString);
      const now = new Date();
      
      if (isAfter(now, startDate)) {
        const timeElapsed = formatDistance(now, startDate, { 
          locale: vi,
          addSuffix: false
        });
        return `Đã bắt đầu ${timeElapsed} trước`;
      }
      
      const timeRemaining = formatDistance(startDate, now, { 
        locale: vi 
      });
      
      return `Bắt đầu sau ${timeRemaining}`;
    } catch (error) {
      return "";
    }
  },

  isOverdue: (endTimeIso) => {
    try {
      const endTime = parseISO(endTimeIso);
      const now = new Date();
      return isAfter(now, endTime);
    } catch (error) {
      return false;
    }
  },

  getOverdueTime: (endTimeIso) => {
    try {
      const endTime = parseISO(endTimeIso);
      const now = new Date();
      if (isAfter(now, endTime)) {
        return formatDistance(endTime, now, { 
          locale: vi,
          addSuffix: false 
        });
      }
      return "";
    } catch (error) {
      return "";
    }
  },

  isEveryDayOfWeek: (repeatRule) => {
    if (!repeatRule || !Array.isArray(repeatRule) || repeatRule.length === 0) {
      return false;
    }
    
    const allDaysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const daysSet = new Set(repeatRule.map(rule => rule.day));
    return allDaysOfWeek.every(day => daysSet.has(day));
  },

  isSameDay: (date1, date2) => {
    try {
      if (!date1 || !date2) return true;
      const d1 = parseISO(date1);
      const d2 = parseISO(date2);
      return (
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()
      );
    } catch (error) {
      return true;
    }
  },
  
  // Hàm lấy màu sắc dựa trên độ ưu tiên
  getPriorityColor: (priority) => {
    switch(priority || 0) {
      case 2: return "bg-red-500";
      case 1: return "bg-amber-500";
      case 0:
      default: return "bg-gray-400";
    }
  },
  
  // Hàm lấy text hiển thị cho độ ưu tiên
  getPriorityText: (priority) => {
    switch(priority || 0) {
      case 2: return "Cao";
      case 1: return "Trung bình";
      case 0:
      default: return "Thấp";
    }
  },
  
  // Hàm sắp xếp danh sách nhắc hẹn
  sortReminders: (reminders) => {
    return [...reminders].sort((a, b) => {
      // So sánh trạng thái hoàn thành (IsDone)
      if ((a.IsDone || false) !== (b.IsDone || false)) {
        return a.IsDone ? 1 : -1; // Chưa hoàn thành (false) lên trên
      }
      
      // Nếu cùng trạng thái, so sánh độ ưu tiên
      const priorityA = a.Priority || 0;
      const priorityB = b.Priority || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Ưu tiên cao hơn lên trên
      }
      
      // Nếu cùng độ ưu tiên, sắp xếp theo thời gian (nếu có)
      if (a.StartTime && b.StartTime) {
        return new Date(a.StartTime) - new Date(b.StartTime);
      }
      
      return 0;
    });
  }
}; 
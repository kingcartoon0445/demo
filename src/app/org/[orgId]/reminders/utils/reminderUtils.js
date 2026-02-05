import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, getDay, addMonths, addDays, isToday, subMonths } from "date-fns";
import { vi } from "date-fns/locale";

// Hàm kiểm tra xem RepeatRule có chứa tất cả các ngày trong tuần hay không
export const isEveryDayOfWeek = (repeatRule) => {
  if (!repeatRule || !Array.isArray(repeatRule) || repeatRule.length === 0) {
    return false;
  }
  
  // Danh sách tất cả các ngày trong tuần
  const allDaysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  
  // Tạo set các ngày từ RepeatRule
  const daysSet = new Set(repeatRule.map(rule => rule.day));
  
  // Kiểm tra xem tất cả các ngày trong tuần có nằm trong set không
  return allDaysOfWeek.every(day => daysSet.has(day));
};

// Hàm lấy các ngày trong tháng hiện tại để hiển thị lịch
export const getDaysInMonth = (currentMonth) => {
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  
  // Tạo mảng các ngày trong tháng
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  // Lấy số thứ tự của ngày đầu tiên trong tuần (0 = Chủ nhật, 1 = Thứ 2, ...)
  const startingDayIndex = getDay(firstDayOfMonth);
  
  // Nếu ngày đầu tiên không phải là Thứ 2, thêm các ngày từ tháng trước
  const daysFromPreviousMonth = [];
  if (startingDayIndex !== 1) { // 1 tương ứng với Thứ 2
    const daysToAdd = startingDayIndex === 0 ? 6 : startingDayIndex - 1;
    for (let i = daysToAdd; i > 0; i--) {
      daysFromPreviousMonth.push(addDays(firstDayOfMonth, -i));
    }
  }
  
  // Thêm các ngày từ tháng sau để đủ 42 ô (6 hàng x 7 cột)
  const totalCells = 42;
  const daysFromNextMonth = [];
  const totalDaysShown = daysFromPreviousMonth.length + daysInMonth.length;
  if (totalDaysShown < totalCells) {
    const daysToAdd = totalCells - totalDaysShown;
    for (let i = 1; i <= daysToAdd; i++) {
      daysFromNextMonth.push(addDays(lastDayOfMonth, i));
    }
  }
  
  return [...daysFromPreviousMonth, ...daysInMonth, ...daysFromNextMonth];
};

// Hàm lấy nhắc hẹn cho một ngày cụ thể
export const getRemindersForDay = (day, reminderList) => {
  return reminderList.filter(reminder => {
    try {
      const reminderDate = parseISO(reminder.StartTime);
      
      // Kiểm tra xem có trùng ngày không
      if (isSameDay(reminderDate, day)) {
        return true;
      }
      
      // Kiểm tra RepeatRule nếu có
      if (reminder.RepeatRule && Array.isArray(reminder.RepeatRule) && reminder.RepeatRule.length > 0) {
        const dayOfWeek = format(day, "EEEE", { locale: vi });
        const dayMap = {
          "Thứ Hai": "T2",
          "Thứ Ba": "T3", 
          "Thứ Tư": "T4",
          "Thứ Năm": "T5",
          "Thứ Sáu": "T6",
          "Thứ Bảy": "T7",
          "Chủ Nhật": "CN"
        };
        
        const dayCode = dayMap[dayOfWeek];
        return reminder.RepeatRule.some(rule => rule.day === dayCode);
      }
      
      return false;
    } catch (error) {
      console.error("Lỗi khi kiểm tra ngày nhắc hẹn:", error);
      return false;
    }
  });
};

// Hàm chuẩn bị dữ liệu để chỉnh sửa reminder
export const prepareReminderForEdit = (reminder, parseContact) => {
  const contact = parseContact(reminder.Contact);
  
  return {
    id: reminder.Id,
    note: reminder.Content,
    // Chuyển đổi StartTime sang ngày và định dạng theo dd/MM/yyyy
    date: format(parseISO(reminder.StartTime), "dd/MM/yyyy"),
    time: reminder.Time,
    // Truyền RepeatRule nếu có
    RepeatRule: reminder.RepeatRule,
    WorkspaceId: reminder.WorkspaceId,
    OrganizationId: reminder.OrganizationId,
    contactData: contact // Thêm thông tin contact
  };
};

// Tên các ngày trong tuần
export const weekdayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

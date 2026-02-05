import { useState, useEffect, useMemo } from "react";
import { getScheduleList, deleteSchedule, markScheduleAsDone } from "@/api/schedule";
import toast from "react-hot-toast";

export function useReminders(orgId) {
  const [reminderList, setReminderList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReminders = async () => {
    if (!orgId) return;
    
    setIsLoading(true);
    try {
      const params = {
        organizationId: orgId
      };
      
      const response = await getScheduleList(params);
      
      // Cập nhật xử lý response theo cấu trúc mới
      if (response && response.Status === "Success" && Array.isArray(response.Data)) {
        setReminderList(response.Data);
      } else if (response && Array.isArray(response)) {
        // Xử lý tương thích ngược nếu API vẫn trả về mảng trực tiếp
        setReminderList(response);
      } else {
        setReminderList([]);
        if (response && response.Message && response.StatusCode !== 200) {
          toast.error(response.Message || "Không thể lấy danh sách nhắc hẹn");
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhắc hẹn:", error);
      toast.error("Không thể lấy danh sách nhắc hẹn");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reminders based on search term
  const filteredReminders = useMemo(() => {
    if (!searchTerm) return reminderList;
    
    return reminderList.filter(reminder => {
      const contact = parseContact(reminder.Contact);
      const contactName = contact ? contact.fullName.toLowerCase() : '';
      const content = reminder.Content.toLowerCase();
      const time = reminder.Time.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return contactName.includes(search) || content.includes(search) || time.includes(search);
    });
  }, [reminderList, searchTerm]);

  // Hàm chuyển đổi chuỗi Contact từ JSON sang đối tượng
  const parseContact = (contactString) => {
    try {
      if (!contactString) return null;
      
      const contacts = JSON.parse(contactString);
      return Array.isArray(contacts) && contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      console.error("Lỗi khi parse thông tin contact:", error);
      return null;
    }
  };

  const handleDelete = async (reminderId) => {
    if (!reminderId) return;
    
    try {
      await toast.promise(
        deleteSchedule(reminderId),
        {
          loading: "Đang xóa nhắc hẹn...",
          success: "Xóa nhắc hẹn thành công",
          error: "Không thể xóa nhắc hẹn"
        }
      );
      
      // Refresh danh sách sau khi xóa
      fetchReminders();
    } catch (error) {
      console.error("Lỗi khi xóa nhắc hẹn:", error);
    }
  };

  // Hàm đánh dấu nhắc hẹn đã hoàn thành hoặc chưa hoàn thành
  const handleToggleDone = async (reminderId, isDone) => {
    if (!reminderId) return false;
    
    try {
      await markScheduleAsDone({
        ScheduleId: reminderId,
        IsDone: isDone
      });
      
      // Cập nhật lại trạng thái trong danh sách local
      setReminderList(prevList => 
        prevList.map(item => 
          item.Id === reminderId ? { ...item, IsDone: isDone } : item
        )
      );
      
      return true;
    } catch (error) {
      console.error("Lỗi khi đánh dấu hoàn thành:", error);
      toast.error("Không thể cập nhật trạng thái");
      return false;
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchReminders();
  }, [orgId]);

  return {
    reminderList,
    filteredReminders,
    isLoading,
    searchTerm,
    setSearchTerm,
    fetchReminders,
    handleDelete,
    parseContact,
    handleToggleDone
  };
}

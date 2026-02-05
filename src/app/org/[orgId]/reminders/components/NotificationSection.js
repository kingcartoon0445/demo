import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function NotificationSection({ notifyBeforeList, setNotifyBeforeList }) {
  // Thêm một thông báo mới vào danh sách
  const addNotification = () => {
    const newId = notifyBeforeList.length > 0 
      ? Math.max(...notifyBeforeList.map(item => item.id)) + 1 
      : 1;
    setNotifyBeforeList([...notifyBeforeList, { id: newId, hour: 0, minute: 30 }]);
  };

  // Cập nhật một thông báo trong danh sách
  const updateNotification = (id, field, value) => {
    setNotifyBeforeList(notifyBeforeList.map(item => 
      item.id === id ? { ...item, [field]: parseInt(value) || 0 } : item
    ));
  };

  // Xóa một thông báo khỏi danh sách
  const removeNotification = (id) => {
    if (notifyBeforeList.length > 1) {
      setNotifyBeforeList(notifyBeforeList.filter(item => item.id !== id));
    } else {
      // Nếu chỉ còn 1 thông báo, xóa hoàn toàn danh sách
      setNotifyBeforeList([]);
    }
  };

  return (
    <div className="space-y-3 w-1/2">
      <Label className="flex items-center gap-1">
        <AlertCircle className="h-4 w-4 text-indigo-500" />
        Thông báo trước
      </Label>

      
      {notifyBeforeList.length > 0 && (
        <ScrollArea className="max-h-[180px] overflow-y-auto pr-2">
          <div className="space-y-2">
            {notifyBeforeList.map((notify) => (
              <div key={notify.id} className="flex items-center gap-2 rounded-md">
                <div className="flex items-center gap-1">
                  <Input 
                    type="number"
                    min="0"
                    max="72"
                    className="w-16"
                    value={notify.hour}
                    onChange={(e) => updateNotification(notify.id, 'hour', e.target.value)}
                  />
                  <span>giờ</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input 
                    type="number"
                    min="0"
                    max="59"
                    className="w-16"
                    value={notify.minute}
                    onChange={(e) => updateNotification(notify.id, 'minute', e.target.value)}
                  />
                  <span>phút</span>
                </div>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-700 ml-auto"
                  onClick={() => removeNotification(notify.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      <p className="text-xs text-gray-600 italic">
        Hệ thống sẽ nhắc bạn trước khi đến lịch hẹn.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300"
        onClick={addNotification}
      >
        <Plus className="h-4 w-4 mr-1" />
        {notifyBeforeList.length === 0 ? "Thêm thông báo" : "Thêm thông báo khác"}
      </Button>
    </div>
  );
} 
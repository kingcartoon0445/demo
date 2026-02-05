import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReminderItemMd } from "./ReminderItemMd";
import { useLanguage } from "@/contexts/LanguageContext";

// Component hiển thị danh sách nhắc hẹn
export const ReminderListContent = ({
    reminderList,
    isLoading,
    onEdit,
    onDelete,
    onToggleDone,
}) => {
    const [showAll, setShowAll] = useState(false);
    const { t } = useLanguage();
    // Sắp xếp danh sách: nhắc hẹn chưa hoàn thành được ưu tiên hiển thị trên đầu
    const sortedReminderList = useMemo(() => {
        return [...reminderList].sort((a, b) => {
            // So sánh trạng thái hoàn thành (IsDone)
            if (a.IsDone !== b.IsDone) {
                return a.IsDone ? 1 : -1; // Chưa hoàn thành (false) lên trên
            }

            // Nếu cùng trạng thái, sắp xếp theo thời gian (nếu có)
            if (a.StartTime && b.StartTime) {
                return new Date(a.StartTime) - new Date(b.StartTime);
            }

            return 0;
        });
    }, [reminderList]);

    const displayCount = showAll ? sortedReminderList.length : 2;
    const hasMoreItems = sortedReminderList.length > 2;

    if (isLoading) {
        return (
            <div className="flex justify-center py-4 text-gray-500">
                Đang tải dữ liệu...
            </div>
        );
    }

    if (sortedReminderList.length === 0) {
        return (
            <>
                <div className="flex justify-center text-black font-medium">
                    {t("common.noActivity")}
                </div>
                <div className="flex justify-center text-gray-500 text-sm">
                    {t("common.reminderDescription")}
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {sortedReminderList.slice(0, displayCount).map((reminder) => (
                <ReminderItemMd
                    key={reminder.Id}
                    reminder={reminder}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleDone={onToggleDone}
                />
            ))}

            {hasMoreItems && (
                <div className="flex justify-center mt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/5 text-sm font-normal"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? (
                            <span className="flex items-center">
                                {t("common.collapse")}{" "}
                                <ChevronUp className="h-4 w-4 ml-1" />
                            </span>
                        ) : (
                            <span className="flex items-center">
                                {t("common.showMore")}{" "}
                                {sortedReminderList.length - 2}{" "}
                                {t("common.reminders")}
                                hẹn <ChevronDown className="h-4 w-4 ml-1" />
                            </span>
                        )}
                    </Button>
                </div>  
            )}
        </div>
    );
};

import { cn } from "@/lib/utils";
import { useState } from "react";
import { scheduleTypes } from "@/constants";

export default function ScheduleTypeFilter({ onFilterChange, className }) {
    // State cho việc lọc theo loại lịch hẹn - mặc định chọn tất cả
    const [selectedScheduleTypes, setSelectedScheduleTypes] = useState(
        scheduleTypes.map((type) => type.id)
    );

    // Hàm xử lý thay đổi filter
    const handleScheduleTypeChange = (typeId) => {
        let newSelected;
        if (selectedScheduleTypes.includes(typeId)) {
            newSelected = selectedScheduleTypes.filter((id) => id !== typeId);
        } else {
            newSelected = [...selectedScheduleTypes, typeId];
        }

        setSelectedScheduleTypes(newSelected);
        onFilterChange(newSelected);
    };

    // Hàm chọn/bỏ chọn tất cả
    const handleSelectAll = () => {
        const isAllSelected =
            selectedScheduleTypes.length === scheduleTypes.length;
        const newSelected = isAllSelected
            ? []
            : scheduleTypes.map((type) => type.id);
        setSelectedScheduleTypes(newSelected);
        onFilterChange(newSelected);
    };

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            <button
                onClick={handleSelectAll}
                className={cn(
                    "h-8 px-3 text-xs font-medium transition-all rounded-md",
                    selectedScheduleTypes.length === scheduleTypes.length
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
            >
                Tất cả
            </button>

            {scheduleTypes.map((type) => {
                const isSelected = selectedScheduleTypes.includes(type.id);
                return (
                    <button
                        key={type.id}
                        onClick={() => handleScheduleTypeChange(type.id)}
                        className={cn(
                            "h-8 px-3 text-xs font-medium transition-all rounded-md flex items-center gap-1.5",
                            isSelected
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        )}
                    >
                        <span
                            className={cn(
                                "flex-shrink-0",
                                isSelected ? "text-blue-600" : "text-gray-500"
                            )}
                        >
                            {type.icon}
                        </span>
                        <span>{type.name}</span>
                    </button>
                );
            })}
        </div>
    );
}

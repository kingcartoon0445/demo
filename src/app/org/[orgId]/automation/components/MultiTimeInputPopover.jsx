"use client"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { IoMdClose } from "react-icons/io";
import { TimePicker } from "@/components/time-picker";
import { useState } from "react";

export function MultiTimeInputPopover({ children, times, setTimes }) {
    const [isOpen, setIsOpen] = useState(false);

    const addTime = () => {
        const newId = times.length > 0 
            ? Math.max(...times.map(item => item.id)) + 1 
            : 1;
        setTimes([...times, { id: newId, time: { hour: 1, minute: 0 } }]);
    };

    const updateTime = (id, newTime) => {
        setTimes(times.map(item => 
            item.id === id ? { ...item, time: newTime } : item
        ));
    };

    const removeTime = (id) => {
        if (times.length > 1) {
            setTimes(times.filter(item => item.id !== id));
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="p-4 w-80">
                <div className="flex flex-col gap-3">
                    <div className="text-sm font-medium mb-1">Thời điểm gửi thông báo:</div>
                    
                    {times.map((timeItem) => (
                        <div key={timeItem.id} className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-xs flex-1">
                                <div className="w-8 text-right">Giờ</div>
                                <TimePicker 
                                    value={timeItem.time} 
                                    onChange={(e) => updateTime(timeItem.id, { hour: e.hour, minute: e.minute })}
                                />
                                <div>Phút</div>
                            </div>
                            
                            {times.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => removeTime(timeItem.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <IoMdClose size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    
                    <button
                        type="button"
                        onClick={addTime}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm mt-1"
                    >
                        <span>+ Thêm thời điểm</span>
                    </button>
                    
                    <div className="flex justify-end mt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary/90"
                        >
                            Xong
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
} 
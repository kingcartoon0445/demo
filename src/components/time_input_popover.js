"use client"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "./time-picker";


export function TimeInputPopover({ children, time, setTime, maxHour, disabled }) {

    return (
        <Popover>
            <PopoverTrigger asChild disabled={disabled}>{children}</PopoverTrigger>
            <PopoverContent className="pl-6 min-w-0 ">
                <div className="flex flex-col gap-2 items-start text-sm">
                    Nhập thời gian
                    <div className="flex items-center gap-2 text-xs">
                        Giờ
                        <TimePicker 
                            value={time} 
                            onChange={(e) => {
                                setTime({ hour: e.hour, minute: e.minute })
                            }} 
                            maxHour={maxHour}
                            disabled={disabled}
                        />
                        Phút
                    </div>

                </div>
            </PopoverContent>
        </Popover>
    );
}

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeInputPopover } from "@/components/time_input_popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Minus } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function TimeSelection({ 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  startTime, 
  setStartTime, 
  endTime, 
  setEndTime,
  timeError,
  isStartTimeDisabled
}) {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 flex justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                  timeError && "border-red-500",
                  isStartTimeDisabled && "opacity-70 cursor-not-allowed"
                )}
                disabled={isStartTimeDisabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Ngày bắt đầu</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                disabled={(date) => {
                  // Disable tất cả các ngày trước ngày hiện tại
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
            </PopoverContent>
          </Popover>
          
          <TimeInputPopover 
            time={startTime} 
            setTime={setStartTime}
            maxHour={23}
            disabled={isStartTimeDisabled}
          >
            <Button
              variant="outline"
              className={cn(
                "flex justify-start text-left font-normal",
                isStartTimeDisabled && "opacity-70 cursor-not-allowed"
              )}
              disabled={isStartTimeDisabled}
            >
              <Clock className="mr-2 h-4 w-4" />
              {startTime ? (
                `${startTime.hour.toString().padStart(2, "0")}:${startTime.minute.toString().padStart(2, "0")}`
              ) : (
                <span>Giờ bắt đầu</span>
              )}
            </Button>
          </TimeInputPopover>
        </div>
        
        <div className="flex items-center justify-center">
          <Minus className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2 flex-1">
        <TimeInputPopover 
            time={endTime} 
            setTime={setEndTime}
            maxHour={23}
          >
            <Button
              variant="outline"
              className={cn(
                "flex justify-start text-left font-normal",
                timeError && "border-red-500"
              )}
            >
              <Clock className="mr-2 h-4 w-4" />
              {endTime ? (
                `${endTime.hour.toString().padStart(2, "0")}:${endTime.minute.toString().padStart(2, "0")}`
              ) : (
                <span>Giờ kết thúc</span>
              )}
            </Button>
          </TimeInputPopover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 flex justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                  timeError && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Ngày kết thúc</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                disabled={(date) => {
                  // Disable tất cả các ngày trước ngày bắt đầu
                  if (!startDate) return true;
                  return date < startDate;
                }}
              />
            </PopoverContent>
          </Popover>
          
          
        </div>
      </div>
      {timeError && (
        <p className="text-sm text-red-500 -mt-2">{timeError}</p>
      )}
    </>
  );
} 
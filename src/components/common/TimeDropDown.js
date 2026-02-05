"use client";

import * as React from "react";
import {
    addDays,
    addYears,
    endOfYear,
    format,
    startOfDay,
    startOfYear,
    endOfDay,
} from "date-fns";
import vi from "date-fns/locale/vi";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MdCalendarMonth } from "react-icons/md";

const frameworks = [
    {
        value: "0",
        label: "Hôm nay",
    },
    {
        value: "-1",
        label: "Hôm qua",
    },
    {
        value: "-7",
        label: "7 ngày qua",
    },
    {
        value: "-30",
        label: "30 ngày qua",
    },
    {
        value: "thisyear",
        label: "Năm nay",
    },
    {
        value: "lastyear",
        label: "Năm ngoái",
    },
    {
        value: "-9999",
        label: "Toàn bộ thời gian",
    },
];

export default function TimeDropdown({
    date,
    dateSelect,
    setDate,
    setDateSelect,
    className,
    defaultValue = "-9999",
    align = "end",
    hideAllTime = false,
    ...prop
}) {
    // Initialize values only once on mount or when dependencies change
    React.useEffect(() => {
        if (
            typeof setDate !== "function" ||
            typeof setDateSelect !== "function"
        ) {
            console.error(
                "TimeDropdown: setDate hoặc setDateSelect không phải là hàm hợp lệ"
            );
            return;
        }

        // Only set initial values if both date and dateSelect are null/undefined
        // Use strict comparison to avoid re-renders
        if (dateSelect === null && date === null) {
            try {
                const value = defaultValue;
                let newDate;
                if (value === "-9999") {
                    newDate = {
                        from: startOfDay(addDays(new Date(), -9999)),
                        to: endOfDay(new Date()),
                    };
                } else {
                    newDate = {
                        from: startOfDay(addDays(new Date(), -30)),
                        to: endOfDay(new Date()),
                    };
                }
                setDate(newDate);
                setDateSelect(value);
            } catch (error) {
                console.error(
                    "TimeDropdown: Lỗi khi khởi tạo giá trị mặc định",
                    error
                );
            }
        }
    }, [defaultValue, setDate, setDateSelect]); // Remove date and dateSelect from dependencies

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    {...prop}
                    variant="outline"
                    className={cn(
                        " max-w-[280px] text-left font-medium flex justify-between text-sm text-title",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <MdCalendarMonth className="mr-2 h-5 text-primary mb-[2px] text-lg" />
                    {!dateSelect && date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "dd LLL, y", { locale: vi })}{" "}
                                - {format(date.to, "dd LLL, y", { locale: vi })}
                            </>
                        ) : (
                            format(date.from, "dd LLL, y", { locale: vi })
                        )
                    ) : (
                        <span>
                            {
                                frameworks.find((e) => e.value == dateSelect)
                                    ?.label
                            }
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align={align}
                className="flex w-auto flex-col space-y-2 p-2"
            >
                <Select
                    value={dateSelect}
                    onValueChange={(value) => {
                        let newDate;
                        if (value == "-1") {
                            newDate = {
                                from: startOfDay(addDays(new Date(), -1)),
                                to: endOfDay(addDays(new Date(), -1)),
                            };
                        } else if (value == "thisyear") {
                            newDate = {
                                from: startOfYear(new Date()),
                                to: endOfDay(new Date()),
                            };
                        } else if (value == "lastyear") {
                            newDate = {
                                from: startOfYear(addYears(new Date(), -1)),
                                to: endOfYear(addYears(new Date(), -1)),
                            };
                        } else if (value == "-9999") {
                            newDate = {
                                from: startOfDay(addDays(new Date(), -9999)),
                                to: endOfDay(new Date()),
                            };
                        } else {
                            newDate = {
                                from: startOfDay(
                                    addDays(new Date(), parseInt(value))
                                ),
                                to: endOfDay(new Date()),
                            };
                        }
                        setDate(newDate);
                        setDateSelect(value);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn ngày" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        {frameworks
                            .filter((e) => !hideAllTime || e.value !== "-9999")
                            .map((e, i) => (
                                <SelectItem value={e.value} key={i}>
                                    {e.label}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                <div className={`rounded-md border `}>
                    <Calendar
                        mode="range"
                        selected={date}
                        onSelect={(value) => {
                            if (value) {
                                setDate(value);
                                setDateSelect(undefined);
                            }
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

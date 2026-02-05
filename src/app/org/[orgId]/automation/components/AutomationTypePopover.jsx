"use client";

import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AutomationTypePopover({
    children,
    selectedAutomationType,
    setSelectedAutomationType,
    disabled = false,
}) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    const automationTypeList = [
        {
            label: t("common.leads"),
            value: "lead",
            checked: true,
        },
        {
            label: t("common.deals"),
            value: "deal",
            checked: true,
        },
        // {
        //     label: t("common.customer"),
        //     value: "customer",
        //     checked: true,
        // },
    ];

    return (
        <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="pl-6 min-w-[250px]">
                <RadioGroup
                    value={selectedAutomationType}
                    onValueChange={(value) => {
                        setSelectedAutomationType(value);
                        setOpen(false);
                    }}
                    className="flex flex-col gap-4"
                >
                    {automationTypeList?.map((automationType) => (
                        <div
                            key={automationType.value}
                            className="flex items-center space-x-2 py-1"
                        >
                            <RadioGroupItem
                                value={automationType.value}
                                id={automationType.value}
                            />
                            <label
                                htmlFor={automationType.value}
                                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {automationType.label}
                            </label>
                        </div>
                    ))}
                </RadioGroup>
            </PopoverContent>
        </Popover>
    );
}



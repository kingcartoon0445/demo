"use client";

import { memo, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Check, X, Calendar } from "lucide-react";
import { useCustomerUpdate } from "@/contexts/CustomerUpdateContext";
import { useEditableField } from "./EditableFieldRow";
import {
    useUpdateLeadField,
    useUpdateCustomerField,
} from "@/hooks/useCustomerDetail";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface EditableDateValueProps {
    value: string;
    fieldName: string;
    placeholder?: string;
    className?: string;
    displayFormat?: (dateString: string) => string;
    orgId?: string; // For direct API calls
    leadId?: string; // For direct API calls
    customerId?: string; // For customer fields - if provided, will use customer API
    onRefreshCustomer?: () => void;
}

function EditableDateValueComponent({
    value,
    fieldName,
    placeholder = "Chọn ngày",
    className = "text-[14px] text-gray-900",
    displayFormat,
    orgId,
    leadId,
    customerId,
    onRefreshCustomer,
}: EditableDateValueProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Use direct API calls if orgId and leadId are provided, otherwise use context
    const shouldUseDirectAPI = orgId && leadId;
    const leadFieldMutation = useUpdateLeadField(orgId || "", leadId || "");
    const customerFieldMutation = useUpdateCustomerField(
        orgId || "",
        customerId || "",
        leadId || ""
    );

    let updateField: (fieldName: string, value: string) => void;
    let isUpdating = false;

    if (shouldUseDirectAPI) {
        // Use direct API calls
        if (customerId) {
            // Customer field update
            updateField = (fieldName: string, value: string) => {
                customerFieldMutation.mutate({ fieldName, value });
            };
            isUpdating = customerFieldMutation.isPending;
        } else {
            // Lead field update
            updateField = (fieldName: string, value: string) => {
                leadFieldMutation.mutate({ fieldName, value });
            };
            isUpdating = leadFieldMutation.isPending;
        }
    } else {
        // Use context (fallback for backward compatibility)
        const contextData = useCustomerUpdate();
        updateField = contextData.updateField;
        isUpdating = contextData.isUpdating;
    }

    // Try to use context, fallback to local state if not available
    let contextIsEditing = isEditing;
    let contextSetIsEditing: (value: boolean) => void = setIsEditing;

    try {
        const context = useEditableField();
        contextIsEditing = context.isEditing;
        contextSetIsEditing = (value: boolean) => context.setIsEditing(value);
    } catch {
        // Context not available, use local state
    }

    // Parse date from string value
    useEffect(() => {
        if (value) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                } else {
                    setSelectedDate(undefined);
                }
            } catch {
                setSelectedDate(undefined);
            }
        } else {
            setSelectedDate(undefined);
        }
    }, [value]);

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        setIsCalendarOpen(false);
    };

    const handleConfirm = () => {
        if (selectedDate) {
            // Format date as ISO string for API
            const isoString = selectedDate.toISOString();
            if (shouldUseDirectAPI) {
                if (customerId) {
                    customerFieldMutation.mutate(
                        { fieldName, value: isoString },
                        {
                            onSuccess: () => {
                                onRefreshCustomer?.();
                            },
                        }
                    );
                } else {
                    leadFieldMutation.mutate(
                        { fieldName, value: isoString },
                        {
                            onSuccess: () => {
                                onRefreshCustomer?.();
                            },
                        }
                    );
                }
            } else {
                updateField(fieldName, isoString);
                onRefreshCustomer?.();
            }
        }
        contextSetIsEditing(false);
        setIsCalendarOpen(false);
    };

    const handleCancel = () => {
        contextSetIsEditing(false);
        setIsCalendarOpen(false);
        // Reset to original value
        if (value) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    setSelectedDate(date);
                }
            } catch {
                setSelectedDate(undefined);
            }
        } else {
            setSelectedDate(undefined);
        }
    };

    const getDisplayValue = () => {
        if (displayFormat && value) {
            return displayFormat(value);
        }
        if (value) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return format(date, "dd/MM/yyyy", { locale: vi });
                }
            } catch {
                // Fall through to placeholder
            }
        }
        return placeholder;
    };

    if (contextIsEditing) {
        return (
            <div className="flex items-center gap-2 flex-1 justify-end">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative">
                            <Input
                                value={
                                    selectedDate
                                        ? format(selectedDate, "dd/MM/yyyy", {
                                              locale: vi,
                                          })
                                        : ""
                                }
                                placeholder={placeholder}
                                className="h-7 text-[14px] font-normal pr-8 cursor-pointer flex-1"
                                readOnly
                            />
                            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                            locale={vi}
                        />
                    </PopoverContent>
                </Popover>
                <Button
                    size="icon"
                    variant="ghost"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleConfirm}
                    disabled={isUpdating}
                    className={`h-7 w-7 ${
                        isUpdating
                            ? "opacity-50 cursor-not-allowed"
                            : "text-green-600 hover:bg-green-100"
                    } rounded`}
                >
                    <Check className="size-3" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancel}
                    className="h-7 w-7"
                >
                    <X className="size-3" />
                </Button>
            </div>
        );
    }

    return (
        <div
            className="flex-1 text-right w-full"
            onClick={(e) => {
                e.stopPropagation(); // Prevent row click when clicking directly on value
                contextSetIsEditing(true);
            }}
        >
            <span
                className={`cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${className}`}
                title="Nhấn để chỉnh sửa"
            >
                {getDisplayValue()}
            </span>
        </div>
    );
}

const EditableDateValue = memo(EditableDateValueComponent);
export default EditableDateValue;

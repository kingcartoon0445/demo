"use client";

import { memo, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Check, X } from "lucide-react";
import { useCustomerUpdate } from "@/contexts/CustomerUpdateContext";
import { useEditableField } from "./EditableFieldRow";
import {
    useUpdateLeadField,
    useUpdateCustomerField,
} from "@/hooks/useCustomerDetail";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface SelectOption {
    value: string;
    label: string;
}

interface EditableSelectValueProps {
    value: string | number;
    fieldName: string;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    getDisplayText?: (value: string | number | undefined) => string;
    orgId?: string; // For direct API calls
    leadId?: string; // For direct API calls
    customerId?: string; // For customer fields - if provided, will use customer API
    onRefreshCustomer?: () => void;
}

function EditableSelectValueComponent({
    value,
    fieldName,
    options,
    placeholder = "Chọn...",
    className = "text-[14px] text-gray-900",
    getDisplayText,
    orgId,
    leadId,
    customerId,
    onRefreshCustomer,
}: EditableSelectValueProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>("");

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

    useEffect(() => {
        // Convert value to string for select component
        setSelectedValue(String(value || ""));
    }, [value]);

    const handleValueChange = (newValue: string) => {
        setSelectedValue(newValue);
    };

    const handleConfirm = () => {
        if (selectedValue !== String(value)) {
            if (shouldUseDirectAPI) {
                if (customerId) {
                    customerFieldMutation.mutate(
                        { fieldName, value: selectedValue },
                        {
                            onSuccess: () => {
                                onRefreshCustomer?.();
                            },
                        }
                    );
                } else {
                    leadFieldMutation.mutate(
                        { fieldName, value: selectedValue },
                        {
                            onSuccess: () => {
                                onRefreshCustomer?.();
                            },
                        }
                    );
                }
            } else {
                updateField(fieldName, selectedValue);
                onRefreshCustomer?.();
            }
        }
        contextSetIsEditing(false);
    };

    const handleCancel = () => {
        contextSetIsEditing(false);
        setSelectedValue(String(value || ""));
    };

    const getDisplayValue = () => {
        if (getDisplayText) {
            // Convert string back to number if needed for the display function
            const numValue =
                typeof value === "string" ? parseInt(value) : value;
            return getDisplayText(isNaN(numValue) ? undefined : numValue);
        }

        const option = options.find((opt) => opt.value === String(value));
        return option ? option.label : placeholder;
    };

    if (contextIsEditing) {
        return (
            <div className="flex items-center gap-2 flex-1 justify-end">
                <Select value={selectedValue} onValueChange={handleValueChange}>
                    <SelectTrigger className="h-7 text-[14px] font-normal min-w-[120px] flex-1">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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

const EditableSelectValue = memo(EditableSelectValueComponent);
export default EditableSelectValue;

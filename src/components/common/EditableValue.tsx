"use client";

import { memo, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Check, X, AlertCircle } from "lucide-react";
import { useCustomerUpdate } from "@/contexts/CustomerUpdateContext";
import { useEditableField } from "./EditableFieldRow";
import {
    useUpdateLeadField,
    useUpdateCustomerField,
} from "@/hooks/useCustomerDetail";

interface EditableValueProps {
    value: string;
    fieldName: string; // Tên field để gửi lên API
    type?: string;
    placeholder?: string;
    className?: string;
    orgId?: string; // For direct API calls
    leadId?: string; // For direct API calls
    customerId?: string; // For customer fields - if provided, will use customer API
    onRefreshCustomer?: () => void;
}

// Validation functions
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    // Vietnamese phone number validation
    // Accepts: 0123456789, +84123456789, 84123456789
    const phoneRegex = /^(\+84|84|0)([3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
};

function EditableValueComponent({
    value,
    fieldName,
    type = "text",
    placeholder,
    className = "text-[14px] text-gray-900",
    orgId,
    leadId,
    customerId,
    onRefreshCustomer,
}: EditableValueProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [temp, setTemp] = useState<string>(value || "");
    const [validationError, setValidationError] = useState<string>("");

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
        // Keep local state synced when external value changes
        setTemp(value || "");
        setValidationError("");
    }, [value]);

    const validateValue = (val: string): string => {
        if (!val.trim()) return ""; // Empty values are allowed

        switch (type) {
            case "email":
                return validateEmail(val) ? "" : "Email không hợp lệ";
            default:
                return "";
        }
    };

    const handleInputChange = (newValue: string) => {
        setTemp(newValue);
        const error = validateValue(newValue);
        setValidationError(error);
    };

    const handleConfirm = () => {
        const v = (temp || "").trim();
        const error = validateValue(v);

        if (error) {
            setValidationError(error);
            return; // Don't save if validation fails
        }

        if (v !== value) {
            if (shouldUseDirectAPI) {
                if (customerId) {
                    customerFieldMutation.mutate(
                        { fieldName, value: v },
                        {
                            onSuccess: () => {
                                onRefreshCustomer?.();
                            },
                        }
                    );
                } else {
                    leadFieldMutation.mutate(
                        { fieldName, value: v },
                        {
                            onSuccess: () => {
                                onRefreshCustomer?.();
                            },
                        }
                    );
                }
            } else {
                updateField(fieldName, v);
                onRefreshCustomer?.();
            }
        }
        contextSetIsEditing(false);
        setValidationError("");
    };

    const handleCancel = () => {
        contextSetIsEditing(false);
        setTemp(value || "");
        setValidationError("");
    };

    if (contextIsEditing) {
        return (
            <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2 justify-end">
                    <div className="flex-1 relative">
                        <Input
                            autoFocus
                            type={type}
                            value={temp}
                            placeholder={placeholder}
                            onChange={(e) =>
                                handleInputChange(
                                    (e.target as HTMLInputElement).value
                                )
                            }
                            className={`h-7 pr-8 ${
                                validationError ? "border-red-500" : ""
                            }`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirm();
                                if (e.key === "Escape") handleCancel();
                            }}
                        />
                        {validationError && (
                            <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleConfirm}
                        disabled={!!validationError || isUpdating}
                        className={`h-7 w-7 ${
                            validationError || isUpdating
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
                {validationError && (
                    <div className="text-xs text-red-500 text-right">
                        {validationError}
                    </div>
                )}
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
                {value || placeholder}
            </span>
        </div>
    );
}

const EditableValue = memo(EditableValueComponent);
export default EditableValue;

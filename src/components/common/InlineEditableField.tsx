"use client";

import { memo, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Check, X } from "lucide-react";

interface InlineEditableFieldProps {
    label: string;
    value: string;
    onSave: (newValue: string) => void;
    type?: string;
    icon?: React.ReactNode;
    labelWidthClassName?: string; // e.g., "w-[90px]"
    valueClassName?: string; // optional styling for value text
    placeholder?: string;
}

function InlineEditableFieldComponent({
    label,
    value,
    onSave,
    type = "text",
    icon,
    labelWidthClassName = "w-[90px]",
    valueClassName,
    placeholder,
}: InlineEditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [temp, setTemp] = useState<string>(value || "");

    useEffect(() => {
        // Keep local state synced when external value changes
        setTemp(value || "");
    }, [value]);

    const handleConfirm = () => {
        const v = (temp || "").trim();
        if (v && v !== value) {
            onSave(v);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTemp(value || "");
    };

    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className={`text-muted-foreground ${labelWidthClassName}`}>
                {label}
            </span>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    <Input
                        autoFocus
                        type={type}
                        value={temp}
                        placeholder={placeholder}
                        onChange={(e) =>
                            setTemp((e.target as HTMLInputElement).value)
                        }
                        className="h-7"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirm();
                            if (e.key === "Escape") handleCancel();
                        }}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleConfirm}
                        className="text-green-600 hover:bg-green-100 rounded"
                    >
                        <Check className="size-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleCancel}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            ) : (
                <span
                    className={`cursor-pointer ${valueClassName || ""}`}
                    onClick={() => setIsEditing(true)}
                    title="Nhấn để chỉnh sửa"
                >
                    {value}
                </span>
            )}
        </div>
    );
}

const InlineEditableField = memo(InlineEditableFieldComponent);
export default InlineEditableField;

"use client";

import { memo, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { useCustomerUpdate } from "@/contexts/CustomerUpdateContext";
import { useEditableField } from "./EditableFieldRow";
import { CustomerTagsMultiSelector } from "../componentsWithHook/CustomerTagsMultiSelector";
import {
    useUpdateLeadTags,
    useUpdateCustomerTags,
} from "@/hooks/useCustomerDetail";

interface EditableTagsValueProps {
    value: string[];
    fieldName: string;
    orgId: string;
    leadId: string;
    customerId?: string; // Optional for customer fields
    placeholder?: string;
    className?: string;
}

function EditableTagsValueComponent({
    value,
    fieldName,
    orgId,
    leadId,
    customerId,
    placeholder = "Chọn nhãn",
    className = "text-[14px] text-gray-900",
}: EditableTagsValueProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Use different hooks based on whether customerId is provided
    const leadTagsMutation = useUpdateLeadTags(orgId, leadId);
    const customerTagsMutation = useUpdateCustomerTags(
        orgId,
        customerId || "",
        leadId
    );

    // Choose the appropriate mutation based on context
    const updateTagsMutation = customerId
        ? customerTagsMutation
        : leadTagsMutation;

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
        setSelectedTags(value || []);
    }, [value]);

    const handleConfirm = async () => {
        try {
            await updateTagsMutation.mutateAsync({
                tags: selectedTags,
            });
            contextSetIsEditing(false);
        } catch (error) {
            console.error("Error updating tags:", error);
        }
    };

    const handleCancel = () => {
        contextSetIsEditing(false);
        setSelectedTags(value || []);
    };

    const getDisplayValue = () => {
        if (value && value.length > 0) {
            return (
                <div className="flex flex-wrap gap-1 justify-end">
                    {value.map((tag) => (
                        <Badge key={tag} className="whitespace-nowrap">
                            {tag}
                        </Badge>
                    ))}
                </div>
            );
        }
        return <span>{placeholder}</span>;
    };

    if (contextIsEditing) {
        return (
            <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="flex-1">
                    <CustomerTagsMultiSelector
                        orgId={orgId}
                        value={selectedTags}
                        onChange={setSelectedTags}
                        placeholder={placeholder}
                        hideChevron={true}
                        hideBadges={false}
                    />
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleConfirm}
                    disabled={updateTagsMutation.isPending}
                    className="text-green-600 hover:bg-green-100 rounded h-7 w-7"
                >
                    {updateTagsMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                    ) : (
                        <Check className="size-3" />
                    )}
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
        <div className="flex-1 w-full text-right">
            <div
                className={`cursor-pointer hover:bg-gray-50 py-1 rounded ${className}`}
                onClick={() => contextSetIsEditing(true)}
                title="Nhấn để chỉnh sửa"
            >
                {getDisplayValue()}
            </div>
        </div>
    );
}

const EditableTagsValue = memo(EditableTagsValueComponent);
export default EditableTagsValue;

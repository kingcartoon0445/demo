"use client";

import React, { useState, useEffect, memo } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditableField } from "./EditableFieldRow";
import InlineTagsEditor from "../deals/InlineTagsEditor";

interface Tag {
    id: string;
    name: string;
    backgroundColor: string;
    textColor: string;
    workspaceId: string;
}

interface EditableDealTagsValueProps {
    tags: Tag[];
    orgId: string;
    workspaceId: string;
    taskId: string;
    availableTags: Tag[];
    onTagsChange: (tagIds: string[]) => void;
    onCreateTag: (tag: Partial<Tag>) => Promise<void>;
    className?: string;
}

function EditableDealTagsValueComponent({
    tags,
    orgId,
    workspaceId,
    taskId,
    availableTags,
    onTagsChange,
    onCreateTag,
    className = "text-[14px] text-gray-900",
}: EditableDealTagsValueProps) {
    const [editingTags, setEditingTags] = useState<Tag[]>(tags);

    // Try to use context from EditableFieldRow
    let isEditing = false;
    let setIsEditing: (value: boolean) => void = () => {};

    try {
        const context = useEditableField();
        isEditing = context.isEditing;
        setIsEditing = context.setIsEditing;
    } catch {
        // Context not available, component might be used standalone
        console.warn(
            "EditableDealTagsValue should be used within EditableFieldRow"
        );
    }

    useEffect(() => {
        // Keep local state synced when external tags change
        setEditingTags(tags);
    }, [tags]);

    const handleConfirm = async () => {
        try {
            // Update tags through parent callback
            onTagsChange(editingTags.map((tag) => tag.id));
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating tags:", error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingTags(tags);
    };

    const displayTags = tags.slice(0, 3);
    const remainingCount = tags.length - 3;

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                    <InlineTagsEditor
                        tags={editingTags}
                        orgId={orgId}
                        workspaceId={workspaceId}
                        taskId={taskId}
                        availableTags={availableTags}
                        onTagsChange={(tagIds) => {
                            const newTags = availableTags.filter((tag) =>
                                tagIds.includes(tag.id)
                            );
                            setEditingTags(newTags);
                        }}
                        onCreateTag={onCreateTag}
                    />
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleConfirm}
                    className="text-green-600 hover:bg-green-100 rounded h-8 w-8 p-0"
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className={`flex gap-1 overflow-hidden ${className} py-1`}>
            {displayTags.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                    Chưa có nhãn
                </span>
            ) : (
                displayTags.map((tag) => (
                    <Badge
                        key={tag.id}
                        variant="secondary"
                        className="flex items-center gap-1 flex-shrink-0"
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{
                                backgroundColor: tag.backgroundColor,
                            }}
                        />
                        {tag.name}
                    </Badge>
                ))
            )}
            {remainingCount > 0 && (
                <Badge
                    variant="outline"
                    className="text-muted-foreground flex-shrink-0"
                >
                    +{remainingCount}
                </Badge>
            )}
        </div>
    );
}

const EditableDealTagsValue = memo(EditableDealTagsValueComponent);
export default EditableDealTagsValue;

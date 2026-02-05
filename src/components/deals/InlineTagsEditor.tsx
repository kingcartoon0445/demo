import React, { useState } from "react";
import { BusinessProcessTag } from "@/interfaces/businessProcess";
import { Badge } from "@/components/ui/badge";
import { useEditableField } from "../common/EditableFieldRow";
import BusinessProcessTagMultiSelector from "../componentsWithHook/BusinessProcessTagMultiSelector";

interface InlineTagsEditorProps {
    tags: BusinessProcessTag[];
    orgId: string;
    workspaceId: string;
    taskId: string;
    availableTags: BusinessProcessTag[];
    onTagsChange: (tagIds: string[]) => void;
    onCreateTag?: (tag: Partial<BusinessProcessTag>) => Promise<void>;
}

export default function InlineTagsEditor({
    tags,
    orgId,
    workspaceId,
    taskId,
    availableTags,
    onTagsChange,
    onCreateTag,
}: InlineTagsEditorProps) {
    const { isEditing } = useEditableField();
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
        tags.map((tag) => tag.id)
    );

    const selectedTags = availableTags.filter((tag) =>
        selectedTagIds.includes(tag.id)
    );

    // Cập nhật selectedTagIds khi tags prop thay đổi
    React.useEffect(() => {
        setSelectedTagIds(tags.map((tag) => tag.id));
    }, [tags]);

    const handleTagsChange = (newTagIds: string[]) => {
        setSelectedTagIds(newTagIds);
        onTagsChange(newTagIds);
    };

    if (!isEditing) {
        return (
            <div className="flex gap-1 overflow-hidden">
                {selectedTags.slice(0, 3).map((tag) => (
                    <Badge
                        key={tag.id}
                        variant="secondary"
                        className="flex items-center gap-1 flex-shrink-0"
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.backgroundColor }}
                        />
                        {tag.name}
                    </Badge>
                ))}
                {selectedTags.length > 3 && (
                    <Badge
                        variant="outline"
                        className="text-muted-foreground flex-shrink-0"
                    >
                        +{selectedTags.length - 3}
                    </Badge>
                )}
                {selectedTags.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                        Chưa có nhãn
                    </span>
                )}
            </div>
        );
    }

    return (
        <BusinessProcessTagMultiSelector
            orgId={orgId}
            workspaceId={workspaceId}
            selected={selectedTagIds}
            onChange={handleTagsChange}
        />
    );
}

import React, { useState } from "react";
import { BusinessProcessTag } from "@/interfaces/businessProcess";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Edit2 } from "lucide-react";
import BusinessProcessTagMultiSelector from "../componentsWithHook/BusinessProcessTagMultiSelector";
import { useUpdateBusinessProcessTaskTags } from "@/hooks/useBusinessProcess";

interface TagsDisplayWithEditProps {
    tags: BusinessProcessTag[];
    orgId: string;
    workspaceId: string;
    taskId: string;
}

export default function TagsDisplayWithEdit({
    tags,
    orgId,
    workspaceId,
    taskId,
}: TagsDisplayWithEditProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
        tags.map((tag) => tag.id)
    );

    const updateTagsMutation = useUpdateBusinessProcessTaskTags(orgId, taskId);

    const displayTags = tags.slice(0, 3);
    const remainingCount = tags.length - 3;

    const handleSaveTags = async () => {
        try {
            await updateTagsMutation.mutateAsync(selectedTagIds);
            setIsEditDialogOpen(false);
        } catch (error) {
            console.error("Error updating tags:", error);
        }
    };

    return (
        <>
            <div
                className="flex gap-1 items-center cursor-pointer"
                onClick={() => setIsEditDialogOpen(true)}
            >
                <div className="flex gap-1 flex-wrap">
                    {displayTags.map((tag) => (
                        <span
                            key={tag.id}
                            className="p-2 py-0.5 border rounded-full text-xs flex items-center gap-1"
                        >
                            <div
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: tag.backgroundColor }}
                            />
                            {tag.name}
                        </span>
                    ))}
                    {remainingCount > 0 && (
                        <span className="p-2 py-0.5 border rounded-full text-xs text-muted-foreground">
                            +{remainingCount}
                        </span>
                    )}
                </div>

                {/* Trigger handled by container click for inline behavior */}
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa nhãn</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <BusinessProcessTagMultiSelector
                            orgId={orgId}
                            workspaceId={workspaceId}
                            selected={selectedTagIds}
                            onChange={setSelectedTagIds}
                        />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditDialogOpen(false);
                                    setSelectedTagIds(
                                        tags.map((tag) => tag.id)
                                    );
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSaveTags}
                                disabled={updateTagsMutation.isPending}
                            >
                                {updateTagsMutation.isPending
                                    ? "Đang lưu..."
                                    : "Lưu"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

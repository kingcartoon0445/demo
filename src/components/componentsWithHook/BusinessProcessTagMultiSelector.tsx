import { MultiSelect } from "../ui/multi-select";
import {
    useCreateBusinessProcessTag,
    useGetBusinessProcessTags,
    useDeleteBusinessProcessTag,
} from "@/hooks/useBusinessProcess";
import { useOrgStore } from "@/store/useOrgStore";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { createBusinessProcessTag } from "@/api/businessProcess";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessProcessTag } from "@/interfaces/businessProcess";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

const colorOptions = [
    { label: "Đỏ", value: "#EF4444" },
    { label: "Đỏ cam", value: "#F97316" },
    { label: "Cam", value: "#FB923C" },
    { label: "Vàng", value: "#FACC15" },
    { label: "Vàng chanh", value: "#84CC16" },
    { label: "Xanh lá", value: "#22C55E" },
    { label: "Xanh lục", value: "#10B981" },
    { label: "Xanh ngọc", value: "#14B8A6" },
    { label: "Xanh dương nhạt", value: "#0EA5E9" },
    { label: "Xanh dương", value: "#3B82F6" },
    { label: "Xanh dương đậm", value: "#6366F1" },
    { label: "Tím", value: "#A855F7" },
    { label: "Tím đậm", value: "#9333EA" },
    { label: "Hồng", value: "#EC4899" },
    { label: "Hồng đậm", value: "#DB2777" },
    { label: "Xám", value: "#71717A" },
];

export default function BusinessProcessTagMultiSelector({
    orgId,
    workspaceId,
    selected,
    onChange,
}: {
    orgId: string;
    workspaceId: string;
    selected: string[];
    onChange: (selected: string[]) => void;
}) {
    const { data: tags } = useGetBusinessProcessTags(orgId, workspaceId);
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
    const [searchValue, setSearchValue] = useState("");

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const { orgDetail } = useOrgStore();
    const canDelete =
        orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";

    const createTagMutation = useCreateBusinessProcessTag(orgId);
    const deleteTagMutation = useDeleteBusinessProcessTag(orgId);

    const tagsData = tags?.data || [];
    const options = tagsData.map((tag: BusinessProcessTag) => ({
        value: tag.id,
        label: tag.name,
        hexCode: tag.backgroundColor,
    }));

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        try {
            const res: any = await createTagMutation.mutateAsync({
                workspaceId,
                name: newTagName,
                textColor: "#FFFFFF",
                backgroundColor: selectedColor,
            });

            // Handle various possible response structures for flexibility
            const newTagId = res?.data?.id || res?.content?.id || res?.id;

            if (newTagId) {
                if (!selected.includes(newTagId)) {
                    onChange([...selected, newTagId]);
                }
            }

            setNewTagName("");
            setSelectedColor(colorOptions[0].value);
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error("Error creating tag:", error);
        }
    };

    const renderNoResults = useCallback(
        () => (
            <div className="p-3 text-sm text-muted-foreground">
                Không có kết quả.
                {searchValue.trim() && (
                    <div className="mt-2">
                        <Button
                            size="sm"
                            variant="link"
                            type="button"
                            onClick={() => {
                                setNewTagName(searchValue.trim());
                                setIsCreateDialogOpen(true);
                            }}
                        >
                            + Tạo nhãn "{searchValue.trim()}"
                        </Button>
                    </div>
                )}
            </div>
        ),
        [searchValue],
    );

    return (
        <>
            <MultiSelect
                options={options}
                selected={selected}
                onChange={onChange}
                placeholder="Chọn nhãn"
                onSearchChange={setSearchValue}
                renderNoResults={renderNoResults}
                onDeleteOption={
                    canDelete
                        ? (value) => {
                              // value here is tag.id
                              const tag = tagsData.find(
                                  (t: BusinessProcessTag) => t.id === value,
                              );
                              if (tag) {
                                  setTagToDelete({
                                      id: tag.id,
                                      name: tag.name,
                                  });
                                  setIsAlertOpen(true);
                              }
                          }
                        : undefined
                }
            />

            <CustomerAlertDialog
                open={isAlertOpen}
                setOpen={setIsAlertOpen}
                title="Xóa nhãn"
                subtitle={`Bạn có chắc chắn muốn xóa nhãn "${tagToDelete?.name}" không? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                onSubmit={() => {
                    if (tagToDelete) {
                        deleteTagMutation.mutate(tagToDelete.id, {
                            onSuccess: () => {
                                setIsAlertOpen(false);
                                setTagToDelete(null);
                            },
                        });
                    }
                }}
                isSubmitting={deleteTagMutation.isPending}
            />

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tạo nhãn mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tagName">Tên nhãn *</Label>
                            <Input
                                id="tagName"
                                placeholder="Nhập tên nhãn"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Màu sắc *</Label>
                            <div className="grid grid-cols-8 gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 ${
                                            selectedColor === color.value
                                                ? "border-sidebar-primary scale-110"
                                                : "border-gray-300"
                                        } transition-all duration-200`}
                                        style={{ backgroundColor: color.value }}
                                        onClick={() =>
                                            setSelectedColor(color.value)
                                        }
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreateDialogOpen(false);
                                    setNewTagName("");
                                    setSelectedColor(colorOptions[0].value);
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleCreateTag}
                                disabled={
                                    !newTagName.trim() ||
                                    createTagMutation.isPending
                                }
                            >
                                {createTagMutation.isPending
                                    ? "Đang tạo..."
                                    : "Lưu"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

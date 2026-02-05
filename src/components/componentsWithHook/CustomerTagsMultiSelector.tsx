import {
    useGetCustomerTags,
    useCreateTag,
    useDeleteTag,
} from "@/hooks/useCustomerV2";
import { useOrgStore } from "@/store/useOrgStore";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { MultiSelect } from "../ui/multi-select";
import { CustomerTag } from "@/lib/interface";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";

interface CustomerTagsMultiSelectorProps {
    orgId: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    hideChevron?: boolean;
    hideBadges?: boolean;
}

export function CustomerTagsMultiSelector({
    orgId,
    value,
    onChange,
    placeholder,
    hideChevron,
    hideBadges,
}: CustomerTagsMultiSelectorProps) {
    const { orgDetail } = useOrgStore();
    const canDelete =
        orgDetail?.type === "OWNER" || orgDetail?.type === "ADMIN";

    const { data: customerTagsResponse, isLoading } = useGetCustomerTags(
        orgId,
        { limit: 1000, offset: 0, category: "LEAD" },
    );
    const createTagMutation = useCreateTag(orgId);
    const deleteTagMutation = useDeleteTag(orgId);
    const [isOpen, setIsOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [tagName, setTagName] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const customerTags = customerTagsResponse?.content || [];
    const options = (customerTags as CustomerTag[]).map((tag) => ({
        value: tag.name,
        label: tag.name,
    }));
    if (isLoading) {
        return <Skeleton className="h-10 w-full rounded-xl" />;
    }
    return (
        <>
            <MultiSelect
                options={options}
                selected={value}
                onChange={onChange}
                placeholder={placeholder}
                hideChevron={hideChevron}
                hideBadges={hideBadges}
                onDeleteOption={
                    canDelete
                        ? (value) => {
                              const tag = (customerTags as CustomerTag[]).find(
                                  (t) => t.name === value,
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
                buttonClassName="overflow-hidden"
                textClassName="truncate"
                onSearchChange={(v) => {
                    setSearchValue(v);
                }}
                renderNoResults={() => (
                    <div className="p-3 text-sm text-muted-foreground">
                        Không có kết quả.
                        {searchValue.trim() && (
                            <div className="mt-2">
                                <Button
                                    size="sm"
                                    variant="link"
                                    type="button"
                                    onClick={() => {
                                        setTagName(searchValue.trim());
                                        setIsOpen(true);
                                    }}
                                >
                                    + Tạo nhãn "{searchValue.trim()}"
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo nhãn mới</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="new-tag-name">Tên nhãn</Label>
                        <Input
                            id="new-tag-name"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            placeholder="Nhập tên nhãn"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setIsOpen(false)}
                            disabled={createTagMutation.isPending}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (!tagName.trim()) return;
                                createTagMutation.mutate(
                                    { category: "LEAD", name: tagName.trim() },
                                    {
                                        onSuccess: () => {
                                            const newTag = tagName.trim();
                                            if (
                                                newTag &&
                                                !value.includes(newTag)
                                            ) {
                                                onChange([...value, newTag]);
                                            }
                                            setIsOpen(false);
                                            setTagName("");
                                            setSearchValue("");
                                        },
                                    },
                                );
                            }}
                            disabled={
                                !tagName.trim() || createTagMutation.isPending
                            }
                        >
                            {createTagMutation.isPending
                                ? "Đang tạo..."
                                : "Tạo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
        </>
    );
}

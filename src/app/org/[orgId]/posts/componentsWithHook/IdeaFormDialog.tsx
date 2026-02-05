"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Field, Section } from "../components/Field";
import type { IdeaPayload, IdeaItem } from "@/interfaces/post";

interface IdeaFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: IdeaPayload;
    setForm: (form: IdeaPayload) => void;
    onSubmit: () => void;
    editing: IdeaItem | null;
}

export function IdeaFormDialog({
    open,
    onOpenChange,
    form,
    setForm,
    onSubmit,
    editing,
}: IdeaFormDialogProps) {
    const handleSubmit = () => {
        onSubmit();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Cập nhật Idea" : "Tạo Idea"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Section>
                        <Field label="Topic">
                            <Input
                                value={form.topic}
                                onChange={(e) =>
                                    setForm({ ...form, topic: e.target.value })
                                }
                            />
                        </Field>
                        <Field label="Content">
                            <Textarea
                                rows={3}
                                value={form.content}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        content: e.target.value,
                                    })
                                }
                            />
                        </Field>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={form.isUsed}
                                onCheckedChange={(v) =>
                                    setForm({ ...form, isUsed: v })
                                }
                            />
                            <span className="text-sm text-muted-foreground">
                                Đánh dấu đã sử dụng
                            </span>
                        </div>
                    </Section>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit}>
                        {editing ? "Lưu cập nhật" : "Tạo mới"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

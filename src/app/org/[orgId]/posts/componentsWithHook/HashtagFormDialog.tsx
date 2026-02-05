"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Field, Section } from "../components/Field";
import type { HashtagPayload, HashtagItem } from "@/interfaces/post";

interface HashtagFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: HashtagPayload;
    setForm: (form: HashtagPayload) => void;
    onSubmit: () => void;
    editing: HashtagItem | null;
}

export function HashtagFormDialog({
    open,
    onOpenChange,
    form,
    setForm,
    onSubmit,
    editing,
}: HashtagFormDialogProps) {
    const handleSubmit = () => {
        onSubmit();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Cập nhật Hashtag" : "Tạo Hashtag"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Section>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Tag (không kèm #)">
                                <Input
                                    value={form.tag}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tag: e.target.value,
                                        })
                                    }
                                />
                            </Field>
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

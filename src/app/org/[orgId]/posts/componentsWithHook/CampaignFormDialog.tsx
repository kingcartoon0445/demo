"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { DatePicker } from "./DatePicker";
import { Field, Section } from "../components/Field";
import type { CampaignPayload, CampaignItem } from "@/interfaces/post";

interface CampaignFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: CampaignPayload;
    setForm: (form: CampaignPayload) => void;
    onSubmit: () => void;
    editing: CampaignItem | null;
}

export function CampaignFormDialog({
    open,
    onOpenChange,
    form,
    setForm,
    onSubmit,
    editing,
}: CampaignFormDialogProps) {
    const handleSubmit = () => {
        onSubmit();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Cập nhật Campaign" : "Tạo Campaign"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Section>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Name">
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Tên chiến dịch"
                                />
                            </Field>
                            <Field label="Start Date">
                                <DatePicker
                                    value={form.startDate}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            startDate: value,
                                        })
                                    }
                                    placeholder="Chọn ngày bắt đầu"
                                />
                            </Field>
                            <Field label="End Date">
                                <DatePicker
                                    value={form.endDate}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            endDate: value,
                                        })
                                    }
                                    placeholder="Chọn ngày kết thúc"
                                />
                            </Field>
                        </div>
                        <Field label="Description">
                            <Textarea
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </Field>
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

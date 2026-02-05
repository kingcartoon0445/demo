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
import type { LabelPayload, LabelItem } from "@/interfaces/post";
import { useLanguage } from "@/contexts/LanguageContext";

interface LabelFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: LabelPayload;
    setForm: (form: LabelPayload) => void;
    onSubmit: () => void;
    editing: LabelItem | null;
}

export function LabelFormDialog({
    open,
    onOpenChange,
    form,
    setForm,
    onSubmit,
    editing,
}: LabelFormDialogProps) {
    const { t } = useLanguage();
    const handleSubmit = () => {
        onSubmit();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? t("common.updateLabel")
                            : t("common.createLabel")}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Section>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label={t("common.name")}>
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                            <Field label={t("common.color")}>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={form.color}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                color: e.target.value,
                                            })
                                        }
                                        className="h-10 w-20"
                                    />
                                    <Input
                                        value={form.color}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                color: e.target.value,
                                            })
                                        }
                                        className="flex-1"
                                    />
                                </div>
                            </Field>
                        </div>
                    </Section>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSubmit}>
                        {editing ? t("common.update") : t("common.create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

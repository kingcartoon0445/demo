"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Section } from "./Field";
import type { LabelPayload, LabelItem } from "@/interfaces/post";
import { useLanguage } from "@/contexts/LanguageContext";

interface LabelFormProps {
    form: LabelPayload;
    setForm: (form: LabelPayload) => void;
    onSubmit: () => void;
    editing: LabelItem | null;
    onCancel: () => void;
}

export function LabelForm({
    form,
    setForm,
    onSubmit,
    editing,
    onCancel,
}: LabelFormProps) {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {editing
                        ? t("common.updateLabel")
                        : t("common.createLabel")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Section>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label={t("common.name")}>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </Field>
                        <Field label={t("common.color")}>
                            <Input
                                value={form.color}
                                onChange={(e) =>
                                    setForm({ ...form, color: e.target.value })
                                }
                            />
                        </Field>
                        <Field label={t("common.status")}>
                            <Input
                                type="number"
                                value={form.status ?? 1}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        status: Number(e.target.value) || 0,
                                    })
                                }
                            />
                        </Field>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onSubmit}>
                            {editing ? t("common.update") : t("common.create")}
                        </Button>
                        {editing && (
                            <Button variant="outline" onClick={onCancel}>
                                {t("common.cancel")}
                            </Button>
                        )}
                    </div>
                </Section>
            </CardContent>
        </Card>
    );
}

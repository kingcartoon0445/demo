"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Section } from "./Field";
import type { CampaignPayload, CampaignItem } from "@/interfaces/post";

interface CampaignFormProps {
    form: CampaignPayload;
    setForm: (form: CampaignPayload) => void;
    onSubmit: () => void;
    editing: CampaignItem | null;
    onCancel: () => void;
}

export function CampaignForm({
    form,
    setForm,
    onSubmit,
    editing,
    onCancel,
}: CampaignFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {editing ? "Cập nhật Campaign" : "Tạo Campaign"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Section>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Name">
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="Tên chiến dịch"
                            />
                        </Field>
                        <Field label="Status">
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
                        <Field label="Start Date (ISO)">
                            <Input
                                value={form.startDate}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        startDate: e.target.value,
                                    })
                                }
                                placeholder="2025-12-20T00:00:00Z"
                            />
                        </Field>
                        <Field label="End Date (ISO)">
                            <Input
                                value={form.endDate}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        endDate: e.target.value,
                                    })
                                }
                                placeholder="2026-02-01T00:00:00Z"
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
                    <div className="flex gap-2">
                        <Button onClick={onSubmit}>
                            {editing ? "Lưu cập nhật" : "Tạo mới"}
                        </Button>
                        {editing && (
                            <Button variant="outline" onClick={onCancel}>
                                Hủy sửa
                            </Button>
                        )}
                    </div>
                </Section>
            </CardContent>
        </Card>
    );
}



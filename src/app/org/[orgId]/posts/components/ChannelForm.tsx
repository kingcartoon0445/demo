"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Section } from "./Field";
import type { ChannelPayload, ChannelItem } from "@/interfaces/post";

interface ChannelFormProps {
    form: ChannelPayload;
    setForm: (form: ChannelPayload) => void;
    onSubmit: () => void;
    editing: ChannelItem | null;
    onCancel: () => void;
}

export function ChannelForm({
    form,
    setForm,
    onSubmit,
    editing,
    onCancel,
}: ChannelFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {editing ? "Cập nhật Channel" : "Tạo Channel"}
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
                            />
                        </Field>
                        <Field label="Type">
                            <Input
                                value={form.type}
                                onChange={(e) =>
                                    setForm({ ...form, type: e.target.value })
                                }
                                placeholder="Facebook/Website/Instagram/..."
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
                        <Field label="Active">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={form.isActive}
                                    onCheckedChange={(v) =>
                                        setForm({ ...form, isActive: v })
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    Bật/Tắt
                                </span>
                            </div>
                        </Field>
                    </div>
                    <Field label="Config (JSON string)">
                        <Textarea
                            rows={3}
                            value={form.config}
                            onChange={(e) =>
                                setForm({ ...form, config: e.target.value })
                            }
                            placeholder={`{\n  "token": "..." \n}`}
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

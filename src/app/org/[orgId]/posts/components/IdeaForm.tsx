"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Section } from "./Field";
import type { IdeaPayload, IdeaItem } from "@/interfaces/post";

interface IdeaFormProps {
    form: IdeaPayload;
    setForm: (form: IdeaPayload) => void;
    onSubmit: () => void;
    editing: IdeaItem | null;
    onCancel: () => void;
}

export function IdeaForm({
    form,
    setForm,
    onSubmit,
    editing,
    onCancel,
}: IdeaFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {editing ? "Cập nhật Idea" : "Tạo Idea"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Section>
                    <Field label="Topic">
                        <Input
                            value={form.topic}
                            onChange={(e) =>
                                setForm({ ...form, topic: e.target.value })
                            }
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
                    <Field label="Content">
                        <Textarea
                            rows={3}
                            value={form.content}
                            onChange={(e) =>
                                setForm({ ...form, content: e.target.value })
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


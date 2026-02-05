"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Section } from "./Field";
import type { HashtagPayload, HashtagItem } from "@/interfaces/post";

interface HashtagFormProps {
    form: HashtagPayload;
    setForm: (form: HashtagPayload) => void;
    onSubmit: () => void;
    editing: HashtagItem | null;
    onCancel: () => void;
}

export function HashtagForm({
    form,
    setForm,
    onSubmit,
    editing,
    onCancel,
}: HashtagFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {editing ? "Cập nhật Hashtag" : "Tạo Hashtag"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Section>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tag (không kèm #)">
                            <Input
                                value={form.tag}
                                onChange={(e) =>
                                    setForm({ ...form, tag: e.target.value })
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


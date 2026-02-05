"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Section } from "./Field";
import type { PostPayload, PostListItem } from "@/interfaces/post";

interface PostFormProps {
    form: PostPayload;
    setForm: (form: PostPayload) => void;
    onSubmit: () => void;
    editing: PostListItem | null;
    onCancel: () => void;
}

export function PostForm({
    form,
    setForm,
    onSubmit,
    editing,
    onCancel,
}: PostFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{editing ? "Cập nhật Post" : "Tạo Post"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Section>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Title">
                            <Input
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                                placeholder="Tiêu đề"
                            />
                        </Field>
                        <Field label="Type">
                            <Input
                                value={form.type}
                                onChange={(e) =>
                                    setForm({ ...form, type: e.target.value })
                                }
                                placeholder="Text/Image/Video/Reel/Story/Link"
                            />
                        </Field>
                        <Field label="Scheduled Time (ISO)">
                            <Input
                                value={form.scheduledTime}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        scheduledTime: e.target.value,
                                    })
                                }
                                placeholder="2025-12-12T10:00:00Z"
                            />
                        </Field>
                        <Field label="Published Time (readonly)">
                            <Input
                                value={form.scheduledTime}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        scheduledTime: e.target.value,
                                    })
                                }
                                placeholder="2025-12-12T10:00:00Z"
                            />
                        </Field>
                        <Field label="Channel Id">
                            <Input
                                value={form.channelId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        channelId: e.target.value,
                                    })
                                }
                                placeholder="channel-uuid"
                            />
                        </Field>
                        <Field label="Idea Id">
                            <Input
                                value={form.ideaId}
                                onChange={(e) =>
                                    setForm({ ...form, ideaId: e.target.value })
                                }
                                placeholder="idea-uuid"
                            />
                        </Field>
                        <Field label="Campaign Id">
                            <Input
                                value={form.campaignId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        campaignId: e.target.value,
                                    })
                                }
                                placeholder="campaign-uuid"
                            />
                        </Field>
                        <Field label="Label Ids (comma)">
                            <Input
                                value={
                                    Array.isArray(form.labelIds)
                                        ? form.labelIds.join(",")
                                        : form.labelIds || ""
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        labelIds: e.target.value,
                                    })
                                }
                                placeholder="label-1,label-2"
                            />
                        </Field>
                        <Field label="Hashtags (comma, không kèm #)">
                            <Input
                                value={
                                    Array.isArray(form.hashtags)
                                        ? form.hashtags.join(",")
                                        : form.hashtags || ""
                                }
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        hashtags: e.target.value,
                                    })
                                }
                                placeholder="Sale,Summer"
                            />
                        </Field>
                        <Field label="Status (1: active)">
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
                    <Field label="Content">
                        <Textarea
                            rows={4}
                            value={form.content}
                            onChange={(e) =>
                                setForm({ ...form, content: e.target.value })
                            }
                            placeholder="Nội dung bài viết"
                        />
                    </Field>
                    <Field label="External Media Data (JSON string)">
                        <Textarea
                            rows={3}
                            value={form.externalMediaData
                                ?.map((media) => media.url)
                                .join(",")}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    externalMediaData: JSON.parse(
                                        e.target.value
                                    ),
                                })
                            }
                            placeholder={`{\n  "images": ["url1","url2"]\n}`}
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

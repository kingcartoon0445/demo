"use client";

import { uploadFile } from "@/api/org";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelItem, PostListItem, PostPayload } from "@/interfaces/post";
import { format } from "date-fns";
import { Info, Monitor, Smartphone, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { DateTimePicker } from "./DateTimePicker";
import { HashtagCombobox } from "./HashtagCombobox";
import { LabelCombobox } from "./LabelCombobox";
import { useLanguage } from "@/contexts/LanguageContext";

interface PostFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: PostPayload;
    setForm: (form: PostPayload) => void;
    onSubmit: (override?: PostPayload) => Promise<void> | void;
    editing: PostListItem | null;
    orgId: string;
    facebookPages: any[];
    channelIdByPageId: Record<string, string>;
    selectedFbPage: string;
    selectedChannelId?: string;
}

export function PostFormDialog({
    open,
    onOpenChange,
    form,
    setForm,
    onSubmit,
    editing,
    orgId,
    facebookPages,
    channelIdByPageId,
    selectedFbPage,
    selectedChannelId,
}: PostFormDialogProps) {
    const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(
        null
    );
    const [externalLinks, setExternalLinks] = useState<
        { url: string; type: "image" | "video" }[]
    >([]);
    const { t } = useLanguage();

    useEffect(() => {
        // Đồng bộ externalMediaData vào state links
        const data = form.externalMediaData;
        if (Array.isArray(data)) {
            // Nếu đã đúng cấu trúc {url,type}
            if (data.length === 0 || (data[0] as any)?.url) {
                const normalized = (data as any[]).map((item) => ({
                    url: String(item.url),
                    type:
                        item.type === "video"
                            ? "video"
                            : ("image" as "video" | "image"),
                }));
                setExternalLinks(normalized);
                return;
            }
            // Nếu là mảng string => convert
            const converted = (data as any[]).map((item) => {
                const url = typeof item === "string" ? item : String(item);
                const { isImage, isVideo } = getMediaType(url);
                return {
                    url,
                    type: (isVideo ? "video" : "image") as "video" | "image",
                };
            });
            setExternalLinks(converted);
            return;
        }
        setExternalLinks([]);
    }, [form.externalMediaData]);

    const resolvePageIdFromChannel = (cid: string | undefined) => {
        if (!cid) return "__none__";
        // Với requirement mới: channelId chính là uid page => trả thẳng cid
        return cid;
    };

    // Channel chọn từ danh sách page (facebookPages)
    const handlePageSelect = (pageId: string) => {
        // channelId cần là id của connection FB (uid của page)
        setSelectedPageId(pageId || "__none__");
        if (pageId === "__none__") {
            setForm({ ...form, channelId: "" });
            setSelectedChannel(null);
            return;
        }
        const page = facebookPages.find((p) => p.uid === pageId);
        setForm({ ...form, channelId: pageId }); // dùng uid của page làm channelId khi submit
        if (page) {
            setSelectedChannel({
                id: pageId,
                name: page.name || page.title || page.uid,
                type: "Facebook",
                pageId,
                config: "",
                isActive: true,
                status: 1,
            } as any);
        } else {
            setSelectedChannel(null);
        }
    };

    // Đồng bộ pageId hiển thị khi mở popup
    useEffect(() => {
        if (selectedFbPage) {
            handlePageSelect(selectedFbPage);
        } else {
            const pageId = resolvePageIdFromChannel(form.channelId);
            setSelectedPageId(pageId);
            if (pageId !== "__none__") {
                handlePageSelect(pageId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFbPage, form.channelId, channelIdByPageId]);

    const handleUploadFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const files = Array.from(fileList);
        const newLinks: { url: string; type: "image" | "video" }[] = [];

        for (const file of files) {
            const mime = file.type;
            const isImage = mime.startsWith("image/");
            const isVideo = mime.startsWith("video/");
            if (!isImage && !isVideo) {
                toast.error("Chỉ hỗ trợ upload hình ảnh hoặc video");
                continue;
            }

            try {
                const res = await uploadFile(orgId, file);
                if (res?.code === 0 && res?.content) {
                    newLinks.push({
                        url: res.content,
                        type: isVideo ? "video" : "image",
                    });
                } else {
                    toast.error(res?.message || "Upload thất bại");
                }
            } catch (error: any) {
                console.error("Upload file error:", error);
                toast.error(
                    error?.response?.data?.message || "Upload thất bại, thử lại"
                );
            }
        }

        if (newLinks.length > 0) {
            const updated = [...externalLinks, ...newLinks];
            setExternalLinks(updated);
            setForm({ ...form, externalMediaData: updated });
            toast.success(`Đã upload ${newLinks.length} file`);
        }
    };

    const handleRemoveLink = (link: string) => {
        const updated = externalLinks.filter((l) => l.url !== link);
        setExternalLinks(updated);
        setForm({ ...form, externalMediaData: updated });
    };

    const stringifyMedia = (data: any) => {
        if (Array.isArray(data)) {
            try {
                return JSON.stringify(data);
            } catch {
                return data as any;
            }
        }
        return data;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleScheduleSubmit = async () => {
        if (isSubmitting) return;

        // Lên lịch / Đăng ngay => status = 3
        const now = new Date();
        const formattedNow = format(now, "yyyy-MM-dd'T'HH:mm");
        const updatedForm: PostPayload = {
            ...form,
            type: form.type || postType || "Post",
            status: 3,
            scheduledTime:
                publishMode === "now"
                    ? (undefined as any)
                    : form.scheduledTime || formattedNow,
            externalMediaData: stringifyMedia(form.externalMediaData) as any,
        };

        setForm(updatedForm);
        setIsSubmitting(true);
        try {
            await onSubmit(updatedForm);
            onOpenChange(false);
        } catch (error) {
            console.error("Submit post error:", error);
            toast.error("Đăng bài thất bại, vui lòng thử lại");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDraftSubmit = () => {
        // Draft => status = 1, không bắt buộc thời gian
        const updatedForm: PostPayload = {
            ...form,
            type: form.type || postType || "Post",
            status: 1,
            externalMediaData: stringifyMedia(form.externalMediaData) as any,
        };
        setForm(updatedForm);
        onSubmit(updatedForm);
        onOpenChange(false);
    };

    const isWordPressChannel = selectedChannel?.type === "WordPress";

    const getMediaType = (link: string) => {
        try {
            const url = new URL(link);
            const fileNameParam = url.searchParams.get("fileName");
            const name = fileNameParam || url.pathname.split("/").pop() || link;
            const lower = name.toLowerCase();
            const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower);
            const isVideo = /\.(mp4|mov|webm|mkv|avi)$/.test(lower);
            return { isImage, isVideo };
        } catch {
            const lower = link.toLowerCase();
            const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower);
            const isVideo = /\.(mp4|mov|webm|mkv|avi)$/.test(lower);
            return { isImage, isVideo };
        }
    };

    // Component để render preview
    const PostPreview = () => {
        const [previewPlatform, setPreviewPlatform] = useState<
            "desktop" | "mobile"
        >("mobile");
        const getMediaList = () => {
            if (!externalLinks || externalLinks.length === 0) return [];
            return externalLinks.map((item) => ({
                url: (item as any)?.url ?? item,
                type: (item as any)?.type || "image",
            }));
        };

        const mediaList = getMediaList();
        const channelName = selectedChannel?.name || "Facebook Channel";
        const channelAvatar = selectedChannel?.pageId
            ? "" // Có thể lấy từ pageAvatarByPageId nếu cần
            : "";

        return (
            <div className="space-y-4">
                {/* Preview header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Post Preview</h3>
                        <Info className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value="facebook" onValueChange={() => {}}>
                            <SelectTrigger className="h-8 text-xs w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="facebook">
                                    Facebook
                                </SelectItem>
                                <SelectItem value="instagram">
                                    Instagram
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 border rounded">
                            <Button
                                variant={
                                    previewPlatform === "desktop"
                                        ? "default"
                                        : "ghost"
                                }
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setPreviewPlatform("desktop")}
                            >
                                <Monitor className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={
                                    previewPlatform === "mobile"
                                        ? "default"
                                        : "ghost"
                                }
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setPreviewPlatform("mobile")}
                            >
                                <Smartphone className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Preview content */}
                <div
                    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${
                        previewPlatform === "mobile" ? "max-w-sm" : "w-full"
                    }`}
                >
                    {/* Header */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            {channelAvatar ? (
                                <img
                                    src={channelAvatar}
                                    alt={channelName}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <Avatar
                                    name={channelName}
                                    size="40"
                                    round={true}
                                />
                            )}
                            <div className="flex-1">
                                <div className="font-semibold text-sm">
                                    {channelName}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Just now
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {form.content && (
                        <div className="p-3 text-sm whitespace-pre-wrap">
                            {form.content}
                        </div>
                    )}

                    {/* Media */}
                    {mediaList.length > 0 && (
                        <div className="w-full">
                            {mediaList[0].type === "image" ? (
                                <img
                                    src={mediaList[0].url}
                                    alt="preview"
                                    className="w-full h-auto object-cover"
                                />
                            ) : (
                                <video
                                    src={mediaList[0].url}
                                    controls
                                    className="w-full h-auto"
                                />
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-3 border-t border-gray-200 flex items-center gap-4 text-gray-600 text-sm">
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <span>Like</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <span>Comment</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const [postType, setPostType] = useState<"Post" | "Reel">("Post");
    const [isExpanded, setIsExpanded] = useState(false);
    const [publishMode, setPublishMode] = useState<"schedule" | "now">(
        "schedule"
    );
    const hashtagsRef = useRef<HTMLDivElement | null>(null);
    const [selectedPageId, setSelectedPageId] = useState<string>("__none__");

    // Đồng bộ postType từ form.type (khi edit) và tự động set title từ content
    useEffect(() => {
        if (form.type === "Reel") {
            setPostType("Reel");
        } else if (form.type === "Post" || !form.type) {
            setPostType("Post");
        }

        const content = form.content || "";
        const trimmed = content.trim();
        const titleFromContent =
            trimmed.length > 80 ? trimmed.slice(0, 80) + "..." : trimmed;
        if (titleFromContent !== form.title) {
            setForm({
                ...form,
                title: titleFromContent,
                type: form.type || "Post",
            });
        }
    }, [form.content, form.type]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
                <div className="flex h-[calc(90vh)] overflow-hidden">
                    {/* Left side - Form */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b bg-white">
                            <Tabs
                                value={postType}
                                onValueChange={(v) => {
                                    const next = v as "Post" | "Reel";
                                    setPostType(next);
                                    setForm({ ...form, type: next });
                                }}
                            >
                                <TabsList className="grid w-full max-w-xs grid-cols-2">
                                    <TabsTrigger
                                        value="Post"
                                        className="flex items-center gap-2"
                                    >
                                        <Image
                                            src="/icons/fb_ico.svg"
                                            alt="Facebook"
                                            width={16}
                                            height={16}
                                        />
                                        Post
                                    </TabsTrigger>
                                    <TabsTrigger value="Reel">Reel</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Channel và Publish Mode */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("common.page")}
                                    </label>
                                    <Select
                                        value={selectedPageId}
                                        onValueChange={(value) =>
                                            handlePageSelect(value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={t(
                                                    "common.selectPage"
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">
                                                {t("common.selectPage")}
                                            </SelectItem>
                                            {facebookPages.map((p) => (
                                                <SelectItem
                                                    key={p.uid}
                                                    value={p.uid}
                                                >
                                                    {p.name || p.title || p.uid}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("common.publishMode")}
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                publishMode === "now"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                                setPublishMode("now")
                                            }
                                        >
                                            {t("common.publishNow")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={
                                                publishMode === "schedule"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                                setPublishMode("schedule")
                                            }
                                        >
                                            {t("common.schedulePublish")}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Published Time - chỉ hiển thị khi chọn "Lên lịch" */}
                            {publishMode === "schedule" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("common.publishedTime")}
                                    </label>
                                    <DateTimePicker
                                        value={form.scheduledTime}
                                        onChange={(value) =>
                                            setForm({
                                                ...form,
                                                scheduledTime: value,
                                            })
                                        }
                                        placeholder={t("common.selectDateTime")}
                                    />
                                </div>
                            )}

                            {/* Text area */}
                            <Textarea
                                className="min-h-[200px] text-base border-0 focus-visible:ring-0 resize-none"
                                value={form.content}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        content: e.target.value,
                                    })
                                }
                                placeholder={t("common.writeSomething")}
                            />

                            {/* <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            hashtagsRef.current?.scrollIntoView(
                                                {
                                                    behavior: "smooth",
                                                    block: "start",
                                                }
                                            );
                                        }}
                                    >
                                        <Hash className="h-4 w-4 mr-2" />
                                        Hashtags
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Handle AI Assist
                                        }}
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        AI Assist
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-rainbow"
                                    >
                                        <Type className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Bold className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Italic className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div> */}

                            {/* Media upload area */}
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => {
                                    document
                                        .getElementById("media-upload")
                                        ?.click();
                                }}
                            >
                                <input
                                    id="media-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        handleUploadFiles(e.target.files);
                                        e.target.value = "";
                                    }}
                                />
                                <p className="text-gray-500">
                                    {t("common.clickOrDragDropMedia")}
                                </p>
                                {externalLinks.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {externalLinks.map((item) => {
                                            const url =
                                                (item as any)?.url ?? item;
                                            const { isImage, isVideo } =
                                                getMediaType(url);
                                            return (
                                                <div
                                                    key={url}
                                                    className="relative aspect-video rounded overflow-hidden bg-black/5"
                                                >
                                                    {isImage ? (
                                                        <img
                                                            src={url}
                                                            alt="media"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : isVideo ? (
                                                        <video
                                                            src={url}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : null}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveLink(
                                                                url
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Action icons row */}
                            {/* <div className="flex items-center gap-4 text-gray-400">
                                <button className="hover:text-gray-600 transition-colors">
                                    <MapPin className="h-5 w-5" />
                                </button>
                                <button className="hover:text-gray-600 transition-colors">
                                    <ImageIcon className="h-5 w-5" />
                                </button>
                                <button className="hover:text-gray-600 transition-colors">
                                    <Edit className="h-5 w-5" />
                                </button>
                                <button className="hover:text-gray-600 transition-colors">
                                    <MessageCircle className="h-5 w-5" />
                                </button>
                                <button className="hover:text-gray-600 transition-colors">
                                    <Share2 className="h-5 w-5" />
                                </button>
                                <button className="hover:text-gray-600 transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                                <button
                                    className="hover:text-gray-600 transition-colors disabled:opacity-50"
                                    disabled
                                >
                                    <Calendar className="h-5 w-5" />
                                </button>
                            </div> */}

                            {/* Additional options */}
                            <div className="border-t pt-4 space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Campaign
                                        </label>
                                        <CampaignCombobox
                                            orgId={orgId}
                                            value={form.campaignId}
                                            onChange={(value) =>
                                                setForm({
                                                    ...form,
                                                    campaignId: value,
                                                })
                                            }
                                            placeholder="Chọn Campaign..."
                                        />
                                    </div> */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t("common.labels")}
                                        </label>
                                        <LabelCombobox
                                            orgId={orgId}
                                            multiple
                                            value=""
                                            onChange={() => {}}
                                            values={
                                                Array.isArray(form.labelIds)
                                                    ? form.labelIds
                                                    : typeof form.labelIds ===
                                                      "string"
                                                    ? form.labelIds
                                                          .split(",")
                                                          .map((s) => s.trim())
                                                          .filter(Boolean)
                                                    : []
                                            }
                                            onChangeMultiple={(values) =>
                                                setForm({
                                                    ...form,
                                                    labelIds: values,
                                                })
                                            }
                                            placeholder={t(
                                                "common.selectLabels"
                                            )}
                                        />
                                    </div>
                                    <div
                                        className="space-y-2"
                                        ref={hashtagsRef}
                                    >
                                        <label className="text-sm font-medium">
                                            {t("common.hashtags")}
                                        </label>
                                        <HashtagCombobox
                                            orgId={orgId}
                                            values={
                                                Array.isArray(form.hashtags)
                                                    ? form.hashtags
                                                    : typeof form.hashtags ===
                                                      "string"
                                                    ? (form.hashtags as string)
                                                          .split(",")
                                                          .map((s) => s.trim())
                                                          .filter(Boolean)
                                                    : []
                                            }
                                            onChange={(values) =>
                                                setForm({
                                                    ...form,
                                                    hashtags: values,
                                                })
                                            }
                                            placeholder={t(
                                                "common.selectHashtags"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-white">
                            <Button
                                variant="outline"
                                onClick={handleDraftSubmit}
                            >
                                {t("common.draft")}
                            </Button>
                            <Button
                                onClick={handleScheduleSubmit}
                                className="bg-teal-600 hover:bg-teal-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? t("common.loading") || "Đang xử lý..."
                                    : publishMode === "now"
                                    ? t("common.publishNow")
                                    : editing
                                    ? t("common.update")
                                    : t("common.schedule")}
                            </Button>
                        </div>
                    </div>

                    {/* Right side - Preview */}
                    {/* Tạm ẩn phần preview theo yêu cầu */}
                    {/* <div className="w-96 border-l bg-slate-50 p-6 overflow-y-auto">
                        <PostPreview />
                    </div> */}
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { FacebookPageCombobox } from "../componentsWithHook/FacebookPageCombobox";
import { postsApi } from "@/api/posts";
import { uploadFile } from "@/api/org";
import { useOrgStore } from "@/store/useOrgStore";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import AiPostDialog from "./AiPostDialog";

// Hiện tại chỉ dùng type "post" và "reels"
type PostType = "post" | "reels";

export function CreatePostContent() {
    const params = useParams();
    const router = useRouter();
    const orgId = (params.orgId as string) || "";

    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [selectedChannelNames, setSelectedChannelNames] = useState<string[]>(
        [],
    );
    const [postType, setPostType] = useState<PostType>("post");
    const [content, setContent] = useState<string>("");
    const [externalMediaData, setExternalMediaData] = useState<string>("");
    // Use an array of objects for preview to handle multiple files more easily
    const [mediaFiles, setMediaFiles] = useState<
        { url: string; type: "image" | "video" }[]
    >([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [scheduleTime, setScheduleTime] = useState<string>("");

    // Permission
    const [userPermission, setUserPermission] = useState<{
        role: number;
        isOwner: boolean;
        loading: boolean;
        pageIds?: string[];
    }>({
        role: 0,
        isOwner: false,
        loading: true,
        pageIds: [],
    });

    const { orgDetail } = useOrgStore();

    useEffect(() => {
        const checkPermission = async () => {
            if (!orgId) return;
            try {
                // 1. Check Owner
                if (
                    orgDetail &&
                    orgDetail.id === orgId &&
                    orgDetail.type === "OWNER"
                ) {
                    setUserPermission({
                        role: 3,
                        isOwner: true,
                        loading: false,
                    });
                    return;
                }

                // 2. Check Role
                const permRes = await postsApi.checkPermissionPost(orgId, {});
                const role = permRes?.data?.role || 0;
                const pageIds = permRes?.data?.allowedChannelIds || [];
                setUserPermission({
                    role,
                    isOwner: false,
                    loading: false,
                    pageIds,
                });
            } catch (err) {
                console.error("Error checkPermission:", err);
                setUserPermission((prev) => ({ ...prev, loading: false }));
            }
        };
        checkPermission();
    }, [orgId, orgDetail]);

    useEffect(() => {
        if (
            !userPermission.loading &&
            !userPermission.isOwner &&
            userPermission.role === 0
        ) {
            router.push(`/org/${orgId}/posts`);
        }
    }, [userPermission, orgId, router]);

    const extractHashtags = (text: string): string[] => {
        const hashtagRegex = /#[\w\u00C0-\u1EF9]+/g;
        return text.match(hashtagRegex) || [];
    };

    // Helper function để convert datetime-local string thành ISO string với timezone local
    const toLocalISOString = (dateTimeLocal: string): string => {
        // dateTimeLocal format: "2025-12-19T09:00"
        const date = new Date(dateTimeLocal);
        // Lấy timezone offset (phút)
        const offset = date.getTimezoneOffset();
        // Convert offset thành hours và minutes
        const offsetHours = Math.floor(Math.abs(offset) / 60);
        const offsetMinutes = Math.abs(offset) % 60;
        const sign = offset <= 0 ? "+" : "-";

        // Format: YYYY-MM-DDTHH:mm:ss+HH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${String(
            offsetHours,
        ).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
    };

    const buildPayload = (status: number, scheduledTime?: string) => {
        const hashtags = extractHashtags(content);
        const title =
            content.trim().split("\n")[0]?.slice(0, 100) ||
            "Bài viết mới từ COKA.AI";

        const base: any = {
            title,
            // API yêu cầu format "Post" hoặc "Reels" (chữ hoa đầu)
            type: postType.charAt(0).toUpperCase() + postType.slice(1), // "post" -> "Post", "reels" -> "Reels"
            content,
            externalMediaData: externalMediaData || "",
            ideaId: "",
            campaignId: "",
            labelIds: [] as string[],
            hashtags,
            status,
        };

        if (selectedChannelIds.length === 1) {
            base.channelId = selectedChannelIds[0];
        } else if (selectedChannelIds.length > 1) {
            base.channelIds = selectedChannelIds;
        }

        if (scheduledTime) {
            base.scheduledTime = scheduledTime;
        }

        return base;
    };

    const handleSubmit = async (
        mode: "draft" | "publishNow" | "schedule",
        scheduledTime?: string,
    ) => {
        if (!orgId) {
            console.error("Thiếu orgId");
            return;
        }
        if (selectedChannelIds.length === 0) {
            alert("Vui lòng chọn kênh đăng (Facebook Page).");
            return;
        }
        if (!content.trim()) {
            alert("Vui lòng nhập nội dung bài viết.");
            return;
        }

        try {
            setIsSubmitting(true);
            let status = 0;
            let scheduleIso: string | undefined;

            if (mode === "draft") {
                // Nếu role là 1 (Editor) -> Lưu thành status 2
                if (!userPermission.isOwner && userPermission.role === 1) {
                    status = 2;
                } else {
                    status = 1; // Bản nháp mặc định
                }
            } else if (mode === "schedule") {
                status = 3; // Lên lịch
                if (!scheduledTime) {
                    alert("Vui lòng chọn thời gian lên lịch.");
                    return;
                }
                // Convert datetime-local thành ISO string với timezone local (không convert sang UTC)
                scheduleIso = toLocalISOString(scheduledTime);
            } else if (mode === "publishNow") {
                // Đăng ngay
                status = 6; // Trạng thái mặc định để publish ngay
            }

            const payload = buildPayload(status, scheduleIso);

            await postsApi.createPost(orgId, payload);

            // Hiển thị toast thành công
            toast.success("Đăng bài thành công");

            // Reset form sau khi tạo thành công
            setContent("");
            setContent("");
            setExternalMediaData("");
            setMediaFiles([]);

            // Chuyển về trang schedule (trừ khi là lưu nháp)
            if (mode !== "draft") {
                router.push(`/org/${orgId}/posts/schedule`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo bài viết:", error);
            alert("Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !orgId) return;

        // Current media state (to check against)
        const currentMedia = mediaFiles;
        const hasImage = currentMedia.some((m) => m.type === "image");
        const hasVideo = currentMedia.some((m) => m.type === "video");

        // Validate logic
        for (const file of files) {
            const isVideo = file.type.startsWith("video");
            const isImage = file.type.startsWith("image");

            if (!isImage && !isVideo) {
                toast.error("Chỉ hỗ trợ file ảnh hoặc video.");
                continue;
            }

            // 1. Không thể cùng lúc upload video và hình ảnh
            if (isVideo && hasImage) {
                toast.error("Không thể đăng video và ảnh cùng lúc.");
                return;
            }
            if (isImage && hasVideo) {
                toast.error("Không thể đăng ảnh và video cùng lúc.");
                return;
            }

            // 2. Nếu type là reels thì media phải là video và chỉ được đăng 1 video
            if (postType === "reels") {
                if (!isVideo) {
                    toast.error("Reels chỉ hỗ trợ đăng video.");
                    return;
                }
                if (currentMedia.length > 0 || files.length > 1) {
                    toast.error("Reels chỉ được đăng duy nhất 1 video.");
                    return;
                }
            }

            // Also check new batch consistency
            const batchHasImage = files.some((f) => f.type.startsWith("image"));
            const batchHasVideo = files.some((f) => f.type.startsWith("video"));
            if (batchHasImage && batchHasVideo) {
                toast.error("Không thể chọn video và ảnh cùng lúc.");
                return;
            }
        }

        // Upload files
        const newMedia: { url: string; type: "image" | "video" }[] = [];
        try {
            for (const file of files) {
                const res: any = await uploadFile(orgId, file);
                const url =
                    (typeof res?.content === "string"
                        ? res.content
                        : res?.content?.url) ||
                    res?.data?.url ||
                    res?.url ||
                    "";

                if (url) {
                    newMedia.push({
                        url,
                        type: file.type.startsWith("video") ? "video" : "image",
                    });
                } else {
                    toast.error("Không lấy được URL file.");
                }
            }

            if (newMedia.length > 0) {
                const updatedMedia = [...currentMedia, ...newMedia];
                setMediaFiles(updatedMedia);
                setExternalMediaData(JSON.stringify(updatedMedia));
            }
        } catch (error) {
            console.error("Lỗi upload file:", error);
            toast.error("Upload file thất bại. Vui lòng thử lại.");
        }
    };

    const removeMedia = (index: number) => {
        const updated = [...mediaFiles];
        updated.splice(index, 1);
        setMediaFiles(updated);
        setExternalMediaData(JSON.stringify(updated));
    };
    return (
        <>
            {/* Header nội bộ */}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">Tạo bài viết mới</h1>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Bản nháp
                    </span>
                </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 flex flex-col">
                    <div className="w-full pb-24 space-y-8">
                        <section>
                            <h3 className="font-semibold text-sm text-slate-500 mb-3 uppercase tracking-wide">
                                Chọn kênh đăng
                            </h3>
                            <div className="max-w-md">
                                <FacebookPageCombobox
                                    orgId={orgId}
                                    value={selectedChannelIds}
                                    onChange={(pageIds, pageNames) => {
                                        if (Array.isArray(pageIds)) {
                                            setSelectedChannelIds(pageIds);
                                        } else {
                                            setSelectedChannelIds(
                                                pageIds ? [pageIds] : [],
                                            );
                                        }

                                        if (Array.isArray(pageNames)) {
                                            setSelectedChannelNames(pageNames);
                                        } else {
                                            setSelectedChannelNames(
                                                pageNames ? [pageNames] : [],
                                            );
                                        }
                                    }}
                                    placeholder="Chọn Facebook Page để đăng..."
                                    allowedPageIds={
                                        !userPermission.isOwner
                                            ? userPermission.pageIds
                                            : undefined
                                    }
                                    multiple={true}
                                    showAll={true}
                                />
                            </div>
                        </section>

                        {/* Loại bài viết (ẩn Video, chỉ Post & Reels) */}
                        <section>
                            <h3 className="font-semibold text-sm text-slate-500 mb-3 uppercase tracking-wide">
                                Loại bài viết
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPostType("post")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium shadow-sm transition-all ${
                                        postType === "post"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-primary/50 hover:text-primary"
                                    }`}
                                >
                                    <span className="material-icons-outlined text-xl">
                                        post_add
                                    </span>
                                    <span>Post</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPostType("reels")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium shadow-sm transition-all ${
                                        postType === "reels"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-primary/50 hover:text-primary"
                                    }`}
                                >
                                    <span className="material-icons-outlined text-xl">
                                        movie
                                    </span>
                                    <span>Reels</span>
                                </button>
                            </div>
                        </section>

                        {/* Editor */}
                        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[400px]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 rounded-t-xl">
                                <button
                                    type="button"
                                    onClick={() => setAiDialogOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-primary text-white text-xs font-medium rounded-full hover:shadow-lg transition-all shadow-md shadow-primary/20"
                                >
                                    <span className="material-icons-outlined text-sm">
                                        auto_fix_high
                                    </span>
                                    Viết lại với AI
                                </button>
                            </div>
                            <div className="flex-1 p-6">
                                <textarea
                                    className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-50 text-lg leading-relaxed resize-none p-0 outline-none"
                                    placeholder="Bạn đang nghĩ gì? Hãy bắt đầu viết câu chuyện của bạn..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-b-xl">
                                <div className="flex gap-4">
                                    <span>Đã nhập: 0 từ</span>
                                    <span>0 ký tự</span>
                                </div>
                                <span>Gợi ý: Dưới 2000 ký tự cho Facebook</span>
                            </div>
                        </section>

                        {/* Media đính kèm + Bình luận tự động */}
                        <section className="flex flex-col gap-8">
                            {/* Media */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                        <span className="material-icons-outlined text-lg text-slate-500">
                                            perm_media
                                        </span>
                                        Media đính kèm
                                    </label>
                                    <button className="text-xs text-primary hover:underline font-medium">
                                        Mở thư viện đầy đủ
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {mediaFiles.map((media, index) => (
                                        <div
                                            key={index}
                                            className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm"
                                        >
                                            {media.type === "image" ? (
                                                <img
                                                    src={media.url}
                                                    alt="Selected"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                                />
                                            ) : (
                                                <video
                                                    src={media.url}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 bg-white/20 backdrop-blur-md text-white rounded-full p-1 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() =>
                                                    removeMedia(index)
                                                }
                                            >
                                                <span className="material-icons-outlined text-xs">
                                                    close
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                    <label className="col-span-1 aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                                        <span className="material-icons-outlined text-2xl mb-1">
                                            add_photo_alternate
                                        </span>
                                        <span className="text-[10px]">
                                            Thêm Ảnh
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Bình luận tự động - tạm ẩn, sẽ dùng lại sau */}
                            {/*
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-outlined text-slate-500 text-lg">
                                            chat_bubble
                                        </span>
                                        <span className="text-sm font-semibold">
                                            Bình luận tự động
                                        </span>
                                    </div>
                                    <div className="relative inline-block w-9 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            className="absolute block w-4 h-4 rounded-full bg-white border-4 border-slate-300 appearance-none cursor-pointer top-0.5 left-0.5 peer transition-all"
                                        />
                                        <span className="block overflow-hidden h-5 rounded-full bg-slate-300 peer-checked:bg-primary transition-colors" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="relative w-full group">
                                        <textarea
                                            className="w-full h-24 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-primary focus:border-primary p-3 resize-none"
                                            placeholder="Nhập bình luận (Link, Seeding...)..."
                                        />
                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                            <button
                                                type="button"
                                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-slate-500"
                                                title="Emoji"
                                            >
                                                <span className="material-icons-outlined text-sm">
                                                    sentiment_satisfied
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group"
                                    >
                                        <span className="material-icons-outlined text-lg group-hover:scale-110 transition-transform">
                                            add_comment
                                        </span>
                                        <span className="text-sm font-medium">
                                            + Thêm bình luận
                                        </span>
                                    </button>
                                </div>
                            </div>
                            */}
                        </section>
                    </div>
                </div>

                {/* Footer thao tác – sticky dưới cùng, full width */}
                <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        type="button"
                        className="px-5 py-2.5 text-slate-500 hover:text-red-500 font-medium text-sm transition-colors rounded-lg hover:bg-red-50"
                    >
                        Hủy bỏ
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleSubmit("draft")}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 h-[42px] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-50 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60"
                        >
                            {!userPermission.isOwner &&
                            userPermission.role === 1
                                ? "Lưu"
                                : "Lưu nháp"}
                        </button>

                        {/* Chỉ hiện nút Lên lịch và Đăng ngay nếu là Owner hoặc Role >= 2 */}
                        {(userPermission.isOwner ||
                            userPermission.role >= 2) && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setScheduleDialogOpen(true)}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 h-[42px] border border-primary text-primary rounded-lg font-medium text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                                >
                                    <span className="material-icons-outlined text-lg">
                                        schedule
                                    </span>
                                    Lên lịch
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit("publishNow")}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 h-[42px] bg-primary hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                                >
                                    <span className="material-icons-outlined text-lg">
                                        send
                                    </span>
                                    Đăng ngay
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <CustomerAlertDialog
                open={scheduleDialogOpen}
                setOpen={setScheduleDialogOpen}
                title="Lên lịch đăng bài"
                subtitle={
                    <div className="space-y-4">
                        <p>
                            Chọn thời gian bạn muốn bài viết được đăng trên{" "}
                            <span className="font-medium">
                                {selectedChannelNames.length > 0
                                    ? selectedChannelNames.join(", ")
                                    : "kênh đã chọn"}
                            </span>
                            .
                        </p>
                        <input
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        {scheduleTime && (
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Bài viết sẽ được đăng vào lúc{" "}
                                <span className="font-semibold">
                                    {format(
                                        new Date(scheduleTime),
                                        "HH:mm 'ngày' dd/MM/yyyy",
                                        { locale: vi },
                                    )}
                                </span>
                                .
                            </p>
                        )}
                    </div>
                }
                confirmText="Xác nhận lên lịch"
                isSubmitting={isSubmitting}
                onSubmit={async () => {
                    await handleSubmit("schedule", scheduleTime);
                    setScheduleDialogOpen(false);
                }}
            />

            <AiPostDialog
                isOpen={aiDialogOpen}
                onOpenChange={setAiDialogOpen}
                orgId={orgId}
                onSuccess={(aiContent) => {
                    setContent((prev) =>
                        prev ? prev + "\n\n" + aiContent : aiContent,
                    );
                }}
            />
        </>
    );
}

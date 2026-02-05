"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { FacebookPageCombobox } from "../componentsWithHook/FacebookPageCombobox";
import { postsApi } from "@/api/posts";
import { uploadFile } from "@/api/org";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { useOrgStore } from "@/store/useOrgStore";

// Hiện tại chỉ dùng type "post" và "reels"
type PostType = "post" | "reels";

interface EditPostContentProps {
    postId: string;
}

export function EditPostContent({ postId }: EditPostContentProps) {
    const params = useParams();
    const router = useRouter();
    const orgId = (params.orgId as string) || "";

    const [loading, setLoading] = useState(true);
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");
    const [selectedChannelName, setSelectedChannelName] = useState<string>("");
    const [postType, setPostType] = useState<PostType>("post");
    const [content, setContent] = useState<string>("");
    const [externalMediaData, setExternalMediaData] = useState<string>("");
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

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

    // Sync scheduleTime khi dialog mở
    useEffect(() => {
        if (scheduleDialogOpen && !scheduleTime) {
            // Nếu dialog mở nhưng chưa có scheduleTime, giữ nguyên giá trị hiện tại
            // (scheduleTime đã được set từ loadPostData)
        }
    }, [scheduleDialogOpen, scheduleTime]);

    // Load post data khi mount
    useEffect(() => {
        const loadPostData = async () => {
            if (!orgId || !postId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await postsApi.getPost(orgId, postId);
                const post = (response as any)?.data || response;

                // Set form data từ API response
                setSelectedChannelId(post.channelId || "");
                setSelectedChannelName(post.channelName || "");

                // Normalize type từ API (có thể là "Post", "post", "Reels", "reels")
                const normalizedType = post.type
                    ? (post.type.toLowerCase() as PostType)
                    : "post";
                setPostType(normalizedType === "reels" ? "reels" : "post");

                setContent(post.content || "");
                setExternalMediaData(post.externalMediaData || "");

                // Parse externalMediaData để hiển thị preview
                if (post.externalMediaData) {
                    try {
                        const mediaData = JSON.parse(post.externalMediaData);
                        if (Array.isArray(mediaData) && mediaData.length > 0) {
                            setMediaPreviewUrl(mediaData[0]?.url || "");
                        } else if (typeof mediaData === "string") {
                            // Nếu là string URL trực tiếp
                            setMediaPreviewUrl(mediaData);
                        } else if (
                            typeof mediaData === "object" &&
                            mediaData !== null
                        ) {
                            // Handle object format (e.g. { content: "url", code: 0 })
                            if (mediaData.content) {
                                setMediaPreviewUrl(mediaData.content);
                            } else if (mediaData.url) {
                                setMediaPreviewUrl(mediaData.url);
                            }
                        }
                    } catch {
                        // Nếu không parse được, thử dùng trực tiếp
                        if (typeof post.externalMediaData === "string") {
                            setMediaPreviewUrl(post.externalMediaData);
                        }
                    }
                }

                // Set scheduledTime nếu có
                if (post.scheduledTime) {
                    const date = new Date(post.scheduledTime);
                    const localDateTime = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000,
                    )
                        .toISOString()
                        .slice(0, 16);
                    setScheduleTime(localDateTime);
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu bài viết:", error);
                toast.error(
                    "Không thể tải dữ liệu bài viết. Vui lòng thử lại.",
                );
            } finally {
                setLoading(false);
            }
        };

        loadPostData();
    }, [orgId, postId]);

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
            // API có thể yêu cầu format "Post" hoặc "post", normalize về format API mong đợi
            type: postType.charAt(0).toUpperCase() + postType.slice(1), // "post" -> "Post", "reels" -> "Reels"
            content,
            channelId: selectedChannelId,
            externalMediaData: externalMediaData || "",
            ideaId: "",
            campaignId: "",
            labelIds: [] as string[],
            hashtags,
            status,
        };

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
        if (!selectedChannelId) {
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
                    status = 1; // Bản nháp
                }
            } else if (mode === "schedule") {
                if (!userPermission.isOwner && userPermission.role === 1) {
                    toast.error("Bạn không có quyền lên lịch");
                    return;
                }
                status = 3; // Lên lịch
                if (!scheduledTime) {
                    alert("Vui lòng chọn thời gian lên lịch.");
                    return;
                }
                // Convert datetime-local thành ISO string với timezone local
                scheduleIso = toLocalISOString(scheduledTime);
            } else {
                // Đăng ngay
                if (!userPermission.isOwner && userPermission.role === 1) {
                    toast.error("Bạn không có quyền đăng ngay");
                    return;
                }
                // Save as Ready (2) before triggering postToFacebook
                status = 2;
            }

            const payload = buildPayload(status, scheduleIso);

            await postsApi.updatePost(orgId, postId, payload);

            if (mode === "publishNow") {
                // Gọi API postToFacebook
                await postsApi.postToFacebook(orgId, postId);
                setScheduleTime("");
                toast.success("Đăng thành công");
            } else {
                // Cập nhật scheduleTime ngay lập tức nếu là mode "schedule"
                if (mode === "schedule" && scheduledTime) {
                    const date = new Date(scheduledTime);
                    const localDateTime = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000,
                    )
                        .toISOString()
                        .slice(0, 16);
                    setScheduleTime(localDateTime);
                }
                toast.success("Cập nhật bài viết thành công");
            }

            // Chuyển về trang schedule
            router.push(`/org/${orgId}/posts/schedule`);
        } catch (error) {
            console.error("Lỗi khi cập nhật bài viết:", error);
            alert("Có lỗi xảy ra khi cập nhật bài viết. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !orgId) return;

        try {
            const res: any = await uploadFile(orgId, file);
            const url = res?.content?.url || res?.data?.url || res?.url || "";

            if (url) {
                const type = file.type.startsWith("video") ? "video" : "image";
                const payload = JSON.stringify([{ url, type }]);
                setExternalMediaData(payload);
                setMediaPreviewUrl(url);
            } else {
                setExternalMediaData(JSON.stringify(res));
            }
        } catch (error) {
            console.error("Lỗi upload file:", error);
            alert("Upload file thất bại. Vui lòng thử lại.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-500">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header nội bộ */}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">Chỉnh sửa bài viết</h1>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Chỉnh sửa
                    </span>
                </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 flex flex-col">
                    <div className="w-full pb-24 space-y-8">
                        {/* Hiển thị thời gian lên lịch nếu có */}
                        {scheduleTime && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
                                <span className="material-icons-outlined text-blue-600 dark:text-blue-400 text-lg">
                                    schedule
                                </span>
                                <div className="flex-1">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                                        Thời gian lên lịch
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                                        {format(
                                            new Date(scheduleTime),
                                            "EEEE, dd MMMM yyyy 'lúc' HH:mm",
                                            { locale: vi },
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        <section>
                            <h3 className="font-semibold text-sm text-slate-500 mb-3 uppercase tracking-wide">
                                Chọn kênh đăng
                            </h3>
                            <div className="max-w-md">
                                <FacebookPageCombobox
                                    orgId={orgId}
                                    value={selectedChannelId}
                                    onChange={(pageId, pageName) => {
                                        const pid = Array.isArray(pageId)
                                            ? pageId[0]
                                            : pageId;
                                        const pname = Array.isArray(pageName)
                                            ? pageName[0]
                                            : pageName;
                                        setSelectedChannelId(pid || "");
                                        setSelectedChannelName(pname || "");
                                    }}
                                    placeholder="Chọn Facebook Page để đăng..."
                                    allowedPageIds={
                                        !userPermission.isOwner
                                            ? userPermission.pageIds
                                            : undefined
                                    }
                                />
                            </div>
                        </section>

                        {/* Loại bài viết */}
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

                        {/* Media đính kèm */}
                        <section className="flex flex-col gap-8">
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
                                    {mediaPreviewUrl && (
                                        <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
                                            <img
                                                src={mediaPreviewUrl}
                                                alt="Selected"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 bg-white/20 backdrop-blur-md text-white rounded-full p-1 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() => {
                                                    setMediaPreviewUrl("");
                                                    setExternalMediaData("");
                                                }}
                                            >
                                                <span className="material-icons-outlined text-xs">
                                                    close
                                                </span>
                                            </button>
                                        </div>
                                    )}
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
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer thao tác */}
                <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(`/org/${orgId}/posts/schedule`)
                        }
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
                                {selectedChannelName || "kênh đã chọn"}
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
                    // Đảm bảo scheduleTime đã được cập nhật trước khi submit
                    if (scheduleTime) {
                        await handleSubmit("schedule", scheduleTime);
                        setScheduleDialogOpen(false);
                    } else {
                        alert("Vui lòng chọn thời gian lên lịch.");
                    }
                }}
            />
        </>
    );
}

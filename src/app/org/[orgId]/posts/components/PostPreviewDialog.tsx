"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    MapPin,
    Image as ImageIcon,
    Share2,
    Trash2,
    Eye,
    Star,
} from "lucide-react";
import Image from "next/image";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import type { PostListItem } from "@/interfaces/post";
import toast from "react-hot-toast";

interface PostPreviewDialogProps {
    post: PostListItem | null;
    media: { url: string; type: "image" | "video" }[];
    onClose: () => void;
    channelName: string;
    channelType?: string;
    authorName?: string;
    avatar?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onPublish?: () => void;
    onReply?: (payload: any) => Promise<void>;
}

// Parse sourceId và tạo Facebook URL
const parseSourceIdToFacebookUrl = (
    sourceId: string | null | undefined,
    channelId: string | null | undefined
): string | null => {
    if (!sourceId) return null;
    // Format 1: pageId_postId
    if (sourceId.includes("_")) {
        const [pageId, postId] = sourceId.split("_");
        return `<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D${postId}%26id%3D${pageId}&show_text=true&width=740" width="740" height="581" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
    }

    // Format 2: postId
    return `<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D${sourceId}%26id%3D${channelId}&show_text=true&width=740" width="740" height="581" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
};

export function PostPreviewDialog({
    post,
    media,
    onClose,
    channelName,
    channelType = "Facebook",
    authorName = "thanh lv",
    avatar,
    onEdit,
    onDelete,
    onPublish,
    onReply,
}: PostPreviewDialogProps) {
    if (!post) return null;

    const dateStr = post.scheduledTime;
    const date = dateStr ? new Date(dateStr) : null;

    // Lấy scheduledTime để hiển thị thời gian lên lịch
    const scheduledTime = (post as any).scheduledTime;
    const scheduledDate = scheduledTime ? new Date(scheduledTime) : null;

    // Kiểm tra nếu bài viết đã đăng (status = 6) và có sourceId
    const postStatus = (post as any).status;
    const sourceId = (post as any).sourceId;
    const channelId = (post as any).channelId;
    // Debug log để kiểm tra

    const isPublished = postStatus === 6;
    const metadataRaw = (post as any).metadata;
    let metadata: any = null;
    if (metadataRaw) {
        try {
            metadata =
                typeof metadataRaw === "string"
                    ? JSON.parse(metadataRaw)
                    : metadataRaw;
        } catch {
            metadata = null;
        }
    }
    const facebookIframeHtml =
        isPublished && sourceId && !metadata
            ? parseSourceIdToFacebookUrl(sourceId, channelId)
            : null;

    // Render media theo kiểu Facebook
    const renderMedia = (
        mediaItems: { url: string; type: "image" | "video" }[]
    ) => {
        if (!mediaItems || mediaItems.length === 0) return null;

        // Nếu chỉ có 1 ảnh/video: hiển thị full width
        if (mediaItems.length === 1) {
            return (
                <div className="w-full rounded-lg overflow-hidden bg-black">
                    {mediaItems[0].type === "image" ? (
                        <img
                            src={mediaItems[0].url}
                            alt="media"
                            className="w-full h-auto object-contain max-h-[600px]"
                        />
                    ) : (
                        <video
                            src={mediaItems[0].url}
                            controls
                            className="w-full h-auto object-contain max-h-[600px]"
                        />
                    )}
                </div>
            );
        }

        // Nếu có 2 ảnh: chia đôi
        if (mediaItems.length === 2) {
            return (
                <div className="grid grid-cols-2 gap-1 w-full rounded-lg overflow-hidden">
                    {mediaItems.map((m, idx) => (
                        <div key={m.url} className="bg-black">
                            {m.type === "image" ? (
                                <img
                                    src={m.url}
                                    alt="media"
                                    className="w-full h-full object-cover aspect-square"
                                />
                            ) : (
                                <video
                                    src={m.url}
                                    controls
                                    className="w-full h-full object-cover aspect-square"
                                />
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // Nếu có 3 ảnh: 1 lớn bên trái, 2 nhỏ bên phải
        if (mediaItems.length === 3) {
            return (
                <div className="grid grid-cols-2 gap-1 w-full rounded-lg overflow-hidden">
                    <div className="row-span-2 bg-black">
                        {mediaItems[0].type === "image" ? (
                            <img
                                src={mediaItems[0].url}
                                alt="media"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <video
                                src={mediaItems[0].url}
                                controls
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    {mediaItems.slice(1).map((m, idx) => (
                        <div key={m.url} className="bg-black">
                            {m.type === "image" ? (
                                <img
                                    src={m.url}
                                    alt="media"
                                    className="w-full h-full object-cover aspect-square"
                                />
                            ) : (
                                <video
                                    src={m.url}
                                    controls
                                    className="w-full h-full object-cover aspect-square"
                                />
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // Nếu có 4 ảnh trở lên: grid 2x2 với overlay số lượng còn lại
        const displayItems = mediaItems.slice(0, 4);
        const remaining = mediaItems.length - 4;

        return (
            <div className="grid grid-cols-2 gap-1 w-full rounded-lg overflow-hidden">
                {displayItems.map((m, idx) => (
                    <div key={m.url} className="relative bg-black">
                        {m.type === "image" ? (
                            <img
                                src={m.url}
                                alt="media"
                                className="w-full h-full object-cover aspect-square"
                            />
                        ) : (
                            <video
                                src={m.url}
                                controls
                                className="w-full h-full object-cover aspect-square"
                            />
                        )}
                        {remaining > 0 && idx === 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                                +{remaining}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Extract hashtags from content
    const extractHashtags = (content: string) => {
        const hashtagRegex = /#[\w\u00C0-\u1EF9]+/g;
        return content.match(hashtagRegex) || [];
    };

    const hashtags = post.content ? extractHashtags(post.content) : [];
    const contentWithoutHashtags = post.content
        ? post.content.replace(/#[\w\u00C0-\u1EF9]+/g, "").trim()
        : "";

    const avatarName = getFirstAndLastWord(channelName);
    const avatarUrl = avatar ? getAvatarUrl(avatar) : undefined;

    // Comments from metadata (if published)
    const commentsDetail: Array<{
        Id: string;
        Message: string;
        FromId: string;
        FromName: string;
        CreatedTime: string;
        LikeCount: number;
        ParentId: string | null;
    }> = metadata?.commentsDetail || [];

    const reactions = metadata?.reactions ?? 0;
    const commentsCount = metadata?.comments ?? commentsDetail.length ?? 0;
    const shares = metadata?.shares ?? 0;
    const permalink = metadata?.permalink as string | undefined;

    const [commentText, setCommentText] = useState("");
    const [replyTarget, setReplyTarget] = useState<{
        id: string;
        name: string;
        commentId?: string;
    } | null>(null);
    const [isReplying, setIsReplying] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Build comment tree
    const rootComments = commentsDetail.filter((c) => !c.ParentId);
    const getReplies = (parentId: string) =>
        commentsDetail.filter((c) => c.ParentId === parentId);

    // Pagination states
    const [visibleRoots, setVisibleRoots] = useState(3);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
        new Set()
    );

    const handleExpandReplies = (rootId: string) => {
        const newSet = new Set(expandedReplies);
        newSet.add(rootId);
        setExpandedReplies(newSet);
    };

    // Render single comment component
    const renderComment = (c: any, isReply = false) => (
        <div
            key={c.Id}
            className={`flex items-start gap-3 ${isReply ? "mt-3 ml-10" : ""}`}
        >
            <Avatar name={c.FromName} size="36" round />
            <div className="flex-1">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {c.FromName}
                    </div>
                    <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {c.Message}
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-2">
                    <div className="text-xs text-slate-500">
                        {format(new Date(c.CreatedTime), "dd/MM/yyyy HH:mm", {
                            locale: vi,
                        })}
                    </div>
                    {c.LikeCount > 0 && (
                        <div className="text-xs text-slate-500">
                            {c.LikeCount} lượt thích
                        </div>
                    )}
                    <button
                        className="text-lg font-semibold text-slate-600 hover:text-primary"
                        onClick={() => {
                            setReplyTarget({
                                id: c.FromId,
                                name: c.FromName,
                                commentId: c.Id,
                            });
                            setTimeout(() => {
                                textareaRef.current?.focus();
                            }, 0);
                        }}
                    >
                        Trả lời
                    </button>
                </div>
            </div>
        </div>
    );

    const handleReply = async () => {
        if (!commentText.trim()) {
            toast.error("Vui lòng nhập nội dung bình luận");
            return;
        }

        if (!onReply) {
            toast.error("Tính năng đang phát triển");
            return;
        }

        const mentionIds: string[] = []; // Tạm thời bỏ mention theo yêu cầu, nhưng vẫn giữ cấu trúc mảng nếu backend cần

        // Chuẩn bị payload mẫu để backend gọi Graph API
        const payload = {
            message: commentText.trim(),
            mentionIds, // thêm id người được mention (nếu có)
            sourceId: sourceId || metadata?.facebookId, // id bài viết trên Facebook
            channelId, // pageId
            commentId: replyTarget?.commentId,
        };

        try {
            setIsReplying(true);
            await onReply(payload);
            setCommentText("");
            setReplyTarget(null);
            toast.success("Đã gửi bình luận");
        } catch (error) {
            console.error("Reply error:", error);
            toast.error("Gửi bình luận thất bại");
        } finally {
            setIsReplying(false);
        }
    };

    return (
        <Dialog open={!!post} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="min-w-[800px] min-h-[90vh] overflow-y-auto p-0">
                {!sourceId && (
                    <DialogHeader className="px-6 pt-6 pb-4 border-b space-y-3">
                        <div className="flex items-center justify-between gap-3 w-full">
                            {/* Avatar với Facebook badge */}
                            <div className="relative flex-shrink-0 flex items-center gap-2">
                                <Avatar
                                    name={avatarName}
                                    src={avatarUrl || ""}
                                    size="40"
                                    round={true}
                                    className="border-2 border-white"
                                />
                                {channelType === "Facebook" && (
                                    <div className="absolute -bottom-1 -left-1 h-5 w-5 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-sm">
                                        <Image
                                            src="/icons/fb_ico.svg"
                                            alt="Facebook"
                                            width={12}
                                            height={12}
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <div className="font-semibold text-sm">
                                        {channelName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {(post as any).createdByName
                                            ? `Bởi ${
                                                  (post as any).createdByName
                                              }`
                                            : ""}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                {/* Tên page */}

                                {/* Date ngang với avatar */}
                                {date && (
                                    <div className="text-sm text-muted-foreground">
                                        {format(date, "EEE, d MMM yyyy, HH:mm")}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogHeader>
                )}

                <div className="px-6 py-4 space-y-4">
                    {/* Hiển thị thời gian lên lịch nếu có */}
                    {scheduledDate && (
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
                                        scheduledDate,
                                        "EEEE, dd MMMM yyyy 'lúc' HH:mm",
                                        { locale: vi }
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {!facebookIframeHtml && !isPublished && (
                        <>
                            {contentWithoutHashtags && (
                                <div className="prose max-w-none text-sm">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: contentWithoutHashtags,
                                        }}
                                    />
                                </div>
                            )}

                            {hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {renderMedia(media)}
                        </>
                    )}

                    {/* Nếu đã publish và có metadata: render view kiểu Facebook với thống kê + bình luận */}
                    {isPublished && metadata && (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mt-12">
                                <div className="flex items-center gap-1">
                                    <span className="material-icons text-primary text-[18px]">
                                        thumb_up
                                    </span>
                                    <span>{reactions} lượt tương tác</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-icons text-slate-500 text-[18px]">
                                        chat_bubble
                                    </span>
                                    <span>{commentsCount} bình luận</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-icons text-slate-500 text-[18px]">
                                        share
                                    </span>
                                    <span>{shares} lượt chia sẻ</span>
                                </div>
                                {permalink && (
                                    <a
                                        href={permalink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ml-auto text-primary text-sm hover:underline"
                                    >
                                        Mở trên Facebook
                                    </a>
                                )}
                            </div>

                            {/* Nội dung post */}
                            {contentWithoutHashtags && (
                                <div className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                                    {contentWithoutHashtags}
                                </div>
                            )}

                            {hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {renderMedia(media)}

                            {/* Comments */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                    Bình luận ({commentsDetail.length})
                                </h4>
                                {commentsDetail.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        Chưa có bình luận.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {rootComments
                                            .slice(0, visibleRoots)
                                            .map((root) => {
                                                const replies = getReplies(
                                                    root.Id
                                                );
                                                const isExpanded =
                                                    expandedReplies.has(
                                                        root.Id
                                                    );
                                                const showAllReplies =
                                                    replies.length <= 1 ||
                                                    isExpanded;
                                                const visibleReplies =
                                                    showAllReplies
                                                        ? replies
                                                        : replies.slice(0, 1);
                                                const remainingReplies =
                                                    replies.length -
                                                    visibleReplies.length;

                                                return (
                                                    <div
                                                        key={root.Id}
                                                        className="flex flex-col"
                                                    >
                                                        {renderComment(root)}
                                                        {visibleReplies.length >
                                                            0 && (
                                                            <div className="flex flex-col">
                                                                {visibleReplies.map(
                                                                    (reply) =>
                                                                        renderComment(
                                                                            reply,
                                                                            true
                                                                        )
                                                                )}
                                                            </div>
                                                        )}
                                                        {remainingReplies >
                                                            0 && (
                                                            <button
                                                                onClick={() =>
                                                                    handleExpandReplies(
                                                                        root.Id
                                                                    )
                                                                }
                                                                className="ml-10 mt-2 text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1"
                                                            >
                                                                <span className="material-icons-outlined text-sm">
                                                                    subdirectory_arrow_right
                                                                </span>
                                                                Xem thêm{" "}
                                                                {
                                                                    remainingReplies
                                                                }{" "}
                                                                câu trả lời
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        {rootComments.length > visibleRoots && (
                                            <div className="pt-2">
                                                <button
                                                    onClick={() =>
                                                        setVisibleRoots(
                                                            (prev) => prev + 3
                                                        )
                                                    }
                                                    className="text-sm font-semibold text-slate-600 hover:text-primary w-full text-left"
                                                >
                                                    Xem thêm bình luận...
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reply box */}
                                <div className="flex items-start gap-3">
                                    <Avatar
                                        name={avatarName}
                                        src={avatarUrl || ""}
                                        size="36"
                                        round
                                    />
                                    <div className="flex-1">
                                        {replyTarget && (
                                            <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 dark:text-slate-300">
                                                <span>
                                                    Đang trả lời{" "}
                                                    <strong>
                                                        {replyTarget.name}
                                                    </strong>
                                                </span>
                                                <button
                                                    className="text-primary"
                                                    onClick={() =>
                                                        setReplyTarget(null)
                                                    }
                                                >
                                                    Bỏ
                                                </button>
                                            </div>
                                        )}
                                        <textarea
                                            rows={2}
                                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                            placeholder="Viết bình luận..."
                                            value={commentText}
                                            onChange={(e) =>
                                                setCommentText(e.target.value)
                                            }
                                            ref={textareaRef}
                                            disabled={isReplying}
                                        />
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                            <Button
                                                size="sm"
                                                onClick={handleReply}
                                                disabled={
                                                    isReplying ||
                                                    !commentText.trim()
                                                }
                                            >
                                                {isReplying
                                                    ? "Đang gửi..."
                                                    : "Trả lời"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fallback: Facebook embed nếu chưa có metadata */}
                    {facebookIframeHtml && (
                        <div
                            className="w-full h-full flex justify-center mt-10"
                            dangerouslySetInnerHTML={{
                                __html: facebookIframeHtml,
                            }}
                        />
                    )}
                    {isPublished && !metadata && !facebookIframeHtml && (
                        <div className="border-t pt-4 mt-4 text-sm text-amber-600 dark:text-amber-400">
                            ⚠️ Bài viết đã được đăng nhưng chưa có
                            metadata/sourceId để hiển thị.
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar */}
                {!sourceId && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="flex items-center gap-4">
                            <button
                                className="p-2 hover:bg-slate-100 rounded transition-colors"
                                title="Location"
                            >
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <button
                                className="p-2 hover:bg-slate-100 rounded transition-colors"
                                title="Media"
                            >
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <button
                                className="p-2 hover:bg-slate-100 rounded transition-colors"
                                title="Share"
                            >
                                <Share2 className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <button
                                className="p-2 hover:bg-slate-100 rounded transition-colors"
                                title="Delete"
                                onClick={onDelete}
                            >
                                <Trash2 className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <button
                                className="p-2 hover:bg-slate-100 rounded transition-colors"
                                title="Preview"
                            >
                                <Eye className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                onClick={onDelete}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onEdit}
                            >
                                Edit
                            </Button>
                            <Button size="sm" onClick={onPublish}>
                                Publish
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

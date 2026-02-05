"use client";

import { useRouter } from "next/navigation";
import { PostData } from "./types";

interface PostsGridViewProps {
    posts: PostData[];
    orgId: string;
    onViewDetail: (post: PostData) => void;
    onDelete?: (post: PostData) => void;
    onRepost?: (post: PostData) => void;
    repostingId?: string | null;
    userPermission?: { role: number; isOwner: boolean };
}

export function PostsGridView({
    posts,
    orgId,
    onViewDetail,
    onDelete,
    onRepost,
    repostingId,
    userPermission,
}: PostsGridViewProps) {
    const router = useRouter();

    const canPerformAction =
        userPermission?.isOwner || (userPermission?.role || 0) > 0;
    const canCreate =
        userPermission?.isOwner || (userPermission?.role || 0) > 0;
    const canRepost =
        userPermission?.isOwner || (userPermission?.role || 0) >= 2;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => {
                const hasTime = post.time && post.time !== "--:--";
                const dateTimeLabel = hasTime
                    ? `${post.date} • ${post.time}`
                    : post.date;
                // Với status 1, 2, 3: click vào card sẽ chuyển qua trang edit
                const isEditable =
                    post.rawData?.status &&
                    [1, 2, 3].includes(post.rawData.status);
                const isDeletable =
                    !post.rawData?.status ||
                    ![4, 6, 7, 8].includes(post.rawData.status);

                return (
                    <div
                        key={post.id}
                        onClick={() => {
                            if (isEditable) {
                                router.push(
                                    `/org/${orgId}/posts/edit/${post.id}`
                                );
                            } else {
                                onViewDetail(post);
                            }
                        }}
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer relative"
                    >
                        <div className="aspect-video w-full bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                            {post.thumbnail ? (
                                <img
                                    src={post.thumbnail}
                                    alt="Post thumbnail"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-icons text-4xl text-slate-300">
                                        image_not_supported
                                    </span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                {/* Nếu editable, hiện nút edit */}
                                {isEditable ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                                `/org/${orgId}/posts/edit/${post.id}`
                                            );
                                        }}
                                        className="bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-primary dark:text-slate-300 backdrop-blur-sm p-1.5 rounded-lg shadow-sm transition-colors"
                                        title="Chỉnh sửa"
                                    >
                                        <span className="material-icons-outlined text-base">
                                            edit
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetail(post);
                                        }}
                                        className="bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-primary dark:text-slate-300 backdrop-blur-sm p-1.5 rounded-lg shadow-sm transition-colors"
                                        title="Xem chi tiết"
                                    >
                                        <span className="material-icons-outlined text-base">
                                            visibility
                                        </span>
                                    </button>
                                )}
                                {/* Nút đăng lại cho status 7 */}
                                {canRepost && post.rawData?.status === 7 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRepost?.(post);
                                        }}
                                        disabled={!!repostingId}
                                        className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm transition-colors ${
                                            repostingId
                                                ? "text-slate-300 cursor-not-allowed"
                                                : "text-slate-500 hover:text-blue-500 dark:text-slate-300"
                                        }`}
                                        title="Đăng lại"
                                    >
                                        <span
                                            className={`material-icons-outlined text-base ${
                                                repostingId === post.id
                                                    ? "animate-spin text-blue-500"
                                                    : ""
                                            }`}
                                        >
                                            refresh
                                        </span>
                                    </button>
                                )}
                                {/* Nút xóa */}
                                {canPerformAction && isDeletable && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete?.(post);
                                        }}
                                        className="bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-red-500 dark:text-slate-300 backdrop-blur-sm p-1.5 rounded-lg shadow-sm transition-colors"
                                        title="Xóa bài viết"
                                    >
                                        <span className="material-icons-outlined text-base">
                                            delete
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-base mb-1 line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                {post.description}
                            </p>
                            <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${post.statusClass}`}
                                    >
                                        {post.statusLabel}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <span className="text-xs">
                                        {dateTimeLabel}
                                    </span>
                                    <span
                                        className={`material-icons text-[18px] ${post.channelColor}`}
                                    >
                                        {post.channelIcon}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            {/* Card tạo bài viết mới */}
            {canCreate && (
                <div
                    onClick={() => router.push(`/org/${orgId}/posts/create`)}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full items-center justify-center p-8 hover:border-primary hover:bg-slate-100/60 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                            <span className="material-icons text-2xl">add</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-base">
                            Tạo bài viết mới
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Lên lịch hoặc đăng ngay
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

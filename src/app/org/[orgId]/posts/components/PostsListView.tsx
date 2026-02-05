"use client";

import { useRouter } from "next/navigation";
import { PostData } from "./types";

interface PostsListViewProps {
    posts: PostData[];
    orgId: string;
    onViewDetail: (post: PostData) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
    loading?: boolean;
    onDelete?: (post: PostData) => void;
    onRepost?: (post: PostData) => void;
    repostingId?: string | null;
    userPermission?: { role: number; isOwner: boolean };
}

export function PostsListView({
    posts,
    orgId,
    onViewDetail,
    hasMore,
    onLoadMore,
    loading,
    onDelete,
    onRepost,
    repostingId,
    userPermission,
}: PostsListViewProps) {
    const router = useRouter();

    const canPerformAction =
        userPermission?.isOwner || (userPermission?.role || 0) > 0;
    const canRepost =
        userPermission?.isOwner || (userPermission?.role || 0) >= 2;

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/60">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Bài viết
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Kênh
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Thời gian đăng
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {posts.map((post) => (
                            <tr
                                key={post.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col max-w-md">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                                            {post.title}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {post.description.length > 60
                                                ? `${post.description.slice(
                                                      0,
                                                      60
                                                  )}...`
                                                : post.description}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {post.channelAvatar ? (
                                            <img
                                                src={post.channelAvatar}
                                                alt={
                                                    post.channelName ||
                                                    "Channel"
                                                }
                                                className="h-7 w-7 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                                                {(post.channelName || "Kênh")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                                            {post.channelName || "Kênh"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${post.statusClass}`}
                                    >
                                        {post.statusLabel}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col">
                                        <span>{post.date}</span>
                                        <span className="text-xs text-slate-400">
                                            {post.time}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Với status 1, 2, 3: chỉ hiển thị nút edit, không có nút xem chi tiết */}
                                        {post.rawData?.status &&
                                        [1, 2, 3].includes(
                                            post.rawData.status
                                        ) ? (
                                            canPerformAction ? (
                                                <button
                                                    onClick={() => {
                                                        router.push(
                                                            `/org/${orgId}/posts/edit/${post.id}`
                                                        );
                                                    }}
                                                    className="text-slate-500 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    title="Chỉnh sửa"
                                                >
                                                    <span className="material-icons-outlined text-[18px]">
                                                        edit
                                                    </span>
                                                </button>
                                            ) : null
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        onViewDetail(post)
                                                    }
                                                    className="text-slate-500 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    title="Xem chi tiết"
                                                >
                                                    <span className="material-icons-outlined text-[18px]">
                                                        visibility
                                                    </span>
                                                </button>
                                            </>
                                        )}
                                        {/* Nút đăng lại cho status 7 */}
                                        {canRepost &&
                                            post.rawData?.status === 7 && (
                                                <button
                                                    onClick={() =>
                                                        onRepost?.(post)
                                                    }
                                                    disabled={!!repostingId}
                                                    className={`transition-colors p-1 rounded ${
                                                        repostingId
                                                            ? "text-slate-300 cursor-not-allowed"
                                                            : "text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                                    title="Đăng lại"
                                                >
                                                    <span
                                                        className={`material-icons-outlined text-[18px] ${
                                                            repostingId ===
                                                            post.id
                                                                ? "animate-spin text-blue-500"
                                                                : ""
                                                        }`}
                                                    >
                                                        refresh
                                                    </span>
                                                </button>
                                            )}
                                        {canPerformAction &&
                                            (!post.rawData?.status ||
                                                ![4, 6, 7, 8].includes(
                                                    post.rawData.status
                                                )) && (
                                                <button
                                                    onClick={() =>
                                                        onDelete?.(post)
                                                    }
                                                    className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    title="Xóa bài viết"
                                                >
                                                    <span className="material-icons-outlined text-[18px]">
                                                        delete
                                                    </span>
                                                </button>
                                            )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                                Đang tải...
                            </>
                        ) : (
                            "Xem thêm"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

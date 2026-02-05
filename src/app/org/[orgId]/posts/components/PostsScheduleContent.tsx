"use client";

import { getFacebookMessageConnection } from "@/api/leadV2";
import { postsApi } from "@/api/posts";
import { useOrgStore } from "@/store/useOrgStore";
import { useDebounce } from "@/hooks/useDebounce";
import { endOfMonth, startOfMonth, subDays } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PostPreviewDialog } from "./PostPreviewDialog";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { PostsCalendarView } from "./PostsCalendarView";
import { PostsFilterToolbar } from "./PostsFilterToolbar";
import { PostsGridView } from "./PostsGridView";
import { PostsHeader } from "./PostsHeader";
import { PostsListView } from "./PostsListView";
import { PostData, ViewMode } from "./types";
import { parseMedia, transformPostData } from "./utils";

export function PostsScheduleContent() {
    const params = useParams();
    const router = useRouter();
    const orgId = (params.orgId as string) || "";
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);

    // Filter states
    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
        null,
    );

    // Status filter states
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);

    // Search state
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebounce(searchText, 500);

    // Date filter state
    // Mặc định 7 ngày qua
    const [startDate, setStartDate] = useState<string>(
        subDays(new Date(), 7).toISOString(),
    );
    const [endDate, setEndDate] = useState<string>(new Date().toISOString());

    // State cho calendar view selection (Tháng/Năm)
    const [selectedMonth, setSelectedMonth] = useState<string>(
        (new Date().getMonth() + 1).toString(),
    );
    const [selectedYear, setSelectedYear] = useState<string>(
        new Date().getFullYear().toString(),
    );

    // State cho post detail dialog
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [postDetail, setPostDetail] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Delete dialog state
    const [deletePostId, setDeletePostId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [repostingId, setRepostingId] = useState<string | null>(null);

    // Permission state
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

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [
        selectedChannelId,
        selectedStatus,
        debouncedSearchText,
        startDate,
        endDate,
        viewMode,
        selectedMonth,
        selectedYear,
    ]);

    // Check permissions
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
                        role: 3, // Full permission
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
                console.error("Error checking checkPermission:", err);
                setUserPermission((prev) => ({ ...prev, loading: false }));
            }
        };
        checkPermission();
    }, [orgId, orgDetail]);

    // Fetch posts từ API
    useEffect(() => {
        const fetchPosts = async () => {
            if (!orgId) {
                setError("Thiếu orgId");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                let effectiveStartDate = startDate;
                let effectiveEndDate = endDate;

                // Nếu đang ở view calendar, tính start/end dựa trên month/year đã chọn
                if (viewMode === "calendar") {
                    const month = parseInt(selectedMonth);
                    const year = parseInt(selectedYear);
                    // Tạo ngày mùng 1 của tháng/năm đã chọn
                    // Lưu ý: month trong Date là 0-11, nhưng value mình lưu là 1-12
                    const baseDate = new Date(year, month - 1, 1);
                    effectiveStartDate = startOfMonth(baseDate).toISOString();
                    effectiveEndDate = endOfMonth(baseDate).toISOString();
                }

                const response = await postsApi.getPosts(orgId, {
                    page,
                    pageSize,
                    channelId: selectedChannelId || undefined,
                    status: selectedStatus || undefined,
                    searchText: debouncedSearchText || undefined,
                    startDate: effectiveStartDate || undefined,
                    endDate: effectiveEndDate || undefined,
                    isList: viewMode === "list",
                });

                // API trả về PaginationResponse<PostPayload>
                // Response structure: { success, message, data, pagination }
                // hoặc { data: [...], content: [...], items: [...] }
                let postsData: any[] = [];

                // Nếu response là array trực tiếp
                if (Array.isArray(response)) {
                    postsData = response;
                }
                // Nếu response có field data (theo response mẫu)
                else if (response.data && Array.isArray(response.data)) {
                    postsData = response.data;
                }
                // Nếu response có field content
                else if (response.content && Array.isArray(response.content)) {
                    postsData = response.content;
                }
                // Nếu response có field items
                else if (response.items && Array.isArray(response.items)) {
                    postsData = response.items;
                }

                const transformedPosts = postsData.map(transformPostData);

                // Check hasMore based on pageSize
                if (transformedPosts.length < pageSize) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                // If list view and not first page, append
                if (viewMode === "list" && page > 1) {
                    setPosts((prev) => [...prev, ...transformedPosts]);
                } else {
                    setPosts(transformedPosts);
                }
            } catch (err: any) {
                console.error("Error fetching posts:", err);
                setError(err?.message || "Có lỗi xảy ra khi tải dữ liệu");
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [
        orgId,
        page,
        pageSize,
        selectedChannelId,
        selectedStatus,
        debouncedSearchText,
        startDate,
        endDate,
        viewMode,
        selectedMonth,
        selectedYear,
        refreshKey,
    ]);

    // Fetch channels
    useEffect(() => {
        const fetchChannels = async () => {
            if (!orgId) return;
            if (userPermission.loading) return;

            if (!userPermission.isOwner && userPermission.role === 0) {
                setChannels([]);
                return;
            }

            try {
                const response = await getFacebookMessageConnection(orgId);
                if (response.code === 0 && response.content) {
                    setChannels(response.content);
                }
            } catch (err) {
                console.error("Error fetching channels:", err);
            }
        };
        fetchChannels();
    }, [
        orgId,
        userPermission.loading,
        userPermission.role,
        userPermission.isOwner,
    ]);

    // Function để mở post detail
    const handleViewDetail = async (post: PostData) => {
        // Với status 1, 2, 3: không mở dialog, chuyển thẳng qua trang edit
        if (post.rawData?.status && [1, 2, 3].includes(post.rawData.status)) {
            router.push(`/org/${orgId}/posts/edit/${post.id}`);
            return;
        }
        if (!post.rawData) return;

        setSelectedPost(post.rawData);
        setLoadingDetail(true);

        try {
            const response = await postsApi.getPost(orgId, post.id);
            // API có thể trả về { data: {...} } hoặc object trực tiếp
            const detail = (response as any)?.data || response || post.rawData;
            // Merge với rawData để đảm bảo có đủ fields (như sourceId)
            const mergedDetail = {
                ...post.rawData,
                ...(detail as any),
                // Ưu tiên sourceId từ detail nếu có, nếu không dùng từ rawData
                sourceId: (detail as any)?.sourceId || post.rawData?.sourceId,
            };
            setPostDetail(mergedDetail);
        } catch (err) {
            console.error("Error fetching post detail:", err);
            // Nếu lỗi, vẫn dùng raw data
            setPostDetail(post.rawData);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleDeleteClick = (post: PostData) => {
        // Check permission: Role 0 -> No action
        if (!userPermission.isOwner && userPermission.role === 0) {
            return;
        }

        // Prevent deleting posts with status 4, 6, 7, 8
        if (
            post.rawData?.status &&
            [4, 6, 7, 8].includes(post.rawData.status)
        ) {
            return;
        }
        setDeletePostId(post.id);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!orgId || !deletePostId) return;

        try {
            await postsApi.deletePost(orgId, deletePostId);
            // Reload list
            setRefreshKey((prev) => prev + 1);
            // Close dialogs
            setShowDeleteDialog(false);
            setDeletePostId(null);
            // Close detail dialog if open and it's the deleted post
            if (selectedPost && selectedPost.id === deletePostId) {
                setSelectedPost(null);
                setPostDetail(null);
            }
        } catch (err) {
            console.error("Error deleting post:", err);
            // Có thể thêm toast error ở đây nếu cần
        }
    };

    const handleRepost = async (post: PostData) => {
        // Check permission: Role 0 -> No action
        if (!userPermission.isOwner && userPermission.role === 0) {
            return;
        }

        if (!orgId || repostingId) return;
        setRepostingId(post.id);
        try {
            await postsApi.postToFacebook(orgId, post.id);
            setRefreshKey((prev) => prev + 1);
        } catch (err) {
            console.error("Error reposting:", err);
        } finally {
            setRepostingId(null);
        }
    };

    // Filter channels based on permission
    const filteredChannels = userPermission.isOwner
        ? channels
        : channels.filter((c) => userPermission.pageIds?.includes(c.uid));

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            <PostsHeader viewMode={viewMode} setViewMode={setViewMode} />
            <PostsFilterToolbar
                orgId={orgId}
                viewMode={viewMode}
                channels={filteredChannels}
                selectedChannelId={selectedChannelId}
                setSelectedChannelId={setSelectedChannelId}
                searchText={searchText}
                setSearchText={setSearchText}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                canCreate={
                    userPermission.isOwner || (userPermission.role || 0) > 0
                }
            />

            {/* Nội dung: danh sách hoặc lưới */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 dark:bg-slate-950/40">
                {loading && (viewMode !== "list" || page === 1) ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-slate-500 dark:text-slate-400">
                            Đang tải dữ liệu...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-red-500 dark:text-red-400">
                            {error}
                        </div>
                    </div>
                ) : posts.length === 0 && !loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-slate-500 dark:text-slate-400">
                            Chưa có bài đăng nào
                        </div>
                    </div>
                ) : viewMode === "list" ? (
                    <PostsListView
                        posts={posts}
                        orgId={orgId}
                        onViewDetail={handleViewDetail}
                        hasMore={hasMore}
                        onLoadMore={() => setPage((p) => p + 1)}
                        loading={loading}
                        onDelete={handleDeleteClick}
                        onRepost={handleRepost}
                        repostingId={repostingId}
                        userPermission={userPermission}
                    />
                ) : viewMode === "grid" ? (
                    <PostsGridView
                        posts={posts}
                        orgId={orgId}
                        onViewDetail={handleViewDetail}
                        onDelete={handleDeleteClick}
                        onRepost={handleRepost}
                        repostingId={repostingId}
                        userPermission={userPermission}
                    />
                ) : (
                    <PostsCalendarView
                        posts={posts}
                        orgId={orgId}
                        onViewDetail={handleViewDetail}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                    />
                )}
            </div>

            {/* Post Detail Dialog */}
            {selectedPost && (
                <PostPreviewDialog
                    post={postDetail || selectedPost}
                    media={
                        postDetail
                            ? parseMedia(postDetail)
                            : parseMedia(selectedPost)
                    }
                    onClose={() => {
                        setSelectedPost(null);
                        setPostDetail(null);
                    }}
                    channelName={
                        (postDetail || selectedPost)?.channelName || "Facebook"
                    }
                    channelType="Facebook"
                    authorName={(postDetail || selectedPost)?.createdByName}
                    avatar={(postDetail || selectedPost)?.channelAvatar}
                    onEdit={() => {
                        if (
                            selectedPost?.id &&
                            selectedPost?.status &&
                            [1, 2, 3].includes(selectedPost.status)
                        ) {
                            router.push(
                                `/org/${orgId}/posts/edit/${selectedPost.id}`,
                            );
                        }
                    }}
                    onDelete={() => {
                        handleDeleteClick(postDetail || selectedPost);
                    }}
                    onPublish={() => {
                        // TODO: Implement publish
                    }}
                    onReply={async (payload) => {
                        if (!orgId) return;
                        await postsApi.replyComment(orgId, payload);

                        // Refresh detail to show new comment
                        if (selectedPost?.id) {
                            try {
                                const response = await postsApi.getPost(
                                    orgId,
                                    selectedPost.id,
                                );
                                const detail =
                                    (response as any)?.data ||
                                    response ||
                                    selectedPost;
                                const mergedDetail = {
                                    ...selectedPost,
                                    ...(detail as any),
                                    sourceId:
                                        (detail as any)?.sourceId ||
                                        selectedPost?.sourceId,
                                };
                                setPostDetail(mergedDetail);
                            } catch (err) {
                                console.error(
                                    "Error refreshing post detail:",
                                    err,
                                );
                            }
                        }
                    }}
                />
            )}

            <CustomerAlertDialog
                open={showDeleteDialog}
                setOpen={setShowDeleteDialog}
                title="Xác nhận xóa bài viết"
                subtitle="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                onSubmit={handleConfirmDelete}
            />
        </div>
    );
}

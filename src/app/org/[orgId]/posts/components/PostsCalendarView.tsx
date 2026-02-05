"use client";

import { useRouter } from "next/navigation";
import { PostData } from "./types";

interface PostsCalendarViewProps {
    posts: PostData[];
    orgId: string;
    onViewDetail: (post: PostData) => void;
    // We might need to know the selected month/year here to render the calendar correctly
    // But the current implementation seems to mock a 31-day month and filters posts by day match.
    // Ideally we should pass in the dates or month/year context.
    // Based on the code, it uses `new Date()` for current year/month in the filtering logic!
    // Wait, let's re-read the original code carefully.
    // line 1051: const currentDate = new Date();
    // It seems it only renders for the CURRENT month/year regardless of what is selected in the UI if it relies on new Date().
    // But the `posts` are filtered by API based on selected month.
    // However, the calendar day generation is `Array.from({ length: 31 })`.
    // And the filtering logic inside the map checks if post date matches `currentMonth` and `currentYear`.
    // This looks like a bug or limitation in the original code (it always shows current month's calendar days but maybe posts from other months won't show up if they don't match current month/year).
    // I will preserve the logic for now but I should probably pass the selected month/year if I want to fix it, or just copy as is.
    // The original code uses `selectedMonth` and `selectedYear` only for API fetching, but the render loop uses `new Date()`.
    // Let's pass selectedMonth and selectedYear to be safe and maybe fix it slightly or just use them if I can.
    // actually let's stick to the extracted logic first.
}

// I'll add selectedMonth and selectedYear props to make it correct if I can.
interface PostsCalendarViewProps {
    posts: PostData[];
    orgId: string;
    onViewDetail: (post: PostData) => void;
    selectedMonth: string;
    selectedYear: string;
}

export function PostsCalendarView({
    posts,
    orgId,
    onViewDetail,
    selectedMonth,
    selectedYear,
}: PostsCalendarViewProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header thứ trong tuần */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                {[
                    "Thứ 2",
                    "Thứ 3",
                    "Thứ 4",
                    "Thứ 5",
                    "Thứ 6",
                    "Thứ 7",
                    "CN",
                ].map((d) => (
                    <div
                        key={d}
                        className="py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Body lịch (mock tĩnh, giống HTML) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                <div className="grid grid-cols-7 auto-rows-fr min-h-full bg-white dark:bg-slate-900">
                    {/* Hai ngày cuối tháng trước */}
                    {[30, 31].map((d) => (
                        <div
                            key={`prev-${d}`}
                            className="min-h-[140px] border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-2 relative group"
                        >
                            <span className="text-slate-400 text-sm">{d}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/org/${orgId}/posts/create`);
                                }}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 shadow-sm"
                            >
                                <span className="material-icons text-sm">
                                    add
                                </span>
                            </button>
                        </div>
                    ))}

                    {/* Render posts từ API vào calendar */}
                    {Array.from({ length: 31 }).map((_, idx) => {
                        const day = idx + 1;
                        // Use passed props instead of new Date() to match the viewed data
                        const year = parseInt(selectedYear);
                        const month = parseInt(selectedMonth) - 1; // 0-indexed

                        // Tìm posts có scheduledTime hoặc publishedTime trong ngày này
                        const dayPosts = posts.filter((post) => {
                            if (!post.rawData) return false;

                            const scheduledTime = post.rawData.scheduledTime;
                            const publishedTime = post.rawData.publishedTime;
                            const timeToCheck = scheduledTime || publishedTime;

                            if (!timeToCheck) return false;

                            try {
                                const postDate = new Date(timeToCheck);
                                return (
                                    postDate.getDate() === day &&
                                    postDate.getMonth() === month &&
                                    postDate.getFullYear() === year
                                );
                            } catch {
                                return false;
                            }
                        });

                        return (
                            <div
                                key={`day-${day}`}
                                className="min-h-[140px] border-b border-r border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors relative group"
                            >
                                <span className="text-sm font-medium block mb-2">
                                    {day}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                            `/org/${orgId}/posts/create`
                                        );
                                    }}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 shadow-sm"
                                >
                                    <span className="material-icons text-sm">
                                        add
                                    </span>
                                </button>
                                {/* Render posts trong ngày này */}
                                {dayPosts.map((post) => {
                                    // Với status 1, 2, 3: click vào post sẽ chuyển qua trang edit
                                    const isEditable =
                                        post.rawData?.status &&
                                        [1, 2, 3].includes(post.rawData.status);

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
                                            className="relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer mb-2"
                                        >
                                            <div className="h-24 w-full relative bg-slate-100 dark:bg-slate-800">
                                                {post.thumbnail ? (
                                                    <img
                                                        alt="Thumbnail"
                                                        className="w-full h-full object-cover"
                                                        src={post.thumbnail}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800" />
                                                )}
                                            </div>
                                            <div className="p-2.5">
                                                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 mb-2 leading-tight">
                                                    {post.title}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                        <span
                                                            className={`material-icons ${post.channelColor} text-[16px]`}
                                                        >
                                                            {post.channelIcon}
                                                        </span>
                                                        {post.time !==
                                                            "--:--" && (
                                                            <span className="text-[10px] font-medium">
                                                                {post.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${post.statusClass} whitespace-nowrap`}
                                                    >
                                                        {post.statusLabel.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

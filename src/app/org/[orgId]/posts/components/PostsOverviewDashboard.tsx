import { postsApi } from "@/api/posts";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Dữ liệu mock cho dashboard tổng quan (fallback)
const defaultSummaryCards = [
    {
        label: "Tổng bài viết",
        value: "0",
        icon: "layers",
        iconBg: "bg-primary/10 text-primary",
        key: "totalPosts",
    },
    {
        label: "Đã lên lịch",
        value: "0",
        icon: "schedule",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        key: "scheduledPosts",
    },
    {
        label: "Đã đăng",
        value: "0",
        icon: "check_circle",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        key: "publishedPosts",
    },
    {
        label: "Lỗi đăng",
        value: "0",
        icon: "error_outline",
        iconBg: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
        key: "failedPosts",
    },
];

export function PostsOverviewDashboard() {
    const params = useParams();
    const orgId = params.orgId as string;
    const [currentDate] = useState(new Date());
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const { data: statisticsData } = useQuery<any>({
        queryKey: ["posts-statistics", orgId],
        queryFn: () => postsApi.getStatistics(orgId, {}),
        enabled: !!orgId,
    });

    const { data: upcomingPostsData } = useQuery<any>({
        queryKey: ["posts-today", orgId],
        queryFn: () => postsApi.postToday(orgId),
        enabled: !!orgId,
    });

    const { data: monthlyStatsData } = useQuery<any>({
        queryKey: [
            "posts-statistics-monthly",
            orgId,
            currentMonth,
            currentYear,
        ],
        queryFn: () =>
            postsApi.postStatisticsMonthly(orgId, {
                month: currentMonth,
                year: currentYear,
            }),
        enabled: !!orgId,
    });

    const statistics = statisticsData?.data || {};
    const lastUpdatedAt = statisticsData?.data?.lastUpdatedAt
        ? format(
              new Date(statisticsData.data.lastUpdatedAt),
              "HH:mm, dd/MM/yyyy"
          )
        : "";

    const summaryCards = defaultSummaryCards.map((card) => {
        const value =
            statistics[card.key] !== undefined ? statistics[card.key] : 0;
        return {
            ...card,
            value: value.toLocaleString(),
        };
    });

    // Transform upcoming posts
    const upcomingPosts = (upcomingPostsData?.data || []).map((post: any) => ({
        time: post.scheduledTime
            ? format(new Date(post.scheduledTime), "HH:mm")
            : "--:--",
        title: post.title || "Không có tiêu đề",
        description: post.content || "",
        channelName: post.channelName || "Facebook",
        channelIcon: "facebook", // Mặc định là facebook, cập nhật logic nếu cần
        channelColor: "text-blue-600",
        thumbnail: post.channelAvatar || "", // Dùng avatar kênh làm thumbnail tạm
        statusLabel: "Đã lên lịch", // API trả về status 4 -> Đã lên lịch
        statusColor:
            "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        statusDot: "bg-blue-600",
    }));

    // Transform monthly stats for chart
    const weeksData = monthlyStatsData?.data?.weeks || [];
    const chartData = weeksData.map((week: any) => ({
        name: `Tuần ${week.week}`,
        engagements: week.engagements,
        fullDate: `${week.startDate} - ${week.endDate}`,
    }));

    return (
        <>
            {/* Header */}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Tổng quan</h1>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {lastUpdatedAt
                            ? `Cập nhật mới nhất lúc: ${lastUpdatedAt}`
                            : "..."}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">
                        <span className="material-icons-outlined text-lg">
                            add
                        </span>
                        Tạo bài viết
                    </button>
                </div>
            </header>

            {/* Nội dung */}
            <div className="flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark">
                <div className="w-full space-y-6">
                    {/* Thống kê tổng quan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryCards.map((card) => (
                            <div
                                key={card.label}
                                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4"
                            >
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}
                                >
                                    <span className="material-icons-outlined text-2xl">
                                        {card.icon}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        {card.label}
                                    </p>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                        {card.value}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Biểu đồ + bảng bài viết sắp đăng */}
                    {/* Mỗi khối bên dưới chiếm full width, xếp dọc */}
                    <div className="flex flex-col gap-6">
                        {/* Hiệu quả tương tác */}
                        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                                        Hiệu quả tương tác (Tháng {currentMonth}
                                        /{currentYear})
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Tổng quan lượt tương tác theo tuần
                                    </p>
                                </div>
                            </div>
                            <div className="h-80 w-full relative">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={chartData}
                                            margin={{
                                                top: 20,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#E2E8F0"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: "#64748B" }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                tick={{ fill: "#64748B" }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    fill: "transparent",
                                                }}
                                                contentStyle={{
                                                    backgroundColor: "#FFF",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    boxShadow:
                                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                                }}
                                            />
                                            <Bar
                                                dataKey="engagements"
                                                fill="#5546FF"
                                                radius={[4, 4, 0, 0]}
                                                barSize={40}
                                                name="Tương tác"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full flex items-center justify-center h-full text-slate-400">
                                        Chưa có dữ liệu tương tác
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bài viết sắp đăng */}
                        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-slate-50">
                                    Bài viết sắp đăng (Hôm nay)
                                </h3>
                                <button className="text-sm text-primary hover:text-indigo-700 font-medium flex items-center gap-1">
                                    Xem tất cả
                                    <span className="material-icons-outlined text-base">
                                        arrow_forward
                                    </span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                                        <tr>
                                            <th className="px-6 py-3 rounded-tl-lg">
                                                Thời gian
                                            </th>
                                            <th className="px-6 py-3">
                                                Nội dung
                                            </th>
                                            <th className="px-6 py-3">Kênh</th>
                                            <th className="px-6 py-3 rounded-tr-lg">
                                                Trạng thái
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                        {upcomingPosts.length > 0 ? (
                                            upcomingPosts.map(
                                                (post: any, index: number) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50 whitespace-nowrap">
                                                            {post.time}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                                                    {post.thumbnail ? (
                                                                        <img
                                                                            src={
                                                                                post.thumbnail
                                                                            }
                                                                            alt="Preview"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                            <span className="material-icons text-sm">
                                                                                image
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="max-w-xs">
                                                                    <p className="font-medium truncate text-slate-900 dark:text-slate-50">
                                                                        {
                                                                            post.title
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                        {
                                                                            post.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`material-icons text-lg ${post.channelColor}`}
                                                                >
                                                                    {
                                                                        post.channelIcon
                                                                    }
                                                                </span>
                                                                <span className="text-slate-500 dark:text-slate-400">
                                                                    {
                                                                        post.channelName
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${post.statusColor}`}
                                                            >
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full ${post.statusDot}`}
                                                                />
                                                                {
                                                                    post.statusLabel
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                                                >
                                                    Không có bài viết nào sắp
                                                    đăng trong hôm nay
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

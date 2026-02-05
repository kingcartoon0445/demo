"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { postsApi } from "@/api/posts";
import toast from "react-hot-toast";

interface AutoCommentStats {
    totalCampaigns: number;
    running: number;
    completed: number;
    failed: number;
    pending: number;
}

interface AutoCommentCampaign {
    id: string;
    postId: string;
    postTitle: string;
    channelId: string;
    totalComments: number;
    totalAmount: number;
    sessionStatus: number;
    sessionStatusName: string;
    createdDate: string;
    // Add other fields if needed for display
}

interface PaginationState {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
}

export function SeedingDashboard() {
    const router = useRouter();
    const params = useParams();
    const orgId = params.orgId as string;

    const [stats, setStats] = useState<AutoCommentStats>({
        totalCampaigns: 0,
        running: 0,
        completed: 0,
        failed: 0,
        pending: 0
    });

    const [campaigns, setCampaigns] = useState<AutoCommentCampaign[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageNumber: 1,
        pageSize: 20,
        totalRecords: 0,
        totalPages: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchStats();
            fetchCampaigns(1);
        }
    }, [orgId]);

    const fetchStats = async () => {
        try {
            const res = await postsApi.getAutoCommentStats(orgId, {});
            if (res && res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchCampaigns = async (page: number) => {
        setIsLoading(true);
        try {
            const res = await postsApi.getAutoCommentList(orgId, {
                pageNumber: page,
                pageSize: 20
            });
            if (res && res.success) {
                setCampaigns(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Không thể tải danh sách chiến dịch");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCampaign = () => {
        router.push(`/org/${orgId}/posts/seeding/create`);
    };

    const handleEditCampaign = (campaignId: string) => {
        router.push(`/org/${orgId}/posts/seeding/edit/${campaignId}`);
    };

    const getStatusColor = (statusName: string) => {
        const status = statusName?.toLowerCase() || "";
        if (status === "pending") return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
        if (status === "running") return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        if (status === "completed") return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (status === "failed") return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        return "bg-gray-100 text-gray-700";
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            fetchCampaigns(newPage);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Seeding Overview</h1>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Quản lý các chiến dịch tương tác
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCreateCampaign}
                        className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                    >
                        <span className="material-icons-outlined text-lg">
                            add
                        </span>
                        Tạo chiến dịch Seeding
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-icons-outlined text-2xl">
                                    campaign
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Tổng chiến dịch
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.totalCampaigns}
                                </h3>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <span className="material-icons-outlined text-2xl">
                                    play_circle
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Đang chạy
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.running}
                                </h3>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                <span className="material-icons-outlined text-2xl">
                                    task_alt
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Hoàn thành
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.completed}
                                </h3>
                            </div>
                        </div>
                        {/* Pending Card instead of Failed? Or keep Failed and add Pending? User request showed Pending in stats. Let's stick to original layout but maybe fit Pending if needed. For now sticking to Failed + Total matching UI, but mapping data correctly. */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                <span className="material-icons-outlined text-2xl">
                                    cancel
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Thất bại
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.failed}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Campaigns Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                Các chiến dịch gần đây
                            </h3>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons-outlined text-gray-400 text-lg">
                                            search
                                        </span>
                                    </span>
                                    <input
                                        className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:ring-primary focus:border-primary w-64 text-gray-900 dark:text-white placeholder-gray-500"
                                        placeholder="Tìm kiếm chiến dịch..."
                                        type="text"
                                    />
                                </div>
                                <button className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                    <span className="material-icons-outlined">
                                        filter_list
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100/50 dark:bg-slate-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-lg">
                                            Tên chiến dịch
                                        </th>
                                        <th className="px-6 py-4">Kênh</th>
                                        {/* <th className="px-6 py-4">
                                            Preview bài viết
                                        </th> */}
                                        <th className="px-6 py-4 text-center">
                                            Số lượng comment
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Chi phí (Coin)
                                        </th>
                                        <th className="px-6 py-4">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 rounded-tr-lg text-center">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10">
                                                <div className="flex justify-center">
                                                    <span className="material-icons-outlined animate-spin text-primary text-2xl">rotate_right</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : campaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10 text-gray-500">
                                                Chưa có chiến dịch nào
                                            </td>
                                        </tr>
                                    ) : (
                                        campaigns.map((campaign) => (
                                        <tr
                                            key={campaign.id}
                                            className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {campaign.postTitle || "No Title"}
                                                <div className="text-xs text-gray-400 font-normal mt-0.5">{new Date(campaign.createdDate).toLocaleDateString('vi-VN')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`material-icons text-lg text-blue-600`}
                                                    >
                                                        facebook
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Facebook
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Preview Image Column Removed as API doesn't return image URL directly yet */}
                                            
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {campaign.totalComments}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                                {campaign.totalAmount?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.sessionStatusName)}`}
                                                >
                                                     {campaign.sessionStatusName === "Running" && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                                     )}
                                                    {campaign.sessionStatusName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button 
                                                        onClick={() => handleEditCampaign(campaign.id)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <span className="material-icons-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button className="text-gray-500 hover:text-primary transition-colors">
                                                        <span className="material-icons-outlined">
                                                            more_vert
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Hiển thị{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {(pagination.pageNumber - 1) * pagination.pageSize + 1}
                                </span>{" "}
                                đến{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalRecords)}
                                </span>{" "}
                                trong tổng số{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {pagination.totalRecords}
                                </span>{" "}
                                kết quả
                            </p>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                                    disabled={pagination.pageNumber <= 1}
                                    onClick={() => handlePageChange(pagination.pageNumber - 1)}
                                >
                                    Trước
                                </button>
                                <button
                                    className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                                    disabled={pagination.pageNumber >= pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.pageNumber + 1)}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

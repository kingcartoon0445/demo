"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { POST_STATUSES, ViewMode } from "./types";
import { DatePicker } from "../componentsWithHook/DatePicker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PostsFilterToolbarProps {
    orgId: string;
    viewMode: ViewMode;
    channels: any[];
    selectedChannelId: string | null;
    setSelectedChannelId: (id: string | null) => void;
    searchText: string;
    setSearchText: (text: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;

    selectedStatus: number | null;
    setSelectedStatus: (status: number | null) => void;
    canCreate?: boolean;
}

export function PostsFilterToolbar({
    orgId,
    viewMode,
    channels,
    selectedChannelId,
    setSelectedChannelId,
    searchText,
    setSearchText,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedStatus,
    setSelectedStatus,
    canCreate = true,
}: PostsFilterToolbarProps) {
    const router = useRouter();
    const [showChannelFilter, setShowChannelFilter] = useState(false);
    const [showStatusFilter, setShowStatusFilter] = useState(false);

    const channelFilterRef = useRef<HTMLDivElement>(null);
    const statusFilterRef = useRef<HTMLDivElement>(null);

    // Handle click outside filters
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                channelFilterRef.current &&
                !channelFilterRef.current.contains(event.target as Node)
            ) {
                setShowChannelFilter(false);
            }
            if (
                statusFilterRef.current &&
                !statusFilterRef.current.contains(event.target as Node)
            ) {
                setShowStatusFilter(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="h-14 flex items-center justify-between px-6 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div
                    className="relative hidden md:block"
                    ref={channelFilterRef}
                >
                    <button
                        onClick={() => setShowChannelFilter(!showChannelFilter)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedChannelId
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
                        }`}
                    >
                        <span className="material-icons-outlined text-lg">
                            filter_alt
                        </span>
                        {selectedChannelId
                            ? channels.find((c) => c.uid === selectedChannelId)
                                  ?.name || "Lọc theo kênh"
                            : "Lọc theo kênh"}
                        <span className="material-icons-outlined text-sm">
                            expand_more
                        </span>
                    </button>

                    {/* Channel Filter Dropdown */}
                    {showChannelFilter && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                            <div className="p-2 max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setSelectedChannelId(null);
                                        setShowChannelFilter(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                                        !selectedChannelId
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                                >
                                    <span className="material-icons-outlined text-lg">
                                        grid_view
                                    </span>
                                    Tất cả kênh
                                </button>

                                {channels.map((channel) => (
                                    <button
                                        key={channel.uid}
                                        onClick={() => {
                                            setSelectedChannelId(channel.uid);
                                            setShowChannelFilter(false);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm mt-1 ${
                                            selectedChannelId === channel.uid
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        }`}
                                    >
                                        {channel.avatar ? (
                                            <img
                                                src={channel.avatar}
                                                alt={channel.name}
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                                                {channel.name?.charAt(0)}
                                            </div>
                                        )}
                                        <span className="truncate flex-1 text-left">
                                            {channel.name}
                                        </span>
                                    </button>
                                ))}

                                {channels.length === 0 && (
                                    <div className="text-center py-4 text-xs text-slate-500">
                                        Chưa có kênh nào được kết nối
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
                <div className="relative flex-1 md:flex-none">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-[18px]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài viết..."
                        className="pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary rounded-md text-sm w-full md:w-64"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-3 hidden lg:flex">
                {/* Nếu là calendar view thì hiện chọn Tháng/Năm, ngược lại hiện chọn khoảng ngày */}
                {viewMode === "calendar" ? (
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedMonth}
                            onValueChange={setSelectedMonth}
                        >
                            <SelectTrigger className="w-[120px] bg-white dark:bg-slate-800">
                                <SelectValue placeholder="Tháng" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem
                                        key={i + 1}
                                        value={(i + 1).toString()}
                                    >
                                        Tháng {i + 1}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}
                        >
                            <SelectTrigger className="w-[100px] bg-white dark:bg-slate-800">
                                <SelectValue placeholder="Năm" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => {
                                    const year =
                                        new Date().getFullYear() - 5 + i;
                                    return (
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                        >
                                            {year}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            placeholder="Từ ngày"
                            className="w-32"
                        />
                        <span className="text-slate-400">-</span>
                        <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            placeholder="Đến ngày"
                            className="w-32"
                        />
                    </div>
                )}
                <div className="relative" ref={statusFilterRef}>
                    <button
                        onClick={() => setShowStatusFilter(!showStatusFilter)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedStatus
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
                        }`}
                    >
                        <span className="material-icons-outlined text-lg">
                            filter_list
                        </span>
                        {selectedStatus
                            ? POST_STATUSES.find(
                                  (s) => s.value === selectedStatus
                              )?.label
                            : "Lọc theo trạng thái"}
                        <span className="material-icons-outlined text-sm">
                            expand_more
                        </span>
                    </button>

                    {/* Status Filter Dropdown */}
                    {showStatusFilter && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setSelectedStatus(null);
                                        setShowStatusFilter(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                                        !selectedStatus
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                                >
                                    <span className="material-icons-outlined text-lg">
                                        grid_view
                                    </span>
                                    Tất cả trạng thái
                                </button>

                                {POST_STATUSES.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => {
                                            setSelectedStatus(status.value);
                                            setShowStatusFilter(false);
                                        }}
                                        className={`w-full flex items-start gap-2 px-3 py-2 rounded-md transition-colors text-sm mt-1 group ${
                                            selectedStatus === status.value
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        }`}
                                    >
                                        <div className="flex-1 text-left">
                                            <div className="font-medium mb-0.5">
                                                {status.label}
                                            </div>
                                            <div
                                                className={`text-xs ${
                                                    selectedStatus ===
                                                    status.value
                                                        ? "text-primary/70"
                                                        : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-400"
                                                }`}
                                            >
                                                {status.description}
                                            </div>
                                        </div>
                                        {selectedStatus === status.value && (
                                            <span className="material-icons-outlined text-base">
                                                check
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 ml-2" />
                {canCreate && (
                    <button
                        onClick={() =>
                            router.push(`/org/${orgId}/posts/create`)
                        }
                        className="flex items-center gap-2 bg-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
                    >
                        <span className="material-icons-outlined text-lg">
                            add
                        </span>
                        Thêm bài viết
                    </button>
                )}
            </div>
        </div>
    );
}

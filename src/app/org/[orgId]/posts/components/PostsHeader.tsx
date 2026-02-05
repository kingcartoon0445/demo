"use client";

import { ViewMode } from "./types";

interface PostsHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

export function PostsHeader({ viewMode, setViewMode }: PostsHeaderProps) {
    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold hidden sm:block">
                        Bài đăng
                    </h1>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                                viewMode === "list"
                                    ? "bg-white dark:bg-slate-900 shadow-sm text-primary"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                        >
                            <span className="material-icons-outlined text-sm">
                                list
                            </span>
                            Danh sách
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                                viewMode === "grid"
                                    ? "bg-white dark:bg-slate-900 shadow-sm text-primary"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                        >
                            <span className="material-icons-outlined text-sm">
                                grid_view
                            </span>
                            Lưới
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("calendar")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                                viewMode === "calendar"
                                    ? "bg-white dark:bg-slate-900 shadow-sm text-primary"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                            }`}
                        >
                            <span className="material-icons-outlined text-sm">
                                calendar_month
                            </span>
                            Lịch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

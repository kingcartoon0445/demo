"use client";

// UI mock cho màn "Thư viện Media" dựa theo media_library_with_storage_management_1/code.html

export function MediaLibraryContent() {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Header nội bộ */}
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Thư viện</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 material-icons-outlined text-[20px]">
                            search
                        </span>
                        <input
                            className="pl-10 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-slate-50"
                            placeholder="Tìm kiếm file..."
                            type="text"
                        />
                    </div>
                </div>
            </header>

            {/* Nội dung chính */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Breadcrumb + nút hành động */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="hover:text-primary cursor-pointer">
                            Thư viện
                        </span>
                        <span className="material-icons-outlined text-base">
                            chevron_right
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                            Tất cả media
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-slate-50 shadow-sm">
                            <span className="material-icons-outlined text-lg">
                                create_new_folder
                            </span>
                            Tạo thư mục
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                            <span className="material-icons-outlined text-lg">
                                cloud_upload
                            </span>
                            Tải lên
                        </button>
                    </div>
                </div>

                {/* Card dung lượng lưu trữ */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-xl">
                                cloud_queue
                            </span>
                            <h3 className="font-medium text-sm">
                                Dung lượng lưu trữ
                            </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            1.2GB / 5GB
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: "24%" }}
                        />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Hình ảnh (800MB)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Video (350MB)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Khác (50MB)
                        </span>
                    </div>
                </div>

                {/* Filter loại file + nút view toggle */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                            Tất cả
                        </button>
                        <button className="px-3 py-1.5 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm border border-transparent">
                            Hình ảnh
                        </button>
                        <button className="px-3 py-1.5 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm border border-transparent">
                            Video
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Dạng lưới"
                        >
                            <span className="material-icons-outlined">
                                grid_view
                            </span>
                        </button>
                        <button
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            title="Dạng danh sách"
                        >
                            <span className="material-icons-outlined">
                                view_list
                            </span>
                        </button>
                    </div>
                </div>

                {/* Thư mục */}
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                    Thư mục
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    {[
                        { name: "Sản phẩm mới", count: "12 files" },
                        { name: "Campaign Tháng 10", count: "45 files" },
                        { name: "Video Reviews", count: "8 files" },
                    ].map((folder) => (
                        <div
                            key={folder.name}
                            className="group relative bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary cursor-pointer transition-all hover:shadow-md"
                        >
                            <div className="flex justify-between items-start">
                                <span className="material-icons text-4xl text-yellow-400">
                                    folder
                                </span>
                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-opacity">
                                    <span className="material-icons-outlined text-lg">
                                        more_vert
                                    </span>
                                </button>
                            </div>
                            <div className="mt-2">
                                <p className="font-medium text-sm truncate">
                                    {folder.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {folder.count}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gần đây */}
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                    Gần đây
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Ảnh sản phẩm 1 */}
                    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                            <img
                                alt="Nike Shoe"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTur_3p82VClQpQgoplNm4Kwe9k9Lev8pJwje9hyuYFQokjuAi8408LZbYXWxbjBb4H28N9CHs3oH17kSO632Jcm2EMVooFBYJquyQR2Kp78ieTAeuAIYgbo7WfeJhlHyVsox-7HiE9XYk9HbwLG8PUrpNMuuSE4dzmMd-MiTZwp_EnvF7m5UuyOMhDm4iGLxgQyxZ6XiKMW2x5ytC21CgJUJfDVO0eWgv9bxa2GLHYFeZYJURq_aHDKIKyD61SUS5DjeA2mufjjq4"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white hover:text-primary shadow-sm"
                                    title="Xem trước"
                                >
                                    <span className="material-icons-outlined text-lg">
                                        visibility
                                    </span>
                                </button>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                    type="checkbox"
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <p
                                    className="text-sm font-medium truncate pr-2"
                                    title="nike_red_product.jpg"
                                >
                                    nike_red_product.jpg
                                </p>
                                <div className="relative group/menu">
                                    <button className="text-slate-500 dark:text-slate-400 hover:text-primary">
                                        <span className="material-icons-outlined text-lg">
                                            more_horiz
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>JPG</span>
                                <span>2.4 MB</span>
                            </div>
                        </div>
                    </div>

                    {/* Ảnh collection summer */}
                    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                            <img
                                alt="Sneakers collection"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG-H54aQXfCQiOhKbHzzpbYm-WMqGhjT5oE5HyLBr_T4x4s2pKOCcZVmIlaxTfBfPy_2ADn3AV3CI5j6lW1FM-xNog3Ehg-BI6vJu3g-5J_Oh3PXRMCk_nyeJYTpQcFApr8Wf3GlNn9PLMRLIHbGMAeUhkeZeRHzD5LAiHd_hetHYxTLPei3PzgqTrFyGW9H539su-3HL3G0cVYWCgYykkZEHU0_Ub2S7-Kbz-f0kEx2FbIq0U6xkMyV7fdYo8MLAx0f_f0Q1Kzsmh"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white hover:text-primary shadow-sm">
                                    <span className="material-icons-outlined text-lg">
                                        visibility
                                    </span>
                                </button>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                    type="checkbox"
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium truncate pr-2">
                                    collection_summer.png
                                </p>
                                <button className="text-slate-500 dark:text-slate-400 hover:text-primary">
                                    <span className="material-icons-outlined text-lg">
                                        more_horiz
                                    </span>
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>PNG</span>
                                <span>4.1 MB</span>
                            </div>
                        </div>
                    </div>

                    {/* Video intro */}
                    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-square bg-slate-800 relative flex items-center justify-center">
                            <img
                                alt="Landscape video"
                                className="w-full h-full object-cover opacity-60"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1-Xhkyu4IuTyC6CijmIy4V4txON4SR9TqMhoy67FwXk9SEDaInArg9iHQx592jEa63HikysMu46x3nsAgZl__C884lfOTsPxqPEbJn0NQLIXTxOnkKihIuGvrWVHfXY2DbUf3mIGi1n19YJJr5hKEvTn9HFZBcgwSfGvBT4oi33yUoLBHbXfrTw3pAdVXeqk5PoojiuP2SAL0VLk3p_O8JSOh5Kv1URAy7FEfze1VW-vuG8OLRCt-UdRGRtSS3KEvGMpn3xHwKkyr"
                            />
                            <span className="material-icons text-white text-4xl absolute drop-shadow-lg">
                                play_circle_outline
                            </span>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                00:34
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                    type="checkbox"
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium truncate pr-2">
                                    intro_video.mp4
                                </p>
                                <button className="text-slate-500 dark:text-slate-400 hover:text-primary">
                                    <span className="material-icons-outlined text-lg">
                                        more_horiz
                                    </span>
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>MP4</span>
                                <span>15.2 MB</span>
                            </div>
                        </div>
                    </div>

                    {/* File PDF */}
                    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-square bg-purple-50 dark:bg-slate-800 relative flex items-center justify-center text-primary">
                            <span className="material-icons text-6xl opacity-50">
                                description
                            </span>
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white hover:text-primary shadow-sm">
                                    <span className="material-icons-outlined text-lg">
                                        download
                                    </span>
                                </button>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                    type="checkbox"
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium truncate pr-2">
                                    brief_content_v2.pdf
                                </p>
                                <button className="text-slate-500 dark:text-slate-400 hover:text-primary">
                                    <span className="material-icons-outlined text-lg">
                                        more_horiz
                                    </span>
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>PDF</span>
                                <span>1.2 MB</span>
                            </div>
                        </div>
                    </div>

                    {/* Ảnh đồng hồ */}
                    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                            <img
                                alt="Watch product"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0BoA_z36YRlj_E0P5nCYrimzIFSoJOZchiJOFq9L_4BOUpMeIsOealcEGrDsgzf68HF5d3tPQlRijyHB3G8LEr93zouM5eaA2uJW03xcSjqpTEgq59gLYXRTdRe_Lfjhwq6KDqEwzYWrR3fTGaCoG4dQEnbi6hey1Jp5ZwlH3-fQNb915ufaUKUyAU8JzkRxTha5C-zQ6dBI8Ojn81E2BQfJ9rRIEKZn6r1CRQfWH2YWx5aEwyE1ufHvVemLhYGag1Uo_P1q7zarx"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button className="p-2 bg-white/90 text-slate-800 rounded-full hover:bg-white hover:text-primary shadow-sm">
                                    <span className="material-icons-outlined text-lg">
                                        visibility
                                    </span>
                                </button>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                    type="checkbox"
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium truncate pr-2">
                                    watch_detail_01.jpg
                                </p>
                                <button className="text-slate-500 dark:text-slate-400 hover:text-primary">
                                    <span className="material-icons-outlined text-lg">
                                        more_horiz
                                    </span>
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>JPG</span>
                                <span>1.8 MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary font-medium flex items-center gap-1 transition-colors">
                        Xem thêm file
                        <span className="material-icons-outlined text-base">
                            expand_more
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}



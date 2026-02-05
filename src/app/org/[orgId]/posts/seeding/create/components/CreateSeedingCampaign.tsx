"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getFacebookMessageConnection } from "@/api/leadV2";
import { postsApi } from "@/api/posts";
import toast from "react-hot-toast";

interface FacebookPage {
    id: string;
    uid: string;
    title: string;
    name: string;
    avatar: string;
    status: number;
}

interface PostData {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelIcon: string;
    channelColor: string;
    date: string;
    time: string;
    status: number;
    channelName?: string;
    channelAvatar?: string;
    rawData?: any;
}

export default function CreateSeedingCampaign() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("id");
    const orgId = params.orgId as string;

    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [isLoadingPages, setIsLoadingPages] = useState(false);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

    // Step 2 State
    const [posts, setPosts] = useState<PostData[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [searchPostQuery, setSearchPostQuery] = useState("");
    const [postUrl, setPostUrl] = useState("");

    // Step 3 State
    const [manualComments, setManualComments] = useState("");
    const [startTime, setStartTime] = useState("");
    const [intervalTime, setIntervalTime] = useState(60); // Seconds
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load Pages on Mount
    useEffect(() => {
        if (orgId) {
            loadPages();
            if (campaignId) {
                loadCampaign(campaignId);
            }
        }
    }, [orgId, campaignId]);

    // Load Posts when entering Step 2
    useEffect(() => {
        if (step === 2 && selectedPageId) {
            loadPosts();
        }
    }, [step, selectedPageId]);

    // Initial StartTime default to now
    useEffect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setStartTime(now.toISOString().slice(0, 16));
    }, []);

    const loadCampaign = async (id: string) => {
        try {
            const res = await postsApi.getAutoCommentDetail(orgId, id);
            if (res && res.success) {
                const data = res.data; 
                const item = Array.isArray(data) ? data[0] : data;
                 
                 if (item) {
                     let channelId = item.channelId;
                     const postId = item.postId;

                     setManualComments((item.keywords || []).join(" | "));
                     if (item.scheduledTime) {
                         const date = new Date(item.scheduledTime);
                         const offsetMs = date.getTimezoneOffset() * 60 * 1000;
                         const localISOTime = (new Date(date.getTime() - offsetMs)).toISOString().slice(0, 16);
                         setStartTime(localISOTime);
                     }
                     if (item.delayBetweenComments) {
                         setIntervalTime(item.delayBetweenComments);
                     }

                     if (postId) {
                         setSelectedPostId(String(postId));
                         try {
                             const postRes: any = await postsApi.getPost(orgId, String(postId));
                             const pData = postRes.data || postRes.content || postRes;
                             if (pData) {
                                 setPosts([transformPostData(pData)]);
                                 if (!channelId) {
                                     channelId = pData.channelId || pData.channel?.id || pData.pageId;
                                 }
                             }
                         } catch (e) {
                             console.error("Error fetching post details", e);
                         }
                     }

                     if (channelId) {
                         setSelectedPageId(String(channelId));
                     }

                     if (channelId && postId) {
                        setStep(3);
                     } else if (channelId) {
                        setStep(2);
                     }
                 }
            }
        } catch (error) {
            console.error("Error loading campaign:", error);
            toast.error("Không thể tải thông tin chiến dịch");
        }
    };

    const loadPages = async () => {
        setIsLoadingPages(true);
        try {
            const response = await getFacebookMessageConnection(orgId);
            if (response.code === 0 && response.content) {
                setPages(response.content);
            }
        } catch (error) {
            console.error("Error loading Facebook pages:", error);
            toast.error("Không thể tải danh sách Fanpage");
        } finally {
            setIsLoadingPages(false);
        }
    };

    const loadPosts = async () => {
        setIsLoadingPosts(true);
        try {
            // Using logic from PostsScheduleContent.tsx but adding channelId filter
            const response = await postsApi.getPosts(orgId, {
                 page: 1, 
                 pageSize: 50,
                 channelId: selectedPageId || undefined // Filtering by selected page
            });

            let postsData: any[] = [];
            if (Array.isArray(response)) {
                postsData = response;
            } else if (response.data && Array.isArray(response.data)) {
                postsData = response.data;
            } else if (response.content && Array.isArray(response.content)) {
                postsData = response.content;
            } else if (response.items && Array.isArray(response.items)) {
                postsData = response.items;
            }

            const transformedPosts = postsData.map(transformPostData);
            setPosts(transformedPosts);
        } catch (error) {
            console.error("Error loading posts:", error);
            toast.error("Không thể tải danh sách bài viết");
        } finally {
            setIsLoadingPosts(false);
        }
    };

    function transformPostData(post: any): PostData {
            let thumbnail = "";
            try {
                const mediaData = JSON.parse(post.externalMediaData || "[]");
                if (Array.isArray(mediaData) && mediaData.length > 0) {
                    thumbnail = mediaData[0]?.url || "";
                }
            } catch {
                thumbnail = "";
            }

            const dateObj = new Date(post.scheduledTime || post.publishedTime || post.createdTime);
            
            return {
                id: post.id,
                title: post.title || "No Title",
                description: post.content || "",
                thumbnail: thumbnail || post.channelAvatar || "",
                channelIcon: "facebook", // Assuming FB for now based on context
                channelColor: "text-blue-600",
                date: dateObj.toLocaleDateString('vi-VN'),
                time: dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
                status: post.status,
                channelName: post.channelName,
                channelAvatar: post.channelAvatar,
                rawData: post
            };
    };

    const handleSelectPage = (pageUid: string) => {
        if (selectedPageId !== pageUid) {
            setSelectedPageId(pageUid);
            setSelectedPostId(null);
            setPosts([]);
        }
    };

    const handleSelectPost = (postId: string) => {
        setSelectedPostId(postId);
    };

    const handleContinue = async () => {
        if (step === 1) {
            if (!selectedPageId) return;
            setStep(2);
        } else if (step === 2) {
             if (!selectedPostId) {
                toast.error("Vui lòng chọn bài viết");
                return;
             }
             setStep(3);
        } else if (step === 3) {
             const comments = manualComments.split('|').map(c => c.trim()).filter(c => c);
             if (comments.length < 5) {
                 toast.error("Vui lòng nhập ít nhất 5 nội dung bình luận");
                 return;
             }
             if (!startTime) {
                 toast.error("Vui lòng chọn thời gian bắt đầu");
                 return;
             }
             const interval = Number(intervalTime);
             if (isNaN(interval) || interval < 1) {
                 toast.error("Thời gian giãn cách phải lớn hơn 0");
                 return;
             }
             // Submit Logic Here
             setIsSubmitting(true);
             try {
                 const payload = {
                     postId: selectedPostId,
                     keywords: comments,
                     unitPrice: 0,
                     scheduledTime: new Date(startTime).toISOString(),
                     delayBetweenComments: interval
                 };
                 
                 let response;
                 if (campaignId) {
                     response = await postsApi.updateAutoComment(orgId, campaignId, payload);
                     if (response) {
                         toast.success("Cập nhật chiến dịch thành công");
                     } else {
                         throw new Error("Update failed");
                     }
                 } else {
                     response = await postsApi.createAutoComment(orgId, payload);
                     if (response) {
                         toast.success("Tạo chiến dịch thành công");
                     } else {
                         throw new Error("Create failed");
                     }
                 }
                 
                 router.push(`/org/${orgId}/posts/seeding`);
             } catch (error) {
                 console.error(error);
                 toast.error(campaignId ? "Cập nhật thất bại" : "Có lỗi xảy ra khi tạo chiến dịch");
             } finally {
                 setIsSubmitting(false);
             }
        }
    };

    const handleBack = () => {
        if (step === 1) {
            router.push(`/org/${orgId}/posts/seeding`);
        } else if (step === 2) {
            setStep(1);
        } else if (step === 3) {
            setStep(2);
        }
    };

    const renderStep1 = () => (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Chọn Page để Seeding
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Vui lòng chọn một Fanpage đã kết nối để thực hiện chiến dịch.
                    </p>
                </div>
                <div className="p-6 flex-1 bg-gray-50 dark:bg-gray-900/50">
                    {isLoadingPages ? (
                        <div className="flex justify-center items-center h-40">
                            <span className="material-icons-outlined animate-spin text-primary text-3xl">
                                rotate_right
                            </span>
                        </div>
                    ) : pages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <span className="material-icons-outlined text-4xl mb-2">
                                info
                            </span>
                            <p>Chưa có Fanpage nào được kết nối.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pages.map((page) => {
                                const isSelected = String(selectedPageId) === String(page.uid);
                                return (
                                    <div
                                        key={page.uid}
                                        className="relative group cursor-pointer"
                                        onClick={() => handleSelectPage(page.uid)}
                                    >
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/5 border-2 border-primary rounded-xl z-10 pointer-events-none transition-all">
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                                                    <span className="material-icons text-sm">
                                                        check
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {!isSelected && (
                                            <div className="absolute inset-0 border-2 border-transparent hover:border-primary/50 rounded-xl z-10 pointer-events-none transition-colors"></div>
                                        )}
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex items-center gap-4 transition-all">
                                            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                                {page.avatar ? (
                                                    <img
                                                        alt={page.name}
                                                        className="w-full h-full object-cover"
                                                        src={page.avatar}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl">
                                                        {page.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {page.name || page.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                        Đã kết nối
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                                    ID: {page.uid}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
        </div>
    );

    const renderStep2 = () => (
         <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pb-20">
            <div className="lg:col-span-3 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/20 dark:bg-slate-800/20">
                     <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        1. Chọn từ bài viết có sẵn
                    </h3>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-icons-outlined text-gray-400">search</span>
                            </span>
                            <input
                                value={searchPostQuery}
                                onChange={(e) => setSearchPostQuery(e.target.value)}
                                className="pl-10 w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary placeholder-gray-400"
                                placeholder="Tìm kiếm theo tên bài viết..."
                                type="text"
                            />
                        </div>
                         <div className="relative">
                            <button className="flex items-center gap-2 h-full px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400 text-sm font-medium">
                                <span className="material-icons-outlined text-lg">filter_list</span>
                                Lọc
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-gray-50 dark:bg-slate-900/30 max-h-[600px]">
                     {isLoadingPosts ? (
                        <div className="flex justify-center items-center h-40">
                             <span className="material-icons-outlined animate-spin text-primary text-3xl">rotate_right</span>
                        </div>
                     ) : posts.length === 0 ? (
                        <div className="flex justify-center items-center h-40 text-gray-500">
                            Không tìm thấy bài viết nào
                        </div>
                     ) : (
                        posts.filter(post => post.title.toLowerCase().includes(searchPostQuery.toLowerCase())).map(post => {
                            const isSelected = selectedPostId === post.id;
                            return (
                                <label 
                                    key={post.id}
                                    className={`group relative flex gap-4 p-4 rounded-xl border ${isSelected ? 'border-2 border-primary shadow-md shadow-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md'} bg-white dark:bg-slate-900 cursor-pointer transition-all`}
                                    onClick={() => handleSelectPost(post.id)}
                                >
                                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-slate-800 ring-1 ring-black/5">
                                        {post.thumbnail ? (
                                             <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={post.thumbnail} alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                 <span className="material-icons">image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white leading-snug">
                                                    {post.title}
                                                </h4>
                                                <div className="relative flex items-center justify-center w-5 h-5">
                                                     <input 
                                                        checked={isSelected}
                                                        readOnly
                                                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-primary checked:border-4 transition-all" 
                                                        type="radio" 
                                                        name="post_select"
                                                     />
                                                     <div className="absolute w-2.5 h-2.5 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                {post.description}
                                            </p>
                                        </div>
                                         <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                                            <div className={`flex items-center gap-1.5 ${post.channelColor} bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded`}>
                                                <span className="material-icons text-sm">{post.channelIcon}</span>
                                                <span className="font-medium">Facebook</span>
                                            </div>
                                            <span className="flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm">calendar_today</span>
                                                {post.date}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            );
                        })
                     )}
                </div>
                 {/* Pagination - Placeholder */}
                <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-slate-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hiển thị {posts.length} bài viết</p>
                     <div className="flex gap-1">
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30" disabled>
                            <span className="material-icons-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500">
                             <span className="material-icons-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* <div className="lg:col-span-1">
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sticky top-0">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        2. Hoặc nhập URL
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                        Nếu bài viết không có trong danh sách, hãy dán đường dẫn trực tiếp tại đây để hệ thống tự động tìm kiếm.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL bài viết</label>
                            <div className="relative group">
                                <input 
                                    value={postUrl}
                                    onChange={(e) => setPostUrl(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary pr-10 py-2.5 transition-shadow group-hover:shadow-sm" 
                                    placeholder="https://facebook.com/..." 
                                    type="text"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <button className="p-1 text-gray-400 hover:text-primary rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" title="Paste">
                                        <span className="material-icons-outlined text-lg">content_paste</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                         <button className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white font-medium rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                            Kiểm tra liên kết
                        </button>
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                                    <span className="material-icons-outlined text-base">tips_and_updates</span>
                                </div>
                                <div>
                                    <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Hỗ trợ đa nền tảng</h5>
                                    <p className="text-xs text-blue-700 dark:text-blue-400/80 leading-relaxed">
                                        Hệ thống hỗ trợ các link từ Facebook, Instagram, TikTok và Website. Đảm bảo link ở chế độ công khai.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
         </div>
    );

    const renderStep3 = () => {
        const commentsList = manualComments.split('|').map(c => c.trim()).filter(c => c);

        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 flex flex-col min-h-0">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-0">
                    <nav aria-label="Tabs" className="-mb-px flex space-x-8">
                        <button className="border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
                            <span className="material-icons-outlined text-lg">edit</span>
                            Nhập thủ công
                        </button>
                        {/* <button className="border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 cursor-not-allowed opacity-50">
                            <span className="material-icons-outlined text-lg">upload_file</span>
                            Import
                        </button>
                        <button className="border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 cursor-not-allowed opacity-50">
                            <span className="material-symbols-outlined text-lg">auto_awesome</span>
                            AI gợi ý
                        </button> */}
                    </nav>
                </div>
                <div className="p-6 flex-1 flex flex-col lg:flex-row gap-8 overflow-y-auto custom-scrollbar">
                    <div className="w-full lg:w-1/3 space-y-5">
                         <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                             <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Cấu hình thời gian</h4>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian bắt đầu</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giãn cách (giây)</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary"
                                    value={intervalTime}
                                    onChange={(e) => setIntervalTime(Number(e.target.value))}
                                />
                             </div>
                         </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nội dung comments (ngăn cách bằng dấu |)
                            </label>
                            <textarea 
                                className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-sm focus:ring-primary focus:border-primary placeholder-gray-400 h-60" 
                                placeholder="Nhập comment 1 | Nhập comment 2 | Nhập comment 3..." 
                                value={manualComments}
                                onChange={(e) => setManualComments(e.target.value)}
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-2">
                                Ví dụ: Bài viết hay quá | Cảm ơn shop | Ib mình nhé
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full lg:w-2/3 border-l-0 lg:border-l border-gray-200 dark:border-gray-700 pl-0 lg:pl-8 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Danh sách comment <span className="text-gray-500 font-normal text-sm">({commentsList.length} đã tạo)</span></h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {commentsList.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">
                                    Chưa có bình luận nào. Hãy nhập nội dung bên trái.
                                </div>
                            ) : (
                                commentsList.map((comment, index) => (
                                    <div key={index} className="group flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 dark:text-white">{comment}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
            <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-10 sticky top-0 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Tạo chiến dịch Seeding
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                     {/* Placeholder user or back */}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-8 flex flex-col h-full">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-center mb-8 flex-shrink-0">
                        <div className="flex items-center w-full max-w-lg">
                            <div className="flex items-center relative z-10">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 text-gray-500'} font-bold text-sm shadow-md`}>
                                     {step > 1 ? <span className="material-icons-outlined text-base">check</span> : '1'}
                                </div>
                                <span className={`ml-2 text-sm font-bold ${step >= 1 ? 'text-primary' : 'text-gray-500'}`}>
                                    Chọn Page
                                </span>
                            </div>
                            <div className={`flex-1 h-0.5 mx-4 ${step > 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                            <div className="flex items-center relative z-10">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'} font-bold text-sm`}>
                                     {step > 2 ? <span className="material-icons-outlined text-base">check</span> : '2'}
                                </div>
                                <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                    Chọn bài viết
                                </span>
                            </div>
                            <div className={`flex-1 h-0.5 mx-4 ${step > 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                            <div className="flex items-center relative z-10">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'} font-bold text-sm`}>
                                    3
                                </div>
                                <span className={`ml-2 text-sm font-medium ${step >= 3 ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                    Cấu hình
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    
                    {/* Actions Footer - Floating for Step 2 if content is long, but sticking to bottom of container for now */}
                     <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 flex justify-between items-center rounded-b-xl -mt-6 z-20 sticky bottom-0 border-x border-b">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-icons-outlined text-lg">
                                    arrow_back
                                </span>
                                Quay lại
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={
                                    (step === 1 && !selectedPageId) || 
                                    (step === 2 && !selectedPostId) ||
                                    isSubmitting
                                }
                                className={`flex items-center gap-2 px-6 py-2.5 text-white font-medium rounded-lg shadow-lg shadow-primary/30 transition-colors ${
                                    ((step === 1 && selectedPageId) || (step === 2 && selectedPostId) || step === 3) && !isSubmitting
                                        ? "bg-primary hover:bg-indigo-600"
                                        : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none"
                                }`}
                            >
                                {isSubmitting ? "Đang xử lý..." : (step === 3 ? "Hoàn tất" : "Tiếp tục")}
                                {!isSubmitting && (
                                    <span className="material-icons-outlined text-lg">
                                        {step === 3 ? "check" : "arrow_forward"}
                                    </span>
                                )}
                            </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

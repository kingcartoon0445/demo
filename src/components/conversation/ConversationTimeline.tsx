"use client";

import ImageDisplay from "@/components/ImageDisplay";
import { Button } from "@/components/ui/button";
import {
    type ChatMessage,
    type Conversation,
    useGetDetailConversation,
    useInfiniteChatList,
    useSendMessage,
} from "@/hooks/useConversation";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import {
    CheckCheck,
    File as FileIcon,
    Image as ImageIcon,
    Loader2,
    MoreVertical,
    PanelRight,
    Paperclip,
    Plus,
    ChevronRight,
    Send,
    Smile,
} from "lucide-react";
import React, {
    ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "react-hot-toast";
import { IoMdSend } from "react-icons/io";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
// @ts-ignore – emoji-mart types may not be installed
import data from "@emoji-mart/data";
// @ts-ignore – emoji-mart types may not be installed
import { firebaseDb } from "@/lib/firebase";
import Picker from "@emoji-mart/react";
import { Fancybox } from "@fancyapps/ui";
import { useQueryClient } from "@tanstack/react-query";
import { onChildAdded, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import Avatar from "react-avatar";
import Loading from "../common/Loading";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConversationTimelineProps {
    conversation: Conversation | null;
    orgId: string;
    onShowConversationDetail?: () => void;
}

const ChatMessageItemComponent = ({
    message,
    conversation,
}: {
    message: ChatMessage;
    conversation: Conversation;
}) => {
    const { t } = useLanguage();
    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();

            const isSameDay =
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();

            if (isSameDay) {
                return date.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            }

            return date.toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    };

    const isOutgoing = message.isPageReply;

    // Attachments logic
    let attachmentItems: Array<{ type: string; payload: any }> = [];
    const rawAtt = (message as any).attachments;
    if (rawAtt) {
        if (typeof rawAtt === "string") {
            try {
                attachmentItems = JSON.parse(rawAtt);
            } catch {}
        } else if (Array.isArray(rawAtt)) {
            attachmentItems = rawAtt;
        }
    }

    const STICKER_PATH = "/api/emoticon/oasticker";
    if (message.message && message.message.includes(STICKER_PATH)) {
        attachmentItems.push({
            type: "image",
            payload: { url: message.message },
        });
        message = { ...message, message: "" } as ChatMessage;
    }

    const isImageUrl = (url: string) =>
        /\.(jpg|jpeg|png|gif|webp|bmp|heic|avif)$/i.test(url);

    attachmentItems = attachmentItems.map((att) => {
        if (
            att.type === "file" &&
            att.payload?.url &&
            isImageUrl(att.payload.url)
        ) {
            return {
                ...att,
                type: "image",
            };
        }
        return att;
    });

    const renderAttachment = (att: any) => {
        if (!att) return null;
        const url: string = att?.payload?.url || att?.url || "";
        const type: string = att?.type || att?.payload?.type || "";
        const name: string | undefined = att?.payload?.name || att?.name;
        const isImage =
            type === "image" || type === "sticker" || isImageUrl(url);

        const getFileNameFromUrl = (fileUrl: string) => {
            // simplified for brevity
            return name || "File đính kèm";
        };

        if (isImage) {
            const displaySrc: string = att?.payload?.thumbnail || url;
            return (
                <a
                    data-fancybox="gallery"
                    href={url}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                    <ImageDisplay
                        src={displaySrc}
                        alt="attachment"
                        className="max-w-[300px] rounded-lg object-cover"
                        width={200}
                        height={200}
                    />
                </a>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <FileIcon className="w-5 h-5" />
                <span className="text-sm underline max-w-[200px] truncate">
                    {getFileNameFromUrl(url)}
                </span>
            </a>
        );
    };

    return (
        <div
            className={cn(
                "flex gap-3 mb-6",
                isOutgoing ? "flex-row-reverse" : "flex-row",
            )}
        >
            {/* Avatar - Only for Incoming */}
            {!isOutgoing && (
                <Avatar
                    name={getFirstAndLastWord(conversation.personName) || ""}
                    src={getAvatarUrl(conversation.personAvatar) || ""}
                    round
                    size={"40"}
                    className="self-start mt-1"
                />
            )}

            {/* Message Content */}
            <div
                className={cn(
                    "max-w-[70%] flex flex-col",
                    isOutgoing ? "items-end" : "items-start",
                )}
            >
                {/* Header Label */}
                {isOutgoing ? (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-medium">
                            {conversation.pageName ||
                                "Tài khoản thử nghiệm 123"}
                        </span>
                        {/* Example icon for page */}
                        {conversation.pageAvatar ? (
                            <Avatar
                                src={
                                    getAvatarUrl(conversation.pageAvatar) ||
                                    undefined
                                }
                                size="16"
                                round
                            />
                        ) : (
                            <PanelRight className="w-3 h-3 text-orange-500" />
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-500 mb-1 font-medium ml-1">
                        {conversation.personName}
                    </span>
                )}

                {/* Message Bubble */}
                {message.message && (
                    <div
                        className={cn(
                            "px-4 py-3 relative shadow-sm",
                            isOutgoing
                                ? "bg-[#3B82F6] text-white rounded-[20px] rounded-tr-sm"
                                : "bg-[#F3F4F6] text-gray-900 rounded-[20px] rounded-tl-sm",
                        )}
                    >
                        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {message.message}
                        </p>
                    </div>
                )}

                {/* Attachments */}
                {attachmentItems.length > 0 && (
                    <div
                        className={cn(
                            "space-y-2",
                            isOutgoing
                                ? "mt-2 items-end flex flex-col"
                                : "mt-2",
                        )}
                    >
                        {attachmentItems.map((att, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                            >
                                {renderAttachment(att)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Time and Status */}
                <div
                    className={cn(
                        "flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5",
                        isOutgoing ? "flex-row-reverse" : "flex-row ml-1",
                    )}
                >
                    <span>{formatTime(message.createdDate)}</span>
                    {isOutgoing && (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatMessageItem = React.memo(ChatMessageItemComponent);

export default function ConversationTimeline({
    conversation,
    orgId,
    onShowConversationDetail,
}: ConversationTimelineProps) {
    const { t } = useLanguage();
    const [conversationName, setConversationName] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);

    // Refs for hidden file inputs
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    const MAX_SIZE = 1024 * 1024 * 10; // 10MB

    useEffect(() => {
        setConversationName(
            mergedConversation.fullName || conversation?.personName || "",
        );
    }, [conversation]);
    // Initialize Fancybox for any element with data-fancybox attribute
    useEffect(() => {
        try {
            Fancybox.bind("[data-fancybox]", {
                Carousel: { infinite: true },
                l10n: {
                    CLOSE: "Đóng",
                    NEXT: "Tiếp",
                    PREV: "Trước",
                    ZOOM: "Phóng to",
                    SLIDESHOW: "Trình chiếu",
                    FULLSCREEN: "Toàn màn hình",
                },
            } as any);
        } catch {}
        return () => {
            try {
                Fancybox.destroy();
            } catch {}
        };
    }, []);

    const triggerImageSelect = () => {
        imageInputRef.current?.click();
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversation) return;

        if (file.size > MAX_SIZE) {
            toast.error("File phải nhỏ hơn 10MB");
            return;
        }

        const messageData = {
            conversationId: conversation.id,
            messageId: "",
            message: "", // gửi file không nội dung
            attachment: file,
        };

        sendMessage(messageData);
        // reset input value so same file can be selected again
        e.target.value = "";
    };

    // Emoji select handler
    const handleEmojiSelect = (emoji: any) => {
        const native = (emoji as any).native || "";
        if (native) {
            setMessageInput((prev) => prev + native);
        }
    };

    // Mutation for sending message
    const { mutate: sendMessage, isPending: isSending } = useSendMessage(
        orgId,
        conversation?.id || "",
    );

    // Fetch up-to-date conversation detail so UI is correct even on reload via cid
    const { data: detailResponse } = useGetDetailConversation(
        orgId || "",
        conversation?.id || "",
    );
    const detailConv: any = (detailResponse as any)?.content;

    // Merge basic fields with detail for consistent rendering
    const mergedConversation: Conversation = {
        ...(conversation as Conversation),
        personName: detailConv?.personName || conversation?.fullName || "",
        personAvatar: detailConv?.personAvatar || conversation?.avatar || "",
        pageName: detailConv?.pageName || conversation?.pageName || "",
        pageAvatar: detailConv?.pageAvatar || conversation?.pageAvatar || "",
    } as Conversation;

    // Fetch chat messages for the selected conversation using infinite scroll
    const {
        data: chatData,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteChatList(orgId, conversation?.id || "", 20, {
        enabled: !!conversation?.id,
    });

    // State for toggling actions when typing
    const [isActionsExpanded, setIsActionsExpanded] = useState(false);

    // Reset actions expansion when input becomes empty
    useEffect(() => {
        if (!messageInput.trim()) {
            setIsActionsExpanded(false);
        }
    }, [messageInput]);

    /* ------------------------------------------------------------------ */
    /*          Realtime updates: refresh chat list when message arrives    */
    /* ------------------------------------------------------------------ */
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!conversation) return; // nothing selected

        // Listen to realtime db changes for this org
        const convRef = ref(
            firebaseDb,
            `root/OrganizationId: ${orgId}/CreateOrUpdateConversation`,
        );

        const handleNewMessage = (snapshot: any) => {
            const data = snapshot.val();
            if (!data) return;

            // Only refresh if message belongs to the open conversation
            if (data.ConversationId === conversation.id) {
                shouldScrollToBottom.current = true;
                queryClient.invalidateQueries({
                    queryKey: ["infiniteChatList", orgId, conversation.id],
                });
            }
        };

        const unsubscribe = onChildAdded(convRef, handleNewMessage);

        // Cleanup
        return () => unsubscribe();
    }, [conversation, orgId, queryClient]);

    // Flatten and sort messages from all pages
    const messages = useMemo(() => {
        const allMessages =
            chatData?.pages.flatMap((page) =>
                page.content == null ? [] : page.content,
            ) || [];
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        return allMessages;
    }, [chatData]);

    // Intersection Observer for loading more messages when scrolling to top
    const firstMessageRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) observerRef.current.disconnect();

            if (!node || !hasNextPage || isFetchingNextPage || isLoading)
                return;

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];

                    if (
                        entry.isIntersecting &&
                        hasNextPage &&
                        !isFetchingNextPage &&
                        !isLoading
                    ) {
                        fetchNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "100px", // Giảm rootMargin để tránh trigger quá sớm
                    threshold: 0.1,
                },
            );

            observerRef.current.observe(node);
        },
        [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage],
    );

    // Cleanup observer
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Auto scroll management
    const hasInitialScrolled = useRef(false);
    const shouldScrollToBottom = useRef(false);

    // Reset scroll state when conversation changes
    useEffect(() => {
        hasInitialScrolled.current = false;
        shouldScrollToBottom.current = false;
    }, [conversation?.id]);

    // Initial scroll to bottom when first messages load
    useEffect(() => {
        if (
            !hasInitialScrolled.current &&
            messages.length > 0 &&
            !isLoading &&
            messagesEndRef.current
        ) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
            hasInitialScrolled.current = true;
        }
    }, [messages.length, isLoading]);

    // Handle scroll to bottom when needed
    useEffect(() => {
        if (shouldScrollToBottom.current && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            shouldScrollToBottom.current = false;
        }
    }, [messages]);

    // Textarea auto-resize
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(
                scrollHeight,
                128,
            )}px`; // Max height ~5-6 lines

            // Only show scrollbar if content exceeds max height
            if (scrollHeight > 128) {
                textareaRef.current.style.overflowY = "auto";
            } else {
                textareaRef.current.style.overflowY = "hidden";
            }
        }
    }, [messageInput]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !conversation) return;

        const messageData = {
            conversationId: conversation.id,
            messageId: "", // No reply message – leave empty
            message: messageInput.trim(),
            attachment: null,
        };

        sendMessage(messageData, {
            onSuccess: (data) => {
                if ((data as any).code === 0) {
                    setMessageInput("");
                    shouldScrollToBottom.current = true;
                    // Reset height
                    if (textareaRef.current) {
                        textareaRef.current.style.height = "auto";
                        textareaRef.current.style.overflowY = "hidden"; // Reset overflow
                    }
                }
            },
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                        Chọn cuộc trò chuyện
                    </p>
                    <p className="text-sm">
                        Chọn một cuộc trò chuyện từ danh sách để bắt đầu
                    </p>
                </div>
            </div>
        );
    }

    const showDetailedActions = !messageInput.trim() || isActionsExpanded;

    return (
        <div className="h-full flex flex-col bg-transparent w-full overflow-hidden">
            {/* Header */}
            <div className="border-b px-4 py-3 flex items-center justify-between bg-white/40 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Avatar
                        name={
                            getFirstAndLastWord(mergedConversation.fullName) ||
                            getFirstAndLastWord(
                                conversation.personName || "User",
                            ) ||
                            ""
                        }
                        src={
                            getAvatarUrl(mergedConversation.avatar || "") ||
                            undefined
                        }
                        round
                        size={"40"}
                        className="shadow-sm border border-gray-100"
                    />
                    <div>
                        <h3 className="font-bold text-gray-900">
                            {conversationName}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShowConversationDetail}
                        className="2xl:hidden"
                    >
                        <PanelRight className="w-4 h-4" />
                    </Button>
                    {detailConv && detailConv.lead && detailConv.lead.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            router.push(
                                                `?lid=${detailConv.lead.id}`,
                                            );
                                        }}
                                    >
                                        Xem chăm khách
                                    </Button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0 auto-hide-scrollbar transition-colors">
                <div className="space-y-4">
                    {/* Loading indicator for fetching older messages */}
                    {isFetchingNextPage && <Loading />}

                    {/* Messages */}
                    {isLoading && messages.length === 0 ? (
                        <Loading />
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            Có lỗi xảy ra khi tải tin nhắn
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Chưa có tin nhắn nào
                        </div>
                    ) : (
                        messages.map((message: ChatMessage, index) => (
                            <div
                                key={message.id}
                                ref={
                                    index === 0 &&
                                    hasNextPage &&
                                    !isFetchingNextPage
                                        ? firstMessageRef
                                        : null
                                }
                            >
                                <ChatMessageItem
                                    message={message}
                                    conversation={mergedConversation}
                                />
                            </div>
                        ))
                    )}

                    {/* Scroll to end marker */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <div className="p-3 bg-transparent backdrop-blur-md flex-shrink-0">
                <div className="flex items-end gap-3 max-w-full">
                    {/* File Upload Section */}
                    <div className="flex items-center gap-1.5 pb-2 text-gray-500">
                        {showDetailedActions ? (
                            <>
                                {/* Show Collapse button if explicitly expanded while typing */}
                                {!!messageInput.trim() && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() =>
                                            setIsActionsExpanded(false)
                                        }
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                )}

                                {/* Label only when input is empty */}
                                {!messageInput.trim() && (
                                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap hidden sm:inline-block mr-1.5"></span>
                                )}

                                <TooltipProvider>
                                    <Tooltip content={t("common.uploadFile")}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                            onClick={triggerFileSelect}
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </Button>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip content={t("common.uploadImage")}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                            onClick={triggerImageSelect}
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </Button>
                                    </Tooltip>
                                </TooltipProvider>

                                <Popover
                                    open={showEmoji}
                                    onOpenChange={setShowEmoji}
                                >
                                    <TooltipProvider>
                                        <Tooltip content="Gửi emoji">
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Smile className="w-5 h-5" />
                                                </Button>
                                            </PopoverTrigger>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent
                                        className="p-0 border-none"
                                        sideOffset={5}
                                    >
                                        {showEmoji && (
                                            <Picker
                                                data={data}
                                                onEmojiSelect={
                                                    handleEmojiSelect
                                                }
                                                locale="vi"
                                                previewPosition="none"
                                                perLine={8}
                                                maxFrequentRows={0}
                                                theme="light"
                                            />
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </>
                        ) : (
                            <TooltipProvider>
                                <Tooltip content="Mở rộng">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                        onClick={() =>
                                            setIsActionsExpanded(true)
                                        }
                                    >
                                        <Plus className="w-6 h-6" />
                                    </Button>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    {/* Hidden inputs */}
                    <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={imageInputRef}
                        onChange={handleFileChosen}
                    />
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChosen}
                    />

                    {/* Input Field */}
                    <div className="flex-1 relative flex items-center">
                        {" "}
                        {/* Thêm flex items-center ở đây để hỗ trợ cấu trúc */}
                        <textarea
                            ref={textareaRef}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="w-full resize-none border border-gray-200 rounded-[24px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 min-h-[46px] max-h-32 pr-12 shadow-sm overflow-hidden"
                            rows={1}
                        />
                        <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || isSending}
                            className={cn(
                                "absolute right-1.5 bottom-1.5 h-8 w-8 rounded-full transition-all duration-200",
                                messageInput.trim()
                                    ? "bg-[#6366F1] hover:bg-[#585add] text-white shadow-md"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                            )}
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <IoMdSend className="w-4 h-4 ml-0.5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

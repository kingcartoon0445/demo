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
                // Hôm nay ➜ chỉ hiển thị giờ:phút
                return date.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            }

            // Ngày trước ➜ hiển thị dd/MM/yyyy HH:mm
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

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join("");
    };

    // Determine if message is outgoing (from page/bot to user)
    const isOutgoing = message.isPageReply;

    // Get avatar and name based on message direction
    const senderAvatar = isOutgoing
        ? message.isGpt
            ? "/images/bot_avatar.webp"
            : conversation.pageAvatar
        : message.avatar || conversation.avatar;

    const senderName = message.fullName;

    // Parse attachments (if any)
    let attachmentItems: Array<{ type: string; payload: any }> = [];
    const rawAtt = (message as any).attachments;
    if (rawAtt) {
        if (typeof rawAtt === "string") {
            try {
                attachmentItems = JSON.parse(rawAtt);
            } catch {
                // ignore parse error
            }
        } else if (Array.isArray(rawAtt)) {
            attachmentItems = rawAtt;
        }
    }

    // Detect Zalo sticker URL inside text message (e.g. /api/emoticon/oasticker)
    const STICKER_PATH = "/api/emoticon/oasticker";
    if (message.message && message.message.includes(STICKER_PATH)) {
        attachmentItems.push({
            type: "image",
            payload: { url: message.message },
        });
        // Remove text to avoid duplicate rendering
        message = { ...message, message: "" } as ChatMessage;
    }

    // Helper function to check if URL is an image (strict)
    const isImageUrl = (url: string) => {
        if (!url) return false;
        try {
            const parsed = new URL(url);
            const pathname = parsed.pathname || "";
            const lastSegment = pathname.split("/").pop() || "";
            const ext = lastSegment.includes(".")
                ? `.${lastSegment.split(".").pop()!.toLowerCase()}`
                : "";

            const imageExtensions = [
                ".jpg",
                ".jpeg",
                ".png",
                ".gif",
                ".webp",
                ".bmp",
                ".heic",
                ".avif",
            ];
            if (ext && imageExtensions.includes(ext)) return true;

            // Explicit non-image extensions
            const nonImageExtensions = [
                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".ppt",
                ".pptx",
                ".zip",
                ".rar",
                ".7z",
            ];
            if (ext && nonImageExtensions.includes(ext)) return false;

            // Fallback: infer from query param mime/content_type if present
            const mime =
                parsed.searchParams.get("mime") ||
                parsed.searchParams.get("content_type") ||
                parsed.searchParams.get("type");
            if (mime && mime.toLowerCase().startsWith("image/")) return true;
            if (mime && !mime.toLowerCase().startsWith("image/")) return false;

            // Default to not image if uncertain
            return false;
        } catch {
            // If URL parsing fails, fallback to simple extension check
            return /\.(jpg|jpeg|png|gif|webp|bmp|heic|avif)$/i.test(url);
        }
    };

    // Process attachments to convert Facebook file attachments to images if they are images
    attachmentItems = attachmentItems.map((att) => {
        // If it's a file type but the URL is actually an image, convert it to image type
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
            type === "image" ||
            type === "sticker" ||
            /\.(jpg|jpeg|png|gif|webp)$/i.test(url || "");

        const getFileNameFromUrl = (fileUrl: string) => {
            try {
                if (name) return name;

                if (fileUrl && fileUrl.includes("fbsbx.com")) {
                    const urlObj = new URL(fileUrl);
                    const pathParts = urlObj.pathname.split("/");

                    for (let i = pathParts.length - 1; i >= 0; i--) {
                        if (pathParts[i] && pathParts[i].includes(".")) {
                            return decodeURIComponent(pathParts[i]);
                        }
                    }
                }

                const urlParts = (fileUrl || "").split("/");
                for (let i = urlParts.length - 1; i >= 0; i--) {
                    const part = urlParts[i];
                    if (
                        part &&
                        part.includes(".") &&
                        !part.startsWith("http")
                    ) {
                        const fileNamePart = part.split("?")[0];
                        if (fileNamePart) {
                            return decodeURIComponent(fileNamePart);
                        }
                    }
                }

                if (type) {
                    return `File ${type.toUpperCase()}`;
                }

                return "File đính kèm";
            } catch (error) {
                console.error("Lỗi khi trích xuất tên file:", error);
                return "File đính kèm";
            }
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
                        alt={getFileNameFromUrl(url)}
                        className="max-w-[300px] rounded-lg object-cover"
                        width={100}
                        height={100}
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
                <span className="text-sm">{getFileNameFromUrl(url)}</span>
            </a>
        );
    };
    return (
        <div
            className={cn(
                "flex gap-3 mb-4",
                isOutgoing ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <Avatar
                name={getFirstAndLastWord(senderName) || ""}
                src={getAvatarUrl(senderAvatar) || ""}
                round
                size={"24"}
            />

            {/* Message Content */}
            <div
                className={cn(
                    "max-w-[70%] space-y-1",
                    isOutgoing ? "items-end" : "items-start"
                )}
            >
                {/* Sender name */}
                {senderName && (
                    <span
                        className={cn(
                            "text-xs text-gray-500 mb-1",
                            isOutgoing ? "text-right" : "text-left"
                        )}
                    >
                        {senderName}
                    </span>
                )}

                {/* Message Bubble */}
                {message.message && (
                    <div
                        className={cn(
                            "rounded-lg px-3 py-2 relative",
                            isOutgoing
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                        )}
                    >
                        <p className="text-sm break-words whitespace-pre-wrap">
                            {message.message}
                        </p>
                    </div>
                )}

                {/* Attachments displayed without chat bubble background */}
                {attachmentItems.map((att, idx) => (
                    <div key={idx} className="mt-2">
                        {renderAttachment(att)}
                    </div>
                ))}

                {/* Time and Status */}
                <div
                    className={cn(
                        "flex items-center gap-1 text-xs text-gray-500",
                        isOutgoing ? "flex-row-reverse" : "flex-row"
                    )}
                >
                    <span>{formatTime(message.createdDate)}</span>
                    {isOutgoing && (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
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
            mergedConversation.fullName || conversation?.personName || ""
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
        conversation?.id || ""
    );

    // Fetch up-to-date conversation detail so UI is correct even on reload via cid
    const { data: detailResponse } = useGetDetailConversation(
        orgId || "",
        conversation?.id || ""
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

    /* ------------------------------------------------------------------ */
    /*          Realtime updates: refresh chat list when message arrives    */
    /* ------------------------------------------------------------------ */
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!conversation) return; // nothing selected

        // Listen to realtime db changes for this org
        const convRef = ref(
            firebaseDb,
            `root/OrganizationId: ${orgId}/CreateOrUpdateConversation`
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
                page.content == null ? [] : page.content
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
                }
            );

            observerRef.current.observe(node);
        },
        [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]
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

    return (
        <div className="h-full flex flex-col bg-white w-full overflow-hidden">
            {/* Header */}
            <div className="border-b p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar
                        name={
                            getFirstAndLastWord(mergedConversation.fullName) ||
                            getFirstAndLastWord(
                                conversation.personName || ""
                            ) ||
                            ""
                        }
                        src={getAvatarUrl(mergedConversation.avatar) || ""}
                        round
                        size={"24"}
                    />
                    <div>
                        <h3 className="font-medium">{conversationName}</h3>
                        {/* <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                                {conversation.isRead ? "Đã xem" : "Chưa xem"}
                            </span>
                        </div> */}
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
                                                `?lid=${detailConv.lead.id}`
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
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
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
            <div className="border-t px-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {/* File upload */}
                    <TooltipProvider>
                        <Tooltip content={t("common.uploadFile")}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={triggerFileSelect}
                            >
                                <Paperclip className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    </TooltipProvider>
                    {/* Image upload */}
                    <TooltipProvider>
                        <Tooltip content={t("common.uploadImage")}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={triggerImageSelect}
                            >
                                <ImageIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    </TooltipProvider>
                    <Popover open={showEmoji} onOpenChange={setShowEmoji}>
                        <TooltipProvider>
                            <Tooltip content="Gửi emoji">
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Smile className="w-4 h-4" />
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
                                    onEmojiSelect={handleEmojiSelect}
                                    locale="vi"
                                    previewPosition="none"
                                    perLine={8}
                                    maxFrequentRows={0}
                                    theme="light"
                                />
                            )}
                        </PopoverContent>
                    </Popover>
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
                    <div className="flex-1 relative">
                        <textarea
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t("common.enterMessage")}
                            className="w-full resize-none border rounded-lg px-3 py-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-h-24"
                            rows={1}
                        />
                    </div>

                    <Button
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSending}
                        variant="default"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <IoMdSend className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

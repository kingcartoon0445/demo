"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    Reply,
    ReplyAll,
    Forward,
    Sparkles,
    Link as LinkIcon,
    Trash2,
    MoreVertical,
    CheckCircle,
    ChevronDown,
    FileText,
    Download,
    ListChecks,
    Mail,
    MailOpen,
    X,
    Tag,
    Loader2,
    Archive,
} from "lucide-react";
import toast from "react-hot-toast";
import FindLeadModal from "@/components/common/FindLeadModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuPortal,
    DropdownMenuSub2,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import {
    getEmailDetail,
    getEmailList,
    getEmailTemplateDetail,
    getEmailTemplateList,
    downloadAttachment,
    sendEmail,
    forwardEmail,
    deleteEmails,
    assignTagsToEmail,
    EmailTag,
} from "@/api/mail-box";
import { rewriteEmail } from "@/api/n8n";
import {
    convertHtmlToPlainText,
    convertNewlinesToHtml,
    extractHtml,
    getInvalidEmails,
} from "@/utils/emailHelpers";
import { v4 as uuidv4 } from "uuid";
import AiEmailDialog from "@/components/common/AiEmailDialog";
import AiSummaryDialog from "@/components/common/AiSummaryDialog";
import { summaryEmailByAi } from "@/api/n8n";
import { useLanguage } from "@/contexts/LanguageContext";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import FeatureUnderDevelopmentDialog from "@/components/common/FeatureUnderDevelopmentDialog";

interface EmailViewProps {
    className?: string;
    selectedEmailId?: string | null;
    selectedEmailDetail?: any;
    isLoadingDetail?: boolean;
    checkedEmailIds?: string[];
    orgId?: string;
    defaultConfigId?: string;
    onCompose?: (data: any) => void;
    onEmailDeleted?: (deletedIds: string[]) => void;
    onEmailUpdated?: (updatedEmail: any) => void;
    emails?: any[];
    onMarkAsRead?: (ids: string[], isRead: boolean) => void;
    availableTags?: EmailTag[];
    isDraft?: boolean;
}

export function EmailView({
    className,
    selectedEmailId,
    selectedEmailDetail,
    isLoadingDetail = false,
    checkedEmailIds = [],
    orgId,
    defaultConfigId,
    onCompose,
    onEmailDeleted,
    onEmailUpdated,
    emails,
    onMarkAsRead,
    availableTags = [],
    isDraft = false,
}: EmailViewProps) {
    const { t } = useLanguage();
    const [findLeadOpen, setFindLeadOpen] = React.useState(false);

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [deleteAction, setDeleteAction] = React.useState<"single" | "bulk">(
        "single",
    );

    const handleDeleteClick = (type: "single" | "bulk") => {
        setDeleteAction(type);
        setDeleteDialogOpen(true);
    };

    // Forward Email State
    const [forwardDialogOpen, setForwardDialogOpen] = React.useState(false);
    const [forwardTo, setForwardTo] = React.useState("");
    const [forwardCc, setForwardCc] = React.useState("");
    const [forwardMessage, setForwardMessage] = React.useState("");
    const [forwardIncludeAttachments, setForwardIncludeAttachments] =
        React.useState(true);
    const [isForwarding, setIsForwarding] = React.useState(false);
    const [isFeatureDialogOpen, setIsFeatureDialogOpen] = React.useState(false);

    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleConfirmDelete = async () => {
        if (!orgId) {
            toast.error("Không tìm thấy orgId");
            return;
        }

        const idsToDelete =
            deleteAction === "single"
                ? selectedEmailId
                    ? [selectedEmailId]
                    : []
                : checkedEmailIds;

        if (idsToDelete.length === 0) {
            toast.error(t("mail.noEmailSelected"));
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteEmails(orgId, idsToDelete);

            if (result?.code === 200 || result?.success) {
                toast.success(
                    result?.message ||
                        `Đã xóa ${idsToDelete.length} email thành công`,
                );
                setDeleteDialogOpen(false);
                onEmailDeleted?.(idsToDelete);
            } else {
                toast.error(result?.message || "Xóa email thất bại");
            }
        } catch (error: any) {
            console.error("Delete emails error:", error);
            toast.error(
                error?.response?.data?.message || "Không thể xóa email",
            );
        } finally {
            setIsDeleting(false);
        }
    };

    // State for reply functionality
    const [isReplying, setIsReplying] = React.useState(false);
    const [replyContent, setReplyContent] = React.useState("");
    const [replyTo, setReplyTo] = React.useState("");
    const [replySubject, setReplySubject] = React.useState("");
    const [attachments, setAttachments] = React.useState<File[]>([]);

    // Additional state for EmailComposerHeader
    const [fromEmail, setFromEmail] = React.useState("");
    const [ccEmail, setCcEmail] = React.useState("");
    const [bccEmail, setBccEmail] = React.useState("");
    const [templates, setTemplates] = React.useState<any[]>([]);
    const [configs, setConfigs] = React.useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] =
        React.useState<string>("");
    const [selectedConfigId, setSelectedConfigId] = React.useState<string>("");
    const [selectKey, setSelectKey] = React.useState<number>(0);
    const [sessionId, setSessionId] = React.useState<string>("");
    const [isAiDialogOpen, setIsAiDialogOpen] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [aiFormData, setAiFormData] = React.useState({
        sessionId: "",
        language: "vi",
        subject: "",
        prompt: "",
        content: "",
        tone: "",
        length: "",
    });

    // AI Summary State
    const [summaryData, setSummaryData] = React.useState<any>(null);
    const [isSummarizing, setIsSummarizing] = React.useState(false);
    const [showSummaryDialog, setShowSummaryDialog] = React.useState(false);

    const editorRef = React.useRef<any>(null);
    const replyRef = React.useRef<HTMLDivElement>(null);

    // Use the selectedEmailDetail from props instead of searching EMAILS
    // Normalize email data to handle both API format and mock format
    // Use useMemo to prevent recreation on every render
    const email = React.useMemo(() => {
        if (!selectedEmailDetail) return null;

        // Determine content: prefer bodyHtml, fallback to bodyText
        const htmlContent =
            selectedEmailDetail.bodyHtml || selectedEmailDetail.content;
        const textContent = selectedEmailDetail.bodyText;
        const displayContent =
            htmlContent ||
            (textContent
                ? `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit;">${textContent}</pre>`
                : "");

        return {
            ...selectedEmailDetail,
            // Map API fields to UI fields for backward compatibility
            content: displayContent,
            sender: selectedEmailDetail.sender || {
                name: selectedEmailDetail.fromName || "Unknown",
                email: selectedEmailDetail.fromAddress || "",
            },
            to: selectedEmailDetail.toAddresses?.[0] || selectedEmailDetail.to,
            tags: selectedEmailDetail.tags || [],
            attachments: selectedEmailDetail.attachments || [],
        };
    }, [selectedEmailDetail]);

    // Local tags state for optimistic updates
    const [localTags, setLocalTags] = React.useState<EmailTag[] | null>(null);

    React.useEffect(() => {
        if (selectedEmailId && email && email.sender) {
            setLocalTags(null); // Reset local tags when email changes
            setIsReplying(false);
            setReplyContent("");
            setReplyTo(email.sender.email);
            setReplySubject(`Re: ${email.subject || ""}`);
            setCcEmail("");
            setBccEmail("");
            setSelectedTemplateId("");
            setSelectedTemplateId("");
            setSelectedConfigId(defaultConfigId || "");
            setAttachments([]);
        }
    }, [selectedEmailId, email, defaultConfigId]);

    const handleToggleTag = async (tag: EmailTag) => {
        if (!orgId || !email) return;

        const currentTags = localTags || email.tags || [];
        const currentTagIds = currentTags.map((t: any) => t.id);
        const isAssigned = currentTagIds.includes(tag.id);

        let newTagIds;
        let newTags;

        if (isAssigned) {
            newTagIds = currentTagIds.filter((id: string) => id !== tag.id);
            newTags = currentTags.filter((t: any) => t.id !== tag.id);
        } else {
            newTagIds = [...currentTagIds, tag.id];
            newTags = [...currentTags, tag];
        }

        // Optimistic update
        setLocalTags(newTags);

        // Notify parent to update list immediately
        if (onEmailUpdated && email) {
            onEmailUpdated({
                ...email,
                tags: newTags,
            });
        }

        try {
            await assignTagsToEmail(
                orgId,
                defaultConfigId!,
                email.id,
                newTagIds,
            );
            toast.success(t("mail.updateLabelSuccess") || "Đã cập nhật nhãn");
        } catch (error) {
            console.error("Assign tag error:", error);
            toast.error(
                t("mail.updateLabelError") || "Không thể cập nhật nhãn",
            );
            setLocalTags(null); // Revert on error
        }
    };

    // Generate sessionId
    React.useEffect(() => {
        setSessionId(uuidv4());
    }, []);

    // Load templates and configs
    React.useEffect(() => {
        if (!orgId) return;
        const loadData = async () => {
            try {
                const [templatesRes, configsRes] = await Promise.all([
                    getEmailTemplateList(orgId),
                    getEmailList(orgId, { limit: 1000 }),
                ]);
                const templatesData = templatesRes as any;
                const configsData = configsRes as any;
                if (templatesData?.code === 0) {
                    setTemplates(templatesData.content || []);
                }
                if (configsData?.code === 0) {
                    setConfigs(configsData.content || []);
                }
            } catch (error) {
                console.error("Error loading templates/configs:", error);
            }
        };
        loadData();
    }, [orgId]);

    // Handle Template Change
    const handleTemplateChange = (value: string) => {
        if (value === "__clear__") {
            setReplyContent("");
            if (editorRef.current) {
                editorRef.current.setContent("");
            }
            setSelectedTemplateId("");
            setSelectKey((prev) => prev + 1);
            return;
        }
        setSelectedTemplateId(value);
    };

    // Load template detail
    React.useEffect(() => {
        if (!selectedTemplateId || !orgId) return;
        const loadTemplateDetail = async () => {
            try {
                const res = (await getEmailTemplateDetail(
                    orgId,
                    selectedTemplateId,
                )) as any;

                if (res?.code === 0 && res?.content) {
                    const html = extractHtml(res.content.body);
                    setReplyContent(html);
                    if (editorRef.current) {
                        editorRef.current.setContent(html);
                    }
                    if (res.content.subject) {
                        setReplySubject(res.content.subject);
                    }
                }
            } catch (error) {
                console.error("Error loading template detail:", error);
            }
        };
        loadTemplateDetail();
    }, [selectedTemplateId, orgId]);

    // Load config detail
    React.useEffect(() => {
        if (!selectedConfigId || !orgId) return;
        const loadConfigDetail = async () => {
            try {
                const res = (await getEmailDetail(
                    orgId,
                    selectedConfigId,
                )) as any;
                if (res?.code === 0 && res?.content) {
                    if (res.content.body) {
                        const html = extractHtml(res.content.body);
                        setReplyContent(html);
                        if (editorRef.current) {
                            editorRef.current.setContent(html);
                        }
                    }
                    if (res.content.subject) {
                        setReplySubject(res.content.subject);
                    }
                    if (res.content.userName) {
                        setFromEmail(res.content.userName);
                    } else if (res.content.fromEmail) {
                        setFromEmail(res.content.fromEmail);
                    }
                }
            } catch (error) {
                console.error("Error loading config detail:", error);
            }
        };
        loadConfigDetail();
    }, [selectedConfigId, orgId]);

    // AI Handlers
    const getEditorContent = (): string => {
        return editorRef.current?.getContent() || "";
    };

    const handleOpenAiDialog = () => {
        const currentContent = getEditorContent();
        const plainTextContent = convertHtmlToPlainText(currentContent);
        setAiFormData({
            sessionId: sessionId,
            language: "vi",
            subject: replySubject,
            prompt: "",
            content: plainTextContent,
            tone: "",
            length: "",
        });
        setIsAiDialogOpen(true);
    };

    const handleAiFormDataChange = (data: Partial<typeof aiFormData>) => {
        setAiFormData((prev) => ({ ...prev, ...data }));
    };

    const handleAiSubmit = async () => {
        if (!orgId) {
            toast.error("Valid organization ID required");
            return;
        }

        try {
            setIsGenerating(true);
            const response = (await rewriteEmail(aiFormData)) as any;

            if (response?.generated_email) {
                if (response.generated_email.subject_line) {
                    setReplySubject(response.generated_email.subject_line);
                }
                if (response.generated_email.body) {
                    const htmlContent = convertNewlinesToHtml(
                        response.generated_email.body,
                    );
                    setReplyContent(htmlContent);
                    if (editorRef.current) {
                        editorRef.current.setContent(htmlContent);
                    }
                }
                toast.success("Email generated successfully!");
                setIsAiDialogOpen(false);
            } else {
                toast.error("No data received from AI");
            }
        } catch (error: any) {
            console.error("Error generating email:", error);
            toast.error(
                error?.response?.data?.message || "Error generating email",
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSummarize = async () => {
        if (!email) return;

        // Extract content
        const htmlContent = email.bodyHtml || email.content || "";
        const plainTextContent = convertHtmlToPlainText(htmlContent);

        if (!plainTextContent || plainTextContent.trim().length === 0) {
            if (!plainTextContent || plainTextContent.trim().length === 0) {
                toast.error(
                    t("mail.noContentToSummarize") ||
                        "Không tìm thấy nội dung email để tóm tắt",
                );
                return;
            }
        }

        setIsSummarizing(true);
        setShowSummaryDialog(true);
        setSummaryData(null);

        try {
            const result = await summaryEmailByAi({
                sessionId: sessionId,
                content: plainTextContent,
            });

            if (result && result.summary_email) {
                setSummaryData(result.summary_email);
            } else {
                toast.error(
                    t("mail.aiSummaryError") ||
                        "Không nhận được kết quả tóm tắt từ AI",
                );
                setShowSummaryDialog(false);
            }
        } catch (error) {
            console.error("Summarize error:", error);
            toast.error(
                t("mail.aiSummaryError") || "Có lỗi xảy ra khi tóm tắt email",
            );
            setShowSummaryDialog(false);
        } finally {
            setIsSummarizing(false);
        }
    };

    React.useEffect(() => {
        if (isReplying && replyRef.current) {
            // Delay slightly to ensure render is complete
            setTimeout(() => {
                replyRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 100);
        }
    }, [isReplying]);

    const handleReply = React.useCallback(() => {
        if (!email || !email.sender) return;

        const replyData = {
            to: email.sender.email,
            subject: email.subject?.startsWith("Re:")
                ? email.subject
                : `Re: ${email.subject || ""}`,
            content: `<br><br><blockquote>${email.content || ""}</blockquote>`,
            replyToEmailId: email.id || selectedEmailId,
            replyAll: false,
        };
        onCompose?.(replyData);
    }, [email, selectedEmailId, onCompose]);

    const handleEditDraft = React.useCallback(() => {
        if (!email) return;

        const draftData = {
            to: email.toAddresses?.join(", ") || email.to || "",
            subject: email.subject || "",
            content: email.bodyHtml || email.bodyText || email.content || "",
            cc: email.ccAddresses?.join(", ") || "",
            bcc: email.bccAddresses?.join(", ") || "",
            draftId: email.id,
        };
        onCompose?.(draftData);
    }, [email, onCompose]);

    const [isSendingReply, setIsSendingReply] = React.useState(false);

    const handleSendReply = React.useCallback(async () => {
        if (!orgId || !selectedConfigId || !replyTo) {
            toast.error(
                t("mail.validate.fillAllFields") ||
                    "Vui lòng điền đầy đủ thông tin",
            );
            return;
        }

        setIsSendingReply(true);
        try {
            const htmlContent = editorRef.current?.getContent() || replyContent;
            const textContent = convertHtmlToPlainText(htmlContent);

            // Validate emails
            const invalidTo = getInvalidEmails(replyTo);
            if (invalidTo.length > 0) {
                toast.error(
                    t("mail.validate.invalidEmail") +
                        ": " +
                        invalidTo.join(", "),
                );
                setIsSendingReply(false);
                return;
            }

            if (ccEmail) {
                const invalidCc = getInvalidEmails(ccEmail);
                if (invalidCc.length > 0) {
                    toast.error(
                        `Email CC không hợp lệ: ${invalidCc.join(", ")}`,
                    );
                    setIsSendingReply(false);
                    return;
                }
            }

            if (bccEmail) {
                const invalidBcc = getInvalidEmails(bccEmail);
                if (invalidBcc.length > 0) {
                    toast.error(
                        `Email BCC không hợp lệ: ${invalidBcc.join(", ")}`,
                    );
                    setIsSendingReply(false);
                    return;
                }
            }

            await sendEmail(orgId, {
                outgoingAccountId: selectedConfigId,
                toAddresses: replyTo
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean),
                ccAddresses: ccEmail
                    ? ccEmail
                          .split(",")
                          .map((e) => e.trim())
                          .filter(Boolean)
                    : undefined,
                bccAddresses: bccEmail
                    ? bccEmail
                          .split(",")
                          .map((e) => e.trim())
                          .filter(Boolean)
                    : undefined,
                subject: replySubject,
                bodyText: textContent,
                bodyHtml: htmlContent,
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            toast.success(t("mail.sendSuccess"));
            setIsReplying(false);
            setReplyContent("");
            setAttachments([]);
            if (editorRef.current) {
                editorRef.current.setContent("");
            }
        } catch (error: any) {
            console.error("Send reply error:", error);
            toast.error(error?.response?.data?.message || t("mail.sendError"));
        } finally {
            setIsSendingReply(false);
        }
    }, [
        orgId,
        selectedConfigId,
        replyTo,
        replySubject,
        replyContent,
        ccEmail,
        bccEmail,
        attachments,
    ]);

    const handleReplyAll = React.useCallback(() => {
        if (!email || !email.sender) return;

        const replyData = {
            to: email.sender.email,
            subject: email.subject?.startsWith("Re:")
                ? email.subject
                : `Re: ${email.subject || ""}`,
            content: `<br><br><blockquote>${email.content || ""}</blockquote>`,
            replyToEmailId: email.id || selectedEmailId,
            replyAll: true,
        };
        onCompose?.(replyData);
    }, [email, selectedEmailId, onCompose]);

    // Forward handler
    const handleOpenForwardDialog = React.useCallback(() => {
        if (!email) return;
        setForwardTo("");
        setForwardCc("");
        setForwardMessage("");
        setForwardIncludeAttachments(true);
        setForwardDialogOpen(true);
    }, [email]);

    const handleForwardEmail = React.useCallback(async () => {
        if (!orgId || !selectedConfigId || !forwardTo || !selectedEmailId) {
            toast.error(
                t("mail.validate.fillAllFields") ||
                    "Vui lòng điền đầy đủ thông tin",
            );
            return;
        }

        setIsForwarding(true);
        try {
            // Validate emails
            const invalidTo = getInvalidEmails(forwardTo);
            if (invalidTo.length > 0) {
                toast.error(
                    `Email người nhận không hợp lệ: ${invalidTo.join(", ")}`,
                );
                setIsForwarding(false);
                return;
            }

            if (forwardCc) {
                const invalidCc = getInvalidEmails(forwardCc);
                if (invalidCc.length > 0) {
                    toast.error(
                        `Email CC không hợp lệ: ${invalidCc.join(", ")}`,
                    );
                    setIsForwarding(false);
                    return;
                }
            }

            await forwardEmail(orgId, selectedEmailId, {
                outgoingAccountId: selectedConfigId,
                toAddresses: forwardTo
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean),
                ccAddresses: forwardCc
                    ? forwardCc
                          .split(",")
                          .map((e) => e.trim())
                          .filter(Boolean)
                    : undefined,
                additionalMessage: forwardMessage,
                includeAttachments: forwardIncludeAttachments,
            });

            toast.success(
                t("mail.forwardSuccess") ||
                    "Email đã được chuyển tiếp thành công!",
            );
            setForwardDialogOpen(false);
            setForwardTo("");
            setForwardCc("");
            setForwardMessage("");
        } catch (error: any) {
            console.error("Forward email error:", error);
            toast.error(
                error?.response?.data?.message || "Không thể chuyển tiếp email",
            );
        } finally {
            setIsForwarding(false);
        }
    }, [
        orgId,
        selectedConfigId,
        selectedEmailId,
        forwardTo,
        forwardCc,
        forwardMessage,
        forwardIncludeAttachments,
    ]);

    const confirmDialog = (
        <ConfirmDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleConfirmDelete}
            title={t("mail.deleteConfirm")}
            description={
                deleteAction === "single"
                    ? t("mail.deleteConfirmSingle")
                    : t("mail.deleteConfirmBulk", {
                          count: checkedEmailIds.length.toString(),
                      })
            }
            confirmText={t("mail.delete")}
            variant="destructive"
        />
    );

    const featureDialog = (
        <FeatureUnderDevelopmentDialog
            isOpen={isFeatureDialogOpen}
            onClose={() => setIsFeatureDialogOpen(false)}
        />
    );

    // Calculate if all checked emails are read
    const allCheckedRead = React.useMemo(() => {
        if (!checkedEmailIds.length || !emails) return false;
        return checkedEmailIds.every((id) => {
            const email = emails.find((e) => e.id === id);
            return email?.isRead;
        });
    }, [checkedEmailIds, emails]);

    // 1. If multiple emails are checked (and no specific email is open), show bulk action view
    if (checkedEmailIds.length > 0) {
        return (
            <div
                className={cn(
                    "flex flex-col h-full bg-transparent overflow-hidden items-center justify-center p-8 text-center",
                    className,
                )}
            >
                <div className="w-24 h-24 bg-[#EEEBFF] rounded-full flex items-center justify-center mb-6">
                    <ListChecks className="h-10 w-10 text-[#5c46e6]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {checkedEmailIds.length} {t("mail.conversationsSelected")}
                </h3>
                <p className="text-gray-500 max-w-sm mb-6">
                    {t("mail.bulkActionDescription")}
                </p>
                <div className="flex gap-3">
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
                        onClick={() =>
                            onMarkAsRead?.(checkedEmailIds, !allCheckedRead)
                        }
                    >
                        {allCheckedRead ? (
                            <>
                                <Mail className="h-4 w-4" />
                                {t("mail.markAsUnread")}
                            </>
                        ) : (
                            <>
                                <MailOpen className="h-4 w-4" />
                                {t("mail.markAsRead")}
                            </>
                        )}
                    </button>
                    {/* <button
                        onClick={() => toast.error("Tính năng đang phát triển")}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
                    >
                        <Archive className="h-4 w-4" />
                        Lưu trữ
                    </button> */}
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm"
                        onClick={() => handleDeleteClick("bulk")}
                    >
                        <Trash2 className="h-4 w-4" />
                        {t("mail.deleteSelected")}
                    </button>
                </div>
                {confirmDialog}
                {featureDialog}
            </div>
        );
    }

    // 2. If loading email detail, show loading state
    if (isLoadingDetail) {
        return (
            <div
                className={cn(
                    "flex flex-col h-full bg-transparent overflow-hidden items-center justify-center p-8 text-center",
                    className,
                )}
            >
                <Loader2 className="w-12 h-12 animate-spin text-[#5c46e6] mb-4" />
                <p className="text-gray-500">{t("mail.loadingDetail")}</p>
            </div>
        );
    }

    // 3. If nothing is selected/checked, show empty state
    if (!selectedEmailId || !email) {
        return (
            <div
                className={cn(
                    "flex flex-col h-full bg-transparent overflow-hidden items-center justify-center p-8 text-center",
                    className,
                )}
            >
                <div className="w-24 h-24 bg-[#EEEBFF] rounded-full flex items-center justify-center mb-6">
                    <ListChecks className="h-10 w-10 text-[#5c46e6]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("mail.noConversationSelected")}
                </h3>
                <p className="text-gray-500 max-w-sm">
                    {t("mail.selectConversationPrompt")}
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-transparent overflow-hidden relative",
                className,
            )}
        >
            {/* Action Bar */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200/50 bg-white/40 shrink-0 gap-3 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                    {isDraft ? (
                        <TooltipProvider>
                            <Tooltip content={t("mail.tooltip.editDraft")}>
                                <button
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-all shadow-sm whitespace-nowrap"
                                    onClick={handleEditDraft}
                                >
                                    <FileText className="h-4 w-4 " />
                                    {t("mail.edit")}
                                </button>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <>
                            <TooltipProvider>
                                <Tooltip content={t("mail.tooltip.reply")}>
                                    <button
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-all shadow-sm whitespace-nowrap"
                                        onClick={handleReply}
                                    >
                                        <Reply className="h-4 w-4 " />
                                        {t("mail.reply")}
                                    </button>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip content={t("mail.tooltip.replyAll")}>
                                    <button
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-all shadow-sm whitespace-nowrap"
                                        onClick={handleReplyAll}
                                    >
                                        <ReplyAll className="h-4 w-4" />
                                        {t("mail.replyAll")}
                                    </button>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip content={t("mail.tooltip.forward")}>
                                    <button
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-all shadow-sm whitespace-nowrap"
                                        onClick={handleOpenForwardDialog}
                                    >
                                        <Forward className="h-4 w-4" />
                                        {t("mail.forward")}
                                    </button>
                                </Tooltip>
                            </TooltipProvider>
                        </>
                    )}

                    <div className="w-px h-6 bg-gray-200 mx-2"></div>

                    <button
                        className="flex items-center text-white gap-2 px-3 py-1.5 text-sm font-medium bg-sidebar-primary rounded-md shadow-sm transition-all whitespace-nowrap"
                        onClick={handleSummarize}
                    >
                        <Sparkles className="h-4 w-4" />
                        {t("mail.aiSummary")}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {/* <TooltipProvider> */}
                    {/* <Tooltip content="Liên kết email với khách hàng CRM">
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#5c46e6] bg-[#5c46e6]/10 hover:bg-[#5c46e6]/20 rounded-md transition-colors whitespace-nowrap"
                            onClick={() => setIsFeatureDialogOpen(true)}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Liên kết CRM
                        </button>
                    </Tooltip> */}
                    {/* </TooltipProvider> */}

                    <div className="w-px h-6 bg-gray-200 mx-2"></div>

                    {/* <TooltipProvider>
                        <Tooltip content="Lưu trữ">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                                <Archive className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </TooltipProvider> */}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                {t("mail.actions")}
                            </DropdownMenuLabel>
                            {/* <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Đánh dấu chưa đọc
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Clock className="mr-2 h-4 w-4" />
                                Báo lại...
                            </DropdownMenuItem>
                            <DropdownMenuSeparator /> */}
                            <DropdownMenuSub2>
                                <DropdownMenuSubTrigger>
                                    <Tag className="mr-2 h-4 w-4" />
                                    {t("mail.addLabel")}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        {availableTags.length === 0 ? (
                                            <DropdownMenuItem disabled>
                                                {t("mail.noLabels")}
                                            </DropdownMenuItem>
                                        ) : (
                                            availableTags.map((tag) => (
                                                <DropdownMenuCheckboxItem
                                                    key={tag.id}
                                                    checked={(
                                                        localTags ||
                                                        selectedEmailDetail?.tags ||
                                                        []
                                                    ).some(
                                                        (t: any) =>
                                                            t.id === tag.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        handleToggleTag(tag)
                                                    }
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                tag.color,
                                                        }}
                                                    />
                                                    {tag.name}
                                                </DropdownMenuCheckboxItem>
                                            ))
                                        )}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub2>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleDeleteClick("single")}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("mail.delete")}
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setIsFeatureDialogOpen(true)}
                            >
                                <AlertOctagon className="mr-2 h-4 w-4" />
                                Báo cáo Spam
                            </DropdownMenuItem> */}
                            {/* <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setIsFeatureDialogOpen(true)}
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Chặn người gửi
                            </DropdownMenuItem> */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6 ">
                <div className="max-w-full ">
                    <div className="mb-8">
                        {/* Title */}
                        <div className="flex justify-between items-start gap-4">
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-6 flex-1">
                                {email.subject}
                            </h1>
                            {/* <div className="flex gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <Printer className="h-4 w-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <ExternalLink className="h-4 w-4" />
                                </button>
                            </div> */}
                        </div>

                        {/* Sender Info */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                                        {email.sender.avatar ? (
                                            <img
                                                src={email.sender.avatar}
                                                alt={email.sender.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#5c46e6] flex items-center justify-center text-white font-bold text-lg">
                                                {email.sender.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                        <CheckCircle className="text-green-500 h-3.5 w-3.5 fill-current" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-semibold text-gray-900">
                                            {email.sender.name}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            &lt;{email.sender.email}&gt;
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        To:{" "}
                                        <span className="text-gray-700 font-medium">
                                            {email.to}
                                        </span>
                                        <ChevronDown className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <span className="text-sm text-gray-500">
                                    {email.dateSent ||
                                    email.dateReceived ||
                                    "" ? (
                                        new Date(
                                            email.dateSent ||
                                                email.dateReceived ||
                                                "",
                                        ).toLocaleDateString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })
                                    ) : (
                                        <span className="text-xs">
                                            {email.fullTime || email.time}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Tags moved below Sender Info */}
                        {(localTags || email.tags).length > 0 && (
                            <div className="flex items-center gap-1 mt-4 flex-wrap">
                                {(localTags || email.tags).map(
                                    (
                                        tag: {
                                            className?: string;
                                            label: string;
                                            name?: string;
                                            color?: string;
                                        },
                                        index: number,
                                    ) => (
                                        <span
                                            key={index}
                                            className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                                                tag.className,
                                            )}
                                            style={
                                                tag.color
                                                    ? {
                                                          backgroundColor: `${tag.color}20`,
                                                          color: tag.color,
                                                      }
                                                    : {
                                                          backgroundColor:
                                                              "#f3f4f6",
                                                          color: "#4b5563",
                                                      }
                                            }
                                        >
                                            {tag.label || tag.name}
                                        </span>
                                    ),
                                )}
                            </div>
                        )}
                    </div>

                    {/* Email Content - Sandboxed in iframe to prevent any style leakage */}
                    <div className="border-t border-gray-100 pt-8">
                        <iframe
                            className="w-full border-0 bg-transparent"
                            style={{
                                minHeight: "400px",
                                height: "auto",
                            }}
                            sandbox="allow-same-origin"
                            srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="UTF-8">
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                            font-size: 14px;
                                            line-height: 1.6;
                                            color: #1f2937;
                                            padding: 0;
                                            margin: 0;
                                        }
                                        * {
                                            box-sizing: border-box;
                                        }
                                    </style>
                                </head>
                                <body>
                                    ${email.content || ""}
                                </body>
                                </html>
                            `}
                            onLoad={(e) => {
                                const iframe = e.target as HTMLIFrameElement;
                                if (iframe.contentWindow) {
                                    const height =
                                        iframe.contentWindow.document.body
                                            .scrollHeight;
                                    iframe.style.height = height + "px";
                                }
                            }}
                        />
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-8 py-4 border-t border-b border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                {email.attachments.length}{" "}
                                {t("mail.attachments")}
                            </h4>
                            <div className="flex gap-4 flex-wrap">
                                {email.attachments.map(
                                    (
                                        file: {
                                            id: string;
                                            fileName: string;
                                            size: string;
                                            contentType: string;
                                        },
                                        idx: number,
                                    ) => {
                                        // Extract file extension from fileName
                                        const ext =
                                            file.fileName
                                                .split(".")
                                                .pop()
                                                ?.toLowerCase() || "";

                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-white/50 transition-colors cursor-pointer group bg-white/60 w-64"
                                                onClick={async () => {
                                                    if (!orgId || !file.id)
                                                        return;
                                                    try {
                                                        await downloadAttachment(
                                                            orgId,
                                                            file.id,
                                                            file.fileName,
                                                        );
                                                        // toast.success(
                                                        //     "Đã tải file thành công"
                                                        // );
                                                    } catch (error) {
                                                        toast.error(
                                                            "Không thể tải file",
                                                        );
                                                    }
                                                }}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-10 h-10 rounded flex items-center justify-center shrink-0",
                                                        ext === "pdf"
                                                            ? "bg-red-100 text-red-600"
                                                            : ext === "doc" ||
                                                                ext === "docx"
                                                              ? "bg-blue-100 text-blue-600"
                                                              : ext === "xls" ||
                                                                  ext === "xlsx"
                                                                ? "bg-green-100 text-green-600"
                                                                : ext ===
                                                                        "ppt" ||
                                                                    ext ===
                                                                        "pptx"
                                                                  ? "bg-orange-100 text-orange-600"
                                                                  : ext ===
                                                                          "jpg" ||
                                                                      ext ===
                                                                          "jpeg" ||
                                                                      ext ===
                                                                          "png" ||
                                                                      ext ===
                                                                          "gif"
                                                                    ? "bg-purple-100 text-purple-600"
                                                                    : ext ===
                                                                            "zip" ||
                                                                        ext ===
                                                                            "rar"
                                                                      ? "bg-yellow-100 text-yellow-600"
                                                                      : "bg-gray-100 text-gray-600",
                                                    )}
                                                >
                                                    <span className="text-xs font-bold uppercase">
                                                        {ext}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate text-gray-700">
                                                        {file.fileName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {file.size}
                                                    </div>
                                                </div>
                                                <Download className="h-5 w-5 text-gray-400 group-hover:text-[#5c46e6]" />
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {confirmDialog}

            {/* Forward Email Dialog */}
            {forwardDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t("mail.forwardTitle")}
                            </h3>
                            <button
                                onClick={() => setForwardDialogOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("mail.toRecipient")}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent"
                                    placeholder="email@example.com (phân cách bằng dấu phẩy)"
                                    value={forwardTo}
                                    onChange={(e) =>
                                        setForwardTo(e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("mail.cc")}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent"
                                    placeholder="email@example.com (phân cách bằng dấu phẩy)"
                                    value={forwardCc}
                                    onChange={(e) =>
                                        setForwardCc(e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("mail.additionalMessage")}
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5c46e6] focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder={t(
                                        "mail.addMessagePlaceholder",
                                    )}
                                    value={forwardMessage}
                                    onChange={(e) =>
                                        setForwardMessage(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="includeAttachments"
                                    className="w-4 h-4 text-[#5c46e6] border-gray-300 rounded focus:ring-[#5c46e6]"
                                    checked={forwardIncludeAttachments}
                                    onChange={(e) =>
                                        setForwardIncludeAttachments(
                                            e.target.checked,
                                        )
                                    }
                                />
                                <label
                                    htmlFor="includeAttachments"
                                    className="text-sm text-gray-700"
                                >
                                    {t("mail.includeAttachments")}
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setForwardDialogOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                {t("mail.cancel")}
                            </button>
                            <button
                                onClick={handleForwardEmail}
                                disabled={isForwarding || !forwardTo}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#5c46e6] rounded-md hover:bg-[#4c36d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isForwarding && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {isForwarding
                                    ? t("mail.sending")
                                    : t("mail.forward")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AiEmailDialog
                isOpen={isAiDialogOpen}
                onOpenChange={setIsAiDialogOpen}
                formData={aiFormData}
                isGenerating={isGenerating}
                onFormDataChange={handleAiFormDataChange}
                onSubmit={handleAiSubmit}
            />

            <AiSummaryDialog
                isOpen={showSummaryDialog}
                onOpenChange={setShowSummaryDialog}
                isLoading={isSummarizing}
                summaryData={summaryData}
            />

            {orgId && selectedEmailId && (
                <FindLeadModal
                    orgId={orgId}
                    open={findLeadOpen}
                    onOpenChange={setFindLeadOpen}
                    conversationId={selectedEmailId}
                    onSelect={(lead: any) => {
                        console.log("Selected Lead:", lead);
                    }}
                />
            )}
            {featureDialog}
        </div>
    );
}

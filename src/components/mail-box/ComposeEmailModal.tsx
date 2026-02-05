"use client";

import React, { useState } from "react";
import {
    X,
    Paperclip,
    Send,
    Loader2,
    Maximize2,
    Minimize2,
    Trash2,
    ChevronDown,
    Save,
} from "lucide-react";
import TinyMCEEmailEditorV2 from "@/components/TinyMCEEmailEditorV2";
import EmailComposerHeaderV2 from "@/components/common/EmailComposerHeaderV2";
import AiEmailDialog from "@/components/common/AiEmailDialog";
import { AttachmentInput } from "@/components/mail-box/AttachmentInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getEmailDetail,
    getEmailList,
    getEmailTemplateDetail,
    getEmailTemplateList,
    saveDraft,
    sendEmail,
    deleteDraft,
    replyEmail,
} from "@/api/mail-box";
import { rewriteEmail } from "@/api/n8n";
import {
    convertHtmlToPlainText,
    convertNewlinesToHtml,
    extractHtml,
    getInvalidEmails,
} from "@/utils/emailHelpers";
import { useLanguage } from "@/contexts/LanguageContext";

interface ComposeEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId?: string;
    defaultConfigId?: string;
    initialData?: {
        to?: string;
        subject?: string;
        content?: string;
        cc?: string;
        bcc?: string;
        draftId?: string;
    } | null;
    replyToEmailId?: string; // ID of email being replied to
    replyAll?: boolean; // Reply to all recipients
    onDraftSaved?: (email: any) => void;
    onDraftDeleted?: (id: string) => void;
}

export function ComposeEmailModal({
    isOpen,
    onClose,
    orgId,
    defaultConfigId,
    initialData,
    replyToEmailId,
    replyAll = false,
    onDraftSaved,
    onDraftDeleted,
}: ComposeEmailModalProps) {
    const { t } = useLanguage();
    // Email State
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [ccEmail, setCcEmail] = useState("");
    const [bccEmail, setBccEmail] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [draftId, setDraftId] = useState<string>("");
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    // Config & Template State
    const [templates, setTemplates] = useState<any[]>([]);
    const [configs, setConfigs] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedConfigId, setSelectedConfigId] = useState<string>(
        defaultConfigId || "",
    );
    const [selectKey, setSelectKey] = useState<number>(0);

    // AI State
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sessionId, setSessionId] = useState<string>("");
    const [aiFormData, setAiFormData] = useState({
        sessionId: "",
        language: "vi",
        subject: "",
        prompt: "",
        content: "",
        tone: "",
        length: "",
    });

    const editorRef = React.useRef<any>(null);

    // Generate Session ID
    React.useEffect(() => {
        setSessionId(uuidv4());
    }, []);

    // Helper to update content and editor
    const updateEditorContent = (newContent: string) => {
        setContent(newContent);
        if (editorRef.current) {
            editorRef.current.setContent(newContent);
        }
    };

    // Load Data
    React.useEffect(() => {
        if (!orgId || !isOpen) return;
        const loadData = async () => {
            try {
                const [templatesRes, configsRes] = await Promise.all([
                    getEmailTemplateList(orgId),
                    getEmailList(orgId, { limit: 1000 }),
                ]);
                const templatesData = templatesRes as any;
                const configsData = configsRes as any;

                // Handle templates - may have code field or not
                if (templatesData?.content) {
                    setTemplates(templatesData.content || []);
                }

                // Handle configs - new API returns content array directly
                const loadedConfigs =
                    configsData?.content ||
                    (Array.isArray(configsData) ? configsData : []);

                // Always set configs, even if empty
                setConfigs(loadedConfigs);

                if (loadedConfigs.length > 0) {
                    // Set default from email based on defaultConfigId or first config
                    const targetConfigId =
                        defaultConfigId || loadedConfigs[0].id;

                    if (targetConfigId) {
                        const config = loadedConfigs.find(
                            (c: any) => c.id === targetConfigId,
                        );
                        if (config) {
                            setSelectedConfigId(targetConfigId);
                            // Try different field names for email display
                            const displayEmail =
                                config.emailAddress ||
                                config.userName ||
                                config.email ||
                                config.fromEmail ||
                                config.displayName ||
                                "";
                            setFromEmail(displayEmail);

                            // Load signature/body if present, but ONLY if we don't have initial content
                            // to avoid overwriting draft content or reply quotes
                            if (config.body && !initialData?.content) {
                                const html = extractHtml(config.body);
                                updateEditorContent(html);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading templates/configs:", error);
            }
        };
        loadData();
    }, [orgId, isOpen, defaultConfigId, initialData]);

    // Handle initialData
    React.useEffect(() => {
        if (isOpen && initialData) {
            if (initialData.to) setTo(initialData.to);
            if (initialData.subject) setSubject(initialData.subject);
            if (initialData.content) updateEditorContent(initialData.content);
            if (initialData.cc) setCcEmail(initialData.cc);
            if (initialData.bcc) setBccEmail(initialData.bcc);
            if (initialData.draftId) setDraftId(initialData.draftId);
        } else if (isOpen && !initialData) {
            // Reset fields if opened without initial data (e.g. fresh compose)
            // But we might want to keep defaultConfig logic which sets fromEmail
            setTo("");
            setSubject("");
            updateEditorContent("");
            setCcEmail("");
            setBccEmail("");
            setDraftId("");
            setAttachments([]);
        }
    }, [isOpen, initialData]);

    // Handle Template Change
    const handleTemplateChange = async (value: string) => {
        if (value === "__clear__") {
            updateEditorContent("");
            setSelectedTemplateId("");
            setSelectKey((prev) => prev + 1);
            return;
        }
        setSelectedTemplateId(value);

        // Load details
        if (orgId) {
            try {
                const res = (await getEmailTemplateDetail(orgId, value)) as any;
                if (res?.code === 0 && res?.content) {
                    const html = extractHtml(res.content.body);
                    updateEditorContent(html);
                    if (res.content.subject) setSubject(res.content.subject);
                }
            } catch (error) {
                console.error("Error loading template detail:", error);
            }
        }
    };

    // Handle Config Change
    const handleConfigChange = async (value: string) => {
        if (value === "__clear__") {
            setSelectedConfigId("");
            setFromEmail("");
            // Optional: clear signature? For now just keep content
            return;
        }
        setSelectedConfigId(value);

        if (orgId) {
            try {
                const res = (await getEmailDetail(orgId, value)) as any;
                if (res?.code === 0 && res?.content) {
                    if (res.content.body)
                        updateEditorContent(extractHtml(res.content.body));
                    if (res.content.subject) setSubject(res.content.subject);
                    if (res.content.userName)
                        setFromEmail(res.content.userName);
                    else if (res.content.fromEmail)
                        setFromEmail(res.content.fromEmail);
                }
            } catch (error) {
                console.error("Error loading config detail:", error);
            }
        }
    };

    // AI Handlers
    const handleOpenAiDialog = () => {
        const currentContent = editorRef.current?.getContent() || "";
        const plainTextContent = convertHtmlToPlainText(currentContent);
        setAiFormData({
            sessionId: sessionId,
            language: "vi",
            subject: subject,
            prompt: "",
            content: plainTextContent,
            tone: "",
            length: "",
        });
        setIsAiDialogOpen(true);
    };

    const handleAiSubmit = async () => {
        if (!orgId) return;
        try {
            setIsGenerating(true);
            const response = (await rewriteEmail(aiFormData)) as any;
            if (response?.generated_email) {
                if (response.generated_email.subject_line)
                    setSubject(response.generated_email.subject_line);
                if (response.generated_email.body)
                    updateEditorContent(
                        convertNewlinesToHtml(response.generated_email.body),
                    );
                toast.success("Tạo email thành công!");
                setIsAiDialogOpen(false);
            }
        } catch (error) {
            console.error("Error generating email:", error);
            toast.error("Lỗi khi tạo email");
        } finally {
            setIsGenerating(false);
        }
    };

    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        // Check if any email accounts are configured
        if (!configs || configs.length === 0) {
            toast.error(
                "Chưa có tài khoản email nào. Vui lòng vào Thiết lập để cấu hình tài khoản email.",
                {
                    duration: 5000,
                },
            );
            return;
        }

        if (!orgId || !selectedConfigId) {
            toast.error(t("mail.validate.noRecipient"));
            return;
        }

        setIsSending(true);
        try {
            const htmlContent = editorRef.current?.getContent() || content;
            const textContent = convertHtmlToPlainText(htmlContent);

            // If replying to an email, use replyEmail API
            if (replyToEmailId) {
                await replyEmail(orgId, replyToEmailId, {
                    outgoingAccountId: selectedConfigId,
                    bodyText: textContent,
                    bodyHtml: htmlContent,
                    replyAll: replyAll,
                    attachments:
                        attachments.length > 0 ? attachments : undefined,
                });
                toast.success(t("mail.replySuccess"));
            } else {
                // New email composition
                if (!to) {
                    toast.error(t("mail.validate.noRecipient"));
                    setIsSending(false);
                    return;
                }

                // Validate emails
                const invalidTo = getInvalidEmails(to);
                if (invalidTo.length > 0) {
                    toast.error(
                        `Email người nhận không hợp lệ: ${invalidTo.join(", ")}`,
                    );
                    setIsSending(false);
                    return;
                }

                if (ccEmail) {
                    const invalidCc = getInvalidEmails(ccEmail);
                    if (invalidCc.length > 0) {
                        toast.error(
                            `Email CC không hợp lệ: ${invalidCc.join(", ")}`,
                        );
                        setIsSending(false);
                        return;
                    }
                }

                if (bccEmail) {
                    const invalidBcc = getInvalidEmails(bccEmail);
                    if (invalidBcc.length > 0) {
                        toast.error(
                            `Email BCC không hợp lệ: ${invalidBcc.join(", ")}`,
                        );
                        setIsSending(false);
                        return;
                    }
                }

                await sendEmail(orgId, {
                    outgoingAccountId: selectedConfigId,
                    toAddresses: to
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
                    subject: subject,
                    bodyText: textContent,
                    bodyHtml: htmlContent,
                    attachments:
                        attachments.length > 0 ? attachments : undefined,
                });

                // If we sent successfully and this was a draft, delete the draft
                if (draftId) {
                    try {
                        await deleteDraft(orgId, selectedConfigId, draftId);
                        onDraftDeleted?.(draftId);
                    } catch (e) {
                        console.error(
                            "Failed to delete draft after sending:",
                            e,
                        );
                    }
                }

                toast.success(t("mail.sendSuccess"));
            }

            onClose();
        } catch (error: any) {
            console.error("Send email error:", error);
            toast.error(
                error?.response?.data?.message || "Không thể gửi email",
            );
        } finally {
            setIsSending(false);
        }
    };

    const saveDraftInternal = async (
        shouldClose: boolean = false,
        showToast: boolean = true,
    ) => {
        if (!orgId || !selectedConfigId) {
            if (showToast) toast.error("Vui lòng chọn tài khoản gửi");
            return false;
        }

        // Check if there is any content to save
        const htmlContent = editorRef.current?.getContent() || content;
        const textContent = convertHtmlToPlainText(htmlContent);

        // Check if content matches the signature of the selected account
        let isSignatureOnly = false;
        if (orgId && selectedConfigId) {
            const currentConfig = configs.find(
                (c) => c.id === selectedConfigId,
            );
            if (currentConfig?.body) {
                const signatureHtml = extractHtml(currentConfig.body);
                const signatureText = convertHtmlToPlainText(signatureHtml);
                if (textContent.trim() === signatureText.trim()) {
                    isSignatureOnly = true;
                }
            } else if (!textContent.trim()) {
                isSignatureOnly = true;
            }
        }

        // If no config found or no signature, and text is empty, it's "signature/empty only"
        if (!textContent.trim()) isSignatureOnly = true;

        const hasContent =
            to ||
            subject ||
            !isSignatureOnly ||
            attachments.length > 0 ||
            ccEmail ||
            bccEmail;

        if (!hasContent) {
            if (shouldClose) {
                onClose();
            }
            return true; // Nothing to save, proceed
        }

        setIsSavingDraft(true);
        try {
            const res = (await saveDraft(orgId, selectedConfigId, {
                draftId: draftId || undefined,
                toAddresses: to
                    ? to
                          .split(",")
                          .map((e) => e.trim())
                          .filter(Boolean)
                    : [],
                ccAddresses: ccEmail
                    ? ccEmail
                          .split(",")
                          .map((e) => e.trim())
                          .filter(Boolean)
                    : [],
                bccAddresses: bccEmail
                    ? bccEmail
                          .split(",")
                          .map((e) => e.trim())
                          .filter(Boolean)
                    : [],
                subject: subject,
                bodyText: textContent,
                bodyHtml: htmlContent,
                attachments: attachments.length > 0 ? attachments : undefined,
            })) as any;

            if (res?.content?.id) {
                // If we get an ID back, update state if we were staying open
                setDraftId(res.content.id);
            }

            // Notify parent with FULL data (merge response with local state to ensure UI updates immediately)
            if (onDraftSaved) {
                const updatedDraftId = res?.content?.id || draftId;
                if (updatedDraftId) {
                    const fullDraftData = {
                        ...(res?.content || {}),
                        id: updatedDraftId,
                        subject: subject,
                        bodyHtml: htmlContent,
                        bodyText: textContent,
                        toAddresses: to
                            ? to
                                  .split(",")
                                  .map((e) => e.trim())
                                  .filter(Boolean)
                            : [],
                        // Use current time if API didn't return it logic is also handled in parent,
                        // but setting it here doesn't hurt.
                        lastModifiedDate:
                            res?.content?.lastModifiedDate ||
                            new Date().toISOString(),
                    };
                    onDraftSaved(fullDraftData);
                }
            }

            if (showToast) toast.success(t("mail.draftSaved"));

            if (shouldClose) {
                onClose();
            }
            return true;
        } catch (error: any) {
            console.error("Save draft error:", error);
            if (showToast) {
                toast.error(
                    error?.response?.data?.message || "Không thể lưu nháp",
                );
            }
            return false;
        } finally {
            setIsSavingDraft(false);
        }
    };

    const isClosingRef = React.useRef(false);

    // Reset closing state when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            isClosingRef.current = false;
        }
    }, [isOpen]);

    const handleSaveDraft = () => {
        if (isClosingRef.current) return;
        saveDraftInternal(false, true);
    };

    const handleClose = async () => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;

        // Attempt to save draft before closing
        // We only save if there's actual content (checked inside saveDraftInternal)
        await saveDraftInternal(true, true);
    };

    const handleDiscard = () => {
        // Just close, don't save
        isClosingRef.current = true;
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    handleClose();
                }
            }}
        >
            <DialogContent
                className="min-w-[70vw] max-w-[90vw] p-0 gap-0 bg-white h-[85vh] flex flex-col shadow-2xl rounded-xl border border-gray-200"
                showCloseButton={false}
            >
                <DialogHeader className="px-4 py-3 border-b border-gray-100 shrink-0 flex flex-row items-center justify-between h-[52px]">
                    <DialogTitle className="text-lg leading-none font-semibold">
                        {initialData ? t("mail.reply") : t("mail.compose")}
                    </DialogTitle>
                    <div className="w-16" /> {/* Spacer to balance header */}{" "}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-8 w-8"
                        onClick={handleClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
                        <EmailComposerHeaderV2
                            templates={templates}
                            configs={configs}
                            selectedTemplateId={selectedTemplateId}
                            selectedConfigId={selectedConfigId}
                            fromEmail={fromEmail}
                            toEmail={to}
                            ccEmail={ccEmail}
                            bccEmail={bccEmail}
                            subject={subject}
                            selectKey={selectKey}
                            onTemplateChange={handleTemplateChange}
                            onConfigChange={handleConfigChange}
                            onFromEmailChange={setFromEmail}
                            onToEmailChange={setTo}
                            onCcEmailChange={setCcEmail}
                            onBccEmailChange={setBccEmail}
                            onSubjectChange={setSubject}
                            onOpenAiDialog={handleOpenAiDialog}
                            editorRef={editorRef}
                            orgId={orgId}
                        />
                        <div className="flex flex-col">
                            <div className="relative min-h-[300px]">
                                <TinyMCEEmailEditorV2
                                    id="compose-editor"
                                    initialValue={initialData?.content || ""}
                                    onChange={setContent}
                                    onReady={(editor) => {
                                        editorRef.current = editor;
                                        // If content exists map/state but editor is empty, sync it
                                        // This handles race condition where state was updated before editor was ready
                                        const currentContent =
                                            editor.getContent();
                                        if (content && !currentContent) {
                                            editor.setContent(content);
                                        }
                                    }}
                                    orgId={orgId}
                                />
                            </div>
                            <AttachmentInput onFilesChange={setAttachments} />
                        </div>
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                            onClick={handleDiscard}
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={isSavingDraft}
                                onClick={handleSaveDraft}
                                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                            >
                                {isSavingDraft ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t("mail.savingDraft")}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {t("mail.saveDraft")}
                                    </>
                                )}
                            </Button>
                            {/* <Button
                                variant="outline"
                                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                            >
                                Preview
                            </Button> */}
                            <div className="flex bg-linear-to-r from-[#5c46e6] to-[#4c36d6] rounded-lg shadow-md hover:opacity-90 transition-opacity">
                                <Button
                                    onClick={handleSend}
                                    disabled={isSending}
                                    className="bg-transparent hover:bg-transparent text-white border-0 shadow-none px-4 rounded-r-none h-9 disabled:opacity-70"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t("mail.sending")}
                                        </>
                                    ) : (
                                        t("mail.send")
                                    )}
                                </Button>
                                {/* <div className="w-px bg-white/20 my-1" />
                                <Button className="bg-transparent hover:bg-transparent text-white border-0 shadow-none px-2 rounded-l-none h-9">
                                    <ChevronDown className="w-4 h-4" />
                                </Button> */}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>

            <AiEmailDialog
                isOpen={isAiDialogOpen}
                onOpenChange={setIsAiDialogOpen}
                formData={aiFormData}
                isGenerating={isGenerating}
                onFormDataChange={(data) =>
                    setAiFormData((prev) => ({ ...prev, ...data }))
                }
                onSubmit={handleAiSubmit}
            />
        </Dialog>
    );
}

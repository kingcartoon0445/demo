import {
    getEmailDetail,
    getEmailList,
    getEmailTemplateDetail,
    getEmailTemplateList,
    getTemplateIncludeVariable,
} from "@/api/email";
import { sendEmail } from "@/api/orgV2";
import { rewriteEmail } from "@/api/n8n";
import TinyMCEEmailEditor from "@/components/TinyMCEEmailEditor";
import {
    convertHtmlToPlainText,
    convertNewlinesToHtml,
    extractHtml,
} from "@/utils/emailHelpers";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import AiEmailDialog from "./AiEmailDialog";
import EmailComposerHeader from "./EmailComposerHeader";
import { Button } from "../ui/button";
import { SendIcon } from "lucide-react";

type Props = {
    orgId?: string;
    customer?: any; // Customer object để lấy email
    provider?: "lead" | "customer";
};

export default function SendMail({
    orgId: propOrgId,
    customer,
    provider: propProvider,
}: Props) {
    const params = useParams();
    const orgId = propOrgId || (params?.orgId as string) || "";
    const [templates, setTemplates] = useState<any[]>([]);
    const [configs, setConfigs] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedConfigId, setSelectedConfigId] = useState<string>("");
    const [editorContent, setEditorContent] = useState<string>("");
    const [editorKey, setEditorKey] = useState<number>(0);
    const [selectKey, setSelectKey] = useState<number>(0);
    const editorRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [fromEmail, setFromEmail] = useState<string>("");
    const [toEmail, setToEmail] = useState<string>("");
    const [ccEmail, setCcEmail] = useState<string>("");
    const [bccEmail, setBccEmail] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [isSending, setIsSending] = useState(false);

    // Session ID - tự động generate khi component mount
    const [sessionId, setSessionId] = useState<string>("");

    // AI Dialog states
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiFormData, setAiFormData] = useState({
        sessionId: "",
        language: "vi",
        subject: "",
        prompt: "",
        content: "",
        tone: "",
        length: "",
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate sessionId khi component mount
    useEffect(() => {
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
    }, []);

    // Load templates và configs
    useEffect(() => {
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
                console.error("Lỗi khi load templates/configs:", error);
            }
        };
        loadData();
    }, [orgId]);

    // Lấy refId từ customer
    const refId =
        customer?.id || customer?.customer?.id || customer?.lead?.id || "";

    // Handler cho việc chọn template
    const handleTemplateChange = (value: string) => {
        if (value === "__clear__") {
            setEditorContent("");
            setEditorKey((prev) => prev + 1);
            setSelectedTemplateId("");
            setSelectKey((prev) => prev + 1);
            return;
        }
        setSelectedTemplateId(value);
    };

    // Load template detail khi chọn template
    useEffect(() => {
        if (!selectedTemplateId || !orgId) return;
        const loadTemplateDetail = async () => {
            try {
                setLoading(true);

                // Nếu có provider và refId thì gọi API getTemplateIncludeVariable
                // để lấy template đã được replace biến với giá trị thật
                let res: any;
                if (propProvider && refId) {
                    res = (await getTemplateIncludeVariable(
                        orgId,
                        selectedTemplateId,
                        propProvider,
                        refId,
                    )) as any;
                } else {
                    res = (await getEmailTemplateDetail(
                        orgId,
                        selectedTemplateId,
                    )) as any;
                }

                if (res?.code === 0 && res?.content) {
                    const html = extractHtml(res.content.body);
                    setEditorContent(html);
                    setEditorKey((prev) => prev + 1);
                    if (res.content.subject) {
                        setSubject(res.content.subject);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi load template detail:", error);
            } finally {
                setLoading(false);
            }
        };
        loadTemplateDetail();
    }, [selectedTemplateId, orgId, propProvider, refId]);

    // Load config detail khi chọn config
    useEffect(() => {
        if (!selectedConfigId || !orgId) return;
        const loadConfigDetail = async () => {
            try {
                setLoading(true);
                const res = (await getEmailDetail(
                    orgId,
                    selectedConfigId,
                )) as any;
                if (res?.code === 0 && res?.content) {
                    // Chỉ update editor nếu có body trong config
                    if (res.content.body) {
                        const html = extractHtml(res.content.body);
                        setEditorContent(html);
                        setEditorKey((prev) => prev + 1);
                    }
                    if (res.content.subject) {
                        setSubject(res.content.subject);
                    }
                    // Lấy userName từ config response và set vào fromEmail
                    if (res.content.userName) {
                        setFromEmail(res.content.userName);
                    } else if (res.content.fromEmail) {
                        setFromEmail(res.content.fromEmail);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi load config detail:", error);
            } finally {
                setLoading(false);
            }
        };
        loadConfigDetail();
    }, [selectedConfigId, orgId]);

    // Set customer email vào toEmail khi customer thay đổi
    useEffect(() => {
        if (customer) {
            if (customer.customer?.email) {
                setToEmail(customer.customer.email);
            } else if (customer.lead?.email) {
                setToEmail(customer.lead.email);
            } else {
                setToEmail("");
            }
        }
    }, [customer]);

    // Helper để lấy content từ editor
    const getEditorContent = (): string => {
        return editorRef.current?.getContent() || "";
    };

    // Handler mở AI dialog
    const handleOpenAiDialog = () => {
        const currentContent = getEditorContent();
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

    // Handler update AI form data
    const handleAiFormDataChange = (data: Partial<typeof aiFormData>) => {
        setAiFormData((prev) => ({ ...prev, ...data }));
    };

    // Handler submit AI form
    const handleAiSubmit = async () => {
        if (!orgId) {
            toast.error("Vui lòng chọn organization");
            return;
        }

        try {
            setIsGenerating(true);
            const response = (await rewriteEmail(aiFormData)) as any;

            if (response?.generated_email) {
                if (response.generated_email.subject_line) {
                    setSubject(response.generated_email.subject_line);
                }
                if (response.generated_email.body) {
                    const htmlContent = convertNewlinesToHtml(
                        response.generated_email.body,
                    );
                    setEditorContent(htmlContent);
                    setEditorKey((prev) => prev + 1);
                }
                toast.success("Email đã được tạo thành công!");
                setIsAiDialogOpen(false);
            } else {
                toast.error("Không nhận được dữ liệu từ AI");
            }
        } catch (error: any) {
            console.error("Lỗi khi generate email:", error);
            toast.error(
                error?.response?.data?.message || "Có lỗi xảy ra khi tạo email",
            );
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper function để validate email
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Helper function để parse email string thành array (hỗ trợ nhiều email cách nhau bởi dấu phẩy)
    const parseEmailString = (emailString: string): string[] => {
        if (!emailString || !emailString.trim()) return [];
        return emailString
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email.length > 0);
    };

    // Handler gửi email
    const handleSendEmail = async () => {
        // Validation
        if (!orgId) {
            toast.error("Vui lòng chọn organization");
            return;
        }

        if (!selectedConfigId) {
            toast.error("Vui lòng chọn cấu hình email");
            return;
        }

        if (!toEmail || !toEmail.trim()) {
            toast.error("Vui lòng nhập email người nhận");
            return;
        }

        // Validate email TO
        const toEmails = parseEmailString(toEmail);
        if (toEmails.length === 0) {
            toast.error("Vui lòng nhập ít nhất một email người nhận");
            return;
        }

        for (const email of toEmails) {
            if (!validateEmail(email)) {
                toast.error(`Email không hợp lệ: ${email}`);
                return;
            }
        }

        // Validate email CC nếu có
        const ccEmails = parseEmailString(ccEmail);
        for (const email of ccEmails) {
            if (!validateEmail(email)) {
                toast.error(`Email CC không hợp lệ: ${email}`);
                return;
            }
        }

        // Validate email BCC nếu có
        const bccEmails = parseEmailString(bccEmail);
        for (const email of bccEmails) {
            if (!validateEmail(email)) {
                toast.error(`Email BCC không hợp lệ: ${email}`);
                return;
            }
        }

        if (!subject || !subject.trim()) {
            toast.error("Vui lòng nhập tiêu đề email");
            return;
        }

        const bodyContent = getEditorContent();
        if (!bodyContent || !bodyContent.trim()) {
            toast.error("Vui lòng nhập nội dung email");
            return;
        }

        try {
            setIsSending(true);

            const emailData = {
                subject: subject.trim(),
                body: bodyContent,
                to: toEmails,
                cc: ccEmails.length > 0 ? ccEmails : undefined,
                bcc: bccEmails.length > 0 ? bccEmails : undefined,
                type: propProvider, // hoặc có thể là "text" tùy vào nhu cầu
                refId:
                    customer?.id ||
                    customer?.customer?.id ||
                    customer?.lead?.id ||
                    "",
                smtpConfigId: selectedConfigId,
            };

            // Xóa các trường undefined
            if (!emailData.cc) delete emailData.cc;
            if (!emailData.bcc) delete emailData.bcc;
            if (!emailData.refId) delete emailData.refId;

            const response = (await sendEmail(orgId, emailData)) as any;

            if (response?.code === 0 || response?.success) {
                toast.success("Email đã được gửi thành công!");
                // Reset form sau khi gửi thành công (tùy chọn)
                // setToEmail("");
                // setCcEmail("");
                // setBccEmail("");
                // setSubject("");
                // setEditorContent("");
                // setEditorKey((prev) => prev + 1);
            } else {
                toast.error(
                    response?.message ||
                        "Không thể gửi email. Vui lòng thử lại.",
                );
            }
        } catch (error: any) {
            console.error("Lỗi khi gửi email:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.message ||
                    "Có lỗi xảy ra khi gửi email",
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-4 p-4">
            {/* Email Composer */}
            <div className="border rounded-lg">
                <EmailComposerHeader
                    templates={templates}
                    configs={configs}
                    selectedTemplateId={selectedTemplateId}
                    selectedConfigId={selectedConfigId}
                    fromEmail={fromEmail}
                    toEmail={toEmail}
                    ccEmail={ccEmail}
                    bccEmail={bccEmail}
                    subject={subject}
                    selectKey={selectKey}
                    onTemplateChange={handleTemplateChange}
                    onConfigChange={(value) => {
                        if (value === "__clear__") {
                            setSelectedConfigId("");
                            setFromEmail(""); // Clear email từ config
                            // Giữ lại email khách hàng (toEmail) hoặc tự động điền lại nếu có customer
                            if (customer) {
                                if (customer.customer?.email) {
                                    setToEmail(customer.customer.email);
                                } else if (customer.lead?.email) {
                                    setToEmail(customer.lead.email);
                                }
                            }
                        } else {
                            setSelectedConfigId(value);
                        }
                    }}
                    onFromEmailChange={setFromEmail}
                    onToEmailChange={setToEmail}
                    onCcEmailChange={setCcEmail}
                    onBccEmailChange={setBccEmail}
                    onSubjectChange={setSubject}
                    onOpenAiDialog={handleOpenAiDialog}
                    editorRef={editorRef}
                    provider={propProvider}
                    orgId={orgId}
                    refId={refId}
                />

                {/* TinyMCE Editor */}
                <div className="h-[400px] border-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-gray-500">Đang tải...</p>
                        </div>
                    ) : (
                        <TinyMCEEmailEditor
                            key={editorKey}
                            initialValue={editorContent}
                            orgId={orgId}
                            onReady={(editor) => {
                                editorRef.current = editor;
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    className="rounded-lg"
                    disabled={
                        !selectedConfigId || !toEmail || !subject || isSending
                    }
                    onClick={handleSendEmail}
                >
                    {isSending ? "Đang gửi..." : "Gửi"}
                    <SendIcon className="w-4 h-4" />
                </Button>
            </div>

            {/* AI Dialog */}
            <AiEmailDialog
                isOpen={isAiDialogOpen}
                onOpenChange={setIsAiDialogOpen}
                formData={aiFormData}
                isGenerating={isGenerating}
                onFormDataChange={handleAiFormDataChange}
                onSubmit={handleAiSubmit}
            />

            {/* Email History */}
            {/* <EmailHistory /> */}
        </div>
    );
}

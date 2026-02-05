"use client";

import { Button } from "@/components/ui/button";
import { Eye, Code } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { getEmailTemplateDetail, updateEmailTemplateBody } from "@/api/email";
import TinyMCEEmailEditor from "@/components/TinyMCEEmailEditor";
import SystemVariablesDialog from "@/components/common/SystemVariablesDialog";
import EmailPreviewDialog from "@/components/common/EmailPreviewDialog";

export default function EditEmailTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const orgId = params.orgId as string;

    const [editorData, setEditorData] = useState<string>("");
    const liveContentRef = useRef<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [templateData, setTemplateData] = useState<any>(null);
    const editorRef = useRef<any>(null);
    // HTML mode removed
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState<string>("");
    const [isVariablesOpen, setIsVariablesOpen] = useState(false);

    const handleBack = () => {
        router.push(`/org/${orgId}/extend/email`);
    };

    // Load template data when component mounts
    useEffect(() => {
        const templateId = searchParams.get("id");

        if (templateId) {
            loadTemplate(templateId);
        } else {
            toast.error("Không tìm thấy template ID");
            router.push(`/org/${orgId}/extend/email`);
        }
    }, [searchParams]);

    const loadTemplate = async (templateId: string) => {
        setIsLoading(true);
        try {
            // Load from API using the email API functions
            const response = (await getEmailTemplateDetail(
                orgId,
                templateId
            )) as any;

            // Handle the nested response structure
            const content = response.content || response;

            // Try to parse body as JSON first (new format), fallback to plain HTML (old format)
            let htmlContent = "";

            try {
                const parsedBody = JSON.parse(content.body || "{}");
                if (parsedBody.html) {
                    // New format with JSON structure
                    htmlContent = parsedBody.html;
                } else {
                    // Fallback to treating as plain HTML
                    htmlContent = content.body || "";
                }
            } catch (e) {
                // Not JSON, treat as plain HTML (old format)
                htmlContent = content.body || "";
            }

            const templateData = {
                id: content.id,
                name: content.name,
                subject: content.subject,
                description: content.description,
                html: htmlContent,
                body: htmlContent,
                createdAt: content.createdDate,
                updatedAt: content.lastModifiedDate,
            };

            setTemplateData(templateData);
            setEditorData(templateData.html || "");
            liveContentRef.current = templateData.html || "";
        } catch (error) {
            console.error("Error loading template:", error);
            toast.error("Không thể tải mẫu");
            router.push(`/org/${orgId}/extend/email`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariableSelect = async (variable: string) => {
        const editor = editorRef.current;
        try {
            if (editor && typeof editor.insertContent === "function") {
                editor.insertContent(variable);
                toast.success(`Đã chèn: ${variable}`);
                return;
            }
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(variable);
            toast.success(`Đã copy: ${variable}`);
        } catch (error) {
            console.error("Error inserting variable:", error);
            navigator.clipboard.writeText(variable);
            toast.success(`Đã copy: ${variable}`);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const templateId = searchParams.get("id");
            if (!templateId) {
                toast.error("Không tìm thấy mẫu ID");
                return;
            }

            // Get the current content based on mode
            const currentContent =
                (editorRef.current &&
                typeof (editorRef.current as any).getContent === "function"
                    ? (editorRef.current as any).getContent()
                    : liveContentRef.current) || "";

            // Save HTML content
            const templateBody = {
                html: currentContent || "",
                editor: "tinymce",
                version: "1.0",
            };

            // Save to API using the email API functions
            await updateEmailTemplateBody(orgId, templateId, {
                body: JSON.stringify(templateBody),
            });

            toast.success("Đã lưu mẫu");

            // Navigate back to email page
            router.push(`/org/${orgId}/extend/email`);
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error("Lỗi khi lưu mẫu");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white relative z-10">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Chỉnh sửa mẫu email
                        </h1>
                        {templateData && (
                            <p className="text-sm text-muted-foreground">
                                {templateData.name} - {templateData.subject}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsVariablesOpen(true)}
                    >
                        <Code className="h-4 w-4 mr-2" />
                        Biến hệ thống
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const currentContent =
                                (editorRef.current &&
                                typeof (editorRef.current as any).getContent ===
                                    "function"
                                    ? (editorRef.current as any).getContent()
                                    : liveContentRef.current) || "";
                            setPreviewContent(currentContent);
                            setIsPreviewOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem trước
                    </Button>
                    <Button variant="outline" onClick={handleBack}>
                        Quay lại
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Đang lưu..." : "Lưu"}
                    </Button>
                </div>
            </div>

            {/* Layout - Editor */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex-1 flex flex-col border rounded-lg bg-white overflow-hidden">
                    {/* Editor */}
                    <div
                        className="flex-1 flex flex-col"
                        style={{ minHeight: 0 }}
                    >
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-muted-foreground">
                                        Đang tải mẫu...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="h-full overflow-auto editor-container"
                                style={{ minHeight: 0 }}
                            >
                                <TinyMCEEmailEditor
                                    initialValue={editorData}
                                    orgId={orgId}
                                    onReady={(editor: any) => {
                                        editorRef.current = editor;
                                    }}
                                    onChange={(html: string) => {
                                        liveContentRef.current = html;
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Dialog */}
            <EmailPreviewDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                subject={templateData?.subject}
                emailContent={previewContent}
            />

            {/* Dialog cho biến hệ thống */}
            <SystemVariablesDialog
                open={isVariablesOpen}
                onOpenChange={setIsVariablesOpen}
                editorRef={editorRef}
                provider="lead"
                orgId={orgId}
                onVariableSelect={handleVariableSelect}
            />
        </div>
    );
}

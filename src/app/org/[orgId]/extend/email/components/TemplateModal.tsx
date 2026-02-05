"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface EmailTemplateData {
    name: string;
    subject: string;
    html: string;
    json?: any;
}

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: EmailTemplateData) => void;
    mode: "create" | "edit";
    initialData?: Partial<EmailTemplateData> | null;
}

export default function TemplateModal({
    isOpen,
    onClose,
    onSave,
    mode,
    initialData,
}: TemplateModalProps) {
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [builderReady, setBuilderReady] = useState(false);
    const [builderInitialized, setBuilderInitialized] = useState(false);

    const builderContainerRef = useRef<HTMLDivElement | null>(null);
    const builderInstanceRef = useRef<any>(null);

    // Load thư viện khi modal mở
    useEffect(() => {
        if (!isOpen) return;

        const loadEmailBuilder = async () => {
            if ((window as any).EmailBuilder) {
                setBuilderReady(true);
                return;
            }

            try {
                // CSS
                const cssHref =
                    "https://unpkg.com/email-builder-js@latest/dist/email-builder.css";
                if (!document.querySelector(`link[href="${cssHref}"]`)) {
                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = cssHref;
                    document.head.appendChild(link);
                }

                // JS
                const script = document.createElement("script");
                script.src =
                    "https://unpkg.com/email-builder-js@latest/dist/email-builder.umd.js";
                script.async = true;
                script.onload = () => setBuilderReady(true);
                script.onerror = () =>
                    toast.error("Không thể tải email-builder-js");
                document.head.appendChild(script);
            } catch (err) {
                console.error("Error loading builder:", err);
                toast.error("Lỗi khi tải thư viện");
            }
        };

        loadEmailBuilder();
    }, [isOpen]);

    // Reset form mỗi khi mở
    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || "");
            setSubject(initialData?.subject || "");
        } else {
            // Cleanup khi đóng
            if (builderInstanceRef.current?.destroy) {
                builderInstanceRef.current.destroy();
                builderInstanceRef.current = null;
            }
            setBuilderInitialized(false);
        }
    }, [isOpen, initialData]);

    // Khởi tạo EmailBuilder
    useEffect(() => {
        if (!isOpen || !builderReady || !builderContainerRef.current) return;

        try {
            const EmailBuilder = (window as any).EmailBuilder;
            if (!EmailBuilder) return;

            // cleanup old
            if (builderInstanceRef.current?.destroy) {
                builderInstanceRef.current.destroy();
            }

            const config: any = {
                container: builderContainerRef.current,
            };

            if (initialData?.json) {
                config.design = initialData.json;
            } else if (initialData?.html) {
                config.html = initialData.html;
            }

            builderInstanceRef.current = new EmailBuilder(config);
            setBuilderInitialized(true);
        } catch (err) {
            console.error("Init builder error:", err);
            toast.error("Không thể khởi tạo email builder");
        }

        return () => {
            if (builderInstanceRef.current?.destroy) {
                builderInstanceRef.current.destroy();
                builderInstanceRef.current = null;
            }
            setBuilderInitialized(false);
        };
    }, [isOpen, builderReady, initialData]);

    // Lưu template
    const handleSave = useCallback(async () => {
        if (!name.trim()) return toast.error("Vui lòng nhập tên template");
        if (!subject.trim()) return toast.error("Vui lòng nhập subject");
        if (!builderInstanceRef.current)
            return toast.error("Trình dựng chưa sẵn sàng");

        setIsSaving(true);
        try {
            const html = await builderInstanceRef.current.exportHtml();
            const design = await builderInstanceRef.current.exportDesign();

            if (!html || html.trim().length === 0) {
                toast.error("Vui lòng tạo nội dung email trước khi lưu");
                return;
            }

            onSave({
                name: name.trim(),
                subject: subject.trim(),
                html,
                json: design,
            });
        } catch (err) {
            console.error("Save template error:", err);
            toast.error("Lỗi khi lưu template");
        } finally {
            setIsSaving(false);
        }
    }, [name, subject, onSave]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? "Thêm template email"
                            : "Chỉnh sửa template email"}
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                    {/* Thông tin cơ bản */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="template-name">Tên template</Label>
                            <Input
                                id="template-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Chào mừng"
                            />
                        </div>
                        <div>
                            <Label htmlFor="template-subject">Subject</Label>
                            <Input
                                id="template-subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="VD: Welcome to CokaAI"
                            />
                        </div>
                    </div>

                    {/* Email Builder */}
                    <div className="space-y-2">
                        <Label>Trình dựng email</Label>
                        <div
                            ref={builderContainerRef}
                            className="border rounded-md bg-white min-h-[500px] overflow-hidden"
                        >
                            {!builderInitialized && (
                                <div className="h-[500px] flex items-center justify-center">
                                    <div className="text-center space-y-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-muted-foreground">
                                            {builderReady
                                                ? "Đang khởi tạo..."
                                                : "Đang tải thư viện..."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving
                            ? "Đang lưu..."
                            : mode === "create"
                            ? "Tạo"
                            : "Cập nhật"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

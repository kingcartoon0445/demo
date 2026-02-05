"use client";

import { useState, useEffect } from "react";
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
import TemplateGalleryModal from "@/components/editors/TemplateGalleryModal";

interface SimpleTemplateData {
    name: string;
    subject: string;
    description?: string;
    html?: string;
}

interface SimpleTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SimpleTemplateData) => void;
    mode: "create" | "edit";
    initialData?: Partial<SimpleTemplateData> | null;
}

export default function SimpleTemplateModal({
    isOpen,
    onClose,
    onSave,
    mode,
    initialData,
}: SimpleTemplateModalProps) {
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [selectedSample, setSelectedSample] = useState<{
        id: string;
        name: string;
        subject: string;
        html?: string | null;
    } | null>(null);

    // Reset form mỗi khi mở
    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || "");
            setSubject(initialData?.subject || "");
            setDescription(initialData?.description || "");
            setSelectedSample(null);
        }
    }, [isOpen, initialData]);

    // Lưu template
    const handleSave = async () => {
        if (!name.trim()) return toast.error("Vui lòng nhập tên mẫu");
        if (!subject.trim()) return toast.error("Vui lòng nhập tiêu đề");

        setIsSaving(true);
        try {
            onSave({
                name: name.trim(),
                subject: subject.trim(),
                description: description.trim(),
                html: selectedSample?.html || undefined,
            });
        } catch (err) {
            console.error("Save template error:", err);
            toast.error("Lỗi khi lưu mẫu");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? "Thêm mẫu email"
                            : "Chỉnh sửa mẫu email"}
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                    <div>
                        <Label htmlFor="template-name" className="mb-2">
                            Tên mẫu
                        </Label>
                        <Input
                            id="template-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Chào mừng"
                        />
                    </div>
                    <div>
                        <Label htmlFor="template-subject" className="mb-2">
                            Tiêu đề
                        </Label>
                        <Input
                            id="template-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="VD: Welcome to CokaAI"
                        />
                    </div>
                    <div>
                        <Label htmlFor="template-description" className="mb-2">
                            Mô tả
                        </Label>
                        <Input
                            id="template-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn cho mẫu"
                        />
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

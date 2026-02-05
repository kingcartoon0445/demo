import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type AiFormData = {
    sessionId: string;
    language: string;
    subject: string;
    prompt: string;
    content: string;
    tone: string;
    length: string;
};

type AiEmailDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    formData: AiFormData;
    isGenerating: boolean;
    onFormDataChange: (data: Partial<AiFormData>) => void;
    onSubmit: () => void;
};

export default function AiEmailDialog({
    isOpen,
    onOpenChange,
    formData,
    isGenerating,
    onFormDataChange,
    onSubmit,
}: AiEmailDialogProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const updateField = (field: keyof AiFormData, value: string) => {
        onFormDataChange({ [field]: value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>AI viết email</DialogTitle>
                    <DialogDescription>
                        Nhập yêu cầu chính. Các tùy chọn khác nằm trong mục Nâng
                        cao.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-sm font-medium">
                                Yêu cầu
                            </label>
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-sm"
                                onClick={() => setShowAdvanced((prev) => !prev)}
                            >
                                {showAdvanced ? "Ẩn nâng cao" : "Nâng cao"}
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Nhập yêu cầu..."
                            value={formData.prompt}
                            onChange={(e) =>
                                updateField("prompt", e.target.value)
                            }
                            rows={3}
                        />
                    </div>

                    {showAdvanced && (
                        <div className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">
                                    Tiêu đề
                                </label>
                                <Input
                                    placeholder="Nhập tiêu đề..."
                                    value={formData.subject}
                                    onChange={(e) =>
                                        updateField("subject", e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Ngôn ngữ
                                    </label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) =>
                                            updateField("language", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn ngôn ngữ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vi">
                                                Tiếng Việt
                                            </SelectItem>
                                            <SelectItem value="en">
                                                Tiếng Anh
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Hành văn
                                    </label>
                                    <Select
                                        value={formData.tone}
                                        onValueChange={(value) =>
                                            updateField("tone", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn giọng điệu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Lịch sự">
                                                Lịch sự
                                            </SelectItem>
                                            <SelectItem value="Nghiêm túc">
                                                Nghiêm túc
                                            </SelectItem>
                                            <SelectItem value="Thân thiện">
                                                Thân thiện
                                            </SelectItem>
                                            <SelectItem value="Chuyên nghiệp">
                                                Chuyên nghiệp
                                            </SelectItem>
                                            <SelectItem value="Thoải mái">
                                                Thoải mái
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Độ dài
                                    </label>
                                    <Select
                                        value={formData.length}
                                        onValueChange={(value) =>
                                            updateField("length", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn độ dài" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ngắn">
                                                Ngắn
                                            </SelectItem>
                                            <SelectItem value="Dài">
                                                Dài
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isGenerating}
                    >
                        Hủy
                    </Button>
                    <Button onClick={onSubmit} disabled={isGenerating}>
                        {isGenerating ? "Đang tạo..." : "Áp dụng"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

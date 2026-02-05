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
import { writeWithAI } from "@/api/n8n";
import { toast } from "react-hot-toast";

type AiPostFormData = {
    industry: string;
    style: string;
    content_length: string;
    content_type: string;
    language: string;
    prompt: string;
};

type AiPostDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    onSuccess: (content: string) => void;
};

const contentTypeOptions = [
    { key: "soft-sale", title: "Bán hàng mềm (gợi nhu cầu, nuôi dưỡng)" },
    { key: "hard-sale", title: "Bán hàng trực tiếp (chốt đơn)" },
    { key: "promotion", title: "Ưu đãi / Khuyến mãi" },
    { key: "educational", title: "Chia sẻ kiến thức / Giáo dục" },
    { key: "branding", title: "Xây dựng thương hiệu" },
    { key: "engagement", title: "Tăng tương tác (hỏi đáp, khảo sát)" },
    { key: "testimonial", title: "Đánh giá / Feedback khách hàng" },
    { key: "case-study", title: "Case study / Kết quả thực tế" },
    { key: "announcement", title: "Thông báo / Ra mắt / Cập nhật" },
    { key: "customer-care", title: "Chăm sóc & giữ chân khách hàng" },
];

const industryOptions = [
    { key: "Bất động sản", title: "Bất động sản" },
    { key: "Bán lẻ", title: "Bán lẻ" },
    { key: "F&B", title: "Nhà hàng/Ăn uống" },
    { key: "Giáo dục", title: "Giáo dục" },
    { key: "Làm đẹp", title: "Làm đẹp" },
    { key: "Công nghệ", title: "Công nghệ" },
    { key: "Thời trang", title: "Thời trang" },
    { key: "Du lịch", title: "Du lịch" },
    { key: "Khác", title: "Khác" },
];

export default function AiPostDialog({
    isOpen,
    onOpenChange,
    orgId,
    onSuccess,
}: AiPostDialogProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState<AiPostFormData>({
        industry: "",
        style: "",
        content_length: "Ngắn",
        content_type: "",
        language: "vi",
        prompt: "",
    });

    const updateField = (field: keyof AiPostFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGenerate = async () => {
        if (!formData.prompt.trim()) {
            toast.error("Vui lòng nhập yêu cầu.");
            return;
        }

        try {
            setIsGenerating(true);
            const sessionId = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            // Chỉ gửi các field advanced nếu showAdvanced là true, nếu không gửi rỗng hoặc mặc định như yêu cầu
            // Yêu cầu: "khi người dùng không bật chỗ nâng cao ra thì những ô kia để rỗng"
            // Tuy nhiên, logic ở đây là nếu user đã nhập rồi tắt advanced đi thì sao?
            // Thường thì ẩn là không dùng.
            const payload = {
                industry: showAdvanced ? formData.industry : "",
                style: showAdvanced ? formData.style : "",
                content_length: showAdvanced ? formData.content_length : "Ngắn",
                content_type: showAdvanced ? formData.content_type : "",
                channel: "facebook",
                language: formData.language, // Language nằm ở ngoài hay trong?
                // Yêu cầu: "industry thì cho nó vào bên trong phần nâng cao... language thì selector tiếng anh tiếng việt... prompt là ô yêu cầu... khi không bật nâng cao thì NHỮNG Ô KIA để rỗng"
                // Tôi sẽ để Language ra ngoài cho dễ dùng, hoặc để trong advanced nếu "những ô kia" bao gồm cả language.
                // AiEmailDialog để Language trong Advanced.
                // Tôi sẽ để Language trong Advanced cho giống AiEmailDialog nhưng user request "language thì selector tiếng anh tiếng việt" -> should be accessible?
                // Request says "prompt là ô yêu cầu". "Language selector".
                // Let's put Language in Advanced to match "những ô kia".
                // Wait, "prompt là ô yêu cầu... những ô kia để rỗng". Prompt is definitely outside.

                prompt: formData.prompt,
                sessionid: sessionId,
                organization_id: orgId,
            };

            const response = await writeWithAI(payload);

            if (
                response &&
                Array.isArray(response) &&
                response.length > 0 &&
                response[0].output
            ) {
                const output = response[0].output;
                // Combine content. Title might be useful but user just said "chèn vào chỗ nhập nội dung".
                // Typically for FB, content is the main body. Hashtags should be appended.
                // Title is bolded typically.

                let finalContent = "";
                if (output.title) finalContent += `${output.title}\n\n`;
                if (output.content) finalContent += `${output.content}\n\n`;
                if (output.hashtags) finalContent += `${output.hashtags}`;

                onSuccess(finalContent.trim());
                onOpenChange(false);
                toast.success("Đã tạo nội dung thành công!");
                // Reset form? Maybe keep for refinement.
            } else {
                toast.error("Không nhận được phản hồi phù hợp từ AI.");
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            toast.error("Có lỗi xảy ra khi tạo nội dung.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>AI viết bài Facebook</DialogTitle>
                    <DialogDescription>
                        Nhập yêu cầu để AI hỗ trợ viết bài. Các tùy chọn chi
                        tiết nằm trong mục Nâng cao.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Prompt & Language (Basic) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-sm font-medium">
                                Ngôn ngữ
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
                                <SelectItem value="vi">Tiếng Việt</SelectItem>
                                <SelectItem value="en">Tiếng Anh</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Yêu cầu</label>
                        <Textarea
                            placeholder="Nhập yêu cầu của bạn (VD: Viết bài về dự án căn hộ mới...)"
                            value={formData.prompt}
                            onChange={(e) =>
                                updateField("prompt", e.target.value)
                            }
                            rows={4}
                        />
                    </div>

                    {showAdvanced && (
                        <div className="space-y-4 pt-2 border-t mt-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Industry */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Ngành hàng
                                    </label>
                                    <Select
                                        value={formData.industry}
                                        onValueChange={(value) =>
                                            updateField("industry", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn ngành hàng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {industryOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.key}
                                                    value={opt.key}
                                                >
                                                    {opt.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Content Type */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Loại nội dung
                                    </label>
                                    <Select
                                        value={formData.content_type}
                                        onValueChange={(value) =>
                                            updateField("content_type", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn loại nội dung" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contentTypeOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.key}
                                                    value={opt.key}
                                                >
                                                    {opt.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Content Length */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Độ dài
                                    </label>
                                    <Select
                                        value={formData.content_length}
                                        onValueChange={(value) =>
                                            updateField("content_length", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn độ dài" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ngắn">
                                                Ngắn
                                            </SelectItem>
                                            <SelectItem value="Trung bình">
                                                Trung bình
                                            </SelectItem>
                                            <SelectItem value="Dài">
                                                Dài
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Style */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Phong cách
                                    </label>
                                    <Input
                                        placeholder="VD: Nhẹ nhàng, truyền cảm hứng..."
                                        value={formData.style}
                                        onChange={(e) =>
                                            updateField("style", e.target.value)
                                        }
                                    />
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
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? "Đang viết..." : "Viết bài"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

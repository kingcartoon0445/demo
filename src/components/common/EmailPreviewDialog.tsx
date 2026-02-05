"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface EmailPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject?: string;
    emailContent?: string;
    loading?: boolean;
    error?: string | null;
}

export default function EmailPreviewDialog({
    open,
    onOpenChange,
    subject,
    emailContent,
    loading,
    error,
}: EmailPreviewDialogProps) {
    // Tạo HTML content để hiển thị trong iframe
    const previewContent = emailContent
        ? `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        table {
            max-width: 100%;
        }
        pre {
            overflow-x: auto;
            max-width: 100%;
        }
    </style>
</head>
<body>
    ${emailContent}
</body>
</html>`
        : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl min-w-[90vw] h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{subject || "Xem trước email"}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden flex flex-col border rounded-lg">
                    <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                                {subject || "Email Preview"}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Xem trước nội dung email đã gửi
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 bg-white">
                        {loading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Đang tải nội dung email...
                            </div>
                        ) : error ? (
                            <div className="py-6 text-center text-sm text-destructive">
                                {error}
                            </div>
                        ) : emailContent ? (
                            <iframe
                                title="email-preview"
                                className="w-full h-full border-0 bg-white min-h-[500px]"
                                srcDoc={previewContent}
                            />
                        ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Không có nội dung để hiển thị
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

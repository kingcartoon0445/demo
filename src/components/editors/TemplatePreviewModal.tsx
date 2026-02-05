"use client";

import { useEffect } from "react";

type TemplatePreviewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    html: string | null;
    title?: string;
};

export default function TemplatePreviewModal(props: TemplatePreviewModalProps) {
    const { isOpen, onClose, html, title } = props;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-md w-[90vw] h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-3 border-b">
                    <div className="font-medium truncate max-w-[70%]">
                        {title || "Xem trước mẫu"}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
                    >
                        Đóng
                    </button>
                </div>
                <div className="flex-1 overflow-hidden bg-gray-50">
                    <iframe
                        title="preview"
                        className="w-full h-full bg-white"
                        srcDoc={
                            html ||
                            "<div style='padding:24px;font-family:sans-serif'>Không có nội dung</div>"
                        }
                    />
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import TemplatePreviewModal from "./TemplatePreviewModal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useUnlayerTemplates } from "@/hooks/useUnlayerTemplates";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type GalleryItem = {
    id: string;
    name: string;
    subject?: string;
    thumbnail?: string | null;
    html?: string | null;
    design?: any;
    source?: string;
};

type TemplateGalleryModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onApply?: (item: GalleryItem) => void;
    onAppend?: (item: GalleryItem) => void;
    unlayerApiKey?: string;
};

export default function TemplateGalleryModal(props: TemplateGalleryModalProps) {
    const { isOpen, onClose, onApply, onAppend, unlayerApiKey } = props;
    const [query, setQuery] = useState("");
    const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

    // Fetch Unlayer templates
    const {
        templates: unlayerTemplates,
        loading: unlayerLoading,
        error: unlayerError,
        refetch: refetchUnlayer,
    } = useUnlayerTemplates(unlayerApiKey);

    const makePreview = (
        html: string
    ) => `<!doctype html><html><head><meta charset='utf-8'>
<style>
  html, body { height: 100%; margin: 0; }
  body { overflow: hidden; background: #fff; }
  .wrapper { height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .content { width: 640px; max-width: 100%; }
  /* Hide scrollbars */
  ::-webkit-scrollbar { width: 0; height: 0; }
  * { scrollbar-width: none; }
  .content img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
</style></head><body>
  <div class='wrapper'><div class='content'>${html}</div></div>
</body></html>`;

    useEffect(() => {
        if (!isOpen) setQuery("");
    }, [isOpen]);

    const filteredTemplates = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return unlayerTemplates;
        return unlayerTemplates.filter((it) =>
            [it.name, it.subject]
                .filter(Boolean)
                .some((v) => (v as string).toLowerCase().includes(q))
        );
    }, [unlayerTemplates, query]);

    const TemplateGrid = ({
        templates,
        onPreview,
        onApply,
        onAppend,
        makePreview,
    }: {
        templates: GalleryItem[];
        onPreview: (item: GalleryItem) => void;
        onApply?: (item: GalleryItem) => void;
        onAppend?: (item: GalleryItem) => void;
        makePreview: (html: string) => string;
    }) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((it) => (
                <div
                    key={it.id}
                    className="border rounded-md overflow-hidden group bg-white"
                >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {it.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={it.thumbnail}
                                alt={it.name}
                                className="w-full h-full object-cover"
                            />
                        ) : it.html ? (
                            <iframe
                                title={`preview-${it.id}`}
                                className="w-full h-full"
                                style={{
                                    pointerEvents: "none",
                                }}
                                sandbox="allow-scripts allow-same-origin"
                                scrolling="no"
                                srcDoc={makePreview(it.html || "")}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                Không có xem trước
                            </div>
                        )}
                    </div>
                    <div className="p-2">
                        <div
                            className="text-sm font-medium truncate"
                            title={it.name}
                        >
                            {it.name}
                        </div>
                        {it.subject && (
                            <div
                                className="text-xs text-muted-foreground truncate"
                                title={it.subject}
                            >
                                {it.subject}
                            </div>
                        )}
                    </div>
                    <div className="p-2 pt-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="px-2 py-1 text-xs border rounded hover:bg-muted"
                            onClick={() => onPreview(it)}
                        >
                            Xem trước
                        </button>

                        <button
                            className="px-2 py-1 text-xs border rounded hover:bg-primary hover:text-white"
                            onClick={() => onApply && onApply(it)}
                        >
                            Áp dụng
                        </button>
                        {onAppend && (
                            <button
                                className="px-2 py-1 text-xs border rounded hover:bg-primary/80 hover:text-white"
                                onClick={() => onAppend(it)}
                            >
                                Thêm vào cuối
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="min-w-[90vw] overflow-y-auto h-[70vh]"
                aria-describedby="template-gallery-desc"
            >
                <DialogHeader>
                    <DialogTitle>Chọn mẫu từ thư viện</DialogTitle>
                </DialogHeader>
                <p id="template-gallery-desc" className="sr-only">
                    Chọn mẫu email từ thư viện để áp dụng vào nội dung
                </p>

                <div className="flex items-center gap-3 px-3 pt-3">
                    <input
                        placeholder="Tìm kiếm mẫu..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 border rounded px-3 py-1 text-sm"
                    />
                    {unlayerLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                </div>

                <div className="flex-1 overflow-auto p-4">
                    {unlayerError ? (
                        <div className="text-center py-8">
                            <div className="text-sm text-red-600 mb-2">
                                {unlayerError}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refetchUnlayer}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Thử lại
                            </Button>
                        </div>
                    ) : unlayerLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <div className="text-sm text-muted-foreground">
                                Đang tải mẫu từ thư viện...
                            </div>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-sm text-muted-foreground">
                                {unlayerApiKey
                                    ? "Không có mẫu nào"
                                    : "Cần API key để tải mẫu từ thư viện"}
                            </div>
                        </div>
                    ) : (
                        <TemplateGrid
                            templates={filteredTemplates}
                            onPreview={setPreviewItem}
                            onApply={onApply}
                            onAppend={onAppend}
                            makePreview={makePreview}
                        />
                    )}
                </div>

                <TemplatePreviewModal
                    isOpen={!!previewItem}
                    onClose={() => setPreviewItem(null)}
                    html={previewItem?.html || null}
                    title={previewItem?.name}
                />
            </DialogContent>
        </Dialog>
    );
}

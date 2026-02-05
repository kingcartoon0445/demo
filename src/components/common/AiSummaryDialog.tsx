import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type AiSummaryDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading: boolean;
    summaryData: {
        subject_line?: string;
        body?: string;
    } | null;
};

export default function AiSummaryDialog({
    isOpen,
    onOpenChange,
    isLoading,
    summaryData,
}: AiSummaryDialogProps) {
    const { t } = useLanguage();
    const handleCopy = () => {
        if (!summaryData) return;
        const textToCopy = `Subject: ${summaryData.subject_line}\n\n${summaryData.body}`;
        navigator.clipboard.writeText(textToCopy);
        toast.success(t("mail.copiedToClipboard"));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-[#5c46e6] text-xl">✨</span>
                        {t("mail.aiSummaryTitle")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Loader2 className="w-10 h-10 animate-spin text-[#5c46e6] mb-4" />
                            <p className="text-lg font-medium">
                                {t("mail.analyzing")}
                            </p>
                            <p className="text-sm opacity-80 mt-1">
                                {t("mail.pleaseWait")}
                            </p>
                        </div>
                    ) : summaryData ? (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            {summaryData.body && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                        {t("mail.summaryContent")}
                                    </h4>
                                    <div
                                        className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: summaryData.body,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <p>{t("mail.noSummaryData")}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

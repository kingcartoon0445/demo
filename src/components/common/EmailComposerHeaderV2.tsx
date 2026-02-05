import React, { useState } from "react";
import { Sparkles, Code, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import SystemVariablesDialog from "./SystemVariablesDialog";
import { EmailAutocomplete } from "@/components/mail-box/EmailAutocomplete";
import { useLanguage } from "@/contexts/LanguageContext";

type EmailComposerHeaderV2Props = {
    templates: any[];
    configs: any[];
    selectedTemplateId: string;
    selectedConfigId: string;
    fromEmail: string;
    toEmail: string;
    ccEmail?: string;
    bccEmail?: string;
    subject: string;
    selectKey: number;
    onTemplateChange: (value: string) => void;
    onConfigChange: (value: string) => void;
    onFromEmailChange: (value: string) => void;
    onToEmailChange: (value: string) => void;
    onCcEmailChange?: (value: string) => void;
    onBccEmailChange?: (value: string) => void;
    onSubjectChange: (value: string) => void;
    onOpenAiDialog: () => void;
    editorRef?: React.RefObject<any>;
    provider?: "lead" | "customer";
    orgId?: string;
    refId?: string;
};

export default function EmailComposerHeaderV2({
    templates,
    configs,
    selectedTemplateId,
    selectedConfigId,
    fromEmail,
    toEmail,
    ccEmail = "",
    bccEmail = "",
    subject,
    selectKey,
    onTemplateChange,
    onConfigChange,
    onFromEmailChange,
    onToEmailChange,
    onCcEmailChange,
    onBccEmailChange,
    onSubjectChange,
    onOpenAiDialog,
    editorRef,
    provider,
    orgId,
    refId,
}: EmailComposerHeaderV2Props) {
    const { t } = useLanguage();
    const [isVariablesOpen, setIsVariablesOpen] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);

    return (
        <div className="p-4 space-y-4 bg-transparent">
            {/* From Row */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
                <label className="text-sm text-gray-400 w-16 font-normal">
                    {t("mail.from")}:
                </label>
                <div className="flex-1">
                    <Select
                        value={selectedConfigId}
                        onValueChange={onConfigChange}
                    >
                        <SelectTrigger className="w-full border-0 focus:ring-0 focus:ring-offset-0 h-8 bg-transparent p-0 text-gray-800 shadow-none">
                            <SelectValue placeholder={t("mail.selectSender")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__clear__">
                                --- {t("mail.selectSender")} ---
                            </SelectItem>
                            {configs.map((cfg) => (
                                <SelectItem key={cfg.id} value={cfg.id}>
                                    {cfg.userName ||
                                        cfg.fromEmail ||
                                        cfg.name ||
                                        `${cfg.emailAddress}`}
                                    {cfg.fromEmail && ` <${cfg.fromEmail}>`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* To Row */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
                <label className="text-sm text-gray-400 w-16 font-normal">
                    {t("mail.to")}:
                </label>
                <div className="flex-1 relative">
                    <EmailAutocomplete
                        value={toEmail}
                        onChange={onToEmailChange}
                        placeholder=""
                        orgId={orgId || ""}
                    />
                    {/* Only show Bcc/Cc toggles if not active? Actually mac mail shows them in header or hover. Keeping widely available for now but styled simpler */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-3 text-xs text-gray-400 font-normal">
                        <button
                            type="button"
                            onClick={() => setShowCc(!showCc)}
                            className={`hover:text-gray-600 transition-colors ${
                                showCc ? "text-gray-800" : ""
                            }`}
                        >
                            Cc
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBcc(!showBcc)}
                            className={`hover:text-gray-600 transition-colors ${
                                showBcc ? "text-gray-800" : ""
                            }`}
                        >
                            Bcc
                        </button>
                    </div>
                </div>
            </div>

            {/* Cc Row */}
            {showCc && (
                <div className="flex items-center gap-2 border-b border-gray-100 pb-1 slide-in-from-top-1 animate-in duration-200">
                    <label className="text-sm text-gray-400 w-16 font-normal">
                        {t("mail.cc")}:
                    </label>
                    <EmailAutocomplete
                        className="flex-1"
                        placeholder=""
                        value={ccEmail}
                        onChange={(val) => onCcEmailChange?.(val)}
                        orgId={orgId || ""}
                    />
                </div>
            )}

            {/* Bcc Row */}
            {showBcc && (
                <div className="flex items-center gap-2 border-b border-gray-100 pb-1 slide-in-from-top-1 animate-in duration-200">
                    <label className="text-sm text-gray-400 w-16 font-normal">
                        {t("mail.bcc")}:
                    </label>
                    <EmailAutocomplete
                        className="flex-1"
                        placeholder=""
                        value={bccEmail}
                        onChange={(val) => onBccEmailChange?.(val)}
                        orgId={orgId || ""}
                    />
                </div>
            )}

            {/* Subject Row */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
                <label className="text-sm text-gray-400 w-16 font-normal">
                    {t("mail.subject")}:
                </label>
                <input
                    className="flex-1 h-8 px-0 text-sm border-0 focus:outline-none focus:ring-0 bg-transparent placeholder:text-gray-300"
                    placeholder=""
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                />
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                    {/* Templates Button */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-normal"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {t("mail.templates")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[300px] p-0">
                            <div className="max-h-[300px] overflow-y-auto p-1">
                                {templates.length > 0 ? (
                                    templates.map((tpl) => (
                                        <div
                                            key={tpl.id}
                                            className="px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm"
                                            onClick={() => {
                                                onTemplateChange(tpl.id);
                                                // Close popover logic would need state or use Radix primitives directly if needed,
                                                // but simplistic approach for now is fine since selecting usually closes or user clicks away.
                                                // For a controlled popover we'd need more state.
                                            }}
                                        >
                                            <div className="font-medium text-gray-900 truncate">
                                                {tpl.name ||
                                                    tpl.title ||
                                                    `Template ${tpl.id}`}
                                            </div>
                                            {tpl.subject && (
                                                <div className="text-xs text-gray-500 truncate">
                                                    {tpl.subject}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Không tìm thấy mẫu nào
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Insert Field Button */}
                    {editorRef && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-normal"
                            onClick={() => setIsVariablesOpen(true)}
                        >
                            <Code className="w-4 h-4 mr-2" />
                            {t("mail.insertField")}
                        </Button>
                    )}
                </div>

                {/* AI Write Button */}
                <Button
                    size="sm"
                    className="h-9 bg-[#5c46e6] hover:bg-[#4c36d6] text-white font-medium shadow-sm transition-all"
                    onClick={onOpenAiDialog}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("mail.writeWithAI")}
                </Button>
            </div>

            {/* System Variables Dialog */}
            {editorRef && (
                <SystemVariablesDialog
                    open={isVariablesOpen}
                    onOpenChange={setIsVariablesOpen}
                    editorRef={editorRef}
                    provider={provider}
                    orgId={orgId}
                    refId={refId}
                />
            )}
        </div>
    );
}

import React, { useState } from "react";
import { Sparkles, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import SystemVariablesDialog from "./SystemVariablesDialog";

type EmailComposerHeaderProps = {
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

export default function EmailComposerHeader({
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
}: EmailComposerHeaderProps) {
    const [isVariablesOpen, setIsVariablesOpen] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    return (
        <div className="p-3 border-b bg-gray-50">
            <div className="space-y-3">
                {/* Template và Config Select */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium w-20">
                            Template:
                        </span>
                        <Select
                            key={selectKey}
                            value={selectedTemplateId || undefined}
                            onValueChange={onTemplateChange}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Chọn mẫu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__clear__">
                                    --- Chọn mẫu ---
                                </SelectItem>
                                {templates.map((tpl) => (
                                    <SelectItem key={tpl.id} value={tpl.id}>
                                        {tpl.name ||
                                            tpl.title ||
                                            `Mẫu ${tpl.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium w-20">
                            Cấu hình:
                        </span>
                        <Select
                            value={selectedConfigId}
                            onValueChange={onConfigChange}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Chọn cấu hình" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__clear__">
                                    --- Chọn cấu hình ---
                                </SelectItem>
                                {configs.map((cfg) => (
                                    <SelectItem key={cfg.id} value={cfg.id}>
                                        {cfg.name ||
                                            cfg.title ||
                                            `Cấu hình ${cfg.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-12">Từ:</span>
                    <input
                        className="flex-1 text-sm border-0 p-1 focus:outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Nhập email gửi..."
                        value={fromEmail}
                        onChange={(e) => onFromEmailChange(e.target.value)}
                        disabled
                    />
                    <div className="ml-auto flex gap-2">
                        <button
                            type="button"
                            className={`text-xs px-2 py-1 border rounded ${
                                showCc
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : ""
                            }`}
                            onClick={() => setShowCc(!showCc)}
                        >
                            Cc
                        </button>
                        <button
                            type="button"
                            className={`text-xs px-2 py-1 border rounded ${
                                showBcc
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : ""
                            }`}
                            onClick={() => setShowBcc(!showBcc)}
                        >
                            Bcc
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-12">Đến:</span>
                    <input
                        className="flex-1 text-sm border-0 p-1 focus:outline-none bg-transparent"
                        placeholder="Nhập email nhận (có thể nhập nhiều email cách nhau bởi dấu phẩy)..."
                        value={toEmail}
                        onChange={(e) => onToEmailChange(e.target.value)}
                    />
                </div>
                {showCc && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium w-12">Cc:</span>
                        <input
                            className="flex-1 text-sm border-0 p-1 focus:outline-none bg-transparent"
                            placeholder="Nhập email CC (có thể nhập nhiều email cách nhau bởi dấu phẩy)..."
                            value={ccEmail}
                            onChange={(e) => onCcEmailChange?.(e.target.value)}
                        />
                    </div>
                )}
                {showBcc && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium w-12">Bcc:</span>
                        <input
                            className="flex-1 text-sm border-0 p-1 focus:outline-none bg-transparent"
                            placeholder="Nhập email BCC (có thể nhập nhiều email cách nhau bởi dấu phẩy)..."
                            value={bccEmail}
                            onChange={(e) => onBccEmailChange?.(e.target.value)}
                        />
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-12">Tiêu đề:</span>
                    <input
                        className="flex-1 text-sm border-0 p-1 focus:outline-none bg-transparent"
                        placeholder="Nhập tiêu đề email..."
                        value={subject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        {editorRef && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsVariablesOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Code size={16} />
                                Chèn trường dữ liệu
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onOpenAiDialog}
                            className="flex items-center gap-2"
                        >
                            <Sparkles size={16} />
                            Soạn bằng AI
                        </Button>
                    </div>
                </div>
            </div>

            {/* Command Dialog cho biến hệ thống */}
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

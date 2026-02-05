"use client";

import React, { useRef, useState } from "react";
import { Paperclip, X, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface AttachmentInputProps {
    onFilesChange: (files: File[]) => void;
    initialFiles?: File[];
}

export function AttachmentInput({
    onFilesChange,
    initialFiles = [],
}: AttachmentInputProps) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            addFiles(newFiles);
        }
    };

    const addFiles = (newFiles: File[]) => {
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files);
            addFiles(newFiles);
        }
    };

    return (
        <div className="border-t border-gray-100 p-2">
            {/* File List */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm group"
                        >
                            <FileIcon className="h-3 w-3 text-gray-500" />
                            <span className="max-w-[150px] truncate text-gray-700">
                                {file.name}
                            </span>
                            <button
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Drop Zone / Trigger */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all border border-dashed",
                    isDragging
                        ? "bg-blue-50 border-blue-300"
                        : "bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-200",
                )}
            >
                <div className="bg-gray-100 p-2 rounded-full">
                    <Paperclip className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                        {t("mail.attachments")}
                    </span>
                    <span className="text-xs text-gray-500">
                        {t("mail.dropFiles")}
                    </span>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
}

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Dataset } from "../types";
import {
    MdVisibility,
    MdVisibilityOff,
    MdExpandMore,
    MdInfo,
    MdClose,
} from "react-icons/md";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkspacesMultiSelector } from "@/components/componentsWithHook/WorkspacesMultiSelector";

interface AddDatasetDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingDataset: Dataset | null;
    datasetId: string;
    accessToken: string;
    onDatasetIdChange: (val: string) => void;
    onAccessTokenChange: (val: string) => void;
    title: string;
    onTitleChange: (val: string) => void;
    onSave: () => void;

    // New props for extended functionality based on HTML 2
    // Assuming we need these for the mapping part if it's included in the same dialog now
    selectedWorkspaceIds?: string[];
    handleWorkspaceIdsChange?: (val: string[]) => void;
    handleWorkspaceChange?: (val: string) => void; // Keep for compatibility if needed, but likely unused
    isLeadSelected?: boolean;
    setIsLeadSelected?: (val: boolean) => void;
    isDealSelected?: boolean;
    setIsDealSelected?: (val: boolean) => void;
    mappingType?: "lead" | "deal"; // Deprecated but kept for type safety if needed temporarily
    setMappingType?: (val: "lead" | "deal") => void; // Deprecated
    orgId?: string;
}

export const AddDatasetDialog: React.FC<AddDatasetDialogProps> = ({
    isOpen,
    onOpenChange,
    editingDataset,
    datasetId,
    accessToken,
    onDatasetIdChange,
    onAccessTokenChange,
    title,
    onTitleChange,
    onSave,
    selectedWorkspaceIds = [],
    handleWorkspaceIdsChange,
    isLeadSelected,
    setIsLeadSelected,
    isDealSelected,
    setIsDealSelected,
    orgId,
}) => {
    const [showToken, setShowToken] = useState(false);
    const [error, setError] = useState<string>("");

    const handleSave = () => {
        setError("");
        const isEditMode = !!editingDataset;

        if (!title.trim()) {
            setError("Vui lòng nhập Tiêu đề Dataset");
            return;
        }
        if (!datasetId.trim()) {
            setError("Vui lòng nhập Dataset ID");
            return;
        }

        // Only validate Access Token if NOT in edit mode
        if (!isEditMode && !accessToken.trim()) {
            setError("Vui lòng nhập Access Token");
            return;
        }

        onSave();
    };

    // Auto-update isDealSelected when workspaces are selected
    React.useEffect(() => {
        if (selectedWorkspaceIds.length > 0 && setIsDealSelected) {
            setIsDealSelected(true);
        }
    }, [selectedWorkspaceIds, setIsDealSelected]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden bg-white gap-0">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <DialogTitle className="text-lg font-bold text-gray-900">
                        {editingDataset
                            ? "Cập nhật Dataset"
                            : "Thêm & Cấu hình Dataset"}
                    </DialogTitle>
                </div>

                <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-900">
                            Tiêu đề Dataset
                        </label>
                        <Input
                            className="w-full rounded-lg border-gray-200 text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-400 shadow-sm"
                            placeholder="Ví dụ: Cửa hàng chính - Hà Nội"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-900">
                            Dataset ID
                        </label>
                        <Input
                            className="w-full rounded-lg border-gray-200 text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-400 font-mono shadow-sm"
                            placeholder="Nhập ID Dataset"
                            value={datasetId}
                            onChange={(e) => onDatasetIdChange(e.target.value)}
                            disabled={!!editingDataset}
                        />
                    </div>

                    {!editingDataset && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-900">
                                Access Token
                            </label>
                            <div className="relative">
                                <Input
                                    type={showToken ? "text" : "password"}
                                    className="w-full rounded-lg border-gray-200 text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder:text-gray-400 font-mono shadow-sm pr-10"
                                    placeholder="Nhập Access Token"
                                    value={accessToken}
                                    onChange={(e) =>
                                        onAccessTokenChange(e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showToken ? (
                                        <MdVisibilityOff size={20} />
                                    ) : (
                                        <MdVisibility size={20} />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                        {/* Đồng bộ giai đoạn từ Cơ hội */}
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <Checkbox
                                    className="rounded border-gray-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-white"
                                    checked={isLeadSelected}
                                    onCheckedChange={(checked) =>
                                        setIsLeadSelected &&
                                        setIsLeadSelected(checked as boolean)
                                    }
                                />
                                <span className="text-sm font-medium text-gray-900">
                                    Đồng bộ giai đoạn từ Chăm khách
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 ml-6">
                                Tự động đồng bộ các giai đoạn thước quy trình
                                Chăm khách.
                            </p>
                        </div>

                        {/* Đồng bộ giai đoạn từ Không gian làm việc - Always show */}
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-semibold text-gray-900">
                                Đồng bộ giai đoạn từ Không gian làm việc của
                                Chốt khách
                            </label>
                            <div className="flex flex-col gap-1.5">
                                {orgId && handleWorkspaceIdsChange && (
                                    <WorkspacesMultiSelector
                                        orgId={orgId}
                                        selectedWorkspaces={
                                            selectedWorkspaceIds
                                        }
                                        handleWorkspaceChange={
                                            handleWorkspaceIdsChange
                                        }
                                    />
                                )}
                            </div>
                            <div className="flex gap-2 items-start bg-blue-50 text-blue-800 p-3 rounded-md text-xs border border-blue-100">
                                <MdInfo className="text-[16px] shrink-0 mt-0.5 icon-fill" />
                                <span>
                                    Hệ thống sẽ tự động tải tất cả các giai đoạn
                                    từ các không gian đã chọn.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                            <MdInfo className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-[#3a0fc2] transition-colors shadow-sm"
                            onClick={handleSave}
                        >
                            {editingDataset
                                ? "Cập nhật Dataset"
                                : "Thêm & Cấu hình Dataset"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

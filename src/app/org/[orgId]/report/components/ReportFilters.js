"use client";
import TimeDropdown from "@/components/common/TimeDropDown";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { CgOptions } from "react-icons/cg";
import { FiSave } from "react-icons/fi";
import { IoMdPeople } from "react-icons/io";
import { MdOutlineGroups } from "react-icons/md";

import { deleteCustomReport } from "@/api/org_report";
import { toast } from "react-hot-toast";

// Component hiển thị và quản lý các bộ lọc báo cáo
export default function ReportFilters({
    reportList = [],
    selectedReportId,
    onReportChange,
    date,
    setDate,
    dateSelect,
    setDateSelect,
    selectedWorkspaces = [],
    removeWorkspace,
    selectedAssigneeIds = [],
    getMemberNameById,
    removeAssigneeId,
    configChanged = false,
    isReportChanging = false,
    hasJustLoadedReport = true,
    onSaveConfig,
    onResetConfig,
    onOpenWorkspaceDialog,
    onOpenAssigneeDialog,
    onOpenLayoutDialog,
    onCreateReport,
    onDeleteReport,
    onCreateDefaultReport,
}) {
    // Kiểm tra nếu đang sử dụng báo cáo mặc định
    const isDefaultReport = selectedReportId === "default";

    // State để theo dõi thay đổi từ người dùng
    const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);

    // Chỉ hiển thị nút khi có thay đổi hoặc là báo cáo mặc định
    const shouldShowConfigButtons = configChanged || isDefaultReport;

    // Utility function để đánh dấu người dùng đã thay đổi
    const trackUserChange = () => {
        setHasUserMadeChanges(true);
    };

    // Xử lý xóa báo cáo
    const handleDeleteReport = async () => {
        if (!reportToDelete) return;

        try {
            const response = await deleteCustomReport(
                params.orgId,
                reportToDelete.id
            );
            if (response?.code === 0) {
                toast.success("Đã xóa báo cáo thành công");
                setAlertOpen(false);
                // Gọi callback để cập nhật danh sách báo cáo
                if (onDeleteReport) {
                    onDeleteReport(reportToDelete.id);
                }
            } else {
                toast.error(
                    response?.message || "Có lỗi xảy ra khi xóa báo cáo"
                );
            }
        } catch (error) {
            console.error("Lỗi khi xóa báo cáo:", error);
            toast.error("Đã có lỗi xảy ra khi xóa báo cáo");
        }
    };

    return (
        <div className="space-y-4 pt-1 max-w-full">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-64">
                        <Select
                            value={selectedReportId}
                            onValueChange={(value) => {
                                onReportChange(value);
                            }}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn báo cáo" />
                            </SelectTrigger>
                            <SelectContent>
                                {isDefaultReport && reportList.length === 0 && (
                                    <SelectItem value="default">
                                        Báo cáo mặc định
                                    </SelectItem>
                                )}
                                {reportList.map((report) => (
                                    <SelectItem
                                        key={report.id}
                                        value={report.id}
                                    >
                                        {report.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Hiển thị nút lưu cấu hình với popover - luôn hiển thị với báo cáo mặc định, hoặc khi có thay đổi cho báo cáo thường */}
                    {shouldShowConfigButtons &&
                        (isDefaultReport ? (
                            <Button
                                variant="default"
                                className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                                onClick={onCreateDefaultReport}
                                disabled={isReportChanging}
                            >
                                <FiSave className="text-xl" />
                                <span>Lưu cấu hình</span>
                            </Button>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                                        disabled={isReportChanging}
                                    >
                                        <FiSave className="text-xl" />
                                        <span>Lưu cấu hình</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <div className="flex flex-col">
                                        <Button
                                            variant="ghost"
                                            className="justify-start rounded-none px-4 py-2 text-left"
                                            onClick={onSaveConfig}
                                        >
                                            Lưu báo cáo hiện tại
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="justify-start rounded-none px-4 py-2 text-left"
                                            onClick={() =>
                                                onCreateReport("Báo cáo mới")
                                            }
                                        >
                                            Lưu báo cáo mới
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ))}
                    <TimeDropdown
                        date={date}
                        setDate={(newDate) => {
                            trackUserChange();
                            setDate(newDate);
                        }}
                        dateSelect={dateSelect}
                        setDateSelect={(newDateSelect) => {
                            trackUserChange();
                            setDateSelect(newDateSelect);
                        }}
                        className={"bg-[var(--bg2)]"}
                        variant="none"
                        hideAllTime={true}
                    />
                    <Button
                        variant={
                            selectedWorkspaces.length > 0
                                ? "default"
                                : "outline"
                        }
                        className="flex items-center gap-2"
                        onClick={() => {
                            trackUserChange();
                            onOpenWorkspaceDialog();
                        }}
                    >
                        <MdOutlineGroups className="text-xl" />
                        {selectedWorkspaces.length > 0 ? (
                            <div className="flex items-center gap-1">
                                {selectedWorkspaces.length <= 2 ? (
                                    selectedWorkspaces.map(
                                        (workspace, index) => (
                                            <span key={workspace.id}>
                                                {workspace.name}
                                                {index <
                                                selectedWorkspaces.length - 1
                                                    ? ", "
                                                    : ""}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <span>
                                        Không gian làm việc ( đã chọn{" "}
                                        {selectedWorkspaces.length} )
                                    </span>
                                )}
                            </div>
                        ) : (
                            "Không gian làm việc"
                        )}
                    </Button>
                    <Button
                        variant={
                            selectedAssigneeIds.length > 0
                                ? "default"
                                : "outline"
                        }
                        className="flex items-center gap-2"
                        onClick={() => {
                            trackUserChange();
                            onOpenAssigneeDialog();
                        }}
                    >
                        <IoMdPeople className="text-xl" />
                        {selectedAssigneeIds.length > 0 ? (
                            <div className="flex items-center gap-1">
                                {selectedAssigneeIds.length <= 2 ? (
                                    selectedAssigneeIds.map((id, index) => (
                                        <span key={id}>
                                            {getMemberNameById(id)}
                                            {index <
                                            selectedAssigneeIds.length - 1
                                                ? ", "
                                                : ""}
                                        </span>
                                    ))
                                ) : (
                                    <span>
                                        Người phụ trách ( đã chọn{" "}
                                        {selectedAssigneeIds.length} )
                                    </span>
                                )}
                            </div>
                        ) : (
                            "Người phụ trách"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={onOpenLayoutDialog}
                        title="Tùy chỉnh bố cục"
                    >
                        <CgOptions className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateReportDialog({
  open,
  setOpen,
  onCreateReport,
  isCreating = false,
  defaultTitle = "Báo cáo mới",
}) {
  const [reportTitle, setReportTitle] = useState(defaultTitle);
  
  // Đặt lại title mặc định khi mở dialog
  useEffect(() => {
    if (open) {
      setReportTitle(defaultTitle);
    }
  }, [open, defaultTitle]);

  // Xử lý khi đóng dialog
  const handleClose = () => {
    setReportTitle(defaultTitle);
    setOpen(false);
  };

  // Xử lý khi tạo báo cáo
  const handleCreateReport = () => {
    if (!reportTitle || reportTitle.trim() === "") {
      return;
    }
    onCreateReport(reportTitle.trim());
    // Dialog sẽ được đóng sau khi tạo báo cáo thành công
  };

  // Xử lý khi nhấn Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && reportTitle && reportTitle.trim() !== "" && !isCreating) {
      handleCreateReport();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleClose();
      else setOpen(true);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo báo cáo mới</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-title" className="text-right">
              Tên báo cáo
            </Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              placeholder="Nhập tên báo cáo"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateReport}
            disabled={isCreating || !reportTitle || reportTitle.trim() === ""}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? "Đang tạo..." : "Tạo báo cáo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

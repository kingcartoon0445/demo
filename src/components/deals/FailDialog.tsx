import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { memo, useState, useCallback, useEffect } from "react";

interface FailDialogProps {
    isFailureDialogOpen: boolean;
    setIsFailureDialogOpen: (open: boolean) => void;
    failureReason: string;
    setFailureReason: (reason: string) => void;
    failureNote: string;
    setFailureNote: (note: string) => void;
    handleFailureConfirm: () => void;
}

function FailDialog({
    isFailureDialogOpen,
    setIsFailureDialogOpen,
    failureReason: externalFailureReason,
    setFailureReason: externalSetFailureReason,
    failureNote: externalFailureNote,
    setFailureNote: externalSetFailureNote,
    handleFailureConfirm,
}: FailDialogProps) {
    // Sử dụng local state để tránh re-render component cha
    const [localReason, setLocalReason] = useState(externalFailureReason);
    const [localNote, setLocalNote] = useState(externalFailureNote);

    // Đồng bộ state local với state từ component cha khi dialog mở
    useEffect(() => {
        if (isFailureDialogOpen) {
            setLocalReason(externalFailureReason);
            setLocalNote(externalFailureNote);
        }
    }, [isFailureDialogOpen, externalFailureReason, externalFailureNote]);

    // Memoize các hàm xử lý sự kiện để tránh tạo lại mỗi khi render
    const handleReasonChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalReason(e.target.value);
        },
        []
    );

    const handleNoteChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setLocalNote(e.target.value);
        },
        []
    );

    // Chỉ cập nhật state của component cha khi xác nhận
    const handleConfirm = useCallback(() => {
        externalSetFailureReason(localReason);
        externalSetFailureNote(localNote);
        handleFailureConfirm();
    }, [
        localReason,
        localNote,
        externalSetFailureReason,
        externalSetFailureNote,
        handleFailureConfirm,
    ]);

    // Xử lý khi đóng dialog
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                // Nếu đóng dialog, reset local state
                setLocalReason(externalFailureReason);
                setLocalNote(externalFailureNote);
            }
            setIsFailureDialogOpen(open);
        },
        [externalFailureReason, externalFailureNote, setIsFailureDialogOpen]
    );

    return (
        <Dialog open={isFailureDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Đánh dấu là thất bại</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason" className="text-right">
                            Lý do <span className="text-red-500">*</span>
                        </Label>
                        <input
                            id="reason"
                            value={localReason}
                            onChange={handleReasonChange}
                            className="w-full p-2 border rounded"
                            placeholder="Nhập lý do"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="note" className="text-right">
                            Ghi chú
                        </Label>
                        <Textarea
                            id="note"
                            value={localNote}
                            onChange={handleNoteChange}
                            placeholder="Nhập ghi chú"
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsFailureDialogOpen(false)}
                    >
                        Huỷ
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!localReason}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        Thất bại
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default memo(FailDialog);

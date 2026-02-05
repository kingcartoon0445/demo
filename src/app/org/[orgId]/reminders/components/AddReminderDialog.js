import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from "react";

import TypeSelection from "./TypeSelection";
import TimeSelection from "./TimeSelection";
import PrioritySelection from "./PrioritySelection";
import NotificationSection from "./NotificationSection";
import useReminderForm from "./useReminderForm";
import { scheduleTypes } from "@/constants";

export default function AddReminderDialog({
    open,
    setOpen,
    customerData,
    reminderToEdit = null,
    onSuccess,
    taskId,
    provider,
    refreshStage,
}) {
    const {
        customer,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        content,
        setContent,
        repeatDays,
        setRepeatDays,
        isSubmitting,
        timeError,
        title,
        setTitle,
        handleTitleChange,
        description,
        setDescription,
        selectedType,
        setSelectedType,
        priority,
        setPriority,
        isCompleted,
        setIsCompleted,
        notifyBeforeList,
        setNotifyBeforeList,
        handleSubmit,
        savedStatus,
        isStartTimeDisabled,
    } = useReminderForm(
        customerData,
        reminderToEdit,
        setOpen,
        taskId,
        provider,
        refreshStage
    );
    // Theo dõi trạng thái đã lưu để đóng dialog và refresh dữ liệu
    useEffect(() => {
        if (savedStatus) {
            // Đóng dialog sau khi lưu thành công
            setTimeout(() => {
                setOpen(false);
                // Gọi callback để refresh dữ liệu
                if (onSuccess && typeof onSuccess === "function") {
                    onSuccess();
                }
            }, 500); // Đợi 500ms để người dùng thấy thông báo thành công
        }
    }, [savedStatus, setOpen, onSuccess]);

    // Hàm đóng dialog
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose} className="max-w-2xl">
            <DialogContent className=" p-0 gap-0 flex flex-col max-h-[90vh] !max-w-[600px]">
                <DialogHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b shrink-0">
                    <DialogTitle className="text-lg font-semibold">
                        Đặt nhắc hẹn
                    </DialogTitle>
                    {/* <DialogClose className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </DialogClose> */}
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-auto">
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <div className="mb-2">
                                <Input
                                    placeholder={`Nhập tiêu đề ${
                                        scheduleTypes
                                            .find((t) => t.id === selectedType)
                                            ?.name?.toLowerCase() || "lịch hẹn"
                                    }`}
                                    value={title}
                                    onChange={(e) =>
                                        handleTitleChange(e.target.value)
                                    }
                                    className="w-full"
                                />
                            </div>

                            <TypeSelection
                                selectedType={selectedType}
                                setSelectedType={setSelectedType}
                            />
                        </div>

                        <TimeSelection
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            startTime={startTime}
                            setStartTime={setStartTime}
                            endTime={endTime}
                            setEndTime={setEndTime}
                            timeError={timeError}
                            isStartTimeDisabled={isStartTimeDisabled}
                        />

                        <PrioritySelection
                            priority={priority}
                            setPriority={setPriority}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả chi tiết</Label>
                            <div className="border border-input rounded-md">
                                <Textarea
                                    id="description"
                                    placeholder="Mô tả chi tiết về lịch hẹn"
                                    className="min-h-16 border-none"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <NotificationSection
                            notifyBeforeList={notifyBeforeList}
                            setNotifyBeforeList={setNotifyBeforeList}
                        />

                        {/* Tạm ẩn phần nhắc lại vào các ngày
            <div className="space-y-2">
              <Label htmlFor="repeat">Nhắc lại vào các ngày</Label>
              <MultiSelect
                options={repeatOptions}
                selected={repeatDays}
                onChange={setRepeatDays}
                placeholder="Chọn các ngày nhắc lại"
              />
            </div>
            */}

                        {((customerData && !customerData.hideCustomerField) ||
                            reminderToEdit?.contactData) &&
                            !reminderToEdit?.contactData && (
                                <div className="space-y-2">
                                    <Label htmlFor="customer">
                                        Khách hàng
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="customer"
                                        value={
                                            reminderToEdit?.contactData
                                                ?.fullName ||
                                            reminderToEdit?.contactData
                                                ?.FullName ||
                                            customer.name ||
                                            ""
                                        }
                                        disabled
                                        className="bg-gray-100"
                                    />
                                </div>
                            )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t flex justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="completed"
                            checked={isCompleted}
                            onCheckedChange={setIsCompleted}
                        />
                        <label
                            htmlFor="completed"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Đánh dấu đã hoàn thành
                        </label>
                    </div>

                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-indigo-600 text-white"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

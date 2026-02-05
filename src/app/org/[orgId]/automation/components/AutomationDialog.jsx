"use client";

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState } from "react";
import RecallConfigDialogNew from "./RecallConfigDialogNew";
import ReminderConfigDialog from "./ReminderConfigDialog";
import AssignRatioDialog from "./AssignRatioDialog";
import Image from "next/image";

export default function AutomationDialog({ open, setOpen }) {
    const [openRecallConfig, setOpenRecallConfig] = useState(false);
    const [openReminderConfig, setOpenReminderConfig] = useState(false);
    const [openAssignRatioConfig, setOpenAssignRatioConfig] = useState(false);

    // Hàm callback khi tạo thành công kịch bản
    const handleSuccess = () => {
        // Đóng dialog automation
        setOpen(false);
        // Đóng dialog tạo kịch bản thu hồi
        setOpenRecallConfig(false);
        // Đóng dialog tạo kịch bản nhắc hẹn
        setOpenReminderConfig(false);
        // Đóng dialog tạo kịch bản phân phối khách hàng
        setOpenAssignRatioConfig(false);
        // Tạo sự kiện custom để thông báo cho RecallRuleList biết cần refresh
        const refreshEvent = new CustomEvent("refresh-recall-rules");
        window.dispatchEvent(refreshEvent);
    };

    // Danh sách các kịch bản automation
    const automationScenarios = [
        {
            id: "recall",
            title: "Thu hồi khách hàng",
            description:
                "Thu hồi khách hàng sau một khoảng thời gian không có phản hồi",
            icon: "/images/thuhoi_icon.png",
            onClick: () => setOpenRecallConfig(true),
        },
        {
            id: "assign-ratio",
            title: "Phân phối khách hàng",
            description: "Phân phối khách hàng theo tỷ lệ",
            icon: "/images/thuhoi_icon.png",
            onClick: () => setOpenAssignRatioConfig(true),
        },
        {
            id: "reminder",
            title: "Nhắc hẹn chăm sóc",
            description:
                "Nhắc nhở cập nhật trạng thái sau khi tiếp nhận khách hàng",
            icon: "/images/nhachen_icon.png",
            onClick: () => setOpenReminderConfig(true),
        },
        // Có thể thêm các kịch bản khác ở đây trong tương lai
    ];

    return (
        <>
            <DialogContent className="sm:max-w-[900px] w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="text-center pb-4 text-xl">
                        Chọn kịch bản Automation
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                    {automationScenarios.map((scenario) => (
                        <div
                            key={scenario.id}
                            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-start cursor-pointer hover:shadow-md transition-shadow"
                            onClick={scenario.onClick}
                        >
                            <img
                                src={scenario.icon}
                                alt={scenario.title}
                                className="h-12"
                            />
                            <h3 className="text-base font-medium text-center mb-2">
                                {scenario.title}
                            </h3>
                            <p className="text-xs text-gray-500 leading-tight">
                                {scenario.description}
                            </p>
                        </div>
                    ))}
                </div>
            </DialogContent>

            {openRecallConfig && (
                <RecallConfigDialogNew
                    open={openRecallConfig}
                    setOpen={setOpenRecallConfig}
                    onSuccess={handleSuccess}
                />
            )}

            {openReminderConfig && (
                <ReminderConfigDialog
                    open={openReminderConfig}
                    setOpen={setOpenReminderConfig}
                    onSuccess={handleSuccess}
                />
            )}

            {openAssignRatioConfig && (
                <AssignRatioDialog
                    open={openAssignRatioConfig}
                    setOpen={setOpenAssignRatioConfig}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}

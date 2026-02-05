"use client";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdClose } from "react-icons/md";
import Avatar from "react-avatar";
import Image from "next/image";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";

export default function ReportCard5Dialog({ open, setOpen, data }) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Bảng xếp hạng nhân viên kinh doanh
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea
                    className="w-full rounded-md h-[70dvh] p-3"
                    id="report-card-scroll-area"
                >
                    <div className="flex flex-col gap-2">
                        {data.map((item, index) => (
                            <div
                                key={item.assignTo || index}
                                className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    {index < 3 ? (
                                        <Image
                                            src={`/images/cup_${index + 1}.png`}
                                            alt={`Top ${index + 1}`}
                                            width={28}
                                            height={28}
                                        />
                                    ) : (
                                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm">
                                            {index + 1}
                                        </span>
                                    )}
                                    <Avatar
                                        name={getFirstAndLastWord(
                                            item.fullName
                                        )}
                                        size="32"
                                        src={getAvatarUrl(item.avatar)}
                                        className="object-cover"
                                        round
                                    />
                                    <div className="leading-[1.2]">
                                        <p className="font-medium">
                                            {item.fullName}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <span className="text-title font-medium">
                                                {item.total}
                                            </span>{" "}
                                            Khách hàng{" "}
                                            <span className="text-xl text-title">
                                                •
                                            </span>{" "}
                                            <span className="text-title font-medium">
                                                {item.potential}
                                            </span>{" "}
                                            Tiềm năng
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">0 tỷ</p>
                                    <p className="text-sm text-gray-500">
                                        <b className="text-title">
                                            {item.transaction}
                                        </b>{" "}
                                        Giao dịch
                                    </p>
                                </div>
                            </div>
                        ))}

                        {data.length === 0 && (
                            <div className="py-8 text-center text-gray-500">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

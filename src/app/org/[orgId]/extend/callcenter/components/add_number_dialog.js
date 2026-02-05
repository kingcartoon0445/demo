"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MdAttachMoney, MdClose } from "react-icons/md";

const card1List = [
    {
        id: 1,
        name: "Đầu số cố định - 777.xxxxx",
        phone: "0777777777",
        price: 25000,
        fee: 780,
        status: "Đang hoạt động",
    },
    {
        id: 2,
        name: "Đầu số cố định - 888.xxxxx",
        phone: "0909090909",
        price: 25000,
        fee: 780,
        status: "Đang hoạt động",
    },
    {
        id: 3,
        name: "Đầu số cố định - 999.xxxxx",
        phone: "0888888888",
        price: 25000,
        fee: 780,
        status: "Đang hoạt động",
    },
    {
        id: 4,
        name: "Đầu số cố định - 666.xxxxx",
        phone: "0666666666",
        price: 25000,
        fee: 780,
        status: "Đang hoạt động",
    },
];
const card2List = [
    {
        id: 1,
        name: "Đầu số cố định - 777.xxxxx",
        monthFee: 25000,
        fee: 850,
        createFee: 0,
        status: "Đang hoạt động",
    },
    {
        id: 2,
        name: "Đầu số cố định - 888.xxxxx",
        monthFee: 25000,
        fee: 850,
        createFee: 0,
        status: "Đang hoạt động",
    },
    {
        id: 3,
        name: "Đầu số cố định - 999.xxxxx",
        monthFee: 25000,
        fee: 850,
        createFee: 0,
        status: "Đang hoạt động",
    },
    {
        id: 4,
        name: (
            <span className="text-title">
                Đầu số tổng đài 1800{" "}
                <span className="text-land text-sm">
                    (Doanh nghiệp đăng ký thanh toán cước cuộc gọi vào)
                </span>
            </span>
        ),
        monthFee: 550000,
        depositFee: 5000000,
        fee: 935,
        status: "Đang hoạt động",
    },
];
export default function AddNumberDialog({ open, setOpen }) {
    const [activeTab, setActiveTab] = useState("cosan");
    const [selectedNumber, setSelectedNumber] = useState(null);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[660px] min-h-[500px] p-0 flex flex-col gap-0 bg-[#fafafa]">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Thêm đầu số
                    </DialogTitle>
                </DialogHeader>
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full space-y-0"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cosan">Đầu số có sẵn</TabsTrigger>
                        <TabsTrigger value="dangkymoi">
                            Đăng ký đầu số
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="cosan" className="bg-bg1">
                        <ScrollArea className="p-4 h-[70dvh]">
                            <div className=" grid grid-cols-2 gap-4">
                                {card1List.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl p-4"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="text-lg font-medium">
                                                {item.name}
                                            </div>
                                            <div className="text-sm text-land">
                                                Số điện thoại:{" "}
                                                <span className="font-medium text-title">
                                                    {item.phone}
                                                </span>
                                            </div>
                                            <div className="text-sm text-land">
                                                Giá cước:{" "}
                                                <span className="font-medium text-title">
                                                    {item.fee} Coin/ phút
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 border-t-[1px] border-border pt-2 flex items-center justify-between">
                                            <div className="text-sm font-medium flex flex-col text-title/80">
                                                Giá:{" "}
                                                <span className="text-lg text-primary">
                                                    {item.price.toLocaleString()}{" "}
                                                    Coin
                                                </span>
                                            </div>
                                            <Button className="text-xs font-medium h-[30px] px-3">
                                                Mua ngay
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="dangkymoi" className="bg-bg1">
                        <ScrollArea className="flex flex-col px-4 h-[70dvh]">
                            <div className="flex flex-col gap-4 py-4">
                                {card2List.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "bg-white rounded-xl p-4 cursor-pointer border-[1px] border-transparent",
                                            selectedNumber?.id == item.id
                                                ? " border-primary"
                                                : ""
                                        )}
                                        onClick={() => setSelectedNumber(item)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="text-lg font-medium">
                                                {item.name}
                                            </div>
                                            <div className="text-sm text-title mt-1">
                                                Phí hằng tháng:{" "}
                                                <span className="font-medium text-primary">
                                                    {item.monthFee.toLocaleString()}{" "}
                                                    Coin
                                                </span>
                                            </div>
                                            {(item.createFee ||
                                                item.createFee == 0) && (
                                                <div className="text-sm text-land flex items-center">
                                                    <MdAttachMoney className="mr-1" />
                                                    Chi phí khởi tạo:{" "}
                                                    <span className="font-medium text-title ml-auto whitespace-nowrap">
                                                        {item.createFee == 0
                                                            ? "Miễn phí"
                                                            : item.createFee.toLocaleString() +
                                                              " Coin"}{" "}
                                                    </span>
                                                </div>
                                            )}
                                            {(item.depositFee ||
                                                item.depositFee == 0) && (
                                                <div className="text-sm text-land flex items-center">
                                                    <MdAttachMoney className="mr-1" />
                                                    Phí đặt cọc:{" "}
                                                    <span className="font-medium text-title ml-auto whitespace-nowrap">
                                                        {item.depositFee == 0
                                                            ? "Miễn phí"
                                                            : item.depositFee.toLocaleString() +
                                                              " Coin"}{" "}
                                                    </span>
                                                </div>
                                            )}
                                            {(item.fee || item.fee == 0) && (
                                                <div className="text-sm text-land flex items-center">
                                                    <MdAttachMoney className="mr-1" />
                                                    Giá cước:{" "}
                                                    <span className="font-medium text-title ml-auto whitespace-nowrap">
                                                        {item.fee == 0
                                                            ? "Miễn phí"
                                                            : item.fee.toLocaleString() +
                                                              " Coin/ phút"}{" "}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
                {activeTab == "dangkymoi" && (
                    <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button>Hoàn tất</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

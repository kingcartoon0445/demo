"use client";
import { callcenterSlotBuy, callcenterSlotBuyCheck } from "@/api/callcenter";
import { getWalletDetail } from "@/api/payment";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdClose } from "react-icons/md";

export default function SlotBuyDialog({
    open,
    setOpen,
    setOpenPaymentResult,
    setPaymentResult,
    handleReload,
    currentMemberNumber,
}) {
    const [walletInfo, setWalletInfo] = useState(null);
    const [memberNumber, setMemberNumber] = useState(1);
    const [buyInfo, setBuyInfo] = useState(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { orgId } = useParams();
    useEffect(() => {
        const fetchWalletInfo = async () => {
            const response = await getWalletDetail(orgId);
            if (response.code === 0) {
                setWalletInfo(response.content);
            }
        };
        const fetchBuyInfo = async () => {
            const response = await callcenterSlotBuyCheck(orgId, {
                member: memberNumber,
            });
            if (response.code === 0) {
                setBuyInfo(response.content);
            } else {
                toast.error(
                    response?.message || "Có lỗi xảy ra, vui lòng thử lại sau"
                );
            }
        };
        fetchWalletInfo();
        fetchBuyInfo();
    }, []);
    const handlePayment = () => {
        setIsAlertOpen(true);
    };
    const handleConfirmPayment = async () => {
        setIsAlertOpen(false);
        const response = await callcenterSlotBuy(orgId, {
            member: memberNumber,
        });
        if (response.code === 0) {
            setOpen(false);
            handleReload();
            setPaymentResult(response.content);
            setOpenPaymentResult(true);
        } else {
            toast.error(
                response?.message || "Có lỗi xảy ra, vui lòng thử lại sau"
            );
        }
    };
    const handleMemberNumberChange = (e) => {
        // Loại bỏ tất cả dấu phẩy và khoảng trắng từ input
        let value = e.target.value.replace(/[,\s]/g, "");

        // Nếu giá trị hiện tại đã là 100 và input mới dài hơn 3 ký tự, giữ nguyên 100
        if (memberNumber === 100 && value.length > 3) {
            return;
        }

        // Kiểm tra nếu chuỗi rỗng
        if (!value) {
            setMemberNumber(1);
            return;
        }

        // Parse thành số
        value = parseInt(value);

        if (isNaN(value)) {
            setMemberNumber(1);
        } else if (value < 1) {
            setMemberNumber(1);
        } else if (value > 100) {
            setMemberNumber(100);
        } else {
            setMemberNumber(value);
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Mua thêm tài khoản người dùng
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 bg-bg1 p-4">
                    <div className="flex flex-col p-3 bg-white rounded-lg">
                        <div className=" text-title mb-2">
                            Số tài khoản hiện tại:{" "}
                            <span className="font-medium">
                                {currentMemberNumber}
                            </span>
                        </div>
                        <div className=" text-title mb-2">
                            Ngày hết hạn:{" "}
                            <span className="font-medium">
                                {new Date(
                                    buyInfo?.expiryDate
                                ).toLocaleDateString("vi-VN")}
                            </span>
                        </div>
                        <div className=" text-title mb-2">
                            Số tài khoản muốn mua thêm
                        </div>
                        <Input
                            type="number"
                            value={memberNumber}
                            onChange={handleMemberNumberChange}
                            min={1}
                            max={100}
                            className="w-full h-[35px]"
                        />
                    </div>
                    <div className="flex flex-col p-3 bg-white rounded-lg mt-4">
                        <div className=" text-title font-medium mb-2">
                            Chi tiết đơn hàng
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label
                                label="Giá / thành viên / tháng"
                                value={`100.000 Coin`}
                            />
                            <Label label="Số tài khoản" value={memberNumber} />
                            <Label
                                label="Số tháng còn lại"
                                value={buyInfo?.duration + " tháng"}
                            />
                            <Label label="Phí giao dịch" value={`Miễn phí`} />
                            <Label
                                label="Tổng cộng"
                                value={`${(
                                    buyInfo?.totalCredit * memberNumber
                                ).toLocaleString("vi-VN")} Coin`}
                                isTotal
                            />
                        </div>
                    </div>
                    <div className="flex flex-col p-3 bg-white rounded-lg mt-4">
                        <div className="text-title font-medium mb-2">
                            Phương thức thanh toán
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-[30px] h-[30px] rounded-full border p-2 ${
                                    walletInfo?.credit <
                                    buyInfo?.totalCredit * memberNumber
                                        ? "opacity-50"
                                        : ""
                                }`}
                            >
                                <Image
                                    src="/icons/coka_wallet_ico.svg"
                                    alt="wallet"
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <div
                                className={` text-title text-sm flex flex-col leading-tight ${
                                    walletInfo?.credit <
                                    buyInfo?.totalCredit * memberNumber
                                        ? "opacity-50"
                                        : ""
                                }`}
                            >
                                <span className="font-medium">Ví coka</span>
                                <span className="text-xs">
                                    Số dư ví:{" "}
                                    {walletInfo?.credit?.toLocaleString()} Coin
                                </span>
                            </div>
                            {walletInfo?.credit < buyInfo?.totalCredit && (
                                <Button
                                    className="text-xs h-[30px] ml-3"
                                    onClick={() =>
                                        router.push(
                                            `/org/${orgId}/wallet/deposit`
                                        )
                                    }
                                >
                                    Nạp tiền
                                </Button>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handlePayment}>Thanh toán</Button>
                </DialogFooter>
                <CustomerAlertDialog
                    open={isAlertOpen}
                    setOpen={setIsAlertOpen}
                    title="Xác nhận thanh toán"
                    subtitle="Bạn có chắc chắn muốn thực hiện thanh toán này không?"
                    onSubmit={handleConfirmPayment}
                />
            </DialogContent>
        </Dialog>
    );
}

const Label = ({ label, value, isTotal }) => {
    return (
        <div className="flex items-center justify-between">
            <div
                className={cn(
                    "text-[14px] text-title",
                    isTotal && "text-[18px] font-medium"
                )}
            >
                {label}
            </div>
            <div
                className={cn(
                    `text-[14px] text-title font-medium `,
                    isTotal && "text-[18px]"
                )}
            >
                {value}
            </div>
        </div>
    );
};

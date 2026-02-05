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
import { MdClose } from "react-icons/md";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/number-input";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSubscription } from "./subs_card";
import { checkBuyMember, getWalletDetail, buyMember } from "@/api/payment";
import toast from "react-hot-toast";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";

export default function BuyNewMemberDialog({ open, setOpen }) {
    const { orgId } = useParams();
    const router = useRouter();
    const { subscription, refresh } = useSubscription();
    const [memberCount, setMemberCount] = useState(1);
    const [buyInfo, setBuyInfo] = useState(null);
    const [walletInfo, setWalletInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleMemberCountChange = async (value) => {
        if (value > 0) {
            setMemberCount(value);
            const response = await checkBuyMember(orgId, value);
            if (response?.code === 0) {
                setBuyInfo(response.content);
            }
        }
    };

    useEffect(() => {
        const fetchWalletInfo = async () => {
            const response = await getWalletDetail(orgId);
            if (response.code === 0) {
                setWalletInfo(response.content);
            }
        };

        fetchWalletInfo();
        handleMemberCountChange(1);
    }, []);

    const onConfirmPayment = async () => {
        setIsLoading(true);
        try {
            const response = await buyMember(orgId, memberCount);

            if (response.code === 0) {
                toast.success("Mua thêm thành viên thành công");
                refresh(orgId);
                setShowConfirmDialog(false);
                setOpen(false);
            } else {
                toast.error(
                    response.message || "Có lỗi xảy ra khi mua thêm thành viên"
                );
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xử lý thanh toán");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Mua thêm thành viên
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 p-4">
                    <div className="flex flex-col space-y-4">
                        {/* Thông tin hiện tại */}
                        <div className="flex flex-col space-y-2 border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Số thành viên hiện tại:
                                </span>
                                <span className="font-medium">
                                    {subscription?.countMember ?? 0}/
                                    {subscription?.maxMember ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Ngày hết hạn:
                                </span>
                                <span className="font-medium">
                                    {buyInfo?.expiryDate
                                        ? new Date(
                                              buyInfo.expiryDate
                                          ).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                </span>
                            </div>
                            {/* Nhập số thành viên */}
                            <div className="mt-4 flex gap-4 items-center">
                                <span className="text-sm text-gray-600">
                                    Số thành viên muốn mua thêm
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        value={memberCount}
                                        onChange={handleMemberCountChange}
                                        min={1}
                                        size="small"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Chi tiết đơn hàng */}
                        <div className="mt-4 border rounded-lg p-3">
                            <div className="text-title font-medium mb-2">
                                Chi tiết đơn hàng
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label
                                    label="Giá/thành viên/tháng"
                                    value={`${buyInfo?.pricePerUnit?.toLocaleString(
                                        "vi-VN"
                                    )} Coin`}
                                />
                                <Label
                                    label="Số tài khoản"
                                    value={buyInfo?.member ?? 0}
                                />
                                <Label
                                    label="Số tháng gia hạn"
                                    value={buyInfo?.duration ?? 0}
                                />
                                <Label
                                    label="Phí giao dịch"
                                    value={`${buyInfo?.fee?.toLocaleString(
                                        "vi-VN"
                                    )} Coin`}
                                />
                                <Label
                                    label="Tổng cộng"
                                    value={`${buyInfo?.totalCredit?.toLocaleString(
                                        "vi-VN"
                                    )} Coin`}
                                    isTotal
                                />
                            </div>
                        </div>

                        {/* Phương thức thanh toán */}
                        <div className="mt-4 border rounded-lg p-3">
                            <div className="text-title font-medium mb-2">
                                Phương thức thanh toán
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-[30px] h-[30px] rounded-full border p-2 ${
                                        (buyInfo?.totalCredit || 0) >
                                        (walletInfo?.credit || 0)
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
                                    className={`text-title text-sm flex flex-col leading-tight mr-auto ${
                                        (buyInfo?.totalCredit || 0) >
                                        (walletInfo?.credit || 0)
                                            ? "opacity-50"
                                            : ""
                                    }`}
                                >
                                    <span className="font-medium">Ví coka</span>
                                    <span className="text-xs">
                                        Số dư ví:{" "}
                                        {walletInfo?.credit?.toLocaleString(
                                            "vi-VN"
                                        )}{" "}
                                        Coin
                                    </span>
                                </div>
                                {(buyInfo?.totalCredit || 0) >
                                    (walletInfo?.credit || 0) && (
                                    <Button
                                        className="text-xs h-[30px] ml-3"
                                        size="sm"
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
                    </div>
                </ScrollArea>
                <DialogFooter
                    className={
                        "mt-auto p-4 border-t-[1px] flex justify-between"
                    }
                >
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="default"
                        disabled={
                            (buyInfo?.totalCredit || 0) >
                                (walletInfo?.credit || 0) || isLoading
                        }
                        onClick={() => setShowConfirmDialog(true)}
                    >
                        {isLoading ? "Đang xử lý..." : "Thanh toán"}
                    </Button>
                </DialogFooter>
            </DialogContent>
            <CustomerAlertDialog
                open={showConfirmDialog}
                setOpen={setShowConfirmDialog}
                title="Xác nhận thanh toán"
                subtitle="Bạn có chắc chắn muốn mua thêm thành viên không?"
                onSubmit={onConfirmPayment}
            />
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
                    "text-[14px] text-title font-medium",
                    isTotal && "text-[18px]"
                )}
            >
                {value}
            </div>
        </div>
    );
};

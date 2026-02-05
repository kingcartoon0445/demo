"use client";
import {
    getSubscriptionRenewInfo,
    getWalletDetail,
    renewSubscription,
} from "@/api/payment";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/number-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdClose } from "react-icons/md";
import { useSubscription } from "./subs_card";

export default function RenewSubscriptionPayment({
    open,
    setOpen,
    subscription,
}) {
    const [walletInfo, setWalletInfo] = useState(null);
    const { orgId } = useParams();
    const router = useRouter();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [duration, setDuration] = useState(1);
    const { refresh } = useSubscription();
    const [renewInfo, setRenewInfo] = useState(null);

    useEffect(() => {
        const fetchWalletInfo = async () => {
            const response = await getWalletDetail(orgId);
            if (response.code === 0) {
                setWalletInfo(response.content);
            }
        };
        fetchWalletInfo();
        fetchRenewInfo(duration);
    }, []);

    const fetchRenewInfo = async (months) => {
        const response = await getSubscriptionRenewInfo(orgId, months);
        if (response.code === 0) {
            setRenewInfo(response.content);
        }
    };

    const handleDurationChange = (value) => {
        if (value > 0) {
            setDuration(value);
            fetchRenewInfo(value);
        }
    };

    const onConfirmPayment = async () => {
        const response = await renewSubscription(orgId, {
            duration: duration,
        });
        if (response?.message) return toast.error(response.message);

        toast.success("Thanh toán thành công");
        refresh(orgId);
        setShowConfirmDialog(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Thanh toán
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 p-4">
                    <div className="flex flex-col bg-bg1 rounded-lg p-3">
                        <div className="flex gap-2 mb-5">
                            <div className="p-[4px] rounded-lg bg-[#E3DFFF]">
                                <Image
                                    alt="ico"
                                    src={"/icons/subscription_ico.svg"}
                                    width={42}
                                    height={42}
                                />
                            </div>
                            <div className="text-text2 text-sm flex flex-col gap-1">
                                <span>Dành cho đội Nhóm</span>
                                <b className="text-[22px] text-title">
                                    {subscription?.name}
                                </b>
                            </div>
                        </div>
                        <div className="font-medium text-title text-[14px] flex items-center gap-4">
                            Thời hạn gia hạn
                            <div className="flex items-center gap-2">
                                <Input
                                    value={duration}
                                    onChange={handleDurationChange}
                                    min={1}
                                    size="small"
                                />
                                <span className="text-sm text-title">
                                    tháng
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col p-3 bg-bg1 rounded-lg mt-4">
                        <div className="text-title font-medium mb-2">
                            Phương thức thanh toán
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-[30px] h-[30px] rounded-full border p-2">
                                <Image
                                    src="/icons/coka_wallet_ico.svg"
                                    alt="wallet"
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <div className="text-title text-sm flex flex-col leading-tight">
                                <span className="font-medium">Ví coka</span>
                                <span className="text-xs">
                                    Số dư ví:{" "}
                                    {walletInfo?.credit?.toLocaleString()} Coin
                                </span>
                            </div>
                            {walletInfo?.credit <
                                (renewInfo?.order?.totalCredit || 0) && (
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
                    <div className="flex flex-col p-3 bg-bg1 rounded-lg mt-4">
                        <div className="text-title font-medium mb-2">
                            Chi tiết đơn hàng
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label
                                label="Gói thuê bao"
                                value={renewInfo?.order?.title || ""}
                            />
                            <Label
                                label="Số thành viên"
                                value={`${
                                    renewInfo?.order?.member || 0
                                } thành viên`}
                            />
                            <Label
                                label="Ngày bắt đầu"
                                value={
                                    renewInfo?.order?.startDate
                                        ? new Date(renewInfo.order.startDate)
                                              .toLocaleDateString("vi-VN", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                              })
                                              .replace(/\./g, "/")
                                        : ""
                                }
                            />
                            <Label
                                label="Ngày kết thúc"
                                value={
                                    renewInfo?.order?.expiryDate
                                        ? new Date(renewInfo.order.expiryDate)
                                              .toLocaleDateString("vi-VN", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                              })
                                              .replace(/\./g, "/")
                                        : ""
                                }
                            />
                            <Label
                                label="Giá"
                                value={`${
                                    renewInfo?.order?.credit?.toLocaleString() ||
                                    0
                                } Coin`}
                            />
                            <Label
                                label="Phí"
                                value={`${
                                    renewInfo?.order?.fee?.toLocaleString() || 0
                                } Coin`}
                            />
                            <Label
                                label="Tổng cộng"
                                value={`${
                                    renewInfo?.order?.totalCredit?.toLocaleString() ||
                                    0
                                } Coin`}
                                isTotal
                            />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={() => setShowConfirmDialog(true)}>
                        Hoàn tất
                    </Button>
                </DialogFooter>
                <CustomerAlertDialog
                    open={showConfirmDialog}
                    setOpen={setShowConfirmDialog}
                    title="Xác nhận thanh toán"
                    subtitle="Bạn có chắc chắn muốn thực hiện giao dịch này không?"
                    onSubmit={onConfirmPayment}
                />
            </DialogContent>
        </Dialog>
    );
}

const PaymentPackage = ({
    checked,
    name,
    id,
    price,
    save,
    setSelectedPackage,
}) => {
    return (
        <div className="flex items-center gap-2 font-medium text-title">
            <Checkbox
                checked={checked}
                onClick={() => setSelectedPackage(id)}
                className="rounded-full"
            />
            <div className="text-xs">{name}</div>
            <span className="ml-auto text-sm text-title">
                {save && (
                    <span className="text-[9px] text-white bg-primary rounded-full px-[6px] py-[3px]">
                        Tiết kiệm {save}%
                    </span>
                )}
                <span className="text-sm"> {price.toLocaleString()}đ</span>
            </span>
        </div>
    );
};
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

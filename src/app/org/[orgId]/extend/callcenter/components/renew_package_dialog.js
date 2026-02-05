"use client";
import {
    getCallcenterRenewInfo,
    renewCallcenterPackage,
} from "@/api/callcenter";
import { getWalletDetail } from "@/api/payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { MdClose } from "react-icons/md";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import toast from "react-hot-toast";
import { addMonths } from "date-fns";

export default function RenewPackageDialog({
    open,
    setOpen,
    setOpenPaymentResult,
    setPaymentResult,
    handleReload,
}) {
    const [monthNumber, setMonthNumber] = useState(1);
    const [renewInfo, setRenewInfo] = useState(null);
    const userNumber = renewInfo?.order?.member ?? 0;
    const [walletInfo, setWalletInfo] = useState(null);
    const { orgId } = useParams();
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    useEffect(() => {
        const fetchWalletInfo = async () => {
            const response = await getWalletDetail(orgId);
            if (response.code === 0) {
                setWalletInfo(response.content);
            }
        };
        const fetchRenewInfo = async () => {
            const response = await getCallcenterRenewInfo(orgId);
            if (response.code === 0) {
                setRenewInfo(response.content);
            }
        };
        fetchWalletInfo();
        fetchRenewInfo();
    }, []);

    useEffect(() => {
        const fetchRenewInfo = async () => {
            const response = await getCallcenterRenewInfo(orgId, {
                duration: monthNumber,
            });
            if (response.code === 0) {
                setRenewInfo(response.content);
            }
        };
        if (monthNumber > 0) {
            fetchRenewInfo();
        }
    }, [monthNumber, orgId]);

    const handlePayment = useCallback(() => {
        setIsAlertOpen(true);
    }, []);

    const handleConfirmPayment = useCallback(async () => {
        const response = await renewCallcenterPackage(orgId, {
            duration: monthNumber,
        });
        if (response.code === 0) {
            setPaymentResult(response.content);
            setOpenPaymentResult();
            setOpen(false);
            setIsAlertOpen(false);
            handleReload();
        } else {
            toast.error(
                response?.message ?? "Có lỗi xảy ra, vui lòng thử lại sau"
            );
        }
    }, [setOpen, setOpenPaymentResult, monthNumber, orgId, handleReload]);

    const handleMonthNumberChange = (value) => {
        const numValue = parseInt(value);
        if (numValue < 1) {
            setMonthNumber(1);
        } else if (numValue > 12) {
            setMonthNumber(12);
        } else {
            setMonthNumber(numValue);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Gia hạn
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 bg-bg1 p-4">
                    <div className="flex flex-col p-3 bg-white rounded-lg">
                        <div className=" text-title mb-2">
                            Số tài khoản hiện tại:{" "}
                            <span className="font-medium">{userNumber}</span>
                        </div>
                        <div className=" text-title mb-2">
                            Ngày hết hạn:{" "}
                            <span className="font-medium">
                                {new Date(
                                    renewInfo?.expiryDate
                                ).toLocaleDateString("vi-VN")}
                            </span>
                        </div>
                        <div className=" text-title mb-2">
                            Số tháng muốn gia hạn
                        </div>
                        <Select
                            value={monthNumber}
                            onValueChange={handleMonthNumberChange}
                        >
                            <SelectTrigger className="bg-bg1 rounded-lg border-none h-[35px]">
                                <SelectValue placeholder="Chọn số tháng" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={1}>1 tháng</SelectItem>
                                <SelectItem value={2}>2 tháng</SelectItem>
                                <SelectItem value={3}>3 tháng</SelectItem>
                                <SelectItem value={4}>4 tháng</SelectItem>
                                <SelectItem value={5}>5 tháng</SelectItem>
                                <SelectItem value={6}>6 tháng</SelectItem>
                                <SelectItem value={7}>7 tháng</SelectItem>
                                <SelectItem value={8}>8 tháng</SelectItem>
                                <SelectItem value={9}>9 tháng</SelectItem>
                                <SelectItem value={10}>10 tháng</SelectItem>
                                <SelectItem value={11}>11 tháng</SelectItem>
                                <SelectItem value={12}>12 tháng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col p-3 bg-white rounded-lg mt-4">
                        <div className=" text-title font-medium mb-2">
                            Chi tiết đơn hàng
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label
                                label="Giá / thành viên / tháng"
                                value={`${renewInfo?.package?.pricePerUnit?.toLocaleString(
                                    "vi-VN"
                                )} Coin`}
                            />
                            <Label
                                label="Số tài khoản muốn mua"
                                value={userNumber}
                            />
                            <Label
                                label="Số tháng muốn sử dụng"
                                value={
                                    renewInfo?.order?.duration || monthNumber
                                }
                            />
                            <Label
                                label="Ngày hết hạn"
                                value={
                                    renewInfo?.order?.expiryDate
                                        ? new Date(
                                              renewInfo.order.expiryDate
                                          ).toLocaleDateString("vi-VN")
                                        : ""
                                }
                            />
                            <Label
                                label="Phí giao dịch"
                                value={`${
                                    renewInfo?.order?.fee?.toLocaleString(
                                        "vi-VN"
                                    ) || "Miễn phí"
                                }`}
                            />
                            <Label
                                label="Tổng cộng"
                                value={`${
                                    renewInfo?.order?.totalCredit?.toLocaleString(
                                        "vi-VN"
                                    ) || "0"
                                } Coin`}
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
                                    (renewInfo?.order?.totalCredit || 0)
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
                                    (renewInfo?.order?.totalCredit || 0)
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

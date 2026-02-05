"use client";
import { getWalletDetail } from "@/api/payment";
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
import { useCallback, useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { activeCallcenterPackage } from "@/api/callcenter";
import toast from "react-hot-toast";

export default function ActivePackageDialog({
    open,
    setOpen,
    setOpenPaymentResult,
    setPaymentResult,
    handleReload,
}) {
    const [userNumber, setUserNumber] = useState(1);
    const [monthNumber, setMonthNumber] = useState(1);
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
        fetchWalletInfo();
    }, [orgId]);
    const handlePayment = useCallback(() => {
        setIsAlertOpen(true);
    }, []);

    const handleConfirmPayment = useCallback(async () => {
        const response = await activeCallcenterPackage(orgId, {
            member: userNumber,
            duration: monthNumber,
        });
        if (response.code === 0) {
            setOpenPaymentResult(true);
            setPaymentResult(response.content);
            setOpen(false);
            setIsAlertOpen(false);
            handleReload();
        } else {
            toast.error(
                response?.message || "Có lỗi xảy ra, vui lòng thử lại sau"
            );
        }
    }, [
        setOpen,
        setOpenPaymentResult,
        setPaymentResult,
        orgId,
        userNumber,
        monthNumber,
        handleReload,
    ]);

    // Thêm hàm xử lý input
    const handleUserNumberChange = (e) => {
        // Loại bỏ tất cả dấu phẩy và khoảng trắng từ input
        let value = e.target.value.replace(/[,\s]/g, "");

        // Nếu giá trị hiện tại đã là 100 và input mới dài hơn 3 ký tự, giữ nguyên 100
        if (userNumber === 100 && value.length > 3) {
            return;
        }

        // Kiểm tra nếu chuỗi rỗng
        if (!value) {
            setUserNumber(1);
            return;
        }

        // Parse thành số
        value = parseInt(value);

        if (isNaN(value)) {
            setUserNumber(1);
        } else if (value < 1) {
            setUserNumber(1);
        } else if (value > 100) {
            setUserNumber(100);
        } else {
            setUserNumber(value);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] max-h-[100dvh] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Kích hoạt gói tổng đài{" "}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 bg-bg1 p-4">
                    <div className="flex flex-col p-3 bg-white rounded-lg">
                        <div className=" text-title font-medium mb-2">
                            Số tài khoản muốn mua
                        </div>
                        <Input
                            type="number"
                            value={userNumber}
                            onChange={handleUserNumberChange}
                            min={1}
                            max={100}
                            className="w-full bg-bg1 rounded-lg border-none h-[35px]"
                        />
                        <div className=" text-title font-medium mb-2 mt-3">
                            Số tháng muốn sử dụng
                        </div>
                        <Select
                            value={monthNumber}
                            onValueChange={(value) => setMonthNumber(value)}
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
                                value={`100.000 Coin`}
                            />
                            <Label
                                label="Số tài khoản muốn mua"
                                value={userNumber}
                            />
                            <Label
                                label="Số tháng muốn sử dụng"
                                value={monthNumber}
                            />
                            <Label
                                label="Ngày hết hạn"
                                value={new Date(
                                    new Date().setMonth(
                                        new Date().getMonth() +
                                            parseInt(monthNumber)
                                    )
                                ).toLocaleDateString("vi-VN")}
                            />
                            <Label label="Phí giao dịch" value={`Miễn phí`} />
                            <Label
                                label="Tổng cộng"
                                value={`${(
                                    100000 *
                                    userNumber *
                                    monthNumber
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
                                    100000 * userNumber * monthNumber
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
                                    100000 * userNumber * monthNumber
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
                                100000 * userNumber * monthNumber && (
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
                <DialogFooter className={"mt-auto p-4 gap-2"}>
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

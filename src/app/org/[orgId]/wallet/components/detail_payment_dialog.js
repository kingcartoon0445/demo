"use client";
import { getTransactionDetail, payCreditOrder } from "@/api/payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdClose } from "react-icons/md";

export default function DetailPaymentDialog({
    open,
    setOpen,
    transactionId,
    handlePayAgain,
    loading,
}) {
    const [transaction, setTransaction] = useState(null);
    const { orgId } = useParams();
    const router = useRouter();
    useEffect(() => {
        const fetchTransaction = async () => {
            const response = await getTransactionDetail(orgId, transactionId);
            if (response.code === 0) {
                setTransaction(response.content);
            }
        };
        fetchTransaction();
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[700px] max-h-[90dvh] flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col w-full ">
                    <DialogHeader>
                        <DialogTitle className="font-medium text-[16px] text-title flex items-center justify-between mb-3">
                            Chi tiết
                        </DialogTitle>
                        <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                    </DialogHeader>
                    {transaction && (
                        <ScrollArea className="flex flex-col flex-1">
                            <div className="flex flex-col gap-2">
                                <div className="bg-[var(--bg1)] rounded-lg p-4 flex flex-col items-center mt-8 relative">
                                    <div className="absolute top-[-22px] left-1/2 -translate-x-1/2 h-[44px] w-[44px] rounded-lg bg-[#e3dfff] flex items-center justify-center">
                                        <Image
                                            src="/icons/coka_wallet_ico.svg"
                                            alt="deposit"
                                            width={20}
                                            height={20}
                                            className=""
                                        />
                                    </div>
                                    <div className="mt-4 text-sm">
                                        {transaction.title}
                                    </div>
                                    {![undefined, null].includes(
                                        transaction?.transactionValue
                                    ) && (
                                        <div className="flex items-center gap-1 font-medium mt-1">
                                            {transaction?.transactionValue >
                                                0 && "+"}{" "}
                                            {transaction?.transactionValue.toLocaleString()}{" "}
                                            <Image
                                                src={"/images/coka_coin.png"}
                                                alt="coin"
                                                width={22}
                                                height={22}
                                            />
                                        </div>
                                    )}
                                    <div className="text-sm text-text2 mt-1">
                                        {transaction.type == "IN" &&
                                            "Nạp tiền vào ví COKA"}
                                    </div>
                                </div>
                                <div className="bg-[var(--bg1)] rounded-lg px-4 py-3 mt-3">
                                    <Label
                                        label="Trạng thái"
                                        value={getStatus(
                                            transaction.statusCode
                                        )}
                                        color={
                                            transaction.statusCode === "Success"
                                                ? "text-green-500"
                                                : "text-red-500"
                                        }
                                    />
                                </div>
                                <div className="bg-[var(--bg1)] rounded-lg px-4 py-3 mt-3 flex flex-col gap-2">
                                    <Label
                                        label="Mã giao dịch"
                                        value={transaction.id}
                                    />
                                    <Label
                                        label="Thời gian"
                                        value={format(
                                            transaction.orderDate,
                                            "HH:mm - dd/MM/yyyy"
                                        )}
                                    />
                                    <Label
                                        label="Phương thức thanh toán"
                                        value={transaction.paymentMethodName}
                                    />
                                    <Label
                                        label="Phí giao dịch"
                                        value={"Miễn phí"}
                                    />
                                </div>
                                {transaction.totalAmount != 0 && (
                                    <div className="bg-[var(--bg1)] rounded-lg px-4 py-3 mt-3 flex flex-col gap-2">
                                        <Label
                                            label="Ưu đãi"
                                            value={
                                                (transaction?.promotionName ||
                                                    0) + " đ"
                                            }
                                        />
                                        <Label
                                            label="Số tiền thanh toán"
                                            value={
                                                transaction.totalAmount.toLocaleString() +
                                                " đ"
                                            }
                                        />
                                    </div>
                                )}
                                <div className="bg-[var(--bg1)] rounded-lg px-4 py-3 mt-3">
                                    <Label
                                        label="Người giao dịch"
                                        value={transaction.createdByName}
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </div>
                {(transaction?.statusCode === "PendingReview" ||
                    transaction?.statusCode === "Unpaid" ||
                    transaction?.statusCode === "Pending") && (
                    <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={() => {
                                handlePayAgain(transaction);
                            }}
                            loading={loading}
                        >
                            Thanh toán lại
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
const getStatus = (statusCode) => {
    switch (statusCode) {
        case "Success":
            return "Thành công";
        case "Pending":
            return "Đang xử lý";
        case "Failed":
            return "Thất bại";
    }
};

const Label = ({ label, value, color }) => {
    return (
        <div className="flex items-center w-full justify-between">
            <div className="text-sm text-text2">{label}</div>
            <div className={cn("text-sm text-title font-medium", color)}>
                {value}
            </div>
        </div>
    );
};

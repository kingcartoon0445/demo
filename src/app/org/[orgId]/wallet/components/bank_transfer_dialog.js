"use client";
import { confirmTransactionApi } from "@/api/payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdClose, MdContentCopy } from "react-icons/md";

export default function BankTransferDialog({ open, setOpen }) {
    const [bankInfo, setBankInfo] = useState(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const bankApi = searchParams.get("bankApi");
    useEffect(() => {
        router.replace(pathname.replace(bankApi, ""));
        fetch(bankApi, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setBankInfo(data?.content);
            });
    }, []);

    const handlePayment = () => {
        confirmTransactionApi(bankInfo.transactionId);
        setOpen(false);
        router.push(pathname.replace("deposit", ""));
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Chuyển khoản ngân hàng
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1">
                    <div className="w-full flex flex-col items-center py-4">
                        <div className="text-title font-medium text-sm mb-4">
                            Quét mã QR để thanh toán
                        </div>
                        <Image
                            src={bankInfo?.qrCodeUrl}
                            alt="bank_transfer"
                            width={170}
                            height={170}
                            className="p-4 bg-[var(--bg2)]"
                        />
                        <div className="text-title font-medium text-sm my-4">
                            Hoặc chuyển tiền vào tài khoản
                        </div>
                        <div className="p-4 rounded-lg border w-[80%] mx-auto gap-[6px] flex flex-col">
                            <Label
                                name="Ngân hàng"
                                value={bankInfo?.bankName}
                            />
                            <Label
                                name="Chủ tài khoản"
                                value={bankInfo?.userBankName}
                            />
                            <Label
                                name="Số tài khoản"
                                value={bankInfo?.bankAccount}
                                copy
                            />
                            <Label
                                name="Số tiền"
                                value={
                                    (bankInfo?.amount?.toLocaleString() ?? 0) +
                                    " đ"
                                }
                                copy
                            />
                            <Label
                                name="Nội dung chuyển khoản"
                                value={bankInfo?.note}
                                copy
                            />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handlePayment}>Tôi đã thanh toán</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const Label = ({ name, value, copy }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success(`Đã copy ${name.toLowerCase()}`);
    };

    return (
        <div className="flex w-full justify-between items-center">
            <span className="text-sm text-land">{name}</span>
            <div className="flex items-center">
                <span className="text-sm text-title font-medium">{value}</span>
                {copy && (
                    <button onClick={handleCopy} className="ml-2 text-sm">
                        <MdContentCopy />
                    </button>
                )}
            </div>
        </div>
    );
};

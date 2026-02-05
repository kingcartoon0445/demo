"use client";
import { payCreditOrder } from "@/api/payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { MdClose } from "react-icons/md";

export default function PaymentDialog({ open, setOpen, transaction }) {
    const [paymentMethod, setPaymentMethod] = useState(
        transaction.gateways[0].id
    );
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { orgId } = useParams();

    const handlePayment = () => {
        if (!paymentMethod)
            return toast.error("Vui lòng chọn phương thức thanh toán");
        if (loading) return;
        setLoading(true);
        payCreditOrder(orgId, transaction.transactionId, {
            paymentMethodId: paymentMethod,
        })
            .then((res) => {
                try {
                    if (res?.message) return toast.error(res.message);
                    if (
                        paymentMethod === "5ddc74a5-74d2-11ef-9351-02981be25414"
                    ) {
                        const isDev = window.location.hostname === "localhost";
                        const url = isDev
                            ? `${res?.content?.orderUrl}?mode=dev`
                            : res?.content?.orderUrl;
                        router.push(url);
                    }
                    if (
                        paymentMethod === "5f4f7e9b-85f4-11ef-bbd8-02981be25414"
                    ) {
                        // setOpen(false);
                        router.push(
                            pathname + "?bankApi=" + res?.content?.orderUrl
                        );
                    }
                } catch (error) {
                    toast.error(
                        error?.message ?? "Có lỗi xảy ra, vui lòng thử lại sau"
                    );
                }
            })
            .finally(() => setLoading(false));
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[700px] max-h-[90dvh] flex gap-4 overflow-y-auto">
                <div className="flex flex-col w-full ">
                    <DialogHeader>
                        <DialogTitle className="font-medium text-[16px] text-title flex items-center justify-between mb-3">
                            Tóm tắt đơn hàng
                        </DialogTitle>
                        <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                    </DialogHeader>
                    <ScrollArea className="flex flex-col">
                        <div className="flex flex-col gap-3 mt-4 h-[60dvh]">
                            <Label
                                title="Mã đơn hàng"
                                value={transaction.transactionId}
                            />
                            <Label
                                title="Số coin"
                                value={`${(
                                    transaction?.totalCredit || 0
                                ).toLocaleString()} coin`}
                            />
                            <Label
                                title="Số tiền cần thanh toán"
                                value={`${(
                                    transaction?.totalAmount || 0
                                ).toLocaleString()} đ`}
                            />
                            <span className="text-sm text-title font-medium">
                                Phương thức thanh toán
                            </span>
                            <div className="flex flex-col gap-2">
                                <RadioGroup value={paymentMethod}>
                                    {transaction.gateways.map((method) => (
                                        <div
                                            className="flex items-center gap-2 border border-[#E4E7EC] rounded-md py-2 px-4 cursor-pointer"
                                            onClick={() =>
                                                setPaymentMethod(method.id)
                                            }
                                            key={method.id}
                                        >
                                            <RadioGroupItem value={method.id} />
                                            <span className="text-sm text-title font-medium">
                                                {method.name}
                                            </span>
                                            <Image
                                                src={paymentIcons[method.name]}
                                                alt={method.name}
                                                width={26}
                                                height={26}
                                                className="ml-auto h-[34px] w-[34px] rounded-full border p-1"
                                            />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            <span className="text-sm text-title font-medium mt-2 mb-4">
                                Bằng việc tiến hành giao dịch, bạn đồng ý với{" "}
                                <a
                                    href="/privacy-policy.html"
                                    className="text-primary underline"
                                    target="_blank"
                                >
                                    điều khoản sử dụng dịch vụ
                                </a>
                                .
                            </span>
                            <div className="flex justify-end gap-2 border-t border-[#E4E7EC] pt-4 mt-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button onClick={handlePayment}>
                                    Thanh toán
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const Label = ({ title, value }) => {
    return (
        <div className="flex w-full justify-between">
            <span className="text-sm text-title font-medium">{title}</span>
            <span className="text-sm text-black font-semibold">{value}</span>
        </div>
    );
};

const paymentIcons = {
    VNPay: "/icons/vnpay.svg",
    "Chuyển khoản ngân hàng": "/icons/bank-transfer.svg",
};

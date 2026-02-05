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
import { GoCheckCircleFill } from "react-icons/go";
import { MdCheckCircle, MdClose } from "react-icons/md";

export default function PaymentResultDialog({ open, setOpen, paymentResult }) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Kết quả thanh toán
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1">
                    <div className="flex flex-col items-center justify-center mt-4">
                        <GoCheckCircleFill className="text-green-500 w-[45px] h-[45px]" />
                        <div className="text-title text-[18px] font-medium mb-2 mt-3">
                            Thanh toán thành công !!!
                        </div>
                        <div className="text-title text-[14px] text-center w-[320px]">
                            Bạn đã thanh toán gói tổng đài thành công, giờ đây
                            bạn có thể sử dụng dịch vụ
                        </div>
                    </div>
                    <div className="flex flex-col mt-4 p-4 gap-2 min-h-[300px]">
                        <div className=" text-title font-medium">
                            Thông tin đơn hàng
                        </div>
                        <Label
                            label="Loại giao dịch"
                            value="Thanh toán gói tổng đài"
                        />
                        <Label
                            label="Giá / thành viên / tháng"
                            value={`${paymentResult?.pricePerUnit.toLocaleString()} Coin`}
                        />
                        <Label
                            label="Số chỗ"
                            value={`${paymentResult?.value} chỗ`}
                        />
                        <Label
                            label="Số tháng"
                            value={`${paymentResult?.duration} tháng`}
                        />
                        <Label label="Phí giao dịch" value="Miễn phí" />
                        <Label
                            label="Tổng thanh toán"
                            value={`${(
                                paymentResult?.pricePerUnit *
                                paymentResult?.value *
                                paymentResult?.duration
                            ).toLocaleString()} Coin`}
                        />
                    </div>
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button onClick={() => setOpen(false)}>Hoàn tất</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const Label = ({ label, value }) => {
    return (
        <div className="flex items-center justify-between">
            <div className={cn("text-[14px] text-land")}>{label}</div>
            <div className={cn(`text-[14px] text-title font-medium `)}>
                {value}
            </div>
        </div>
    );
};

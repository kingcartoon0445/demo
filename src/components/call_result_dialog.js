import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import Avatar from "react-avatar";
import { getFirstAndLastWord } from "@/lib/utils";
import StageSelect from "@/components/customer_stage";

export default function CallResultDialog({
    open,
    setOpen,
    customer,
    duration,
    onSubmit,
}) {
    const [stage, setStage] = useState(null);
    const [note, setNote] = useState("");

    const handleSubmit = () => {
        // if (!stage) {
        //     toast.error("Vui lòng chọn trạng thái khách hàng");
        //     return;
        // }
        onSubmit(stage, note);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Kết quả cuộc gọi
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar
                            size="80"
                            name={getFirstAndLastWord(customer?.fullName)}
                            round
                            src={customer?.avatar}
                        />
                        <div className="text-center">
                            <h3 className="font-medium text-lg">
                                {customer?.fullName}
                            </h3>
                            <p className="text-gray-600">{customer?.phone}</p>
                        </div>
                        <div className="text-sm text-[#1F2329] mr-auto">
                            Thời lượng: {Math.floor(duration / 60)}:
                            {(duration % 60).toString().padStart(2, "0")}
                        </div>

                        <div className="w-full space-y-4">
                            {/* <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Trạng thái khách hàng
                                </label>
                                <StageSelect
                                    stage={stage}
                                    setStage={setStage}
                                    isShowIcon={false}
                                    className="w-full bg-bg1 rounded-lg px-3 py-2 justify-between text-text2 font-normal text-sm"
                                />
                            </div> */}

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Ghi chú
                                </label>
                                <Textarea
                                    placeholder="Nhập ghi chú..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="mt-auto p-4 border-t-[1px]">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit}>Lưu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";
import { CustomButton } from "@/components/custom_button";
import { FilterIcon } from "@/components/icons";
import { TimeDropdown } from "@/components/time_dropdown";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCustomDateTime } from "@/lib/utils";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { useState } from "react";
import {
    MdClose,
    MdPhoneCallback,
    MdPhoneForwarded,
    MdPhoneMissed,
} from "react-icons/md";
import { useParams } from "next/navigation";
import { getCallcenterReportHistory } from "@/api/callcenter";
import { useEffect } from "react";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function CallHistoryDialog({ open, setOpen }) {
    const params = useParams();
    const [callHistorys, setCallHistorys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [date, setDate] = useState({
        from: startOfDay(addDays(new Date(), parseInt(-9999))),
        to: endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState("-9999");
    const [phonePrefix, setPhonePrefix] = useState("all");
    const [callStatus, setCallStatus] = useState("all");

    const refreshList = () => {
        setCallHistorys([]);
        setPage(0);
        setHasMore(true);
    };

    useEffect(() => {
        if (open) {
            refreshList();
        }
    }, [open, date, phonePrefix, callStatus]);

    const next = async () => {
        setLoading(true);
        try {
            const response = await getCallcenterReportHistory(params.orgId, {
                StartDate: date.from.toISOString(),
                EndDate: date.to.toISOString(),
                Limit: 10,
                Offset: page * 10,
                CallStatus: callStatus === "all" ? null : callStatus,
            });

            if (response?.content) {
                const formattedData = response.content.map((call) => ({
                    id: `${call.fromNumber}-${call.callDate}`,
                    name: call.contactName || "Không xác định",
                    time: call.callDate,
                    duration: call.billsec,
                    price: call.credit || 0,
                    status: call.callStatus === "ANSWER" ? "success" : "failed",
                    phone: call.fromNumber,
                    type: call.direction === "inbound" ? "receive" : "send",
                }));

                setCallHistorys((prev) => [...prev, ...formattedData]);
                setPage((prev) => prev + 1);
                setHasMore(formattedData.length === 10);
            }
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const groupCallsByDate = (calls) => {
        const groups = {};
        calls.forEach((call) => {
            const date = new Date(call.time);
            const dateKey = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ).toISOString();

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(call);
        });
        return groups;
    };

    const getDateTitle = (dateStr) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const date = new Date(dateStr);

        if (date.toDateString() === today.toDateString()) {
            return "Hôm nay";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Hôm qua";
        } else {
            const weekDays = [
                "Chủ nhật",
                "Thứ hai",
                "Thứ ba",
                "Thứ tư",
                "Thứ năm",
                "Thứ sáu",
                "Thứ bảy",
            ];
            const weekDay = weekDays[date.getDay()];
            return `${weekDay}, ${date.getDate()}/${
                date.getMonth() + 1
            }/${date.getFullYear()}`;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] h-[640px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Lịch sử cuộc gọi
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center p-4">
                    <TimeDropdown
                        date={date}
                        setDate={setDate}
                        dateSelect={dateSelected}
                        setDateSelect={setDateSelected}
                        className={"bg-bg2"}
                        variant="none"
                    />
                    <Popover>
                        <PopoverTrigger>
                            <CustomButton>
                                <FilterIcon />
                            </CustomButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3">
                            <div className="flex flex-col gap-4 p-2">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Đầu số</h4>
                                    <Select
                                        value={phonePrefix}
                                        onValueChange={setPhonePrefix}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn đầu số" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Tất cả
                                            </SelectItem>
                                            {/* <SelectItem value="84">+84</SelectItem>
                                            <SelectItem value="1">+1</SelectItem> */}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">
                                        Trạng thái cuộc gọi
                                    </h4>
                                    <Select
                                        value={callStatus}
                                        onValueChange={setCallStatus}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Tất cả
                                            </SelectItem>
                                            <SelectItem value="ANSWER">
                                                Trả lời
                                            </SelectItem>
                                            <SelectItem value="BUSY">
                                                Bận
                                            </SelectItem>
                                            <SelectItem value="CANCEL">
                                                Huỷ
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <ScrollArea className="pb-0 flex-1">
                    <div className="flex flex-col gap-1 px-4">
                        {Object.entries(groupCallsByDate(callHistorys)).map(
                            ([dateKey, calls]) => (
                                <div key={dateKey}>
                                    <div className="py-2 font-medium">
                                        {getDateTitle(dateKey)}
                                    </div>
                                    <div className="border rounded-lg">
                                        {calls.map((callHistory) => (
                                            <div
                                                key={callHistory.id}
                                                className="flex items-center justify-between px-4 py-2"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {callHistory.type ===
                                                    "receive" ? (
                                                        <MdPhoneCallback
                                                            className="text-green-500"
                                                            size={20}
                                                        />
                                                    ) : callHistory.status ===
                                                      "failed" ? (
                                                        <MdPhoneMissed
                                                            className="text-red-500"
                                                            size={20}
                                                        />
                                                    ) : (
                                                        <MdPhoneForwarded
                                                            className="text-blue-500"
                                                            size={20}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {callHistory.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {callHistory.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="text-xs text-title font-medium">
                                                        -
                                                        {callHistory.price.toLocaleString()}{" "}
                                                        Coin
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatCustomDateTime(
                                                            callHistory.time
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                        <InfiniteScroll
                            hasMore={hasMore}
                            isLoading={loading}
                            next={next}
                            threshold={1}
                        >
                            {hasMore && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                        </InfiniteScroll>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4" />
            </DialogContent>
        </Dialog>
    );
}

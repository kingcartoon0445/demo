"use client";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MdClose, MdOutlineCall } from "react-icons/md";
import { useState, useEffect } from "react";
import { TimeDropdown } from "@/components/time_dropdown";
import { addDays, addHours, endOfDay, startOfDay } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getCallcenterRankByAnswer,
    getCallcenterRankByCredit,
    getCallcenterRankByDuration,
} from "@/api/callcenter";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Image from "next/image";
import { useParams } from "next/navigation";
import OverviewTab from "./overview_tab";

export default function ReportDetailDialog({ open, setOpen }) {
    const [activeTab, setActiveTab] = useState("tongquan");
    const [date, setDate] = useState({
        from: startOfDay(addDays(new Date(), parseInt(-9999))),
        to: endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState("-9999");
    const [rankType, setRankType] = useState("credit");
    const [rankData, setRankData] = useState([]);
    const { orgId } = useParams();

    useEffect(() => {
        const fetchRankData = async () => {
            const params = {
                startDate: addHours(date.from, 7),
                endDate: addHours(date.to, 7),
            };
            const response =
                rankType === "credit"
                    ? await getCallcenterRankByCredit(orgId, params)
                    : rankType === "duration"
                    ? await getCallcenterRankByDuration(orgId, params)
                    : await getCallcenterRankByAnswer(orgId, params);

            if (response?.content) {
                setRankData(response.content);
            }
        };

        fetchRankData();
    }, [date, rankType, orgId]);

    const formatDuration = (seconds) => {
        if (seconds < 60) {
            return `${seconds} giây`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} phút ${remainingSeconds} giây`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Báo cáo
                    </DialogTitle>
                </DialogHeader>
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full space-y-0"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tongquan">Tổng quan</TabsTrigger>
                        <TabsTrigger value="bxh">Bảng xếp hạng</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tongquan">
                        <div className="flex justify-between items-center px-4">
                            <TimeDropdown
                                date={date}
                                setDate={setDate}
                                dateSelect={dateSelected}
                                setDateSelect={setDateSelected}
                                className={"bg-bg2 mt-4"}
                                variant="none"
                            />
                        </div>
                        <ScrollArea className="p-4 h-[70dvh]">
                            <OverviewTab date={date} />
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="bxh">
                        <div className="flex justify-between items-center p-4">
                            <TimeDropdown
                                date={date}
                                setDate={setDate}
                                dateSelect={dateSelected}
                                setDateSelect={setDateSelected}
                                className={"bg-bg2"}
                                variant="none"
                            />
                            <Select
                                value={rankType}
                                onValueChange={setRankType}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Chọn loại xếp hạng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit">
                                        Chi phí
                                    </SelectItem>
                                    <SelectItem value="duration">
                                        Thời gian đàm thoại
                                    </SelectItem>
                                    <SelectItem value="answer">
                                        Hiệu quả cuộc gọi
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <ScrollArea className="px-4 h-[70dvh]">
                            <div className="space-y-4">
                                {rankData.map((item, index) => (
                                    <div
                                        key={item.profileId}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            {index < 3 ? (
                                                <Image
                                                    src={`/images/cup_${
                                                        index + 1
                                                    }.png`}
                                                    alt={`Top ${index + 1}`}
                                                    width={28}
                                                    height={28}
                                                />
                                            ) : (
                                                <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm">
                                                    {index + 1}
                                                </span>
                                            )}
                                            <Avatar
                                                name={getFirstAndLastWord(
                                                    item.fullName
                                                )}
                                                size="32"
                                                src={getAvatarUrl(item.avatar)}
                                                className="object-cover"
                                                round
                                            />
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">
                                                        {item.fullName}
                                                    </p>
                                                </div>
                                                {/* <p className="text-sm text-gray-500">Coka - Perfect Martech</p> */}
                                            </div>
                                            <div className="ml-auto text-right">
                                                <p className="text-sm text-title">
                                                    {rankType === "credit" ? (
                                                        <span>
                                                            {item?.credit?.toLocaleString()}{" "}
                                                            Coin
                                                        </span>
                                                    ) : rankType ===
                                                      "duration" ? (
                                                        <span>
                                                            {formatDuration(
                                                                item?.billsec
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {item?.callStatus}{" "}
                                                            trả lời
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {item?.count} cuộc gọi
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
                <DialogFooter className={"p-4"}></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

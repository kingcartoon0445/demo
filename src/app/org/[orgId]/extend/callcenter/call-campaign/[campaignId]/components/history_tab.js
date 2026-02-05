"use client";

import { getCallcampaignHistory } from "@/api/callcenter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import {
    MdCall,
    MdPhoneCallback,
    MdPhoneMissed,
    MdPhoneForwarded,
    MdPhoneInTalk,
    MdSearch,
} from "react-icons/md";
import { TimeDropdown } from "@/components/time_dropdown";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HistoryTab() {
    const { orgId, campaignId } = useParams();
    const { ref, inView } = useInView();
    const [searchText, setSearchText] = useState("");
    const [date, setDate] = useState({
        from: startOfDay(addDays(new Date(), parseInt(-9999))),
        to: endOfDay(new Date()),
    });
    const [dateSelected, setDateSelected] = useState("-9999");

    const {
        data,
        status,
        isFetchingNextPage,
        error,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: [
            "callcampaignHistory",
            orgId,
            campaignId,
            date.from,
            date.to,
            searchText,
        ],
        queryFn: async ({ pageParam }) => {
            try {
                const response = await getCallcampaignHistory(
                    orgId,
                    campaignId,
                    {
                        StartDate: date.from.toISOString(),
                        EndDate: date?.to
                            ? date?.to.toISOString()
                            : date.from.toISOString(),
                        SearchText: searchText,
                        offset: pageParam * 10,
                        limit: 10,
                    }
                );
                if (!response) {
                    throw new Error("Không có dữ liệu trả về");
                }
                return response;
            } catch (err) {
                console.error("Chi tiết lỗi:", err);
                throw new Error(`Lỗi khi tải lịch sử: ${err.message}`);
            }
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.metadata.count == 10
                ? lastPage.metadata.offset / 10 + 1
                : null,
    });

    useEffect(() => {
        let timeoutId;
        if (!isFetchingNextPage && inView && hasNextPage) {
            timeoutId = setTimeout(() => {
                fetchNextPage();
            }, 300);
        }
        return () => clearTimeout(timeoutId);
    }, [fetchNextPage, inView, hasNextPage, isFetchingNextPage]);

    const history = data?.pages?.flatMap((page) => page?.content || []) || [];

    const getCallIcon = (status, direction) => {
        if (direction === "inbound") {
            return <MdPhoneCallback className="text-green-500" size={20} />;
        }

        switch (status) {
            case "ANSWER":
                return <MdPhoneInTalk className="text-green-500" size={20} />;
            case "CANCEL":
            case "NO ANSWER":
            case "BUSY":
            case "FAILED":
                return <MdPhoneMissed className="text-red-500" size={20} />;
            default:
                return <MdCall className="text-gray-500" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "ANSWER":
                return "bg-green-500";
            case "CANCEL":
            case "NO ANSWER":
            case "BUSY":
            case "FAILED":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between mt-4">
                <div className="w-[300px] relative">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm bằng số điện thoại"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full rounded-lg pl-9"
                    />
                    <MdSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={20}
                    />
                </div>
                <div className="filter flex gap-2">
                    <TimeDropdown
                        date={date}
                        setDate={setDate}
                        dateSelect={dateSelected}
                        setDateSelect={setDateSelected}
                        className={"bg-bg2"}
                        variant="none"
                    />
                </div>
            </div>

            {status === "pending" ? (
                <div className="p-4 text-center text-gray-500">Đang tải...</div>
            ) : status === "error" ? (
                <div className="p-4 text-center text-red-500">
                    {error?.message || "Có lỗi xảy ra khi tải lịch sử cuộc gọi"}
                </div>
            ) : (
                <ScrollArea className="h-[calc(100dvh-440px)]">
                    <div className="space-y-4 mt-2">
                        {history.map((call, index) => (
                            <div
                                key={index}
                                className="flex h-full items-center rounded-lg border bg-white"
                            >
                                <div
                                    className={`w-[2.5px] rounded-r-full h-10 ${getStatusColor(
                                        call.callStatus
                                    )}`}
                                />

                                <div className="flex flex-1 p-3 gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        {getCallIcon(
                                            call.callStatus,
                                            call.direction
                                        )}
                                        <div>
                                            <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                                                {call.fullName}
                                                <span className="px-2 py-[1px] text-xs rounded-sm border border-land text-land">
                                                    Lần {call.index}
                                                </span>
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-land">
                                                <span>
                                                    {call.phone.replace(
                                                        /^84/,
                                                        "0"
                                                    )}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    Người phụ trách:{" "}
                                                    <span className="text-title font-medium">
                                                        {call.assignName}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end text-xs text-gray-500">
                                        <div>
                                            {format(
                                                new Date(call.callDate),
                                                "MM/dd/yyyy HH:mm:ss"
                                            )}
                                        </div>
                                        {call.recordingFile && (
                                            <audio
                                                controls
                                                className="h-6 mt-[2px]"
                                            >
                                                <source
                                                    src={call.recordingFile}
                                                    type="audio/mpeg"
                                                />
                                                Trình duyệt của bạn không hỗ trợ
                                                phát audio.
                                            </audio>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={ref} className="min-h-[32px]">
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                            {!hasNextPage && history.length > 0 && (
                                <div className="text-center text-gray-500 py-4">
                                    Đã tải hết dữ liệu
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

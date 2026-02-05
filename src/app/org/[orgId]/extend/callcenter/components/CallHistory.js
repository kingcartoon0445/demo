"use client"
import { CallBackIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdCall, MdPhoneCallback, MdPhoneForwarded, MdPhoneMissed } from "react-icons/md";
import { useEffect, useState } from "react";
import CallHistoryDialog from "./call_history_dialog";
import { format, formatDuration, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { formatCustomDateTime } from "@/lib/utils";
import { useParams } from "next/navigation";
import { getCallcenterReportHistory } from "@/api/callcenter";

export default function CallHistory({ isActive }) {
    const params = useParams();
    const [openCallHistory, setOpenCallHistory] = useState(false);
    const [callHistorys, setCallHistorys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedCallId, setExpandedCallId] = useState(null);

    const fetchCallHistory = async () => {
        setLoading(true);
        try {
            const response = await getCallcenterReportHistory(params?.orgId, {
                StartDate: "1997-07-03T17:00:00.000Z",
                EndDate: endOfDay(new Date()).toISOString(),
                Limit: 10,
                Offset: 0
            });

            if (response?.content) {
                const formattedData = response.content.map(call => ({
                    id: `${call?.fromNumber || ''}-${call?.callDate || ''}`,
                    name: call?.contactName || "Không xác định",
                    time: call?.callDate || new Date(),
                    duration: call?.billsec || 0,
                    price: call?.credit || 0,
                    status: call?.callStatus === "ANSWER" ? "success" : "failed",
                    phone: (call?.fromNumber || '').replace(/^84/, "0"),
                    type: call?.direction === "inbound" ? "receive" : "send",
                    recordingFile: call?.recordingFile || null
                }));
                setCallHistorys(formattedData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            fetchCallHistory();
        }
    }, [isActive]);

    const handleCardClick = (id, hasRecording) => {
        if (hasRecording) {
            setExpandedCallId(expandedCallId === id ? null : id);
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-3 pb-6">
            {openCallHistory && <CallHistoryDialog
                open={openCallHistory}
                setOpen={setOpenCallHistory}
            />}
            <div className="text-[18px] font-medium flex items-center justify-between">
                <div>Cuộc gọi gần đây</div>
                {isActive && <Button variant="ghost" onClick={() => setOpenCallHistory(true)} className="text-primary hover:text-primary/80 text-sm h-[30px]">Xem tất cả</Button>}
            </div>
            <ScrollArea className="border rounded-lg">
                <div className="flex flex-col py-1">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                    ) : callHistorys.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Không có cuộc gọi nào</div>
                    ) : (
                        callHistorys.map((callHistory) => (
                            <div
                                key={callHistory.id}
                                className={`flex items-center justify-between px-4 py-2 cursor-pointer ${callHistory.recordingFile ? 'hover:bg-gray-50' : ''}`}
                                onClick={() => handleCardClick(callHistory.id, callHistory.recordingFile)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="pt-1.5">
                                        {callHistory.type === 'receive' ? (
                                            <MdPhoneCallback className="text-green-500" size={20} />
                                        ) : callHistory.status === 'failed' ? (
                                            <MdPhoneMissed className="text-red-500" size={20} />
                                        ) : (
                                            <MdPhoneForwarded className="text-blue-500" size={20} />
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-sm font-medium">{callHistory.name}</div>
                                        <span className="text-xs text-gray-500 gap-1.5 flex items-center">{callHistory.phone}</span>
                                        <div className={`flex flex-col transition-all duration-300 overflow-hidden ${expandedCallId === callHistory.id ? 'max-h-20' : 'max-h-0'}`}>
                                            {callHistory.recordingFile && (
                                                <audio
                                                    controls
                                                    className="h-6 mt-[2px] ml-[-16px]"
                                                >
                                                    <source src={callHistory.recordingFile} type="audio/mpeg" />
                                                    Trình duyệt của bạn không hỗ trợ phát audio.
                                                </audio>
                                            )}
                                        </div>

                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-title font-medium">-{callHistory.price.toLocaleString()} Coin</span>
                                    <span className="text-xs text-gray-500">{formatCustomDateTime(callHistory.time)}</span>

                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
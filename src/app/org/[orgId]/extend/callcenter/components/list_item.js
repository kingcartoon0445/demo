"use client";
import { getCallcampaignList } from "@/api/callcenter";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { MdOutlineCall } from "react-icons/md";
import { create } from "zustand";

export const useCallCampaignList = create((set) => ({
    callCampaignList: [],
    setCallCampaignList: (callCampaignList) => set({ callCampaignList }),
    resetCallCampaignList: () => set({ callCampaignList: [] }),
    addCallCampaign: (callCampaign) =>
        set((state) => ({
            callCampaignList: [...state.callCampaignList, callCampaign],
        })),
    removeCallCampaign: (callCampaignId) =>
        set((state) => ({
            callCampaignList: state.callCampaignList.filter(
                (callCampaign) => callCampaign.id !== callCampaignId,
            ),
        })),
    updateCallCampaign: (callCampaign) =>
        set((state) => ({
            callCampaignList: state.callCampaignList.map((c) =>
                c.id === callCampaign.id ? callCampaign : c,
            ),
        })),
}));

export default function CallCampaignList() {
    const { callCampaignList, setCallCampaignList } = useCallCampaignList();
    const { orgId } = useParams();

    useEffect(() => {
        getCallcampaignList(orgId).then((res) => {
            if (res.code === 0) {
                setCallCampaignList(res.content);
            }
        });
    }, []);
    return (
        <div className="grid grid-cols-2 px-4 py-2 gap-4">
            {callCampaignList.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-gray-400 text-lg mb-2">
                        Chưa có chiến dịch nào
                    </div>
                    <div className="text-gray-400 text-sm">
                        Nhấn nút "Thêm mới" để tạo chiến dịch gọi hàng loạt đầu
                        tiên
                    </div>
                </div>
            ) : (
                callCampaignList.map((callCampaign) => (
                    <Link
                        href={`/org/${orgId}/extend/callcenter/call-campaign/${callCampaign.id}`}
                        key={callCampaign.id}
                        className="flex items-start justify-between w-full border-[1px] border-border rounded-lg p-4"
                    >
                        <div className="flex flex-col gap-2">
                            <span className="text-title font-medium flex items-center gap-2">
                                <Image
                                    src="/images/call_campaign_icon.png"
                                    alt="call_campaign"
                                    width={26}
                                    height={26}
                                />{" "}
                                {callCampaign.title}
                            </span>
                            <span className="text-land text-sm flex items-center gap-1">
                                <Image
                                    src="/images/sim_card_icon.png"
                                    alt="sim_card"
                                    width={12}
                                    height={12}
                                />
                                {callCampaign.telephoneNumber &&
                                    callCampaign.telephoneNumber.replace(
                                        /^84/,
                                        "0",
                                    )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button className="flex items-center text-xs gap-1 h-[32px] px-[10px]">
                                <MdOutlineCall className="text-lg" />
                                Gọi ngay
                            </Button>
                        </div>
                    </Link>
                ))
            )}
        </div>
    );
}

"use client";
import { getCallcampaignReport } from "@/api/callcenter";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MdPerson, MdPhoneInTalk, MdPhoneMissed } from "react-icons/md";
import { PiNumpadBold } from "react-icons/pi";

export default function SummaryCard() {
    const { orgId, campaignId } = useParams();
    const [report, setReport] = useState(null);
    useEffect(() => {
        getCallcampaignReport(orgId, campaignId).then(res => {
            if (res.code === 0) {
                setReport(res.content);
            }
        })
    }, [])
    return <div className="flex justify-between gap-4 p-4">
        <div className="flex justify-between w-full bg-bg2 rounded-2xl p-4">
            <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center">
                <MdPerson className="h-[20px] w-[20px] text-primary" />
            </div>
            <div className="text-xl font-medium text-end text-primary">{report?.totalContact}
                <div className="text-sm text-title">Tổng liên hệ</div>
            </div>
        </div>
        <div className="flex justify-between w-full bg-bg2 rounded-2xl p-4">
            <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center">
                <PiNumpadBold className="h-[20px] w-[20px] text-primary" />
            </div>
            <div className="text-xl font-medium text-end text-primary">{report?.totalCalled}
                <div className="text-sm text-title">Đã gọi</div>
            </div>
        </div>
        <div className="flex justify-between w-full bg-bg2 rounded-2xl p-4">
            <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center">
                <MdPhoneInTalk className="h-[20px] w-[20px] text-[#5EB640]" />
            </div>
            <div className="text-xl font-medium text-end text-primary">{report?.totalSuccess}
                <div className="text-sm text-title">Thành công</div>
            </div>
        </div>
        <div className="flex justify-between w-full bg-bg2 rounded-2xl p-4">
            <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center">
                <MdPhoneMissed className="h-[20px] w-[20px] text-[#FF0707]" />
            </div>
            <div className="text-xl font-medium text-end text-primary">{report?.totalFailed}
                <div className="text-sm text-title">Thất bại</div>
            </div>
        </div>
    </div>
}
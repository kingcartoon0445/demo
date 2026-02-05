"use client"

import { Button } from '@/components/ui/button';
import { cn, formatDuration } from '@/lib/utils';
import { IoMdTime } from 'react-icons/io';
import { MdAttachMoney, MdOutlineCall } from 'react-icons/md';
import { Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ReportDetailDialog from './report_detail_dialog';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { getCallcenterReportByDate } from '@/api/callcenter';

export default function CallReport() {
    const params = useParams();
    const [openReportDetailDialog, setOpenReportDetailDialog] = useState(false);
    const [reportData, setReportData] = useState({
        totalCall: 0,
        totalCredit: 0,
        callDurationsByDate: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiParams = {
                    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                };
                const response = await getCallcenterReportByDate(params?.orgId, apiParams);
                if (response?.content) {
                    setReportData({
                        totalCall: response.content.totalCall || 0,
                        totalCredit: response.content.totalCredit || 0,
                        callDurationsByDate: (response.content.callDurationsByDate || []).map(item => ({
                            name: new Date(item?.date).toLocaleDateString(),
                            value: item?.duration || 0
                        }))
                    });
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [params?.orgId]);

    return (
        <div className="flex flex-col gap-2 mt-3 w-full pb-6">
            <ReportDetailDialog open={openReportDetailDialog} setOpen={setOpenReportDetailDialog} />
            <div className="text-[18px] font-medium flex items-center justify-between">
                <div>Báo cáo 7 ngày gần nhất</div>
                <Button variant="ghost" onClick={() => setOpenReportDetailDialog(true)} className="text-primary hover:text-primary/80 text-sm h-[30px]">Xem chi tiết</Button>
            </div>
            <div className="grid grid-cols-2 gap-5 w-full">
                <div className="col-span-1 flex flex-col gap-5">
                    <Card title="Tổng cuộc gọi" icon={<MdOutlineCall />} color={"text-[#4DAE50]"} value={reportData.totalCall.toLocaleString()} unit="Cuộc" />
                    <Card title="Tổng chi tiêu" icon={<MdAttachMoney />} color={"text-[#1E96F3]"} value={reportData.totalCredit.toLocaleString()} unit="Coin" />
                </div>
                <Card className="col-span-2" title="Thời gian đàm thoại" color={"text-[#554FE8]"} icon={<IoMdTime />} value={reportData.callDurationsByDate.reduce((sum, item) => sum + item.value, 0).toLocaleString()} unit="s (Giây)" >
                    <ResponsiveContainer width="110%" className={"ml-[-20px]"} height={160}>
                        <AreaChart data={reportData.callDurationsByDate}>
                            <Tooltip formatter={(value, name, props) => [`${value.toLocaleString()} giây`, props.payload.name]} labelFormatter={() => ""} />
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="80%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    )
}


const Card = ({ title, icon, value, unit, color, children }) => (
    <div className="flex flex-col border p-4 rounded-lg w-full flex-1">
        <div className="flex items-center justify-between">
            <h3 className={cn(" text-sm font-medium", color)}>{title}</h3>
            {icon && <span className={cn("text-xl ", color)}>{icon}</span>}
        </div>
        {children}
        <div >
            <p className="text-xl font-medium text-black">{value}</p>
            {unit && <p className="text-sm text-gray-500">{unit}</p>}
        </div>
    </div>
);
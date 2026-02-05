"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCallcenterReportByDate, getCallcenterReportByDirection, getCallcenterReportByCredit, getCallcenterReportByProvider } from '@/api/callcenter';
import { MdOutlineCall, MdAttachMoney } from 'react-icons/md';
import { cn, formatDuration } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { addHours } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoDotFill } from 'react-icons/go';

// Định nghĩa danh sách cố định các nhà mạng
const PROVIDERS = {
    'Mobifone': '#a5f2aa',
    'Vinaphone': '#f5c19e',
    'Viettel': '#b6f1fd',
    'Vietnamobile': '#9b8cf7',
    'Không xác định': '#fc9494'
};

export default function OverviewTab({ date }) {
    const { orgId } = useParams();
    const [reportData, setReportData] = useState({
        totalCall: 0,
        totalCredit: 0
    });
    const [directionData, setDirectionData] = useState({
        inbound: [],
        outbound: []
    });
    const [selectedDirection, setSelectedDirection] = useState('OUTBOUND');
    const [creditData, setCreditData] = useState([]);
    const [providerData, setProviderData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const params = {
                startDate: addHours(date.from, 7),
                endDate: addHours(date.to, 7)
            };
            const response = await getCallcenterReportByDate(orgId, params);
            if (response?.content) {
                setReportData({
                    totalCall: response.content.totalCall,
                    totalCredit: response.content.totalCredit,
                    callDurationsByDate: response.content.callDurationsByDate.map(item => ({
                        name: new Date(item.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit'
                        }),
                        fullDate: new Date(item.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }),
                        value: item.duration
                    }))
                });
            }

            const [inboundRes, outboundRes] = await Promise.all([
                getCallcenterReportByDirection(orgId, { ...params, direction: 'INBOUND' }),
                getCallcenterReportByDirection(orgId, { ...params, direction: 'OUTBOUND' })
            ]);

            const formatDirectionData = (data) => {
                return data?.content?.map(item => ({
                    date: new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit'
                    }),
                    answer: item.answer,
                    total: item.total
                })) || [];
            };

            setDirectionData({
                inbound: formatDirectionData(inboundRes),
                outbound: formatDirectionData(outboundRes)
            });

            const creditRes = await getCallcenterReportByCredit(orgId, params);
            if (creditRes?.content) {
                setCreditData(creditRes.content.map(item => ({
                    name: new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit'
                    }),
                    fullDate: new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    credit: item.credit
                })));
            }

            const providerRes = await getCallcenterReportByProvider(orgId, params);
            if (providerRes?.content) {
                // Tạo mảng đầy đủ với tất cả nhà mạng
                const fullProviderData = Object.keys(PROVIDERS).map(provider => ({
                    provider,
                    count: providerRes.content.find(item => item.provider === provider)?.count || 0
                }));
                setProviderData(fullProviderData);
            }
        };
        fetchData();
    }, [date, orgId]);

    const getFilteredData = () => {
        return selectedDirection === 'INBOUND' ? directionData.inbound : directionData.outbound;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card
                    title="Tổng cuộc gọi"
                    icon={<MdOutlineCall />}
                    color="text-[#4DAE50]"
                    value={reportData?.totalCall?.toLocaleString()}
                    unit="Cuộc"
                    details={[
                        { label: "Cuộc gọi đi", value: reportData?.totalCall?.toLocaleString() },
                        { label: "Cuộc gọi đến", value: 0 }
                    ]}
                />
                <Card
                    title="Tổng chi tiêu"
                    icon={<MdAttachMoney />}
                    color="text-[#1E96F3]"
                    value={reportData?.totalCredit?.toLocaleString()}
                    unit="Coin"
                    details={[
                        { label: "Thời gian", value: formatDuration(reportData?.callDurationsByDate?.reduce((sum, item) => sum + item.value, 0)) }
                    ]}
                />
            </div>



            <div className="border p-4 rounded-lg bg-white">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-base font-medium">Thống kê cuộc gọi</h3>
                        <p className="text-sm text-gray-500">
                            Tổng số cuộc gọi: {getFilteredData().reduce((sum, item) => sum + item.total, 0)} cuộc
                        </p>
                    </div>
                    <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                        <SelectTrigger className="w-[150px] bg-bg1 border-none outline-none">
                            <SelectValue placeholder="Chọn loại cuộc gọi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OUTBOUND">Cuộc gọi đi</SelectItem>
                            <SelectItem value="INBOUND">Cuộc gọi đến</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={getFilteredData()}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            barSize={25}
                        >
                            <CartesianGrid strokeDasharray="4 4" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} />
                            <Bar
                                name={selectedDirection === 'OUTBOUND' ? "Cuộc gọi đi" : "Cuộc gọi đến"}
                                dataKey="total"
                                stackId="a"
                                fill="#5EB640"
                            />
                            <Bar
                                name="Trả lời"
                                dataKey="answer"
                                stackId="a"
                                fill="#FE7F09"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="border p-4 rounded-lg bg-white">
                <div className="flex flex-col gap-2 mb-2">
                    <h3 className="text-base font-medium">Chi phí</h3>
                    <p className="text-sm text-gray-500">
                        Tổng chi phí: {creditData.reduce((sum, item) => sum + item.credit, 0).toLocaleString()} Coin
                    </p>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={creditData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="4 4" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value.toLocaleString()}`}
                            />
                            <Tooltip
                                formatter={(value, name) => [
                                    `${value.toLocaleString()} Coin`,
                                    'Chi phí'
                                ]}
                                labelFormatter={(label, payload) =>
                                    payload[0]?.payload?.fullDate || ''
                                }
                            />
                            <Legend
                                verticalAlign="top"
                                height={34}
                                formatter={() => ['Chi phí (Coin)']}
                            />
                            <Line
                                name="Chi phí (Coin)"
                                type="linear"
                                dataKey="credit"
                                stroke="#FF0000"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#FF0000" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="border p-4 rounded-lg bg-white">
                <div className="flex flex-col gap-2 mb-2">
                    <h3 className="text-base font-medium">Thời gian đàm thoại</h3>
                    <p className="text-sm text-gray-500">
                        Tổng thời gian đàm thoại: {formatDuration(reportData?.callDurationsByDate?.reduce((sum, item) => sum + item.value, 0) || 0)}
                    </p>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={reportData?.callDurationsByDate || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}s`}
                            />
                            <Tooltip
                                formatter={(value, name, props) => [
                                    `${formatDuration(value)}`,
                                    `Thời gian ${props.payload.fullDate}`
                                ]}
                                labelFormatter={() => ""}
                            />
                            <Legend
                                verticalAlign="top"
                                height={34}
                                formatter={() => ['Thời gian (s)']}
                            />
                            <Area
                                name="Thời gian (s)"
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorDuration)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="border px-4 pt-4 rounded-lg bg-white">
                <div className="flex flex-col gap-2 mb-2">
                    <h3 className="text-base font-medium">Cuộc gọi theo nhà mạng</h3>
                </div>

                <div className="flex items-center gap-3 w-full justify-between h-[220px]">
                    <div className="flex flex-col-reverse gap-3 w-[50%] ml-6">
                        {providerData?.map((item, index) => (
                            <div className="flex items-center" key={index}>
                                <div
                                    className="w-[24px] h-[12px]"
                                    style={{ backgroundColor: PROVIDERS[item.provider] }}
                                />
                                <div className="ml-2 text-text2 text-[0.8vw]">
                                    {item.provider}
                                </div>
                                <div className="flex items-center w-[60px] text-text2 ml-auto gap-1 text-[0.8vw] whitespace-nowrap">
                                    <GoDotFill className="text-[0.6vw]" />
                                    {item.count}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative w-[40%] h-[100%]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={providerData}
                                    dataKey="count"
                                    nameKey="provider"
                                    innerRadius="68%"
                                    outerRadius="90%"
                                    startAngle={90}
                                    endAngle={450}
                                >
                                    {providerData?.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PROVIDERS[entry.provider]}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="flex flex-col text-[0.8vw] items-center text-title font-medium absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
                            <div>Tổng cuộc gọi</div>
                            <b className="text-[1.2vw]">
                                {providerData?.reduce((sum, item) => sum + item.count, 0)}
                            </b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Card = ({ title, icon, value, unit, color, details }) => (
    <div className="flex flex-col border p-4 rounded-lg w-full bg-white">
        <div className="flex items-center gap-2">
            {icon && <span className={cn("text-xl bg-[#b6f1fd] rounded-lg p-2", color)}>{icon}</span>}
            <div>
                <h3 className={cn("text-sm", color)}>{title}</h3>

                <div className="flex items-center gap-2">
                    <p className="text-base font-medium text-black">{value} {unit}</p>
                </div>
            </div>
        </div>
        {details && (
            <div className="mt-3 space-y-1">
                {details.map((detail, index) => (
                    <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-500">{detail.label}</span>
                        <span className="text-gray-700">{detail.value}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
); 
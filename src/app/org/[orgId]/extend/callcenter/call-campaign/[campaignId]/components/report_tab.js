"use client";

import {
  getCallcampaignRankByUser,
  getCallcampaignReportByDate,
  getCallcampaignReportByStage,
} from "@/api/callcenter";
import { endOfDay, startOfDay, addDays, addHours } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MdOutlineCall } from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { GoDotFill } from "react-icons/go";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Image from "next/image";
import { TimeDropdown } from "@/components/time_dropdown";

// Thêm object constant để map tên với màu
const STATUS_COLORS = {
  'Tiềm năng': '#554FE8',
  'Không tiềm năng': '#646A73',
  'Chưa xác định': '#64D9FF'
};


export default function ReportTab() {
  const { orgId, campaignId } = useParams();
  const [report, setReport] = useState(null);
  const [rank, setRank] = useState(null);
  const [reportByStage, setReportByStage] = useState(null);
  const [reportDate, setReportDate] = useState({
    from: startOfDay(addDays(new Date(), parseInt(-7))),
    to: endOfDay(new Date()),
  });
  const [reportDateSelected, setReportDateSelected] = useState("-7");

  const [rankDate, setRankDate] = useState({
    from: startOfDay(addDays(new Date(), parseInt(-7))),
    to: endOfDay(new Date()),
  });
  const [rankDateSelected, setRankDateSelected] = useState("-7");

  useEffect(() => {
    const endDate = reportDate.to ? endOfDay(addHours(reportDate.to, 7)) : endOfDay(addHours(reportDate.from, 7));
    getCallcampaignReportByDate(orgId, campaignId, {
      StartDate: addHours(reportDate.from, 7).toISOString(),
      EndDate: endDate.toISOString(),
    }).then((res) => {
      setReport(res.content);
    });
  }, [reportDate]);
  useEffect(() => {
    getCallcampaignReportByStage(orgId, campaignId).then((res) => {
      setReportByStage(res.content);
    });
  }, []);

  useEffect(() => {
    const endDate = rankDate.to ? endOfDay(addHours(rankDate.to, 7)) : endOfDay(addHours(rankDate.from, 7));
    getCallcampaignRankByUser(orgId, campaignId, {
      StartDate: addHours(rankDate.from, 7).toISOString(),
      EndDate: endDate.toISOString(),
    }).then((res) => {
      setRank(res.content);
    });
  }, [rankDate]);

  return (
    <div className="w-full mt-4 overflow-y-auto">
      <div className="flex gap-5 h-full">
        <div className="flex flex-col w-[55%] h-[calc(100dvh-380px)]">
          <div className="border py-4 pr-4 rounded-lg">
            <div className="flex items-center justify-between pl-6 pr-2">
              <div className="flex flex-col">
                <h3 className="font-medium text-title">Báo cáo cuộc gọi</h3>
                <div className="text-title font-bold text-2xl">{report?.map(item => item.count).reduce((sum, item) => sum + item, 0).toLocaleString()}</div>
              </div>
              <TimeDropdown
                date={reportDate}
                setDate={setReportDate}
                dateSelect={reportDateSelected}
                setDateSelect={setReportDateSelected}
                className={"bg-bg2"}
                variant="none"
              />
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  margin={{ left: 0 }}
                  data={report?.map(item => ({
                    name: new Date(item.date).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit'
                    }),
                    fullDate: new Date(item.date).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }),
                    value: item.count,
                    date: item.date
                  })) || []}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value.toLocaleString()} cuộc gọi`, 'Số cuộc gọi']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || ''}
                  />
                  <Legend
                    verticalAlign="top"
                    height={34}
                    formatter={() => ['Số cuộc gọi']}
                  />

                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    name="Số cuộc gọi"
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorUv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border px-4 pt-4 rounded-lg mt-5">
            <div className="flex flex-col gap-2 mb-2">
              <h3 className="text-base font-medium">Thống kê trạng thái cuộc gọi</h3>
            </div>

            <div className="flex items-center gap-3 w-full justify-between h-[220px]">
              <div className="relative w-[40%] h-[100%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportByStage}
                      dataKey="count"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="95%"
                      startAngle={90}
                      endAngle={450}
                    >
                      {reportByStage?.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col text-[0.8vw] items-center text-title font-medium absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
                  <div>Tổng cuộc gọi</div>
                  <b className="text-[1.2vw]">
                    {reportByStage?.reduce((sum, item) => sum + item.count, 0)}
                  </b>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 w-[50%] ml-6">
                {reportByStage?.map((item) => (
                  <div className="flex items-center" key={item.name}>
                    <div
                      className="w-[28px] h-[16px]"
                      style={{
                        backgroundColor: STATUS_COLORS[item.name]
                      }}
                    />
                    <div className="ml-2 text-text2 text-[0.9vw]">
                      {item.name}
                    </div>
                    <div className="flex items-center w-[60px] text-text2 ml-auto gap-1 text-[0.8vw] whitespace-nowrap">
                      <GoDotFill className="text-[0.6vw]" />
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </div>
        </div>

        <div className="flex flex-col w-[45%] h-full">
          <div className="border rounded-lg p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-title">Bảng xếp hạng thành viên</h3>
              <TimeDropdown
                date={rankDate}
                setDate={setRankDate}
                dateSelect={rankDateSelected}
                setDateSelect={setRankDateSelected}
                className={"bg-bg2"}
                variant="none"
              />
            </div>

            <div className="flex flex-col gap-3">
              {rank?.map((item, index) => (
                <div
                  key={item.fullName}
                  className={`flex items-center gap-3 p-3 rounded-lg ${index === 0
                    ? 'rank-top1-bg'
                    : index === 1
                      ? 'rank-top2-bg'
                      : index === 2
                        ? 'rank-top3-bg'
                        : 'bg-bg1'
                    }`}
                >
                  {index < 3 ? (
                    <Image
                      src={`/images/cup_${index + 1}.png`}
                      alt={`Top ${index + 1}`}
                      width={28}
                      height={28}
                      className="w-8"
                    />
                  ) : (
                    <div className="w-6 text-center font-medium">{index + 1}</div>
                  )}
                  <Avatar
                    name={getFirstAndLastWord(item.fullName)}
                    round={true}
                    src={getAvatarUrl(item.avatar)}
                    className="object-cover"
                    size="40"
                  />
                  <div className="flex-1 font-medium">{item.fullName}</div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <span>{item.count} cuộc gọi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

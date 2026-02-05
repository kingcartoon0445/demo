"use client";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GoDotFill } from "react-icons/go";
import { CustomButton } from "@/components/common/custom_button";
import { BiExpandAlt } from "react-icons/bi";

export function ReportCard3({ reportData, isLoading: externalLoading }) {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        if (reportData) {
            try {
                // Xử lý dữ liệu từ API
                const processData = () => {
                    // Khởi tạo đối tượng để lưu tổng số theo từng nhóm trạng thái
                    const statusGroups = {};

                    // Lặp qua từng mục trong reportData để tổng hợp dữ liệu
                    reportData.forEach((item) => {
                        const statusGroup =
                            item["Nhóm trạng thái"] || "Chưa xác định";
                        const hexCode = item["HexCode"] || "#9B8CF7"; // Mặc định nếu không có hex code

                        // Cập nhật dữ liệu nhóm trạng thái
                        if (!statusGroups[statusGroup]) {
                            statusGroups[statusGroup] = {
                                count: 0,
                                hex: hexCode,
                            };
                        }
                        statusGroups[statusGroup].count += 1;
                    });

                    // Chuyển đổi dữ liệu sang định dạng phù hợp cho biểu đồ
                    const transformedData = Object.entries(statusGroups).map(
                        ([name, data]) => ({
                            name,
                            value: data.count,
                            hex: data.hex,
                        }),
                    );

                    return transformedData;
                };

                // Xử lý dữ liệu theo loại đã chọn
                const transformedData = processData();

                setChartData(transformedData);
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing data:", error);
                setChartData([]);
                setIsLoading(false);
            }
        } else if (externalLoading) {
            setIsLoading(true);
        } else {
            setChartData([]);
            setIsLoading(false);
        }
    }, [reportData, externalLoading]);

    const totalCustomers = chartData.reduce((sum, obj) => sum + obj.value, 0);

    if (isLoading) {
        return (
            <div className="w-full min-h-[300px] p-4 h-full">
                <Skeleton className="w-full h-full rounded-xl" />
            </div>
        );
    }

    if (!chartData || chartData.length === 0) {
        return (
            <div className="w-full min-h-[300px] p-4 h-full flex items-center justify-center">
                <div className="text-gray-500">Không có dữ liệu</div>
            </div>
        );
    }

    return (
        <Card className="w-full min-h-[300px] p-4 border-none shadow-none !bg-transparent">
            <div className="flex flex-col h-full">
                <div className="flex items-center w-full">
                    <div className="text-title text-[1vw] font-medium mr-auto">
                        Biểu đồ trạng thái khách hàng
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full justify-between h-full my-auto">
                    <div className="flex flex-col-reverse gap-5 w-[45%]">
                        {chartData.map((e, i) => (
                            <div className="flex items-center" key={i}>
                                <div
                                    className="w-[42px] h-[24px]"
                                    style={{ backgroundColor: e.hex }}
                                />
                                <div className="ml-2 text-text2 text-[0.8vw]">
                                    {e.name}
                                </div>
                                <div className="flex items-center w-[60px] text-text2 ml-auto gap-1 text-[0.8vw] whitespace-nowrap">
                                    <GoDotFill className="text-[0.6vw]" />
                                    {e.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative flex-1 h-[90%]">
                        <ResponsiveContainer height={280} width={"100%"}>
                            <PieChart>
                                <Tooltip
                                    formatter={(value, name) => [
                                        `${value} khách hàng`,
                                        `${name}`,
                                    ]}
                                    contentStyle={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.95)",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "12px",
                                        boxShadow:
                                            "0 2px 10px rgba(0, 0, 0, 0.1)",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                    itemStyle={{
                                        color: "#666",
                                        fontSize: "13px",
                                        padding: "4px 0",
                                    }}
                                    labelStyle={{
                                        color: "#333",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                    }}
                                    wrapperStyle={{
                                        outline: "none",
                                        zIndex: 100,
                                    }}
                                    cursor={{ fill: "transparent" }}
                                />
                                <Pie
                                    data={chartData}
                                    innerRadius={"68%"}
                                    outerRadius={"90%"}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    startAngle={90}
                                    endAngle={450}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.hex}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="flex flex-col text-[0.8vw] items-center text-title font-medium absolute top-1/2 left-1/2 -translate-y-1/3 -translate-x-1/2">
                            <div>Tổng số khách hàng</div>
                            <b className="text-[1.2vw]">{totalCustomers}</b>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

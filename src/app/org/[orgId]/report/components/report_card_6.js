"use client";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GoDotFill } from "react-icons/go";
import { CustomButton } from "@/components/common/custom_button";
import { BiExpandAlt } from "react-icons/bi";

// Định nghĩa màu sắc cho từng loại đánh giá
const legendData = {
    "5 sao": "#9B8CF7",
    "4 sao": "#B6F1FD",
    "3 sao": "#A5F2AA",
    "2 sao": "#F0D5FC",
    "1 sao": "#F5C19E",
    "Chưa đánh giá": "#554FE8",
};

export function ReportCard6({ reportData, isLoading: externalLoading }) {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        if (reportData) {
            try {
                // Xử lý dữ liệu từ API
                const processData = () => {
                    // Khởi tạo đối tượng để đếm số lượng theo từng đánh giá
                    const ratingCounts = {
                        0: 0, // Chưa đánh giá
                        1: 0, // 1 sao
                        2: 0, // 2 sao
                        3: 0, // 3 sao
                        4: 0, // 4 sao
                        5: 0, // 5 sao
                    };

                    // Lặp qua từng mục trong reportData để tổng hợp dữ liệu
                    reportData.forEach((item) => {
                        const rating = parseInt(item["Đánh giá"] || 0);
                        if (rating >= 0 && rating <= 5) {
                            ratingCounts[rating] += 1;
                        }
                    });

                    // Chuyển đổi dữ liệu sang định dạng phù hợp cho biểu đồ
                    const ratingNames = [
                        "Chưa đánh giá",
                        "1 sao",
                        "2 sao",
                        "3 sao",
                        "4 sao",
                        "5 sao",
                    ];

                    const transformedData = Object.entries(ratingCounts).map(
                        ([rating, count]) => ({
                            name: ratingNames[parseInt(rating)],
                            value: count,
                        })
                    );

                    return transformedData;
                };

                // Xử lý dữ liệu
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
            <Card className="w-full min-h-[300px] p-4">
                <Skeleton className="w-full h-full rounded-xl" />
            </Card>
        );
    }

    if (!chartData || chartData.length === 0 || totalCustomers === 0) {
        return (
            <Card className="w-full min-h-[300px] p-4">
                <div className="flex items-center justify-center h-full">
                    <div>Không có dữ liệu đánh giá</div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full min-h-[300px] p-4">
            <div className="flex flex-col h-full">
                <div className="flex items-center w-full">
                    <div className="text-title text-[1vw] font-medium mr-auto">
                        Đánh giá khách hàng
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full justify-between h-full my-auto">
                    <div className="flex flex-col-reverse gap-5 w-[45%]">
                        {chartData.map((e, i) => (
                            <div className="flex items-center" key={i}>
                                <div
                                    className="w-[42px] h-[24px]"
                                    style={{
                                        backgroundColor: legendData[e.name],
                                    }}
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
                                            fill={legendData[entry.name]}
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

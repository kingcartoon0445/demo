"use client";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isValid, parse } from "date-fns";
import { vi } from "date-fns/locale";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
const TIME_OPTIONS = [
    { value: "day", label: "Theo ngày" },
    { value: "month", label: "Theo tháng" },
    { value: "year", label: "Theo năm" },
];

// Tạo mảng màu sắc cho các line
const getLineColor = (index) => {
    const lineColors = [
        "#9B8CF7",
        "#B6F1FD",
        "#A5F2AA",
        "#F0D5FC",
        "#F5C19E",
        "#554FE8",
    ];
    return lineColors[index % lineColors.length];
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Lấy dữ liệu chi tiết từ payload[0].payload
        const { workspaceData, workspaceCategoryData } = payload[0].payload;

        return (
            <div className="bg-black/80 text-white rounded-lg px-3 py-2 min-w-[180px] text-sm">
                <p className="text-center font-medium">{label}</p>
                <div className="w-full h-[1px] bg-white/50 my-1" />

                {/* Hiển thị tổng khách hàng */}
                <p className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1">
                        <span
                            className="inline-block h-[10px] w-[10px] rounded-full"
                            style={{ backgroundColor: "#6366F1" }}
                        />
                        Tổng:
                    </span>
                    <span className="font-medium">
                        {payload[0].value.toLocaleString()}
                    </span>
                </p>

                {/* Hiển thị dữ liệu theo workspace */}
                {Object.entries(workspaceData || {}).map(
                    ([workspace, count], index) => (
                        <div key={workspace} className="mb-2">
                            <p className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-1">
                                    <span
                                        className="inline-block h-[10px] w-[10px] rounded-full"
                                        style={{
                                            backgroundColor:
                                                getLineColor(index),
                                        }}
                                    />
                                    {workspace}:
                                </span>
                                <span className="font-medium">
                                    {count.toLocaleString()}
                                </span>
                            </p>

                            {/* Hiển thị phân loại khách hàng của từng workspace */}
                            {workspaceCategoryData &&
                                workspaceCategoryData[workspace] &&
                                Object.entries(
                                    workspaceCategoryData[workspace],
                                ).map(([category, categoryCount], catIndex) => (
                                    <p
                                        key={`${workspace}-${category}`}
                                        className="text-xs text-white/70 flex justify-between pl-5 mb-1"
                                    >
                                        <span>
                                            {category || "Chưa phân loại"}:
                                        </span>
                                        <span className="ml-2">
                                            {categoryCount.toLocaleString()}
                                        </span>
                                    </p>
                                ))}
                        </div>
                    ),
                )}
            </div>
        );
    }

    return null;
};

export function ReportCard2({
    selectedWorkspaces,
    date,
    reportData,
    isLoading: externalLoading,
}) {
    const [data, setData] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeOption, setTimeOption] = useState("day");
    const params = useParams();

    // Xử lý khi thay đổi tùy chọn thời gian
    const handleTimeOptionChange = (value) => {
        setTimeOption(value);
    };

    // Chuyển đổi chuỗi thời gian sang định dạng ngày tháng
    const parseDateTime = (dateTimeStr) => {
        // Chuyển đổi từ định dạng "YYYY-MM-DD HH:mm:ss" sang Date
        const dateParts = dateTimeStr.split(" ");
        if (dateParts.length < 2) return null;

        const parsedDate = parse(
            dateTimeStr,
            "yyyy-MM-dd HH:mm:ss",
            new Date(),
        );

        if (!isValid(parsedDate)) return null;
        return parsedDate;
    };

    // Tạo khóa thời gian dựa trên tùy chọn (ngày, tháng, năm)
    const getTimeKey = (dateObj, option) => {
        switch (option) {
            case "day":
                return format(dateObj, "dd/MM/yyyy", { locale: vi });
            case "month":
                return format(dateObj, "MM/yyyy", { locale: vi });
            case "year":
                return format(dateObj, "yyyy", { locale: vi });
            default:
                return format(dateObj, "dd/MM/yyyy", { locale: vi });
        }
    };

    // Tạo dữ liệu mẫu nếu không có dữ liệu thực
    const generateSampleTimeData = (option) => {
        const now = new Date();
        const sampleData = [];

        if (option === "day") {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                sampleData.push({
                    date: format(date, "dd/MM/yyyy", { locale: vi }),
                    total: 0,
                    workspaceData: {},
                    workspaceCategoryData: {},
                    categoryData: {},
                });
            }
        } else if (option === "month") {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                sampleData.push({
                    date: format(date, "MM/yyyy", { locale: vi }),
                    total: 0,
                    workspaceData: {},
                    workspaceCategoryData: {},
                    categoryData: {},
                });
            }
        } else {
            for (let i = 4; i >= 0; i--) {
                const date = new Date(now);
                date.setFullYear(date.getFullYear() - i);
                sampleData.push({
                    date: format(date, "yyyy", { locale: vi }),
                    total: 0,
                    workspaceData: {},
                    workspaceCategoryData: {},
                    categoryData: {},
                });
            }
        }

        return sampleData;
    };

    useEffect(() => {
        if (reportData && Array.isArray(reportData)) {
            try {
                // Tạo đối tượng lưu trữ dữ liệu theo thời gian
                const timeDataMap = {};
                const uniqueWorkspaces = new Set();

                // Xử lý dữ liệu theo thời gian
                reportData.forEach((record) => {
                    if (record && record["Ngày tạo"]) {
                        try {
                            // Phân tích chuỗi thời gian
                            const dateObj = parseDateTime(record["Ngày tạo"]);
                            if (!dateObj) return;

                            // Tạo khóa thời gian dựa trên tùy chọn
                            const timeKey = getTimeKey(dateObj, timeOption);

                            // Khởi tạo đối tượng cho timeKey nếu chưa tồn tại
                            if (!timeDataMap[timeKey]) {
                                timeDataMap[timeKey] = {
                                    date: timeKey,
                                    total: 0,
                                    workspaceData: {},
                                    workspaceCategoryData: {},
                                    categoryData: {},
                                };
                            }

                            // Tăng tổng số khách hàng
                            timeDataMap[timeKey].total += 1;

                            // Cập nhật dữ liệu theo workspace
                            const workspace =
                                record["Không gian làm việc"] ||
                                "Không xác định";
                            uniqueWorkspaces.add(workspace); // Thêm vào danh sách workspace

                            // Tăng số lượng khách hàng của workspace
                            timeDataMap[timeKey].workspaceData[workspace] =
                                (timeDataMap[timeKey].workspaceData[
                                    workspace
                                ] || 0) + 1;

                            // Cập nhật dữ liệu theo phân loại khách hàng
                            const category =
                                record["Phân loại khách hàng"] ||
                                "Không xác định";
                            timeDataMap[timeKey].categoryData[category] =
                                (timeDataMap[timeKey].categoryData[category] ||
                                    0) + 1;

                            // Khởi tạo dữ liệu phân loại khách hàng theo workspace nếu chưa có
                            if (
                                !timeDataMap[timeKey].workspaceCategoryData[
                                    workspace
                                ]
                            ) {
                                timeDataMap[timeKey].workspaceCategoryData[
                                    workspace
                                ] = {};
                            }

                            // Cập nhật dữ liệu phân loại khách hàng theo workspace
                            timeDataMap[timeKey].workspaceCategoryData[
                                workspace
                            ][category] =
                                (timeDataMap[timeKey].workspaceCategoryData[
                                    workspace
                                ][category] || 0) + 1;
                        } catch (error) {
                            console.error("Lỗi xử lý thời gian:", error);
                        }
                    }
                });

                // Chuyển đổi thành mảng và sắp xếp theo thời gian
                const chartData = Object.values(timeDataMap);
                chartData.sort((a, b) => {
                    // Sắp xếp tùy thuộc vào định dạng thời gian
                    const parseFormat =
                        timeOption === "day"
                            ? "dd/MM/yyyy"
                            : timeOption === "month"
                              ? "MM/yyyy"
                              : "yyyy";

                    const dateA = parse(a.date, parseFormat, new Date());
                    const dateB = parse(b.date, parseFormat, new Date());

                    return dateA - dateB;
                });

                // Cập nhật danh sách workspace
                setWorkspaces(Array.from(uniqueWorkspaces));
                setData(
                    chartData.length > 0
                        ? chartData
                        : generateSampleTimeData(timeOption),
                );
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing time series data:", error);
                setData(generateSampleTimeData(timeOption));
                setIsLoading(false);
            }
        } else if (externalLoading) {
            setIsLoading(true);
        } else {
            setData(generateSampleTimeData(timeOption));
            setIsLoading(false);
        }
    }, [reportData, externalLoading, timeOption]);

    return (
        <Card className="w-full h-full p-4 min-h-[300px] border-none shadow-none !bg-transparent">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                        Phân loại khách hàng
                    </h3>
                    <Select
                        value={timeOption}
                        onValueChange={handleTimeOptionChange}
                    >
                        <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Chọn thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_OPTIONS.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{
                                    fontSize: 10,
                                    fontWeight: "bold",
                                }}
                            />
                            <Bar
                                dataKey="total"
                                name="Khách hàng"
                                fill="#6366F1"
                                barSize={20}
                            />

                            {/* Tạo line cho từng workspace */}
                            {workspaces.map((workspace, index) => (
                                <Line
                                    key={workspace}
                                    type="monotone"
                                    dataKey={`workspaceData.${workspace}`}
                                    name={workspace}
                                    stroke={getLineColor(index)}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}

"use client";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomButton } from "@/components/common/custom_button";
import { BiExpandAlt } from "react-icons/bi";
import { MdOutlinePercent } from "react-icons/md";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { capitalizeFirstLetter } from "@/lib/utils";

export const selectList = [
    "Không gian làm việc",
    "Nguồn",
    "Phân loại",
    "Thẻ",
    "Nhân viên",
];

export function ReportCard1({ reportData, isLoading: externalLoading }) {
    const [stageType, setStageType] = useState("Không gian làm việc");
    const [isPercent, setIsPercent] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [totalData, setTotalData] = useState();
    const [listData, setListData] = useState();
    const params = useParams();

    useEffect(() => {
        if (reportData) {
            try {
                // Xử lý dữ liệu từ API theo stageType
                const processData = () => {
                    // Khởi tạo đối tượng để lưu tổng số theo từng nhóm trạng thái
                    const statusGroups = {};
                    const workspaceData = {};
                    const sourceData = {};
                    const tagData = {};
                    const categoryData = {};
                    const staffData = {};

                    // Lặp qua từng mục trong reportData để tổng hợp dữ liệu
                    reportData.forEach((item) => {
                        const statusGroup =
                            item["Nhóm trạng thái"] || "Chưa xác định";
                        const hexCode = item["HexCode"] || "#9B8CF7"; // Mặc định nếu không có hex code
                        const workspace =
                            item["Không gian làm việc"] || "Không xác định";
                        const sourceRaw = item["UtmSource"] || "Không xác định";
                        const category =
                            item["Phân loại khách hàng"] || "Không xác định";
                        const tagRaw = item["Tag"] || "Không xác định";
                        const staff =
                            item["Người phụ trách"] || "Không xác định";

                        // Tách các nguồn và tag nếu chúng chứa dấu phẩy
                        const sources = sourceRaw
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                        const tags = tagRaw
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);

                        // Cập nhật dữ liệu nhóm trạng thái
                        if (!statusGroups[statusGroup]) {
                            statusGroups[statusGroup] = {
                                count: 0,
                                hex: hexCode,
                            };
                        }
                        statusGroups[statusGroup].count += 1;

                        // Cập nhật dữ liệu theo không gian làm việc
                        if (!workspaceData[workspace]) {
                            workspaceData[workspace] = {};
                        }
                        if (!workspaceData[workspace][statusGroup]) {
                            workspaceData[workspace][statusGroup] = 0;
                        }
                        workspaceData[workspace][statusGroup] += 1;

                        // Cập nhật dữ liệu theo từng nguồn (đã tách)
                        sources.forEach((source) => {
                            if (!sourceData[source]) {
                                sourceData[source] = {};
                            }
                            if (!sourceData[source][statusGroup]) {
                                sourceData[source][statusGroup] = 0;
                            }
                            sourceData[source][statusGroup] += 1;
                        });

                        // Cập nhật dữ liệu theo phân loại
                        if (!categoryData[category]) {
                            categoryData[category] = {};
                        }
                        if (!categoryData[category][statusGroup]) {
                            categoryData[category][statusGroup] = 0;
                        }
                        categoryData[category][statusGroup] += 1;

                        // Cập nhật dữ liệu theo từng thẻ (đã tách)
                        tags.forEach((tag) => {
                            if (!tagData[tag]) {
                                tagData[tag] = {};
                            }
                            if (!tagData[tag][statusGroup]) {
                                tagData[tag][statusGroup] = 0;
                            }
                            tagData[tag][statusGroup] += 1;
                        });

                        // Cập nhật dữ liệu theo nhân viên
                        if (!staffData[staff]) {
                            staffData[staff] = {};
                        }
                        if (!staffData[staff][statusGroup]) {
                            staffData[staff][statusGroup] = 0;
                        }
                        staffData[staff][statusGroup] += 1;
                    });

                    // Chọn dữ liệu phù hợp với loại đã chọn
                    let selectedData;

                    switch (stageType) {
                        case "Không gian làm việc":
                            selectedData = Object.keys(workspaceData).map(
                                (name) => ({
                                    name,
                                    data: workspaceData[name],
                                })
                            );
                            break;
                        case "Nguồn":
                            selectedData = Object.keys(sourceData).map(
                                (name) => ({
                                    name,
                                    data: sourceData[name],
                                })
                            );
                            break;
                        case "Phân loại":
                            selectedData = Object.keys(categoryData).map(
                                (name) => ({
                                    name,
                                    data: categoryData[name],
                                })
                            );
                            break;
                        case "Thẻ":
                            selectedData = Object.keys(tagData).map((name) => ({
                                name,
                                data: tagData[name],
                            }));
                            break;
                        case "Nhân viên":
                            selectedData = Object.keys(staffData).map(
                                (name) => ({
                                    name,
                                    data: staffData[name],
                                })
                            );
                            break;
                        default:
                            selectedData = [];
                    }

                    return {
                        totalData: statusGroups,
                        listData: selectedData,
                    };
                };

                // Xử lý dữ liệu theo loại đã chọn
                const { totalData, listData } = processData();

                setTotalData(totalData);
                setListData(listData);
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing data:", error);
                setTotalData({});
                setListData([]);
                setIsLoading(false);
            }
        } else if (externalLoading) {
            setIsLoading(true);
        } else {
            setTotalData({});
            setListData([]);
            setIsLoading(false);
        }
    }, [reportData, externalLoading, stageType]);

    const total = !totalData
        ? 0
        : Object.values(totalData).reduce((acc, val) => acc + val.count, 0);

    const getStatusData = () => {
        if (!totalData) return [];
        return Object.entries(totalData).map(([status, data]) => ({
            status,
            count: data.count,
            hex: data.hex,
            percent: ((data.count * 100) / total).toFixed(0),
        }));
    };

    return (
        <Card className="w-full p-4 h-full min-h-[300px]">
            <div className="flex flex-col h-full">
                <div className="flex items-center w-full flex-wrap justify-end gap-1">
                    <div className="text-title text-[1vw] font-medium">
                        Trạng thái khách hàng
                    </div>
                    <Select value={stageType} onValueChange={setStageType}>
                        <SelectTrigger className="w-auto rounded-md border-none bg-[var(--bg2)] font-medium ml-auto text-sm gap-1">
                            {stageType}
                        </SelectTrigger>
                        <SelectContent>
                            {selectList.map((e, i) => (
                                <SelectItem key={i} value={e}>
                                    {e}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <CustomButton>
                        <BiExpandAlt />
                    </CustomButton>
                </div>

                {isLoading ? (
                    <Skeleton className="w-full min-h-[200px] h-full rounded-xl" />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {getStatusData().map((statusData, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center ${
                                        index % 2 === 1 ? "justify-end" : ""
                                    }`}
                                >
                                    <CustomLabel
                                        color={statusData.hex}
                                        title={statusData.status}
                                        value={statusData.count}
                                        percent={statusData.percent}
                                        isPercent={isPercent}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col justify-center w-full italic gap-3 mt-4 overflow-y-auto mb-2">
                            {!listData || listData.length === 0 ? (
                                <div className="flex justify-center mt-3">
                                    Chưa có dữ liệu nào
                                </div>
                            ) : (
                                listData.map((e, i) => (
                                    <CustomChart
                                        name={e.name}
                                        data={e.data}
                                        totalData={totalData}
                                        key={i}
                                        isPercent={isPercent}
                                    />
                                ))
                            )}
                        </div>
                        <Switch
                            checked={isPercent}
                            onCheckedChange={setIsPercent}
                            iconThumb={<MdOutlinePercent />}
                            className="data-[state=checked]:bg-primary ml-auto mt-auto"
                        />
                    </>
                )}
            </div>
        </Card>
    );
}

export const CustomChart = ({ name, data, totalData, isPercent }) => {
    const total = Object.values(data).reduce((acc, val) => acc + val, 0);

    return (
        <div className="flex items-center">
            <div className="text-title text-[0.8vw] font-medium w-1/4 truncate">
                {capitalizeFirstLetter(name)}
            </div>
            <div className="flex w-full pr-3 max-h-[500px] overflow-y-auto">
                {Object.entries(data).map(([status, value], index) => {
                    const percent = ((value * 100) / total).toFixed(0);
                    const hex = totalData[status]?.hex;
                    return (
                        <CustomLine
                            key={index}
                            value={value}
                            color={hex}
                            percent={percent}
                            isPercent={isPercent}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export const CustomLine = ({ value, color, percent, isPercent }) => {
    return (
        percent != "0" && (
            <div
                className="flex flex-col text-title font-medium text-xs items-center whitespace-nowrap flex-nowrap"
                style={{ width: `${percent}%` }}
            >
                <span>
                    {value} {isPercent && <span>({percent}%)</span>}
                </span>
                <div
                    className="w-full h-[7px] rounded-2xl"
                    style={{ backgroundColor: color }}
                />
            </div>
        )
    );
};

export const CustomLabel = ({ color, title, value, percent, isPercent }) => {
    return (
        <div className="flex items-center text-[0.8vw] font-medium whitespace-nowrap flex-nowrap">
            <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
            />
            <div className="text-text2">&nbsp;&nbsp;{title}&nbsp;</div>
            <div className="text-title">{value}</div>
            {isPercent && (
                <div className="text-text2 font-light">({percent}%)</div>
            )}
        </div>
    );
};

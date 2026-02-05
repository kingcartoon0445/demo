"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    MdPersonOutline,
    MdOutlineGroup,
    MdWorkspacesFilled,
    MdOutlineGroups,
} from "react-icons/md";
import { TbBuildingSkyscraper } from "react-icons/tb";
import { TargetIcon } from "@/components/icons";

const summaryIcons = {
    "Khách hàng": <MdPersonOutline />,
    Sale: <MdOutlineGroup />,
    "Không gian làm việc": <MdOutlineGroups className="text-[1.6vw]" />,
    "Chiến dịch": (
        <TargetIcon className="w-[1.6vw] h-[1.6vw] text-primary fill-primary" />
    ),
};

export function ReportCard0({ reportData, isLoading: externalLoading }) {
    const [sumaryData, setSumaryData] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        // Khi có dữ liệu báo cáo từ API, xử lý nó cho component này
        if (reportData) {
            try {
                // Sử dụng cấu trúc dữ liệu mới từ metadata
                setSumaryData({
                    "Khách hàng": reportData.totalContact || 0,
                    Sale: reportData.totalMember || 0,
                    "Không gian làm việc": reportData.totalWorkspace || 0,
                    "Chiến dịch": reportData.totalCampaign || 0,
                });
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing report data:", error);
                // Nếu có lỗi khi xử lý dữ liệu, vẫn hiển thị dữ liệu trống
                setSumaryData({
                    "Khách hàng": 0,
                    Sale: 0,
                    "Không gian làm việc": 0,
                    "Chiến dịch": 0,
                });
                setIsLoading(false);
            }
        } else if (externalLoading) {
            // Nếu đang loading từ ngoài
            setIsLoading(true);
        } else {
            // Nếu không có dữ liệu báo cáo, hiển thị dữ liệu trống
            setSumaryData({
                "Khách hàng": 0,
                Sale: 0,
                "Không gian làm việc": 0,
                "Chiến dịch": 0,
            });
            setIsLoading(false);
        }
    }, [reportData, externalLoading]);

    return (
        <div className="w-full h-full rounded-xl grid grid-cols-2 gap-4 min-h-[300px]">
            {isLoading
                ? Array.from({ length: 4 }).map((e, i) => (
                      <Skeleton className={"rounded-xl"} key={i}></Skeleton>
                  ))
                : sumaryData &&
                  Object.entries(sumaryData).map((e, i) => {
                      const key = e[0];
                      const icon = summaryIcons[key];
                      const value = e[1];
                      return (
                          <div
                              key={i}
                              className="flex items-center border border-white/40 bg-white/30 rounded-xl p-4 shadow-sm backdrop-blur-sm"
                          >
                              <div className="flex items-start justify-between w-full">
                                  <div className="flex flex-col">
                                      <div className="text-title font-medium text-[1vw]">
                                          {key}
                                      </div>
                                      <div className="text-primary text-[1.2vw] font-medium">
                                          {value}
                                      </div>
                                  </div>
                                  <div className="text-primary text-[1.6vw]">
                                      {icon}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
        </div>
    );
}

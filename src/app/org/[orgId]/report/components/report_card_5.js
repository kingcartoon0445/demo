"use client";
import { useState, useMemo } from "react";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ReportCard5Dialog from "./report_card_5_dialog";

export default function ReportCard5({ reportData, isLoading }) {
  const [detailOpen, setDetailOpen] = useState(false);

  // Xử lý dữ liệu từ reportData
  const processedData = useMemo(() => {
    if (!reportData || !Array.isArray(reportData)) return [];

    // Nhóm dữ liệu theo Người phụ trách
    const staffMap = new Map();
    
    reportData.forEach(customer => {
      const staffName = customer["Người phụ trách"];
      if (!staffName || staffName === "Chưa phụ trách") return;
      
      const staffProfileId = customer["ProfileId"] || "";
      const staffAvatar = customer["Ảnh đại diện nhân viên"] || "";
      const isTransaction = customer["Nhóm trạng thái"] === "Giao dịch";
      const isPotential = customer["Nhóm trạng thái"] === "Tiềm năng";
      
      if (!staffMap.has(staffName)) {
        staffMap.set(staffName, {
          assignTo: staffProfileId,
          fullName: staffName,
          avatar: staffAvatar,
          total: 0,
          transaction: 0,
          potential: 0,
          score: 0
        });
      }
      
      const staffStats = staffMap.get(staffName);
      staffStats.total += 1;
      
      if (isTransaction) {
        staffStats.transaction += 1;
      }
      
      if (isPotential) {
        staffStats.potential += 1;
      }
    });
    
    // Chuyển đổi Map thành mảng và tính điểm
    const staffArray = Array.from(staffMap.values());
    
    // Tính điểm theo công thức: ((Total-Transaction-Potential)*1 + Potential*2)/3
    staffArray.forEach(staff => {
      const otherCustomers = staff.total - staff.transaction - staff.potential;
      staff.score = ((otherCustomers * 1 + staff.potential * 2) / 3);
    });
    
    // Sắp xếp theo quy tắc xếp hạng:
    // ROW_NUMBER() over (ORDER BY Transaction DESC, ((Total-Transaction-Potential)*1 +Potential*2)/3 DESC, Total DESC)
    return staffArray.sort((a, b) => {
      if (a.transaction !== b.transaction) return b.transaction - a.transaction;
      if (a.score !== b.score) return b.score - a.score;
      return b.total - a.total;
    });
  }, [reportData]);

  // Giới hạn hiển thị chỉ 4 mục
  const displayLimit = 4;
  const showDetailButton = processedData.length > displayLimit;
  const displayedData = showDetailButton ? processedData.slice(0, displayLimit) : processedData;

  return (
    <Card className="w-full h-full overflow-hidden min-h-[300px]">
      {detailOpen && (
        <ReportCard5Dialog
          open={detailOpen}
          setOpen={setDetailOpen}
          data={processedData}
        />
      )}
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center w-full mb-4">
          <div className="text-title text-[1vw] font-medium mr-auto">
            Bảng xếp hạng nhân viên kinh doanh
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="pr-4 flex-1">
              <div className="space-y-1">
                {displayedData.map((item, index) => (
                  <div
                    key={item.assignTo || index}
                    className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {index < 3 ? (
                        <Image
                          src={`/images/cup_${index + 1}.png`}
                          alt={`Top ${index + 1}`}
                          width={28}
                          height={28}
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                      )}
                      <Avatar
                        name={getFirstAndLastWord(item.fullName)}
                        size="32"
                        src={getAvatarUrl(item.avatar)}
                        className="object-cover"
                        round
                      />
                      <div className="leading-[1.2]">
                        <p className="font-medium">{item.fullName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span className="text-title font-medium">
                            {item.total}
                          </span>{" "}
                          Khách hàng <span className="text-xl text-title">•</span>{" "}
                          <span className="text-title font-medium">
                            {item.potential}
                          </span>{" "}
                          Tiềm năng
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">0 tỷ</p>
                      <p className="text-sm text-gray-500">
                        <b className="text-title">{item.transaction}</b> Giao dịch
                      </p>
                    </div>
                  </div>
                ))}
                
                {processedData.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    Không có dữ liệu
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {showDetailButton && (
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => setDetailOpen(true)}>
                  Xem chi tiết
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
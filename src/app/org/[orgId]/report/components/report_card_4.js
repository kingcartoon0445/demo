"use client";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IoTrendingUp } from "react-icons/io5";

export function ReportCard4({ selectedWorkspaces, date }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    setIsLoading(true);
    
    // Mô phỏng dữ liệu thành viên rỗng
    const timer = setTimeout(() => {
      // Tạo dữ liệu mẫu trống cho danh sách thành viên
      const sampleData = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `Thành viên ${i + 1}`,
        avatar: "",
        stat1: 0,
        stat2: 0,
      }));
      
      setData(sampleData);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [date, selectedWorkspaces, params.orgId]);

  return (
    <Card className="w-full h-[300px] p-4">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Thành viên hoạt động</h3>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-[50px] rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 overflow-auto">
            {data.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">KH</p>
                    <p className="font-medium">{member.stat1}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">GH</p>
                    <p className="font-medium">{member.stat2}</p>
                  </div>
                  <div className="text-green-500">
                    <IoTrendingUp size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
} 
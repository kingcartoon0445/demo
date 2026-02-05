"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getEvictionLogs } from "@/api/automation";
import { Loader2, UserRound, MessagesSquare, Edit, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

export default function EvictionLogHistory({ orgId, ruleId }) {
  const [evictionLogs, setEvictionLogs] = useState([]);
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsLimit] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isAllLogsLoaded, setIsAllLogsLoaded] = useState(false);
  
  // Refs để theo dõi phần tử cuối cùng và container lịch sử
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  // Fetch logs từ API
  const fetchEvictionLogs = async (offset = 0) => {
    if (!ruleId || !orgId || isAllLogsLoaded) return;
    
    setIsLoadingLogs(true);
    try {
      const response = await getEvictionLogs(orgId, ruleId, {
        offset: offset,
        limit: logsLimit
      });
      
      if (response?.code === 0) {
        if (response.content.length === 0 || offset + response.content.length >= response.metadata?.total) {
          setIsAllLogsLoaded(true);
        }
        
        if (offset === 0) {
          setEvictionLogs(response.content);
        } else {
          setEvictionLogs(prev => [...prev, ...response.content]);
        }
        setTotalLogs(response.metadata?.total || 0);
        setLogsOffset(offset + response.content.length);
      }
    } catch (error) {
      console.error("Error fetching eviction logs:", error);
      toast.error("Có lỗi khi tải lịch sử thu hồi");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load more logs
  const handleLoadMoreLogs = useCallback(() => {
    if (!isLoadingLogs && !isAllLogsLoaded && evictionLogs.length < totalLogs) {
      fetchEvictionLogs(logsOffset);
    }
  }, [isLoadingLogs, isAllLogsLoaded, evictionLogs.length, totalLogs, logsOffset, orgId, ruleId]);

  // Fetch logs lần đầu khi component được mount
  useEffect(() => {
    setEvictionLogs([]);
    setLogsOffset(0);
    setIsAllLogsLoaded(false);
    fetchEvictionLogs(0);
  }, [ruleId, orgId]);

  // Thiết lập intersection observer để theo dõi phần tử cuối
  useEffect(() => {
    if (!logsEndRef.current || isAllLogsLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMoreLogs();
        }
      },
      { 
        root: logsContainerRef.current,
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(logsEndRef.current);

    return () => {
      if (logsEndRef.current) {
        observer.unobserve(logsEndRef.current);
      }
    };
  }, [logsEndRef, handleLoadMoreLogs, isAllLogsLoaded]);

  // Hàm format thời gian
  const formatDateTime = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return dateTimeStr;
    }
  };

  // Lấy icon phù hợp cho từng loại hành động
  const getActionIcon = (action) => {
    switch (action) {
      case 'EVICTION':
        return <UserRound className="w-5 h-5 text-primary" />;
      case 'NOTIFY':
        return <MessagesSquare className="w-5 h-5 text-primary" />;
      case 'UPDATE':
        return <Edit className="w-5 h-5 text-primary" />;
      case 'CREATE':
        return <PlusCircle className="w-5 h-5 text-primary" />;
      case 'INSERT':
        return <PlusCircle className="w-5 h-5 text-primary" />;
      default:
        return <UserRound className="w-5 h-5 text-primary" />;
    }
  };

  // Lấy tiêu đề phù hợp cho từng loại hành động
  const getActionTitle = (action) => {
    switch (action) {
      case 'EVICTION':
        return "Chuyển khách hàng";
      case 'NOTIFY':
        return "Gửi thông báo";
      case 'UPDATE':
        return "Chỉnh sửa kịch bản";
      case 'CREATE':
        return "Tạo mới kịch bản";
      case 'INSERT':
        return "Tạo mới";
      default:
        return action;
    }
  };

  return (
    <div 
      ref={logsContainerRef}
      className="flex flex-col max-h-[66dvh] overflow-y-auto"
    >
      {evictionLogs.length > 0 ? (
        <>
          <ul className="space-y-4">
            {evictionLogs.map((log, index) => (
              <li key={index} className="flex items-start gap-3 px-4 rounded-lg">
                <div className="p-2 rounded-full bg-gray-100">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1  rounded-xl px-3">
                  <div className="flex flex-col">
                    <h4 className="font-medium text-sm">
                      {getActionTitle(log.action)}
                    </h4>
                    
                    <div className="mt-0.5">
                      {log.message && log.message.map((msg, msgIndex) => (
                        <p key={msgIndex} className="text-xs text-gray-600">{msg}</p>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(log.createdDate)} • {log.createdByName === "BOT" ? "Bot" : log.createdByName} 
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Phần tử kích hoạt load more */}
          {!isAllLogsLoaded && evictionLogs.length < totalLogs ? (
            <div 
              ref={logsEndRef} 
              className="py-4 flex justify-center items-center h-16"
            >
              {isLoadingLogs && (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-1" />
                  <p className="text-sm text-gray-500">Đang tải thêm...</p>
                </div>
              )}
            </div>
          ) : evictionLogs.length > 0 && (
            <div className="py-4 text-center text-sm text-gray-500">
              Đã hiển thị tất cả lịch sử
            </div>
          )}
        </>
      ) : isLoadingLogs ? (
        <div className="py-8 flex justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          Không có lịch sử nào được ghi nhận.
        </div>
      )}
    </div>
  );
} 
import React from "react";

interface EventTransferHeaderProps {
    onAddEvent: () => void;
}

export const EventTransferHeader: React.FC<EventTransferHeaderProps> = ({
    onAddEvent,
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1 max-w-2xl">
                <h1 className="text-gray-900 text-3xl font-black leading-tight tracking-tight">
                    Cấu hình chuyển đổi Facebook
                </h1>
                <p className="text-gray-500 text-base font-normal">
                    Thiết lập và quản lý các sự kiện chuyển đổi Facebook CAPI để
                    tối ưu hóa quảng cáo và theo dõi hiệu quả kinh doanh.
                </p>
            </div>
        </div>
    );
};

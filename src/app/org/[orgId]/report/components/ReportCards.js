"use client";
import { ReportCard0 } from "./report_card_0";
import { ReportCard1 } from "./report_card_1";
import { ReportCard2 } from "./report_card_2";
import { ReportCard3 } from "./report_card_3";
import ReportCard5 from "./report_card_5";
import { ReportCard6 } from "./report_card_6";
import PivotCard from "./pivot_card";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Định nghĩa map cho các component báo cáo
const CARD_COMPONENTS = {
    ReportCard0: ReportCard0,
    ReportCard1: ReportCard1,
    ReportCard2: ReportCard2,
    ReportCard3: ReportCard3,
    ReportCard5: ReportCard5,
    ReportCard6: ReportCard6,
    PivotCard: PivotCard,
};

export default function ReportCards({
    reportId,
    reportLayout = [],
    reportData,
    reportMetadata,
    isLoading,
    date,
    setDate,
    dateSelect,
    setDateSelect,
    selectedWorkspaces,
    setWorkspaceDialogOpen,
    onSavePivotConfig = null,
}) {
    // Theo dõi trạng thái loading previous để tạo hiệu ứng đúng
    const [prevLoading, setPrevLoading] = useState(false);
    const [localLoading, setLocalLoading] = useState(isLoading);

    // Đảm bảo trạng thái loading được phát hiện khi chuyển từ false sang true
    useEffect(() => {
        // Luôn cập nhật localLoading để đảm bảo mọi thay đổi đều được ghi nhận
        setLocalLoading(isLoading);
        setPrevLoading(isLoading);
    }, [isLoading]);

    // Nhóm các card theo cặp (2 cột)
    const getPairs = () => {
        const pairs = [];
        let currentPair = [];

        for (let i = 0; i < reportLayout.length; i++) {
            const card = reportLayout[i];

            // Nếu card chiếm 2 cột
            if (card.colSpan === 2) {
                // Nếu có card trong currentPair, thêm vào pairs trước
                if (currentPair.length > 0) {
                    pairs.push(currentPair);
                    currentPair = [];
                }
                // Thêm card 2 cột như một pair riêng
                pairs.push([card]);
            } else {
                // Thêm card vào currentPair
                currentPair.push(card);

                // Nếu currentPair đã đủ 2 card hoặc đây là card cuối cùng
                if (currentPair.length === 2 || i === reportLayout.length - 1) {
                    pairs.push(currentPair);
                    currentPair = [];
                }
            }
        }

        return pairs;
    };

    const pairs = getPairs();

    // Render từng cặp card
    return (
        <div className="space-y-4 py-4 w-full max-w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportLayout.map((card) => {
                    const CardComponent = CARD_COMPONENTS[card.component];
                    if (!CardComponent) return null;

                    // Xác định props dựa vào component type
                    const cardProps = {
                        isLoading: localLoading,
                        reportData:
                            card.component === "ReportCard0"
                                ? reportMetadata
                                : reportData,
                        date,
                        setDate,
                        dateSelect,
                        setDateSelect,
                        selectedWorkspaces,
                        setWorkspaceDialogOpen,
                    };

                    // Thêm pivotId và reportId nếu là PivotCard
                    if (card.component === "PivotCard") {
                        cardProps.pivotId = card.pivotId || card.id;
                        cardProps.reportId = reportId;
                        cardProps.title = card.title || card.name;
                        cardProps.colSpan = card.colSpan || 2;
                        // Thêm pivotConfig nếu có
                        if (card.pivotConfig) {
                            cardProps.pivotConfig = card.pivotConfig;
                        }
                        // Thêm callback lưu cấu hình pivot nếu có
                        if (onSavePivotConfig) {
                            cardProps.onSaveConfig = onSavePivotConfig;
                        }
                    }

                    return (
                        <div
                            className={`${
                                card.colSpan === 2 ? "col-span-2" : ""
                            }`}
                            key={card.id}
                        >
                            {localLoading ? (
                                <div className="w-full min-h-[300px]">
                                    <Skeleton className="w-full h-full min-h-[300px] rounded-xl" />
                                </div>
                            ) : (
                                <CardComponent {...cardProps} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

"use client";
import { useState, useEffect } from "react";

export function useReportLayout(selectedReportId, reportConfig = null) {
    const [reportLayout, setReportLayout] = useState([]);

    // Khởi tạo layout từ API hoặc localStorage hoặc mặc định
    useEffect(() => {
        if (!selectedReportId) return;

        // Log để debug

        try {
            // Nếu có reportConfig từ API, ưu tiên sử dụng nó
            if (
                reportConfig &&
                reportConfig.displayedCards &&
                Array.isArray(reportConfig.displayedCards)
            ) {
                // Đảm bảo mỗi card có thuộc tính colSpan
                const processedCards = reportConfig.displayedCards.map(
                    (card) => {
                        // Xử lý đặc biệt cho PivotCard
                        if (
                            card.component === "PivotCard" ||
                            card.id.startsWith("pivot")
                        ) {
                            return {
                                ...card,
                                colSpan: card.colSpan || 2,
                            };
                        }
                        return {
                            ...card,
                            colSpan: card.colSpan || 1,
                        };
                    }
                );

                setReportLayout(processedCards);
                return;
            }

            // Nếu không có reportConfig, tìm trong localStorage
            const savedLayoutKey = `reportLayout_${selectedReportId}`;
            const savedLayout = localStorage.getItem(savedLayoutKey);

            if (savedLayout) {
                const { displayedCards } = JSON.parse(savedLayout);
                if (displayedCards && Array.isArray(displayedCards)) {
                    setReportLayout(displayedCards);
                } else {
                    // Mặc định nếu không có dữ liệu hợp lệ
                    setReportLayout(getDefaultLayout());
                }
            } else {
                // Mặc định nếu không có lưu trữ
                setReportLayout(getDefaultLayout());
            }
        } catch (error) {
            console.error("Lỗi khi khởi tạo bố cục báo cáo:", error);
            // Mặc định nếu xảy ra lỗi
            setReportLayout(getDefaultLayout());
        }
    }, [selectedReportId, reportConfig]);

    // Lưu bố cục vào localStorage khi thay đổi
    const saveLayout = (newLayout) => {
        if (!selectedReportId) return;

        try {
            const layoutToSave = {
                displayedCards: newLayout,
            };
            localStorage.setItem(
                `reportLayout_${selectedReportId}`,
                JSON.stringify(layoutToSave)
            );
            setReportLayout(newLayout);
        } catch (error) {
            console.error("Lỗi khi lưu bố cục báo cáo:", error);
        }
    };

    // Bố cục mặc định
    const getDefaultLayout = () => {
        return [
            {
                id: "card0",
                name: "Thông tin tổng quan",
                component: "ReportCard0",
                colSpan: 1,
            },
            {
                id: "card2",
                name: "Phân loại khách hàng",
                component: "ReportCard2",
                colSpan: 1,
            },
            {
                id: "card6",
                name: "Đánh giá khách hàng",
                component: "ReportCard6",
                colSpan: 1,
            },
            {
                id: "card3",
                name: "Biểu đồ trạng thái khách hàng",
                component: "ReportCard3",
                colSpan: 1,
            },
            {
                id: "card1",
                name: "Trạng thái khách hàng",
                component: "ReportCard1",
                colSpan: 1,
            },
            {
                id: "card5",
                name: "Bảng xếp hạng nhân viên kinh doanh",
                component: "ReportCard5",
                colSpan: 1,
            },
            {
                id: "pivot",
                name: "Biểu Đồ Pivot Thống Kê",
                component: "PivotCard",
                colSpan: 2,
            },
        ];
    };

    // Các hàm hỗ trợ
    const resetToDefaultLayout = () => {
        saveLayout(getDefaultLayout());
    };

    const moveCardUp = (cardId) => {
        const index = reportLayout.findIndex((card) => card.id === cardId);
        if (index <= 0) return; // Không thể di chuyển lên nếu đã ở đầu danh sách

        const newLayout = [...reportLayout];
        const temp = newLayout[index];
        newLayout[index] = newLayout[index - 1];
        newLayout[index - 1] = temp;

        saveLayout(newLayout);
    };

    const moveCardDown = (cardId) => {
        const index = reportLayout.findIndex((card) => card.id === cardId);
        if (index >= reportLayout.length - 1) return; // Không thể di chuyển xuống nếu đã ở cuối danh sách

        const newLayout = [...reportLayout];
        const temp = newLayout[index];
        newLayout[index] = newLayout[index + 1];
        newLayout[index + 1] = temp;

        saveLayout(newLayout);
    };

    const removeCard = (cardId) => {
        const newLayout = reportLayout.filter((card) => card.id !== cardId);
        saveLayout(newLayout);
    };

    const addCard = (card) => {
        if (reportLayout.some((c) => c.id === card.id)) return; // Tránh thêm trùng lặp
        const newLayout = [...reportLayout, card];
        saveLayout(newLayout);
    };

    return {
        reportLayout,
        saveLayout,
        resetToDefaultLayout,
        moveCardUp,
        moveCardDown,
        removeCard,
        addCard,
        getDefaultLayout,
    };
}

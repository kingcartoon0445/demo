"use client";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
    getCustomReportList,
    getCustomReportConfig,
    getCustomReportPreview,
    updateCustomReport,
    createCustomReport,
} from "@/api/org_report";
import { getOrgMembersByIds } from "@/api/org";

export function useReportApi(orgId) {
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportMetadata, setReportMetadata] = useState(null);
    const [reportConfig, setReportConfig] = useState(null);

    // Thêm hàm để lấy thông tin chi tiết của các thành viên từ danh sách ID
    const fetchMemberDetails = useCallback(
        async (memberIds) => {
            if (!orgId || !memberIds || memberIds.length === 0) return [];

            try {
                const response = await getOrgMembersByIds(orgId, memberIds);

                if (response?.code !== 0) {
                    toast.error(
                        response?.message ||
                            "Không thể lấy thông tin thành viên"
                    );
                    return [];
                }

                return response.content || [];
            } catch (error) {
                console.error("Error fetching member details:", error);
                toast.error("Đã xảy ra lỗi khi lấy thông tin thành viên");
                return [];
            }
        },
        [orgId]
    );

    // Tải danh sách báo cáo
    const fetchReportList = useCallback(async () => {
        if (!orgId) return [];

        try {
            const response = await getCustomReportList(orgId);

            if (response?.code !== 0) {
                toast.error(
                    response?.message || "Không thể lấy danh sách báo cáo"
                );
                return [];
            }

            if (
                response.content &&
                Array.isArray(response.content) &&
                response.content.length > 0
            ) {
                return response.content;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Error fetching report list:", error);
            toast.error("Đã xảy ra lỗi khi lấy danh sách báo cáo");
            return [];
        }
    }, [orgId]);

    // Lấy cấu hình báo cáo
    const fetchReportConfig = useCallback(
        async (reportId) => {
            if (!orgId || !reportId) return null;

            try {
                const response = await getCustomReportConfig(orgId, reportId);

                if (response?.code !== 0) {
                    toast.error(
                        response?.message || "Không thể lấy cấu hình báo cáo"
                    );
                    return null;
                }

                // Lưu cấu hình vào state
                setReportConfig(response.content);

                // Kiểm tra và đảm bảo các thẻ Pivot có pivotConfig
                if (response.content && response.content.displayedCards) {
                    const updatedDisplayedCards =
                        response.content.displayedCards.map((card) => {
                            if (
                                card.component === "PivotCard" &&
                                !card.pivotConfig
                            ) {
                                // Thêm cấu hình mặc định nếu không có
                                return {
                                    ...card,
                                    pivotConfig: JSON.stringify({
                                        fields: [
                                            {
                                                dataField: "Nhóm trạng thái",
                                                area: "column",
                                                areaIndex: 0,
                                                sortOrder: "asc",
                                                expanded: true,
                                                visible: true,
                                            },
                                            {
                                                dataField: "Trạng thái",
                                                area: "column",
                                                areaIndex: 1,
                                                sortOrder: "asc",
                                                expanded: true,
                                                visible: true,
                                            },
                                            {
                                                dataField: "Người phụ trách",
                                                area: "row",
                                                areaIndex: 0,
                                                sortOrder: "asc",
                                                expanded: true,
                                                width: 150,
                                                visible: true,
                                            },
                                            {
                                                dataField: "Số điện thoại",
                                                area: "data",
                                                areaIndex: 0,
                                                summaryType: "count",
                                                visible: true,
                                            },
                                        ],
                                        showColumnTotals: false,
                                        showRowTotals: false,
                                        showColumnGrandTotals: true,
                                        showRowGrandTotals: true,
                                    }),
                                };
                            }
                            return card;
                        });

                    // Cập nhật cấu hình nếu có sự thay đổi
                    if (
                        JSON.stringify(updatedDisplayedCards) !==
                        JSON.stringify(response.content.displayedCards)
                    ) {
                        const updatedConfig = {
                            ...response.content,
                            displayedCards: updatedDisplayedCards,
                        };
                        setReportConfig(updatedConfig);
                        return updatedConfig;
                    }
                }

                return response.content;
            } catch (error) {
                console.error("Error fetching report config:", error);
                toast.error("Đã xảy ra lỗi khi lấy cấu hình báo cáo");
                return null;
            }
        },
        [orgId]
    );

    // Lấy dữ liệu báo cáo dựa trên cấu hình
    const fetchReportPreview = useCallback(
        async (configToUse) => {
            if (!orgId || !configToUse) return null;

            try {
                setIsLoading(true);
                const response = await getCustomReportPreview(
                    orgId,
                    configToUse
                );
                setIsLoading(false);

                if (response?.code !== 0) {
                    toast.error(
                        response?.message || "Không thể lấy dữ liệu báo cáo"
                    );
                    return null;
                }

                // Lưu dữ liệu chính và metadata
                setReportData(response.content);
                setReportMetadata(response.metadata || null);

                // Trả về cả dữ liệu và metadata
                return {
                    content: response.content,
                    metadata: response.metadata,
                };
            } catch (error) {
                console.error("Error fetching report preview:", error);
                toast.error("Đã xảy ra lỗi khi lấy dữ liệu báo cáo");
                setIsLoading(false);
                return null;
            }
        },
        [orgId]
    );

    // Tạo báo cáo mới
    const createNewReport = useCallback(
        async (reportTitle, configToSave) => {
            if (!orgId || !reportTitle || !configToSave) return null;

            try {
                // Ưu tiên sử dụng cấu hình từ configToSave
                let displayedCards = [];
                let availableCards = [];

                // Kiểm tra xem configToSave đã có displayedCards chưa
                if (
                    configToSave.displayedCards &&
                    configToSave.displayedCards.length > 0
                ) {
                    // Sử dụng trực tiếp từ configToSave
                    displayedCards = configToSave.displayedCards;
                    availableCards = configToSave.availableCards || [];
                } else {
                    // Tạo cấu hình mặc định nếu không có
                    displayedCards = [
                        {
                            id: "card0",
                            name: "Thông tin tổng quan",
                            component: "ReportCard0",
                            defaultVisible: true,
                            defaultPosition: 0,
                            colSpan: 1,
                        },
                        {
                            id: "card2",
                            name: "Phân loại khách hàng",
                            component: "ReportCard2",
                            defaultVisible: true,
                            defaultPosition: 1,
                            colSpan: 1,
                        },
                        {
                            id: "card6",
                            name: "Đánh giá khách hàng",
                            component: "ReportCard6",
                            defaultVisible: true,
                            defaultPosition: 2,
                            colSpan: 1,
                        },
                        {
                            id: "card3",
                            name: "Biểu đồ trạng thái khách hàng",
                            component: "ReportCard3",
                            defaultVisible: true,
                            defaultPosition: 3,
                            colSpan: 1,
                        },
                        {
                            id: "card1",
                            name: "Trạng thái khách hàng",
                            component: "ReportCard1",
                            defaultVisible: true,
                            defaultPosition: 4,
                            colSpan: 1,
                        },
                        {
                            id: "card5",
                            name: "Bảng xếp hạng nhân viên kinh doanh",
                            component: "ReportCard5",
                            defaultVisible: true,
                            defaultPosition: 5,
                            colSpan: 1,
                        },
                        {
                            id: "pivot",
                            name: "Biểu Đồ Pivot Thống Kê",
                            component: "PivotCard",
                            defaultVisible: true,
                            defaultPosition: 6,
                            colSpan: 2,
                            pivotConfig: JSON.stringify({
                                fields: [
                                    {
                                        dataField: "Nhóm trạng thái",
                                        area: "column",
                                        areaIndex: 0,
                                        sortOrder: "asc",
                                        expanded: true,
                                        visible: true,
                                    },
                                    {
                                        dataField: "Trạng thái",
                                        area: "column",
                                        areaIndex: 1,
                                        sortOrder: "asc",
                                        expanded: true,
                                        visible: true,
                                    },
                                    {
                                        dataField: "Người phụ trách",
                                        area: "row",
                                        areaIndex: 0,
                                        sortOrder: "asc",
                                        expanded: true,
                                        width: 150,
                                        visible: true,
                                    },
                                    {
                                        dataField: "Số điện thoại",
                                        area: "data",
                                        areaIndex: 0,
                                        summaryType: "count",
                                        visible: true,
                                    },
                                ],
                                showColumnTotals: false,
                                showRowTotals: false,
                                showColumnGrandTotals: true,
                                showRowGrandTotals: true,
                            }),
                        },
                    ];
                }

                // Chuẩn bị dataSource (bắt buộc phải có)
                // let dataSourceConfig;
                // if (configToSave.dataSource) {
                //   // Sử dụng dataSource từ configToSave nếu có
                //   dataSourceConfig = configToSave.dataSource;
                // } else {
                //   // Tạo dataSource mặc định nếu không có
                //   dataSourceConfig = {
                //     title: reportTitle,
                //     description: reportTitle,
                //     dataSource: "CONTACT",
                //     columnName: [],
                //     condition: {
                //       conjunction: "and",
                //       conditions: []
                //     },
                //     isGroupBy: false
                //   };
                // }

                // Thêm tiêu đề vào cấu hình
                const configWithTitle = {
                    title: reportTitle,
                    description: reportTitle,
                    dataSource: configToSave,
                    availableCards: availableCards,
                    displayedCards: displayedCards,
                };

                // Log config trước khi gửi để kiểm tra

                // Gọi API tạo báo cáo mới
                const response = await createCustomReport(
                    orgId,
                    configWithTitle
                );

                if (response?.code !== 0) {
                    toast.error(
                        response?.message || "Không thể tạo báo cáo mới"
                    );
                    return null;
                }

                // Xóa toast thành công ở đây vì component cha đã hiển thị thông báo
                return response.content;
            } catch (error) {
                console.error("Error creating new report:", error);
                toast.error("Đã xảy ra lỗi khi tạo báo cáo mới");
                return null;
            }
        },
        [orgId]
    );

    // Cập nhật cấu hình báo cáo
    const saveReportConfig = useCallback(
        async (reportId, configToSave) => {
            if (!orgId || !reportId || !configToSave) return false;

            try {
                // Nếu configToSave không có displayedCards, lấy từ báo cáo hiện tại
                let updatedConfig = { ...configToSave };

                if (
                    !configToSave.displayedCards ||
                    configToSave.displayedCards.length === 0
                ) {
                    // Lấy cấu hình hiện tại từ API
                    const currentConfig = await fetchReportConfig(reportId);

                    if (currentConfig) {
                        updatedConfig = {
                            ...updatedConfig,
                            displayedCards: currentConfig.displayedCards || [],
                            availableCards: currentConfig.availableCards || [],
                        };
                    } else {
                        // Nếu không lấy được cấu hình hiện tại, tạo cấu hình mặc định
                        updatedConfig.displayedCards = [
                            {
                                id: "card0",
                                name: "Thông tin tổng quan",
                                component: "ReportCard0",
                                defaultVisible: true,
                                defaultPosition: 0,
                                colSpan: 1,
                            },
                            {
                                id: "card2",
                                name: "Phân loại khách hàng",
                                component: "ReportCard2",
                                defaultVisible: true,
                                defaultPosition: 1,
                                colSpan: 1,
                            },
                            {
                                id: "card6",
                                name: "Đánh giá khách hàng",
                                component: "ReportCard6",
                                defaultVisible: true,
                                defaultPosition: 2,
                                colSpan: 1,
                            },
                            {
                                id: "card3",
                                name: "Biểu đồ trạng thái khách hàng",
                                component: "ReportCard3",
                                defaultVisible: true,
                                defaultPosition: 3,
                                colSpan: 1,
                            },
                            {
                                id: "card1",
                                name: "Trạng thái khách hàng",
                                component: "ReportCard1",
                                defaultVisible: true,
                                defaultPosition: 4,
                                colSpan: 1,
                            },
                            {
                                id: "card5",
                                name: "Bảng xếp hạng nhân viên kinh doanh",
                                component: "ReportCard5",
                                defaultVisible: true,
                                defaultPosition: 5,
                                colSpan: 1,
                            },
                            {
                                id: "pivot",
                                name: "Biểu Đồ Pivot Thống Kê",
                                component: "PivotCard",
                                defaultVisible: true,
                                defaultPosition: 6,
                                colSpan: 2,
                                pivotConfig: JSON.stringify({
                                    fields: [
                                        {
                                            dataField: "Nhóm trạng thái",
                                            area: "column",
                                            areaIndex: 0,
                                            sortOrder: "asc",
                                            expanded: true,
                                            visible: true,
                                        },
                                        {
                                            dataField: "Trạng thái",
                                            area: "column",
                                            areaIndex: 1,
                                            sortOrder: "asc",
                                            expanded: true,
                                            visible: true,
                                        },
                                        {
                                            dataField: "Người phụ trách",
                                            area: "row",
                                            areaIndex: 0,
                                            sortOrder: "asc",
                                            expanded: true,
                                            width: 150,
                                            visible: true,
                                        },
                                        {
                                            dataField: "Số điện thoại",
                                            area: "data",
                                            areaIndex: 0,
                                            summaryType: "count",
                                            visible: true,
                                        },
                                    ],
                                    showColumnTotals: false,
                                    showRowTotals: false,
                                    showColumnGrandTotals: true,
                                    showRowGrandTotals: true,
                                }),
                            },
                        ];
                        updatedConfig.availableCards = [];
                    }
                }

                // Đảm bảo các trường bắt buộc khác
                if (!updatedConfig.title) {
                    updatedConfig.title = "Báo cáo tổng hợp";
                }
                if (!updatedConfig.description) {
                    updatedConfig.description = updatedConfig.title;
                }

                updatedConfig.dataSource =
                    configToSave?.dataSource !== "CONTACT"
                        ? configToSave?.dataSource ?? configToSave
                        : configToSave;

                // Log config trước khi gửi để kiểm tra

                const response = await updateCustomReport(
                    orgId,
                    reportId,
                    updatedConfig
                );

                if (response?.code !== 0) {
                    toast.error(
                        response?.message || "Không thể lưu cấu hình báo cáo"
                    );
                    return false;
                }

                setReportConfig(updatedConfig);
                return true;
            } catch (error) {
                console.error("Error saving report config:", error);
                toast.error("Đã xảy ra lỗi khi lưu cấu hình báo cáo");
                return false;
            }
        },
        [orgId, fetchReportConfig]
    );

    // Cập nhật cấu hình và lấy dữ liệu báo cáo trong một lượt
    const updateConfigAndFetchPreview = useCallback(
        async (reportId, configUpdates) => {
            // Lấy cấu hình hiện tại hoặc mới
            const currentConfig =
                reportConfig || (await fetchReportConfig(reportId));
            if (!currentConfig) return null;

            // Tạo cấu hình mới bằng cách kết hợp cấu hình hiện tại và cập nhật
            const newConfig = {
                ...currentConfig,
                ...configUpdates,
            };

            // Lấy dữ liệu báo cáo với cấu hình mới
            const result = await fetchReportPreview(newConfig);
            return {
                config: newConfig,
                data: result?.content,
                metadata: result?.metadata,
            };
        },
        [reportConfig, fetchReportConfig, fetchReportPreview]
    );

    return {
        isLoading,
        reportData,
        reportMetadata,
        reportConfig,
        fetchReportList,
        fetchReportConfig,
        fetchReportPreview,
        saveReportConfig,
        createNewReport,
        updateConfigAndFetchPreview,
        fetchMemberDetails,
    };
}

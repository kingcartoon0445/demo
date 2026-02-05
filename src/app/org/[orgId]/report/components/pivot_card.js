"use client";
import { Spinner } from "@/components/common/spinner.jsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

// Import DevExtreme components
import PivotGrid, {
    FieldChooser,
    FieldPanel,
    HeaderFilter,
    StateStoring,
} from "devextreme-react/pivot-grid";
import { exportPivotGrid } from "devextreme/excel_exporter";
import PivotGridDataSource from "devextreme/ui/pivot_grid/data_source";

// Styles for DevExtreme
import "devextreme/dist/css/dx.light.css";

// Cấu hình tiếng Việt cho DevExtreme
import { loadMessages, locale } from "devextreme/localization";

// Thêm cấu hình tiếng Việt cho PivotGrid
const viMessages = {
    vi: {
        dxPivotGrid: {
            grandTotal: "Tổng cộng",
            total: "Tổng",
            noData: "Không có dữ liệu",
            showFieldChooser: "Hiển thị trình chọn trường",
            expandAll: "Mở rộng tất cả",
            collapseAll: "Thu gọn tất cả",
            sortColumnBySummary: "Sắp xếp cột theo mục này",
            sortRowBySummary: "Sắp xếp hàng theo mục này",
            removeAllSorting: "Xóa tất cả sắp xếp",
            dataNotAvailable: "N/A",
            row: "Hàng",
            column: "Cột",
            data: "Dữ liệu",
            filter: "Bộ lọc",
            fieldChooserTitle: "Trình chọn trường",
            rowFields: "Trường hàng",
            columnFields: "Trường cột",
            dataFields: "Trường dữ liệu",
            filterFields: "Trường bộ lọc",
            allFields: "Tất cả trường",
        },
    },
};

loadMessages(viMessages);
locale("vi");

// Hàm debounce để giới hạn tần số gọi hàm
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Tạo cấu hình mặc định cho pivot
const getDefaultPivotConfig = (reportData) => {
    // Nếu không có dữ liệu, trả về cấu hình cơ bản
    if (!reportData || !reportData[0]) {
        return {
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
        };
    }

    // Nếu có dữ liệu, tạo cấu hình dựa trên các trường có sẵn
    const fields = Object.keys(reportData[0]).map((field) => {
        let area = undefined;
        let areaIndex = undefined;
        let summaryType = undefined;

        // Xác định vị trí mặc định của các trường dựa trên tên
        if (field === "Nhóm trạng thái") {
            area = "column";
            areaIndex = 0;
        } else if (field === "Trạng thái") {
            area = "column";
            areaIndex = 1;
        } else if (field === "Người phụ trách") {
            area = "row";
            areaIndex = 1;
        } else if (field === "Đội Sale") {
            area = "row";
            areaIndex = 0;
        } else if (field === "Số điện thoại") {
            area = "data";
            areaIndex = 0;
            summaryType = "count";
        }

        return {
            dataField: field,
            area: area,
            areaIndex: areaIndex,
            summaryType: summaryType,
            visible: true,
            sortOrder: area === "column" || area === "row" ? "asc" : undefined,
            expanded: area === "column" || area === "row" ? true : undefined,
            width:
                field === "Người phụ trách" || field === "Người phụ trách"
                    ? 150
                    : undefined,
        };
    });

    return {
        fields: fields.filter((field) => field.area), // Chỉ giữ lại các trường có area
        showColumnTotals: false,
        showRowTotals: false,
        showColumnGrandTotals: true,
        showRowGrandTotals: true,
    };
};

// Hàm để phân tích chuỗi JSON pivotConfig
const parsePivotConfig = (pivotConfig, reportData) => {
    if (!pivotConfig) {
        return getDefaultPivotConfig(reportData);
    }

    try {
        // Nếu đã là object, không cần parse
        if (typeof pivotConfig === "object" && !Array.isArray(pivotConfig)) {
            return pivotConfig;
        }

        // Parse chuỗi JSON
        const parsedConfig =
            typeof pivotConfig === "string"
                ? JSON.parse(pivotConfig)
                : pivotConfig;

        // Kiểm tra cấu trúc cơ bản của config
        if (!parsedConfig.fields || !Array.isArray(parsedConfig.fields)) {
            return getDefaultPivotConfig(reportData);
        }

        return parsedConfig;
    } catch (e) {
        console.error("Lỗi khi phân tích pivotConfig:", e);
        return getDefaultPivotConfig(reportData);
    }
};

export default function PivotCard({
    reportData,
    isLoading,
    title = "Biểu Đồ Pivot Thống Kê",
    colSpan = 2,
    pivotId = "pivot",
    reportId = "",
    pivotConfig = null,
    onSaveConfig = null, // Thêm prop để lưu cấu hình
}) {
    const [dataSource, setDataSource] = useState(null);
    const pivotGridRef = useRef(null);
    const [lastSavedConfig, setLastSavedConfig] = useState(null);
    const [initialConfigSet, setInitialConfigSet] = useState(false);

    // Tạo key dựa trên pivotId và reportId để đảm bảo PivotGrid được tạo mới khi chúng thay đổi
    const pivotGridKey = useMemo(() => {
        return `pivot_${reportId}_${pivotId}_${Date.now()}`;
    }, [reportId, pivotId, pivotConfig]);

    // Xác định storageKey cho việc lưu local state
    const storageKey = useMemo(() => {
        return `org_pivot_chart_state_${reportId}_${pivotId}`;
    }, [reportId, pivotId]);

    // Hàm để áp dụng cấu hình từ API vào PivotGrid
    const applyPivotConfig = () => {
        if (!pivotGridRef.current || !dataSource) return;

        try {
            const instance = pivotGridRef.current.instance;
            const parsedConfig = parsePivotConfig(pivotConfig, reportData);

            // Áp dụng cấu hình tổng
            if (parsedConfig.showColumnTotals !== undefined) {
                instance.option(
                    "showColumnTotals",
                    parsedConfig.showColumnTotals
                );
            }
            if (parsedConfig.showRowTotals !== undefined) {
                instance.option("showRowTotals", parsedConfig.showRowTotals);
            }
            if (parsedConfig.showColumnGrandTotals !== undefined) {
                instance.option(
                    "showColumnGrandTotals",
                    parsedConfig.showColumnGrandTotals
                );
            }
            if (parsedConfig.showRowGrandTotals !== undefined) {
                instance.option(
                    "showRowGrandTotals",
                    parsedConfig.showRowGrandTotals
                );
            }

            // Áp dụng cấu hình fields
            const ds = instance.getDataSource();
            if (ds && parsedConfig.fields) {
                ds.state({
                    fields: parsedConfig.fields,
                });
            }

            // Lưu cấu hình này như là cấu hình mới nhất
            setLastSavedConfig(JSON.stringify(parsedConfig));
            setInitialConfigSet(true);
        } catch (error) {
            console.error("Lỗi khi áp dụng cấu hình Pivot:", error);
        }
    };

    // Xử lý dữ liệu khi reportData hoặc pivotConfig thay đổi
    useEffect(() => {
        if (!reportData || reportData.length === 0) return;

        try {
            // Phân tích cấu hình pivot
            const parsedConfig = parsePivotConfig(pivotConfig, reportData);
            setLastSavedConfig(JSON.stringify(parsedConfig));

            // Tạo PivotGridDataSource với cấu hình đã phân tích
            const pivotGridDataSource = new PivotGridDataSource({
                store: reportData,
                fields: parsedConfig.fields,
                // Vô hiệu hóa remote operations
                remoteOperations: false,
            });

            setDataSource(pivotGridDataSource);
            setInitialConfigSet(false); // Đánh dấu là cần áp dụng cấu hình ban đầu
        } catch (error) {
            console.error("Lỗi khi xử lý dữ liệu pivot:", error);
        }
    }, []);

    // Áp dụng cấu hình từ API sau khi component đã được tạo
    useEffect(() => {
        if (pivotGridRef.current && !initialConfigSet && dataSource) {
            // Đợi một khoảng thời gian ngắn để PivotGrid khởi tạo hoàn toàn
            const timer = setTimeout(() => {
                applyPivotConfig();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [pivotGridRef.current, dataSource, initialConfigSet]);

    // Hàm lấy cấu hình hiện tại từ PivotGrid
    const getCurrentPivotConfig = () => {
        if (!pivotGridRef.current) return null;

        try {
            const pivotInstance = pivotGridRef.current.instance;
            const pivotDataSource = pivotInstance.getDataSource();

            // Lấy trạng thái hiện tại của DataSource
            const state = pivotDataSource.state();

            if (!state || !state.fields) {
                return null;
            }

            // Lọc và chỉ giữ các thuộc tính cần thiết của fields
            const cleanedFields = state.fields.map((field) => {
                const {
                    dataField,
                    area,
                    areaIndex,
                    sortOrder,
                    sortBySummaryField,
                    sortBySummaryPath,
                    expanded,
                    width,
                    visible,
                    summaryType,
                    summaryDisplayMode,
                } = field;

                // Tạo object mới chỉ với các thuộc tính cần thiết
                const cleanedField = { dataField };

                // Chỉ thêm các thuộc tính có giá trị
                if (area) cleanedField.area = area;
                if (areaIndex !== undefined) cleanedField.areaIndex = areaIndex;
                if (sortOrder) cleanedField.sortOrder = sortOrder;
                if (expanded !== undefined) cleanedField.expanded = expanded;
                if (visible !== undefined) cleanedField.visible = visible;
                if (width) cleanedField.width = width;
                if (summaryType) cleanedField.summaryType = summaryType;
                if (summaryDisplayMode)
                    cleanedField.summaryDisplayMode = summaryDisplayMode;
                if (sortBySummaryField)
                    cleanedField.sortBySummaryField = sortBySummaryField;
                if (sortBySummaryPath && sortBySummaryPath.length > 0)
                    cleanedField.sortBySummaryPath = sortBySummaryPath;

                return cleanedField;
            });

            // Tạo cấu hình cuối cùng
            return {
                fields: cleanedFields,
                showColumnTotals: pivotInstance.option("showColumnTotals"),
                showRowTotals: pivotInstance.option("showRowTotals"),
                showColumnGrandTotals: pivotInstance.option(
                    "showColumnGrandTotals"
                ),
                showRowGrandTotals: pivotInstance.option("showRowGrandTotals"),
            };
        } catch (error) {
            return null;
        }
    };

    // Hàm cập nhật và lưu cấu hình pivot
    const updatePivotConfig = async () => {
        if (!onSaveConfig || !pivotGridRef.current || !reportId) return;

        try {
            // Lấy cấu hình hiện tại từ PivotGrid
            const currentConfig = getCurrentPivotConfig();
            if (!currentConfig) {
                return;
            }

            // Chuyển đổi thành chuỗi JSON
            const configString = JSON.stringify(currentConfig);

            // Kiểm tra xem có thay đổi so với lần lưu trước không
            if (configString === lastSavedConfig) {
                return;
            }

            // Gọi API để lưu cấu hình
            const success = await onSaveConfig(pivotId, configString);

            // if (success) {
            //   console.log('Đã lưu cấu hình PivotGrid thành công');
            //   setLastSavedConfig(configString);
            // } else {
            //   console.error('Không thể lưu cấu hình PivotGrid');
            // }
        } catch (error) {
            console.error("Lỗi khi cập nhật cấu hình PivotGrid:", error);
        }
    };

    // Tạo hàm debounce để giới hạn số lần gọi API
    const debouncedUpdateConfig = useMemo(
        () => debounce(updatePivotConfig, 1000),
        [pivotId, reportId, onSaveConfig, lastSavedConfig]
    );

    // Xử lý sự kiện khi cấu hình PivotGrid thay đổi
    const handleStateChanged = () => {
        debouncedUpdateConfig();
    };

    // Hàm xử lý xuất Excel
    const handleExportExcel = () => {
        if (!pivotGridRef.current) return;

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet("Báo cáo thống kê");

        exportPivotGrid({
            component: pivotGridRef.current.instance,
            worksheet,
            customizeCell: (options) => {
                const { gridCell, excelCell } = options;

                if (
                    gridCell?.rowType === "data" ||
                    gridCell?.rowType === "total"
                ) {
                    excelCell.font = { bold: gridCell.rowType === "total" };

                    if (
                        gridCell.area === "row" &&
                        gridCell.rowType === "data"
                    ) {
                        excelCell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "F2F2F2" },
                        };
                    }
                }
            },
        })
            .then(() => {
                workbook.xlsx.writeBuffer().then((buffer) => {
                    saveAs(
                        new Blob([buffer], {
                            type: "application/octet-stream",
                        }),
                        `${title.replace(/\s+/g, "_")}.xlsx`
                    );
                    toast.success("Xuất Excel thành công!");
                });
            })
            .catch((error) => {
                console.error("Lỗi khi xuất Excel:", error);
                toast.error("Đã xảy ra lỗi khi xuất Excel");
            });
    };

    return (
        <Card className={`w-full p-4 ${colSpan === 2 ? "col-span-2" : ""}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                {dataSource && !isLoading && (
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleExportExcel}
                    >
                        <Download className="h-4 w-4" />
                        <span>Xuất Excel</span>
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <Spinner />
                </div>
            ) : dataSource ? (
                <div className="max-w-[calc(100vw-140px)] overflow-x-auto">
                    <PivotGrid
                        key={pivotGridKey}
                        dataSource={dataSource}
                        allowSortingBySummary={true}
                        allowSorting={true}
                        allowFiltering={true}
                        allowExpandAll={true}
                        showBorders={true}
                        showColumnTotals={false}
                        showRowTotals={false}
                        showColumnGrandTotals={true}
                        showRowGrandTotals={true}
                        ref={pivotGridRef}
                        onStateChanged={handleStateChanged}
                        onContentReady={() => {
                            updatePivotConfig();
                        }}
                        columnWidthMode="auto"
                        height="100%"
                        minHeight={400}
                    >
                        <StateStoring
                            enabled={false}
                            type="localStorage"
                            storageKey={storageKey}
                        />
                        <HeaderFilter enabled={true} />
                        <FieldPanel
                            showFilterFields={true}
                            showDataFields={true}
                            showColumnFields={true}
                            showRowFields={true}
                            allowFieldDragging={true}
                            visible={true}
                        />
                        <FieldChooser enabled={true} />
                    </PivotGrid>
                </div>
            ) : (
                <div className="flex items-center justify-center min-h-[300px]">
                    Không có dữ liệu để hiển thị
                </div>
            )}
        </Card>
    );
}

"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CgOptions } from "react-icons/cg";
import {
    MdDragIndicator,
    MdVisibility,
    MdVisibilityOff,
    MdDelete,
} from "react-icons/md";
import { toast } from "react-hot-toast";
import { createSwapy, utils } from "swapy";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCustomReport } from "@/api/org_report";
import { CreatePivotDialog } from "./create_pivot_dialog";

// Danh sách các card báo cáo
const REPORT_CARDS = [
    {
        id: "card0",
        name: "Thông tin tổng quan",
        component: "ReportCard0",
        defaultVisible: true,
        defaultPosition: 0,
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
        id: "card2",
        name: "Phân loại khách hàng",
        component: "ReportCard2",
        defaultVisible: true,
        defaultPosition: 1,
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
        id: "card5",
        name: "Bảng xếp hạng nhân viên kinh doanh",
        component: "ReportCard5",
        defaultVisible: true,
        defaultPosition: 5,
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
        id: "pivot",
        name: "Biểu Đồ Pivot mặc định",
        component: "PivotCard",
        defaultVisible: true,
        defaultPosition: 6,
        colSpan: 2,
    },
];

// Thêm kiểu card
const cardTypes = {
    card0: { color: "#4CAF50", icon: "📊" },
    card1: { color: "#2196F3", icon: "🔄" },
    card2: { color: "#FF9800", icon: "👥" },
    card3: { color: "#F44336", icon: "📈" },
    card5: { color: "#9C27B0", icon: "📅" },
    card6: { color: "#00BCD4", icon: "🔍" },
    pivot: { color: "#795548", icon: "📋" },
};

// Card có thể kéo thả trong danh sách có sẵn
function AvailableCardItem({ item, onClick }) {
    const cardType = cardTypes[item.id] || { color: "#607D8B", icon: "📄" };

    return (
        <div
            className="bg-white rounded-lg border p-2 mb-2 flex items-center justify-between hover:shadow-md cursor-pointer transition-all duration-200"
            style={{ borderLeft: `4px solid ${cardType.color}` }}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-sm">
                    {cardType.icon}
                </div>
                <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.name}
                </span>
            </div>
        </div>
    );
}

// Card hiển thị trong vùng bố cục
function DisplayedCardItem({ item, onRemove }) {
    const cardType = cardTypes[item.id] || { color: "#607D8B", icon: "📄" };

    return (
        <div
            className="bg-white rounded-lg border p-3 flex items-center justify-between cursor-move w-full h-full"
            style={{ borderLeft: `4px solid ${cardType.color}` }}
            data-swapy-drag-handle
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-sm">
                    {cardType.icon}
                </div>
                <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.name}
                </span>
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-6 h-6 p-0 flex-shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item);
                }}
                type="button"
                data-swapy-no-drag
            >
                <MdVisibilityOff className="text-base" />
            </Button>
        </div>
    );
}

// MAIN COMPONENT
export function ReportLayoutDialog({
    open,
    setOpen,
    onLayoutChange,
    selectedReportId,
    onDeleteReport,
    orgId,
    saveReportConfig,
    reportConfig,
    onUpdateReportList,
}) {
    const [isDialogReady, setIsDialogReady] = useState(false);
    const [availableCards, setAvailableCards] = useState([]);
    const [displayedCards, setDisplayedCards] = useState([]);
    const [slotItemMap, setSlotItemMap] = useState([]);
    const [alertOpen, setAlertOpen] = useState(false);
    const [reportTitle, setReportTitle] = useState("");
    const containerRef = useRef(null);
    const swapyRef = useRef(null);
    const initAttemptsRef = useRef(0);
    const [createPivotDialogOpen, setCreatePivotDialogOpen] = useState(false);

    // Chuyển đổi displayedCards thành slottedItems để hiển thị
    const slottedItems = useMemo(() => {
        return utils.toSlottedItems(displayedCards, "id", slotItemMap);
    }, [displayedCards, slotItemMap]);

    // Khởi tạo trạng thái ban đầu
    useEffect(() => {
        try {
            // Debug log

            // Ưu tiên sử dụng cấu hình từ reportConfig nếu có
            if (
                reportConfig &&
                reportConfig.displayedCards &&
                reportConfig.displayedCards.length > 0
            ) {
                // Sử dụng cấu hình từ reportConfig
                const loadedCards = reportConfig.displayedCards || [];
                const loadedAvailable = reportConfig.availableCards || [];

                // Đảm bảo thứ tự các card được giữ nguyên
                const sortedCards = loadedCards.map((card) => {
                    const defaultCard = REPORT_CARDS.find(
                        (c) => c.id === card.id
                    );

                    // Xử lý các thẻ pivot
                    if (
                        card.component === "PivotCard" ||
                        card.id.startsWith("pivot")
                    ) {
                        // Thêm cấu hình pivotConfig mặc định nếu không có
                        const defaultPivotConfig = {
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

                        return {
                            ...card,
                            defaultPosition: defaultCard?.defaultPosition || 0,
                            title: card.name || "Biểu Đồ Pivot",
                            colSpan: card.colSpan || 2,
                            isCustomPivot: true,
                            pivotConfig:
                                card.pivotConfig ||
                                JSON.stringify(defaultPivotConfig),
                        };
                    }

                    return {
                        ...card,
                        defaultPosition: defaultCard?.defaultPosition || 0,
                    };
                });

                setDisplayedCards(sortedCards);
                setAvailableCards(loadedAvailable);
            } else {
                // Nếu không có reportConfig, thử đọc từ localStorage
                const savedLayoutKey = `reportLayout_${selectedReportId}`;
                const savedLayout = localStorage.getItem(savedLayoutKey);

                if (savedLayout) {
                    const parsedLayout = JSON.parse(savedLayout);
                    const loadedCards = parsedLayout.displayedCards || [];
                    const loadedAvailable = parsedLayout.availableCards || [];
                    const pivotConfigs = parsedLayout.pivotConfigs || [];

                    // Đảm bảo thứ tự các card được giữ nguyên
                    const sortedCards = loadedCards.map((card) => {
                        const defaultCard = REPORT_CARDS.find(
                            (c) => c.id === card.id
                        );
                        if (card.id.startsWith("pivot")) {
                            const pivotConfig = pivotConfigs.find(
                                (config) => config.id === card.id
                            );

                            // Thêm cấu hình pivotConfig mặc định nếu không có
                            const defaultPivotConfig = {
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

                            return {
                                ...card,
                                defaultPosition:
                                    defaultCard?.defaultPosition || 0,
                                title: pivotConfig?.title || card.name,
                                colSpan: pivotConfig?.colSpan || 2,
                                isCustomPivot: true,
                                pivotConfig:
                                    pivotConfig?.pivotConfig ||
                                    JSON.stringify(defaultPivotConfig),
                            };
                        }
                        return {
                            ...card,
                            defaultPosition: defaultCard?.defaultPosition || 0,
                        };
                    });

                    setDisplayedCards(sortedCards);
                    setAvailableCards(loadedAvailable);
                } else {
                    // Sử dụng cấu hình mặc định
                    // Tạo danh sách availableCards và displayedCards mặc định
                    // Trong trường hợp này, tất cả card đều hiển thị, nên availableCards trống
                    const initialAvailable = [];

                    // Thêm cấu hình mặc định cho pivot card
                    const initialDisplayed = [...REPORT_CARDS]
                        .sort((a, b) => a.defaultPosition - b.defaultPosition)
                        .filter((card) => card.defaultVisible)
                        .map((card) => {
                            if (
                                card.id === "pivot" ||
                                card.id.startsWith("pivot_")
                            ) {
                                // Thêm cấu hình mặc định cho pivot
                                const defaultPivotConfig = {
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

                                return {
                                    ...card,
                                    pivotConfig:
                                        JSON.stringify(defaultPivotConfig),
                                };
                            }
                            return card;
                        });

                    setAvailableCards(initialAvailable);
                    setDisplayedCards(initialDisplayed);
                }
            }
        } catch (error) {
            console.error("Lỗi khi khởi tạo bố cục báo cáo:", error);
            // Sử dụng cấu hình mặc định nếu có lỗi
            const initialAvailable = [];

            // Thêm cấu hình mặc định cho pivot card
            const initialDisplayed = [...REPORT_CARDS]
                .sort((a, b) => a.defaultPosition - b.defaultPosition)
                .filter((card) => card.defaultVisible)
                .map((card) => {
                    if (card.id === "pivot" || card.id.startsWith("pivot_")) {
                        // Thêm cấu hình mặc định cho pivot
                        const defaultPivotConfig = {
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

                        return {
                            ...card,
                            pivotConfig: JSON.stringify(defaultPivotConfig),
                        };
                    }
                    return card;
                });

            setAvailableCards(initialAvailable);
            setDisplayedCards(initialDisplayed);
        }
    }, [selectedReportId, reportConfig]);

    // Khởi tạo slotItemMap khi displayedCards thay đổi
    useEffect(() => {
        if (displayedCards.length > 0) {
            const newSlotItemMap = utils.initSlotItemMap(displayedCards, "id");
            setSlotItemMap(newSlotItemMap);
        }
    }, [displayedCards]);

    // Khởi tạo Swapy
    const initializeSwapy = useCallback(() => {
        if (!containerRef.current) return false;

        try {
            // Hủy instance cũ nếu có
            if (swapyRef.current) {
                swapyRef.current.destroy();
                swapyRef.current = null;
            }

            // Khởi tạo Swapy mới
            swapyRef.current = createSwapy(containerRef.current, {
                manualSwap: true,
                dragHandle: "[data-swapy-drag-handle]",
            });

            // Lắng nghe sự kiện swap
            swapyRef.current.onSwap((event) => {
                setSlotItemMap(event.newSlotItemMap.asArray);
            });

            // Luôn update Swapy để refresh trạng thái
            if (swapyRef.current) {
                swapyRef.current.update();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Lỗi khi khởi tạo Swapy:", error);
            return false;
        }
    }, []);

    // Hệ thống tự động thử khởi tạo Swapy nhiều lần
    const autoInitialize = useCallback(() => {
        // Tăng số lần thử
        initAttemptsRef.current += 1;

        // Nếu đã thử quá nhiều lần, dừng lại
        if (initAttemptsRef.current > 5) return;

        const success = initializeSwapy();

        // Nếu thành công, dừng lại
        if (success) return;

        // Nếu chưa thành công, thử lại sau một khoảng thời gian
        const delay = 500 * initAttemptsRef.current; // Tăng thời gian chờ mỗi lần thử
        setTimeout(autoInitialize, delay);
    }, [initializeSwapy]);

    // Theo dõi trạng thái dialog và khởi tạo Swapy
    useEffect(() => {
        if (open && displayedCards.length > 0) {
            // Reset số lần thử
            initAttemptsRef.current = 0;

            // Đánh dấu dialog đã sẵn sàng
            setIsDialogReady(true);

            // Đợi dialog và các phần tử render xong
            const timer = setTimeout(() => {
                autoInitialize();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [open, displayedCards, autoInitialize]);

    // Khởi tạo tên báo cáo từ reportConfig khi dialog mở
    useEffect(() => {
        if (open && reportConfig?.title) {
            setReportTitle(reportConfig.title);
        }
    }, [open, reportConfig]);

    // Xử lý khi Dialog mở/đóng
    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
            setIsDialogReady(false);
            if (swapyRef.current) {
                swapyRef.current.destroy();
                swapyRef.current = null;
            }
        }
    };

    // Khởi tạo lại Swapy khi cần
    const handleReinitialize = useCallback(() => {
        initializeSwapy();
    }, [initializeSwapy]);

    // Thêm hàm tạo pivot card mới
    const createNewPivotCard = (title) => {
        const pivotCount = displayedCards.filter((card) =>
            card.id.startsWith("pivot")
        ).length;
        const newPivotId = `pivot_${pivotCount + 1}`;

        const defaultPivotConfig = {
            fields: [
                {
                    dataField: "Nhóm trạng thái",
                    area: "column",
                    areaIndex: 0,
                    sortOrder: "asc",
                    expanded: false,
                },
                {
                    dataField: "Trạng thái",
                    area: "column",
                    areaIndex: 1,
                    sortOrder: "asc",
                    expanded: true,
                },
                {
                    dataField: "Người phụ trách",
                    area: "row",
                    areaIndex: 1,
                    sortOrder: "desc",
                    expanded: true,
                },
                {
                    dataField: "Số điện thoại",
                    area: "data",
                    areaIndex: 0,
                    summaryType: "count",
                },
                {
                    dataField: "Đội Sale",
                    area: "row",
                    areaIndex: 0,
                    expanded: false,
                },
            ],
            showColumnTotals: false,
            showRowTotals: false,
            showColumnGrandTotals: true,
            showRowGrandTotals: true,
        };

        const newPivotCard = {
            id: newPivotId,
            name: title,
            component: "PivotCard",
            defaultVisible: true,
            defaultPosition: displayedCards.length,
            colSpan: 2,
            title: title,
            isCustomPivot: true,
            pivotId: newPivotId,
            reportId: selectedReportId,
            pivotConfig: JSON.stringify(defaultPivotConfig),
        };

        setDisplayedCards([...displayedCards, newPivotCard]);
    };

    // Cập nhật hàm handleClose để lưu thông tin title của báo cáo
    const handleClose = async () => {
        try {
            // Lấy danh sách card theo thứ tự mới
            const sortedCards = slottedItems.map(({ item }) => item);

            // Lưu thông tin pivot configs
            const pivotConfigs = sortedCards
                .filter((card) => card.id.startsWith("pivot"))
                .map((card) => ({
                    id: card.id,
                    title: card.title,
                    colSpan: card.colSpan,
                    pivotId: card.pivotId || card.id,
                    reportId: selectedReportId,
                    pivotConfig:
                        card.pivotConfig ||
                        JSON.stringify({
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
                }));

            // Cập nhật pivotConfig cho các card
            const cardsWithConfig = sortedCards.map((card) => {
                if (card.id.startsWith("pivot")) {
                    const pivotConfig = pivotConfigs.find(
                        (pc) => pc.id === card.id
                    );
                    return {
                        ...card,
                        pivotConfig:
                            pivotConfig?.pivotConfig || card.pivotConfig,
                    };
                }
                return card;
            });

            // Cập nhật tên báo cáo nếu có thay đổi và có thể lưu
            if (
                saveReportConfig &&
                selectedReportId !== "default" &&
                reportTitle.trim() !== ""
            ) {
                // Chuẩn bị dataSource (bắt buộc phải có)
                let dataSourceConfig;
                if (reportConfig && reportConfig.dataSource) {
                    // Nếu có reportConfig.dataSource, sử dụng nó
                    dataSourceConfig = reportConfig.dataSource;
                } else {
                    // Tạo dataSource mặc định nếu không có
                    dataSourceConfig = {
                        title: reportTitle.trim(),
                        description: reportTitle.trim(),
                        dataSource: "CONTACT",
                        columnName: [],
                        condition: {
                            conjunction: "and",
                            conditions: [],
                        },
                        isGroupBy: false,
                    };
                }

                // Tạo bản sao của cấu hình hiện tại để không ảnh hưởng đến cấu hình gốc
                const updatedConfig = {
                    title: reportTitle.trim(),
                    description: reportTitle.trim(),
                    dataSource: dataSourceConfig,
                    availableCards: availableCards,
                    displayedCards: cardsWithConfig,
                };

                // Lưu cấu hình mới
                const success = await saveReportConfig(
                    selectedReportId,
                    updatedConfig
                );

                // Nếu cập nhật tên thành công và có callback cập nhật danh sách báo cáo
                if (success && onUpdateReportList) {
                    // Gọi callback để cập nhật danh sách báo cáo
                    onUpdateReportList();
                }
            }

            // Thông báo thay đổi lên component cha
            if (onLayoutChange) {
                onLayoutChange(cardsWithConfig);
            }

            setOpen(false);
        } catch (error) {
            console.error("Lỗi khi lưu bố cục báo cáo:", error);
            toast.error("Có lỗi xảy ra khi lưu bố cục báo cáo");
        }
    };

    // Di chuyển card từ danh sách hiển thị sang danh sách có sẵn
    const moveToAvailable = (item) => {
        const newDisplayed = displayedCards.filter((c) => c.id !== item.id);
        const newAvailable = [...availableCards, item];
        setDisplayedCards(newDisplayed);
        setAvailableCards(newAvailable);
    };

    // Di chuyển card từ danh sách có sẵn sang danh sách hiển thị
    const moveToDisplayed = (item) => {
        const newAvailable = availableCards.filter((c) => c.id !== item.id);
        const newDisplayed = [...displayedCards, item];
        setAvailableCards(newAvailable);
        setDisplayedCards(newDisplayed);
    };

    // Xử lý xóa báo cáo
    const handleDeleteReport = async () => {
        try {
            const response = await deleteCustomReport(orgId, selectedReportId);
            if (response?.code === 0) {
                toast.success("Đã xóa báo cáo thành công");
                setAlertOpen(false);
                setOpen(false); // Đóng dialog layout
                // Gọi callback để cập nhật danh sách báo cáo
                if (onDeleteReport) {
                    onDeleteReport(selectedReportId);
                }
            } else {
                toast.error(
                    response?.message || "Có lỗi xảy ra khi xóa báo cáo"
                );
            }
        } catch (error) {
            console.error("Lỗi khi xóa báo cáo:", error);
            toast.error("Đã có lỗi xảy ra khi xóa báo cáo");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="min-w-[60vw] max-w-[60vw] max-h-[95vh] overflow-y-auto flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center justify-start mb-1">
                        <DialogTitle className="text-xl">
                            Tùy chỉnh bố cục báo cáo
                        </DialogTitle>
                        {selectedReportId !== "default" && (
                            <div className="flex items-center gap-2 w-1/2 ml-3">
                                <Input
                                    id="report-title"
                                    value={reportTitle}
                                    onChange={(e) =>
                                        setReportTitle(e.target.value)
                                    }
                                    className="h-9"
                                    placeholder="Nhập tên báo cáo"
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm">
                        Kéo và thả để sắp xếp các báo cáo. Báo cáo sẽ hiển thị
                        theo bố cục lưới 2 cột như bạn đang thấy.
                    </p>
                </DialogHeader>

                <div className="flex-1 p-6 pt-4 overflow-y-auto">
                    <div className="grid grid-cols-7 gap-4 w-full h-full">
                        {/* Vùng các card có sẵn - 2 cột */}
                        <div className="col-span-2 border rounded-lg overflow-hidden flex flex-col h-[65vh]">
                            <div className="bg-gray-50 p-3 border-b">
                                <h3 className="font-medium text-gray-700">
                                    Các mẫu báo cáo có sẵn
                                </h3>
                                <p className="text-gray-500 text-xs">
                                    Nhấn vào để thêm vào bố cục
                                </p>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto bg-gray-50/50">
                                {availableCards.map((card) => (
                                    <AvailableCardItem
                                        key={card.id}
                                        item={card}
                                        onClick={() => moveToDisplayed(card)}
                                    />
                                ))}
                                {availableCards.length === 0 && (
                                    <div className="text-center p-4 text-gray-400 flex flex-col items-center justify-center h-full">
                                        <p>Không có báo cáo nào khả dụng</p>
                                        <p className="text-xs">
                                            Tất cả các báo cáo đã được hiển thị
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vùng hiển thị bố cục - 5 cột */}
                        <div className="col-span-5 border rounded-lg overflow-hidden flex flex-col h-[65vh]">
                            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-gray-700">
                                        Bố cục hiển thị
                                    </h3>
                                    <p className="text-gray-500 text-xs">
                                        Kéo thả để thay đổi vị trí hiển thị
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCreatePivotDialogOpen(true)
                                        }
                                        className="text-xs"
                                    >
                                        Thêm Pivot mới
                                    </Button>
                                </div>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto">
                                <div className="border-2 border-dashed border-gray-200 p-4 rounded-lg">
                                    <div
                                        className="grid grid-cols-2 gap-4"
                                        ref={containerRef}
                                    >
                                        {slottedItems.map(
                                            ({ slotId, itemId, item }) => (
                                                <div
                                                    key={slotId}
                                                    data-swapy-slot={slotId}
                                                    className={`min-h-[60px] rounded-lg border-2 border-dashed border-transparent bg-gray-50 ${
                                                        item?.colSpan === 2
                                                            ? "col-span-2"
                                                            : ""
                                                    }`}
                                                >
                                                    {item && (
                                                        <div
                                                            key={itemId}
                                                            data-swapy-item={
                                                                itemId
                                                            }
                                                            className="w-full h-full"
                                                        >
                                                            <DisplayedCardItem
                                                                item={item}
                                                                onRemove={
                                                                    moveToAvailable
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}

                                        {displayedCards.length === 0 && (
                                            <div
                                                className="border-2 border-dashed rounded-lg p-6 text-center col-span-2 min-h-[60px]"
                                                data-swapy-slot="empty"
                                            >
                                                <p className="text-gray-400">
                                                    Chưa có báo cáo nào được
                                                    hiển thị
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Thêm báo cáo từ danh sách
                                                    bên trái
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between p-4 gap-2 border-t bg-gray-50/50">
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            className="flex items-center gap-2"
                            onClick={() => setAlertOpen(true)}
                        >
                            <MdDelete className="h-4 w-4" />
                            <span>Xóa báo cáo</span>
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleClose}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Áp dụng
                        </Button>
                    </div>
                </div>

                {/* Alert Dialog xác nhận xóa */}
                <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                    <AlertDialogContent className="sm:max-w-[425px]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold">
                                Xác nhận xóa báo cáo
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-gray-600">
                                <p>Bạn có chắc chắn muốn xóa báo cáo này?</p>
                                <p className="mt-2 text-gray-500">
                                    Hành động này không thể hoàn tác.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700">
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteReport}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Xóa báo cáo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <CreatePivotDialog
                    open={createPivotDialogOpen}
                    setOpen={setCreatePivotDialogOpen}
                    onCreatePivot={createNewPivotCard}
                />

                <style jsx>{`
                    /* CSS cho highlight khi kéo thả */
                    [data-swapy-highlighted] {
                        background-color: rgba(59, 130, 246, 0.2) !important;
                        border-color: rgba(59, 130, 246, 0.5) !important;
                    }

                    [data-swapy-dragging] {
                        opacity: 0.5;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}

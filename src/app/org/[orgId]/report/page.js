"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Glass } from "@/components/Glass";

import { useRef, useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrgAssigneeSelectDialog } from "./components/org_assignee_select_dialog";
import { WorkspaceMultiSelectDialog } from "./components/workspace_multi_select_dialog";
import { ReportLayoutDialog } from "./components/report_layout_dialog";
import { CreateReportDialog } from "./components/create_report_dialog";
import ReportFilters from "./components/ReportFilters";
import ReportCards from "./components/ReportCards";
import { toast } from "react-hot-toast";
import { useReportApi } from "./hooks/useReportApi";
import { useReportLayout } from "./hooks/useReportLayout";
import { useWorkspaceApi } from "./hooks/useWorkspaceApi";
import {
    DEFAULT_REPORT_CONFIG,
    extractTimeConditionsFromConfig,
    extractWorkspaceConditionFromConfig,
    extractAssigneeConditionFromConfig,
    updateTimeConditionsInConfig,
    updateWorkspaceConditionInConfig,
    updateAssigneeConditionInConfig,
} from "./utils/reportUtils";
import { startOfDay, endOfDay, addDays, format, startOfYear } from "date-fns";

export default function OrgReportPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const scrollRef = useRef(null);

    // Sử dụng custom hooks
    const {
        isLoading: isApiLoading,
        reportData,
        reportMetadata,
        fetchReportList,
        fetchReportConfig,
        fetchReportPreview,
        saveReportConfig,
        createNewReport,
        fetchMemberDetails,
    } = useReportApi(params.orgId);

    const { isLoading: isWorkspaceLoading, fetchWorkspaceDetails } =
        useWorkspaceApi(params.orgId);

    // State cơ bản
    const [reportList, setReportList] = useState([]);
    const [selectedReportId, setSelectedReportId] = useState("default");
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    // Lưu trữ cấu hình gốc và cấu hình làm việc
    const [originalConfig, setOriginalConfig] = useState(null); // Cấu hình gốc dataSource không thay đổi
    const [workingConfig, setWorkingConfig] = useState(null); // Cấu hình làm việc, sẽ thay đổi theo filters
    const [fullReportConfig, setFullReportConfig] = useState(null); // Cấu hình đầy đủ từ API bao gồm displayedCards

    // Sử dụng useReportLayout để quản lý layout
    const { reportLayout, saveLayout } = useReportLayout(
        selectedReportId,
        fullReportConfig,
    );

    // State cho filters
    const [date, setDate] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [dateSelect, setDateSelect] = useState("-30");
    const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
    const [memberList, setMemberList] = useState([]);

    // State cho dialog
    const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
    const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
    const [reportLayoutDialogOpen, setReportLayoutDialogOpen] = useState(false);
    const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
    const [isCreatingReport, setIsCreatingReport] = useState(false);

    // Kiểm tra xem cấu hình đã thay đổi chưa
    const configChanged = useMemo(() => {
        if (!originalConfig || !workingConfig) return false;

        // Chuyển đổi thành chuỗi JSON để so sánh cấu trúc
        const originalJson = JSON.stringify(originalConfig);
        const workingJson = JSON.stringify(workingConfig);

        return originalJson !== workingJson;
    }, [originalConfig, workingConfig]);

    // Hàm xử lý đặt thời gian từ điều kiện
    const setTimeFromConditions = (timeConditions) => {
        if (!timeConditions || timeConditions.length === 0) {
            // Mặc định 30 ngày gần nhất
            setDate({
                from: startOfDay(addDays(new Date(), -30)),
                to: endOfDay(new Date()),
            });
            setDateSelect("-30");
            return;
        }

        // Tìm các điều kiện >= và <=
        const startCondition = timeConditions.find((c) => c.operator === ">=");
        const endCondition = timeConditions.find((c) => c.operator === "<=");

        if (startCondition && endCondition) {
            let newDateSelect = "-30"; // Mặc định

            // Xác định khoảng thời gian dựa trên các keyword
            if (
                startCondition.value === "TODAY" &&
                endCondition.value === "TODAY"
            ) {
                // Ngày hôm nay
                setDate({
                    from: startOfDay(new Date()),
                    to: endOfDay(new Date()),
                });
                newDateSelect = "0";
            } else if (
                startCondition.value === "YESTERDAY" &&
                endCondition.value === "YESTERDAY"
            ) {
                // Ngày hôm qua
                setDate({
                    from: startOfDay(addDays(new Date(), -1)),
                    to: endOfDay(addDays(new Date(), -1)),
                });
                newDateSelect = "-1";
            } else if (
                startCondition.value === "LAST7DAYS" &&
                endCondition.value === "TODAY"
            ) {
                // 7 ngày gần nhất
                setDate({
                    from: startOfDay(addDays(new Date(), -7)),
                    to: endOfDay(new Date()),
                });
                newDateSelect = "-7";
            } else if (
                startCondition.value === "LAST30DAYS" &&
                endCondition.value === "TODAY"
            ) {
                // 30 ngày gần nhất
                setDate({
                    from: startOfDay(addDays(new Date(), -30)),
                    to: endOfDay(new Date()),
                });
                newDateSelect = "-30";
            } else if (startCondition.value === "THISYEAR") {
                // Năm nay
                setDate({
                    from: startOfYear(new Date()),
                    to: endOfDay(new Date()),
                });
                newDateSelect = "thisyear";
            } else {
                // Tùy chỉnh
                try {
                    // Nếu giá trị là ngày cụ thể (format yyyy-MM-dd)
                    const fromParts = startCondition.value.match(
                        /^(\d{4})-(\d{2})-(\d{2})$/,
                    );
                    const toParts = endCondition.value.match(
                        /^(\d{4})-(\d{2})-(\d{2})$/,
                    );

                    if (fromParts && toParts) {
                        setDate({
                            from: startOfDay(
                                new Date(
                                    fromParts[1],
                                    fromParts[2] - 1,
                                    fromParts[3],
                                ),
                            ),
                            to: endOfDay(
                                new Date(
                                    toParts[1],
                                    toParts[2] - 1,
                                    toParts[3],
                                ),
                            ),
                        });
                        newDateSelect = null; // Custom date range
                    }
                } catch (error) {
                    console.error("Lỗi khi xử lý định dạng ngày:", error);
                }
            }

            setDateSelect(newDateSelect);
        }
    };

    // Hàm xử lý workspace từ điều kiện
    const processWorkspaceCondition = async (workspaceCondition) => {
        if (
            !workspaceCondition ||
            !workspaceCondition.extendValues ||
            workspaceCondition.extendValues.length === 0
        ) {
            setSelectedWorkspaces([]);
            return;
        }

        try {
            // Lấy thông tin chi tiết workspace từ danh sách ID
            const workspaceIds = workspaceCondition.extendValues;
            const workspaceDetails = await fetchWorkspaceDetails(workspaceIds);

            if (workspaceDetails && workspaceDetails.length > 0) {
                setSelectedWorkspaces(workspaceDetails);
            } else {
                // Nếu không lấy được thông tin, vẫn giữ ID để hiển thị
                setSelectedWorkspaces(workspaceIds.map((id) => ({ id })));
            }
        } catch (error) {
            console.error("Lỗi khi xử lý điều kiện workspace:", error);
            setSelectedWorkspaces([]);
        }
    };

    // Hàm xử lý assignee từ điều kiện
    const processAssigneeCondition = async (assigneeCondition) => {
        if (
            !assigneeCondition ||
            !assigneeCondition.extendValues ||
            assigneeCondition.extendValues.length === 0
        ) {
            setSelectedAssigneeIds([]);
            setMemberList([]);
            return;
        }

        try {
            // Lấy danh sách ID người phụ trách
            const assigneeIds = assigneeCondition.extendValues;
            setSelectedAssigneeIds(assigneeIds);

            // Lấy thông tin chi tiết của người phụ trách
            const memberDetails = await fetchMemberDetails(assigneeIds);

            if (memberDetails && memberDetails.length > 0) {
                setMemberList(memberDetails);
            } else {
                // Giữ lại danh sách ID nếu không lấy được thông tin chi tiết
                setMemberList(
                    assigneeIds.map((id) => ({
                        profileId: id,
                        fullName: id.substring(0, 8), // Hiển thị phần đầu của ID
                    })),
                );
            }
        } catch (error) {
            console.error("Lỗi khi xử lý điều kiện người phụ trách:", error);
            setSelectedAssigneeIds([]);
            setMemberList([]);
        }
    };

    // Xử lý config để thiết lập các filter
    const processReportConfig = async (config) => {
        try {
            // Lưu trữ cấu hình gốc
            setOriginalConfig(JSON.parse(JSON.stringify(config)));

            // Tạo bản sao cấu hình để làm việc
            setWorkingConfig(JSON.parse(JSON.stringify(config)));

            // Xử lý điều kiện thời gian
            const timeConditions = extractTimeConditionsFromConfig(config);
            setTimeFromConditions(timeConditions);

            // Xử lý điều kiện workspace
            const workspaceCondition =
                extractWorkspaceConditionFromConfig(config);
            await processWorkspaceCondition(workspaceCondition);

            // Xử lý điều kiện người phụ trách
            const assigneeCondition =
                extractAssigneeConditionFromConfig(config);
            await processAssigneeCondition(assigneeCondition);
        } catch (error) {
            console.error("Lỗi khi xử lý cấu hình báo cáo:", error);
            // Đặt các giá trị mặc định nếu xảy ra lỗi
            setDate({
                from: startOfDay(addDays(new Date(), -30)),
                to: endOfDay(new Date()),
            });
            setDateSelect("-30");
            setSelectedWorkspaces([]);
            setSelectedAssigneeIds([]);
            setMemberList([]);
        }
    };

    // Hàm để tạo chuỗi API từ date và dateSelect
    const getTimeConditions = () => {
        if (!date) return [];

        const conditions = [];

        // Nếu dateSelect là giá trị định sẵn
        if (dateSelect === "0") {
            // Today
            conditions.push(
                {
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: "TODAY",
                    extendValues: [],
                },
                {
                    columnName: "CreatedDate",
                    operator: "<=",
                    value: "TODAY",
                    extendValues: [],
                },
            );
        } else if (dateSelect === "-1") {
            // Yesterday
            conditions.push(
                {
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: "YESTERDAY",
                    extendValues: [],
                },
                {
                    columnName: "CreatedDate",
                    operator: "<=",
                    value: "YESTERDAY",
                    extendValues: [],
                },
            );
        } else if (dateSelect === "-7") {
            // Last 7 days
            conditions.push(
                {
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: "LAST7DAYS",
                    extendValues: [],
                },
                {
                    columnName: "CreatedDate",
                    operator: "<=",
                    value: "TODAY",
                    extendValues: [],
                },
            );
        } else if (dateSelect === "-30") {
            // Last 30 days
            conditions.push(
                {
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: "LAST30DAYS",
                    extendValues: [],
                },
                {
                    columnName: "CreatedDate",
                    operator: "<=",
                    value: "TODAY",
                    extendValues: [],
                },
            );
        } else if (dateSelect === "thisyear") {
            // This year
            conditions.push(
                {
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: "THISYEAR",
                    extendValues: [],
                },
                {
                    columnName: "CreatedDate",
                    operator: "<=",
                    value: "TODAY",
                    extendValues: [],
                },
            );
        } else {
            // Custom date range
            // Định dạng ngày theo yyyy-MM-dd
            const formatDate = (d) => format(new Date(d), "yyyy-MM-dd");

            // Thêm điều kiện từ ngày
            if (date.from) {
                conditions.push({
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: formatDate(date.from),
                    extendValues: [],
                });
            }

            // Thêm điều kiện đến ngày
            if (date.to) {
                conditions.push({
                    columnName: "CreatedDate",
                    operator: "<=",
                    value: formatDate(date.to),
                    extendValues: [],
                });
            }
        }

        return conditions;
    };

    // Cập nhật workingConfig theo các filters hiện tại và gọi API preview
    const updateConfigAndFetchPreview = async () => {
        if (!workingConfig) return;

        try {
            // Tạo bản sao của workingConfig để cập nhật
            let updatedConfig = JSON.parse(JSON.stringify(workingConfig));

            // Cập nhật điều kiện thời gian
            const timeConditions = getTimeConditions();
            updatedConfig = updateTimeConditionsInConfig(
                updatedConfig,
                timeConditions,
            );

            // Cập nhật điều kiện workspace
            const workspaceIds = selectedWorkspaces.map((ws) => ws.id);
            updatedConfig = updateWorkspaceConditionInConfig(
                updatedConfig,
                workspaceIds,
            );

            // Cập nhật điều kiện người phụ trách
            updatedConfig = updateAssigneeConditionInConfig(
                updatedConfig,
                selectedAssigneeIds,
            );

            // Cập nhật workingConfig
            setWorkingConfig(updatedConfig);

            // Gọi API preview với cấu hình đã cập nhật
            await fetchReportPreview(updatedConfig);
        } catch (error) {
            console.error(
                "Lỗi khi cập nhật cấu hình và gọi API preview:",
                error,
            );
            toast.error("Đã có lỗi khi cập nhật báo cáo");
        }
    };

    // Logic khởi tạo trang
    useEffect(() => {
        if (!params.orgId) return;

        const initializePage = async () => {
            setIsLoadingReport(true);

            try {
                // Fetch danh sách báo cáo
                const reports = await fetchReportList();
                setReportList(reports);

                let configToUse = null;
                let targetReportId = "default";

                if (reports && reports.length > 0) {
                    // Nếu có báo cáo, lấy báo cáo đầu tiên
                    targetReportId = reports[0].id;

                    // Fetch cấu hình của báo cáo đầu tiên
                    const fetchedConfig =
                        await fetchReportConfig(targetReportId);
                    if (!fetchedConfig) {
                        console.warn(
                            `Không thể tải cấu hình cho báo cáo ${targetReportId}, sử dụng cấu hình mặc định.`,
                        );
                        configToUse = JSON.parse(
                            JSON.stringify(DEFAULT_REPORT_CONFIG),
                        );
                        setOriginalConfig(
                            JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)),
                        );
                        setFullReportConfig({
                            ...DEFAULT_REPORT_CONFIG,
                            displayedCards: [
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
                                },
                            ],
                        });
                        targetReportId = "default";
                    } else {
                        // Lưu trữ toàn bộ cấu hình vào fullReportConfig
                        setFullReportConfig(fetchedConfig);

                        // Kiểm tra nếu fetchedConfig có dataSource thì sử dụng, nếu không thì sử dụng nó như dataSource
                        if (fetchedConfig.dataSource) {
                            // Lưu dataSource vào originalConfig để xử lý filters
                            setOriginalConfig(fetchedConfig.dataSource);
                            configToUse = fetchedConfig.dataSource;
                        } else {
                            // Trong một số trường hợp, fetchedConfig có thể là dataSource
                            setOriginalConfig(fetchedConfig);
                            configToUse = fetchedConfig;
                        }
                    }
                } else {
                    configToUse = JSON.parse(
                        JSON.stringify(DEFAULT_REPORT_CONFIG),
                    );
                }

                setSelectedReportId(targetReportId);

                // Cập nhật URL với reportId
                updateUrlWithReportId(targetReportId);

                // Xử lý config để thiết lập các filter
                await processReportConfig(configToUse);

                // Gọi API lấy dữ liệu preview với cấu hình gốc
                await fetchReportPreview(configToUse);
            } catch (error) {
                console.error("Lỗi khởi tạo trang:", error);
                toast.error("Đã có lỗi khi tải dữ liệu báo cáo");
            } finally {
                setIsLoadingReport(false);
            }
        };

        initializePage();
    }, [params.orgId]);

    // Xử lý khi filter thay đổi
    useEffect(() => {
        // Bỏ qua khi mới khởi tạo hoặc không có cấu hình
        if (!workingConfig || isLoadingReport) return;

        // Cập nhật cấu hình và gọi API
        updateConfigAndFetchPreview();
    }, [date, dateSelect, selectedWorkspaces, selectedAssigneeIds]);

    // Lưu ý khi dùng config Default
    useEffect(() => {
        // Nếu chọn báo cáo mặc định, cập nhật workingConfig
        if (selectedReportId === "default" && !workingConfig) {
            setWorkingConfig(JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)));
            setOriginalConfig(
                JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)),
            );
        }
    }, [selectedReportId, workingConfig]);

    // Hàm cập nhật URL
    const updateUrlWithReportId = (reportId) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("reportId", reportId);
        router.push(
            `${window.location.pathname}?${newSearchParams.toString()}`,
            {
                scroll: false,
            },
        );
    };

    // Handlers đơn giản
    const handleReportChange = async (value) => {
        if (value === selectedReportId || isLoadingReport) return;

        setIsLoadingReport(true);
        setSelectedReportId(value);
        updateUrlWithReportId(value);

        try {
            let configToUse = null;

            if (value === "default") {
                // Sử dụng cấu hình mặc định
                configToUse = JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG));
                setOriginalConfig(
                    JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)),
                );
                setFullReportConfig({
                    ...DEFAULT_REPORT_CONFIG,
                    displayedCards: [
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
                        },
                    ],
                });
            } else {
                // Lấy cấu hình của báo cáo đã chọn
                const fetchedConfig = await fetchReportConfig(value);
                if (!fetchedConfig) {
                    toast.error("Không thể tải cấu hình báo cáo");
                    configToUse = JSON.parse(
                        JSON.stringify(DEFAULT_REPORT_CONFIG),
                    );
                    setOriginalConfig(
                        JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)),
                    );
                    setFullReportConfig(null);
                } else {
                    // Lưu trữ toàn bộ cấu hình vào fullReportConfig
                    setFullReportConfig(fetchedConfig);

                    // Kiểm tra nếu fetchedConfig có dataSource thì sử dụng, nếu không thì sử dụng nó như dataSource
                    if (fetchedConfig.dataSource) {
                        // Lưu dataSource vào originalConfig để xử lý filters
                        setOriginalConfig(fetchedConfig.dataSource);
                        configToUse = fetchedConfig.dataSource;
                    } else {
                        // Trong một số trường hợp, fetchedConfig có thể là dataSource
                        setOriginalConfig(fetchedConfig);
                        configToUse = fetchedConfig;
                    }
                }
            }

            // Xử lý config để thiết lập các filter
            await processReportConfig(configToUse);

            // Gọi API lấy dữ liệu preview với cấu hình
            await fetchReportPreview(configToUse);
        } catch (error) {
            console.error("Lỗi khi đổi báo cáo:", error);
            toast.error("Đã có lỗi khi chuyển đổi báo cáo");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const removeWorkspace = (id) => {
        setSelectedWorkspaces((prev) =>
            prev.filter((workspace) => workspace.id !== id),
        );
    };

    const removeAssigneeId = (id) => {
        setSelectedAssigneeIds((prev) =>
            prev.filter((assigneeId) => assigneeId !== id),
        );
    };

    const getMemberNameById = (id) => {
        if (id === "00000000-0000-0000-0000-000000000000") {
            return "Chưa phụ trách";
        }
        const member = memberList.find((member) => member.profileId === id);
        return member ? member.fullName : id;
    };

    const handleAssigneeChange = (newIds, members) => {
        setSelectedAssigneeIds(newIds || []);
        if (members && members.length > 0) {
            setMemberList(members);
        }
    };

    const handleLayoutChange = (newLayout) => {
        saveLayout(newLayout);
        toast.success("Đã cập nhật bố cục báo cáo");
    };

    // Hàm xử lý tạo báo cáo trực tiếp từ nút cấu hình ở báo cáo mặc định
    const handleCreateDefaultReport = async () => {
        try {
            setIsLoadingReport(true);
            // Tạo trực tiếp báo cáo mới với tiêu đề cố định
            await handleCreateReport("Báo cáo mặc định");
        } catch (error) {
            console.error("Lỗi khi tạo báo cáo mặc định:", error);
            toast.error("Đã có lỗi khi tạo báo cáo mới");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleCreateReport = async (reportTitle) => {
        try {
            setIsCreatingReport(true);

            // Nếu không có title, sử dụng title mặc định
            const title = reportTitle || "Báo cáo mặc định";

            // Sử dụng cấu hình hiện tại để tạo báo cáo mới
            // Nếu không có workingConfig, sử dụng DEFAULT_REPORT_CONFIG
            const configToUse = workingConfig
                ? JSON.parse(JSON.stringify(workingConfig))
                : JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG));

            // Đảm bảo có điều kiện trong cấu hình
            if (!configToUse.condition)
                configToUse.condition = JSON.parse(
                    JSON.stringify(DEFAULT_REPORT_CONFIG.condition),
                );
            if (!configToUse.condition.conditions)
                configToUse.condition.conditions = [];
            if (configToUse.condition.conditions.length === 0) {
                configToUse.condition.conditions.push({
                    conjunction: "and",
                    conditions: [],
                });
            }

            // Cập nhật điều kiện thời gian
            const timeConditions = getTimeConditions();
            const configWithTime = updateTimeConditionsInConfig(
                configToUse,
                timeConditions,
            );

            // Cập nhật điều kiện workspace
            const workspaceIds = selectedWorkspaces.map((ws) => ws.id);
            const configWithWorkspace = updateWorkspaceConditionInConfig(
                configWithTime,
                workspaceIds,
            );

            // Cập nhật điều kiện người phụ trách
            const configWithAssignee = updateAssigneeConditionInConfig(
                configWithWorkspace,
                selectedAssigneeIds,
            );

            // Đặt tiêu đề cho cấu hình
            configWithAssignee.title = title;

            // Gọi API tạo báo cáo mới
            const newReport = await createNewReport(title, configWithAssignee);

            if (newReport?.id) {
                toast.success(`Đã tạo báo cáo "${title}" thành công`);

                // Cập nhật danh sách báo cáo
                const updatedReportList = await fetchReportList();
                setReportList(updatedReportList);

                // Đóng dialog nếu đang mở
                setCreateReportDialogOpen(false);

                // Chuyển đến báo cáo mới tạo
                await handleReportChange(newReport.id);
            } else {
                throw new Error("Không nhận được thông tin báo cáo mới tạo");
            }
        } catch (error) {
            console.error("Lỗi khi tạo báo cáo mới:", error);
            toast.error("Đã có lỗi khi tạo báo cáo mới");
        } finally {
            setIsCreatingReport(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setIsLoadingReport(true);

            // Trường hợp đang ở báo cáo đã có
            if (!configChanged) {
                toast("Không có thay đổi để lưu.");
                setIsLoadingReport(false);
                return;
            }

            // Đảm bảo có điều kiện trong workingConfig
            const configToSave = JSON.parse(JSON.stringify(workingConfig));
            if (!configToSave.condition)
                configToSave.condition = JSON.parse(
                    JSON.stringify(DEFAULT_REPORT_CONFIG.condition),
                );
            if (!configToSave.condition.conditions)
                configToSave.condition.conditions = [];
            if (configToSave.condition.conditions.length === 0) {
                configToSave.condition.conditions.push({
                    conjunction: "and",
                    conditions: [],
                });
            }

            // Cập nhật workingConfig với các điều kiện filter hiện tại
            // Cập nhật điều kiện thời gian
            const timeConditions = getTimeConditions();
            const configWithTime = updateTimeConditionsInConfig(
                configToSave,
                timeConditions,
            );

            // Cập nhật điều kiện workspace
            const workspaceIds = selectedWorkspaces.map((ws) => ws.id);
            const configWithWorkspace = updateWorkspaceConditionInConfig(
                configWithTime,
                workspaceIds,
            );

            // Cập nhật điều kiện người phụ trách
            const configWithAssignee = updateAssigneeConditionInConfig(
                configWithWorkspace,
                selectedAssigneeIds,
            );

            // Lưu cấu hình cuối cùng
            const success = await saveReportConfig(
                selectedReportId,
                configWithAssignee,
            );

            if (success) {
                // Cập nhật originalConfig để khớp với workingConfig
                setOriginalConfig(
                    JSON.parse(JSON.stringify(configWithAssignee)),
                );
                setWorkingConfig(
                    JSON.parse(JSON.stringify(configWithAssignee)),
                );

                // Cập nhật fullReportConfig khi lưu thành công
                // Lấy lại cấu hình báo cáo đầy đủ từ API
                const updatedFullConfig =
                    await fetchReportConfig(selectedReportId);
                if (updatedFullConfig) {
                    setFullReportConfig(updatedFullConfig);
                }

                toast.success("Đã lưu cấu hình báo cáo thành công");
            } else {
                toast.error("Không thể lưu cấu hình báo cáo");
            }
        } catch (error) {
            console.error("Lỗi khi lưu cấu hình:", error);
            toast.error("Đã có lỗi khi lưu cấu hình báo cáo");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleResetConfig = async () => {
        if (!originalConfig || !configChanged) return;

        try {
            setIsLoadingReport(true);

            // Khôi phục workingConfig về originalConfig
            setWorkingConfig(JSON.parse(JSON.stringify(originalConfig)));

            // Xử lý config để thiết lập lại các filter
            await processReportConfig(originalConfig);

            // Gọi API preview với cấu hình gốc
            await fetchReportPreview(originalConfig);

            toast.success("Đã hoàn tác thay đổi");
        } catch (error) {
            console.error("Lỗi khi hoàn tác thay đổi:", error);
            toast.error("Đã có lỗi khi hoàn tác thay đổi");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        try {
            // Cập nhật danh sách báo cáo
            const updatedReportList = await fetchReportList();
            setReportList(updatedReportList);

            // Nếu đang xem báo cáo bị xóa
            if (selectedReportId === reportId) {
                if (updatedReportList && updatedReportList.length > 0) {
                    // Nếu còn báo cáo khác, chuyển sang báo cáo đầu tiên
                    await handleReportChange(updatedReportList[0].id);
                } else {
                    // Nếu không còn báo cáo nào, sử dụng cấu hình mặc định
                    const defaultConfig = JSON.parse(
                        JSON.stringify(DEFAULT_REPORT_CONFIG),
                    );
                    setSelectedReportId("default");
                    updateUrlWithReportId("default");

                    // Xử lý config để thiết lập các filter
                    await processReportConfig(defaultConfig);

                    // Gọi API lấy dữ liệu preview với cấu hình mặc định
                    await fetchReportPreview(defaultConfig);
                }
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật danh sách báo cáo:", error);
            toast.error("Đã có lỗi xảy ra khi cập nhật danh sách báo cáo");
        }
    };

    // Hàm cập nhật danh sách báo cáo
    const refreshReportList = async () => {
        try {
            const updatedReportList = await fetchReportList();
            setReportList(updatedReportList);
        } catch (error) {
            console.error("Lỗi khi cập nhật danh sách báo cáo:", error);
            toast.error("Đã có lỗi xảy ra khi cập nhật danh sách báo cáo");
        }
    };

    // Hàm xử lý lưu cấu hình pivot khi nó thay đổi
    const handleSavePivotConfig = async (pivotId, pivotConfigString) => {
        try {
            // Chỉ lưu khi không phải báo cáo mặc định
            if (selectedReportId === "default") {
                // Có thể hiển thị thông báo để người dùng biết cần lưu báo cáo trước
                toast.info(
                    "Vui lòng lưu báo cáo này trước khi lưu cấu hình pivot",
                );
                return false;
            }

            // Lấy cấu hình báo cáo hiện tại từ API
            const currentConfig = await fetchReportConfig(selectedReportId);
            if (!currentConfig) {
                toast.error("Không thể lấy cấu hình báo cáo hiện tại");
                return false;
            }

            // Đảm bảo displayedCards tồn tại
            if (
                !currentConfig.displayedCards ||
                !Array.isArray(currentConfig.displayedCards)
            ) {
                console.error(
                    "Cấu trúc báo cáo không đúng: thiếu displayedCards",
                );
                toast.error("Cấu trúc báo cáo không đúng");
                return false;
            }

            // Tìm card pivot tương ứng
            const pivotCardIndex = currentConfig.displayedCards.findIndex(
                (card) =>
                    (card.id === pivotId || card.pivotId === pivotId) &&
                    card.component === "PivotCard",
            );

            if (pivotCardIndex === -1) {
                console.error(`Không tìm thấy PivotCard với ID ${pivotId}`);
                // toast.error("Không tìm thấy thẻ Pivot cần cập nhật");
                return false;
            }

            // Tạo bản sao của cấu hình hiện tại
            const updatedConfig = JSON.parse(JSON.stringify(currentConfig));

            // Cập nhật pivotConfig cho card tương ứng
            updatedConfig.displayedCards[pivotCardIndex].pivotConfig =
                pivotConfigString;

            // Lưu cấu hình mới
            const success = await saveReportConfig(
                selectedReportId,
                updatedConfig,
            );

            if (success) {
                // Cập nhật lại fullReportConfig
                return true;
            } else {
                toast.error("Không thể lưu cấu hình pivot");
                return false;
            }
        } catch (error) {
            console.error("Lỗi khi lưu cấu hình pivot:", error);
            // toast.error("Đã có lỗi khi lưu cấu hình pivot");
            return false;
        }
    };

    return (
        <Glass
            intensity="high"
            className="w-full h-full mx-auto rounded-xl max-w-[1920px] overflow-hidden"
        >
            <ScrollArea ref={scrollRef} className="w-full h-full p-4 space-y-4">
                <ReportFilters
                    reportList={reportList}
                    selectedReportId={selectedReportId}
                    onReportChange={handleReportChange}
                    date={date}
                    setDate={setDate}
                    dateSelect={dateSelect}
                    setDateSelect={setDateSelect}
                    selectedWorkspaces={selectedWorkspaces}
                    removeWorkspace={removeWorkspace}
                    selectedAssigneeIds={selectedAssigneeIds}
                    getMemberNameById={getMemberNameById}
                    removeAssigneeId={removeAssigneeId}
                    configChanged={configChanged}
                    isReportChanging={isLoadingReport}
                    onSaveConfig={handleSaveConfig}
                    onResetConfig={handleResetConfig}
                    onOpenWorkspaceDialog={() => setWorkspaceDialogOpen(true)}
                    onOpenAssigneeDialog={() => setAssigneeDialogOpen(true)}
                    onOpenLayoutDialog={() => setReportLayoutDialogOpen(true)}
                    onCreateReport={() => setCreateReportDialogOpen(true)}
                    onDeleteReport={handleDeleteReport}
                    onCreateDefaultReport={handleCreateDefaultReport}
                />

                <ReportCards
                    reportLayout={reportLayout}
                    reportData={reportData}
                    reportMetadata={reportMetadata}
                    isLoading={isApiLoading}
                    onSavePivotConfig={handleSavePivotConfig}
                    reportId={selectedReportId}
                />

                <WorkspaceMultiSelectDialog
                    open={workspaceDialogOpen}
                    setOpen={setWorkspaceDialogOpen}
                    selected={selectedWorkspaces}
                    onSelect={setSelectedWorkspaces}
                />

                <OrgAssigneeSelectDialog
                    open={assigneeDialogOpen}
                    setOpen={setAssigneeDialogOpen}
                    selected={selectedAssigneeIds}
                    onSelect={handleAssigneeChange}
                    orgId={params.orgId}
                />

                <ReportLayoutDialog
                    open={reportLayoutDialogOpen}
                    setOpen={setReportLayoutDialogOpen}
                    onLayoutChange={handleLayoutChange}
                    selectedReportId={selectedReportId}
                    onDeleteReport={handleDeleteReport}
                    orgId={params.orgId}
                    saveReportConfig={saveReportConfig}
                    reportConfig={fullReportConfig}
                    onUpdateReportList={refreshReportList}
                />

                <CreateReportDialog
                    open={createReportDialogOpen}
                    setOpen={setCreateReportDialogOpen}
                    onCreateReport={handleCreateReport}
                    isCreating={isCreatingReport}
                />
            </ScrollArea>
        </Glass>
    );
}

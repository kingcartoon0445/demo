"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export function useReportWorkspace(initialWorkspaceCondition = null) {
    // State cho workspace đã chọn
    const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);

    // State cho trạng thái cấu hình đã thay đổi
    const [workspaceConfigChanged, setWorkspaceConfigChanged] = useState(false);

    // Sử dụng useRef cho tất cả các giá trị theo dõi và so sánh
    const internalState = useRef({
        prevWorkspaces: [],
        originalCondition: null,
        isChanged: false,
        isInitialized: false,
        initializing: false,
        lastReportChange: Date.now(), // Thêm timestamp của lần chuyển báo cáo gần nhất
        // Lưu trạng thái để debug
        lastCompare: { original: null, current: null },
    });

    // Hàm tiện ích để extract ID từ workspace object hoặc string ID
    const extractId = useCallback((ws) => {
        if (ws === null || ws === undefined) return null;
        return typeof ws === "object" && ws.id ? ws.id : ws;
    }, []);

    // Hàm tiện ích để lấy mảng ID từ workspace objects
    const getIdsFromWorkspaces = useCallback(
        (workspaces) => {
            if (!workspaces || !Array.isArray(workspaces)) return [];
            return workspaces.map(extractId).filter(Boolean).sort();
        },
        [extractId]
    );

    // Hàm kiểm tra thay đổi chính xác của workspace
    const updateChangedState = useCallback(() => {
        // Bỏ qua nếu đang khởi tạo hoặc chưa khởi tạo xong
        if (
            internalState.current.initializing ||
            !internalState.current.isInitialized
        ) {
            return;
        }

        // Giảm thời gian đợi sau khi chuyển báo cáo xuống 1 giây thay vì 3 giây
        const timeSinceLastReportChange =
            Date.now() - internalState.current.lastReportChange;
        if (timeSinceLastReportChange < 1000) {
            return;
        }

        // QUAN TRỌNG: Không tự động đặt isChanged = false khi originalCondition = null
        // Điều này có thể ngăn chặn phát hiện thay đổi khi chọn workspace mới
        // trên một báo cáo mới không có điều kiện ban đầu
        if (internalState.current.originalCondition === null) {
            // Kiểm tra nếu đã chọn workspace (nếu đã chọn thì coi là đã thay đổi)
            const currentIds = getIdsFromWorkspaces(selectedWorkspaces);

            if (currentIds.length > 0) {
                internalState.current.isChanged = true;
                setWorkspaceConfigChanged(true);
                return;
            } else {
                // Nếu không có workspace nào được chọn, không có thay đổi
                if (internalState.current.isChanged) {
                    internalState.current.isChanged = false;
                    setWorkspaceConfigChanged(false);
                }
                return;
            }
        }

        // Lấy điều kiện ban đầu
        const originalCondition = internalState.current.originalCondition;

        // Lấy các workspace IDs hiện tại đã được sắp xếp
        const currentIds = getIdsFromWorkspaces(selectedWorkspaces);

        // Xác định IDs ban đầu
        let originalIds = [];

        if (originalCondition && originalCondition.extendValues) {
            originalIds = [...originalCondition.extendValues].sort();
        }

        // Chuyển đổi thành JSON để so sánh chính xác
        const originalJSON = JSON.stringify(originalIds);
        const currentJSON = JSON.stringify(currentIds);

        // Lưu lại giá trị so sánh để debug
        internalState.current.lastCompare = {
            original: originalIds,
            current: currentIds,
        };

        // So sánh để xác định có thay đổi không
        const changed = originalJSON !== currentJSON;

        // Cập nhật state nếu cần
        if (internalState.current.isChanged !== changed) {
            internalState.current.isChanged = changed;
            setWorkspaceConfigChanged(changed);
        }
    }, [selectedWorkspaces, getIdsFromWorkspaces]);

    // Cập nhật state ban đầu từ initialWorkspaceCondition
    useEffect(() => {
        // Đánh dấu đang khởi tạo
        internalState.current.initializing = true;
        internalState.current.isInitialized = false;

        // QUAN TRỌNG: Luôn đặt lại isChanged và workspaceConfigChanged ngay lập tức
        // khi có bất kỳ thay đổi nào trong initialWorkspaceCondition
        internalState.current.isChanged = false;
        setWorkspaceConfigChanged(false);

        try {
            // Khi initialWorkspaceCondition chuyển từ có giá trị sang null
            // (thường xảy ra khi chuyển báo cáo)
            if (!initialWorkspaceCondition) {
                internalState.current.originalCondition = null;

                // Đảm bảo chờ lâu hơn để tất cả các thay đổi khác được xử lý
                setTimeout(() => {
                    internalState.current.isInitialized = true;
                    internalState.current.initializing = false;
                }, 800);

                return;
            }

            // Xử lý condition
            if (initialWorkspaceCondition) {
                // Clone để tránh tham chiếu
                const clonedCondition = {
                    ...initialWorkspaceCondition,
                    extendValues: initialWorkspaceCondition.extendValues
                        ? [...initialWorkspaceCondition.extendValues]
                        : [],
                };

                internalState.current.originalCondition = clonedCondition;
            } else {
                // Nếu không có condition, đặt là null
                internalState.current.originalCondition = null;
            }
        } catch (error) {
            console.error(
                "Lỗi khi khởi tạo từ initialWorkspaceCondition:",
                error
            );
            // Đảm bảo đặt về null nếu có lỗi
            internalState.current.originalCondition = null;
        }

        // Đánh dấu đã khởi tạo xong sau 800ms
        setTimeout(() => {
            internalState.current.isInitialized = true;
            internalState.current.initializing = false;

            // Kiểm tra trạng thái thay đổi sau khi khởi tạo
            updateChangedState();
        }, 800);
    }, [initialWorkspaceCondition, updateChangedState]);

    // Theo dõi khi selectedWorkspaces thay đổi đột ngột (đặt về mảng rỗng)
    // Điều này thường xảy ra khi chuyển báo cáo
    useEffect(() => {
        // Nếu selectedWorkspaces được đặt về mảng rỗng khi không phải đang khởi tạo
        // và originalCondition không phải null, có thể là do chuyển báo cáo
        if (
            selectedWorkspaces.length === 0 &&
            !internalState.current.initializing &&
            internalState.current.originalCondition !== null
        ) {
            // Đặt cờ initializing để ngăn chặn so sánh
            internalState.current.initializing = true;

            // Đặt lại trạng thái
            internalState.current.isChanged = false;
            setWorkspaceConfigChanged(false);

            // Thoát khỏi trạng thái initializing sau một khoảng thời gian
            setTimeout(() => {
                internalState.current.initializing = false;
            }, 300);
        }
    }, [selectedWorkspaces]);

    // Hàm cập nhật điều kiện workspace ban đầu
    const updateOriginalWorkspaceCondition = useCallback(
        (newCondition) => {
            // Đánh dấu đang khởi tạo
            internalState.current.initializing = true;
            internalState.current.isInitialized = false;

            // Đặt lại trạng thái ngay lập tức khi originalCondition thay đổi
            internalState.current.isChanged = false;
            setWorkspaceConfigChanged(false);

            try {
                // Nếu không có condition, đặt là null và kết thúc sớm
                if (!newCondition) {
                    internalState.current.originalCondition = null;

                    // Đảm bảo chờ lâu hơn để tất cả các thay đổi khác được xử lý
                    setTimeout(() => {
                        internalState.current.isInitialized = true;
                        internalState.current.initializing = false;
                    }, 800);

                    return;
                }

                // Clone để tránh tham chiếu
                const clonedCondition = {
                    ...newCondition,
                    extendValues: newCondition.extendValues
                        ? [...newCondition.extendValues]
                        : [],
                };

                internalState.current.originalCondition = clonedCondition;
            } catch (error) {
                console.error("Lỗi khi cập nhật điều kiện ban đầu:", error);
                // Đảm bảo đặt về null nếu có lỗi
                internalState.current.originalCondition = null;
            }

            // Đánh dấu đã khởi tạo xong sau 800ms
            setTimeout(() => {
                internalState.current.isInitialized = true;
                internalState.current.initializing = false;

                // Kiểm tra trạng thái thay đổi sau khi cập nhật
                updateChangedState();
            }, 800);
        },
        [updateChangedState]
    );

    // Cập nhật lựa chọn workspace với tracking thay đổi
    const setSelectedWorkspacesWithTracking = useCallback(
        (newWorkspaces) => {
            // Đặt lastReportChange về quá khứ để giảm khả năng bỏ qua kiểm tra thay đổi
            if (internalState.current.lastReportChange > Date.now() - 2000) {
                internalState.current.lastReportChange = Date.now() - 2000;
            }

            const newIds = getIdsFromWorkspaces(newWorkspaces);
            const currentIds = getIdsFromWorkspaces(selectedWorkspaces);

            // Lưu giá trị trước đó
            internalState.current.prevWorkspaces = [...selectedWorkspaces];

            // Cập nhật state
            setSelectedWorkspaces(newWorkspaces);

            // Kiểm tra nhanh thay đổi rõ ràng
            if (
                newIds.length !== currentIds.length ||
                newIds.some((id) => !currentIds.includes(id))
            ) {
                // Đánh dấu sẵn sàng và không đang khởi tạo
                internalState.current.isInitialized = true;
                internalState.current.initializing = false;

                // Nếu không có điều kiện ban đầu và chọn workspace mới - luôn đánh dấu là thay đổi
                if (
                    internalState.current.originalCondition === null &&
                    newIds.length > 0
                ) {
                    internalState.current.isChanged = true;
                    setWorkspaceConfigChanged(true);
                } else {
                    // Trong trường hợp bình thường, thực hiện kiểm tra thay đổi
                    setTimeout(() => updateChangedState(), 10);
                }
                return;
            }

            // Kiểm tra và đặt cờ thay đổi sau khi cập nhật state
            setTimeout(() => {
                if (
                    internalState.current.isInitialized &&
                    !internalState.current.initializing
                ) {
                    updateChangedState();
                } else {
                    // Force checked sau 500ms
                    setTimeout(() => {
                        internalState.current.isInitialized = true;
                        internalState.current.initializing = false;
                        updateChangedState();
                    }, 500);
                }
            }, 10); // Giảm thời gian chờ xuống 10ms để phản ứng nhanh hơn
        },
        [selectedWorkspaces, updateChangedState, getIdsFromWorkspaces]
    );

    // Tạo điều kiện workspace cho API
    const convertToApiWorkspaceCondition = useCallback(() => {
        const workspaceIds = getIdsFromWorkspaces(selectedWorkspaces);

        if (workspaceIds.length === 0) {
            return null;
        }

        return {
            columnName: "WorkspaceId",
            operator: "IN",
            value: "",
            extendValues: workspaceIds,
        };
    }, [selectedWorkspaces, getIdsFromWorkspaces]);

    // Kiểm tra thay đổi so với original condition
    const checkWorkspaceConditionChanged = useCallback(() => {
        return internalState.current.isChanged;
    }, []);

    // Kiểm tra thay đổi so với lần cuối
    const hasWorkspaceChanged = useCallback(() => {
        const currentIds = getIdsFromWorkspaces(selectedWorkspaces);
        const prevIds = internalState.current.prevWorkspaces || [];

        // So sánh số lượng
        if (currentIds.length !== prevIds.length) {
            return true;
        }

        // So sánh từng ID
        return !currentIds.every((id) => prevIds.includes(id));
    }, [selectedWorkspaces, getIdsFromWorkspaces]);

    // Đặt lại workspace từ điều kiện ban đầu
    const resetWorkspaceFromOriginalCondition = useCallback(
        async (fetchWorkspaceDetails) => {
            const originalCondition = internalState.current.originalCondition;

            // Đánh dấu đang khởi tạo
            internalState.current.initializing = true;
            internalState.current.isInitialized = false;

            // Đặt lại trạng thái ngay lập tức
            internalState.current.isChanged = false;
            setWorkspaceConfigChanged(false);

            try {
                if (
                    !originalCondition ||
                    !originalCondition.extendValues ||
                    originalCondition.extendValues.length === 0
                ) {
                    // Nếu không có workspace ban đầu, đặt về mảng rỗng
                    setSelectedWorkspaces([]);
                } else {
                    // Có workspace ban đầu
                    const workspaceIds = originalCondition.extendValues;

                    if (workspaceIds.length > 0 && fetchWorkspaceDetails) {
                        // Lấy chi tiết workspace
                        const workspaceDetails = await fetchWorkspaceDetails(
                            workspaceIds
                        );
                        setSelectedWorkspaces(workspaceDetails);
                    } else {
                        // Chỉ có ID
                        setSelectedWorkspaces(
                            workspaceIds.map((id) => ({ id }))
                        );
                    }
                }
            } catch (error) {
                console.error("Lỗi khi reset workspace:", error);
                // Đảm bảo đặt về mảng rỗng nếu có lỗi
                setSelectedWorkspaces([]);
            } finally {
                // Đảm bảo luôn thoát khỏi trạng thái khởi tạo
                setTimeout(() => {
                    internalState.current.initializing = false;
                    internalState.current.isInitialized = true;
                    updateChangedState();
                }, 800);
            }
        },
        [updateChangedState]
    );

    // Reset state hoàn toàn
    const resetState = useCallback(() => {
        // Reset selectedWorkspaces về mảng rỗng
        setSelectedWorkspaces([]);

        // Reset trạng thái thay đổi
        setWorkspaceConfigChanged(false);

        // Reset internalState
        internalState.current = {
            prevWorkspaces: [],
            originalCondition: null,
            isChanged: false,
            isInitialized: true,
            initializing: false,
            lastReportChange: Date.now(),
            lastCompare: { original: null, current: null },
        };
    }, []);

    // Hàm cưỡng chế đặt lại trạng thái thay đổi
    const forceResetChanged = useCallback(() => {
        internalState.current.isChanged = false;
        setWorkspaceConfigChanged(false);
        internalState.current.lastReportChange = Date.now();
    }, []);

    return {
        selectedWorkspaces,
        setSelectedWorkspaces: setSelectedWorkspacesWithTracking,
        workspaceConfigChanged,
        hasWorkspaceChanged,
        convertToApiWorkspaceCondition,
        checkWorkspaceConditionChanged,
        resetWorkspaceFromOriginalCondition,
        updateOriginalWorkspaceCondition,
        resetState,
        forceResetChanged, // Thêm hàm mới
    };
}

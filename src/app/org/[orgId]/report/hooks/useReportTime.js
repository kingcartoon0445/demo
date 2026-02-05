"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    startOfDay,
    endOfDay,
    addDays,
    format,
    startOfYear,
    addYears,
    endOfYear,
} from "date-fns";

export function useReportTime(initialTimeCondition = null) {
    // States
    const [date, setDate] = useState(null);
    const [dateSelect, setDateSelect] = useState(null);
    const [configChanged, setConfigChanged] = useState(false);

    // Sử dụng useRef để lưu trữ tất cả dữ liệu trung gian
    const internalState = useRef({
        prevDate: null,
        prevDateSelect: null,
        originalTimeCondition: initialTimeCondition,
        isChanged: false,
        isInitialized: false,
        forceChanged: false, // Thêm cờ để force đổi state
    });

    // Khởi tạo giá trị mặc định nếu không có giá trị ban đầu
    useEffect(() => {
        // Nếu đã khởi tạo rồi thì không cần chạy lại
        if (internalState.current.isInitialized) return;

        // Nếu không có thời gian ban đầu và chưa đặt giá trị state, đặt giá trị mặc định
        if (!initialTimeCondition && !date && !dateSelect) {
            setDate({
                from: startOfDay(addDays(new Date(), -30)),
                to: endOfDay(new Date()),
            });
            setDateSelect("-30");
            internalState.current.isInitialized = true;
        }
    }, [date, dateSelect, initialTimeCondition]);

    // Chuyển đổi thành điều kiện thời gian API, không phụ thuộc vào state
    const convertToApiTimeConditions = useCallback(() => {
        const conditions = [];

        // Nếu date và dateSelect đều là null, trả về mảng rỗng
        if (!date && !dateSelect) {
            return conditions;
        }

        // Sử dụng dateSelect hiện tại
        if (dateSelect) {
            let predefinedValue;

            // Chuyển đổi giá trị dateSelect sang định dạng của server
            switch (dateSelect) {
                case "0":
                    predefinedValue = "TODAY";
                    break;
                case "-1":
                    predefinedValue = "YESTERDAY";
                    break;
                case "-7":
                    predefinedValue = "LAST7DAYS";
                    break;
                case "-30":
                    predefinedValue = "LAST30DAYS";
                    break;
                case "thisyear":
                    predefinedValue = "THISYEAR";
                    break;
                case "lastyear":
                    predefinedValue = "LASTYEAR";
                    break;
                case "-9999":
                    predefinedValue = "ALLTIME";
                    break;
                default:
                    predefinedValue = null;
            }

            // Cập nhật điều kiện thời gian với giá trị đã định nghĩa
            if (predefinedValue) {
                // Thêm điều kiện >=
                conditions.push({
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: predefinedValue,
                    extendValues: [],
                });

                // Thêm điều kiện <=
                conditions.push({
                    columnName: "CreatedDate",
                    operator: "<=",
                    value:
                        predefinedValue === "YESTERDAY" ? "YESTERDAY" : "TODAY",
                    extendValues: [],
                });
            }
        }
        // Nếu user chọn khoảng thời gian tùy chỉnh
        else if (date && date.from) {
            // Định dạng ngày tháng thành chuỗi yyyy-MM-dd
            const formatDate = (d) => format(d, "yyyy-MM-dd");

            // Nếu chỉ chọn 1 ngày, sử dụng điều kiện =
            if (date.to && date.from.getTime() === date.to.getTime()) {
                conditions.push({
                    columnName: "CreatedDate",
                    operator: "=",
                    value: formatDate(date.from),
                });
            } else {
                // Thêm điều kiện >=
                conditions.push({
                    columnName: "CreatedDate",
                    operator: ">=",
                    value: formatDate(date.from),
                });

                // Thêm điều kiện <=
                if (date.to) {
                    conditions.push({
                        columnName: "CreatedDate",
                        operator: "<=",
                        value: formatDate(date.to),
                    });
                }
            }
        }

        return conditions;
    }, [date, dateSelect]);

    // Phân tích và so sánh bằng cách chuẩn hóa giá trị
    const normalizeCondition = (condition, currentDateSelect) => {
        // Kiểm tra nếu condition null hoặc undefined
        if (!condition || typeof condition !== "object") {
            console.warn(
                "normalizeCondition: Điều kiện không hợp lệ",
                condition
            );
            return { normalizedValue: "INVALID_CONDITION" };
        }

        // Tạo bản sao để tránh thay đổi giá trị gốc
        const normalizedCond = { ...condition };

        // Lấy giá trị dateSelect từ tham số để đảm bảo so sánh chính xác
        const compareSelect = currentDateSelect || dateSelect;

        // Chuẩn hóa giá trị value để so sánh
        if (
            normalizedCond.value === "THISYEAR" &&
            normalizedCond.operator === ">="
        ) {
            normalizedCond.normalizedValue = "THISYEAR_START";
        } else if (
            normalizedCond.value === "TODAY" &&
            normalizedCond.operator === "<=" &&
            compareSelect === "thisyear"
        ) {
            normalizedCond.normalizedValue = "THISYEAR_END";
        } else if (
            normalizedCond.value === "LASTYEAR" &&
            normalizedCond.operator === ">="
        ) {
            normalizedCond.normalizedValue = "LASTYEAR_START";
        } else if (
            (normalizedCond.value === "YESTERDAY" ||
                normalizedCond.value === "LASTYEAR") &&
            normalizedCond.operator === "<=" &&
            compareSelect === "lastyear"
        ) {
            normalizedCond.normalizedValue = "LASTYEAR_END";
        } else if (
            normalizedCond.value === "TODAY" &&
            normalizedCond.operator === "<="
        ) {
            normalizedCond.normalizedValue = "TODAY_END";
        } else if (
            normalizedCond.value === "YESTERDAY" &&
            normalizedCond.operator === "<="
        ) {
            normalizedCond.normalizedValue = "YESTERDAY_END";
        } else if (
            normalizedCond.value === "LAST7DAYS" &&
            normalizedCond.operator === ">="
        ) {
            normalizedCond.normalizedValue = "LAST7DAYS_START";
        } else if (
            normalizedCond.value === "LAST30DAYS" &&
            normalizedCond.operator === ">="
        ) {
            normalizedCond.normalizedValue = "LAST30DAYS_START";
        } else if (
            normalizedCond.value === "ALLTIME" &&
            normalizedCond.operator === ">="
        ) {
            normalizedCond.normalizedValue = "ALLTIME_START";
        } else {
            normalizedCond.normalizedValue = `${normalizedCond.value}_${normalizedCond.operator}`;
        }

        return normalizedCond;
    };

    // So sánh hai điều kiện thời gian
    const compareTimeConditions = useCallback(
        (original, current, currentDateSelect) => {
            // Kiểm tra null hoặc undefined
            if (!original || !current) {
                return original === current; // Nếu cả hai đều null/undefined thì coi là bằng nhau
            }

            // Nếu số lượng điều kiện khác nhau, coi là đã thay đổi
            if (original.length !== current.length) {
                return false;
            }

            const compareSelect = currentDateSelect || dateSelect;

            // Chuẩn hóa các điều kiện để so sánh
            const normalizedOriginal = original
                .map((c) => normalizeCondition(c, compareSelect))
                .sort((a, b) =>
                    `${a.columnName}${a.operator}`.localeCompare(
                        `${b.columnName}${b.operator}`
                    )
                );

            const normalizedCurrent = current
                .map((c) => normalizeCondition(c, compareSelect))
                .sort((a, b) =>
                    `${a.columnName}${a.operator}`.localeCompare(
                        `${b.columnName}${b.operator}`
                    )
                );

            // Kiểm tra các trường hợp đặc biệt

            // Kiểm tra xem có phải cả hai đều là thisyear không
            const isOriginalThisyear =
                normalizedOriginal.some(
                    (c) => c.normalizedValue === "THISYEAR_START"
                ) &&
                normalizedOriginal.some(
                    (c) =>
                        c.normalizedValue === "TODAY_END" ||
                        c.normalizedValue === "THISYEAR_END"
                );

            const isCurrentThisyear =
                normalizedCurrent.some(
                    (c) => c.normalizedValue === "THISYEAR_START"
                ) &&
                normalizedCurrent.some(
                    (c) =>
                        c.normalizedValue === "TODAY_END" ||
                        c.normalizedValue === "THISYEAR_END"
                );

            // Kiểm tra xem có phải cả hai đều là lastyear không
            const isOriginalLastyear =
                normalizedOriginal.some(
                    (c) => c.normalizedValue === "LASTYEAR_START"
                ) &&
                normalizedOriginal.some(
                    (c) =>
                        c.normalizedValue === "YESTERDAY_END" ||
                        c.normalizedValue === "LASTYEAR_END"
                );

            const isCurrentLastyear =
                normalizedCurrent.some(
                    (c) => c.normalizedValue === "LASTYEAR_START"
                ) &&
                normalizedCurrent.some(
                    (c) =>
                        c.normalizedValue === "YESTERDAY_END" ||
                        c.normalizedValue === "LASTYEAR_END"
                );

            // Kiểm tra các trường hợp khác...
            const isOriginalAlltime = normalizedOriginal.some(
                (c) => c.normalizedValue === "ALLTIME_START"
            );
            const isCurrentAlltime = normalizedCurrent.some(
                (c) => c.normalizedValue === "ALLTIME_START"
            );

            const isOriginalLast7days =
                normalizedOriginal.some(
                    (c) => c.normalizedValue === "LAST7DAYS_START"
                ) &&
                normalizedOriginal.some(
                    (c) => c.normalizedValue === "TODAY_END"
                );

            const isCurrentLast7days =
                normalizedCurrent.some(
                    (c) => c.normalizedValue === "LAST7DAYS_START"
                ) &&
                normalizedCurrent.some(
                    (c) => c.normalizedValue === "TODAY_END"
                );

            const isOriginalLast30days =
                normalizedOriginal.some(
                    (c) => c.normalizedValue === "LAST30DAYS_START"
                ) &&
                normalizedOriginal.some(
                    (c) => c.normalizedValue === "TODAY_END"
                );

            const isCurrentLast30days =
                normalizedCurrent.some(
                    (c) => c.normalizedValue === "LAST30DAYS_START"
                ) &&
                normalizedCurrent.some(
                    (c) => c.normalizedValue === "TODAY_END"
                );

            // Kiểm tra xem dateSelect hiện tại có trùng với các trạng thái gốc không
            if (compareSelect === "thisyear" && isOriginalThisyear) return true;
            if (compareSelect === "lastyear" && isOriginalLastyear) return true;
            if (compareSelect === "-9999" && isOriginalAlltime) return true;
            if (compareSelect === "-7" && isOriginalLast7days) return true;
            if (compareSelect === "-30" && isOriginalLast30days) return true;

            // Kiểm tra các trường hợp ngược lại (nếu đang ở trạng thái đặc biệt nhưng dateSelect khác)
            if (isOriginalThisyear && compareSelect !== "thisyear")
                return false;
            if (isOriginalLastyear && compareSelect !== "lastyear")
                return false;
            if (isOriginalAlltime && compareSelect !== "-9999") return false;
            if (isOriginalLast7days && compareSelect !== "-7") return false;
            if (isOriginalLast30days && compareSelect !== "-30") return false;

            // Nếu cả hai đều cùng là một loại thời gian thì không có thay đổi
            if (
                (isOriginalThisyear && isCurrentThisyear) ||
                (isOriginalLastyear && isCurrentLastyear) ||
                (isOriginalAlltime && isCurrentAlltime) ||
                (isOriginalLast7days && isCurrentLast7days) ||
                (isOriginalLast30days && isCurrentLast30days)
            ) {
                return true;
            }

            // So sánh chi tiết từng điều kiện
            for (let i = 0; i < normalizedOriginal.length; i++) {
                if (
                    normalizedOriginal[i].normalizedValue !==
                    normalizedCurrent[i].normalizedValue
                ) {
                    return false;
                }
            }

            return true;
        },
        [dateSelect]
    );

    // Hàm cập nhật trạng thái thay đổi
    const updateChangedState = useCallback(
        (newDateSelect = null) => {
            try {
                // Nếu chưa khởi tạo xong, không kiểm tra thay đổi
                if (!internalState.current.isInitialized) {
                    return;
                }

                // Force cờ thay đổi thành true nếu được yêu cầu
                if (internalState.current.forceChanged === true) {
                    internalState.current.forceChanged = false; // Reset sau khi sử dụng
                    internalState.current.isChanged = true;
                    setConfigChanged(true);
                    return;
                }

                const currentTimeConditions = convertToApiTimeConditions();
                const originalTimeCondition =
                    internalState.current.originalTimeCondition;

                // Debug info

                // Nếu không có điều kiện ban đầu (thường là khi chuyển báo cáo), không cần kiểm tra
                if (!originalTimeCondition) {
                    if (internalState.current.isChanged !== false) {
                        internalState.current.isChanged = false;
                        setConfigChanged(false);
                    }
                    return;
                }

                // Nếu chưa có điều kiện hiện tại (chưa khởi tạo giá trị)
                if (!date && !dateSelect) {
                    return;
                }

                // Nếu không có điều kiện hiện tại
                if (
                    !currentTimeConditions ||
                    currentTimeConditions.length === 0
                ) {
                    const changed =
                        originalTimeCondition &&
                        originalTimeCondition.length > 0;
                    if (internalState.current.isChanged !== changed) {
                        internalState.current.isChanged = changed;
                        setConfigChanged(changed);
                    }
                    return;
                }

                // Kiểm tra nhanh xem dateSelect có thay đổi không
                let originalDateSelect = null;

                // Phát hiện dateSelect từ originalTimeCondition
                if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "THISYEAR" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "thisyear";
                } else if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "LASTYEAR" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "lastyear";
                } else if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "LAST7DAYS" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "-7";
                } else if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "LAST30DAYS" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "-30";
                } else if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "ALLTIME" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "-9999";
                } else if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "TODAY" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "0";
                } else if (
                    originalTimeCondition &&
                    originalTimeCondition.some(
                        (c) => c.value === "YESTERDAY" && c.operator === ">="
                    )
                ) {
                    originalDateSelect = "-1";
                }

                // Sử dụng giá trị mới nếu được truyền vào
                const compareSelect = newDateSelect || dateSelect;

                // So sánh dateSelect hiện tại với giá trị gốc
                // Lưu ý: dateSelect có thể thay đổi nhiều lần, nhưng chúng ta vẫn luôn so sánh với giá trị gốc
                if (originalDateSelect !== compareSelect) {
                    // Cập nhật trạng thái thay đổi
                    if (internalState.current.isChanged !== true) {
                        internalState.current.isChanged = true;
                        setConfigChanged(true);
                    }

                    return;
                }

                // Sử dụng hàm so sánh chi tiết
                const areEqual = compareTimeConditions(
                    originalTimeCondition,
                    currentTimeConditions,
                    compareSelect
                );
                const changed = !areEqual;

                // Chỉ cập nhật nếu thực sự thay đổi
                if (internalState.current.isChanged !== changed) {
                    internalState.current.isChanged = changed;
                    setConfigChanged(changed);
                }
            } catch (error) {
                console.error(
                    "updateChangedState: Lỗi khi kiểm tra thay đổi",
                    error
                );
                // Nếu có lỗi, đặt mặc định là không thay đổi
                internalState.current.isChanged = false;
                setConfigChanged(false);
            }
        },
        [convertToApiTimeConditions, dateSelect, date, compareTimeConditions]
    );

    // Cập nhật date với tracking thay đổi
    const setDateWithTracking = useCallback(
        (newDate) => {
            // Lưu giá trị trước đó
            internalState.current.prevDate = date;

            // Cập nhật state
            setDate(newDate);

            // Kiểm tra và cập nhật trạng thái thay đổi ngay lập tức
            updateChangedState();
        },
        [date, updateChangedState]
    );

    // Hàm cập nhật dateSelect có tracking
    const setDateSelectWithTracking = useCallback(
        (newValue) => {
            // Lưu giá trị hiện tại để so sánh sau
            const previousDateSelect = dateSelect;
            internalState.current.prevDateSelect = previousDateSelect;

            // Cập nhật state
            setDateSelect(newValue);

            // Thêm try-catch để tránh lỗi khi gọi updateChangedState
            try {
                // Nếu giá trị mới khác giá trị trước đó, gọi hàm update
                if (previousDateSelect !== newValue) {
                    // Tạo điều kiện thời gian mới
                    let newDate = null;

                    switch (newValue) {
                        case "0": // Today
                            newDate = {
                                from: startOfDay(new Date()),
                                to: endOfDay(new Date()),
                            };
                            break;
                        case "-1": // Yesterday
                            newDate = {
                                from: startOfDay(addDays(new Date(), -1)),
                                to: endOfDay(addDays(new Date(), -1)),
                            };
                            break;
                        case "-7": // Last 7 days
                            newDate = {
                                from: startOfDay(addDays(new Date(), -7)),
                                to: endOfDay(new Date()),
                            };
                            break;
                        case "-30": // Last 30 days
                            newDate = {
                                from: startOfDay(addDays(new Date(), -30)),
                                to: endOfDay(new Date()),
                            };
                            break;
                        case "thisyear": // This year
                            newDate = {
                                from: startOfYear(new Date()),
                                to: endOfDay(new Date()),
                            };
                            break;
                        case "lastyear": // Last year
                            const lastYear = new Date().getFullYear() - 1;
                            newDate = {
                                from: startOfYear(new Date(lastYear, 0, 1)),
                                to: endOfYear(new Date(lastYear, 11, 31)),
                            };
                            break;
                        case "-9999": // All time
                            newDate = {
                                from: startOfDay(new Date(2000, 0, 1)),
                                to: endOfDay(new Date()),
                            };
                            break;
                        default:
                            newDate = date;
                    }

                    // Đặt lại trạng thái time để phản ánh lựa chọn mới
                    if (newDate) {
                        internalState.current.prevDate = date;
                        setDate(newDate);
                    }

                    // Gọi hàm updateChangedState để phát hiện thay đổi
                    setTimeout(() => {
                        updateChangedState(newValue);
                    }, 0);
                }
            } catch (error) {
                console.error("Lỗi trong setDateSelectWithTracking:", error);
            }
        },
        [dateSelect, date, updateChangedState]
    );

    // Kiểm tra nếu có thay đổi so với lần gọi API cuối cùng
    const hasTimeChanged = useCallback(() => {
        const prevDate = internalState.current.prevDate;
        const prevDateSelect = internalState.current.prevDateSelect;

        const dateChanged =
            !prevDate || JSON.stringify(date) !== JSON.stringify(prevDate);
        const dateSelectChanged = prevDateSelect !== dateSelect;

        return dateChanged || dateSelectChanged;
    }, [date, dateSelect]);

    // Hàm kiểm tra nếu điều kiện thời gian thay đổi so với ban đầu
    const checkTimeConditionChanged = useCallback(() => {
        return internalState.current.isChanged;
    }, []);

    // Hàm đặt lại thời gian từ điều kiện gốc
    const resetTimeFromOriginalCondition = useCallback(() => {
        const originalTimeCondition =
            internalState.current.originalTimeCondition;
        if (!originalTimeCondition || originalTimeCondition.length === 0)
            return;

        try {
            // Đánh dấu đã khởi tạo
            internalState.current.isInitialized = true;

            // Đặt cờ để force thay đổi sau khi reset
            internalState.current.forceChanged = true;

            // Nếu điều kiện là dạng ngày cụ thể, ưu tiên kiểm tra điều kiện = trước
            const equalCond = originalTimeCondition.find(
                (c) => c.operator === "="
            );
            if (equalCond) {
                if (equalCond.value === "TODAY") {
                    setDateSelect("0");
                    setDate({
                        from: startOfDay(new Date()),
                        to: endOfDay(new Date()),
                    });
                } else if (equalCond.value === "YESTERDAY") {
                    setDateSelect("-1");
                    setDate({
                        from: startOfDay(addDays(new Date(), -1)),
                        to: endOfDay(addDays(new Date(), -1)),
                    });
                } else if (
                    typeof equalCond.value === "string" &&
                    equalCond.value.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                    try {
                        const exactDate = new Date(equalCond.value);
                        setDateSelect(undefined);
                        setDate({
                            from: startOfDay(exactDate),
                            to: endOfDay(exactDate),
                        });
                    } catch (e) {
                        console.error("Lỗi chuyển đổi ngày tháng:", e);
                    }
                }
            } else {
                // Nếu không có điều kiện =, tìm các điều kiện >= và <=
                const greaterOrEqualCond = originalTimeCondition.find(
                    (c) => c.operator === ">="
                );
                const lessOrEqualCond = originalTimeCondition.find(
                    (c) => c.operator === "<="
                );

                if (greaterOrEqualCond && lessOrEqualCond) {
                    // Nếu là giá trị có sẵn (TODAY, YESTERDAY, etc.)
                    if (
                        [
                            "TODAY",
                            "YESTERDAY",
                            "LAST7DAYS",
                            "LAST30DAYS",
                            "THISYEAR",
                        ].includes(greaterOrEqualCond.value)
                    ) {
                        let detectedDateSelect;
                        switch (greaterOrEqualCond.value) {
                            case "TODAY":
                                detectedDateSelect = "0";
                                break;
                            case "YESTERDAY":
                                detectedDateSelect = "-1";
                                break;
                            case "LAST7DAYS":
                                detectedDateSelect = "-7";
                                break;
                            case "LAST30DAYS":
                                detectedDateSelect = "-30";
                                break;
                            case "THISYEAR":
                                detectedDateSelect = "thisyear";
                                break;
                            case "LASTYEAR":
                                detectedDateSelect = "lastyear";
                                break;
                            case "ALLTIME":
                                detectedDateSelect = "-9999";
                                break;
                        }

                        setDateSelect(detectedDateSelect);

                        // Tạo object date tương ứng
                        if (detectedDateSelect === "0") {
                            setDate({
                                from: startOfDay(new Date()),
                                to: endOfDay(new Date()),
                            });
                        } else if (detectedDateSelect === "-1") {
                            setDate({
                                from: startOfDay(addDays(new Date(), -1)),
                                to: endOfDay(addDays(new Date(), -1)),
                            });
                        } else if (detectedDateSelect === "thisyear") {
                            setDate({
                                from: startOfYear(new Date()),
                                to: endOfDay(new Date()),
                            });
                        } else if (detectedDateSelect === "lastyear") {
                            setDate({
                                from: startOfYear(addYears(new Date(), -1)),
                                to: endOfYear(addYears(new Date(), -1)),
                            });
                        } else if (detectedDateSelect === "-9999") {
                            setDate({
                                from: startOfDay(addDays(new Date(), -9999)),
                                to: endOfDay(new Date()),
                            });
                        } else if (detectedDateSelect === "-7") {
                            setDate({
                                from: startOfDay(addDays(new Date(), -7)),
                                to: endOfDay(new Date()),
                            });
                        } else if (detectedDateSelect === "-30") {
                            setDate({
                                from: startOfDay(addDays(new Date(), -30)),
                                to: endOfDay(new Date()),
                            });
                        }
                    }
                    // Nếu là ngày cụ thể
                    else if (
                        greaterOrEqualCond.value &&
                        typeof greaterOrEqualCond.value === "string" &&
                        greaterOrEqualCond.value.match(/^\d{4}-\d{2}-\d{2}$/)
                    ) {
                        try {
                            const fromDate = new Date(greaterOrEqualCond.value);
                            let toDate = new Date();
                            if (
                                lessOrEqualCond.value &&
                                typeof lessOrEqualCond.value === "string" &&
                                lessOrEqualCond.value.match(
                                    /^\d{4}-\d{2}-\d{2}$/
                                )
                            ) {
                                toDate = new Date(lessOrEqualCond.value);
                            }

                            setDateSelect(undefined);
                            setDate({
                                from: startOfDay(fromDate),
                                to: endOfDay(toDate),
                            });
                        } catch (e) {
                            console.error("Lỗi chuyển đổi ngày tháng:", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi reset thời gian từ điều kiện gốc:", error);
        }

        // Đảm bảo gọi updateChangedState ngay sau khi reset để bắt buộc thay đổi
        setTimeout(() => {
            updateChangedState();
        }, 100);
    }, [updateChangedState]);

    // Phát hiện điều kiện thời gian từ config
    const detectTimeCondition = useCallback(
        (timeConditions) => {
            if (!timeConditions || timeConditions.length === 0) return;

            // Tự động phát hiện điều kiện thời gian đặc biệt và cập nhật originalTimeCondition
            internalState.current.originalTimeCondition = Array.isArray(
                timeConditions
            )
                ? [...timeConditions] // Clone array để tránh tham chiếu
                : timeConditions;

            // Reset time từ điều kiện gốc mới
            resetTimeFromOriginalCondition();

            // Đánh dấu đã khởi tạo
            internalState.current.isInitialized = true;
        },
        [resetTimeFromOriginalCondition]
    );

    // Hàm cập nhật giá trị điều kiện ban đầu
    const updateOriginalTimeCondition = useCallback(
        (newCondition) => {
            try {
                // Clone để tránh tham chiếu
                const clonedCondition = newCondition ? [...newCondition] : null;

                // Cập nhật điều kiện ban đầu
                internalState.current.originalTimeCondition = clonedCondition;

                // Reset trạng thái thay đổi ngay sau khi cập nhật điều kiện ban đầu
                internalState.current.isChanged = false;
                setConfigChanged(false);

                // Đợi một lúc để đảm bảo tất cả các state đã được cập nhật
                setTimeout(() => {
                    // Đánh dấu đã khởi tạo xong
                    internalState.current.isInitialized = true;

                    // Kiểm tra lại thay đổi sau khi khởi tạo
                    updateChangedState();
                }, 500);
            } catch (error) {
                console.error("updateOriginalTimeCondition:", error);
            }
        },
        [updateChangedState]
    );

    // Cập nhật điều kiện ban đầu từ props khi có thay đổi
    useEffect(() => {
        if (initialTimeCondition) {
            // Clone để tránh tham chiếu đến object gốc
            internalState.current.originalTimeCondition = Array.isArray(
                initialTimeCondition
            )
                ? [...initialTimeCondition] // Clone array để tránh tham chiếu
                : initialTimeCondition;

            // Sau khi cập nhật điều kiện ban đầu, kiểm tra lại trạng thái thay đổi
            // Sử dụng setTimeout để đảm bảo state đã được cập nhật
            setTimeout(() => {
                updateChangedState();
            }, 0);
        }
    }, [initialTimeCondition, updateChangedState]);

    // Hàm reset hoàn toàn trạng thái của hook
    const resetState = useCallback(() => {
        // Reset date về 30 ngày gần nhất
        const defaultDate = {
            from: startOfDay(addDays(new Date(), -30)),
            to: endOfDay(new Date()),
        };

        // Reset dateSelect
        const defaultDateSelect = "-30";

        // Đảm bảo rõ ràng reset tất cả các state
        setDate(defaultDate);
        setDateSelect(defaultDateSelect);

        // Reset trạng thái thay đổi
        setConfigChanged(false);

        // Reset các giá trị internal
        internalState.current = {
            prevDate: null,
            prevDateSelect: null,
            originalTimeCondition: null,
            isChanged: false,
            isInitialized: true,
            forceChanged: false,
        };
    }, []);

    // Hàm cưỡng chế đặt lại trạng thái thay đổi
    const forceResetChanged = useCallback(() => {
        internalState.current.isChanged = false;
        setConfigChanged(false);
    }, []);

    return {
        date,
        setDate: setDateWithTracking,
        dateSelect,
        setDateSelect: setDateSelectWithTracking,
        configChanged,
        hasTimeChanged,
        convertToApiTimeConditions,
        checkTimeConditionChanged,
        detectTimeCondition,
        resetTimeFromOriginalCondition,
        updateOriginalTimeCondition,
        resetState,
        forceResetChanged,
    };
}

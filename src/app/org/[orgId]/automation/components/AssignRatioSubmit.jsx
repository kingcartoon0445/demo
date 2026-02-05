"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import {
    createAssignRatioV2,
    updateAssignRatioV2,
    updateDistributionTargetV2,
} from "@/api/automationV2";
import { ToastPromise } from "@/components/toast";
import toast from "react-hot-toast";

export default function useAssignRatioSubmit({
    editMode,
    ruleData,
    onSuccess,
    setOpen,
    setIsSubmitting,
    selectedAutomationType,
    selectedWorkspaceId,
    timeFrameEnabled,
    startTime,
    endTime,
    weekdays,
    categoryRoute,
    sourceRoute,
    stageSelected,
    timeRule,
    rule,
    assignTeam,
    reminderEnabled,
    reminderTimes,
    reminderMessage,
    hasStageUpdate,
    stageToUpdate,
    maxAttemptsEnabled,
    maxAttempts,
    reverseDayMapping,
    selectedScope,
    selectedScopeTargets,
    distributionTargets = [],
}) {
    const params = useParams();

    const handleSubmit = useCallback(() => {
        // Dùng validation chung từ RecallConfigContent
        if (typeof window !== "undefined" && window.validateRecallConfig) {
            const isValid = window.validateRecallConfig();
            if (!isValid) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
                return;
            }
        } else {
            if (selectedAutomationType === "deal" && !selectedWorkspaceId) {
                toast.error("Vui lòng chọn không gian làm việc trước khi lưu!");
                return;
            }
        }

        if (timeFrameEnabled) {
            const startMinutes = startTime.hour * 60 + startTime.minute;
            const endMinutes = endTime.hour * 60 + endTime.minute;

            if (startMinutes >= endMinutes) {
                toast.error(
                    "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc!"
                );
                return;
            }

            if (!weekdays.some((day) => day.checked)) {
                toast.error("Vui lòng chọn ít nhất một ngày trong tuần!");
                return;
            }
        }

        if (!distributionTargets || distributionTargets.length === 0) {
            toast.error("Vui lòng cấu hình tỉ lệ phân phối trước khi lưu!");
            return;
        }

        setIsSubmitting(true);

        const allCategoriesChecked = categoryRoute.every(
            (item) => item.checked
        );
        const allSourcesChecked = sourceRoute.every((item) => item.checked);
        const anyCategoryChecked = categoryRoute.some((item) => item.checked);
        const anySourceChecked = sourceRoute.some((item) => item.checked);
        const durationInMinutes = timeRule.hour * 60 + timeRule.minute;

        // Build conditions (tương tự thu hồi)
        // Xác định event type dựa trên category
        let eventType = "ASSIGN_TO";
        if (selectedAutomationType === "lead") {
            eventType = "NEW";
        } else if (selectedAutomationType === "deal") {
            eventType = "NEW";
        } else if (selectedAutomationType === "customer") {
            eventType = "NEW";
        }

        const baseConditions = [
            {
                columnName: "Event",
                operator: "IN",
                value: "",
                extendValues: ["ASSIGN_TO", "NEW"],
            },
        ];

        if (selectedAutomationType === "deal" && selectedWorkspaceId) {
            baseConditions.push({
                columnName: "WorkspaceId",
                operator: "IN",
                value: "",
                extendValues: [selectedWorkspaceId],
            });
        }

        if (!allCategoriesChecked && anyCategoryChecked) {
            const categoryValues = categoryRoute
                .filter((item) => item.checked)
                .map((item) => item.value);
            baseConditions.push({
                columnName: "SourceId",
                operator: "IN",
                value: "",
                extendValues: categoryValues,
            });
        }

        if (!allSourcesChecked && anySourceChecked) {
            const sourceValues = sourceRoute
                .filter((item) => item.checked)
                .map((item) => item.value);
            baseConditions.push({
                columnName: "UtmSource",
                operator: "IN",
                value: "",
                extendValues: sourceValues,
            });
        }

        if (stageSelected && stageSelected.length > 0) {
            baseConditions.push({
                columnName: "StageId",
                operator: "IN",
                value: "",
                extendValues: stageSelected,
            });
        }

        // Build hourFrame
        const hourFrame = timeFrameEnabled
            ? weekdays
                  .filter((day) => day.checked)
                  .map((day) => ({
                      timeStart: `${
                          startTime.hour < 10
                              ? "0" + startTime.hour
                              : startTime.hour
                      }:${
                          startTime.minute < 10
                              ? "0" + startTime.minute
                              : startTime.minute
                      }`,
                      timeEnd: `${
                          endTime.hour < 10 ? "0" + endTime.hour : endTime.hour
                      }:${
                          endTime.minute < 10
                              ? "0" + endTime.minute
                              : endTime.minute
                      }`,
                      day: reverseDayMapping[day.value],
                  }))
            : [];

        // Build notifications
        const notifications = reminderEnabled
            ? reminderTimes.map((item) => {
                  const hours = Math.floor(item.time.hour);
                  const minutes = item.time.minute;
                  return {
                      time: `${hours < 10 ? "0" + hours : hours}:${
                          minutes < 10 ? "0" + minutes : minutes
                      }`,
                  };
              })
            : [];

        // Build stages
        const stages =
            hasStageUpdate && stageToUpdate.length > 0
                ? stageToUpdate.map((stageId) => ({ stageId }))
                : [{ stageId: "00000000-0000-0000-0000-000000000000" }];

        // Title & description
        const durationParts = [];
        if (timeRule.hour > 0) durationParts.push(`${timeRule.hour} giờ`);
        if (timeRule.minute > 0) durationParts.push(`${timeRule.minute} phút`);
        const durationText = durationParts.join(" ") || "0 phút";

        let title = "Phân phối khách hàng";
        if (selectedAutomationType === "deal")
            title = `Phân phối Deals sau ${durationText}`;
        else if (selectedAutomationType === "lead")
            title = `Phân phối Lead sau ${durationText}`;
        else if (selectedAutomationType === "customer")
            title = `Phân phối Khách hàng sau ${durationText}`;

        const isEmptyScopeSelection =
            !selectedScope ||
            !Array.isArray(selectedScopeTargets) ||
            selectedScopeTargets.length === 0;

        let finalScope = isEmptyScopeSelection ? "organization" : selectedScope;
        let finalScopeTargets = isEmptyScopeSelection
            ? [params.orgId]
            : Array.isArray(selectedScopeTargets)
            ? selectedScopeTargets
            : [];

        // Force organization scope if rule is explicitly ORGANIZATION
        if (rule === "ORGANIZATION") {
            finalScope = "organization";
            finalScopeTargets = [params.orgId];
        }

        const requestData = {
            title,
            description: "",
            category: selectedAutomationType,
            scope: finalScope,
            scopeTargets: finalScopeTargets,
            condition: {
                conjunction: "or",
                conditions: [
                    {
                        conjunction: "and",
                        conditions: baseConditions,
                    },
                ],
            },
            duration: durationInMinutes,
            hourFrame,
            notifications,
            notificationMessage: reminderEnabled ? reminderMessage : "",
            stages,
            maxAttempts: maxAttemptsEnabled ? maxAttempts : undefined,
            // Chỉ gửi distributionTargets và defaultWeight khi tạo mới
            ...(editMode
                ? {}
                : {
                      defaultWeight: 0,
                      distributionTargets,
                  }),
        };

        ToastPromise(async () => {
            try {
                let response;
                if (editMode && ruleData) {
                    // Update main rule info
                    response = await updateAssignRatioV2(
                        params.orgId,
                        ruleData.id,
                        requestData
                    );

                    // If successful, update distribution targets separately
                    if (response?.code === 0) {
                        try {
                            await updateDistributionTargetV2(
                                params.orgId,
                                ruleData.id,
                                { distributionTargets }
                            );
                        } catch (targetError) {
                            console.error(
                                "Error updating targets:",
                                targetError
                            );
                            // Optional: warn user that only part succeeded
                            // But usually we treat it as success or minor error
                        }
                    }
                } else {
                    response = await createAssignRatioV2(
                        params.orgId,
                        requestData
                    );
                }

                if (response.code === 0) {
                    toast.success(
                        editMode
                            ? "Đã cập nhật kịch bản phân phối khách hàng thành công!"
                            : "Đã tạo kịch bản phân phối khách hàng thành công!"
                    );
                    setOpen(false);

                    if (onSuccess) {
                        onSuccess();
                    }
                    return true;
                } else {
                    toast.error(
                        response?.message ||
                            `Có lỗi xảy ra khi ${
                                editMode ? "cập nhật" : "tạo"
                            } kịch bản phân phối khách hàng!`
                    );
                    return false;
                }
            } catch (error) {
                console.error(
                    `Error ${
                        editMode ? "updating" : "creating"
                    } assign ratio rule:`,
                    error
                );
                toast.error(
                    `Có lỗi xảy ra khi ${
                        editMode ? "cập nhật" : "tạo"
                    } kịch bản phân phối khách hàng!`
                );
                return false;
            } finally {
                setIsSubmitting(false);
            }
        });
    }, [
        selectedAutomationType,
        selectedWorkspaceId,
        timeFrameEnabled,
        startTime,
        endTime,
        weekdays,
        categoryRoute,
        sourceRoute,
        stageSelected,
        timeRule,
        rule,
        assignTeam,
        reminderEnabled,
        reminderTimes,
        reminderMessage,
        hasStageUpdate,
        stageToUpdate,
        maxAttemptsEnabled,
        maxAttempts,
        selectedScope,
        selectedScopeTargets,
        distributionTargets,
        editMode,
        ruleData,
        onSuccess,
        setOpen,
        setIsSubmitting,
        params.orgId,
    ]);

    return { handleSubmit };
}

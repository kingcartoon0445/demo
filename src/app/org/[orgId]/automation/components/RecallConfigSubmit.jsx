"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { createEvictionRuleV2, updateEvictionRuleV2 } from "@/api/automationV2";
import { ToastPromise } from "@/components/toast";
import toast from "react-hot-toast";

export default function useRecallConfigSubmit({
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
}) {
    const params = useParams();

    const handleSubmit = useCallback(() => {
        // Use validation from RecallConfigContent
        if (typeof window !== "undefined" && window.validateRecallConfig) {
            const isValid = window.validateRecallConfig();
            if (!isValid) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
                return;
            }
        } else {
            // Fallback validation
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

        setIsSubmitting(true);

        // Prepare data
        const allCategoriesChecked = categoryRoute.every(
            (item) => item.checked
        );
        const allSourcesChecked = sourceRoute.every((item) => item.checked);
        const anyCategoryChecked = categoryRoute.some((item) => item.checked);
        const anySourceChecked = sourceRoute.some((item) => item.checked);
        const durationInMinutes = timeRule.hour * 60 + timeRule.minute;

        // Build conditions
        const baseConditions = [
            {
                columnName: "Event",
                operator: "IN",
                value: "",
                extendValues: ["ASSIGN_TO"],
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

        // Build title and description
        const durationParts = [];
        if (timeRule.hour > 0) durationParts.push(`${timeRule.hour} giờ`);
        if (timeRule.minute > 0) durationParts.push(`${timeRule.minute} phút`);
        const durationText = durationParts.join(" ") || "0 phút";

        let title = "Thu hồi khách hàng";
        if (selectedAutomationType === "deal")
            title = `Thu hồi Deals sau ${durationText}`;
        else if (selectedAutomationType === "lead")
            title = `Thu hồi Lead sau ${durationText}`;
        else if (selectedAutomationType === "customer")
            title = `Thu hồi Khách hàng sau ${durationText}`;

        const scopeLabel =
            selectedScope === "member"
                ? "Thành viên"
                : selectedScope === "team"
                ? "Đội sale"
                : selectedScope === "workspace"
                ? "Không gian làm việc"
                : selectedScope === "organization"
                ? "Tổ chức"
                : "Phạm vi";
        const conditionsSummary = [
            stageSelected && stageSelected.length > 0
                ? `Theo trạng thái đã chọn (${stageSelected.length})`
                : "Tất cả trạng thái",
            selectedAutomationType === "deals" && selectedWorkspaceId
                ? "Theo không gian làm việc đã chọn"
                : undefined,
        ]
            .filter(Boolean)
            .join("; ");
        const description = `${scopeLabel}${
            selectedScopeTargets?.length
                ? ` (${selectedScopeTargets.length})`
                : ""
        }${conditionsSummary ? `; ${conditionsSummary}` : ""}`;

        // Prepare request data
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

        // Force organization scope if rule is explicitly ORGANIZATION or scope is organization
        if (selectedScope === "organization") {
            finalScope = "organization";
            finalScopeTargets = [params.orgId];
        }
        const requestData = {
            title,
            description,
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
            hourFrame: hourFrame,
            notifications: notifications,
            rule: rule,
            notificationMessage: reminderEnabled ? reminderMessage : "",
            teamId:
                rule === "ASSIGN_TO" && assignTeam ? assignTeam.id : undefined,
            stages: stages,
            maxAttempts: maxAttemptsEnabled ? maxAttempts : undefined,
        };

        // Submit with ToastPromise
        ToastPromise(async () => {
            try {
                let response;
                if (editMode && ruleData) {
                    response = await updateEvictionRuleV2(
                        params.orgId,
                        ruleData.id,
                        requestData
                    );
                } else {
                    response = await createEvictionRuleV2(
                        params.orgId,
                        requestData
                    );
                }

                if (response.code === 0) {
                    toast.success(
                        editMode
                            ? "Đã cập nhật kịch bản thu hồi lead thành công!"
                            : "Đã tạo kịch bản thu hồi lead thành công!"
                    );
                    setOpen(false);

                    if (onSuccess) {
                        onSuccess();
                        const refreshEvent = new CustomEvent(
                            "refresh-recall-rules"
                        );
                        window.dispatchEvent(refreshEvent);
                    }
                    return true;
                } else {
                    toast.error(
                        response?.message ||
                            `Có lỗi xảy ra khi ${
                                editMode ? "cập nhật" : "tạo"
                            } kịch bản thu hồi lead!`
                    );
                    return false;
                }
            } catch (error) {
                console.error(
                    `Error ${
                        editMode ? "updating" : "creating"
                    } eviction rule:`,
                    error
                );
                toast.error(
                    `Có lỗi xảy ra khi ${
                        editMode ? "cập nhật" : "tạo"
                    } kịch bản thu hồi lead!`
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
        editMode,
        ruleData,
        onSuccess,
        setOpen,
        setIsSubmitting,
        params.orgId,
    ]);

    return { handleSubmit };
}

"use client";

import { useMemo, useState, useEffect } from "react";
import { WorkspaceSelectPopover } from "./WorkspaceSelectPopover";
import { MultiSelectPopover } from "@/components/multi_select_popover";
import { TimeInputPopover } from "@/components/time_input_popover";
import { RuleConfigPopover } from "@/components/rule_config/rule_config_popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { MultiTimeInputPopover } from "./MultiTimeInputPopover";
import { Input as NumberInput } from "@/components/ui/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import StageRecallPopover from "./StageRecallPopover";
import AutomationTypePopover from "./AutomationTypePopover";
import CustomerAssignListDialog from "@/components/customer_assign_list";

import toast from "react-hot-toast";

export default function RecallConfigContent({
    // State
    timeRule,
    setTimeRule,
    categoryRoute,
    setCategoryRoute,
    sourceRoute,
    setSourceRoute,
    stageSelected,
    rule,
    setRule,
    assignTeam,
    setAssignTeam,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    timeFrameEnabled,
    setTimeFrameEnabled,
    reminderEnabled,
    setReminderEnabled,
    maxAttemptsEnabled,
    setMaxAttemptsEnabled,
    maxAttempts,
    setMaxAttempts,
    selectedAutomationType,
    setSelectedAutomationType,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    weekdays,
    setWeekdays,
    reminderTimes,
    setReminderTimes,
    reminderMessage,
    setReminderMessage,
    hasStageUpdate,
    setHasStageUpdate,
    stageToUpdate,
    setStageToUpdate,
    selectedScope,
    setSelectedScope,
    selectedScopeTargets,
    setSelectedScopeTargets,
    selectedMemberName,
    setSelectedMemberName,
    selectedWorkspaceName,
    setSelectedWorkspaceName,
    useAssignRulePopover = false,
    editMode = false,

    // Computed values
    stageOptions,
    workspaceList,
    stageGroups,

    // Helper functions
    getStageNames,
    getStageUpdateNames,
    getTeamName,
    getAutomationTypeLabel,
    handleStageChange,

    // Constants
    reverseDayMapping,

    // Callback for assign ratio config
    onOpenAssignRatioConfig,
}) {
    // Memoized weekday display logic
    const weekdayDisplay = useMemo(() => {
        const checkedDays = weekdays.filter((day) => day.checked);

        if (checkedDays.length === 1) {
            return checkedDays[0].label;
        } else if (checkedDays.length === weekdays.length) {
            return "Mỗi ngày";
        } else if (checkedDays.length === 0) {
            return "Chọn ngày";
        } else {
            return checkedDays.map((day) => day.label).join(", ");
        }
    }, [weekdays]);

    // Memoized category display
    const categoryDisplay = useMemo(() => {
        const allChecked = categoryRoute.every((item) => item.checked);
        const checkedItems = categoryRoute.filter((item) => item.checked);

        if (allChecked) return "Tất cả";
        if (checkedItems.length === 0) return "Chọn phân loại";
        return checkedItems.map((item) => item.label).join(", ");
    }, [categoryRoute]);

    // Memoized source display
    const sourceDisplay = useMemo(() => {
        const allChecked = sourceRoute.every((item) => item.checked);
        const checkedItems = sourceRoute.filter((item) => item.checked);

        if (allChecked) return "Tất cả";
        if (checkedItems.length === 0) return "Chọn nguồn";
        return checkedItems.map((item) => item.label).join(", ");
    }, [sourceRoute]);

    // Memoized reminder times display
    const reminderTimesDisplay = useMemo(() => {
        return reminderTimes.map((item, index) => (
            <span key={item.id}>
                {index > 0 && ", "}
                {item.time.hour} giờ {item.time.minute} phút
            </span>
        ));
    }, [reminderTimes]);
    const [isOpenCustomerAssignListDialog, setIsOpenCustomerAssignListDialog] =
        useState(false);
    const [assignDisplay, setAssignDisplay] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [currentAssignees, setCurrentAssignees] = useState([]);

    // Update assignDisplay when scope data changes
    useEffect(() => {
        if (selectedScope && selectedScopeTargets.length > 0) {
            if (selectedScope === "user" || selectedScope === "member") {
                setAssignDisplay(
                    selectedMemberName ||
                        `Thành viên (${selectedScopeTargets.length} người)`
                );
                return;
            } else if (selectedScope === "team") {
                setAssignDisplay(selectedMemberName || "Đội sale");
                return;
            } else if (selectedScope === "workspace") {
                setAssignDisplay(
                    selectedWorkspaceName || "Không gian làm việc"
                );
                return;
            } else if (selectedScope === "organization") {
                setAssignDisplay("Tổ chức");
                return;
            }
        }

        // Fallback display if no scope selected (init state)
        if (rule === "ORGANIZATION") {
            setAssignDisplay("Tổ chức");
            setCurrentAssignees([]);
            return;
        }

        if (rule === "TEAM") {
            setAssignDisplay("Đội sale của người phụ trách");
            setCurrentAssignees([]);
            return;
        }

        if (rule === "ASSIGN_TO" && assignTeam) {
            setAssignDisplay(`Đội sale ${assignTeam.name}`);
            return;
        }

        if (rule === "ASSIGN_MEMBER" && selectedMemberName) {
            setAssignDisplay(selectedMemberName);
            return;
        }

        if (rule === "ASSIGN_WORKSPACE" && selectedWorkspaceName) {
            setAssignDisplay(selectedWorkspaceName);
            return;
        }

        setAssignDisplay(
            selectedAutomationType === "deal"
                ? "Đội sale, thành viên hoặc không gian làm việc"
                : "Đội sale hoặc thành viên"
        );
        setCurrentAssignees([]);
    }, [
        selectedScope,
        selectedScopeTargets,
        selectedMemberName,
        selectedWorkspaceName,
        selectedAutomationType,
        rule,
        assignTeam,
    ]);

    // Hydrate currentAssignees from API-loaded IDs so dialog can pre-check items
    useEffect(() => {
        if (
            Array.isArray(selectedScopeTargets) &&
            selectedScopeTargets.length > 0 &&
            currentAssignees.length === 0
        ) {
            if (selectedScope === "user" || selectedScope === "member") {
                setCurrentAssignees(
                    selectedScopeTargets.map((id) => ({ profileId: id }))
                );
            } else if (selectedScope === "team") {
                setCurrentAssignees(selectedScopeTargets.map((id) => ({ id })));
            } else if (selectedScope === "workspace") {
                setCurrentAssignees(
                    selectedScopeTargets.map((id) => ({ id, workspaceId: id }))
                );
            }
        }
    }, [selectedScope, selectedScopeTargets, currentAssignees.length]);

    const handleScopeSelection = (payload) => {
        if (!payload) return;
        if (payload.type === "members") {
            const names = (payload.members || []).map((m) => m.fullName);
            setAssignDisplay(
                names.length > 0
                    ? `Thành viên ${names.join(", ")}`
                    : "Đội sale hoặc thành viên"
            );
            setSelectedScope("user");
            setSelectedScopeTargets(
                (payload.members || []).map((m) => m.profileId)
            );
            setCurrentAssignees(payload.members || []);
            if (typeof setSelectedMemberName === "function") {
                setSelectedMemberName(`Thành viên ${names.join(", ")}`);
            }
        } else if (payload.type === "member") {
            setAssignDisplay(
                payload.member?.fullName
                    ? `Thành viên ${payload.member.fullName}`
                    : "Đội sale hoặc thành viên"
            );
            setSelectedScope("member");
            setSelectedScopeTargets([payload.member?.profileId]);
            setCurrentAssignees([payload.member]);
            if (typeof setSelectedMemberName === "function") {
                setSelectedMemberName(`Thành viên ${payload.member?.fullName}`);
            }
        } else if (payload.type === "teams") {
            const teamNames = (payload.teams || []).map((t) => t.name);
            const teamDisplay =
                teamNames.length > 0
                    ? `Đội sale ${teamNames.join(", ")}`
                    : "Đội sale hoặc thành viên";
            setAssignDisplay(teamDisplay);
            setSelectedScope("team");
            setSelectedScopeTargets((payload.teams || []).map((t) => t.id));
            setCurrentAssignees(payload.teams || []);
            if (typeof setSelectedMemberName === "function") {
                setSelectedMemberName(teamDisplay);
            }
        } else if (payload.type === "team") {
            const teamName = payload.team?.name
                ? `Đội sale ${payload.team.name}`
                : "Đội sale hoặc thành viên";
            setAssignDisplay(teamName);
            setSelectedScope("team");
            setSelectedScopeTargets([payload.team?.id]);
            setCurrentAssignees([payload.team]);
            if (typeof setSelectedMemberName === "function") {
                setSelectedMemberName(teamName);
            }
        } else if (payload.type === "workspace") {
            const workspaceName = payload.workspace?.name
                ? `Không gian làm việc ${payload.workspace.name}`
                : "Đội sale hoặc thành viên";
            setAssignDisplay(workspaceName);
            setSelectedScope("workspace");
            setSelectedScopeTargets([
                payload.workspace?.workspaceId || payload.workspace?.id,
            ]);
            setCurrentAssignees([payload.workspace]);
            if (typeof setSelectedWorkspaceName === "function") {
                setSelectedWorkspaceName(workspaceName);
            }
        }
    };

    const handleAssignSelected = (payload) => {
        if (!payload) return;
        if (payload.type === "members") {
            const names = (payload.members || []).map((m) => m.fullName);
            setAssignDisplay(
                names.length > 0
                    ? `Thành viên ${names.join(", ")}`
                    : "Đội sale hoặc thành viên"
            );
            setSelectedScope("user");
            setSelectedScopeTargets(
                (payload.members || []).map((m) => m.profileId)
            );
            setCurrentAssignees(payload.members || []);
            if (typeof setSelectedMemberName === "function") {
                setSelectedMemberName(`Thành viên ${names.join(", ")}`);
            }
        } else if (payload.type === "member") {
            setAssignDisplay(
                payload.member?.fullName
                    ? `Thành viên ${payload.member.fullName}`
                    : "Đội sale hoặc thành viên"
            );
            setSelectedScope("member");
            setSelectedScopeTargets([payload.member?.profileId]);
            setCurrentAssignees([payload.member]);
            if (typeof setSelectedMemberName === "function") {
                setSelectedMemberName(`Thành viên ${payload.member?.fullName}`);
            }
        } else if (payload.type === "team") {
            setAssignDisplay(
                payload.team?.name
                    ? `Đội sale ${payload.team.name}`
                    : "Đội sale hoặc thành viên"
            );
            setSelectedScope("team");
            setSelectedScopeTargets([payload.team?.id]);
            setCurrentAssignees([payload.team]);
            setRule("ASSIGN_TO");
            setAssignTeam(payload.team);
        } else if (payload.type === "workspace") {
            setAssignDisplay(
                payload.workspace?.name
                    ? `Không gian làm việc ${payload.workspace.name}`
                    : "Đội sale hoặc thành viên"
            );
            setSelectedScope("workspace");
            setSelectedScopeTargets([
                payload.workspace?.workspaceId || payload.workspace?.id,
            ]);
            setCurrentAssignees([payload.workspace]);
            if (typeof setSelectedWorkspaceName === "function") {
                setSelectedWorkspaceName(
                    `Không gian làm việc ${payload.workspace?.name}`
                );
            }
        }
    };

    // Validation function
    const validateForm = () => {
        const errors = {};

        // Validate automation type
        if (!selectedAutomationType) {
            errors.automationType = "Vui lòng chọn nơi áp dụng";
        }

        // Validate workspace for deals
        if (selectedAutomationType === "deal" && !selectedWorkspaceId) {
            errors.workspace = "Vui lòng chọn không gian làm việc";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Expose validation function to parent
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.validateRecallConfig = validateForm;
        }
    }, [selectedAutomationType, selectedWorkspaceId]);

    return (
        <div className="flex flex-col w-full">
            <div className="w-full flex flex-col text-title">
                <div className="text-base leading-7">
                    Nơi áp dụng{" "}
                    <AutomationTypePopover
                        selectedAutomationType={selectedAutomationType}
                        setSelectedAutomationType={(type) => {
                            setSelectedAutomationType(type);
                            // Clear validation error when user selects
                            if (validationErrors.automationType) {
                                setValidationErrors((prev) => ({
                                    ...prev,
                                    automationType: null,
                                }));
                            }
                        }}
                        disabled={editMode}
                    >
                        <span
                            className={`cursor-pointer font-bold ${
                                validationErrors.automationType
                                    ? "text-red-500"
                                    : "text-primary"
                            }`}
                        >
                            {getAutomationTypeLabel()}
                        </span>
                    </AutomationTypePopover>
                    {validationErrors.automationType && (
                        <span className="text-red-500 text-sm ml-2">
                            {validationErrors.automationType}
                        </span>
                    )}
                    {selectedAutomationType === "deal" ? (
                        <>
                            <br />
                            Tại không gian làm việc{" "}
                            <WorkspaceSelectPopover
                                workspaceList={workspaceList}
                                selectedId={selectedWorkspaceId}
                                setSelectedId={(id) => {
                                    setSelectedWorkspaceId(id);
                                    // Clear validation error when user selects
                                    if (validationErrors.workspace) {
                                        setValidationErrors((prev) => ({
                                            ...prev,
                                            workspace: null,
                                        }));
                                    }
                                }}
                            >
                                <span
                                    className={`cursor-pointer font-bold ${
                                        validationErrors.workspace
                                            ? "text-red-500"
                                            : "text-primary"
                                    }`}
                                >
                                    {selectedWorkspaceId
                                        ? workspaceList.find(
                                              (ws) =>
                                                  ws.id === selectedWorkspaceId
                                          )?.name
                                        : "Chọn không gian làm việc"}
                                </span>
                            </WorkspaceSelectPopover>
                            {validationErrors.workspace && (
                                <span className="text-red-500 text-sm ml-2">
                                    {validationErrors.workspace}
                                </span>
                            )}
                            {useAssignRulePopover && (
                                <>
                                    {" và phạm vi "}
                                    <RuleConfigPopover
                                        rule={rule}
                                        setRule={setRule}
                                        assignTeam={assignTeam}
                                        setAssignTeam={setAssignTeam}
                                        selectedAutomationType={
                                            selectedAutomationType
                                        }
                                        availableRules={["TEAM", "ASSIGN_TO"]}
                                        onMemberSelect={(payload) =>
                                            handleAssignSelected(payload)
                                        }
                                        onWorkspaceSelect={(payload) =>
                                            handleAssignSelected(payload)
                                        }
                                        onTeamSelect={(team) =>
                                            handleAssignSelected({
                                                type: "team",
                                                team,
                                            })
                                        }
                                        isAssignRatioMode={true}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {getTeamName()}
                                        </span>
                                    </RuleConfigPopover>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <br />
                            {useAssignRulePopover ? (
                                <>
                                    Phạm vi{" "}
                                    <RuleConfigPopover
                                        rule={rule}
                                        setRule={setRule}
                                        assignTeam={assignTeam}
                                        setAssignTeam={setAssignTeam}
                                        selectedAutomationType={
                                            selectedAutomationType
                                        }
                                        // Ở AssignRatioDialog: chỉ cho phép chọn Tổ chức hoặc Đội sale cụ thể,
                                        // ẩn option "Chỉ định thành viên cụ thể"
                                        availableRules={
                                            selectedAutomationType === "deal"
                                                ? undefined
                                                : ["TEAM", "ASSIGN_TO"]
                                        }
                                        onMemberSelect={(payload) =>
                                            handleAssignSelected({
                                                type: "member",
                                                member: payload?.member,
                                            })
                                        }
                                        onWorkspaceSelect={(payload) =>
                                            handleAssignSelected({
                                                type: "workspace",
                                                workspace: payload?.workspace,
                                            })
                                        }
                                        onTeamSelect={(team) =>
                                            handleAssignSelected({
                                                type: "team",
                                                team,
                                            })
                                        }
                                        isAssignRatioMode={true}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {getTeamName()}
                                        </span>
                                    </RuleConfigPopover>
                                </>
                            ) : (
                                <>
                                    Kích hoạt trên{" "}
                                    <span
                                        className="cursor-pointer text-primary font-bold"
                                        onClick={() =>
                                            setIsOpenCustomerAssignListDialog(
                                                true
                                            )
                                        }
                                    >
                                        {assignDisplay ||
                                            (selectedAutomationType === "deal"
                                                ? "Đội sale, thành viên hoặc không gian làm việc"
                                                : "Đội sale hoặc thành viên")}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                    <br />
                    {useAssignRulePopover
                        ? selectedAutomationType === "deal"
                            ? "nếu có phát sinh giao dịch"
                            : "Nếu có phát sinh cơ hội đủ điều kiện:"
                        : "nếu người phụ trách tiếp nhận khách hàng"}
                    <br />
                    {selectedAutomationType !== "deal" && (
                        <>
                            Thuộc phân loại{" "}
                            <MultiSelectPopover
                                dataList={categoryRoute}
                                setDataList={setCategoryRoute}
                            >
                                <span className="cursor-pointer text-primary font-bold">
                                    {categoryDisplay}
                                </span>
                            </MultiSelectPopover>{" "}
                            <br />
                            {useAssignRulePopover ? "Nguồn " : "và nguồn "}
                            <MultiSelectPopover
                                dataList={sourceRoute}
                                setDataList={setSourceRoute}
                            >
                                <span className="cursor-pointer text-primary font-bold">
                                    {sourceDisplay}
                                </span>
                            </MultiSelectPopover>
                            <br />
                            {useAssignRulePopover
                                ? "Trạng thái "
                                : "và trạng thái "}
                        </>
                    )}
                    {selectedAutomationType === "deal" && <>thuộc giai đoạn </>}
                    <span className="inline-block">
                        <MultiSelect
                            options={stageOptions}
                            selected={stageSelected}
                            onChange={handleStageChange}
                            textClassName="text-base text-wrap"
                            className="inline-flex h-auto p-0 m-0 min-h-0 border-0 bg-transparent"
                            buttonClassName="h-auto min-h-0 p-0 bg-transparent font-bold border-0 text-primary hover:bg-transparent hover:text-primary hover:opacity-80 shadow-none mt-0"
                            hideChevron={true}
                            hideBadges={true}
                            placeholder={getStageNames()}
                        />
                    </span>
                    {useAssignRulePopover &&
                        selectedAutomationType === "deal" &&
                        " thì"}
                    <br />
                    {useAssignRulePopover && selectedAutomationType !== "deal"
                        ? "thì sau "
                        : "Sau "}
                    <TimeInputPopover time={timeRule} setTime={setTimeRule}>
                        <span className="cursor-pointer text-primary font-bold">
                            {timeRule.hour} giờ {timeRule.minute} phút
                        </span>
                    </TimeInputPopover>
                    <br />
                    {!useAssignRulePopover && (
                        <StageRecallPopover
                            stageGroups={stageGroups}
                            stageOptions={stageOptions}
                            hasStageUpdate={hasStageUpdate}
                            setHasStageUpdate={setHasStageUpdate}
                            selectedStage={stageToUpdate}
                            setSelectedStage={setStageToUpdate}
                        >
                            <span className="cursor-pointer text-primary font-bold">
                                {hasStageUpdate && stageToUpdate.length > 0
                                    ? "chuyển trạng thái chăm sóc sang " +
                                      getStageUpdateNames()
                                    : "không cập nhật trạng thái chăm sóc"}
                            </span>
                        </StageRecallPopover>
                    )}
                    {!useAssignRulePopover && (
                        <>
                            <br />
                            chuyển khách hàng đó về{" "}
                            <RuleConfigPopover
                                rule={rule}
                                setRule={setRule}
                                assignTeam={assignTeam}
                                setAssignTeam={setAssignTeam}
                                selectedAutomationType={selectedAutomationType}
                                onMemberSelect={(payload) => {
                                    handleAssignSelected(payload);
                                }}
                                onWorkspaceSelect={(payload) => {
                                    handleAssignSelected(payload);
                                }}
                            >
                                <span className="cursor-pointer text-primary font-bold">
                                    {getTeamName()}
                                </span>
                            </RuleConfigPopover>
                        </>
                    )}
                    {useAssignRulePopover && (
                        <>
                            sẽ được phân phối theo{" "}
                            <span
                                className="cursor-pointer text-primary font-bold"
                                onClick={() => {
                                    if (
                                        selectedAutomationType === "deal" &&
                                        !selectedWorkspaceId
                                    ) {
                                        setValidationErrors((prev) => ({
                                            ...prev,
                                            workspace:
                                                "Vui lòng chọn không gian làm việc",
                                        }));
                                        toast.error(
                                            "Vui lòng chọn không gian làm việc"
                                        );
                                        return;
                                    }
                                    if (onOpenAssignRatioConfig) {
                                        onOpenAssignRatioConfig();
                                    }
                                }}
                            >
                                cấu hình tỷ lệ
                            </span>
                        </>
                    )}
                </div>

                <div className="mt-2 flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="timeframe"
                            checked={timeFrameEnabled}
                            onCheckedChange={setTimeFrameEnabled}
                        />
                        <label
                            htmlFor="timeframe"
                            className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Khung giờ áp dụng
                        </label>
                    </div>

                    {timeFrameEnabled && (
                        <div className="">
                            <div className="text-base leading-7">
                                Từ{" "}
                                <TimeInputPopover
                                    maxHour={23}
                                    time={startTime}
                                    setTime={setStartTime}
                                >
                                    <span className="cursor-pointer text-primary font-bold">
                                        {startTime.hour < 10
                                            ? `0${startTime.hour}`
                                            : startTime.hour}
                                        :
                                        {startTime.minute < 10
                                            ? `0${startTime.minute}`
                                            : startTime.minute}
                                    </span>
                                </TimeInputPopover>{" "}
                                đến{" "}
                                <TimeInputPopover
                                    maxHour={23}
                                    time={endTime}
                                    setTime={setEndTime}
                                >
                                    <span className="cursor-pointer text-primary font-bold">
                                        {endTime.hour < 10
                                            ? `0${endTime.hour}`
                                            : endTime.hour}
                                        :
                                        {endTime.minute < 10
                                            ? `0${endTime.minute}`
                                            : endTime.minute}
                                    </span>
                                </TimeInputPopover>{" "}
                                vào{" "}
                                <MultiSelectPopover
                                    dataList={weekdays}
                                    setDataList={setWeekdays}
                                >
                                    <span className="cursor-pointer text-primary font-bold">
                                        {weekdayDisplay}
                                    </span>
                                </MultiSelectPopover>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="reminder"
                            checked={reminderEnabled}
                            onCheckedChange={setReminderEnabled}
                        />
                        <label
                            htmlFor="reminder"
                            className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Thông báo nhắc hẹn
                        </label>
                    </div>

                    {reminderEnabled && (
                        <div className="">
                            <div className="text-base">
                                <MultiTimeInputPopover
                                    times={reminderTimes}
                                    setTimes={setReminderTimes}
                                >
                                    <span className="cursor-pointer text-primary font-bold">
                                        {reminderTimesDisplay}
                                    </span>
                                </MultiTimeInputPopover>
                                <br />
                                trước khi khách hàng bị chuyển đi, gửi thông báo
                                tới người phụ trách với nội dung:
                            </div>
                            <div className="mt-2">
                                <textarea
                                    value={reminderMessage}
                                    onChange={(e) =>
                                        setReminderMessage(e.target.value)
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    rows={3}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Sử dụng {"{time_left}"} để hiển thị thời
                                    gian còn lại trước khi khách hàng bị chuyển
                                    đi.
                                </div>
                            </div>
                        </div>
                    )}

                    {!useAssignRulePopover && (
                        <>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="maxAttempts"
                                    checked={maxAttemptsEnabled}
                                    onCheckedChange={setMaxAttemptsEnabled}
                                />
                                <label
                                    htmlFor="maxAttempts"
                                    className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Giới hạn số lần thu hồi cho cùng một khách
                                    hàng
                                </label>
                            </div>

                            {maxAttemptsEnabled && (
                                <div className="flex items-center gap-2">
                                    <NumberInput
                                        value={maxAttempts}
                                        onChange={setMaxAttempts}
                                        min={0}
                                        size="small"
                                    />
                                </div>
                            )}
                        </>
                    )}
                    {isOpenCustomerAssignListDialog && (
                        <CustomerAssignListDialog
                            open={isOpenCustomerAssignListDialog}
                            setOpen={setIsOpenCustomerAssignListDialog}
                            mode="select"
                            onSelected={handleScopeSelection}
                            showWorkspaceTab={selectedAutomationType === "deal"}
                            defaultAssignees={currentAssignees}
                            singleSelect={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

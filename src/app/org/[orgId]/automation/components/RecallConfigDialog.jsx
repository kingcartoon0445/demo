"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EvictionLogHistory from "./EvictionLogHistory";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";

// Custom hooks and components
import RecallConfigForm from "./RecallConfigForm";
import RecallConfigContent from "./RecallConfigContent";
import useRecallConfigSubmit from "./RecallConfigSubmit";
import AutomationTypePopover from "./AutomationTypePopover";

export default function RecallConfigDialog({
    open,
    setOpen,
    editMode = false,
    ruleData = null,
    onSuccess = null,
}) {
    const params = useParams();
    const [activeTab, setActiveTab] = useState("config");

    // Use custom hook for form state management
    const formState = RecallConfigForm({
        editMode,
        ruleData,
        onSuccess,
    });

    // Use custom hook for submit logic
    const { handleSubmit } = useRecallConfigSubmit({
        editMode,
        ruleData,
        onSuccess,
        setOpen,
        ...formState,
    });

    // Handle tab change
    const handleTabChange = useCallback((value) => {
        setActiveTab(value);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="grid sm:max-w-xl h-auto pt-4 transition-all gap-0"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-medium text-[20px] text-title flex items-center justify-between mb-3">
                        <span>Cấu hình kịch bản thu hồi</span>
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>

                {editMode && ruleData && (
                    <Tabs
                        defaultValue="config"
                        className="w-full"
                        onValueChange={handleTabChange}
                    >
                        <TabsList className="grid grid-cols-2 w-full mb-4">
                            <TabsTrigger value="config">Cấu hình</TabsTrigger>
                            <TabsTrigger value="history">Lịch sử</TabsTrigger>
                        </TabsList>

                        <TabsContent value="config">
                            <div className="flex flex-col">
                                <div className="flex flex-col w-full">
                                    <div className="w-full flex flex-col text-title">
                                        <div className="text-base leading-7">
                                            Tại không gian làm việc{" "}
                                            <WorkspaceSelectPopover
                                                workspaceList={workspaceList}
                                                selectedId={selectedWorkspaceId}
                                                setSelectedId={
                                                    setSelectedWorkspaceId
                                                }
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {selectedWorkspaceId
                                                        ? workspaceList.find(
                                                              (ws) =>
                                                                  ws.id ===
                                                                  selectedWorkspaceId
                                                          )?.name
                                                        : "Chọn không gian làm việc"}
                                                </span>
                                            </WorkspaceSelectPopover>
                                            <br />
                                            nếu người phụ trách tiếp nhận khách
                                            hàng
                                            <br />
                                            thuộc phân loại{" "}
                                            <MultiSelectPopover
                                                dataList={categoryRoute}
                                                setDataList={setCategoryRoute}
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {categoryRoute.every(
                                                        (item) => item.checked
                                                    )
                                                        ? "Tất cả"
                                                        : categoryRoute.filter(
                                                              (item) =>
                                                                  item.checked
                                                          ).length === 0
                                                        ? "Chọn phân loại"
                                                        : categoryRoute
                                                              .filter(
                                                                  (item) =>
                                                                      item.checked
                                                              )
                                                              .map(
                                                                  (item) =>
                                                                      item.label
                                                              )
                                                              .join(", ")}
                                                </span>
                                            </MultiSelectPopover>{" "}
                                            <br />
                                            và nguồn{" "}
                                            <MultiSelectPopover
                                                dataList={sourceRoute}
                                                setDataList={setSourceRoute}
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {sourceRoute.every(
                                                        (item) => item.checked
                                                    )
                                                        ? "Tất cả"
                                                        : sourceRoute.filter(
                                                              (item) =>
                                                                  item.checked
                                                          ).length === 0
                                                        ? "Chọn nguồn"
                                                        : sourceRoute
                                                              .filter(
                                                                  (item) =>
                                                                      item.checked
                                                              )
                                                              .map(
                                                                  (item) =>
                                                                      item.label
                                                              )
                                                              .join(", ")}
                                                </span>
                                            </MultiSelectPopover>
                                            <br />
                                            và trạng thái{" "}
                                            <span className="inline-block">
                                                <MultiSelect
                                                    options={stageGroups.flatMap(
                                                        (group) =>
                                                            group.stages.map(
                                                                (stage) => ({
                                                                    value: stage.id,
                                                                    label: stage.name,
                                                                    labelGroup:
                                                                        group.name,
                                                                    hexCode:
                                                                        group.hexCode,
                                                                })
                                                            )
                                                    )}
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
                                            <br />
                                            Sau{" "}
                                            <TimeInputPopover
                                                time={timeRule}
                                                setTime={setTimeRule}
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {timeRule.hour} giờ{" "}
                                                    {timeRule.minute} phút
                                                </span>
                                            </TimeInputPopover>
                                            <br />
                                            <StageRecallPopover
                                                stageGroups={stageGroups}
                                                hasStageUpdate={hasStageUpdate}
                                                setHasStageUpdate={
                                                    setHasStageUpdate
                                                }
                                                selectedStage={stageToUpdate}
                                                setSelectedStage={
                                                    setStageToUpdate
                                                }
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {hasStageUpdate &&
                                                    stageToUpdate.length > 0
                                                        ? "chuyển trạng thái chăm sóc sang " +
                                                          getStageUpdateNames()
                                                        : "không cập nhật trạng thái chăm sóc"}
                                                </span>
                                            </StageRecallPopover>
                                            <br />
                                            chuyển khách hàng đó về{" "}
                                            <RuleConfigPopover
                                                rule={rule}
                                                setRule={setRule}
                                                assignTeam={assignTeam}
                                                setAssignTeam={setAssignTeam}
                                                // hideAssignTo={true}
                                                // availableRules={["TEAM", "WORKSPACE"]}
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {rule === "TEAM"
                                                        ? "Đội sale của người phụ trách"
                                                        : rule === "WORKSPACE"
                                                        ? "Không gian làm việc"
                                                        : rule ===
                                                              "ASSIGN_TO" &&
                                                          assignTeam
                                                        ? assignTeam.name
                                                        : "Đội sale của người phụ trách"}
                                                </span>
                                            </RuleConfigPopover>
                                        </div>

                                        <div className="mt-2 flex flex-col gap-3">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="timeframe"
                                                    checked={timeFrameEnabled}
                                                    onCheckedChange={
                                                        setTimeFrameEnabled
                                                    }
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
                                                            setTime={
                                                                setStartTime
                                                            }
                                                        >
                                                            <span className="cursor-pointer text-primary font-bold">
                                                                {startTime.hour <
                                                                10
                                                                    ? `0${startTime.hour}`
                                                                    : startTime.hour}
                                                                :
                                                                {startTime.minute <
                                                                10
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
                                                                {endTime.hour <
                                                                10
                                                                    ? `0${endTime.hour}`
                                                                    : endTime.hour}
                                                                :
                                                                {endTime.minute <
                                                                10
                                                                    ? `0${endTime.minute}`
                                                                    : endTime.minute}
                                                            </span>
                                                        </TimeInputPopover>{" "}
                                                        vào{" "}
                                                        <MultiSelectPopover
                                                            dataList={weekdays}
                                                            setDataList={
                                                                setWeekdays
                                                            }
                                                        >
                                                            <span className="cursor-pointer text-primary font-bold">
                                                                {weekdays.filter(
                                                                    (day) =>
                                                                        day.checked
                                                                ).length === 1
                                                                    ? weekdays.find(
                                                                          (
                                                                              day
                                                                          ) =>
                                                                              day.checked
                                                                      )?.label
                                                                    : weekdays.filter(
                                                                          (
                                                                              day
                                                                          ) =>
                                                                              day.checked
                                                                      )
                                                                          .length ===
                                                                      weekdays.length
                                                                    ? "Mỗi ngày"
                                                                    : weekdays.filter(
                                                                          (
                                                                              day
                                                                          ) =>
                                                                              day.checked
                                                                      )
                                                                          .length ===
                                                                      0
                                                                    ? "Chọn ngày"
                                                                    : weekdays
                                                                          .filter(
                                                                              (
                                                                                  day
                                                                              ) =>
                                                                                  day.checked
                                                                          )
                                                                          .map(
                                                                              (
                                                                                  day
                                                                              ) =>
                                                                                  day.label
                                                                          )
                                                                          .join(
                                                                              ", "
                                                                          )}
                                                            </span>
                                                        </MultiSelectPopover>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="reminder"
                                                    checked={reminderEnabled}
                                                    onCheckedChange={
                                                        setReminderEnabled
                                                    }
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
                                                            times={
                                                                reminderTimes
                                                            }
                                                            setTimes={
                                                                setReminderTimes
                                                            }
                                                        >
                                                            <span className="cursor-pointer text-primary font-bold">
                                                                {reminderTimes.map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                item.id
                                                                            }
                                                                        >
                                                                            {index >
                                                                                0 &&
                                                                                ", "}
                                                                            {
                                                                                item
                                                                                    .time
                                                                                    .hour
                                                                            }{" "}
                                                                            giờ{" "}
                                                                            {
                                                                                item
                                                                                    .time
                                                                                    .minute
                                                                            }{" "}
                                                                            phút
                                                                        </span>
                                                                    )
                                                                )}
                                                            </span>
                                                        </MultiTimeInputPopover>
                                                        <br />
                                                        trước khi khách hàng bị
                                                        chuyển đi, gửi thông báo
                                                        tới người phụ trách với
                                                        nội dung:
                                                    </div>
                                                    <div className="mt-2">
                                                        <textarea
                                                            value={
                                                                reminderMessage
                                                            }
                                                            onChange={(e) =>
                                                                setReminderMessage(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                            rows={3}
                                                        />
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Sử dụng{" "}
                                                            {"{time_left}"} để
                                                            hiển thị thời gian
                                                            còn lại trước khi
                                                            khách hàng bị chuyển
                                                            đi.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="maxAttempts"
                                                    checked={maxAttemptsEnabled}
                                                    onCheckedChange={
                                                        setMaxAttemptsEnabled
                                                    }
                                                />
                                                <label
                                                    htmlFor="maxAttempts"
                                                    className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Giới hạn số lần thu hồi cho
                                                    cùng một khách hàng
                                                </label>
                                            </div>

                                            {maxAttemptsEnabled && (
                                                <div className="flex items-center gap-2">
                                                    <NumberInput
                                                        value={maxAttempts}
                                                        onChange={
                                                            setMaxAttempts
                                                        }
                                                        min={0}
                                                        size="small"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <EvictionLogHistory
                                orgId={params.orgId}
                                ruleId={ruleData.id}
                            />
                        </TabsContent>
                    </Tabs>
                )}

                {(!editMode || !ruleData) && (
                    <div className="flex flex-col pt-4">
                        <div className="flex flex-col w-full">
                            <div className="w-full flex flex-col text-title">
                                <div className="text-base leading-7">
                                    Nơi áp dụng{" "}
                                    <AutomationTypePopover
                                        selectedAutomationType={
                                            selectedAutomationType
                                        }
                                        setSelectedAutomationType={
                                            setSelectedAutomationType
                                        }
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {getAutomationTypeLabel()}
                                        </span>
                                    </AutomationTypePopover>
                                    <br />
                                    Kích hoạt trên{" "}
                                    {selectedAutomationType === "deal" && (
                                        <>
                                            <br />
                                            Tại không gian làm việc{" "}
                                            <WorkspaceSelectPopover
                                                workspaceList={workspaceList}
                                                selectedId={selectedWorkspaceId}
                                                setSelectedId={
                                                    setSelectedWorkspaceId
                                                }
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {selectedWorkspaceId
                                                        ? workspaceList.find(
                                                              (ws) =>
                                                                  ws.id ===
                                                                  selectedWorkspaceId
                                                          )?.name
                                                        : "Chọn không gian làm việc"}
                                                </span>
                                            </WorkspaceSelectPopover>
                                        </>
                                    )}
                                    <br />
                                    nếu người phụ trách tiếp nhận khách hàng
                                    <br />
                                    thuộc phân loại{" "}
                                    <MultiSelectPopover
                                        dataList={categoryRoute}
                                        setDataList={setCategoryRoute}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {categoryRoute.every(
                                                (item) => item.checked
                                            )
                                                ? "Bất kì"
                                                : categoryRoute.filter(
                                                      (item) => item.checked
                                                  ).length === 0
                                                ? "Chọn phân loại"
                                                : categoryRoute
                                                      .filter(
                                                          (item) => item.checked
                                                      )
                                                      .map((item) => item.label)
                                                      .join(", ")}
                                        </span>
                                    </MultiSelectPopover>{" "}
                                    <br />
                                    và nguồn{" "}
                                    <MultiSelectPopover
                                        dataList={sourceRoute}
                                        setDataList={setSourceRoute}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {sourceRoute.every(
                                                (item) => item.checked
                                            )
                                                ? "Bất kì"
                                                : sourceRoute.filter(
                                                      (item) => item.checked
                                                  ).length === 0
                                                ? "Chọn nguồn"
                                                : sourceRoute
                                                      .filter(
                                                          (item) => item.checked
                                                      )
                                                      .map((item) => item.label)
                                                      .join(", ")}
                                        </span>
                                    </MultiSelectPopover>
                                    <br />
                                    và trạng thái{" "}
                                    <span className="inline-block">
                                        <MultiSelect
                                            options={stageGroups.flatMap(
                                                (group) =>
                                                    group.stages.map(
                                                        (stage) => ({
                                                            value: stage.id,
                                                            label: stage.name,
                                                            labelGroup:
                                                                group.name,
                                                            hexCode:
                                                                group.hexCode,
                                                        })
                                                    )
                                            )}
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
                                    <br />
                                    Sau{" "}
                                    <TimeInputPopover
                                        time={timeRule}
                                        setTime={setTimeRule}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {timeRule.hour} giờ{" "}
                                            {timeRule.minute} phút
                                        </span>
                                    </TimeInputPopover>
                                    <br />
                                    <StageRecallPopover
                                        stageGroups={stageGroups}
                                        hasStageUpdate={hasStageUpdate}
                                        setHasStageUpdate={setHasStageUpdate}
                                        selectedStage={stageToUpdate}
                                        setSelectedStage={setStageToUpdate}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {hasStageUpdate &&
                                            stageToUpdate.length > 0
                                                ? "chuyển trạng thái chăm sóc sang " +
                                                  getStageUpdateNames()
                                                : "không cập nhật trạng thái chăm sóc"}
                                        </span>
                                    </StageRecallPopover>
                                    <br />
                                    chuyển khách hàng đó về{" "}
                                    <RuleConfigPopover
                                        rule={rule}
                                        setRule={setRule}
                                        assignTeam={assignTeam}
                                        setAssignTeam={setAssignTeam}
                                        // hideAssignTo={true}
                                        // availableRules={["TEAM", "WORKSPACE"]}
                                    >
                                        <span className="cursor-pointer text-primary font-bold">
                                            {rule === "TEAM"
                                                ? "Đội sale của người phụ trách"
                                                : rule === "WORKSPACE"
                                                ? "Không gian làm việc"
                                                : rule === "ASSIGN_TO" &&
                                                  assignTeam
                                                ? assignTeam.name
                                                : "Đội sale của người phụ trách"}
                                        </span>
                                    </RuleConfigPopover>
                                </div>

                                <div className="mt-2 flex flex-col gap-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="timeframe"
                                            checked={timeFrameEnabled}
                                            onCheckedChange={
                                                setTimeFrameEnabled
                                            }
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
                                                        {weekdays.filter(
                                                            (day) => day.checked
                                                        ).length === 1
                                                            ? weekdays.find(
                                                                  (day) =>
                                                                      day.checked
                                                              )?.label
                                                            : weekdays.filter(
                                                                  (day) =>
                                                                      day.checked
                                                              ).length ===
                                                              weekdays.length
                                                            ? "Mỗi ngày"
                                                            : weekdays.filter(
                                                                  (day) =>
                                                                      day.checked
                                                              ).length === 0
                                                            ? "Chọn ngày"
                                                            : weekdays
                                                                  .filter(
                                                                      (day) =>
                                                                          day.checked
                                                                  )
                                                                  .map(
                                                                      (day) =>
                                                                          day.label
                                                                  )
                                                                  .join(", ")}
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
                                                        {reminderTimes.map(
                                                            (item, index) => (
                                                                <span
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >
                                                                    {index >
                                                                        0 &&
                                                                        ", "}
                                                                    {
                                                                        item
                                                                            .time
                                                                            .hour
                                                                    }{" "}
                                                                    giờ{" "}
                                                                    {
                                                                        item
                                                                            .time
                                                                            .minute
                                                                    }{" "}
                                                                    phút
                                                                </span>
                                                            )
                                                        )}
                                                    </span>
                                                </MultiTimeInputPopover>
                                                <br />
                                                trước khi khách hàng bị chuyển
                                                đi, gửi thông báo tới người phụ
                                                trách với nội dung:
                                            </div>
                                            <div className="mt-2">
                                                <textarea
                                                    value={reminderMessage}
                                                    onChange={(e) =>
                                                        setReminderMessage(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                    rows={3}
                                                />
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Sử dụng {"{time_left}"} để
                                                    hiển thị thời gian còn lại
                                                    trước khi khách hàng bị
                                                    chuyển đi.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="maxAttempts"
                                            checked={maxAttemptsEnabled}
                                            onCheckedChange={
                                                setMaxAttemptsEnabled
                                            }
                                        />
                                        <label
                                            htmlFor="maxAttempts"
                                            className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Giới hạn số lần thu hồi cho cùng một
                                            khách hàng
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-end gap-2 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-[35px] px-6"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                    >
                        Huỷ
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        className="h-[35px] bg-primary text-white hover:bg-primary/90 px-6"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

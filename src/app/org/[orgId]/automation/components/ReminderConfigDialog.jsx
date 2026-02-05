"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IoMdClose } from "react-icons/io";
import { MultiSelectPopover } from "@/components/multi_select_popover";
import { TimeInputPopover } from "@/components/time_input_popover";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { getUtmSourceList } from "@/api/workspace";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { WorkspaceSelectPopover } from "./WorkspaceSelectPopover";
import { useStageStore } from "@/store/stage";
import { MultiSelect } from "@/components/ui/multi-select";
import { MultiTimeInputPopover } from "./MultiTimeInputPopover";
import { Input as NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { ToastPromise } from "@/components/toast";
import { useTeamList } from "@/hooks/team_data";
import { getTeamList } from "@/api/team";
import { getWorkspaceList } from "@/api/workspace";
import {
    createReminderConfig,
    updateReminderConfig,
    getReminderConfigDetail,
} from "@/api/automation";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getTeamListV2 } from "@/api/teamV2";

// Các mẫu dữ liệu
const categoryRouteList = [
    {
        label: "Nhập vào",
        value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82",
        checked: true,
    },
    {
        label: "Form",
        value: "3b70970b-e448-46fa-af8f-6605855a6b52",
        checked: true,
    },
    {
        label: "AIDC",
        value: "38b353c3-ecc8-4c62-be27-229ef47e622d",
        checked: true,
    },
];

const weekdayOptions = [
    { value: "monday", label: "Thứ hai", checked: true },
    { value: "tuesday", label: "Thứ ba", checked: true },
    { value: "wednesday", label: "Thứ tư", checked: true },
    { value: "thursday", label: "Thứ năm", checked: true },
    { value: "friday", label: "Thứ sáu", checked: true },
    { value: "saturday", label: "Thứ bảy", checked: true },
    { value: "sunday", label: "Chủ nhật", checked: true },
];

// Mapping ngày trong tuần giữa API và UI
const dayMapping = {
    T2: "monday",
    T3: "tuesday",
    T4: "wednesday",
    T5: "thursday",
    T6: "friday",
    T7: "saturday",
    CN: "sunday",
};

// Mapping ngược lại
const reverseDayMapping = {
    monday: "T2",
    tuesday: "T3",
    wednesday: "T4",
    thursday: "T5",
    friday: "T6",
    saturday: "T7",
    sunday: "CN",
};

// Component StageUpdatePopover để lựa chọn trạng thái cập nhật
function StageUpdatePopover({
    children,
    stageGroups,
    hasStageUpdate,
    setHasStageUpdate,
    selectedStage,
    setSelectedStage,
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="pl-4">
                <div className="space-y-8 flex items-center">
                    <RadioGroup
                        value={hasStageUpdate}
                        onValueChange={setHasStageUpdate}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={false} id="no-update" />
                            <Label htmlFor="no-update">
                                Không cập nhật trạng thái chăm sóc
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={true} id="update" />
                            <Label htmlFor="update">
                                Chuyển trạng thái chăm sóc sang:
                            </Label>
                        </div>
                    </RadioGroup>

                    {hasStageUpdate && (
                        <div className="pl-6">
                            <MultiSelect
                                options={stageGroups.flatMap((group) =>
                                    group.stages.map((stage) => ({
                                        value: stage.id,
                                        label: stage.name,
                                        labelGroup: group.name,
                                        hexCode: group.hexCode,
                                    })),
                                )}
                                selected={selectedStage}
                                onChange={setSelectedStage}
                                textClassName="text-base"
                                className="inline-flex h-auto p-0 m-0 min-h-0 border-0 bg-transparent"
                                buttonClassName="h-auto min-h-0 p-0 bg-transparent font-bold border-0 !max-w-[400px] text-primary hover:bg-transparent hover:text-primary hover:opacity-80 shadow-none mt-0"
                                placeholder={"Chọn trạng thái"}
                            />
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function ReminderConfigDialog({
    open,
    setOpen,
    editMode = false,
    ruleData = null,
    onSuccess = null,
    canSave = true,
}) {
    const params = useParams();
    const { workspaceList, setWorkspaceList } = useWorkspaceList();
    const { stageGroups, fetchStages } = useStageStore();
    const { teamList, setTeamList } = useTeamList();

    const [timeRule, setTimeRule] = useState({ hour: 0, minute: 5 });
    const [categoryRoute, setCategoryRoute] = useState(categoryRouteList);
    const [sourceRoute, setSourceRoute] = useState([]);
    const [stageSelected, setStageSelected] = useState([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const [timeFrameEnabled, setTimeFrameEnabled] = useState(false);
    const [selectedUtmSources, setSelectedUtmSources] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State cho kịch bản nhắc hẹn
    const [reminderMessage, setReminderMessage] = useState(
        "Bạn vừa tiếp nhận khách hàng {Tên KH}. Vui lòng cập nhật trạng thái chăm sóc!",
    );

    // State cho khung giờ áp dụng
    const [startTime, setStartTime] = useState({ hour: 0, minute: 0 });
    const [endTime, setEndTime] = useState({ hour: 23, minute: 59 });
    const [weekdays, setWeekdays] = useState(weekdayOptions);

    // State cho lặp lại nhắc hẹn
    const [repeatEnabled, setRepeatEnabled] = useState(false);
    const [repeatCount, setRepeatCount] = useState(1);
    const [repeatInterval, setRepeatInterval] = useState({
        hour: 0,
        minute: 5,
    });

    // Tạo tiêu đề dựa trên thời gian
    const getDialogTitle = () => {
        let title = "Thông báo sau ";
        if (timeRule.hour > 0) {
            title += `${timeRule.hour} giờ `;
        }
        title += `${timeRule.minute} phút tiếp nhận khách hàng`;
        return title;
    };

    // Fetch danh sách workspace khi component mount
    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (!params.orgId) return;

            try {
                const response = await getWorkspaceList(params.orgId);
                if (response?.code === 0 && response.content) {
                    setWorkspaceList(response.content);
                } else {
                    console.error(
                        "Error fetching workspace list:",
                        response?.message,
                    );
                    toast.error("Có lỗi khi tải danh sách không gian làm việc");
                }
            } catch (error) {
                console.error("Error fetching workspace list:", error);
                toast.error("Có lỗi khi tải danh sách không gian làm việc");
            }
        };

        // Chỉ fetch nếu workspaceList trống
        if (workspaceList.length === 0) {
            fetchWorkspaces();
        }
    }, [params.orgId, workspaceList.length, setWorkspaceList]);

    // Fetch danh sách team khi selectedWorkspaceId thay đổi
    useEffect(() => {
        if (params.orgId && selectedWorkspaceId) {
            // Fetch danh sách team từ API
            getTeamListV2(params.orgId, {
                workspaceId: selectedWorkspaceId,
                isTree: true,
            }).then((res) => {
                if (res?.code === 0 && res.content) {
                    setTeamList(res.content);
                } else {
                    console.error("Lỗi khi lấy danh sách team:", res?.message);
                    toast.error("Có lỗi khi tải danh sách team");
                }
            });
        }
    }, [params.orgId, selectedWorkspaceId, setTeamList]);

    // Fetch danh sách trạng thái khi orgId và workspaceId thay đổi
    useEffect(() => {
        if (params.orgId && selectedWorkspaceId) {
            fetchStages(params.orgId, selectedWorkspaceId);
        }
    }, [fetchStages, params.orgId, selectedWorkspaceId]);

    // Fetch danh sách nguồn từ API khi workspaceId thay đổi
    useEffect(() => {
        const fetchSources = async () => {
            if (!params.orgId || !selectedWorkspaceId) return;

            try {
                const response = await getUtmSourceList(
                    params.orgId,
                    selectedWorkspaceId,
                );
                if (response?.content) {
                    const apiSources = response.content.map((source) => ({
                        value: source.name,
                        label: source.name,
                        checked: true,
                    }));

                    // Thiết lập lại sourceRoute dựa trên các nguồn đã chọn từ ruleData
                    if (editMode && selectedUtmSources.length > 0) {
                        const updatedSources = apiSources.map((source) => ({
                            ...source,
                            checked: selectedUtmSources.includes(source.value),
                        }));
                        setSourceRoute(updatedSources);
                    } else {
                        setSourceRoute(apiSources);
                    }
                }
            } catch (error) {
                console.error("Error fetching sources:", error);
                toast.error("Có lỗi khi tải danh sách nguồn");
            }
        };

        fetchSources();
    }, [params.orgId, selectedWorkspaceId, editMode, selectedUtmSources]);

    // Parse dữ liệu từ API trong trường hợp chỉnh sửa
    useEffect(() => {
        if (editMode && ruleData) {
            // Fetch chi tiết cấu hình để hiển thị lên form
            const fetchRuleDetail = async () => {
                try {
                    // Lấy ID từ ruleData, kiểm tra cả viết hoa và viết thường
                    const ruleId = ruleData.id || ruleData.Id;

                    if (!ruleId) {
                        console.error("Không tìm thấy ID của kịch bản");
                        toast.error(
                            "Có lỗi khi tải thông tin cấu hình: Không tìm thấy ID",
                        );
                        return;
                    }

                    const response = await getReminderConfigDetail(
                        params.orgId,
                        ruleId,
                    );
                    if (response) {
                        const data = response;

                        // Thiết lập workspace id - xử lý cả WorkspaceIds và workspaceIds
                        const workspaceIds =
                            data.WorkspaceIds || data.workspaceIds;
                        if (workspaceIds && workspaceIds.length > 0) {
                            setSelectedWorkspaceId(workspaceIds[0]);
                        }

                        // Thiết lập thời gian - xử lý cả Time và time
                        const timeValue =
                            data.Time !== undefined ? data.Time : data.time;
                        if (timeValue !== undefined) {
                            const hours = Math.floor(timeValue / 60);
                            const minutes = timeValue % 60;
                            setTimeRule({ hour: hours, minute: minutes });
                        }

                        // Thiết lập nguồn và phân loại
                        // Phân loại (SourceIds) - xử lý cả SourceIds và sourceIds
                        const sourceIds = data.SourceIds || data.sourceIds;
                        if (sourceIds && sourceIds.length > 0) {
                            setCategoryRoute((prevCategories) =>
                                prevCategories.map((category) => ({
                                    ...category,
                                    checked: sourceIds.includes(category.value),
                                })),
                            );
                        }

                        // Nguồn (UtmSources) - xử lý cả UtmSources và utmSources
                        const utmSources = data.UtmSources || data.utmSources;
                        if (utmSources && utmSources.length > 0) {
                            setSelectedUtmSources(utmSources);
                        }

                        // Thiết lập trạng thái - xử lý cả Stages và stages
                        const stages = data.Stages || data.stages;
                        if (stages && stages.length > 0) {
                            setStageSelected(stages);
                        }

                        // Thiết lập nội dung thông báo - xử lý cả NotificationMessage và notificationMessage
                        const message =
                            data.NotificationMessage ||
                            data.notificationMessage;
                        if (message) {
                            setReminderMessage(message);
                        }

                        // Thiết lập khung giờ áp dụng - xử lý cả HourFrame và hourFrame
                        const hourFrame = data.HourFrame || data.hourFrame;
                        if (hourFrame && hourFrame.length > 0) {
                            setTimeFrameEnabled(true);

                            // Lấy thời gian bắt đầu và kết thúc từ mẫu đầu tiên
                            if (hourFrame[0]) {
                                const timeStart = hourFrame[0].timeStart;
                                const timeEnd = hourFrame[0].timeEnd;

                                if (timeStart) {
                                    const [startHour, startMinute] = timeStart
                                        .split(":")
                                        .map(Number);
                                    setStartTime({
                                        hour: startHour,
                                        minute: startMinute,
                                    });
                                }

                                if (timeEnd) {
                                    const [endHour, endMinute] = timeEnd
                                        .split(":")
                                        .map(Number);
                                    setEndTime({
                                        hour: endHour,
                                        minute: endMinute,
                                    });
                                }
                            }

                            // Thiết lập các ngày trong tuần
                            const selectedDays = hourFrame.map(
                                (frame) => frame.day,
                            );
                            // Bật/tắt các ngày tương ứng trong weekdays
                            setWeekdays(
                                weekdayOptions.map((day) => ({
                                    ...day,
                                    checked: selectedDays.includes(
                                        reverseDayMapping[day.value],
                                    ),
                                })),
                            );
                        }

                        // Thiết lập lặp lại nhắc hẹn - xử lý cả Repeat/RepeatTime và repeat/repeatTime
                        const repeatValue =
                            data.Repeat !== undefined
                                ? data.Repeat
                                : data.repeat;
                        const repeatTimeValue =
                            data.RepeatTime !== undefined
                                ? data.RepeatTime
                                : data.repeatTime;

                        if (repeatValue > 0) {
                            setRepeatEnabled(true);
                            setRepeatCount(repeatValue);

                            if (repeatTimeValue) {
                                const hours = Math.floor(repeatTimeValue / 60);
                                const minutes = repeatTimeValue % 60;
                                setRepeatInterval({
                                    hour: hours,
                                    minute: minutes,
                                });
                            }
                        }
                    } else {
                        console.error("Lỗi khi lấy chi tiết cấu hình");
                        toast.error("Có lỗi khi tải thông tin cấu hình");
                    }
                } catch (error) {
                    console.error("Error fetching rule detail:", error);
                    toast.error("Có lỗi khi tải thông tin cấu hình");
                }
            };

            fetchRuleDetail();
        }
    }, [editMode, ruleData, params.orgId]);

    const handleSubmit = () => {
        // Kiểm tra xem đã chọn không gian làm việc chưa
        if (!selectedWorkspaceId) {
            toast.error("Vui lòng chọn không gian làm việc trước khi lưu!");
            return;
        }

        // Kiểm tra khung giờ áp dụng nếu được bật
        if (timeFrameEnabled) {
            // Chuyển đổi thời gian sang phút để so sánh
            const startMinutes = startTime.hour * 60 + startTime.minute;
            const endMinutes = endTime.hour * 60 + endTime.minute;

            if (startMinutes >= endMinutes) {
                toast.error(
                    "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc!",
                );
                return;
            }

            // Kiểm tra nếu không có ngày nào được chọn
            if (!weekdays.some((day) => day.checked)) {
                toast.error("Vui lòng chọn ít nhất một ngày trong tuần!");
                return;
            }
        }

        setIsSubmitting(true);

        // Tính thời gian tính bằng phút
        const durationInMinutes = timeRule.hour * 60 + timeRule.minute;

        // Tính thời gian lặp lại
        const repeatIntervalMinutes = repeatEnabled
            ? repeatInterval.hour * 60 + repeatInterval.minute
            : 0;

        // Chuẩn bị danh sách SourceIds từ categoryRoute
        const sourceIds =
            !categoryRoute.every((item) => item.checked) &&
            categoryRoute.some((item) => item.checked)
                ? categoryRoute
                      .filter((item) => item.checked)
                      .map((item) => item.value)
                : [];

        // Chuẩn bị danh sách UtmSources từ sourceRoute
        const utmSources =
            !sourceRoute.every((item) => item.checked) &&
            sourceRoute.some((item) => item.checked)
                ? sourceRoute
                      .filter((item) => item.checked)
                      .map((item) => item.value)
                : [];

        // Tạo hourFrame từ weekdays nếu timeFrameEnabled
        const hourFrame = timeFrameEnabled
            ? weekdays
                  .filter((day) => day.checked)
                  .map((day) => {
                      return {
                          day: reverseDayMapping[day.value],
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
                              endTime.hour < 10
                                  ? "0" + endTime.hour
                                  : endTime.hour
                          }:${
                              endTime.minute < 10
                                  ? "0" + endTime.minute
                                  : endTime.minute
                          }`,
                      };
                  })
            : [];

        // Chuẩn bị dữ liệu cho API theo cấu trúc mới - sử dụng định dạng viết hoa chữ cái đầu
        const requestData = {
            Time: durationInMinutes,
            Stages: stageSelected,
            HourFrame: hourFrame,
            SourceIds: sourceIds,
            UtmSources: utmSources,
            WorkspaceIds: [selectedWorkspaceId],
            NotificationMessage: reminderMessage,
            OrganizationId: params.orgId,
            IsActive: true,
            Repeat: repeatEnabled ? repeatCount : 0,
            RepeatTime: repeatIntervalMinutes,
        };

        // Log dữ liệu gửi lên API

        // Gọi API với ToastPromise
        ToastPromise(async () => {
            try {
                let response;
                if (editMode && ruleData) {
                    // Lấy ID từ ruleData, kiểm tra cả viết hoa và viết thường
                    const ruleId = ruleData.id || ruleData.Id;

                    if (!ruleId) {
                        console.error("Không tìm thấy ID của kịch bản");
                        toast.error(
                            "Có lỗi khi cập nhật kịch bản: Không tìm thấy ID",
                        );
                        setIsSubmitting(false);
                        return false;
                    }

                    response = await updateReminderConfig(
                        params.orgId,
                        ruleId,
                        requestData,
                    );
                } else {
                    response = await createReminderConfig(
                        params.orgId,
                        requestData,
                    );
                }

                // Không kiểm tra response.code nữa
                toast.success(
                    editMode
                        ? "Đã cập nhật kịch bản nhắc hẹn thành công!"
                        : "Đã tạo kịch bản nhắc hẹn thành công!",
                );
                setOpen(false);

                // Gọi callback onSuccess nếu có
                if (onSuccess) {
                    onSuccess();
                }

                return true;
            } catch (error) {
                console.error(
                    `Error ${
                        editMode ? "updating" : "creating"
                    } reminder rule:`,
                    error,
                );
                toast.error(
                    `Có lỗi xảy ra khi ${
                        editMode ? "cập nhật" : "tạo"
                    } kịch bản nhắc hẹn!`,
                );
                return false;
            } finally {
                setIsSubmitting(false);
            }
        });
    };

    const handleStageChange = (newValue) => {
        setStageSelected(newValue);
    };

    // Lấy tên của stage từ stageGroups dựa trên id
    const getStageNames = () => {
        if (!stageSelected || stageSelected.length === 0) return "Bất kì";

        const names = stageSelected
            .map((stageId) => {
                for (const group of stageGroups) {
                    const stage = group.stages.find((s) => s.id === stageId);
                    if (stage) return stage.name;
                }
                return "";
            })
            .filter(Boolean);

        return names.length > 0 ? names.join(", ") : "Bất kì";
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="grid sm:max-w-xl h-auto pt-4 transition-all gap-0">
                <DialogHeader>
                    <DialogTitle
                        className={
                            "font-medium text-[20px] text-title flex items-center justify-between mb-3"
                        }
                    >
                        <span>{getDialogTitle()}</span>
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>

                <div className="flex flex-col pt-4">
                    <div className="flex flex-col w-full">
                        <div className="w-full flex flex-col text-title">
                            <div className="text-base leading-7">
                                Tại không gian làm việc{" "}
                                <WorkspaceSelectPopover
                                    workspaceList={workspaceList}
                                    selectedId={selectedWorkspaceId}
                                    setSelectedId={setSelectedWorkspaceId}
                                >
                                    <span className="cursor-pointer text-primary font-bold">
                                        {selectedWorkspaceId
                                            ? workspaceList.find(
                                                  (ws) =>
                                                      ws.id ===
                                                      selectedWorkspaceId,
                                              )?.name
                                            : "Chọn không gian làm việc"}
                                    </span>
                                </WorkspaceSelectPopover>
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
                                            (item) => item.checked,
                                        )
                                            ? "Tất cả"
                                            : categoryRoute.filter(
                                                    (item) => item.checked,
                                                ).length === 0
                                              ? "Chọn phân loại"
                                              : categoryRoute
                                                    .filter(
                                                        (item) => item.checked,
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
                                            (item) => item.checked,
                                        )
                                            ? "Tất cả"
                                            : sourceRoute.filter(
                                                    (item) => item.checked,
                                                ).length === 0
                                              ? "Chọn nguồn"
                                              : sourceRoute
                                                    .filter(
                                                        (item) => item.checked,
                                                    )
                                                    .map((item) => item.label)
                                                    .join(", ")}
                                    </span>
                                </MultiSelectPopover>
                                <br />
                                và trạng thái{" "}
                                <span className="inline-block">
                                    <MultiSelect
                                        options={stageGroups.flatMap((group) =>
                                            group.stages.map((stage) => ({
                                                value: stage.id,
                                                label: stage.name,
                                                labelGroup: group.name,
                                                hexCode: group.hexCode,
                                            })),
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
                                    setTime={(newTime) => {
                                        setTimeRule(newTime);
                                    }}
                                >
                                    <span className="cursor-pointer text-primary font-bold">
                                        {timeRule.hour > 0
                                            ? `${timeRule.hour} giờ `
                                            : ""}
                                        {timeRule.minute} phút
                                    </span>
                                </TimeInputPopover>
                                <br />
                                gửi thông báo nhắc nhở đến người phụ trách với
                                nội dung:
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
                                    Sử dụng {"{Tên KH}"} để hiển thị tên khách
                                    hàng trong thông báo.
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
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
                                            từ{" "}
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
                                                        (day) => day.checked,
                                                    ).length === 1
                                                        ? weekdays.find(
                                                              (day) =>
                                                                  day.checked,
                                                          )?.label
                                                        : weekdays.filter(
                                                                (day) =>
                                                                    day.checked,
                                                            ).length ===
                                                            weekdays.length
                                                          ? "thứ 2, 3, 4, 5, 6, 7"
                                                          : weekdays.filter(
                                                                  (day) =>
                                                                      day.checked,
                                                              ).length === 0
                                                            ? "Chọn ngày"
                                                            : weekdays
                                                                  .filter(
                                                                      (day) =>
                                                                          day.checked,
                                                                  )
                                                                  .map(
                                                                      (day) =>
                                                                          day.label,
                                                                  )
                                                                  .join(", ")}
                                                </span>
                                            </MultiSelectPopover>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="repeatEnabled"
                                        checked={repeatEnabled}
                                        onCheckedChange={setRepeatEnabled}
                                    />
                                    <label
                                        htmlFor="repeatEnabled"
                                        className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Lặp lại nhắc hẹn
                                    </label>
                                </div>

                                {repeatEnabled && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                Số lần lặp:
                                            </span>
                                            <NumberInput
                                                value={repeatCount}
                                                onChange={setRepeatCount}
                                                min={1}
                                                size="small"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                Mỗi lần cách nhau:
                                            </span>
                                            <TimeInputPopover
                                                time={repeatInterval}
                                                setTime={setRepeatInterval}
                                            >
                                                <span className="cursor-pointer text-primary font-bold">
                                                    {repeatInterval.hour > 0
                                                        ? `${repeatInterval.hour} giờ `
                                                        : ""}
                                                    {repeatInterval.minute} phút
                                                </span>
                                            </TimeInputPopover>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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
                    {canSave && (
                        <Button
                            type="button"
                            variant="default"
                            className="h-[35px] bg-primary text-white hover:bg-primary/90 px-6"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

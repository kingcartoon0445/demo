import { createSchedule, updateSchedule } from "@/api/schedule";
import { scheduleTypes } from "@/constants";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function useReminderForm(
    customerData,
    reminderToEdit,
    setOpen,
    taskId = null,
    provider = null,
    refreshStage
) {
    const [customer, setCustomer] = useState(
        customerData || { name: "", id: "" }
    );
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const defaultHour = new Date().getHours() + 1;
    const [startTime, setStartTime] = useState({
        hour: defaultHour > 23 ? 23 : defaultHour,
        minute: 0,
    });
    const [endTime, setEndTime] = useState({
        hour: defaultHour + 1 > 23 ? 23 : defaultHour + 1,
        minute: 0,
    });
    const [content, setContent] = useState("");
    const [repeatDays, setRepeatDays] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeError, setTimeError] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedType, setSelectedType] = useState("call");
    const [priority, setPriority] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [notifyBeforeList, setNotifyBeforeList] = useState([]);
    const [savedStatus, setSavedStatus] = useState(false);
    const [isStartTimeDisabled, setIsStartTimeDisabled] = useState(false);
    const [userHasCustomizedTitle, setUserHasCustomizedTitle] = useState(false);
    useEffect(() => {
        if (customerData) {
            setCustomer(customerData);
        }
    }, [customerData]);

    // Khởi tạo title mặc định khi component mount
    useEffect(() => {
        if (!reminderToEdit && !title.trim()) {
            const selectedTypeData = scheduleTypes.find(
                (t) => t.id === selectedType
            );
            if (selectedTypeData) {
                setTitle(selectedTypeData.name);
            }
        }
    }, []); // Chỉ chạy một lần khi component mount

    useEffect(() => {
        if (reminderToEdit) {
            setTitle(reminderToEdit.Title || "");
            setDescription(reminderToEdit.Content || "");
            setSelectedType(reminderToEdit.SchedulesType || "reminder");
            setPriority(
                reminderToEdit.Priority !== undefined
                    ? reminderToEdit.Priority
                    : 1
            );
            setIsCompleted(reminderToEdit.IsDone || false);

            if (
                reminderToEdit.Reminders &&
                Array.isArray(reminderToEdit.Reminders) &&
                reminderToEdit.Reminders.length > 0
            ) {
                const notifications = reminderToEdit.Reminders.map(
                    (reminder, index) => {
                        if (reminder.time) {
                            const [hour, minute] = reminder.time.split(":");
                            return {
                                id: index + 1,
                                hour: parseInt(hour) || 0,
                                minute: parseInt(minute) || 0,
                            };
                        }
                        return { id: index + 1, hour: 0, minute: 0 };
                    }
                );
                setNotifyBeforeList(notifications);
            } else if (
                reminderToEdit.NotifyBeforeList &&
                Array.isArray(reminderToEdit.NotifyBeforeList) &&
                reminderToEdit.NotifyBeforeList.length > 0
            ) {
                setNotifyBeforeList(reminderToEdit.NotifyBeforeList);
            } else if (
                reminderToEdit.NotifyBefore &&
                (reminderToEdit.NotifyBefore.hour ||
                    reminderToEdit.NotifyBefore.minute)
            ) {
                setNotifyBeforeList([
                    { id: 1, ...reminderToEdit.NotifyBefore },
                ]);
            }

            if (reminderToEdit.StartTime) {
                try {
                    const startDateTime = new Date(reminderToEdit.StartTime);
                    if (!isNaN(startDateTime.getTime())) {
                        setStartDate(startDateTime);
                        setStartTime({
                            hour: startDateTime.getHours(),
                            minute: startDateTime.getMinutes(),
                        });

                        const now = new Date();
                        if (startDateTime < now) {
                            setIsStartTimeDisabled(true);
                        }
                    }
                } catch (error) {
                    console.error("Lỗi khi parse StartTime:", error);
                }
            }

            if (reminderToEdit.EndTime) {
                try {
                    const endDateTime = new Date(reminderToEdit.EndTime);
                    if (!isNaN(endDateTime.getTime())) {
                        setEndDate(endDateTime);
                        setEndTime({
                            hour: endDateTime.getHours(),
                            minute: endDateTime.getMinutes(),
                        });
                    }
                } catch (error) {
                    console.error("Lỗi khi parse EndTime:", error);
                }
            }

            if (
                reminderToEdit.RepeatRule &&
                Array.isArray(reminderToEdit.RepeatRule)
            ) {
                const selectedDays = reminderToEdit.RepeatRule.map(
                    (rule) => rule.day
                );
                setRepeatDays(selectedDays);
            }

            if (
                reminderToEdit.Contact &&
                typeof reminderToEdit.Contact === "string"
            ) {
                try {
                    const contactData = JSON.parse(reminderToEdit.Contact);
                    if (Array.isArray(contactData) && contactData.length > 0) {
                        reminderToEdit.contactData = contactData[0];
                    }
                } catch (error) {
                    console.error("Lỗi khi parse Contact:", error);
                }
            }
        }
    }, [reminderToEdit]);

    useEffect(() => {
        if (startDate && startTime) {
            const today = new Date();
            const selectedDate = new Date(startDate);

            // Validate thời gian với ngày hiện tại
            if (selectedDate.toDateString() === today.toDateString()) {
                const currentHour = today.getHours();
                const currentMinute = today.getMinutes();

                if (
                    startTime.hour < currentHour ||
                    (startTime.hour === currentHour &&
                        startTime.minute <= currentMinute)
                ) {
                    if (!isStartTimeDisabled) {
                        setTimeError(
                            `Thời gian bắt đầu phải lớn hơn thời gian hiện tại (${currentHour}:${
                                currentMinute < 10 ? "0" : ""
                            }${currentMinute})`
                        );
                        return;
                    }
                }
            }

            // Validate thời gian kết thúc phải lớn hơn thời gian bắt đầu
            if (endDate && endTime) {
                const startDateTime = new Date(startDate);
                startDateTime.setHours(startTime.hour, startTime.minute, 0, 0);

                const endDateTime = new Date(endDate);
                endDateTime.setHours(endTime.hour, endTime.minute, 0, 0);

                if (endDateTime <= startDateTime) {
                    setTimeError(
                        "Thời gian kết thúc phải lớn hơn thời gian bắt đầu"
                    );
                    return;
                }
            }

            setTimeError("");
        }
    }, [startDate, startTime, endDate, endTime, isStartTimeDisabled]);

    useEffect(() => {
        if (startTime && endTime && startDate && endDate) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(startTime.hour, startTime.minute, 0, 0);

            const endDateTime = new Date(endDate);
            endDateTime.setHours(endTime.hour, endTime.minute, 0, 0);

            // Tự động điều chỉnh thời gian kết thúc nếu nó không lớn hơn thời gian bắt đầu
            if (endDateTime <= startDateTime) {
                const newEndTime = new Date(startDateTime);
                newEndTime.setMinutes(newEndTime.getMinutes() + 30); // Thêm 30 phút

                // Nếu vượt quá 23:59 cùng ngày, chuyển sang ngày hôm sau
                if (newEndTime.getDate() !== startDateTime.getDate()) {
                    const nextDay = new Date(startDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setEndDate(nextDay);
                    setEndTime({
                        hour: 0,
                        minute: 30,
                    });
                } else {
                    setEndTime({
                        hour: newEndTime.getHours(),
                        minute: newEndTime.getMinutes(),
                    });
                }
            }
        }
    }, [startTime, startDate, endDate]);

    useEffect(() => {
        if (startDate) {
            // Nếu endDate chưa được set hoặc endDate < startDate thì set endDate = startDate
            if (!endDate || endDate < startDate) {
                setEndDate(startDate);
            }
        }
    }, [startDate]);

    // Tự động cập nhật title khi selectedType thay đổi
    useEffect(() => {
        if (selectedType && !reminderToEdit) {
            const selectedTypeData = scheduleTypes.find(
                (t) => t.id === selectedType
            );
            if (selectedTypeData) {
                setTitle(selectedTypeData.name);
                // Reset trạng thái customized khi type thay đổi
                setUserHasCustomizedTitle(false);
            }
        }
    }, [selectedType, reminderToEdit]);

    // Hàm xử lý khi người dùng thay đổi title
    const handleTitleChange = (newTitle) => {
        setTitle(newTitle);

        // Kiểm tra xem người dùng có đang nhập title tùy chỉnh hay không
        const isScheduleTypeName = scheduleTypes.some(
            (type) => type.name === newTitle.trim()
        );
        if (!isScheduleTypeName && newTitle.trim() !== "") {
            setUserHasCustomizedTitle(true);
        } else if (newTitle.trim() === "") {
            setUserHasCustomizedTitle(false);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!startDate) {
            toast.error("Vui lòng chọn ngày bắt đầu");
            return;
        }

        if (!endDate) {
            toast.error("Vui lòng chọn ngày kết thúc");
            return;
        }

        if (timeError && !isStartTimeDisabled) {
            toast.error(timeError);
            return;
        }

        // Kiểm tra thời gian kết thúc phải lớn hơn thời gian bắt đầu
        if (startDate && endDate && startTime && endTime) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(startTime.hour, startTime.minute, 0, 0);

            const endDateTime = new Date(endDate);
            endDateTime.setHours(endTime.hour, endTime.minute, 0, 0);

            if (endDateTime <= startDateTime) {
                toast.error(
                    "Thời gian kết thúc phải lớn hơn thời gian bắt đầu"
                );
                return;
            }
        }

        if (!title.trim()) {
            toast.error("Vui lòng nhập tiêu đề lịch hẹn");
            return;
        }

        if (!customerData || !customerData.organizationId) {
            toast.error("Không tìm thấy thông tin tổ chức");
            return;
        }

        setIsSubmitting(true);

        try {
            const start = new Date(startDate);
            start.setHours(startTime.hour, startTime.minute, 0);
            const startTimeISO = start.toISOString();

            const end = new Date(endDate);
            end.setHours(endTime.hour, endTime.minute, 0);
            const endTimeISO = end.toISOString();

            const reminders =
                notifyBeforeList.length > 0
                    ? notifyBeforeList.map((notify) => {
                          const hour = Math.floor(notify.hour);
                          const minute = Math.floor(notify.minute);

                          return {
                              Time: `${hour
                                  .toString()
                                  .padStart(2, "0")}:${minute
                                  .toString()
                                  .padStart(2, "0")}`,
                          };
                      })
                    : [];

            const repeatRule = repeatDays.map((day) => ({ day }));

            const scheduleData = {
                StartTime: startTimeISO,
                EndTime: endTimeISO,
                RepeatRule: repeatRule.length > 0 ? repeatRule : [],
                Title: title,
                Content: description,
                IsDone: isCompleted,
                OrganizationId: customerData?.organizationId || "",
                Priority: priority,
                SchedulesType: selectedType,
                Reminders: reminders,
                RelatedProfiles: [],
            };

            if (customerData?.workspaceId) {
                scheduleData.WorkspaceId = customerData.workspaceId;
            }

            if (customerData?.id) {
                scheduleData.Contact = [
                    {
                        id: customerData.id || "",
                        phone: customerData.phone || null,
                        fullName: customerData.name || "",
                        avatar: customerData.avatar || null,
                    },
                ];
                if (taskId) {
                    if (!scheduleData.Contact[0].CustomFields) {
                        scheduleData.Contact[0].CustomFields = {};
                    }
                    scheduleData.Contact[0].CustomFields = {
                        taskId: taskId,
                    };
                }
                if (provider) {
                    if (!scheduleData.Contact[0].CustomFields) {
                        scheduleData.Contact[0].CustomFields = {};
                    }
                    scheduleData.Contact[0].CustomFields.area = provider;
                }
            } else if (reminderToEdit?.contactData) {
                scheduleData.Contact = [
                    {
                        id:
                            reminderToEdit.contactData.id ||
                            reminderToEdit.contactData.Id ||
                            "",
                        phone:
                            reminderToEdit.contactData.phone ||
                            reminderToEdit.contactData.Phone ||
                            null,
                        fullName:
                            reminderToEdit.contactData.fullName ||
                            reminderToEdit.contactData.FullName ||
                            "",
                        avatar:
                            reminderToEdit.contactData.avatar ||
                            reminderToEdit.contactData.Avatar ||
                            null,
                    },
                ];
                if (taskId) {
                    scheduleData.Contact[0].CustomFields = {
                        taskId: taskId,
                    };
                }
            } else if (
                reminderToEdit?.Contact &&
                typeof reminderToEdit.Contact === "string"
            ) {
                try {
                    const contactObj = JSON.parse(reminderToEdit.Contact);
                    scheduleData.Contact = contactObj;
                } catch (error) {
                    console.error("Lỗi khi parse Contact:", error);
                    scheduleData.Contact = [];
                }
            }

            if (reminderToEdit?.WorkspaceId) {
                scheduleData.WorkspaceId = reminderToEdit.WorkspaceId;
            }
            if (reminderToEdit?.OrganizationId) {
                scheduleData.OrganizationId = reminderToEdit.OrganizationId;
            }
            const actionPromise = async () => {
                let response;
                if (reminderToEdit?.Id) {
                    scheduleData.Id = reminderToEdit.Id;
                    response = await updateSchedule(scheduleData);
                } else {
                    response = await createSchedule(scheduleData);
                }

                return response || { success: true };
            };

            toast
                .promise(actionPromise(), {
                    loading: "Đang xử lý...",
                    success: () => {
                        setSavedStatus(true);
                        setOpen(true);
                        refreshStage?.();
                        return reminderToEdit
                            ? "Cập nhật nhắc hẹn thành công"
                            : "Tạo nhắc hẹn thành công";
                    },
                    error: (err) => {
                        setSavedStatus(false);
                        return `Lỗi: ${
                            err?.response?.data?.message ||
                            err?.message ||
                            "Đã có lỗi xảy ra"
                        }`;
                    },
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
        } catch (error) {
            console.error("Error submitting reminder:", error);
            toast.error(
                `Lỗi: ${
                    error?.response?.data?.message ||
                    error?.message ||
                    "Đã có lỗi xảy ra"
                }`
            );
            setIsSubmitting(false);
            setSavedStatus(false);
        }
    };

    return {
        customer,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        content,
        setContent,
        repeatDays,
        setRepeatDays,
        isSubmitting,
        timeError,
        title,
        setTitle,
        handleTitleChange,
        description,
        setDescription,
        selectedType,
        setSelectedType,
        priority,
        setPriority,
        isCompleted,
        setIsCompleted,
        notifyBeforeList,
        setNotifyBeforeList,
        handleSubmit,
        savedStatus,
        isStartTimeDisabled,
    };
}

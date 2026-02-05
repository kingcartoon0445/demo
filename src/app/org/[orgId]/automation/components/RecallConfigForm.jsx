"use client";

import { getBusinessProcess } from "@/api/businessProcess";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamList } from "@/hooks/team_data";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { useStageStore } from "@/store/stage";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

// Components
import { getOrgUtmSource } from "@/api/orgV2";
import { getTeamListV2 } from "@/api/teamV2";

// Constants
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

const dayMapping = {
    T2: "monday",
    T3: "tuesday",
    T4: "wednesday",
    T5: "thursday",
    T6: "friday",
    T7: "saturday",
    CN: "sunday",
};

const reverseDayMapping = {
    monday: "T2",
    tuesday: "T3",
    wednesday: "T4",
    thursday: "T5",
    friday: "T6",
    saturday: "T7",
    sunday: "CN",
};

export default function RecallConfigForm({
    editMode = false,
    ruleData = null,
    onSuccess = null,
    open = false,
    initialTimeRule = { hour: 0, minute: 30 },
    initialRule = "TEAM",
}) {
    const params = useParams();
    const { t } = useLanguage();
    const { workspaceList } = useWorkspaceList();
    const { stageGroups, fetchStages } = useStageStore();
    const [bpStages, setBpStages] = useState([]);
    const { teamList, setTeamList } = useTeamList();

    // State management
    const [timeRule, setTimeRule] = useState(initialTimeRule);
    const [categoryRoute, setCategoryRoute] = useState(categoryRouteList);
    const [sourceRoute, setSourceRoute] = useState([]);
    const [stageSelected, setStageSelected] = useState([]);
    const [rule, setRule] = useState(initialRule || "TEAM");
    const [assignTeam, setAssignTeam] = useState(null);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const [timeFrameEnabled, setTimeFrameEnabled] = useState(false);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [selectedUtmSources, setSelectedUtmSources] = useState([]);
    const [maxAttemptsEnabled, setMaxAttemptsEnabled] = useState(false);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [selectedAutomationType, setSelectedAutomationType] = useState(null);
    const [startTime, setStartTime] = useState({ hour: 8, minute: 0 });
    const [endTime, setEndTime] = useState({ hour: 17, minute: 0 });
    const [weekdays, setWeekdays] = useState(weekdayOptions);
    const [reminderTimes, setReminderTimes] = useState([
        { id: 1, time: { hour: 1, minute: 0 } },
    ]);
    const [reminderMessage, setReminderMessage] = useState(
        "Khách hàng của bạn sẽ bị chuyển đi trong {time_left} nữa do chưa cập nhật trạng thái. Vui lòng kiểm tra và cập nhật ngay!"
    );
    const [hasStageUpdate, setHasStageUpdate] = useState(false);
    const [stageToUpdate, setStageToUpdate] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedScope, setSelectedScope] = useState("");
    const [selectedScopeTargets, setSelectedScopeTargets] = useState([]);
    const [selectedMemberName, setSelectedMemberName] = useState("");
    const [selectedWorkspaceName, setSelectedWorkspaceName] = useState("");

    // Memoized values
    const stageOptions = useMemo(() => {
        if (selectedAutomationType === "deal") {
            const options = bpStages.map((stage) => ({
                value: stage.id,
                label: stage.name,
                labelGroup: stage.groupName || "",
                hexCode: stage.hexCode || undefined,
            }));
            return options;
        }
        const options = stageGroups.flatMap((group) =>
            group.stages.map((stage) => ({
                value: stage.id,
                label: stage.name,
                labelGroup: group.name,
                hexCode: group.hexCode,
            }))
        );
        return options;
    }, [selectedAutomationType, bpStages, stageGroups]);
    // Parse rule data for edit mode
    useEffect(() => {
        if (editMode && ruleData) {
            parseRuleData();
        }
    }, [editMode, ruleData, stageGroups]);

    const parseRuleData = useCallback(() => {
        if (!ruleData) return;

        // Parse category first - this is critical for deals
        if (ruleData.category) {
            setSelectedAutomationType(ruleData.category);
        }

        // Parse scope and scope targets
        if (ruleData.scope) {
            setSelectedScope(ruleData.scope.toLowerCase());
        }

        if (ruleData.scopeTargets) {
            try {
                const parsedTargets = JSON.parse(ruleData.scopeTargets);
                setSelectedScopeTargets(
                    Array.isArray(parsedTargets) ? parsedTargets : []
                );
            } catch (error) {
                console.error("Error parsing scopeTargets:", error);
                setSelectedScopeTargets([]);
            }
        }

        // Parse workspace condition
        if (ruleData.condition?.conditions?.[0]?.conditions) {
            const conditions = ruleData.condition.conditions[0].conditions;

            const workspaceCondition = conditions.find(
                (condition) => condition.columnName === "WorkspaceId"
            );
            if (workspaceCondition?.extendValues?.[0]) {
                setSelectedWorkspaceId(workspaceCondition.extendValues[0]);
            }

            // Parse category route
            const sourceIdCondition = conditions.find(
                (condition) => condition.columnName === "SourceId"
            );
            if (sourceIdCondition?.extendValues) {
                const selectedSourceIds = sourceIdCondition.extendValues;
                setCategoryRoute((prevCategories) =>
                    prevCategories.map((category) => ({
                        ...category,
                        checked: selectedSourceIds.includes(category.value),
                    }))
                );
            }

            // Parse UTM sources
            const utmSourceCondition = conditions.find(
                (condition) => condition.columnName === "UtmSource"
            );
            if (utmSourceCondition?.extendValues) {
                setSelectedUtmSources(utmSourceCondition.extendValues);
            }

            // Parse stage selection
            const stageIdCondition = conditions.find(
                (condition) => condition.columnName === "StageId"
            );
            if (stageIdCondition?.extendValues) {
                setStageSelected(stageIdCondition.extendValues);
            }
        }

        // Parse duration
        if (ruleData.duration) {
            const hours = Math.floor(ruleData.duration / 60);
            const minutes = ruleData.duration % 60;
            setTimeRule({ hour: hours, minute: minutes });
        }

        // Parse rule and team
        if (ruleData.rule) {
            setRule(ruleData.rule);
        } else if (ruleData.scope) {
            // Infer rule from scope if rule is missing (e.g. from backend)
            const scope = ruleData.scope.toUpperCase();
            if (scope === "TEAM") {
                let hasTargets = false;
                if (ruleData.scopeTargets) {
                    try {
                        const t = JSON.parse(ruleData.scopeTargets);
                        if (Array.isArray(t) && t.length > 0) hasTargets = true;
                    } catch (e) {}
                }

                if (hasTargets) {
                    setRule("ASSIGN_TO");
                } else {
                    setRule("TEAM");
                }
            } else if (scope === "ORGANIZATION") {
                setRule("ORGANIZATION");
            } else if (scope === "MEMBER" || scope === "USER") {
                setRule("ASSIGN_MEMBER");
            } else if (scope === "WORKSPACE") {
                setRule("ASSIGN_WORKSPACE");
            }
        }

        // Parse time frame
        if (ruleData.hourFrame?.length > 0) {
            setTimeFrameEnabled(true);
            const frame = ruleData.hourFrame[0];

            if (frame.timeStart) {
                const [startHour, startMinute] = frame.timeStart
                    .split(":")
                    .map(Number);
                setStartTime({ hour: startHour, minute: startMinute });
            }

            if (frame.timeEnd) {
                const [endHour, endMinute] = frame.timeEnd
                    .split(":")
                    .map(Number);
                setEndTime({ hour: endHour, minute: endMinute });
            }

            const selectedDays = ruleData.hourFrame.map((frame) => frame.day);
            setWeekdays(
                weekdayOptions.map((day) => ({
                    ...day,
                    checked: selectedDays.includes(
                        reverseDayMapping[day.value]
                    ),
                }))
            );
        }

        // Parse notification message
        if (ruleData.notificationMessage) {
            setReminderMessage(ruleData.notificationMessage);
        }

        // Parse notifications
        if (ruleData.notifications?.length > 0) {
            setReminderEnabled(true);
            const times = ruleData.notifications.map((notification, index) => {
                const [hours, minutes] = notification.time
                    .split(":")
                    .map(Number);
                return {
                    id: index + 1,
                    time: { hour: hours, minute: minutes },
                };
            });
            setReminderTimes(times);
        }

        // Parse stages
        if (ruleData.stages) {
            if (
                ruleData.stages.length === 1 &&
                ruleData.stages[0]?.stageId ===
                    "00000000-0000-0000-0000-000000000000"
            ) {
                setHasStageUpdate(false);
                setStageToUpdate([]);
            } else {
                setHasStageUpdate(true);
                const stageIds = ruleData.stages.map((item) => item.stageId);
                setStageToUpdate(stageIds);
            }
        } else if (ruleData.stage) {
            setHasStageUpdate(true);
            const stageIds = Array.isArray(ruleData.stage)
                ? ruleData.stage
                : [ruleData.stage];
            setStageToUpdate(stageIds);
        }

        // Parse max attempts
        if (ruleData.maxAttempts) {
            setMaxAttemptsEnabled(true);
            setMaxAttempts(ruleData.maxAttempts);
        }

        // Parse title and description
        if (ruleData.title) {
            // Title is handled in the parent component
        }

        if (ruleData.description) {
            // Description is handled in the parent component
        }

        // Parse status
        if (ruleData.status !== undefined) {
            // Status is handled in the parent component
        }
    }, [ruleData]);

    // Update assignTeam when teamList changes
    useEffect(() => {
        if (editMode && ruleData?.teamId && teamList?.length > 0) {
            const findTeamById = (teams, id) => {
                for (const team of teams) {
                    if (team.id === id) return team;
                    if (team.childs?.length > 0) {
                        const found = findTeamById(team.childs, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const team = findTeamById(teamList, ruleData.teamId);
            if (team) {
                setAssignTeam(team);
            }
        }
    }, [editMode, ruleData?.teamId, teamList]);

    // Handle scope display updates when scope data changes
    useEffect(() => {
        if (
            editMode &&
            ruleData &&
            selectedScope &&
            selectedScopeTargets.length > 0
        ) {
            // This will be handled by the parent component's handleAssignSelected
            // We need to trigger the display update based on scope type
            if (selectedScope === "user" || selectedScope === "member") {
                // For user/member scope, we need to fetch member names
                // This will be handled by the parent component
                setSelectedMemberName(
                    `Thành viên (${selectedScopeTargets.length} người)`
                );
            } else if (selectedScope === "team") {
                // For team scope, we need to find team name
                if (teamList?.length > 0) {
                    const findTeamById = (teams, id) => {
                        for (const team of teams) {
                            if (team.id === id) return team;
                            if (team.childs?.length > 0) {
                                const found = findTeamById(team.childs, id);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    const teamNames = [];
                    for (const id of selectedScopeTargets) {
                        const team = findTeamById(teamList, id);
                        if (team) {
                            teamNames.push(team.name);
                        }
                    }
                    if (teamNames.length > 0) {
                        // Assuming assignTeam is less relevant for multiple scope targets or just taking the first one if needed
                        const firstTeam = findTeamById(
                            teamList,
                            selectedScopeTargets[0]
                        );
                        if (firstTeam) setAssignTeam(firstTeam);

                        setSelectedMemberName(
                            `Đội sale ${teamNames.join(", ")}`
                        );
                    }
                }
            } else if (selectedScope === "workspace") {
                // For workspace scope, we need to find workspace name
                const workspace = workspaceList.find(
                    (ws) => ws.id === selectedScopeTargets[0]
                );
                if (workspace) {
                    setSelectedWorkspaceName(
                        `Không gian làm việc ${workspace.name}`
                    );
                }
            }
        }
    }, [
        editMode,
        ruleData,
        selectedScope,
        selectedScopeTargets,
        teamList,
        workspaceList,
    ]);

    // Fetch team list (used in scope selection)
    useEffect(() => {
        if (!params.orgId || !open) return;
        getTeamListV2(params.orgId, {
            offset: 0,
            limit: 1000,
        }).then((res) => {
            if (res?.code === 0 && res.content) {
                setTeamList(res.content);
            } else {
                console.error("Lỗi khi lấy danh sách team:", res?.message);
                toast.error("Có lỗi khi tải danh sách team");
            }
        });
    }, [params.orgId, open, selectedWorkspaceId, setTeamList]);

    // Fetch stages when workspace changes
    useEffect(() => {
        // Fetch CRM stages for non-deals when dialog opens
        if (!params.orgId || !open) return;
        if (selectedAutomationType === "deal") return;
        fetchStages(params.orgId, selectedWorkspaceId || undefined);
    }, [params.orgId, open, selectedWorkspaceId, selectedAutomationType]);

    // Fetch business process stages when automation type is deals and workspace is selected
    useEffect(() => {
        if (!params.orgId || !open) return;

        const fetchBpStages = async () => {
            // Case 1: Not deals or no workspace -> Clear stages
            if (selectedAutomationType !== "deal" || !selectedWorkspaceId) {
                setBpStages([]);
                return;
            }

            // Case 2: Deals + Workspace -> Fetch stages
            try {
                const res = await getBusinessProcess(
                    params.orgId,
                    selectedWorkspaceId
                );

                // Get the first process and its stages
                const process = res?.data?.[0];
                const stages = process?.processStages || [];

                const mapped = stages
                    .map((s) => ({
                        id: s.id,
                        name: s.name,
                        groupName: "",
                        hexCode: s.color,
                        // Maintain order if needed, but for dropdown just basic info
                    }))
                    .filter((s) => s.id && s.name);

                setBpStages(mapped);
            } catch (error) {
                console.error("Error fetching business process stages:", error);
                setBpStages([]);
            }
        };

        fetchBpStages();
    }, [params.orgId, open, selectedAutomationType, selectedWorkspaceId]);
    // Fetch sources when workspace changes

    useEffect(() => {
        const fetchSources = async () => {
            if (!params.orgId || !open) return;

            try {
                const response = await getOrgUtmSource(params.orgId);
                if (response?.content) {
                    // Unique by name (case-insensitive)
                    const seenNames = new Set();
                    const uniqueByName = [];
                    for (const item of response.content) {
                        const key = (item?.name || "").trim().toLowerCase();
                        if (!key) continue;
                        if (seenNames.has(key)) continue;
                        seenNames.add(key);
                        uniqueByName.push(item);
                    }

                    const apiSources = uniqueByName.map((source) => ({
                        value: source.name,
                        label: source.name,
                        checked: true,
                    }));

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
    }, [params.orgId, open, editMode, selectedUtmSources]);

    // Helper functions
    const getStageNames = useCallback(() => {
        if (!stageSelected?.length) return "Bất kì";
        if (selectedAutomationType === "deal") {
            const names = stageSelected
                .map((id) => bpStages.find((s) => s.id === id)?.name || "")
                .filter(Boolean);
            return names.length > 0 ? names.join(", ") : "Bất kì";
        }
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
    }, [stageSelected, stageGroups, selectedAutomationType, bpStages]);

    const getStageUpdateNames = useCallback(() => {
        if (!stageToUpdate?.length) return "Chọn trạng thái";
        if (selectedAutomationType === "deal") {
            const names = stageToUpdate
                .map((id) => bpStages.find((s) => s.id === id)?.name || "")
                .filter(Boolean);
            return names.length > 0 ? names.join(", ") : "Chọn trạng thái";
        }
        const names = stageToUpdate
            .map((stageId) => {
                for (const group of stageGroups) {
                    const stage = group.stages.find((s) => s.id === stageId);
                    if (stage) return stage.name;
                }
                return "";
            })
            .filter(Boolean);
        return names.length > 0 ? names.join(", ") : "Chọn trạng thái";
    }, [stageToUpdate, stageGroups, selectedAutomationType, bpStages]);

    const getTeamName = useCallback(() => {
        if (rule === "ASSIGN_TO" && assignTeam) {
            return assignTeam.name;
        } else if (rule === "ORGANIZATION") {
            return "Tổ chức";
        } else if (rule === "TEAM") {
            return "Đội sale của người phụ trách";
        } else if (rule === "WORKSPACE") {
            return "Không gian làm việc";
        } else if (rule === "ASSIGN_MEMBER") {
            return selectedMemberName || "Chọn thành viên cụ thể";
        } else if (rule === "ASSIGN_WORKSPACE") {
            return selectedWorkspaceName || "Chọn workspace cụ thể";
        }
        return "Đội sale của người phụ trách";
    }, [rule, assignTeam, selectedMemberName, selectedWorkspaceName]);

    const getAutomationTypeLabel = useCallback(() => {
        if (!selectedAutomationType) return "Chọn nơi áp dụng";
        if (selectedAutomationType === "lead") return t("common.leads");
        if (selectedAutomationType === "deal") return t("common.deals");
        if (selectedAutomationType === "customer") return t("common.customer");
        return "Chọn nơi áp dụng";
    }, [selectedAutomationType, t]);

    const handleStageChange = useCallback((newValue) => {
        setStageSelected(newValue);
    }, []);

    const addReminderTime = useCallback(() => {
        const newId =
            reminderTimes.length > 0
                ? Math.max(...reminderTimes.map((item) => item.id)) + 1
                : 1;
        setReminderTimes([
            ...reminderTimes,
            { id: newId, time: { hour: 1, minute: 0 } },
        ]);
    }, [reminderTimes]);

    const updateReminderTime = useCallback(
        (id, newTime) => {
            setReminderTimes(
                reminderTimes.map((item) =>
                    item.id === id ? { ...item, time: newTime } : item
                )
            );
        },
        [reminderTimes]
    );

    const removeReminderTime = useCallback(
        (id) => {
            if (reminderTimes.length > 1) {
                setReminderTimes(
                    reminderTimes.filter((item) => item.id !== id)
                );
            }
        },
        [reminderTimes]
    );

    return {
        // State
        timeRule,
        setTimeRule,
        categoryRoute,
        setCategoryRoute,
        sourceRoute,
        setSourceRoute,
        stageSelected,
        setStageSelected,
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
        isSubmitting,
        setIsSubmitting,
        selectedScope,
        setSelectedScope,
        selectedScopeTargets,
        setSelectedScopeTargets,
        selectedMemberName,
        setSelectedMemberName,
        selectedWorkspaceName,
        setSelectedWorkspaceName,

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
        addReminderTime,
        updateReminderTime,
        removeReminderTime,

        // Constants
        dayMapping,
        reverseDayMapping,
    };
}

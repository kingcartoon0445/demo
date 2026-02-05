"use client";

import {
    deleteReminderConfig,
    getReminderConfigListByOrgId,
    toggleReminderConfigStatus,
} from "@/api/automation";
import {
    getAllRulesV2,
    deleteEvictionRuleV2,
    updateStatusEvictionRuleV2,
    deleteAssignRatioV2,
    updateStatusAssignRatioV2,
} from "@/api/automationV2";
import { ToastPromise } from "@/components/toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { useStageStore } from "@/store/stage";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    MdAccessTime,
    MdAlarmOn,
    MdAssignmentReturned,
    MdAssignmentTurnedIn,
    MdDoNotDisturbOn,
    MdHourglassEmpty,
    MdLoop,
    MdOutlineDelete,
    MdCallMerge,
} from "react-icons/md";
import RecallConfigDialogNew from "./RecallConfigDialogNew";
import ReminderConfigDialog from "./ReminderConfigDialog";
import AssignRatioDialog from "./AssignRatioDialog";
import { useGetTeamListV2 } from "@/hooks/useTeamV2";

export default function AutomationConfigList({
    refreshTrigger,
    setRefreshTrigger,
    canDelete = true,
    canCreate = true,
}) {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [configList, setConfigList] = useState([]);
    const [reminderConfigOpen, setReminderConfigOpen] = useState(false);
    const [recallConfigOpen, setRecallConfigOpen] = useState(false);
    const [assignRatioOpen, setAssignRatioOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [isUpdating, setIsUpdating] = useState({});
    const { workspaceList } = useWorkspaceList();
    const { data: teamListQuery } = useGetTeamListV2(params.orgId, {
        limit: 1000,
    });
    const teamList = teamListQuery?.content || [];
    const [alertOpen, setAlertOpen] = useState(false);
    const [configToDelete, setConfigToDelete] = useState(null);
    const [toggleAlertOpen, setToggleAlertOpen] = useState(false);
    const [configToToggle, setConfigToToggle] = useState(null);
    const { stageGroups, fetchStages } = useStageStore();
    const [workspaceStageMap, setWorkspaceStageMap] = useState({});

    useEffect(() => {
        const fetchAllConfigs = async () => {
            setLoading(true);
            try {
                // Fetch nhắc hẹn
                const reminderResponse = await getReminderConfigListByOrgId(
                    params.orgId,
                );
                const reminderConfigs = Array.isArray(reminderResponse)
                    ? reminderResponse.map((config) => ({
                          ...config,
                          id: config.id || config.Id,
                          time: config.time || config.Time,
                          stages: config.stages || config.Stages || [],
                          hourFrame: config.hourFrame || config.HourFrame || [],
                          sourceIds: config.sourceIds || config.SourceIds || [],
                          utmSources:
                              config.utmSources || config.UtmSources || [],
                          workspaceIds:
                              config.workspaceIds || config.WorkspaceIds || [],
                          notificationMessage:
                              config.notificationMessage ||
                              config.NotificationMessage ||
                              "",
                          organizationId:
                              config.organizationId ||
                              config.OrganizationId ||
                              "",
                          isActive:
                              config.isActive !== undefined
                                  ? config.isActive
                                  : config.IsActive !== undefined
                                    ? config.IsActive
                                    : false,
                          repeat:
                              config.repeat !== undefined
                                  ? config.repeat
                                  : config.Repeat !== undefined
                                    ? config.Repeat
                                    : 0,
                          repeatTime:
                              config.repeatTime !== undefined
                                  ? config.repeatTime
                                  : config.RepeatTime !== undefined
                                    ? config.RepeatTime
                                    : 0,
                          createdAt:
                              config.createdAt ||
                              config.CreatedAt ||
                              new Date().toISOString(),
                          configType: "reminder",
                          formattedCreatedAt: config.createdAt
                              ? new Date(config.createdAt)
                              : config.CreatedAt
                                ? new Date(config.CreatedAt)
                                : new Date(),
                          // Đảm bảo trường Report được bao gồm
                          Report: config.report || config.Report || [],
                      }))
                    : [];

                // Fetch new automation rules (Eviction & Routing)
                const rulesResponse = await getAllRulesV2(params.orgId);
                const rulesConfigs =
                    rulesResponse && rulesResponse.code === 0
                        ? (rulesResponse.content || []).map((config) => ({
                              ...config,
                              configType: config.type,
                              isActive: config.status === 1,
                              formattedCreatedAt: config.createdDate
                                  ? new Date(config.createdDate)
                                  : new Date(),
                          }))
                        : [];

                // Kết hợp và sắp xếp
                const combinedConfigs = [...reminderConfigs, ...rulesConfigs];

                // Sắp xếp theo thời gian tạo mới nhất
                combinedConfigs.sort((a, b) => {
                    return b.formattedCreatedAt - a.formattedCreatedAt;
                });

                setConfigList(combinedConfigs);
            } catch (error) {
                console.error("Error fetching automation configs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllConfigs();
    }, [params.orgId, refreshTrigger]);

    // Thêm effect để lắng nghe sự kiện custom refresh
    useEffect(() => {
        // Hàm xử lý sự kiện refresh
        const handleRefreshEvent = () => {
            handleRefreshList();
        };

        // Đăng ký lắng nghe các sự kiện
        window.addEventListener("refresh-reminder-configs", handleRefreshEvent);
        window.addEventListener("refresh-recall-rules", handleRefreshEvent);

        // Hủy đăng ký khi component unmount
        return () => {
            window.removeEventListener(
                "refresh-reminder-configs",
                handleRefreshEvent,
            );
            window.removeEventListener(
                "refresh-recall-rules",
                handleRefreshEvent,
            );
        };
    }, []);

    // Hàm tự refresh danh sách
    const handleRefreshList = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    // Hàm chuyển đổi thời gian (phút) sang giờ:phút
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours} giờ ` : ""}${mins} phút`;
    };

    // Hàm lấy tên workspace từ ID
    const getWorkspaceName = (workspaceId) => {
        const workspace = workspaceList.find((ws) => ws.id === workspaceId);
        return workspace ? workspace.name : "Không xác định";
    };

    // Hàm tìm tên team theo ID (đệ quy)
    const findTeamName = (teams, id) => {
        if (!teams) return null;
        for (const team of teams) {
            if (team.id === id) return team.name;
            if (team.childs && team.childs.length > 0) {
                const found = findTeamName(team.childs, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Lấy workspaceId từ config để fetch stages
    useEffect(() => {
        const fetchStagesForWorkspaces = async () => {
            if (!configList.length || !params.orgId) return;

            // Tạo danh sách workspaceId cần fetch
            const workspaceIds = configList
                .flatMap((config) => {
                    if (
                        config.configType === "reminder" &&
                        config.workspaceIds
                    ) {
                        return config.workspaceIds;
                    } else if (config.configType === "EVICTION") {
                        // Lấy workspaceId từ condition
                        try {
                            const conditions =
                                config.condition.conditions[0].conditions;
                            const workspaceCondition = conditions.find(
                                (condition) =>
                                    condition.columnName === "WorkspaceId",
                            );
                            return workspaceCondition?.extendValues || [];
                        } catch (error) {
                            return [];
                        }
                    }
                    return [];
                })
                .filter(Boolean)
                .filter((value, index, self) => self.indexOf(value) === index); // Unique values

            // Fetch stages cho từng workspace
            const stageMapPromises = workspaceIds.map(async (workspaceId) => {
                await fetchStages(params.orgId, workspaceId);
                return { workspaceId };
            });

            await Promise.all(stageMapPromises);
        };

        fetchStagesForWorkspaces();
    }, [configList, params.orgId, fetchStages]);

    // Hàm lấy tên của giai đoạn từ stageGroups
    const getStageName = (stageId) => {
        for (const group of stageGroups) {
            const stage = group.stages.find((s) => s.id === stageId);
            if (stage) return stage.name;
        }
        return "";
    };

    // Hàm toggle trạng thái config
    const toggleConfigStatus = async (config) => {
        setConfigToToggle(config);
        setToggleAlertOpen(true);
    };

    // Hàm thực hiện toggle sau khi xác nhận
    const handleToggleStatus = async () => {
        if (!configToToggle) return;

        setIsUpdating((prev) => ({ ...prev, [configToToggle.id]: true }));

        ToastPromise(async () => {
            try {
                let response;

                if (configToToggle.configType === "reminder") {
                    response = await toggleReminderConfigStatus(
                        params.orgId,
                        configToToggle.id,
                    );
                } else if (configToToggle.configType === "EVICTION") {
                    // Recall config
                    const newStatus = configToToggle.status === 1 ? 0 : 1;
                    response = await updateStatusEvictionRuleV2(
                        params.orgId,
                        configToToggle.id,
                        { status: newStatus },
                    );
                } else if (configToToggle.configType === "ROUTING") {
                    // Assign ratio config
                    const newStatus = configToToggle.status === 1 ? 0 : 1;
                    response = await updateStatusAssignRatioV2(
                        params.orgId,
                        configToToggle.id,
                        { status: newStatus },
                    );
                }

                if (response) {
                    // Cập nhật state local
                    setConfigList(
                        configList.map((c) =>
                            c.id === configToToggle.id
                                ? {
                                      ...c,
                                      isActive: !c.isActive,
                                      status:
                                          c.configType === "EVICTION" ||
                                          c.configType === "ROUTING"
                                              ? c.status === 1
                                                  ? 0
                                                  : 1
                                              : c.status,
                                  }
                                : c,
                        ),
                    );
                    toast.success(
                        configToToggle.isActive
                            ? "Đã tắt kịch bản"
                            : "Đã kích hoạt kịch bản",
                    );
                    setToggleAlertOpen(false);
                    return true;
                } else {
                    toast.error(
                        response?.message ||
                            "Có lỗi xảy ra khi cập nhật trạng thái",
                    );
                    return false;
                }
            } catch (error) {
                console.error("Error updating config status:", error);
                toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
                return false;
            } finally {
                setIsUpdating((prev) => ({
                    ...prev,
                    [configToToggle.id]: false,
                }));
            }
        });
    };

    // Hàm xử lý xóa config
    const handleDeleteConfig = async () => {
        if (!configToDelete) return;

        ToastPromise(async () => {
            try {
                let response;

                if (configToDelete.configType === "reminder") {
                    response = await deleteReminderConfig(
                        params.orgId,
                        configToDelete.id,
                    );
                } else if (configToDelete.configType === "EVICTION") {
                    // Recall config
                    response = await deleteEvictionRuleV2(
                        params.orgId,
                        configToDelete.id,
                    );
                } else if (configToDelete.configType === "ROUTING") {
                    // Assign ratio config
                    response = await deleteAssignRatioV2(
                        params.orgId,
                        configToDelete.id,
                    );
                }

                if (response) {
                    // Cập nhật state local
                    setConfigList(
                        configList.filter((c) => c.id !== configToDelete.id),
                    );
                    toast.success("Đã xóa kịch bản thành công");
                    setAlertOpen(false);
                    return true;
                } else {
                    toast.error(
                        response?.message || "Có lỗi xảy ra khi xóa kịch bản",
                    );
                    return false;
                }
            } catch (error) {
                console.error("Error deleting config:", error);
                toast.error("Có lỗi xảy ra khi xóa kịch bản");
                return false;
            }
        });
    };

    // Hàm mở config dialog
    const openConfigDialog = (config, e) => {
        e.stopPropagation();
        setSelectedConfig(config);

        if (config.configType === "reminder") {
            setReminderConfigOpen(true);
        } else if (config.configType === "EVICTION") {
            setRecallConfigOpen(true);
        } else if (config.configType === "ROUTING") {
            setAssignRatioOpen(true);
        }
    };

    // Hàm xác nhận xóa config
    const confirmDeleteConfig = (config, e) => {
        e.stopPropagation();
        setConfigToDelete(config);
        setAlertOpen(true);
    };

    // Hàm render card cho mỗi config
    const renderConfigCard = (config) => {
        // Xác định loại config và các thông tin chung
        const configType = config.configType;
        const isActive =
            config.isActive ||
            ((configType === "EVICTION" || configType === "ROUTING") &&
                config.status === 1);

        let workspaceName;
        let configTitle;
        let durationText;
        let description;
        let scopeText = "";

        if (configType === "reminder") {
            // Config nhắc hẹn
            workspaceName =
                config.workspaceIds && config.workspaceIds.length > 0
                    ? getWorkspaceName(config.workspaceIds[0])
                    : "Không xác định";

            scopeText = `Tại không gian làm việc: ${workspaceName}`;

            durationText = formatDuration(config.time || config.Time);

            // Hiển thị thông tin stages nếu có
            const getStageText = () => {
                if (!config.stages || config.stages.length === 0) {
                    return "bất kỳ trạng thái";
                }

                // Lấy danh sách tên của các trạng thái
                const stageNames = config.stages
                    .map((stageId) => getStageName(stageId))
                    .filter(Boolean);

                if (stageNames.length === 0) {
                    return "bất kỳ trạng thái";
                }

                return stageNames.join(", ");
            };

            // Cập nhật format tiêu đề theo yêu cầu mới
            configTitle = `Gửi thông báo sau ${durationText} tiếp nhận khách hàng`;
            description = `thuộc ${getStageText()}`;
        } else {
            // Config thu hồi lead hoặc phân phối
            if (config.scope === "TEAM") {
                const teamIds = config.arrayScopeTargets || [];
                const teamNames = teamIds
                    .map((id) => findTeamName(teamList, id))
                    .filter(Boolean);

                const teamNameDisplay =
                    teamNames.length > 0
                        ? teamNames.join(", ")
                        : "Không xác định";

                const conditions = config.condition.conditions[0].conditions;
                const workspaceCondition = conditions.find(
                    (condition) => condition.columnName === "WorkspaceId",
                );
                const workspaceId = workspaceCondition?.extendValues?.[0] || "";
                const wsName = getWorkspaceName(workspaceId);

                scopeText =
                    wsName === "Không xác định"
                        ? `Áp dụng cho đội sale ${teamNameDisplay}`
                        : `Áp dụng cho không gian làm việc ${wsName} đội sale ${teamNameDisplay}`;
            } else if (config.scope === "ORGANIZATION") {
                const category = config?.category?.toLowerCase();
                if (category === "deal" || category === "deals") {
                    try {
                        const conditions =
                            config.condition.conditions[0].conditions;
                        const workspaceCondition = conditions.find(
                            (condition) =>
                                condition.columnName === "WorkspaceId",
                        );
                        const workspaceId =
                            workspaceCondition?.extendValues?.[0] || "";
                        const wsName = getWorkspaceName(workspaceId);
                        scopeText = `Áp dụng cho không gian làm việc ${wsName}`;
                    } catch (e) {
                        scopeText =
                            "Áp dụng cho không gian làm việc: Không xác định";
                    }
                } else {
                    scopeText = "Áp dụng cho tổ chức";
                }
            } else if (config.scope === "USER") {
                scopeText = "Áp dụng cho thành viên";
            } else {
                try {
                    const conditions =
                        config.condition.conditions[0].conditions;
                    const workspaceCondition = conditions.find(
                        (condition) => condition.columnName === "WorkspaceId",
                    );
                    const workspaceId =
                        workspaceCondition?.extendValues?.[0] || "";
                    workspaceName = getWorkspaceName(workspaceId);
                    scopeText =
                        wsName === "Không xác định"
                            ? "Áp dụng cho tổ chức"
                            : `Áp dụng cho không gian làm việc ${wsName}`;
                } catch (error) {
                    workspaceName = "Không xác định";
                    scopeText = `Áp dụng cho không gian làm việc: ${workspaceName}`;
                }
            }

            durationText = formatDuration(config.duration);

            // Kiểm tra trạng thái chăm sóc
            const getStageUpdateText = () => {
                if (!config.stages || config.stages.length === 0) {
                    return "không cập nhật trạng thái chăm sóc";
                }

                // Nếu chỉ có 1 stage với ID 00000000-0000-0000-0000-000000000000
                if (
                    config.stages.length === 1 &&
                    config.stages[0]?.stageId ===
                        "00000000-0000-0000-0000-000000000000"
                ) {
                    return "không cập nhật trạng thái chăm sóc";
                }

                // Lấy danh sách tên của các trạng thái
                const stageNames = config.stages
                    .map((stage) => getStageName(stage.stageId))
                    .filter(Boolean);

                if (stageNames.length === 0) {
                    return "chuyển trạng thái chăm sóc";
                }

                return `chuyển trạng thái chăm sóc sang ${stageNames.join(
                    ", ",
                )}`;
            };

            configTitle =
                config.type.toLowerCase() === "eviction"
                    ? `Thu hồi ${
                          config.category.toLowerCase() == "lead"
                              ? "Cơ hội"
                              : "Giao dịch"
                      } sau ${durationText}`
                    : `Phân phối ${
                          config.category.toLowerCase() == "lead"
                              ? "Cơ hội"
                              : "Giao dịch"
                      } sau ${durationText}`;
            description = getStageUpdateText();
        }

        // Hàm rút gọn text nếu quá dài
        const truncateText = (text, maxLength = 25) => {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        };

        // Lấy nội dung trạng thái và kiểm tra độ dài
        const needsTruncation = description.length > 50;
        const displayText = needsTruncation
            ? truncateText(description, 50)
            : description;

        return (
            <Card
                key={config.id}
                className={`transition-all ${
                    isActive ? "bg-primary" : "bg-bg1"
                } cursor-pointer group`}
                onClick={(e) => openConfigDialog(config, e)}
            >
                <CardContent className="p-4 min-h-[160px] relative">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            {configType === "reminder" ? (
                                <Badge
                                    variant="outline"
                                    className={`${
                                        isActive
                                            ? "border-white text-white"
                                            : "border-gray-500 text-gray-500"
                                    }`}
                                >
                                    <MdAlarmOn className="mr-1" /> Nhắc hẹn
                                </Badge>
                            ) : configType === "ROUTING" ? (
                                <Badge
                                    variant="outline"
                                    className={`${
                                        isActive
                                            ? "border-white text-white"
                                            : "border-gray-500 text-gray-500"
                                    }`}
                                >
                                    <MdCallMerge className="mr-1" /> Phân phối
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className={`${
                                        isActive
                                            ? "border-white text-white"
                                            : "border-gray-500 text-gray-500"
                                    }`}
                                >
                                    <MdAssignmentReturned className="mr-1" />{" "}
                                    Thu hồi
                                </Badge>
                            )}

                            {/* Icon giờ làm việc - Hiển thị cho mọi reminder config và recall có hourFrame */}
                            {(configType === "reminder" ||
                                (configType === "EVICTION" &&
                                    config.hourFrame?.length > 0)) && (
                                <TooltipProvider>
                                    <Tooltip
                                        content={
                                            <p>
                                                Chỉ hoạt động trong giờ làm việc
                                            </p>
                                        }
                                    >
                                        <div className="flex">
                                            <MdAccessTime
                                                className={`text-lg ${
                                                    isActive
                                                        ? "text-white"
                                                        : "text-gray-500"
                                                }`}
                                            />
                                        </div>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {/* Icon lặp lại - Hiển thị cho reminder có repeat>0 hoặc recall có notifications */}
                            {((configType === "reminder" &&
                                (config.repeat > 0 || config.Repeat > 0)) ||
                                (configType === "EVICTION" &&
                                    config.notifications?.length > 0)) && (
                                <TooltipProvider>
                                    <Tooltip content={<p>Lặp lại nhiều lần</p>}>
                                        <div className="flex">
                                            <MdLoop
                                                className={`text-lg ${
                                                    isActive
                                                        ? "text-white"
                                                        : "text-gray-500"
                                                }`}
                                            />
                                        </div>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>

                        <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleConfigStatus(config)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={isUpdating[config.id]}
                            className={`${
                                isActive ? "bg-white" : ""
                            } data-[state=checked]:bg-[#9B8CF7]`}
                        />
                    </div>

                    <div className="flex flex-col mt-1">
                        <div className="flex-1">
                            {configType === "reminder" ? (
                                // Hiển thị format mới cho reminder
                                needsTruncation ? (
                                    <TooltipProvider>
                                        <Tooltip
                                            content={
                                                <p>
                                                    {configTitle} {description}
                                                </p>
                                            }
                                        >
                                            <p
                                                className={`text-base font-medium ${
                                                    isActive
                                                        ? "text-white"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                {configTitle} {displayText}
                                            </p>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <p
                                        className={`text-base font-medium ${
                                            isActive
                                                ? "text-white"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {configTitle} {displayText}
                                    </p>
                                )
                            ) : // Giữ nguyên format cho recall
                            needsTruncation ? (
                                <TooltipProvider>
                                    <Tooltip
                                        content={
                                            <p>
                                                {configTitle}: {description}
                                            </p>
                                        }
                                    >
                                        <p
                                            className={`text-base font-medium ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {configTitle}: {displayText}
                                        </p>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <p
                                    className={`text-base font-medium ${
                                        isActive
                                            ? "text-white"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {configTitle}: {displayText}
                                </p>
                            )}

                            <p
                                className={`text-sm mt-1 ${
                                    isActive ? "text-white/80" : "text-gray-600"
                                }`}
                            >
                                {scopeText}
                            </p>

                            {/* Hiển thị thống kê cho cả reminder và recall config */}
                            {/* Hiển thị thống kê cho config recall */}
                            {configType === "EVICTION" &&
                                config.statistics &&
                                config.statistics.length > 0 && (
                                    <div
                                        className={`absolute bottom-3 left-4 flex gap-3 ${
                                            isActive
                                                ? "text-white/90"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        {config.statistics.map(
                                            (stat, index) => {
                                                // Chọn icon dựa vào tên thống kê
                                                let icon;
                                                if (stat.name === "Đã hủy") {
                                                    icon = (
                                                        <MdDoNotDisturbOn className="mr-1" />
                                                    );
                                                } else if (
                                                    stat.name === "Chờ thu hồi"
                                                ) {
                                                    icon = (
                                                        <MdHourglassEmpty className="mr-1" />
                                                    );
                                                } else if (
                                                    stat.name === "Đã thu hồi"
                                                ) {
                                                    icon = (
                                                        <MdAssignmentTurnedIn className="mr-1" />
                                                    );
                                                }

                                                return (
                                                    <TooltipProvider
                                                        key={index}
                                                    >
                                                        <Tooltip
                                                            content={
                                                                <p>
                                                                    {stat.name}
                                                                </p>
                                                            }
                                                        >
                                                            <div
                                                                className={`flex items-center ${
                                                                    isActive
                                                                        ? "bg-white/20"
                                                                        : "bg-black/10"
                                                                } rounded-full px-2 py-0.5`}
                                                            >
                                                                {icon}
                                                                <span className="text-xs font-medium">
                                                                    {
                                                                        stat.numberItem
                                                                    }
                                                                </span>
                                                            </div>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                            {/* Hiển thị thống kê cho config reminder từ trường Report */}
                            {configType === "reminder" &&
                                config.Report &&
                                config.Report.length > 0 && (
                                    <div
                                        className={`absolute bottom-3 left-4 flex gap-3 ${
                                            isActive
                                                ? "text-white/90"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        {config.Report.map((stat, index) => {
                                            // Chọn icon dựa vào tên thống kê
                                            let icon;
                                            if (stat.Name === "Đã hủy") {
                                                icon = (
                                                    <MdDoNotDisturbOn className="mr-1" />
                                                );
                                            } else if (
                                                stat.Name === "Chờ xử lý"
                                            ) {
                                                icon = (
                                                    <MdHourglassEmpty className="mr-1" />
                                                );
                                            } else if (
                                                stat.Name === "Đã xử lý"
                                            ) {
                                                icon = (
                                                    <MdAssignmentTurnedIn className="mr-1" />
                                                );
                                            }

                                            return (
                                                <TooltipProvider key={index}>
                                                    <Tooltip
                                                        content={
                                                            <p>{stat.Name}</p>
                                                        }
                                                    >
                                                        <div
                                                            className={`flex items-center ${
                                                                isActive
                                                                    ? "bg-white/20"
                                                                    : "bg-black/10"
                                                            } rounded-full px-2 py-0.5`}
                                                        >
                                                            {icon}
                                                            <span className="text-xs font-medium">
                                                                {
                                                                    stat.NumberItem
                                                                }
                                                            </span>
                                                        </div>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })}
                                    </div>
                                )}
                        </div>
                    </div>
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`absolute right-3 bottom-3 p-1 h-7 w-7 ${
                                isActive
                                    ? "text-white hover:text-white/80 hover:bg-primary-foreground/10"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={(e) => confirmDeleteConfig(config, e)}
                        >
                            <MdOutlineDelete className="text-lg text-red-500" />
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="mb-6 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="mb-4 bg-bg1 border-0">
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-5/6 mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-2 ml-6" />
                                <Skeleton className="h-4 w-3/4 ml-6" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : configList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configList.map((config) => renderConfigCard(config))}
                </div>
            ) : (
                <p className="text-gray-500">
                    Chưa có kịch bản automation nào.
                </p>
            )}

            {/* Dialog chỉnh sửa nhắc hẹn */}
            {reminderConfigOpen && selectedConfig && (
                <ReminderConfigDialog
                    open={reminderConfigOpen}
                    setOpen={setReminderConfigOpen}
                    editMode={true}
                    ruleData={selectedConfig}
                    onSuccess={handleRefreshList}
                    canSave={canCreate}
                />
            )}

            {/* Dialog chỉnh sửa thu hồi */}
            {recallConfigOpen && selectedConfig && (
                <RecallConfigDialogNew
                    open={recallConfigOpen}
                    setOpen={setRecallConfigOpen}
                    editMode={true}
                    ruleData={selectedConfig}
                    onSuccess={handleRefreshList}
                    canSave={canCreate}
                />
            )}

            {/* Dialog chỉnh sửa phân phối */}
            {assignRatioOpen && selectedConfig && (
                <AssignRatioDialog
                    open={assignRatioOpen}
                    setOpen={setAssignRatioOpen}
                    editMode={true}
                    ruleData={selectedConfig}
                    onSuccess={handleRefreshList}
                    canSave={canCreate}
                />
            )}

            {/* Alert Dialog xác nhận xóa */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa kịch bản
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>Bạn có chắc chắn muốn xóa kịch bản này?</p>
                            {configToDelete?.configType === "EVICTION" && (
                                <p>
                                    Lưu ý: Mọi hàng đợi xử lý đang chờ của kịch
                                    bản này sẽ bị hủy hoàn toàn.
                                </p>
                            )}
                            <p>
                                Hành động này không thể hoàn tác sau khi thực
                                hiện.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfig}
                            className="bg-red-400 hover:bg-red-500"
                        >
                            Xóa kịch bản
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog xác nhận bật/tắt */}
            <AlertDialog
                open={toggleAlertOpen}
                onOpenChange={setToggleAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        {configToToggle?.isActive ? (
                            <AlertDialogTitle>
                                Xác nhận tắt kịch bản
                            </AlertDialogTitle>
                        ) : (
                            <AlertDialogTitle>
                                Xác nhận kích hoạt kịch bản
                            </AlertDialogTitle>
                        )}
                        <AlertDialogDescription className="space-y-2">
                            {configToToggle?.isActive ? (
                                <>
                                    <p>
                                        Bạn có chắc chắn muốn tắt kịch bản này?
                                    </p>
                                    {configToToggle?.configType ===
                                        "EVICTION" && (
                                        <p>
                                            Lưu ý: Khi tắt kịch bản, mọi hàng
                                            đợi đang xử lý và chờ xử lý sẽ bị
                                            hủy bỏ.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>
                                    Bạn có chắc chắn muốn kích hoạt kịch bản
                                    này?
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            className={
                                configToToggle?.isActive
                                    ? "bg-red-400 hover:bg-red-500"
                                    : "bg-green-400 hover:bg-green-500"
                            }
                        >
                            {configToToggle?.isActive
                                ? "Tắt kịch bản"
                                : "Kích hoạt kịch bản"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

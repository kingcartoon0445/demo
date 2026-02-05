"use client";

import { useEffect, useState } from "react";
import {
    getEvictionRuleListV2,
    updateEvictionRuleV2,
    deleteEvictionRuleV2,
    updateStatusEvictionRuleV2,
    getDetailEvictionRuleV2,
} from "@/api/automationV2";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MdLoop,
    MdAccessTime,
    MdOutlineNotifications,
    MdDelete,
    MdOutlineDelete,
    MdCancel,
    MdSchedule,
    MdAssignmentReturned,
    MdDoNotDisturbOn,
    MdHourglassEmpty,
    MdAssignmentTurnedIn,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToastPromise } from "@/components/toast";
import toast from "react-hot-toast";
import RecallConfigDialog from "./RecallConfigDialog";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStageStore } from "@/store/stage";

export default function RecallRuleList({ refreshTrigger }) {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [ruleList, setRuleList] = useState([]);
    const [configOpen, setConfigOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [isUpdating, setIsUpdating] = useState({});
    const { workspaceList } = useWorkspaceList();
    const [alertOpen, setAlertOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState(null);
    const [toggleAlertOpen, setToggleAlertOpen] = useState(false);
    const [ruleToToggle, setRuleToToggle] = useState(null);
    const { stageGroups, fetchStages } = useStageStore();
    const [workspaceStageMap, setWorkspaceStageMap] = useState({});

    useEffect(() => {
        const fetchRules = async () => {
            setLoading(true);
            try {
                const response = await getEvictionRuleListV2(params.orgId);
                if (response && response.code === 0) {
                    setRuleList(response.content || []);
                }
            } catch (error) {
                console.error("Error fetching eviction rules:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRules();
    }, [params.orgId, refreshTrigger]);

    // Thêm effect để lắng nghe sự kiện custom refresh
    useEffect(() => {
        // Hàm xử lý sự kiện
        const handleRefreshEvent = () => {
            handleRefreshList();
        };

        // Đăng ký lắng nghe sự kiện
        window.addEventListener("refresh-recall-rules", handleRefreshEvent);

        // Hủy đăng ký khi component unmount
        return () => {
            window.removeEventListener(
                "refresh-recall-rules",
                handleRefreshEvent
            );
        };
    }, []);

    // Hàm tự refresh danh sách
    const handleRefreshList = () => {
        setLoading(true); // Bắt đầu loading để hiển thị skeleton
        const fetchRules = async () => {
            try {
                const response = await getEvictionRuleListV2(params.orgId);
                if (response && response.code === 0) {
                    setRuleList(response.content || []);
                } else {
                    console.error("Error with API response:", response);
                }
            } catch (error) {
                console.error("Error refreshing eviction rules:", error);
            } finally {
                setLoading(false); // Kết thúc loading
            }
        };

        fetchRules();
    };

    // Hàm chuyển đổi duration (phút) sang giờ:phút
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} giờ ${mins} phút`;
    };

    // Hàm lấy tên workspace từ ID
    const getWorkspaceName = (workspaceId) => {
        const workspace = workspaceList.find((ws) => ws.id === workspaceId);
        return workspace ? workspace.name : "Không xác định";
    };

    // Hàm lấy workspaceId từ condition
    const getWorkspaceId = (rule) => {
        try {
            const conditions = rule.condition.conditions[0].conditions;
            const workspaceCondition = conditions.find(
                (condition) => condition.columnName === "WorkspaceId"
            );
            return workspaceCondition?.extendValues?.[0] || "";
        } catch (error) {
            return "";
        }
    };

    // Lấy workspaceId từ rule để fetch stages
    useEffect(() => {
        const fetchStagesForWorkspaces = async () => {
            if (!ruleList.length || !params.orgId) return;

            // Tạo danh sách workspaceId cần fetch
            const workspaceIds = ruleList
                .map((rule) => getWorkspaceId(rule))
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
    }, [ruleList, params.orgId, fetchStages]);

    // Hàm lấy tên của giai đoạn từ stageGroups
    const getStageName = (stageId) => {
        for (const group of stageGroups) {
            const stage = group.stages.find((s) => s.id === stageId);
            if (stage) return stage.name;
        }
        return "";
    };

    // Hàm toggle trạng thái kịch bản
    const toggleRuleStatus = async (rule) => {
        setRuleToToggle(rule);
        setToggleAlertOpen(true);
    };

    // Hàm thực hiện toggle sau khi xác nhận
    const handleToggleStatus = async () => {
        if (!ruleToToggle) return;

        setIsUpdating((prev) => ({ ...prev, [ruleToToggle.id]: true }));
        const newStatus = ruleToToggle.status === 1 ? 0 : 1;

        ToastPromise(async () => {
            try {
                const response = await updateStatusEvictionRuleV2(
                    params.orgId,
                    ruleToToggle.id,
                    { status: newStatus }
                );
                if (response && response.code === 0) {
                    // Cập nhật state local
                    setRuleList(
                        ruleList.map((r) =>
                            r.id === ruleToToggle.id
                                ? { ...r, status: newStatus }
                                : r
                        )
                    );
                    toast.success(
                        newStatus === 1
                            ? "Đã kích hoạt kịch bản"
                            : "Đã tắt kịch bản"
                    );
                    setToggleAlertOpen(false);
                    return true;
                } else {
                    toast.error(
                        response?.message ||
                            "Có lỗi xảy ra khi cập nhật trạng thái"
                    );
                    return false;
                }
            } catch (error) {
                console.error("Error updating rule status:", error);
                toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
                return false;
            } finally {
                setIsUpdating((prev) => ({
                    ...prev,
                    [ruleToToggle.id]: false,
                }));
            }
        });
    };

    // Hàm xử lý xóa rule
    const handleDeleteRule = async () => {
        if (!ruleToDelete) return;

        ToastPromise(async () => {
            try {
                const response = await deleteEvictionRuleV2(
                    params.orgId,
                    ruleToDelete.id
                );
                if (response && response.code === 0) {
                    // Cập nhật state local
                    setRuleList(
                        ruleList.filter((r) => r.id !== ruleToDelete.id)
                    );
                    toast.success("Đã xóa kịch bản thành công");
                    setAlertOpen(false);
                    return true;
                } else {
                    toast.error(
                        response?.message || "Có lỗi xảy ra khi xóa kịch bản"
                    );
                    return false;
                }
            } catch (error) {
                console.error("Error deleting rule:", error);
                toast.error("Có lỗi xảy ra khi xóa kịch bản");
                return false;
            }
        });
    };

    // Hàm mở config dialog
    const openConfigDialog = async (rule, e) => {
        e.stopPropagation();
        try {
            // Lấy chi tiết rule từ API
            const response = await getDetailEvictionRuleV2(
                params.orgId,
                rule.id
            );
            if (response && response.code === 0 && response.content) {
                setSelectedRule(response.content);
                setConfigOpen(true);
            } else {
                toast.error("Không thể lấy thông tin chi tiết của kịch bản");
            }
        } catch (error) {
            console.error("Error fetching rule details:", error);
            toast.error("Có lỗi xảy ra khi lấy thông tin chi tiết kịch bản");
        }
    };

    // Hàm xác nhận xóa rule
    const confirmDeleteRule = (rule, e) => {
        e.stopPropagation();
        setRuleToDelete(rule);
        setAlertOpen(true);
    };

    // Hàm render card cho mỗi rule
    const renderRuleCard = (rule) => {
        const workspaceId = getWorkspaceId(rule);
        const workspaceName = getWorkspaceName(workspaceId);
        const isActive = rule.status === 1;

        // Kiểm tra trạng thái chăm sóc
        const getStageUpdateText = () => {
            if (!rule.stages || rule.stages.length === 0) {
                return "không cập nhật trạng thái chăm sóc";
            }

            // Nếu chỉ có 1 stage với ID 00000000-0000-0000-0000-000000000000
            if (
                rule.stages.length === 1 &&
                rule.stages[0]?.stageId ===
                    "00000000-0000-0000-0000-000000000000"
            ) {
                return "không cập nhật trạng thái chăm sóc";
            }

            // Lấy danh sách tên của các trạng thái
            const stageNames = rule.stages
                .map((stage) => getStageName(stage.stageId))
                .filter(Boolean);

            if (stageNames.length === 0) {
                return "chuyển trạng thái chăm sóc";
            }

            return `chuyển trạng thái chăm sóc sang ${stageNames.join(", ")}`;
        };

        // Hàm rút gọn text nếu quá dài
        const truncateText = (text, maxLength = 25) => {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        };

        // Lấy nội dung trạng thái và kiểm tra độ dài
        const stageUpdateText = getStageUpdateText();
        const needsTruncation = stageUpdateText.length > 50;
        const displayText = needsTruncation
            ? truncateText(stageUpdateText, 50)
            : stageUpdateText;

        return (
            <Card
                key={rule.id}
                className={`transition-all border-0 ${
                    isActive ? "bg-primary" : "bg-bg1"
                } cursor-pointer hover:shadow-md group`}
                onClick={(e) => openConfigDialog(rule, e)}
            >
                <CardContent className="p-4 min-h-[160px] relative">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex">
                                <MdLoop
                                    className={`text-lg ${
                                        isActive
                                            ? "text-white"
                                            : "text-gray-500"
                                    }`}
                                />
                            </div>

                            {rule?.hourFrame?.length > 0 && (
                                <div className="flex">
                                    <MdAccessTime
                                        className={`text-lg ${
                                            isActive
                                                ? "text-white"
                                                : "text-gray-500"
                                        }`}
                                    />
                                </div>
                            )}

                            {rule?.notifications?.length > 0 && (
                                <div className="flex">
                                    <MdOutlineNotifications
                                        className={`text-lg ${
                                            isActive
                                                ? "text-white"
                                                : "text-gray-500"
                                        }`}
                                    />
                                </div>
                            )}
                        </div>

                        <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleRuleStatus(rule)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={isUpdating[rule.id]}
                            className={`${isActive ? "bg-white" : ""}`}
                        />
                    </div>

                    <div className="flex items-end mt-1">
                        <div className="flex-1">
                            {needsTruncation ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p
                                                className={`text-base font-medium ${
                                                    isActive
                                                        ? "text-white"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                Thu hồi Lead sau{" "}
                                                {formatDuration(rule.duration)}{" "}
                                                {displayText}
                                                tại không gian làm việc:{" "}
                                                {workspaceName}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Thu hồi Lead sau{" "}
                                                {formatDuration(rule.duration)}{" "}
                                                {stageUpdateText}
                                                tại không gian làm việc:{" "}
                                                {workspaceName}
                                            </p>
                                        </TooltipContent>
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
                                    {/* Thu hồi Lead sau{" "}
                                    {formatDuration(rule.duration)}{" "}
                                    {displayText} */}
                                    {rule.title}
                                    tại không gian làm việc: {workspaceName}
                                </p>
                            )}
                        </div>

                        {/* Thêm phần hiển thị thống kê */}
                        {rule?.statistics && rule.statistics.length > 0 && (
                            <div
                                className={`absolute bottom-3 left-4 flex gap-3 ${
                                    isActive ? "text-white/90" : "text-gray-600"
                                }`}
                            >
                                {rule.statistics.map((stat, index) => {
                                    // Chọn icon dựa vào tên thống kê
                                    let icon;
                                    if (stat.name === "Đã hủy") {
                                        icon = (
                                            <MdDoNotDisturbOn className="mr-1" />
                                        );
                                    } else if (stat.name === "Chờ thu hồi") {
                                        icon = (
                                            <MdHourglassEmpty className="mr-1" />
                                        );
                                    } else if (stat.name === "Đã thu hồi") {
                                        icon = (
                                            <MdAssignmentTurnedIn className="mr-1" />
                                        );
                                    }

                                    return (
                                        <TooltipProvider key={index}>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={`flex items-center ${
                                                            isActive
                                                                ? "bg-white/20"
                                                                : "bg-black/10"
                                                        } rounded-full px-2 py-0.5`}
                                                    >
                                                        {icon}
                                                        <span className="text-xs font-medium">
                                                            {stat.numberItem}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{stat.name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-3 bottom-3 p-1 h-7 w-7 ${
                            isActive
                                ? "text-white hover:text-white/80 hover:bg-primary-foreground/10"
                                : "text-gray-500 hover:text-gray-700"
                        } opacity-0 group-hover:opacity-100 transition-opacity`}
                        onClick={(e) => confirmDeleteRule(rule, e)}
                    >
                        <MdOutlineDelete className="text-lg text-red-500" />
                    </Button>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="mb-6">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="mb-4 bg-bg1 border-0">
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-5/6 mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-2 ml-6" />
                                <Skeleton className="h-4 w-3/4 ml-6" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : ruleList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ruleList.map((rule) => renderRuleCard(rule))}
                </div>
            ) : (
                <p className="text-gray-500">
                    Chưa có kịch bản thu hồi lead nào.
                </p>
            )}

            {/* Dialog chỉnh sửa */}
            {configOpen && selectedRule && (
                <RecallConfigDialog
                    open={configOpen}
                    setOpen={setConfigOpen}
                    editMode={true}
                    ruleData={selectedRule}
                    onSuccess={handleRefreshList}
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
                            <p>
                                Bạn có chắc chắn muốn xóa kịch bản thu hồi này?
                            </p>
                            <p>
                                Lưu ý: Mọi hàng đợi xử lý đang chờ của kịch bản
                                này sẽ bị hủy hoàn toàn.
                            </p>
                            <p>
                                Hành động này không thể hoàn tác sau khi thực
                                hiện.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRule}
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
                        {ruleToToggle?.status === 1 ? (
                            <AlertDialogTitle>
                                Xác nhận tắt kịch bản thu hồi
                            </AlertDialogTitle>
                        ) : (
                            <AlertDialogTitle>
                                Xác nhận kích hoạt kịch bản
                            </AlertDialogTitle>
                        )}
                        <AlertDialogDescription className="space-y-2">
                            {ruleToToggle?.status === 1 ? (
                                <>
                                    <p>
                                        Bạn có chắc chắn muốn tắt kịch bản thu
                                        hồi lead này?
                                    </p>
                                    <p>
                                        Lưu ý: Khi tắt kịch bản, mọi hàng đợi
                                        đang xử lý và chờ xử lý sẽ bị hủy bỏ.
                                    </p>
                                </>
                            ) : (
                                <p>
                                    Bạn có chắc chắn muốn kích hoạt kịch bản thu
                                    hồi lead này?
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            className={
                                ruleToToggle?.status === 1
                                    ? "bg-red-400 hover:bg-red-500"
                                    : "bg-green-400 hover:bg-green-500"
                            }
                        >
                            {ruleToToggle?.status === 1
                                ? "Tắt kịch bản"
                                : "Kích hoạt kịch bản"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

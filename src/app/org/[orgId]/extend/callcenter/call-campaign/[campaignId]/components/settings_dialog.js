import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { useEffect, useState } from "react";
import {
    getCallcenterLineList,
    getCallcenterMembers,
    updateCallcampaign,
} from "@/api/callcenter";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { stageObject } from "@/lib/customerConstants";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { BsQuestionCircle } from "react-icons/bs";

const checkboxOptions = [
    {
        id: "after5pm",
        label: "Gọi điện trước 8h và sau 17h",
        key: "isAllowCallsOutside",
    },
    {
        id: "autocare",
        label: 'Không yêu cầu nhân viên báo cáo (Tự động "Quan tâm" cho cuộc gọi kết nối thành công)',
        key: "isAutoUpdateStage",
    },
    {
        id: "autocreate",
        label: "Tự động tạo khách hàng cho cuộc gọi có kết quả Đồng ý",
    },
    {
        id: "allowrecall",
        label: "Cho phép nhân viên tự quay số khi gọi",
        key: "isAllowManualDialing",
    },
    {
        id: "autohangup",
        label: "Tự kết thúc nếu khách hàng không nghe máy sau x giây",
        key: "isAutoEndIfNoAnswer",
    },
];

const getTimeType = (hours) => {
    if (hours >= 8760) return { time: hours / 8760, type: "years" };
    if (hours >= 720) return { time: hours / 720, type: "months" };
    return { time: hours, type: "hours" };
};

export default function SettingsDialog({
    open,
    onOpenChange,
    campaign,
    orgId,
    setRefresh,
}) {
    const { workspaceList } = useWorkspaceList();
    const [formData, setFormData] = useState({
        name: "",
        staff: [],
        phone: "",
        retryCount: 2,
        retryTime: 1,
        retryType: "hours",
        settings: {
            after5pm: false,
            autocare: false,
            autocreate: false,
            allowrecall: false,
            autohangup: false,
        },
        rules: {
            stageIds: [],
            workspaceId: undefined,
        },
    });

    const [phoneLines, setPhoneLines] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);

    useEffect(() => {
        if (open && campaign) {
            const timeSettings = getTimeType(campaign.failureRetryDelay || 1);
            setFormData({
                name: campaign.title,
                phone: campaign.packageUsageId,
                staff: campaign.users?.map((user) => user.profileId) || [],
                retryCount: campaign.retryCountOnFailure || 2,
                retryTime: timeSettings.time,
                retryType: timeSettings.type,
                settings: {
                    after5pm: campaign.isAllowCallsOutside || false,
                    autocare: campaign.isAutoUpdateStage || false,
                    allowrecall: campaign.isAllowManualDialing || false,
                    autohangup: campaign.isAutoEndIfNoAnswer || false,
                },
                rules: {
                    stageIds: campaign.rules?.stageIds || [],
                    workspaceId: campaign.rules?.workspaceId || undefined,
                },
            });
        }
    }, [campaign, open]);

    useEffect(() => {
        if (open) {
            getCallcenterLineList(orgId).then((res) => {
                if (res?.content) {
                    setPhoneLines(res.content);
                }
            });
        }
    }, [open, orgId]);

    useEffect(() => {
        if (open && formData.phone) {
            const params = { limit: 9999, offset: 0, isActive: true };
            getCallcenterMembers(orgId, formData.phone, params).then((res) => {
                if (res?.content) {
                    setStaffList(res.content);
                }
            });
        }
    }, [open, formData.phone, orgId]);

    const getTimeNumber = (time, value) => {
        if (time === "hours") return value;
        if (time === "months") return value * 720;
        if (time === "years") return value * 8760;
        return value;
    };

    const handleSave = async () => {
        const body = {
            title: formData.name,
            packageUsageId: formData.phone,
            retryCountOnFailure: Number(formData.retryCount),
            failureRetryDelay: getTimeNumber(
                formData.retryType,
                formData.retryTime
            ),
            profileIds: formData.staff,
            isAllowCallsOutside: formData.settings.after5pm,
            isAutoUpdateStage: formData.settings.autocare,
            isAllowManualDialing: formData.settings.allowrecall,
            isAutoEndIfNoAnswer: formData.settings.autohangup,
            rules: {
                stageIds: formData.rules.stageIds,
                workspaceId: formData.rules.workspaceId,
            },
        };

        const res = await updateCallcampaign(orgId, campaign.id, body);
        if (res.code === 0) {
            toast.success("Cập nhật thành công");
            onOpenChange(false);
            setRefresh((prev) => !prev);
        } else {
            toast.error(res?.message || "Có lỗi xảy ra");
        }
    };

    const staffOptions = staffList.map((staff) => ({
        value: staff.profileId,
        label: staff.fullName,
        labelGroup: "Nhân viên",
    }));

    const stageOptions = Object.values(stageObject).flatMap((group) =>
        group.data.map((stage) => ({
            value: stage.id,
            label: stage.name,
            labelGroup: group.name,
        }))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Cài đặt chiến dịch</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[90dvh] overflow-y-auto">
                    <div className="space-y-2">
                        <Label className="text-sm">
                            Tên chiến dịch{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm">
                            Chọn đầu số sử dụng{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.phone}
                            onValueChange={(value) =>
                                setFormData({ ...formData, phone: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn đầu số" />
                            </SelectTrigger>
                            <SelectContent>
                                {phoneLines.map((line) => (
                                    <SelectItem
                                        key={line.packageUsageId}
                                        value={line.packageUsageId}
                                    >
                                        {line.phoneNumber}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm">
                            Danh sách nhân viên{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <MultiSelect
                            options={staffOptions}
                            selected={formData.staff}
                            onChange={(value) =>
                                setFormData({ ...formData, staff: value })
                            }
                            className="w-full"
                            disabled={!formData.phone}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                            <Label className="text-sm">
                                Cấu hình phân phối
                            </Label>
                            <TooltipProvider>
                                <Tooltip
                                    content={
                                        <p className="max-w-sm">
                                            Cấu hình cho phép hệ thống tự động
                                            chuyển khách hàng có một trong các
                                            trạng thái chăm sóc được chọn về
                                            nhóm làm việc
                                        </p>
                                    }
                                >
                                    <BsQuestionCircle className="text-muted-foreground w-4 h-4" />
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="space-y-4 bg-bg1 px-4 py-3 rounded-xl">
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    Chọn trạng thái
                                </Label>
                                <MultiSelect
                                    options={stageOptions}
                                    selected={formData.rules.stageIds}
                                    onChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            rules: {
                                                ...prev.rules,
                                                stageIds: value,
                                            },
                                        }))
                                    }
                                    className="w-full"
                                    placeholder="Chọn trạng thái để kích hoạt phân phối"
                                />
                            </div>

                            {formData.rules.stageIds.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Chọn nhóm làm việc
                                    </Label>
                                    <Select
                                        value={formData.rules.workspaceId}
                                        onValueChange={(value) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                rules: {
                                                    ...prev.rules,
                                                    workspaceId: value,
                                                },
                                            }));
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn nhóm làm việc" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {workspaceList?.map((workspace) => (
                                                <SelectItem
                                                    key={workspace.id}
                                                    value={workspace.id}
                                                >
                                                    {workspace.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm">
                                Số lần gọi lại khi kết nối thất bại
                            </Label>
                            <Input
                                type="number"
                                value={formData.retryCount}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        retryCount: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Thời gian gọi lại</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={formData.retryTime}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            retryTime: e.target.value,
                                        })
                                    }
                                    className="w-2/3"
                                />
                                <Select
                                    value={formData.retryType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            retryType: value,
                                        })
                                    }
                                    className="w-1/3"
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hours">
                                            Giờ
                                        </SelectItem>
                                        <SelectItem value="months">
                                            Tháng
                                        </SelectItem>
                                        <SelectItem value="years">
                                            Năm
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {checkboxOptions.map((option) => (
                            <div
                                key={option.id}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    id={option.id}
                                    checked={formData.settings[option.id]}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            settings: {
                                                ...formData.settings,
                                                [option.id]: checked,
                                            },
                                        })
                                    }
                                />
                                <label htmlFor={option.id} className="text-sm">
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Hủy
                        </Button>
                        <Button onClick={handleSave}>Lưu thay đổi</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useEffect, useState } from "react";
import { getCallcenterLineList, getCallcenterMembers } from "@/api/callcenter";
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
import { useParams } from "next/navigation";

const checkboxOptions = [
    {
        id: "after5pm",
        label: "Gọi điện trước 8h và sau 17h",
    },
    {
        id: "autocare",
        label: 'Không yêu cầu nhân viên báo cáo (Tự động "Quan tâm" cho cuộc gọi kết nối thành công)',
    },
    {
        id: "autocreate",
        label: "Tự động tạo khách hàng cho cuộc gọi có kết quả Đồng ý",
    },
    {
        id: "allowrecall",
        label: "Cho phép nhân viên tự quay số khi gọi",
        defaultChecked: true,
    },
    {
        id: "autohangup",
        label: "Tự kết thúc nếu khách hàng không nghe máy sau x giây",
    },
];

export default function ConfigurationStep({ formData, setFormData }) {
    const [phoneLines, setPhoneLines] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const { orgId } = useParams();

    useEffect(() => {
        const fetchPhoneLines = async () => {
            const response = await getCallcenterLineList(orgId);
            if (response?.content) {
                setPhoneLines(response.content);
            }
        };
        fetchPhoneLines();
    }, []);

    useEffect(() => {
        const fetchStaffList = async () => {
            if (formData.phone) {
                const params = {
                    limit: 9999,
                    offset: 0,
                    isActive: true,
                };
                const response = await getCallcenterMembers(
                    orgId,
                    formData.phone,
                    params
                );
                if (response?.content) {
                    setStaffList(response.content);
                }
            }
        };
        fetchStaffList();
    }, [formData.phone, orgId]);

    const staffOptions = [
        ...staffList.map((staff) => ({
            value: staff.profileId,
            label: staff.fullName,
        })),
    ];

    return (
        <div className="space-y-2">
            <div className="space-y-2">
                <Label className="text-sm">
                    Tên chiến dịch <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nhập tên"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm">
                    Chọn đầu số sử dụng <span className="text-red-500">*</span>
                </Label>
                <Select
                    defaultValue={formData.phone}
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
                    Danh sách nhân viên <span className="text-red-500">*</span>
                </Label>
                <MultiSelect
                    options={staffOptions}
                    selected={formData.staff || []}
                    onChange={(value) =>
                        setFormData({ ...formData, staff: value })
                    }
                    className="w-full"
                    buttonClassName="w-full border-none bg-bg1"
                    disabled={!formData.phone}
                />
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
                    <Label className="text-sm">Nếu thất bại gọi lại sau</Label>
                    <div className="flex items-center">
                        <Input
                            className="w-[70%] rounded-r-none border-r"
                            type="number"
                            value={formData.retryTime}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    retryTime: e.target.value,
                                })
                            }
                        />
                        <Select
                            defaultValue={formData.retryType}
                            onValueChange={(value) =>
                                setFormData({ ...formData, retryType: value })
                            }
                        >
                            <SelectTrigger className="w-[30%] rounded-l-none">
                                <SelectValue placeholder="Giờ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hours">Giờ</SelectItem>
                                <SelectItem value="months">Tháng</SelectItem>
                                <SelectItem value="years">Năm</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {checkboxOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
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
                        <label
                            htmlFor={option.id}
                            className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium"
                        >
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}

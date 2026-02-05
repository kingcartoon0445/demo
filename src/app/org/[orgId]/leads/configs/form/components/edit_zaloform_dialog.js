import { getDetailZaloForm, updateZaloForm } from "@/api/leadV2";
import { CustomButton } from "@/components/common/custom_button";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRefresh } from "../hooks/useRefresh";

const cokaFieldMenu = [
    "Fullname",
    "Email",
    "Phone",
    "Gender",
    "Note",
    "Dob",
    "PhysicalId",
    "DateOfIssue",
    "Address",
    "Rating",
    "Work",
    "Avatar",
    "AssignTo",
];

export function EditZaloFormDialog({ open, setOpen, data, orgId }) {
    const [formUrl, setFormUrl] = useState();
    const [expireDate, setExpireDate] = useState();
    const [startDate, setStartDate] = useState();
    const [mappingData, setMappingData] = useState([{}]);
    const [formData, setFormData] = useState();
    const [loading, setLoading] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();

    useEffect(() => {
        if (open && data?.id) {
            fetchFormDetail();
        }
    }, [open, data]);

    const fetchFormDetail = async () => {
        try {
            setLoading(true);
            const res = await getDetailZaloForm(orgId, data.id);
            if (res?.code !== 0) {
                return toast.error(
                    res?.message || "Không thể lấy thông tin form",
                    {
                        position: "top-center",
                    }
                );
            }

            const formDetail = res.content;
            setFormData(formDetail);
            setFormUrl(formDetail.zaloFormId);
            setExpireDate(new Date(formDetail.expiryDate));
            setStartDate(new Date(formDetail.startDate));
            setMappingData(formDetail.mappingField || []);
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi lấy thông tin form", {
                position: "top-center",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!formData) {
            return toast.error("Không có dữ liệu để cập nhật", {
                position: "top-center",
            });
        }

        if (!expireDate) {
            return toast.error("Vui lòng chọn ngày hết hạn", {
                position: "top-center",
            });
        }

        if (!startDate) {
            return toast.error("Vui lòng chọn ngày bắt đầu", {
                position: "top-center",
            });
        }

        const updateBody = {
            title: formData.title,
            description: formData.description,
            startDate: startDate.toISOString(),
            expiryDate: expireDate.toISOString(),
            mappingField: mappingData.map((field) => ({
                zaloFormId: formData.zaloFormId,
                zaloFieldId: field.zaloFieldId,
                zaloFieldTitle: field.zaloFieldTitle,
                cokaField: field.cokaField,
            })),
        };

        ToastPromise(() =>
            updateZaloForm(orgId, data.id, updateBody).then((res) => {
                if (res?.code !== 0) {
                    return toast.error(res?.message || "Cập nhật thất bại", {
                        position: "top-center",
                    });
                }
                toast.success("Cập nhật form thành công", {
                    position: "top-center",
                });
                setRefreshConnectionsList();
                setOpen(false);
            })
        );
    };

    const handleUpdateZaloField = (index, value) => {
        const updatedMapData = [...mappingData];
        updatedMapData[index].zaloFieldTitle = value;
        setMappingData(updatedMapData);
    };

    const handleUpdateCokaField = (index, value) => {
        const updatedMapData = [...mappingData];
        updatedMapData[index].cokaField = value;
        setMappingData(updatedMapData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[800px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa Zalo Form</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data?.workspaceId && data?.workspaceName && (
                                <div>
                                    <label className="font-medium text-sm">
                                        Không gian làm việc
                                    </label>
                                    <Select value={data.workspaceId} disabled>
                                        <SelectTrigger className="mt-2 cursor-not-allowed">
                                            <SelectValue placeholder="Không gian làm việc" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                value={data.workspaceId}
                                            >
                                                {data.workspaceName}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="font-medium text-sm">
                                    Tiêu đề
                                </label>
                                <Input
                                    value={formData?.title || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
                                    }
                                    className="mt-2"
                                    placeholder="Nhập tiêu đề form"
                                />
                            </div>

                            <div>
                                <label className="font-medium text-sm">
                                    Mô tả
                                </label>
                                <Input
                                    value={formData?.description || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    className="mt-2"
                                    placeholder="Nhập mô tả form"
                                />
                            </div>

                            {/* <div>
                                <label className="font-medium text-sm">
                                    Ngày bắt đầu
                                    <span className="text-red-500">*</span>
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "mt-2 w-full justify-start text-left font-normal",
                                                !startDate &&
                                                    "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate
                                                ? format(
                                                      startDate,
                                                      "dd/MM/yyyy"
                                                  )
                                                : "Chọn ngày bắt đầu"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <div className="p-3">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={setStartDate}
                                                initialFocus
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div> */}

                            <div>
                                <label className="font-medium text-sm">
                                    Ngày hết hạn
                                    <span className="text-red-500">*</span>
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "mt-2 w-full justify-start text-left font-normal",
                                                !expireDate &&
                                                    "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {expireDate
                                                ? format(
                                                      expireDate,
                                                      "dd/MM/yyyy"
                                                  )
                                                : "Chọn ngày hết hạn"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <div className="p-3">
                                            <Calendar
                                                mode="single"
                                                selected={expireDate}
                                                onSelect={setExpireDate}
                                                initialFocus
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <label className="font-medium text-sm">
                                    Cấu hình mapping
                                </label>
                                <div className="mt-2 space-y-2">
                                    {mappingData?.map((field, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2"
                                        >
                                            <Input
                                                value={
                                                    field.zaloFieldTitle || ""
                                                }
                                                onChange={(e) =>
                                                    handleUpdateZaloField(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Zalo field"
                                                className="flex-1"
                                            />
                                            <div className="text-gray-400">
                                                →
                                            </div>
                                            <Select
                                                value={field.cokaField || ""}
                                                onValueChange={(value) =>
                                                    handleUpdateCokaField(
                                                        index,
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="flex-1">
                                                    {field.cokaField ||
                                                        "Chọn field"}
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cokaFieldMenu.map(
                                                        (fieldName, i) => (
                                                            <SelectItem
                                                                key={i}
                                                                value={
                                                                    fieldName
                                                                }
                                                            >
                                                                {fieldName}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        Cập nhật
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

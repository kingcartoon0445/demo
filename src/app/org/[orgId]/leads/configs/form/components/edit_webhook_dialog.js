import { webhookUpdate } from "@/api/lead";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { useWorkspaceList } from "@/hooks/workspace_data";
import { addHours, format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Copy } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRefresh } from "../hooks/useRefresh";

export function EditWebhookDialog({ open, setOpen, data }) {
    const [service, setService] = useState(data?.source || "");
    const [date, setDate] = useState(
        data?.expiryDate ? new Date(data.expiryDate) : null
    );
    const [loading, setLoading] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState(
        data?.workspaceId || ""
    );
    const [webhook, setWebhook] = useState(data);
    const { workspaceList } = useWorkspaceList();
    const { orgId } = useParams();
    const { setRefreshWebhookList } = useRefresh();

    useEffect(() => {
        if (data) {
            setService(data.source);
            setDate(data.expiryDate ? new Date(data.expiryDate) : null);
            setSelectedWorkspace(data.workspaceId);
            setWebhook(data);
        }
    }, [data]);

    const handleSubmit = () => {
        if (!service) return toast.error("Vui lòng chọn dịch vụ");
        if (!date) return toast.error("Vui lòng chọn ngày hết hạn");

        setLoading(true);
        ToastPromise(() =>
            webhookUpdate(
                orgId,
                data.id,
                JSON.stringify({
                    title: webhook.title,
                    source: service,
                    expiryDate: addHours(date, 7),
                })
            ).then((res) => {
                if (res?.message) return toast.error(res.message);
                toast.success("Cập nhật webhook thành công");
                setOpen(false);
                setRefreshWebhookList();
            })
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <div className="flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                            Chỉnh sửa cấu hình Webhook
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col p-4 items-start">
                        <div className="font-medium text-sm">
                            Tên webhook
                            <span className="text-[#FF0000]">*</span>
                        </div>
                        <div className="mt-1.5 w-full">
                            <Input
                                value={webhook.title}
                                onChange={(e) => {
                                    setWebhook({
                                        ...webhook,
                                        title: e.target.value,
                                    });
                                }}
                            />
                        </div>
                        {data?.workspaceId && data?.workspaceName && (
                            <div className="font-medium text-sm mt-3 w-full">
                                Không gian làm việc
                                <Select value={selectedWorkspace} disabled>
                                    <SelectTrigger className="w-full mt-1.5 cursor-not-allowed">
                                        <SelectValue placeholder="Không gian làm việc" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={data.workspaceId}>
                                            {data.workspaceName}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="font-medium text-sm mt-3">
                            Dịch vụ<span className="text-[#FF0000]">*</span>
                        </div>
                        <Select value={service} onValueChange={setService}>
                            <SelectTrigger className="w-full mt-1.5 ">
                                <SelectValue placeholder="Chọn dịch vụ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FBS">FBS</SelectItem>
                                <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="font-medium text-sm mt-3">
                            Ngày hết hạn
                            <span className="text-[#FF0000]">*</span>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={`w-full mt-1.5 bg-[var(--bg1)] justify-start text-left font-normal ${
                                        !date && "text-muted-foreground"
                                    }`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date
                                        ? format(date, "dd/MM/yyyy", {
                                              locale: vi,
                                          })
                                        : "Chọn ngày hết hạn"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    locale={vi}
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>

                        {webhook?.url && (
                            <div className="flex flex-col space-y-1.5 w-full mt-3">
                                <div className="font-medium text-sm">
                                    Webhook Url
                                </div>
                                <div className="w-full bg-[var(--bg1)] px-3 py-1 rounded-md text-sm text-muted-foreground flex items-center justify-between">
                                    <span className="truncate">
                                        {webhook.url}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-fit px-2"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                webhook.url
                                            );
                                            toast.success("Đã sao chép");
                                        }}
                                    >
                                        <div className="flex items-center text-xs text-[#554fe8] gap-2">
                                            <Copy className="text-[#554fe8] h-4 w-4" />
                                            Sao chép
                                        </div>
                                    </Button>
                                </div>
                                <span className="text-xs">
                                    Sử dụng Webhook Coka trên FBS:
                                    <ul className="list-disc list-inside leading-[1.5]">
                                        <li>
                                            Truy cập vào địa chỉ{" "}
                                            <a
                                                href="https://fbs.ai"
                                                target="_blank"
                                                className="font-bold underline"
                                            >
                                                FBS.AI
                                            </a>
                                        </li>
                                        <li>
                                            Bạn cần đăng nhập và chọn mua gói
                                            dịch vụ phù hợp với nhu cầu.
                                        </li>
                                        <li>
                                            Chọn{" "}
                                            <b>
                                                &quot;Quản lý thành viên
                                                nhóm&quot;
                                            </b>
                                        </li>
                                        <li>
                                            Nhấn vào mục{" "}
                                            <b>&quot;Webhook&quot;</b>
                                        </li>
                                        <li>
                                            Dán <b>&quot;Webhook Url&quot;</b>{" "}
                                            phía trên
                                        </li>
                                        <li>
                                            Giờ đây bạn đã có thể kết nối Coka
                                            với FBS, chúc bạn thành công.
                                        </li>
                                    </ul>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button loading={loading} onClick={handleSubmit}>
                        Lưu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

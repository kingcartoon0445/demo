"use client";
import { webhookCreate } from "@/api/lead";
import { getWorkspaceList } from "@/api/workspace";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRefresh } from "../hooks/useRefresh";

export default function WebhookConfig({ orgId, workspaceId, setOpen }) {
    const [service, setService] = useState("");
    const [date, setDate] = useState();
    const [loading, setLoading] = useState(false);
    const [webhook, setWebhook] = useState();
    const { setRefreshConnectionsList } = useRefresh();
    const [workspaceList, setWorkspaceList] = useState([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("__none");

    useEffect(() => {
        if (orgId) {
            getWorkspaceList(orgId).then((res) => {
                if (res?.code === 0 && res.content) {
                    setWorkspaceList(res.content);
                }
            });
        }
    }, [orgId]);

    const normalizedWorkspaceId =
        selectedWorkspaceId === "__none" ? "" : selectedWorkspaceId;

    const handleSubmit = () => {
        if (!service) return toast.error("Vui lòng chọn dịch vụ");
        if (!date) return toast.error("Vui lòng chọn ngày hết hạn");

        setLoading(true);
        ToastPromise(() =>
            webhookCreate(
                orgId,
                JSON.stringify({
                    title: "Webhook",
                    source: service,
                    expiryDate: date,
                    workspaceId: normalizedWorkspaceId || workspaceId || "",
                })
            ).then((res) => {
                if (res?.message) return toast.error(res.message);
                toast.success("Tạo webhook thành công");
                setWebhook(res.content);
                setLoading(false);
                setRefreshConnectionsList();
            })
        );
    };
    return (
        <div className="flex-1 flex flex-col max-w-[50%]">
            <div className="flex flex-col space-y-1.5">
                <div className="tracking-tight font-medium text-[18px] text-title flex items-center justify-between mb-5">
                    Cấu hình Webhook
                </div>
                <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
            </div>
            <div className="flex flex-col pt-3 items-start">
                <div className="font-medium text-sm">Không gian làm việc</div>
                <Select
                    disabled={!!webhook}
                    value={selectedWorkspaceId}
                    onValueChange={setSelectedWorkspaceId}
                >
                    <SelectTrigger className="w-full mt-1.5 bg-[var(--bg1)] outline-none border-none">
                        <SelectValue placeholder="Chọn không gian làm việc (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none">Không chọn</SelectItem>
                        {workspaceList?.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                                {workspace.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="font-medium text-sm mt-3">
                    Dịch vụ<span className="text-[#FF0000]">*</span>
                </div>
                <Select
                    disabled={!!webhook}
                    value={service}
                    onValueChange={setService}
                >
                    <SelectTrigger className="w-full mt-1.5 bg-[var(--bg1)] outline-none border-none">
                        <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="FBS">FBS</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                </Select>
                <div className="font-medium text-sm mt-3">
                    Ngày hết hạn<span className="text-[#FF0000]">*</span>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            disabled={!!webhook}
                            className={`w-full mt-1.5 bg-[var(--bg1)] justify-start text-left font-normal ${
                                !date && "text-muted-foreground"
                            }`}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date
                                ? format(date, "dd/MM/yyyy", { locale: vi })
                                : "Chọn ngày hết hạn"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={vi}
                            disabled={(date) => date < new Date() || !!webhook}
                        />
                    </PopoverContent>
                </Popover>
                {!!webhook && (
                    <div className="flex flex-col space-y-1.5 w-full mt-3">
                        <div className="font-medium text-sm">Webhook Url</div>
                        <div className="w-full bg-[var(--bg1)] px-3 py-1 rounded-md text-sm text-muted-foreground flex items-center justify-between">
                            <span className="truncate">
                                {webhook.url ? webhook.url : "Url chưa có"}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-fit px-2"
                                onClick={() => {
                                    navigator.clipboard.writeText(webhook.url);
                                    toast.success("Đã sao chép");
                                }}
                            >
                                <div className="flex items-center text-xs text-[#554fe8] gap-2">
                                    <Copy className="text-[#554fe8] h-4 w-4" />
                                    Sao chép
                                </div>
                            </Button>
                        </div>
                        <span className="text-xs ">
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
                                    Bạn cần đăng nhập và chọn mua gói dịch vụ
                                    phù hợp với nhu cầu.
                                </li>
                                <li>
                                    Chọn{" "}
                                    <b>&quot;Quản lý thành viên nhóm&quot;</b>
                                </li>
                                <li>
                                    Nhấn vào mục <b>&quot;Webhook&quot;</b>
                                </li>
                                <li>
                                    Dán <b>&quot;Webhook Url&quot;</b> phía trên
                                </li>
                                <li>
                                    Giờ đây bạn đã có thể kết nối Coka với FBS,
                                    chúc bạn thành công.
                                </li>
                            </ul>
                        </span>
                    </div>
                )}
                <p
                    className={`text-xs mt-3 text-justify ${
                        !!webhook && "hidden"
                    }`}
                >
                    *FBS là công cụ quét số điện thoại hàng loạt trên nền tảng
                    Facebook: Fanpage, Group, Profile, Avatar, Inbox, Comment,
                    Like, Share... hổ trợ bán hàng online, khai thác khách hàng
                    với chi phí cực kỳ thấp
                </p>

                <Button
                    loading={loading}
                    onClick={handleSubmit}
                    className={`text-sm mt-4 h-[32px] ${!!webhook && "hidden"}`}
                >
                    Tiếp theo
                </Button>
            </div>
        </div>
    );
}

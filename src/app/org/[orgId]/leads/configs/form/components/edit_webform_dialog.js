import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { dialogTitleStyle } from "@/components/common/customer_update_create";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MdContentCopy } from "react-icons/md";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { verifyWebform } from "@/api/lead";
import { useRefresh } from "../hooks/useRefresh";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const getWebformStr = (id) =>
    `<meta name="coka-site-verification" content="${id}" /><script src="https://analytics.form.coka.ai/js/form.js"></script>`;
export function EditWebformDialog({ open, setOpen, data }) {
    const { setRefreshConnectionsList } = useRefresh();
    const [loading, setLoading] = useState(false);

    const handleVerifyWebform = () => {
        const webformId = data.id;
        setLoading(true);
        verifyWebform(webformId, data.organizationId, data.workspaceId)
            .then((res) => {
                if (res.content) {
                    setOpen(false);
                    setRefreshConnectionsList();
                    return toast.success(
                        `Kết nối website ${data.title} thành công`
                    );
                } else {
                    setRefreshConnectionsList();

                    toast.error(
                        `Kết nối website ${data.title} thất bại, vui lòng kiểm tra lại cấu hình`
                    );
                }
            })
            .finally(() => {
                setLoading(false);
                // setRefreshConnectionsList();
            });
    };

    const handleTestForm = () => {
        window.open(data.title, "_blank");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <div className="flex flex-col">
                    <DialogHeader>
                        <DialogTitle className={dialogTitleStyle}>
                            Chỉnh sửa cấu hình Web Form
                        </DialogTitle>
                        <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                    </DialogHeader>
                    <div className="font-medium text-base mt-4">
                        Đường dẫn Website
                        <span className="text-[#FF0000]">*</span>
                    </div>
                    <Input
                        placeholder="Nhập website cần kết nối"
                        className=" bg-[var(--bg1)] outline-none border-none"
                        value={data.title}
                        disabled
                    />
                    {data?.workspaceId && data?.workspaceName && (
                        <div className="font-medium text-sm mt-3 w-full">
                            Không gian làm việc
                            <Select value={data.workspaceId} disabled>
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
                    <div className="flex flex-col text-sm mt-3 gap-2 items-start">
                        {
                            "Copy đoạn script phía dưới và dán vào giữa <head>...</head> của phần sourcewebsite, sau đó bấm xác minh để kiểm tra"
                        }
                        <div className="flex items-center text-[10px] bg-[var(--bg1)] p-2 rounded-lg gap-4">
                            {getWebformStr(data.id)}
                            <div
                                onClick={() => {
                                    toast.success(
                                        "Đã lưu đoạn mã vào bộ nhớ đệm"
                                    );
                                    navigator.clipboard.writeText(
                                        getWebformStr(data.id)
                                    );
                                }}
                                className=" whitespace-nowrap flex items-center gap-1 text-primary font-medium p-2 rounded-lg cursor-pointer hover:bg-accent"
                            >
                                <MdContentCopy /> Sao chép
                            </div>
                        </div>
                        {data.status === 1 ? (
                            <div className="flex gap-2 w-full">
                                <Button
                                    disabled
                                    className="text-xs mt-3 h-[32px]"
                                >
                                    Đã xác minh
                                </Button>
                                <Button
                                    onClick={handleTestForm}
                                    className="text-xs mt-3 h-[32px]"
                                >
                                    Test Form
                                </Button>
                                <Button
                                    onClick={handleVerifyWebform}
                                    className="text-xs mt-3 h-[32px] ml-auto"
                                    loading={loading}
                                >
                                    {loading
                                        ? "Đang xác minh..."
                                        : "Xác minh lại"}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={handleVerifyWebform}
                                className="text-xs mt-3 h-[32px]"
                                loading={loading}
                            >
                                {loading ? "Đang xác minh..." : "Xác minh"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

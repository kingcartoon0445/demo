import { addWebform, verifyWebform } from "@/api/lead";
import { getWorkspaceList } from "@/api/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdContentCopy } from "react-icons/md";
import { useRefresh } from "../hooks/useRefresh";
const refactoryWebsite = (website) => {
    if (website.includes("https://") || website.includes("http://"))
        return website;
    return `https://${website}`;
};
const getWebformStr = (id) =>
    `<meta name="coka-site-verification" content="${id}" /><script src="https://analytics.form.coka.ai/js/form.js"></script>`;

export function WebformConfig({ orgId, workspaceId, setOpen }) {
    const [website, setWebsite] = useState("");
    const [webform, setWebform] = useState();
    const [isContinue, setIsContinue] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();
    const [loading, setLoading] = useState(false);
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

    const handleSubmitWebsite = () => {
        if (website?.length == 0)
            return toast.error("Vui lòng nhập website cần kết nối hợp lệ", {
                position: "top-center",
            });
        addWebform(
            orgId,
            normalizedWorkspaceId || workspaceId || "",
            JSON.stringify({
                url: refactoryWebsite(website),
                type: "DOMAIN",
                workspaceId: normalizedWorkspaceId || workspaceId || "",
            })
        ).then((res) => {
            if (res?.code != 201)
                return toast.error(
                    res?.message ?? "Đã có lỗi xảy ra xin vui lòng thử lại"
                );
            setRefreshConnectionsList();
            setWebform(res.content);
            setIsContinue(true);
        });
    };
    const handleVerifyWebform = () => {
        const webformId = webform.id;
        setLoading(true);
        verifyWebform(
            webformId,
            orgId,
            normalizedWorkspaceId || workspaceId || ""
        ).then((res) => {
            setLoading(false);
            if (res.content) {
                setOpen(false);
                setRefreshConnectionsList();
                return toast.success(`Kết nối website ${website} thành công`);
            } else setRefreshConnectionsList();

            return toast.error(
                `Kết nối website ${website} thất bại, vui lòng kiểm tra lại cấu hình`
            );
        });
    };
    return (
        <div className="flex-1 flex flex-col">
            <div className="flex flex-col space-y-1.5">
                <div className="tracking-tight font-medium text-[18px] text-title flex items-center justify-between mb-5">
                    Cấu hình Web Form
                    {/* <CustomButton className={"max-h-[25px]"}>Lưu</CustomButton> */}
                </div>
                <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
            </div>
            <div className="flex flex-col pt-3 items-start">
                <div className="font-medium text-sm">Không gian làm việc</div>
                <Select
                    value={selectedWorkspaceId}
                    onValueChange={setSelectedWorkspaceId}
                >
                    <SelectTrigger className="w-full mt-2 bg-[var(--bg1)] outline-none border-none">
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
                    Đường dẫn Website<span className="text-[#FF0000]">*</span>
                </div>
                <Input
                    placeholder="Nhập website cần kết nối"
                    className="mt-2 bg-[var(--bg1)] outline-none border-none"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                />
                <Button
                    className="text-xs mt-3 h-[32px]"
                    onClick={handleSubmitWebsite}
                >
                    Tiếp theo
                </Button>

                {isContinue && (
                    <div className="flex flex-col text-xs mt-3 gap-2 items-start">
                        {
                            "Copy đoạn script phía dưới và dán vào giữa <head>...</head> của phần sourcewebsite, sau đó bấm xác minh để kiểm tra"
                        }
                        <div className="flex items-center text-[10px] bg-[var(--bg1)] p-2 rounded-lg gap-4">
                            {getWebformStr(webform.id)}
                            <div
                                onClick={() => {
                                    toast.success(
                                        "Đã lưu đoạn mã vào bộ nhớ đệm"
                                    );
                                    navigator.clipboard.writeText(
                                        getWebformStr(webform.id)
                                    );
                                }}
                                className=" whitespace-nowrap flex items-center gap-1 text-primary font-medium p-2 rounded-lg cursor-pointer hover:bg-accent"
                            >
                                <MdContentCopy /> Sao chép
                            </div>
                        </div>
                        <Button
                            onClick={handleVerifyWebform}
                            className="text-xs mt-3 h-[32px]"
                            loading={loading}
                        >
                            {loading ? "Đang xác minh..." : "Xác minh"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

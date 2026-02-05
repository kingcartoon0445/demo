import {
    autoMappingZalo,
    connectZaloform,
    getZaloFormList,
} from "@/api/leadV2";
import { getWorkspaceList } from "@/api/workspace";
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
import { apiBase } from "@/lib/authConstants";
import { cn } from "@/lib/utils";
import { popupCenter } from "@/lib/window_popup";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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

export function ZaloformConfig({ orgId, workspaceId, setOpen }) {
    const [formUrl, setFormUrl] = useState();
    const [expireDate, setExpireDate] = useState(() => {
        const now = new Date();
        now.setDate(now.getDate() + 30); // cộng thêm 30 ngày
        return now;
    });
    const [oaList, setOaList] = useState();
    const [oa, setOa] = useState();
    const [mappingData, setMappingData] = useState([{}]);
    const [formData, setFormData] = useState();
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
    const fetchOaList = () => {
        getZaloFormList(orgId).then((res) => {
            if (res?.message)
                return toast.error(res.message, { position: "top-center" });
            setOaList(res?.content);
        });
    };

    useEffect(() => {
        fetchOaList();
    }, [workspaceId]);
    const handleSubmitZalo = () => {
        if (!formUrl || !mappingData)
            return toast.error("Vui lòng chọn Form cần kết nối hợp lệ", {
                position: "top-center",
            });
        if (!oa)
            return toast.error("Vui lòng chọn tài khoản OA", {
                position: "top-center",
            });
        if (!expireDate)
            return toast.error("Vui lòng chọn ngày hết hạn", {
                position: "top-center",
            });
        ToastPromise(() =>
            connectZaloform(orgId, {
                title: formData.title,
                description: formData.description,
                zaloFormId: formData.zaloFormId,
                url: formUrl,
                subscribedId: oa.id,
                expiryDate: expireDate,
                mappingField: mappingData,
                workspaceId: normalizedWorkspaceId || workspaceId || "",
            }).then((res) => {
                if (res?.message)
                    return toast.error(res.message, { position: "top-center" });
                toast.success("Tạo kết nối form thành công", {
                    position: "top-center",
                });
                setRefreshConnectionsList();
                setOpen(false);
            })
        );
    };
    const handleCheck = () => {
        if (!formUrl)
            return toast.error("Vui lòng chọn Form cần kết nối hợp lệ", {
                position: "top-center",
            });
        if (!oa)
            return toast.error("Vui lòng chọn tài khoản OA", {
                position: "top-center",
            });

        ToastPromise(() =>
            autoMappingZalo(orgId, formUrl).then((res) => {
                if (res?.message)
                    return toast.error(res.message, { position: "top-center" });
                setFormData(res?.content);
                setMappingData(res?.content?.mappingField);
            })
        );
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex flex-col space-y-1.5">
                <div className="tracking-tight font-medium text-[18px] text-title flex items-center justify-between mb-5">
                    Cấu hình Zalo Form
                    <CustomButton
                        className={"max-h-[25px]"}
                        onClick={handleSubmitZalo}
                    >
                        Lưu
                    </CustomButton>
                </div>
                <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
            </div>
            <div className="flex flex-col pt-3 items-start overflow-y-auto space-y-2">
                <div className="font-medium text-sm">Không gian làm việc</div>
                <Select
                    value={selectedWorkspaceId}
                    onValueChange={setSelectedWorkspaceId}
                >
                    <SelectTrigger className="border-none outline-none bg-[var(--bg1)] mt-2 w-full">
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
                <div className="font-medium text-sm mt-2">
                    Chọn tài khoản OA<span className="text-[#FF0000]">*</span>
                </div>
                <Select value={oa} onValueChange={setOa}>
                    <SelectTrigger className="border-none outline-none bg-[var(--bg1)] mt-2 w-full">
                        {oa ? oa.name : "Chọn tài khoản"}
                    </SelectTrigger>
                    <SelectContent>
                        {oaList?.map((e, i) => (
                            <SelectItem key={i} value={e}>
                                {e.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={() => {
                        popupCenter(
                            `${apiBase}/api/v2/public/integration/auth/zalo/lead?organizationId=${orgId}&accessToken=${localStorage.getItem(
                                "accessToken"
                            )}&workspaceId=${workspaceId}`,
                            "Connect Zalo OA",
                            600,
                            1000,
                            () => {
                                fetchOaList();
                            }
                        );
                    }}
                    variant="outline"
                    className="mt-2 h-[35px]"
                >
                    Thêm tài khoản
                </Button>
                <div className="font-medium text-sm mt-2">
                    Form Url<span className="text-[#FF0000]">*</span>
                </div>
                <div className="relative w-full">
                    <Input
                        placeholder="Điền form url"
                        className="mt-2 bg-[var(--bg1)] outline-none border-none pr-24"
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                    />
                    <Button
                        className="absolute top-2 right-1 text-xs text-primary hover:text-primary/80"
                        variant="ghost"
                        onClick={handleCheck}
                    >
                        Kiểm tra
                    </Button>
                </div>

                <div className="font-medium text-sm mt-4">
                    Ngày hết hạn<span className="text-[#FF0000]">*</span>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"ghost"}
                            className={cn(
                                "mt-2 bg-[var(--bg1)] outline-none border-none cursor-pointer py-2 px-3 w-full rounded-lg text-[#768498] text-sm flex justify-between",
                                !expireDate ? "text-[#768498]" : "text-black/90"
                            )}
                        >
                            {expireDate ? (
                                format(expireDate, "dd/MM/yyyy")
                            ) : (
                                <span>dd/MM/yyyy</span>
                            )}
                            <CalendarIcon className="mr-2 h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={expireDate}
                            onSelect={setExpireDate}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1960}
                            toYear={2050}
                        />
                    </PopoverContent>
                </Popover>

                <div className="font-medium text-sm mt-4">
                    Cấu hình <span className="text-[#FF0000]">*</span>
                </div>
                <div className="flex justify-between w-full text-xs mt-2">
                    <div className="flex-1">Zalo field</div>
                    <div className="w-[44%]" />
                    <div className="flex-1">Coka field</div>
                </div>
                <ListCustomMapForm
                    mappingData={mappingData}
                    setMappingData={setMappingData}
                />
            </div>
        </div>
    );
}
const ListCustomMapForm = ({ mappingData, setMappingData }) => {
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
        <div className="flex flex-col gap-2 w-full">
            {mappingData?.map((e, i) => (
                <CustomMapForm
                    key={i}
                    zaloField={e.zaloFieldTitle}
                    setZaloField={(value) => handleUpdateZaloField(i, value)}
                    cokaField={e.cokaField}
                    setCokaField={(value) => handleUpdateCokaField(i, value)}
                />
            ))}
        </div>
    );
};

const CustomMapForm = ({
    zaloField,
    cokaField,
    setZaloField,
    setCokaField,
}) => {
    return (
        <div className="flex items-center w-full">
            <Input
                value={zaloField}
                onValueChange={(e) => {
                    setZaloField(e.current.value);
                }}
                placeholder="Nội dung"
                className="bg-[var(--bg1)] outline-none border-none rounded-xl w-[220px]"
            />
            <div className="w-[10%] h-[0.5px] bg-black/40" />
            <Select defaultValue={cokaField} onValueChange={setCokaField}>
                <SelectTrigger className="border-none outline-none bg-[var(--bg1)] w-[130px]">
                    {cokaField ?? "Input Field"}
                </SelectTrigger>
                <SelectContent>
                    {cokaFieldMenu.map((e, i) => (
                        <SelectItem key={i} value={e}>
                            {e}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

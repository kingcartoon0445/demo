import { getTiktokAccounts } from "@/api/leadV2";
import {
    createTiktokForm,
    getTiktokFormDetail,
    getTiktokFormList,
} from "@/api/tiktok";
import { getWorkspaceList } from "@/api/workspace";
import { CustomButton } from "@/components/common/custom_button";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
import { popupCenter } from "@/lib/window_popup";
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

export function TiktokConfig({ orgId, workspaceId, setOpen }) {
    const [tiktokAccounts, setTiktokAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState();
    const [tiktokForms, setTiktokForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState();
    const [mappingData, setMappingData] = useState([{}]);
    const [openFormCommand, setOpenFormCommand] = useState(false);
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

    const selectedAccount = tiktokAccounts?.find(
        (a) => a.id === selectedAccountId
    );

    const fetchTiktokAccounts = () => {
        getTiktokAccounts(orgId).then((res) => {
            if (res?.message)
                return toast.error(res.message, { position: "top-center" });
            setTiktokAccounts(res?.content);
        });
    };

    const fetchTiktokForms = (accountId) => {
        if (!accountId) return;
        getTiktokFormList(orgId, accountId, false).then((res) => {
            if (res?.message)
                return toast.error(res.message, { position: "top-center" });
            setTiktokForms(res?.content);
        });
    };

    useEffect(() => {
        if (orgId) {
            fetchTiktokAccounts();
        }
    }, [orgId]);

    useEffect(() => {
        if (selectedAccountId) {
            fetchTiktokForms(selectedAccountId);
        }
    }, [selectedAccountId]);

    const getFormDetail = (form) => {
        if (!form || !form.pageId) return;
        if (!selectedAccount?.id)
            return toast.error("Vui lòng chọn tài khoản Tiktok", {
                position: "top-center",
            });
        ToastPromise(() =>
            getTiktokFormDetail(
                orgId,
                form.id,
                selectedAccount.id,
                form.pageId
            ).then((res) => {
                if (res?.message)
                    return toast.error(res.message, {
                        position: "top-center",
                    });

                if (
                    res?.content?.mappingField &&
                    res.content.mappingField.length > 0
                ) {
                    setMappingData(res.content.mappingField);

                    setSelectedForm((prevForm) => ({
                        ...prevForm,
                        ...res.content,
                        mappingField: res.content.mappingField,
                    }));
                }
            })
        );
    };

    const handleFormSelect = (form) => {
        setSelectedForm(form);
        getFormDetail(form);
    };

    const handleSubmitTiktok = () => {
        if (!selectedForm)
            return toast.error("Vui lòng chọn Form cần kết nối", {
                position: "top-center",
            });
        if (!selectedAccount)
            return toast.error("Vui lòng chọn tài khoản Tiktok", {
                position: "top-center",
            });

        const formData = {
            ...selectedForm,
            title: selectedForm.title,
            description: selectedForm.description || "",
            pageId: selectedForm.pageId,
            tiktokFormId: selectedForm.tiktokFormId || selectedForm.pageId,
            subscribedId: selectedAccount.id,
            mappingField: mappingData,
            workspaceId: normalizedWorkspaceId || workspaceId || "",
        };

        ToastPromise(() =>
            createTiktokForm(orgId, formData).then((res) => {
                if (res?.message)
                    return toast.error(res.message, { position: "top-center" });
                toast.success("Tạo kết nối form thành công", {
                    position: "top-center",
                });
                // Đóng form sau khi lưu thành công
                try {
                    setRefreshConnectionsList();
                    setOpen(false);
                } catch (error) {}
            })
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex flex-col space-y-1.5">
                <div className="tracking-tight font-medium text-[18px] text-title flex items-center justify-between mb-5">
                    Cấu hình Tiktok Form
                    <div className="flex gap-2">
                        <CustomButton
                            className={"max-h-[25px]"}
                            onClick={handleSubmitTiktok}
                        >
                            Lưu
                        </CustomButton>
                    </div>
                </div>
                <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
            </div>
            <div className="flex flex-col pt-3 items-start overflow-y-auto space-y-2 h-full">
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
                    Chọn tài khoản Tiktok
                    <span className="text-[#FF0000]">*</span>
                </div>
                <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                >
                    <SelectTrigger className="border-none outline-none bg-[var(--bg1)] mt-2 w-full">
                        {selectedAccount
                            ? selectedAccount.name
                            : "Chọn tài khoản"}
                    </SelectTrigger>
                    <SelectContent>
                        {tiktokAccounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={() => {
                        popupCenter(
                            `${apiBase}/api/v2/public/integration/auth/tiktok/lead?organizationId=${orgId}&accessToken=${localStorage.getItem(
                                "accessToken"
                            )}&organizationId=${orgId}`,
                            "Connect Tiktok",
                            600,
                            1000,
                            () => {
                                fetchTiktokAccounts();
                            }
                        );
                    }}
                    variant="outline"
                    className="mt-2 h-[35px]"
                >
                    Thêm tài khoản
                </Button>

                <div className="font-medium text-sm mt-4">
                    Chọn Form<span className="text-[#FF0000]">*</span>
                </div>
                <Popover
                    open={openFormCommand}
                    onOpenChange={setOpenFormCommand}
                >
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between border-none outline-none bg-[var(--bg1)] mt-2"
                        >
                            {selectedForm ? (
                                <span>{selectedForm.title}</span>
                            ) : (
                                <span className="text-muted-foreground">
                                    Chọn form kết nối
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder="Tìm kiếm form..."
                                onValueChange={(search) => {
                                    // Có thể thêm logic search ở đây nếu cần
                                }}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    Không tìm thấy form nào
                                </CommandEmpty>
                                {/* Option để bỏ chọn */}
                                <CommandItem
                                    value="clear"
                                    onSelect={() => {
                                        setSelectedForm(null);
                                        setMappingData([{}]);
                                        setOpenFormCommand(false);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground">
                                            Không chọn
                                        </span>
                                    </div>
                                </CommandItem>
                                {tiktokForms?.map((form, i) => (
                                    <CommandItem
                                        key={i}
                                        onSelect={() => {
                                            handleFormSelect(form);
                                            setOpenFormCommand(false);
                                        }}
                                        value={form.title}
                                    >
                                        <div className="flex flex-col">
                                            <span>{form.title}</span>
                                            {form.description && (
                                                <span className="text-sm text-muted-foreground">
                                                    {form.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <div className="font-medium text-sm mt-4">
                    Cấu hình <span className="text-[#FF0000]">*</span>
                </div>
                <div className="flex justify-between w-full text-xs mt-2">
                    <div className="flex-1">Tiktok field</div>
                    <div className="w-[46%]" />
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
    const handleUpdateTiktokField = (index, value) => {
        const updatedMapData = [...mappingData];
        updatedMapData[index].tiktokFieldTitle = value;
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
                    tiktokField={e.tiktokFieldTitle}
                    cokaField={e.cokaField}
                    setTiktokField={(val) => handleUpdateTiktokField(i, val)}
                    setCokaField={(val) => handleUpdateCokaField(i, val)}
                />
            ))}
        </div>
    );
};

const CustomMapForm = ({
    tiktokField,
    cokaField,
    setTiktokField,
    setCokaField,
}) => {
    return (
        <div className="flex gap-2">
            <Input
                className="bg-[var(--bg1)] border-none w-[220px]"
                placeholder="Tiktok field"
                value={tiktokField ?? ""}
                onChange={(e) => setTiktokField(e.target.value)}
            />
            <div className="w-[10%] flex justify-center items-center">
                <div className="w-full h-[1px] bg-[#E4E7EC]" />
            </div>
            <Select value={cokaField} onValueChange={setCokaField}>
                <SelectTrigger className="border-none bg-[var(--bg1)] w-[130px]">
                    {cokaField ?? "Coka field"}
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

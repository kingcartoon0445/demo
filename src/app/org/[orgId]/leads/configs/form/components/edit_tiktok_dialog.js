import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { CustomButton } from "@/components/common/custom_button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { dialogTitleStyle } from "@/components/common/customer_update_create";
import { ToastPromise } from "@/components/toast";
import toast from "react-hot-toast";
import { getTiktokFormDetail, updateTiktokForm } from "@/api/tiktok";
import { useRefresh } from "../hooks/useRefresh";
import { useParams } from "next/navigation";

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

export function EditTiktokDialog({ open, setOpen, data }) {
    const params = useParams();
    const orgId = params.orgId;
    const [mappingData, setMappingData] = useState([{}]);
    const [loading, setLoading] = useState(true);
    const { setRefreshTiktokLeadList } = useRefresh();

    useEffect(() => {
        if (open && data) {
            setLoading(true);
            // Lấy chi tiết form để có mapping field hiện tại
            getTiktokFormDetail(orgId, data.id, data.connectionId, data.pageId)
                .then((res) => {
                    if (res?.message) {
                        toast.error(res.message, { position: "top-center" });
                        return;
                    }
                    if (
                        res?.content?.mappingField &&
                        res.content.mappingField.length > 0
                    ) {
                        setMappingData(res.content.mappingField);
                    } else {
                        setMappingData([{}]);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching form details:", error);
                    toast.error("Không thể lấy thông tin chi tiết form", {
                        position: "top-center",
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, data, orgId]);

    const handleUpdateTiktokForm = () => {
        if (!data) return;

        const formData = {
            ...data,
            mappingField: mappingData,
        };

        ToastPromise(() =>
            updateTiktokForm(orgId, data.workspaceId, data.id, formData).then(
                (res) => {
                    if (res?.message) {
                        return toast.error(res.message, {
                            position: "top-center",
                        });
                    }
                    toast.success("Cập nhật cấu hình form thành công", {
                        position: "top-center",
                    });
                    setRefreshTiktokLeadList();
                    setOpen(false);
                }
            )
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[600px]">
                <DialogHeader>
                    <DialogTitle className={dialogTitleStyle}>
                        Cập nhật cấu hình Tiktok Form
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>

                <div className="flex flex-col py-4">
                    {data?.workspaceId && data?.workspaceName && (
                        <div className="mb-4">
                            <div className="font-medium text-sm">
                                Không gian làm việc
                            </div>
                            <Select value={data.workspaceId} disabled>
                                <SelectTrigger className="mt-2 cursor-not-allowed">
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
                    <div className="text-base font-medium mb-2">
                        {data?.title || "Form Tiktok"}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4">
                            Đang tải dữ liệu...
                        </div>
                    ) : (
                        <>
                            <div className="font-medium text-sm mt-2">
                                Cấu hình{" "}
                                <span className="text-[#FF0000]">*</span>
                            </div>
                            <div className="flex justify-between w-full text-xs my-2">
                                <div className="flex-1">Tiktok field</div>
                                <div className="w-[44%]" />
                                <div className="flex-1">Coka field</div>
                            </div>
                            <ListCustomMapForm
                                mappingData={mappingData}
                                setMappingData={setMappingData}
                            />

                            <div className="flex justify-end mt-4">
                                <CustomButton
                                    onClick={handleUpdateTiktokForm}
                                    className="bg-primary hover:bg-primary/90 w-fit text-white hover:text-white/80 font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                    Cập nhật
                                </CustomButton>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
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

    const addNewField = () => {
        setMappingData([...mappingData, {}]);
    };

    const removeField = (index) => {
        if (mappingData.length <= 1) return;
        const updatedMapData = [...mappingData];
        updatedMapData.splice(index, 1);
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
                    onRemove={() => removeField(i)}
                    showRemove={mappingData.length > 1}
                />
            ))}
            <button
                onClick={addNewField}
                className="text-primary text-sm mt-2 self-start hover:underline"
            >
                + Thêm trường
            </button>
        </div>
    );
};

const CustomMapForm = ({
    tiktokField,
    cokaField,
    setTiktokField,
    setCokaField,
    onRemove,
    showRemove,
}) => {
    return (
        <div className="flex gap-2 items-center">
            <Input
                className="bg-[var(--bg1)] border-none"
                placeholder="Tiktok field"
                value={tiktokField ?? ""}
                onChange={(e) => setTiktokField(e.target.value)}
            />
            <div className="w-[10%] flex justify-center items-center">
                <div className="w-full h-[1px] bg-[#E4E7EC]" />
            </div>
            <Select
                value={cokaField}
                onValueChange={setCokaField}
                className="min-w-[130px]"
            >
                <SelectTrigger className="border-none bg-[var(--bg1)] min-w-[130px]">
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
            {showRemove && (
                <button
                    onClick={onRemove}
                    className="text-red-500 ml-1 hover:text-red-700"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

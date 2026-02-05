import { getContactFields } from "@/api/contact";
import { generateGoogleSheetMapping, importGoogleSheet } from "@/api/customer";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaFolder } from "react-icons/fa6";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi";

export const CreateFromGGSheetDialog = ({ open, setOpen }) => {
    const [headerRow, setHeaderRow] = useState("1");
    const [sheetLink, setSheetLink] = useState("");
    const [headerRowError, setHeaderRowError] = useState("");
    const { orgId, workspaceId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [sheetData, setSheetData] = useState();
    const [mappingData, setMappingData] = useState();
    const [cokaFieldMenu, setCokaFieldMenu] = useState([]);

    useEffect(() => {
        const fetchContactFields = async () => {
            const fields = await getContactFields();
            setCokaFieldMenu(fields);
        };
        fetchContactFields();
    }, []);

    const handleCheckLink = async () => {
        if (!headerRow.trim()) {
            setHeaderRowError("Vui lòng nhập dòng tiêu đề");
            return;
        }
        setHeaderRowError("");
        setIsLoading(true);
        try {
            const res = await generateGoogleSheetMapping(
                orgId,
                workspaceId,
                sheetLink,
                headerRow,
            );
            if (res?.message)
                return setHeaderRowError(
                    res.message || "Có lỗi xảy ra khi kiểm tra link",
                );
            setSheetData(res.content);
            setMappingData(res.content.mappingField);
        } catch (error) {
            setHeaderRowError(
                error.message || "Có lỗi xảy ra khi kiểm tra link",
            );
        } finally {
            setIsLoading(false);
        }
    };
    const queryClient = useQueryClient();
    const handleSubmit = async () => {
        try {
            // if (!mappingData || mappingData.some(e => e.googleFieldTitle == "" || e.cokaField == "")) {
            //     return toast.error("Vui lòng nhập đầy đủ các trường");
            // }
            ToastPromise(() =>
                importGoogleSheet(
                    orgId,
                    workspaceId,
                    sheetLink,
                    headerRow,
                    sheetData.rowCount,
                    mappingData,
                ).then((res) => {
                    if (res?.message)
                        return toast.error(
                            res.message ??
                                "Đã có lỗi xảy ra, xin vui lòng thử lại",
                        );
                    toast.success(
                        "Đã thêm thành công. Hệ thống đang tiến hành xử lý, vui lòng chờ trong giây lát.",
                    );

                    queryClient.invalidateQueries({
                        queryKey: ["infinite-leads-body-filter", orgId],
                    });
                    setOpen(false);
                }),
            );
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra khi tạo");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px]">
                <div className="flex flex-col h-full">
                    <DialogHeader>
                        <DialogTitle
                            autoFocus
                            tabIndex={0}
                            className="font-medium"
                        >
                            Tạo từ Google Sheet
                        </DialogTitle>
                    </DialogHeader>
                    {sheetData ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col mt-4">
                                <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-t-md">
                                    <FaFolder className="text-green-300 text-3xl" />
                                    <div className="text-sm font-medium">
                                        {sheetData.sheetName}
                                    </div>
                                    <div className="p-2 ml-auto text-2xl flex items-center justify-center rounded-full bg-green-300/20">
                                        <FaCheck className="text-green-300" />
                                    </div>
                                </div>
                                <div className="p-3 bg-green-300/30 rounded-b-md text-sm">
                                    Đã lấy được {sheetData.rowCount} dữ liệu từ
                                    file
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 font-medium">
                                <div>
                                    Cấu hình Google Sheet{" "}
                                    <span className="text-red-500">*</span>
                                </div>
                                <div className="flex justify-between w-full text-xs mt-2">
                                    <div className="flex-1">
                                        Google Sheet field
                                    </div>
                                    <div className="w-[13%]" />
                                    <div className="flex-1">Coka field</div>
                                </div>
                                <ListCustomMapForm
                                    mappingData={mappingData}
                                    setMappingData={setMappingData}
                                    cokaFieldMenu={cokaFieldMenu}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3 py-4 mt-2">
                            <div className="flex items-center gap-2">
                                <Label
                                    htmlFor="headerRow"
                                    className="font-medium"
                                >
                                    Chọn dòng tiêu đề{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="focus:outline-none">
                                            <HiOutlineQuestionMarkCircle className="text-gray-500 hover:text-gray-700" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="right"
                                        sideOffset={5}
                                        className="text-sm flex flex-col gap-1 w-[340px] px-1 py-4"
                                    >
                                        <div className="font-medium text-sm mx-auto">
                                            Dòng tiêu đề
                                        </div>
                                        <Image
                                            src="/images/ggsheet_help.png"
                                            alt="google_sheet_header"
                                            width={340}
                                            height={120}
                                            unoptimized
                                        />
                                        <p className="text-[#47464F] px-3 mt-2">
                                            Đây là dòng đầu tiên của bản dữ liệu
                                            có chứa các nhãn hoặc tiêu đề mô tả
                                            các cột dưới đó. (Ở ví dụ phía trên
                                            dòng tiêu đề là 3)
                                        </p>
                                        <p className="px-3 text-[#47464F]">
                                            Tham khảo mẫu Google Sheet
                                            <a
                                                href="https://docs.google.com/spreadsheets/d/1vRko0ty3vUEIjewK6hHgK4XKf9a2uRB8cyuYixV_1_M/edit?gid=0#gid=0"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline ml-1"
                                            >
                                                tại đây
                                            </a>
                                        </p>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Input
                                    id="headerRow"
                                    type="number"
                                    value={headerRow}
                                    onChange={(e) => {
                                        setHeaderRow(e.target.value);
                                        setHeaderRowError("");
                                    }}
                                    className={`col-span-3 ${
                                        headerRowError ? "border-red-500" : ""
                                    }`}
                                    required
                                />
                                {headerRowError && (
                                    <p className="text-red-500 text-sm">
                                        {headerRowError}
                                    </p>
                                )}
                            </div>
                            <div className="flex w-full">
                                <Input
                                    id="sheetLink"
                                    value={sheetLink}
                                    placeholder="Nhập link Google Sheet"
                                    onChange={(e) =>
                                        setSheetLink(e.target.value)
                                    }
                                    className="rounded-r-none w-full"
                                />

                                <Button
                                    className="rounded-l-none"
                                    onClick={handleCheckLink}
                                    loading={isLoading}
                                    disabled={!sheetLink || isLoading}
                                >
                                    Kiểm tra
                                </Button>
                            </div>
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-[60%] self-center mt-auto"
                        onClick={handleSubmit}
                    >
                        Hoàn tất
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
const ListCustomMapForm = ({ mappingData, setMappingData, cokaFieldMenu }) => {
    const handleUpdateZaloField = (index, value) => {
        const updatedMapData = [...mappingData];
        updatedMapData[index].googleFieldTitle = value;
        setMappingData(updatedMapData);
    };

    const handleUpdateCokaField = (index, value) => {
        const updatedMapData = [...mappingData];
        updatedMapData[index].cokaField = value;
        setMappingData(updatedMapData);
    };

    return (
        <div className="flex flex-col gap-2 w-full pb-4 max-h-[400px] overflow-y-auto">
            {mappingData?.map((e, i) => (
                <CustomMapForm
                    key={`custom-map-${i}`}
                    ggField={e.googleFieldTitle}
                    setGgField={(value) => handleUpdateZaloField(i, value)}
                    cokaField={e.cokaField}
                    setCokaField={(value) => handleUpdateCokaField(i, value)}
                    cokaFieldMenu={cokaFieldMenu}
                />
            ))}
        </div>
    );
};
const CustomMapForm = ({
    ggField,
    cokaField,
    setGgField,
    setCokaField,
    cokaFieldMenu,
}) => {
    return (
        <div className="flex items-center w-full">
            <Input
                value={ggField}
                onChange={(e) => setGgField(e.target.value)}
                placeholder="Nội dung"
                className="mt-2 rounded-xl"
            />
            <div className="w-[30%] h-[0.5px] bg-black/40" />
            <Select defaultValue={cokaField} onValueChange={setCokaField}>
                <SelectTrigger className="mt-2 w-[10vw] min-w-[10vw]">
                    {cokaField == "" ? (
                        <div className="text-black/40">Input Field</div>
                    ) : (
                        cokaFieldMenu.find((e) => e.id == cokaField)?.name
                    )}
                </SelectTrigger>
                <SelectContent>
                    {cokaFieldMenu.map((e, i) => (
                        <SelectItem key={e.id} value={e.id}>
                            {e.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

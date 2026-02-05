import { CalendarIcon, Copy } from "lucide-react";
import { CalendarDate, parseDate } from "@internationalized/date";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { useEffect, useRef, useState } from "react";
import { BsPerson } from "react-icons/bs";
import { MdOutlinePhotoCamera } from "react-icons/md";
import Image from "next/image";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { customerSources } from "@/lib/customerConstants";
import { IoIosArrowForward } from "react-icons/io";
import { MdArrowBack } from "react-icons/md";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import toast from "react-hot-toast";
import {
    createCustomer,
    getCustomerDetail,
    updateCustomer,
} from "@/api/customer";
import { useCustomerList, useCustomerParams } from "@/hooks/customers_data";
import { getSourceList, getUtmSourceList, getTagList } from "@/api/workspace";
import CreatableSelect from "react-select/creatable";
import { DateField, DateInput } from "@/components/ui/datefield";

const CustomInput = ({ children, ...prop }) => {
    return (
        <div className="flex">
            <div className="pl-4 pr-2 bg-bg1 rounded-l-xl whitespace-nowrap flex-nowrap flex items-center justify-center">
                <div className="border-r-[1px] pr-2 text-sm">{children}</div>
            </div>
            <input
                {...prop}
                variant="outline"
                onChange={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    if (prop.onChange) {
                        prop.onChange(e);
                    }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
        </div>
    );
};

export function CustomerUpdateCreate({ isUpdate, data, open, setOpen }) {
    // Tách state thành các object riêng biệt cho từng tab
    const [basicInfo, setBasicInfo] = useState({
        name: isUpdate ? data?.fullName : "",
        phone: isUpdate ? data?.phone : "",
        email: isUpdate ? data?.email : "",
        source: "",
        tags: [],
    });

    const [personalInfo, setPersonalInfo] = useState({
        work: "",
        gender: "",
        dob: undefined,
        address: "",
        pid: "",
        tempDob: "",
    });

    // Cập nhật personalInfo khi data thay đổi
    useEffect(() => {
        if (isUpdate && data) {
            setPersonalInfo({
                work: data.work || "",
                gender: data.gender !== undefined ? data.gender : "",
                dob: data.dob ? parseDate(data.dob.split("T")[0]) : undefined,
                address: data.address || "",
                pid: data.physicalId || "",
                tempDob: "",
            });
        }
    }, [isUpdate, data]);

    const [socialInfo, setSocialInfo] = useState({
        fbUrl: "",
        zaloUrl: "",
    });

    // Handlers cho basic info
    const handleBasicInfoChange = (field, value) => {
        setBasicInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handlers cho personal info
    const handlePersonalInfoChange = (field, value) => {
        setPersonalInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handlers cho social info
    const handleSocialInfoChange = (field, value) => {
        setSocialInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const [infoPage, setInfoPage] = useState(false);
    const [socialPage, setSocialPage] = useState(false);
    const defaultAvatar = isUpdate && data?.avatar;
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);
    const { orgId, workspaceId } = useCustomerParams();
    const { setAddCustomer, setUpdateCustomer, setRefresh } = useCustomerList();
    const [sources, setSources] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        if (data) {
            getCustomerDetail(orgId, workspaceId, data.id).then((res) => {
                if (res?.message) return toast.error(res.message);
                const resData = res.content;
                setBasicInfo((prev) => ({
                    ...prev,
                    email: resData?.email,
                    source: resData?.source?.[resData?.source?.length - 1]
                        ?.utmSource,
                    tags: resData?.tags.map((tag) => ({
                        value: tag,
                        label: tag,
                    })),
                }));
                setSocialInfo((prev) => ({
                    ...prev,
                    fbUrl: resData?.social?.find(
                        (e) => e.provider == "FACEBOOK"
                    )?.profileUrl,
                    zaloUrl: resData?.social?.find((e) => e.provider == "ZALO")
                        ?.profileUrl,
                }));
            });
        }
    }, []);

    useEffect(() => {
        const fetchSourcesAndTags = async () => {
            try {
                // Fetch sources
                const sourcesResponse = await getUtmSourceList(
                    orgId,
                    workspaceId
                );
                if (sourcesResponse?.content) {
                    const apiSources = sourcesResponse.content.map(
                        (source) => ({
                            value: source.name,
                            label: source.name,
                        })
                    );
                    setSources(apiSources);
                }

                // Fetch tags
                const tagsResponse = await getTagList(orgId, workspaceId);
                if (tagsResponse?.content) {
                    const apiTags = tagsResponse.content.map((tag) => ({
                        value: tag.name,
                        label: tag.name,
                    }));
                    setAvailableTags(apiTags);
                }
            } catch (error) {
                console.error("Error fetching sources and tags:", error);
                toast.error("Có lỗi khi tải danh sách nguồn và nhãn");
            }
        };

        fetchSourcesAndTags();
    }, [orgId, workspaceId]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };
    const handleSubmit = () => {
        let jsonSocialList = [];
        let jsonTagsList = [];

        if (!basicInfo.name)
            return toast.error("Vui lòng nhập tên khách hàng", {
                position: "top-center",
            });
        if (!basicInfo.phone)
            return toast.error("Vui lòng nhập số điện thoại", {
                position: "top-center",
            });
        const formData = new FormData();
        if (avatarFile) {
            formData.append("Avatar", avatarFile);
        }

        if (socialInfo.fbUrl) {
            jsonSocialList.push({
                Provider: "FACEBOOK",
                ProfileUrl: socialInfo.fbUrl,
            });
        }
        if (socialInfo.zaloUrl) {
            jsonSocialList.push({
                Provider: "ZALO",
                ProfileUrl: socialInfo.zaloUrl,
            });
        }
        formData.append("FullName", basicInfo.name);
        formData.append("Phone", basicInfo.phone);
        formData.append("SourceId", "ce7f42cf-f10f-49d2-b57e-0c75f8463c82");
        if (personalInfo.pid) {
            formData.append("PhysicalId", personalInfo.pid);
        }
        if (basicInfo.source) {
            formData.append("UtmSource", basicInfo.source);
        }
        if (basicInfo.email) {
            formData.append("Email", basicInfo.email);
        }
        if (personalInfo.dob) {
            formData.append("Dob", personalInfo.dob.toString());
        }
        if (personalInfo.gender != undefined) {
            formData.append("Gender", personalInfo.gender);
        }
        if (personalInfo.address) {
            formData.append("Address", personalInfo.address);
        }
        if (personalInfo.work) {
            formData.append("Work", personalInfo.work);
        }
        if (jsonSocialList.length != 0) {
            formData.append("JsonSocial", JSON.stringify(jsonSocialList));
        }
        if (basicInfo.tags.length > 0) {
            jsonTagsList = basicInfo.tags.map((tag) => tag.value);
            formData.append("JsonTags", JSON.stringify(jsonTagsList));
        }
        if (isUpdate) {
            updateCustomer(orgId, workspaceId, data.id, formData).then(
                (res) => {
                    if (res?.message)
                        return toast.error(res.message, {
                            position: "top-center",
                        });
                    toast.success(
                        `Bạn đã cập nhật khách hàng ${basicInfo.name} thành công`,
                        {
                            position: "top-center",
                        }
                    );
                    setOpen(false);
                    setUpdateCustomer();
                }
            );
        } else {
            createCustomer(orgId, workspaceId, formData).then((res) => {
                if (res?.message)
                    return toast.error(res.message, { position: "top-center" });
                if (!res?.code)
                    return toast.error(
                        "Đã có lỗi xảy ra xin vui lòng thử lại",
                        {
                            position: "top-center",
                        }
                    );
                toast.success(
                    `Bạn đã tạo khách hàng ${basicInfo.name} thành công`,
                    {
                        position: "top-center",
                    }
                );
                setOpen(false);
                setAddCustomer(res.content.id);
            });
        }
    };

    const customStyles = {
        control: (base) => ({
            ...base,
            backgroundColor: "#fafafa", // bg-bg1
            border: "none",
            borderRadius: "0.75rem",
            boxShadow: "none",
            "&:hover": {
                border: "none",
            },
        }),
        menu: (base) => ({
            ...base,
            borderRadius: "0.75rem",
            overflow: "hidden",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#fafafa" : "white",
            color: "#000",
            fontWeight: state.isSelected && "bold",
            "&:hover": {
                backgroundColor: "#fafafa",
            },
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: "#F5F2FF",
            borderRadius: "16px",
            padding: "2px 4px",
            margin: "2px",
        }),
        multiValueLabel: (base) => ({
            ...base,
            fontSize: "14px",
            padding: "2px 6px",
            fontWeight: "500",
        }),
        multiValueRemove: (base) => ({
            ...base,
            ":hover": {
                backgroundColor: "#F5F2FF",
                borderRadius: "50%",
            },
            borderRadius: "50%",
            padding: "2px",
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "4px 8px",
            gap: "4px",
            flexWrap: "wrap",
        }),
    };

    const handleCreateOption = (inputValue) => {
        const newOption = { value: inputValue, label: inputValue };
        setSources((prev) => [...prev, newOption]);
        handleBasicInfoChange("source", inputValue);
    };

    const handleCreateTag = (inputValue) => {
        const newTag = { value: inputValue, label: inputValue };
        setAvailableTags((prev) => [...prev, newTag]);
        handleBasicInfoChange("tags", [...basicInfo.tags, newTag]);
    };

    // Handlers for tab switching
    const handleSwitchToInfoPage = () => {
        // Save current tab state if needed
        setInfoPage(true);
    };

    const handleSwitchToSocialPage = () => {
        // Save current tab state if needed
        setSocialPage(true);
    };

    const handleBackFromInfoPage = () => {
        setInfoPage(false);
    };

    const handleBackFromSocialPage = () => {
        setSocialPage(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={true}>
            <DialogContent
                className="grid sm:max-w-xl h-auto pt-4 transition-all"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    {socialPage ? (
                        <DialogTitle className={dialogTitleStyle}>
                            <div className="flex items-center gap-2">
                                <MdArrowBack
                                    className="cursor-pointer"
                                    onClick={handleBackFromSocialPage}
                                />
                                Mạng xã hội
                            </div>
                        </DialogTitle>
                    ) : infoPage ? (
                        <DialogTitle className={dialogTitleStyle}>
                            <div className="flex items-center gap-2">
                                <MdArrowBack
                                    className="cursor-pointer"
                                    onClick={handleBackFromInfoPage}
                                />
                                Thông tin cá nhân
                            </div>
                        </DialogTitle>
                    ) : (
                        <DialogTitle className={dialogTitleStyle}>
                            {isUpdate
                                ? "Cập nhật khách hàng"
                                : "Thêm khách hàng"}
                        </DialogTitle>
                    )}
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                {socialPage ? (
                    <div className="flex flex-col items-center">
                        <div className="flex flex-col w-full mt-2 gap-3">
                            <CustomInput
                                placeHolder="Điền link"
                                value={socialInfo.fbUrl}
                                onChange={(e) =>
                                    handleSocialInfoChange(
                                        "fbUrl",
                                        e.target.value
                                    )
                                }
                            >
                                Facebook
                            </CustomInput>
                            <CustomInput
                                placeHolder="Điền link"
                                value={socialInfo.zaloUrl}
                                onChange={(e) =>
                                    handleSocialInfoChange(
                                        "zaloUrl",
                                        e.target.value
                                    )
                                }
                            >
                                Zalo
                            </CustomInput>
                        </div>
                    </div>
                ) : infoPage ? (
                    <div className="flex flex-col items-center">
                        <div className="flex flex-col w-full mt-4 gap-2">
                            <div className="text-title font-medium">
                                Giới tính
                            </div>
                            <Select
                                value={personalInfo.gender}
                                onValueChange={(val) =>
                                    handlePersonalInfoChange("gender", val)
                                }
                            >
                                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <SelectValue placeholder="Chọn giới tính" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {[
                                            { label: "Nam", value: 1 },
                                            { label: "Nữ", value: 0 },
                                            { label: "Khác", value: 2 },
                                        ].map((e, i) => (
                                            <SelectItem key={i} value={e.value}>
                                                {e.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col w-full mt-4 gap-2">
                            <div className="text-title font-medium">
                                Ngày sinh
                            </div>
                            <DateField
                                value={personalInfo.dob}
                                onChange={(date) =>
                                    handlePersonalInfoChange("dob", date)
                                }
                            >
                                <DateInput
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="dd/MM/yyyy"
                                />
                            </DateField>
                        </div>
                        <div className="flex flex-col w-full mt-6 gap-2">
                            <div className="text-title font-medium">
                                Nghề nghiệp
                            </div>
                            <Input
                                placeHolder="Nhập nghề nghiệp"
                                value={personalInfo.work}
                                onChange={(e) =>
                                    handlePersonalInfoChange(
                                        "work",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="flex flex-col w-full mt-6 gap-2">
                            <div className="text-title font-medium">
                                Địa chỉ
                            </div>
                            <Input
                                placeHolder="Nhập địa chỉ"
                                value={personalInfo.address}
                                onChange={(e) =>
                                    handlePersonalInfoChange(
                                        "address",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="flex flex-col w-full mt-6 gap-2">
                            <div className="text-title font-medium">
                                CMND/CCCD
                            </div>
                            <Input
                                placeHolder="Nhập CMND/CCCD"
                                value={personalInfo.pid}
                                onChange={(e) =>
                                    handlePersonalInfoChange(
                                        "pid",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center max-h-[70dvh] overflow-y-auto">
                        <div
                            className="cursor-pointer"
                            onClick={handleButtonClick}
                        >
                            {avatarPreview || defaultAvatar ? (
                                <Image
                                    alt="avatar"
                                    src={avatarPreview ?? defaultAvatar}
                                    width={80}
                                    height={80}
                                    className="w-[80px] aspect-square object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-[80px] aspect-square rounded-full bg-bg1 flex items-center justify-center relative">
                                    <BsPerson className="text-4xl" />
                                    <MdOutlinePhotoCamera className="absolute bottom-1 right-1 text-[18px]" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="flex flex-col w-full mt-6 gap-2">
                            <div className="text-title font-medium">
                                Họ và tên{" "}
                                <span className="text-[#FF0000]">*</span>
                            </div>
                            <Input
                                placeHolder="Họ tên khách hàng"
                                value={basicInfo.name}
                                onChange={(e) =>
                                    handleBasicInfoChange(
                                        "name",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="flex flex-col w-full mt-4 gap-2">
                            <div className="text-title font-medium">
                                Số Điện Thoại{" "}
                                <span className="text-[#FF0000]">*</span>
                            </div>
                            <CustomInput
                                disabled={isUpdate}
                                placeHolder="Điền số điện thoại"
                                value={basicInfo.phone}
                                onChange={(e) =>
                                    handleBasicInfoChange(
                                        "phone",
                                        e.target.value
                                    )
                                }
                            >
                                Liên hệ chính
                            </CustomInput>
                        </div>
                        <div className="flex flex-col w-full mt-4 gap-2">
                            <div className="text-title font-medium">Email</div>
                            <CustomInput
                                placeHolder="Điền email"
                                value={basicInfo.email}
                                onChange={(e) =>
                                    handleBasicInfoChange(
                                        "email",
                                        e.target.value
                                    )
                                }
                            >
                                Email chính
                            </CustomInput>
                        </div>
                        <div className="flex flex-col w-full mt-4 gap-2">
                            <div className="text-title font-medium">
                                Nguồn khách hàng
                            </div>
                            <CreatableSelect
                                isClearable
                                styles={customStyles}
                                options={sources}
                                value={
                                    sources.find(
                                        (option) =>
                                            option.value === basicInfo.source
                                    ) || null
                                }
                                onChange={(newValue) =>
                                    handleBasicInfoChange(
                                        "source",
                                        newValue?.value || ""
                                    )
                                }
                                onCreateOption={handleCreateOption}
                                placeholder="Chọn hoặc nhập nguồn"
                                formatCreateLabel={(inputValue) =>
                                    `Thêm "${inputValue}"`
                                }
                                noOptionsMessage={() => "Không có lựa chọn"}
                            />
                        </div>
                        <div className="flex flex-col w-full mt-4 gap-2">
                            <div className="text-title font-medium">Nhãn</div>
                            <CreatableSelect
                                isMulti
                                isClearable
                                styles={customStyles}
                                options={availableTags}
                                value={basicInfo.tags}
                                onChange={(newValue) =>
                                    handleBasicInfoChange(
                                        "tags",
                                        newValue || []
                                    )
                                }
                                onCreateOption={handleCreateTag}
                                placeholder="Chọn hoặc nhập nhãn"
                                formatCreateLabel={(inputValue) =>
                                    `Thêm nhãn "${inputValue}"`
                                }
                                noOptionsMessage={() => "Không có lựa chọn"}
                            />
                        </div>
                        <div
                            onClick={handleSwitchToInfoPage}
                            className="flex justify-between items-center w-full mt-4 cursor-pointer"
                        >
                            <div className="text-title font-medium">
                                Thông tin cá nhân
                            </div>
                            <IoIosArrowForward className="text-xl" />
                        </div>
                        <div
                            onClick={handleSwitchToSocialPage}
                            className="flex justify-between items-center w-full mt-4 cursor-pointer"
                        >
                            <div className="text-title font-medium">
                                Mạng xã hội
                            </div>
                            <IoIosArrowForward className="text-xl" />
                        </div>
                    </div>
                )}
                <DialogFooter className="sm:justify-end">
                    {!(socialPage || infoPage) && (
                        <Button
                            type="button"
                            variant="default"
                            className="h-[35px]"
                            onClick={handleSubmit}
                        >
                            Hoàn thành
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const dialogTitleStyle =
    "font-medium text-[18px] text-title flex items-center justify-between mb-3";

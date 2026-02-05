import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { dialogTitleStyle } from "@/components/customer_update_create";
import { IoMdClose } from "react-icons/io";
import Image from "next/image";
import { BsPerson } from "react-icons/bs";
import { MdOutlinePhotoCamera } from "react-icons/md";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createOrganization } from "@/api/org";
import { useOrgList } from "@/hooks/orgs_data";
import toast from "react-hot-toast";

export function CreateOrgDialog({ open, setOpen }) {
    const [avatar, setAvatar] = useState(null);
    const [desc, setDesc] = useState();
    const [website, setWebsite] = useState();
    const [address, setAddress] = useState();
    const [hotline, setHotline] = useState();
    const [field, setField] = useState();
    const [companyName, setCompanyName] = useState();
    const [name, setName] = useState();
    const fileInputRef = useRef(null);
    const { setRefreshOrgList } = useOrgList();
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setAvatar(URL.createObjectURL(file));
    };
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };
    const handleSubmit = () => {
        if (!name)
            return toast.error("Vui lòng nhập tên tổ chức", {
                position: "top-center",
            });
        const formData = new FormData();
        if (avatar) {
            formData.append("Avatar", avatar);
        }
        formData.append("Name", name);
        if (desc) {
            formData.append("Description", desc);
        }
        if (address) {
            formData.append("Address", address);
        }
        if (website) {
            formData.append("Website", website);
        }
        if (hotline) {
            formData.append("Hotline", hotline);
        }
        if (companyName) {
            formData.append("CompanyName", companyName);
        }
        if (field) {
            formData.append("FieldOfActivity", field);
        }
        createOrganization(formData).then((res) => {
            if (res?.message)
                return toast.error(res.message, { position: "top-center" });
            toast.success(`Bạn đã tạo tổ chức ${name} thành công`, {
                position: "top-center",
            });
            setOpen(false);
            setRefreshOrgList();
        });
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[80dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className={dialogTitleStyle}>
                        Tạo tổ chức
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                <div className="flex flex-col items-center">
                    <div className="cursor-pointer" onClick={handleButtonClick}>
                        {avatar ? (
                            <Image
                                alt="avatar"
                                src={avatar}
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
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="flex flex-col w-full mt-6 gap-2">
                        <div className="text-title font-medium">
                            Tên tổ chức{" "}
                            <span className="text-[#FF0000]">*</span>
                        </div>
                        <Input
                            placeHolder="Tên tổ chức"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col w-full mt-4 gap-2">
                        <div className="text-title font-medium">Mô tả</div>
                        <Textarea
                            placeHolder="Mô tả"
                            value={desc}
                            onChange={(e) => {
                                setDesc(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col w-full mt-4 gap-2">
                        <div className="text-title font-medium">Trang web</div>
                        <Input
                            placeHolder="Nhập website"
                            value={website}
                            onChange={(e) => {
                                setWebsite(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col w-full mt-4 gap-2">
                        <div className="text-title font-medium">Địa chỉ</div>
                        <Input
                            placeHolder="Nhập địa chỉ"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col w-full mt-4 gap-2">
                        <div className="text-title font-medium">
                            Tên công ty
                        </div>
                        <Input
                            placeHolder="Nhập tên công ty"
                            value={companyName}
                            onChange={(e) => {
                                setCompanyName(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col w-full mt-4 gap-2">
                        <div className="text-title font-medium">
                            Lĩnh vực hoạt động
                        </div>
                        <Input
                            placeHolder="Lĩnh vực hoạt động"
                            value={field}
                            onChange={(e) => {
                                setField(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col w-full mt-4 gap-2">
                        <div className="text-title font-medium">Hotline</div>
                        <Input
                            placeHolder="Hotline"
                            value={hotline}
                            onChange={(e) => {
                                setHotline(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="default"
                        className="h-[35px]"
                        onClick={handleSubmit}
                    >
                        Hoàn thành
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

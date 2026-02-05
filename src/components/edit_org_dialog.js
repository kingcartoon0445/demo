import { updateOrg, updateOrgAvatar } from "@/api/org";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getAvatarUrl } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BsPerson } from "react-icons/bs";
import { MdOutlinePhotoCamera } from "react-icons/md";
import { Label } from "./ui/label";

export function EditOrgDialog({ open, setOpen, currentOrg, onSuccess }) {
    const [avatar, setAvatar] = useState(currentOrg?.avatar || null);
    const [desc, setDesc] = useState(currentOrg?.description || "");
    const [website, setWebsite] = useState(currentOrg?.website || "");
    const [address, setAddress] = useState(currentOrg?.address || "");
    const [hotline, setHotline] = useState(currentOrg?.hotline || "");
    const [field, setField] = useState(currentOrg?.fieldOfActivity || "");
    const [companyName, setCompanyName] = useState(
        currentOrg?.companyName || ""
    );
    const [name, setName] = useState(currentOrg?.name || "");
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (currentOrg) {
            setName(currentOrg.name || "");
            setDesc(currentOrg.description || "");
            setWebsite(currentOrg.website || "");
            setAddress(currentOrg.address || "");
            setHotline(currentOrg.hotline || "");
            setField(currentOrg.fieldOfActivity || "");
            setCompanyName(currentOrg.companyName || "");
            setAvatar(getAvatarUrl(currentOrg.avatar) || null);
        }
    }, [currentOrg]);

    const handleSubmit = async () => {
        if (!name) {
            return toast.error("Vui lòng nhập tên tổ chức", {
                position: "top-center",
            });
        }

        try {
            if (avatar && avatar !== getAvatarUrl(currentOrg?.avatar)) {
                const avatarBlob = await fetch(avatar).then((r) => r.blob());
                if (
                    ![
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "image/webp",
                    ].includes(avatarBlob.type)
                ) {
                    return toast.error("Định dạng file không hợp lệ", {
                        position: "top-center",
                    });
                }
                const avatarForm = new FormData();
                avatarForm.append("file", avatarBlob, "avatar.jpg");
                await updateOrgAvatar(currentOrg.id, avatarForm);
            }

            const formData = new FormData();
            formData.append("Name", name);
            formData.append("Description", desc);
            formData.append("Address", address);
            formData.append("Website", website);
            formData.append("Hotline", hotline);
            formData.append("CompanyName", companyName);
            formData.append("FieldOfActivity", field);

            if (formData.entries().next().done) {
                setOpen(false);
                return;
            }

            const res = await updateOrg(currentOrg.id, formData);
            if (res?.message) {
                return toast.error(res.message, { position: "top-center" });
            }

            toast.success("Cập nhật tổ chức thành công", {
                position: "top-center",
            });
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error("Có lỗi xảy ra khi cập nhật tổ chức", {
                position: "top-center",
            });
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const validImageTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
            ];
            if (!validImageTypes.includes(file.type)) {
                toast.error(
                    "Định dạng file không hợp lệ. Vui lòng chọn file ảnh (JPG, PNG, GIF, WEBP)",
                    {
                        position: "top-center",
                    }
                );
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[500px] max-h-[100vh] overflow-y-auto p-0 custom-scrollbar">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Chỉnh sửa tổ chức</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 bg-white">
                    <div className="flex flex-col px-6 items-center">
                        <div
                            className="cursor-pointer"
                            onClick={handleButtonClick}
                        >
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
                            <Label className="block text-sm font-medium mb-1">
                                Tên tổ chức{" "}
                                <span className="text-[#FF0000]">*</span>
                            </Label>
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
                            <Label className="block text-sm font-medium mb-1">
                                Trang web
                            </Label>
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
                            <div className="text-title font-medium">
                                Địa chỉ
                            </div>
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
                            <Label className="block text-sm font-medium mb-1">
                                Tên công ty
                            </Label>
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
                            <Label className="block text-sm font-medium mb-1">
                                Lĩnh vực hoạt động
                            </Label>
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
                            <Label className="block text-sm font-medium mb-1">
                                Hotline
                            </Label>
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
                </ScrollArea>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit}>Hoàn thành</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

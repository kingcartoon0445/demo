"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createEmail, updateEmail } from "@/api/email";
import toast from "react-hot-toast";

interface EmailConfig {
    id: string;
    title: string;
    description: string;
    serverName: string;
    port: number;
    connectionSecurity: string;
    displayName?: string;
    userName: string;
    password: string;
}

interface EmailConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    config: EmailConfig | null;
    mode: "create" | "edit";
    orgId: string;
}

const connectionSecurityOptions = [
    { value: "none", label: "Không bảo mật" },
    { value: "ssl", label: "SSL" },
    { value: "tls", label: "TLS" },
    { value: "starttls", label: "STARTTLS" },
];

export default function EmailConfigModal({
    isOpen,
    onClose,
    onSuccess,
    config,
    mode,
    orgId,
}: EmailConfigModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        serverName: "",
        port: "" as string | number,
        connectionSecurity: "tls",
        displayName: "",
        userName: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when modal opens/closes or config changes
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && config) {
                setFormData({
                    title: config.title || "",
                    description: config.description || "",
                    serverName: config.serverName || "",
                    port: config.port ?? "",
                    connectionSecurity: config.connectionSecurity || "tls",
                    displayName: (config as any).displayName || "",
                    userName: config.userName || "",
                    password: "", // Don't pre-fill password for security
                });
            } else {
                setFormData({
                    title: "",
                    description: "",
                    serverName: "",
                    port: "",
                    connectionSecurity: "tls",
                    displayName: "",
                    userName: "",
                    password: "",
                });
            }
        }
    }, [isOpen, mode, config]);

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error("Vui lòng nhập tiêu đề");
            return;
        }
        if (!formData.serverName.trim()) {
            toast.error("Vui lòng nhập tên server");
            return;
        }
        if (!formData.userName.trim()) {
            toast.error("Vui lòng nhập tên đăng nhập");
            return;
        }
        if (
            formData.port === "" ||
            formData.port === null ||
            formData.port === undefined
        ) {
            toast.error("Vui lòng nhập port");
            return;
        }
        const portNumber = Number(formData.port);
        if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
            toast.error("Port phải là số từ 1 đến 65535");
            return;
        }
        if (mode === "create" && !formData.password.trim()) {
            toast.error("Vui lòng nhập mật khẩu");
            return;
        }

        setIsLoading(true);
        try {
            const submitData: any = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                serverName: formData.serverName.trim(),
                port: portNumber,
                connectionSecurity: formData.connectionSecurity,
                userName: formData.userName.trim(),
                password: formData.password.trim(),
            };

            // Chỉ thêm displayName nếu có giá trị
            if (formData.displayName.trim()) {
                submitData.displayName = formData.displayName.trim();
            }

            if (mode === "create") {
                await createEmail(orgId, submitData);
                toast.success("Tạo cấu hình email thành công");
            } else {
                await updateEmail(orgId, config!.id, submitData);
                toast.success("Cập nhật cấu hình email thành công");
            }

            onSuccess();
        } catch (error) {
            console.error("Error saving email config:", error);
            toast.error(
                mode === "create"
                    ? "Không thể tạo cấu hình email"
                    : "Không thể cập nhật cấu hình email"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="min-w-[800px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? "Thêm cấu hình email"
                            : "Chỉnh sửa cấu hình email"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <Label htmlFor="title" className="mb-2">
                                Tiêu đề <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    handleInputChange("title", e.target.value)
                                }
                                placeholder="Nhập tiêu đề cấu hình"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description" className="mb-2">
                                Mô tả
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập mô tả cấu hình"
                                rows={3}
                            />
                        </div>

                        {/* Server Name, Port, Connection Security - Row 1 */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Label htmlFor="serverName" className="mb-2">
                                    Tên server{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="serverName"
                                    value={formData.serverName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "serverName",
                                            e.target.value
                                        )
                                    }
                                    placeholder="smtp.gmail.com"
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <Label htmlFor="port" className="mb-2">
                                    Port <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={formData.port}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Cho phép xóa hoàn toàn, không tự động fallback
                                        if (value === "") {
                                            handleInputChange("port", "");
                                        } else {
                                            const numValue = parseInt(
                                                value,
                                                10
                                            );
                                            if (!isNaN(numValue)) {
                                                handleInputChange(
                                                    "port",
                                                    numValue
                                                );
                                            }
                                        }
                                    }}
                                    placeholder="587"
                                    min="1"
                                    max="65535"
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <Label
                                    htmlFor="connectionSecurity"
                                    className="mb-2"
                                >
                                    Bảo mật kết nối
                                </Label>
                                <Select
                                    value={formData.connectionSecurity}
                                    onValueChange={(value) =>
                                        handleInputChange(
                                            "connectionSecurity",
                                            value
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder="Chọn loại bảo mật"
                                            className="w-full"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {connectionSecurityOptions.map(
                                            (option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div>
                            <Label htmlFor="displayName" className="mb-2">
                                Tên hiển thị
                            </Label>
                            <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) =>
                                    handleInputChange(
                                        "displayName",
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>

                        {/* User Name and Password - Row 2 */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Label htmlFor="userName" className="mb-2">
                                    Tên đăng nhập{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="userName"
                                    value={formData.userName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "userName",
                                            e.target.value
                                        )
                                    }
                                    placeholder="your-email@gmail.com"
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <Label htmlFor="password" className="mb-2">
                                    Mật khẩu{" "}
                                    {mode === "create" ? (
                                        <span className="text-red-500">*</span>
                                    ) : (
                                        "(để trống nếu không muốn thay đổi)"
                                    )}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "password",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nhập mật khẩu"
                                    required={mode === "create"}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? "Đang lưu..."
                                : mode === "create"
                                    ? "Tạo"
                                    : "Cập nhật"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
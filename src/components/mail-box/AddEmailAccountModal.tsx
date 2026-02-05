"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createEmail } from "@/api/email";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface AddEmailAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    onSuccess?: () => void;
}

export function AddEmailAccountModal({
    isOpen,
    onClose,
    orgId,
    onSuccess,
}: AddEmailAccountModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        emailAddress: "",
        displayName: "",
        smtpType: "IMAP",
        server: "",
        port: "",
        username: "",
        password: "",
        useSsl: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.emailAddress.trim()) {
            newErrors.emailAddress = "Email address là bắt buộc";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
            newErrors.emailAddress = "Email address không hợp lệ";
        }

        if (!formData.displayName.trim()) {
            newErrors.displayName = "Display name là bắt buộc";
        }

        if (!formData.server.trim()) {
            newErrors.server = "Server là bắt buộc";
        }

        if (!formData.port.trim()) {
            newErrors.port = "Port là bắt buộc";
        } else if (isNaN(Number(formData.port)) || Number(formData.port) <= 0) {
            newErrors.port = "Port phải là số dương";
        }

        if (!formData.username.trim()) {
            newErrors.username = "Username là bắt buộc";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Password là bắt buộc";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                emailAddress: formData.emailAddress,
                displayName: formData.displayName,
                smtpType: formData.smtpType,
                server: formData.server,
                port: Number(formData.port),
                username: formData.username,
                password: formData.password,
                useSsl: formData.useSsl,
            };

            const response = await createEmail(orgId, payload);

            if ((response as any)?.code === 0) {
                toast.success("Tạo tài khoản email thành công!");
                onSuccess?.();
                handleClose();
            } else {
                toast.error(
                    (response as any)?.message ||
                    "Có lỗi xảy ra khi tạo tài khoản"
                );
            }
        } catch (error: any) {
            console.error("Error creating email account:", error);
            toast.error(
                error?.response?.data?.message ||
                "Có lỗi xảy ra khi tạo tài khoản"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            emailAddress: "",
            displayName: "",
            smtpType: "IMAP",
            server: "",
            port: "",
            username: "",
            password: "",
            useSsl: true,
        });
        setErrors({});
        setShowPassword(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent
                className="max-w-2xl p-0 gap-0 bg-white"
                showCloseButton={false}
            >
                <DialogHeader className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            Thêm tài khoản email
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-8 w-8"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 py-6">
                    <div className="space-y-5">
                        {/* Email Address */}
                        <div>
                            <Label
                                htmlFor="emailAddress"
                                className="text-sm font-medium"
                            >
                                Email Address{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="emailAddress"
                                type="email"
                                placeholder="example@domain.com"
                                value={formData.emailAddress}
                                onChange={(e) =>
                                    handleInputChange(
                                        "emailAddress",
                                        e.target.value
                                    )
                                }
                                className={cn(
                                    "mt-1.5",
                                    errors.emailAddress && "border-red-500"
                                )}
                                disabled={isLoading}
                            />
                            {errors.emailAddress && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.emailAddress}
                                </p>
                            )}
                        </div>

                        {/* Display Name */}
                        <div>
                            <Label
                                htmlFor="displayName"
                                className="text-sm font-medium"
                            >
                                Display Name{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="displayName"
                                placeholder="Tên hiển thị"
                                value={formData.displayName}
                                onChange={(e) =>
                                    handleInputChange(
                                        "displayName",
                                        e.target.value
                                    )
                                }
                                className={cn(
                                    "mt-1.5",
                                    errors.displayName && "border-red-500"
                                )}
                                disabled={isLoading}
                            />
                            {errors.displayName && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.displayName}
                                </p>
                            )}
                        </div>

                        {/* SMTP Type */}
                        <div>
                            <Label
                                htmlFor="smtpType"
                                className="text-sm font-medium"
                            >
                                SMTP Type{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.smtpType}
                                onValueChange={(value) =>
                                    handleInputChange("smtpType", value)
                                }
                                disabled={isLoading}
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IMAP">IMAP</SelectItem>
                                    <SelectItem value="SMTP">SMTP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Server & Port */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label
                                    htmlFor="server"
                                    className="text-sm font-medium"
                                >
                                    Server{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="server"
                                    placeholder="imap.gmail.com"
                                    value={formData.server}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "server",
                                            e.target.value
                                        )
                                    }
                                    className={cn(
                                        "mt-1.5",
                                        errors.server && "border-red-500"
                                    )}
                                    disabled={isLoading}
                                />
                                {errors.server && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.server}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label
                                    htmlFor="port"
                                    className="text-sm font-medium"
                                >
                                    Port <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="port"
                                    type="number"
                                    placeholder="993"
                                    value={formData.port}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "port",
                                            e.target.value
                                        )
                                    }
                                    className={cn(
                                        "mt-1.5",
                                        errors.port && "border-red-500"
                                    )}
                                    disabled={isLoading}
                                />
                                {errors.port && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.port}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <Label
                                htmlFor="username"
                                className="text-sm font-medium"
                            >
                                Username <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="username"
                                placeholder="username"
                                value={formData.username}
                                onChange={(e) =>
                                    handleInputChange(
                                        "username",
                                        e.target.value
                                    )
                                }
                                className={cn(
                                    "mt-1.5",
                                    errors.username && "border-red-500"
                                )}
                                disabled={isLoading}
                            />
                            {errors.username && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <Label
                                htmlFor="password"
                                className="text-sm font-medium"
                            >
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "password",
                                            e.target.value
                                        )
                                    }
                                    className={cn(
                                        "pr-10",
                                        errors.password && "border-red-500"
                                    )}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Use SSL */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="useSsl"
                                checked={formData.useSsl}
                                onChange={(e) =>
                                    handleInputChange(
                                        "useSsl",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 rounded border-gray-300 text-[#5c46e6] focus:ring-[#5c46e6]"
                                disabled={isLoading}
                            />
                            <Label
                                htmlFor="useSsl"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Use SSL
                            </Label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#5c46e6] hover:bg-[#4c36d6] text-white min-w-[100px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                "Tạo tài khoản"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

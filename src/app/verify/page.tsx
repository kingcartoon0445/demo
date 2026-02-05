"use client";
import { resendOtp, verifyOtp } from "@/api/auth";
import { updateProfile } from "@/api/user";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { InputOTP } from "@/components/ui/input-otp";
import { useOtpId } from "@/hooks/otp";
import { setAuthTokens, getAccessToken } from "@/lib/authCookies";
import { getAvatarUrl } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { MdOutlinePersonOutline } from "react-icons/md";
import { z } from "zod";
import OtpResend from "./components/otpResend";

const codeSchema = z.object({
    code: z.string().min(6, {
        message: "Your one-time password must be 6 characters.",
    }),
});

const useFocus = () => {
    const htmlElRef = useRef<HTMLDivElement>(null);
    const setFocus = () => {
        htmlElRef.current?.focus();
    };

    return [htmlElRef, setFocus] as const;
};

// Simple Avatar component
const Avatar = ({
    src,
    name,
    size = "80",
    className,
    onClick,
}: {
    src?: string;
    name?: string;
    size?: string;
    className?: string;
    onClick?: () => void;
}) => {
    if (src) {
        return (
            <img
                src={src}
                alt={name || "Avatar"}
                className={`w-[${size}px] h-[${size}px] rounded-full object-cover ${
                    className || ""
                }`}
                onClick={onClick}
            />
        );
    }

    return (
        <div
            className={`w-[${size}px] h-[${size}px] rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium ${
                className || ""
            }`}
            onClick={onClick}
        >
            {name ? name.charAt(0).toUpperCase() : "?"}
        </div>
    );
};

export default function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState("");
    const router = useRouter();
    const { otpId, setOtpId } = useOtpId();
    const [, setInputFocus] = useFocus();
    const [isNewUser, setIsNewUser] = useState(false);
    const codeForm = useForm({
        resolver: zodResolver(codeSchema),
        defaultValues: {
            code: "",
        },
    });
    const formSchema = z.object({
        fullName: z.string().min(1, { message: "Vui lòng nhập tên" }),
        email: z.string().email({ message: "Email không hợp lệ" }),
        phone: z.string().optional(),
        dob: z.string().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        avatar: z.string().optional(),
    });
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            dob: "",
            gender: "",
            address: "",
            avatar: "",
        },
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if user should be redirected
    useEffect(() => {
        // Only redirect if there's no otpId and component is mounted
        if (!otpId && typeof window !== "undefined") {
            // Nếu đã có accessToken (vừa verify xong), KHÔNG redirect về sign-in
            if (getAccessToken()) {
                return;
            }
            const timer = setTimeout(() => {
                router.push("/sign-in");
            }, 100); // Small delay to ensure otpId is loaded from localStorage

            return () => clearTimeout(timer);
        }
    }, [otpId, router]);

    useEffect(() => {
        if (form.getValues("avatar")) {
            setAvatarPreview(getAvatarUrl(form.getValues("avatar") || ""));
        }
    }, [form]);

    const onSubmit = async (formData: Record<string, string | undefined>) => {
        try {
            setIsLoading(true);
            const data = new FormData();

            // Thêm các trường form vào FormData
            Object.keys(formData).forEach((key) => {
                const value = formData[key];
                if (key === "dob" && value) {
                    data.append(key, new Date(value).toISOString());
                } else if (
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                ) {
                    data.append(key, value);
                }
            });

            // Thêm avatar nếu có
            if (avatar) {
                data.append("avatar", avatar, "avatar.jpg");
            }

            const response = await updateProfile(data);

            if (response.code == 0) {
                // Clear otpId since registration is complete
                setOtpId("");
                toast.success("Chúc mừng bạn đã đăng ký thành công");
                // Kiểm tra redirect param
                const searchParams = new URLSearchParams(
                    window.location.search
                );
                const redirect = searchParams.get("redirect");
                router.push(redirect || "/");
            } else {
                throw new Error("Cập nhật hồ sơ thất bại");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Lỗi khi cập nhật hồ sơ");
        } finally {
            setIsLoading(false);
        }
    };

    async function onCodeSubmit(data: { code: string }) {
        setIsLoading(true);
        const dataLogin = await verifyOtp(otpId, data.code);
        if (dataLogin.code == 0) {
            // Clear otpId since verification is successful
            setOtpId("");

            setAuthTokens(
                dataLogin.metadata.accessToken,
                dataLogin.metadata.refreshToken
            );

            // Kiểm tra xem có phải user mới không
            // User mới thường có fullName rỗng, null, undefined, hoặc bằng email
            const fullName = dataLogin.metadata?.fullName;
            const email = dataLogin.metadata?.email;

            // Kiểm tra user mới: fullName không tồn tại, rỗng, hoặc bằng email
            let isNewUser = false;

            if (!fullName) {
                // fullName là null, undefined, hoặc falsy
                isNewUser = true;
            } else if (typeof fullName === "string") {
                // fullName là string - kiểm tra xem có rỗng hoặc bằng email không
                const trimmedFullName = fullName.trim();
                isNewUser = trimmedFullName === "" || trimmedFullName === email;
            } else {
                // fullName có giá trị nhưng không phải string - có thể là object hoặc giá trị khác
                isNewUser = fullName === email;
            }

            if (isNewUser) {
                setIsNewUser(true);
                form.setValue("email", email || "");
                form.setValue("avatar", dataLogin.metadata?.avatar || "");
            } else {
                // Kiểm tra redirect param
                const searchParams = new URLSearchParams(
                    window.location.search
                );
                const redirect = searchParams.get("redirect");
                router.push(redirect || `/`);
            }
        } else {
            setInputFocus();
            toast.error(dataLogin.message);
        }
        setIsLoading(false);
    }

    async function ResendOtp() {
        const res = await resendOtp(otpId);
        if (res.code == 0) {
            setOtpId(res.content.otpId);
        } else {
            toast.error(res.message);
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const renderAvatar = () => {
        if (avatarPreview) {
            return (
                <Avatar
                    src={avatarPreview}
                    name={form.getValues("fullName")}
                    size="80"
                    className="cursor-pointer"
                    onClick={handleAvatarClick}
                />
            );
        }

        return (
            <div
                className="w-[80px] h-[80px] rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"
                onClick={handleAvatarClick}
            >
                <MdOutlinePersonOutline className="w-8 h-8 text-gray-400" />
            </div>
        );
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center">
            {isNewUser ? (
                <div className="shadow-1 p-4 mx-4 md:p-8 rounded-2xl bg-white transition-all w-full md:w-auto">
                    <div className="flex flex-col items-center md:min-w-[480px]">
                        <div className="text-2xl md:text-3xl font-medium mt-5">
                            Cập nhật Profile
                        </div>
                        <div className="w-full mt-8">
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-center">
                                    {renderAvatar()}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ display: "none" }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tên
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...form.register("fullName")}
                                        type="text"
                                        placeholder="Họ và tên"
                                        className="w-full p-2 bg-[var(--bg1)] border-0 rounded-lg mt-1"
                                    />
                                    {form.formState.errors.fullName && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {
                                                form.formState.errors.fullName
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Email
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...form.register("email")}
                                        type="email"
                                        disabled
                                        className="w-full p-2 bg-gray-100 border-0 rounded-lg mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        {...form.register("phone")}
                                        type="tel"
                                        placeholder="Nhập số điện thoại"
                                        className="w-full p-2 bg-[var(--bg1)] border-0 rounded-lg mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Ngày sinh
                                    </label>
                                    <input
                                        {...form.register("dob")}
                                        type="date"
                                        className="w-full p-2 bg-[var(--bg1)] border-0 rounded-lg mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Giới tính
                                    </label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center">
                                            <input
                                                {...form.register("gender")}
                                                type="radio"
                                                value="1"
                                            />
                                            <span className="ml-2">Nam</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                {...form.register("gender")}
                                                type="radio"
                                                value="0"
                                            />
                                            <span className="ml-2">Nữ</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                {...form.register("gender")}
                                                type="radio"
                                                value="2"
                                            />
                                            <span className="ml-2">Khác</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Nơi làm việc
                                    </label>
                                    <input
                                        {...form.register("address")}
                                        type="text"
                                        placeholder="Nhập địa chỉ"
                                        className="w-full p-2 bg-[var(--bg1)] border-0 rounded-lg mt-1"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-white p-2.5 rounded-md"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "Đang cập nhật..."
                                        : "Cập nhật"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="shadow-1 p-4 mx-4 md:p-8 rounded-2xl bg-white transition-all w-full md:w-auto">
                    <div className="flex flex-col items-center md:min-w-[480px]">
                        <div className="p-4 rounded-3xl shadow-0 border-[1px] border-[#E4E7EC]">
                            <Image
                                alt="logo"
                                src={"/icons/mail_ic.svg"}
                                loading="eager"
                                width={25}
                                height={25}
                                className="h-[25px] w-auto object-contain"
                            />
                        </div>
                        <div className="text-2xl md:text-3xl font-medium mt-5">
                            Đăng nhập bằng Email
                        </div>
                        <div className="text-sm md:text-base mt-3 mb-8">
                            Vui lòng kiểm tra mail để điền mã xác thực
                        </div>
                        <Form {...codeForm}>
                            <form
                                // onSubmit={codeForm.handleSubmit(onCodeSubmit)}
                                className="w-full flex flex-col items-center"
                            >
                                <FormField
                                    control={codeForm.control}
                                    name="code"
                                    disabled={isLoading}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <InputOTP
                                                    autoFocus
                                                    maxLength={6}
                                                    value={code}
                                                    onChange={(value) => {
                                                        setCode(value);
                                                        field.onChange(value);
                                                        if (
                                                            value.length === 6
                                                        ) {
                                                            onCodeSubmit({
                                                                code: value,
                                                            });
                                                        }
                                                    }}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>

                        <OtpResend
                            onResend={() => {
                                ResendOtp();
                            }}
                        />
                        <div className="flex items-center gap-2 mt-4 text-sm md:text-base">
                            <svg
                                width="19"
                                height="13"
                                viewBox="0 0 19 13"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M18.5 5.5H4.33L7.91 1.91L6.5 0.5L0.5 6.5L6.5 12.5L7.91 11.09L4.33 7.5H18.5V5.5Z"
                                    fill="#1F2329"
                                />
                            </svg>
                            <b
                                className="cursor-pointer"
                                onClick={() => {
                                    router.replace("/sign-in");
                                }}
                            >
                                Trở lại trang đăng nhập
                            </b>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";
import { loginApi, socialLogin } from "@/api/auth";
import { ButtonLoading } from "@/components/button_loading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOtpId } from "@/hooks/otp";
import { getAccessToken, setAuthTokens } from "@/lib/authCookies";
import { fbLogin, getFacebookLoginStatus, initFacebookSdk } from "@/lib/fbSdk";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appleAuthHelpers } from "react-apple-signin-auth";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const formSchema = z.object({
    username: z
        .string()
        .min(6, {
            message: "Địa chỉ email không hợp lệ",
        })
        .email({ message: "Địa chỉ email không hợp lệ" }),
});
const SocialButton = ({
    className,
    title,
    icon,
    ...prop
}: {
    className?: string;
    title: string;
    icon: string;
    [key: string]: unknown;
}) => (
    <Button
        {...prop}
        variant={"outline"}
        className={cn("w-full relative text-[18px] text-[#1F2329]", className)}
    >
        <Image
            alt="ico"
            src={icon}
            width={25}
            height={25}
            className="w-[25px] h-auto object-contain absolute left-3"
        />
        {title}
    </Button>
);
export default function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const { setOtpId } = useOtpId();
    const [userName, setUserName] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
        },
    });
    useEffect(() => {
        if (getAccessToken()) {
            // Nếu đã đăng nhập, kiểm tra redirect param
            const searchParams = new URLSearchParams(window.location.search);
            const redirect = searchParams.get("redirect");
            if (redirect) {
                router.replace(redirect);
            } else {
                router.replace("/");
            }
            return;
        }
        initFacebookSdk()
            .then(() => {
                getFacebookLoginStatus().then((response) => {
                    if (!response) {
                        console.log("No login status for the person");
                    }
                });
            })
            .catch((err) => {
                console.error("Facebook SDK failed to initialize:", err);
            });
    }, [router]);

    async function onSubmit(values: { username: string }) {
        if (!termsAccepted) {
            toast.error("Bạn phải chấp nhận các Điều khoản và Quyền riêng tư");
            return;
        }
        setIsLoading(true);
        const dataLogin = await loginApi(values.username);
        setIsLoading(false);
        if (dataLogin.code == 0) {
            setOtpId(dataLogin.content.otpId);
            // Lưu redirect param để sử dụng sau khi verify
            const searchParams = new URLSearchParams(window.location.search);
            const redirect = searchParams.get("redirect");
            if (redirect) {
                router.push(`/verify?redirect=${encodeURIComponent(redirect)}`);
            } else {
                router.push(`/verify`);
            }
        } else {
            toast.error(dataLogin.message);
        }
    }
    const handleAppleLogin = () => {
        appleAuthHelpers.signIn({
            authOptions: {
                clientId: "com.azvidi.coka",
                redirectURI: "http://localhost:3000",
                scope: "email name",
                state: "state",
                nonce: "nonce",
                usePopup: true,
            },
            onSuccess: (response: unknown) => console.log(response),
            onError: (error: unknown) => console.error(error),
        });
    };
    const handleGgLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            if (tokenResponse.access_token) {
                toast.promise(
                    socialLogin(tokenResponse.access_token, "google").then(
                        (res) => {
                            if (res.code == 0) {
                                setAuthTokens(
                                    res.content.accessToken,
                                    res.content.refreshToken
                                );
                                // Kiểm tra redirect param
                                const searchParams = new URLSearchParams(
                                    window.location.search
                                );
                                const redirect = searchParams.get("redirect");
                                router.push(redirect || `/`);
                            } else {
                                toast.error(res.message);
                            }
                        }
                    ),
                    {
                        loading: "Vui lòng chờ...",
                        success: <b>Đăng nhập thành công!</b>,
                        error: <b>Thất bại</b>,
                    },
                    { position: "top-center" }
                );
            } else {
                toast.error("Đã có lỗi xảy ra xin vui lòng thử lại");
            }
        },
    });
    function handleFbLogin() {
        fbLogin(
            "email,openid,pages_show_list,pages_messaging,instagram_basic,leads_retrieval,instagram_manage_messages,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_engagement,public_profile,pages_manage_posts"
        ).then((response) => {
            if (response.status === "connected") {
                toast.promise(
                    socialLogin(
                        response?.authResponse?.accessToken,
                        "facebook"
                    ).then((res) => {
                        if (res.code == 0) {
                            setAuthTokens(
                                res.content.accessToken,
                                res.content.refreshToken
                            );
                            // Kiểm tra redirect param
                            const searchParams = new URLSearchParams(
                                window.location.search
                            );
                            const redirect = searchParams.get("redirect");
                            router.push(redirect || `/`);
                        } else {
                            toast.error(res.message);
                        }
                    }),
                    {
                        loading: "Vui lòng chờ...",
                        success: <b>Đăng nhập thành công!</b>,
                        error: <b>Thất bại</b>,
                    },
                    { position: "top-center" }
                );
            } else {
                toast.error("Đã có lỗi xảy ra xin vui lòng thử lại");
            }
        });
    }

    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <div className="shadow-1 p-4 mx-4 md:p-8 rounded-2xl bg-white transition-all w-full md:w-auto">
                <div className="flex flex-col items-center md:w-[450px]">
                    <div className="p-3 rounded-3xl border-[1px] border-[#E4E7EC]">
                        <Image
                            alt="logo"
                            src={"/icons/logo_without_text.svg"}
                            loading="eager"
                            width={50}
                            height={50}
                            className="h-[50px] aspect-square object-contain"
                        />
                    </div>
                    <div className="text-2xl md:text-3xl font-medium mt-5">
                        Đăng nhập
                    </div>
                    <div className="text-sm md:text-base mt-3">
                        Chào mừng bạn đến với CoKa
                    </div>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 w-full mt-4"
                        >
                            <FormField
                                defaultValue=""
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base md:text-[18px] flex">
                                            Địa chỉ email
                                            <span className="text-[#FF0000] text-[14px]">
                                                *
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                onChangeCapture={(e) => {
                                                    setUserName(
                                                        e.currentTarget.value
                                                    );
                                                }}
                                                placeholder="example@azvidi.vn"
                                                className="border-none bg-[#F9F9F9]"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="w-full">
                                {isLoading ? (
                                    <ButtonLoading />
                                ) : (
                                    <Button
                                        type="submit"
                                        className={cn(
                                            " bg-[#D9D9D9] w-full",
                                            userName.includes("@") &&
                                                "bg-primary"
                                        )}
                                    >
                                        Đăng nhập
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center mt-4">
                                <Checkbox
                                    checked={termsAccepted}
                                    onCheckedChange={(checked) =>
                                        setTermsAccepted(checked === true)
                                    }
                                    id="terms"
                                    className="mr-2"
                                />
                                <label htmlFor="terms" className="text-sm">
                                    Tôi đã đọc và chấp nhận các{" "}
                                    <Link
                                        href="/privacy-policy.html"
                                        target="_blank"
                                        className="text-primary"
                                    >
                                        Điều khoản và Quyền riêng tư
                                    </Link>
                                </label>
                            </div>
                        </form>
                    </Form>
                    <div className="flex items-center w-full gap-2 py-6">
                        <div className="flex-1 h-[1px] bg-[#E4E7EC]" />
                        <div className="text-[#1F2329] text-base opacity-65">
                            Hoặc đăng nhập bằng
                        </div>
                        <div className="flex-1 h-[1px] bg-[#E4E7EC]" />
                    </div>
                    <div className="flex flex-col w-full gap-5">
                        <SocialButton
                            title="Đăng nhập bằng Gmail"
                            icon="/icons/google_ico.svg"
                            onClick={handleGgLogin}
                        />
                        <SocialButton
                            onClick={handleFbLogin}
                            title="Đăng nhập bằng Facebook"
                            icon="/icons/fb_ico.svg"
                        />
                        <SocialButton
                            onClick={handleAppleLogin}
                            title="Đăng nhập bằng Apple"
                            icon="/icons/apple_ico.svg"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

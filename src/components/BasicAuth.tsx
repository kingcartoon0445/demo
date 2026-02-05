"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface BasicAuthProps {
    children: React.ReactNode;
}

export default function BasicAuth({ children }: BasicAuthProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Check if this is alpha.coka.ai
    const isAlphaEnv =
        typeof window !== "undefined" &&
        (window.location.hostname === "alpha.coka.ai" ||
            // Uncomment the line below to test locally
            // window.location.hostname === "localhost"
            false);

    useEffect(() => {
        if (!isAlphaEnv) {
            setIsAuthenticated(true);
            return;
        }

        // Check if user is already authenticated for this session
        const basicAuthToken = sessionStorage.getItem("basicAuth");
        if (basicAuthToken === "authenticated") {
            setIsAuthenticated(true);
        }
    }, [isAlphaEnv]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Basic password check (you can make this more secure)
        const BASIC_PASSWORD = "Azvidi@2019"; // Change this to your desired password

        if (password === BASIC_PASSWORD) {
            sessionStorage.setItem("basicAuth", "authenticated");
            setIsAuthenticated(true);
        } else {
            setError("Mật khẩu không chính xác");
        }

        setIsLoading(false);
    };

    // If not alpha environment, render children directly
    if (!isAlphaEnv || isAuthenticated) {
        return <>{children}</>;
    }

    // Render basic auth form
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                        <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <Image
                                    src="/icons/logo_without_text.svg"
                                    alt="COKA Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-white">
                                COKA Alpha
                            </h1>
                            <p className="text-blue-100 text-sm mt-2">
                                Môi trường thử nghiệm
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Xác thực truy cập
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Vui lòng nhập mật khẩu để tiếp tục
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Mật khẩu
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Nhập mật khẩu"
                                    className="mt-1 h-11"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-600 text-sm">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading || !password}
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                            >
                                {isLoading ? "Đang xác thực..." : "Truy cập"}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-center text-xs text-gray-500">
                                Môi trường Alpha - Chỉ dành cho nội bộ
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

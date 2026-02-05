"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NoPermissionPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-gray-200">403</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mt-4">
                    Không có quyền truy cập
                </h2>
                <p className="text-gray-500 mt-2 mb-8 max-w-md">
                    Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ
                    quản trị viên để được cấp quyền.
                </p>
                <Button onClick={() => router.back()}>Quay lại</Button>
            </div>
        </div>
    );
}

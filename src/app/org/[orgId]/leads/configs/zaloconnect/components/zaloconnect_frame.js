"use client";
import { Button } from "@/components/ui/button";
import { apiBase } from "@/lib/authConstants";
import { popupCenter } from "@/lib/window_popup";
import Image from "next/image";
import { MdAdd } from "react-icons/md";

export default function ZaloConnectFrame({ orgId, onRefresh }) {
    return (
        <div className="flex flex-col w-full items-start p-4">
            <div className="flex items-center text-[22px] font-medium gap-3">
                <Image
                    alt="zalo"
                    src={"/icons/zalo.svg"}
                    width={35}
                    height={35}
                    className="object-contain h-[36px] w-auto"
                />
                Zalo OA
            </div>
            <div className="text-[18px] mt-4">
                Chat với khách hàng thông qua Zalo OA, trực tiếp ngay trên COKA
            </div>
            <Button
                onClick={() => {
                    popupCenter(
                        `${apiBase}/api/v2/public/integration/auth/zalo/message?organizationId=${orgId}&accessToken=${localStorage.getItem(
                            "accessToken"
                        )}`,
                        "Connect Zalo OA",
                        600,
                        1000,
                        (value) => {
                            onRefresh();
                        }
                    );
                }}
                className="rounded-xl gap-3 mt-4"
            >
                <MdAdd className="text-xl" /> Kết nối OA
            </Button>
        </div>
    );
}

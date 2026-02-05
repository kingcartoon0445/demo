"use client";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { FaCircleCheck } from "react-icons/fa6";
import RenewSubscriptionPayment from "./renew_subscription_payment";
import { useEffect, useState } from "react";
import { useSubscription } from "./subs_card";
import UpgradeSupscriptionDialog from "./upgrade_subscription_dialog";
import { useParams } from "next/navigation";
import { getSubscriptionIntro } from "@/api/payment";

export function SubsSheet({ open, setOpen }) {
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
    const [upgradeType, setUpgradeType] = useState(null);
    const { subscription } = useSubscription();
    const [superSaleIntro, setSuperSaleIntro] = useState(null);
    const [enterpriseIntro, setEnterpriseIntro] = useState(null);

    const { orgId } = useParams();

    const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    useEffect(() => {
        getSubscriptionIntro(orgId).then((res) => {
            setSuperSaleIntro(
                res.content.find((e) => e.name === "Super Sales")
            );
            setEnterpriseIntro(
                res.content.find((e) => e.name === "Enterprise")
            );
        });
    }, [orgId]);

    const handleButtonClick = (type, isExpired) => {
        if (isExpired) {
            setOpenPaymentDialog(true);
        } else {
            setUpgradeType(type);
            setOpenUpgradeDialog(true);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="min-w-[600px] h-full p-0">
                {openPaymentDialog && (
                    <RenewSubscriptionPayment
                        open={openPaymentDialog}
                        setOpen={setOpenPaymentDialog}
                        subscription={subscription}
                    />
                )}
                {openUpgradeDialog && (
                    <UpgradeSupscriptionDialog
                        open={openUpgradeDialog}
                        setOpen={setOpenUpgradeDialog}
                        subscription={subscription}
                        upgradeType={upgradeType}
                    />
                )}
                <SheetHeader>
                    <SheetTitle className="font-medium">
                        Gói thuê bao
                    </SheetTitle>
                    <div className="w-full h-[0.5px] bg-[#E4E7EC] " />
                </SheetHeader>
                <div className="flex flex-col h-full overflow-y-auto px-4 pb-4">
                    {(subscription.name !== "Enterprise" ||
                        isExpired(subscription.expiryDate)) && (
                        <div className="p-4 bg-primary rounded-lg flex flex-col w-full text-white">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <b className="italic text-[22px]">
                                        {superSaleIntro?.name}
                                    </b>
                                    <span className="text-sm tracking-wide">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: superSaleIntro?.pricePerMember,
                                            }}
                                        />
                                    </span>
                                    <div className="text-sm">
                                        {superSaleIntro?.maxUsers}
                                    </div>
                                </div>
                                <div className="p-[4px] rounded-lg bg-[#E3DFFF]">
                                    <Image
                                        alt="ico"
                                        src={"/icons/subscription_ico.svg"}
                                        width={42}
                                        height={42}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-sm mt-4">
                                {superSaleIntro?.feature?.map((e, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <FaCircleCheck className="text-white text-xl" />
                                        {e}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    if (
                                        !subscription.packageType.includes(
                                            "SUPER_SALE"
                                        )
                                    ) {
                                        setUpgradeType("Super Sales");
                                        setOpenUpgradeDialog(true);
                                    } else {
                                        handleButtonClick(
                                            "Super Sales",
                                            isExpired(subscription.expiryDate)
                                        );
                                    }
                                }}
                                className="bg-white outline-none border-none w-full rounded-lg text-primary font-bold text-sm py-[6px] mt-4"
                            >
                                {subscription.name === "Super Sales"
                                    ? "Gia hạn"
                                    : subscription.name === "Enterprise"
                                    ? "Đổi gói"
                                    : "Nâng cấp"}
                            </button>
                        </div>
                    )}
                    {(subscription.name !== "Super Sales" ||
                        isExpired(subscription.expiryDate)) && (
                        <div className="p-4 bg-bg2 rounded-lg flex flex-col w-full text-title my-6">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <b className="italic text-[22px]">
                                        {enterpriseIntro?.name}
                                    </b>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: enterpriseIntro?.pricePerMember,
                                        }}
                                    />
                                    <div className="text-sm">
                                        {enterpriseIntro?.maxUsers}
                                    </div>
                                </div>
                                <div className="p-[4px] rounded-lg bg-[#E3DFFF]">
                                    <Image
                                        alt="ico"
                                        src={"/icons/enterprise.svg"}
                                        width={42}
                                        height={42}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-sm mt-4">
                                {enterpriseIntro?.feature?.map((e, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <FaCircleCheck className="text-primary text-xl" />
                                        {e}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    if (subscription.name === "Enterprise") {
                                        handleButtonClick(
                                            "Enterprise",
                                            isExpired(subscription.expiryDate)
                                        );
                                    }
                                }}
                                className="bg-primary w-full rounded-lg text-white font-bold text-sm py-[6px] mt-4"
                            >
                                {subscription.name === "Enterprise"
                                    ? "Gia hạn"
                                    : "Liên hệ"}
                            </button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

const superSale = [
    "Bao gồm gói Khởi đầu",
    "10 Không gian làm việc",
    "Kết nối khách hàng đa nguồn: Zalo Form, Facebook Form ",
    "Quản lý 10.000 khách hàng tiềm năng",
    "Tracking hành trình khách hàng",
    "Automation: 10 kịch bản",
    "Kịch bản thu hồi khách hàng",
];

const enterprise = [
    "Bao gồm gói Super Sale",
    "Không giới hạn Không gian làm việc",
    "Không giới hạn kết nối khách hàng đa nguồn",
    "Không giới hạn quản lý khách hàng",
    "Tuỳ biến linh hoạt kịch bản phân phối và thu hồi khách hàng",
];

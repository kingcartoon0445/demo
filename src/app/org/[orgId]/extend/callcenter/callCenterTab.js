"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import ActivePackageDialog from "./components/active_package_dialog";
import PaymentResultDialog from "./components/payment_result_dialog";
import RenewPackageDialog from "./components/renew_package_dialog";
import { getWalletDetail } from "@/api/payment";
import { PackageInfo } from "./components/PackageInfo";
import { WalletBalance } from "./components/WalletBalance";
import CallReport from "./components/CallReport";
import CallNumbers from "./components/CallNumbers";
import CallHistory from "./components/CallHistory";
import {
    getCallcenterPackages,
    getCallcenterUsageStatistics,
} from "@/api/callcenter";
import SlotBuyDialog from "./components/slot_buy_dialog";
import MembersDialog from "./components/members_dialog";

export default function Page({ params }) {
    const [openActivePackage, setOpenActivePackage] = useState(false);
    const [openPaymentResult, setOpenPaymentResult] = useState(false);
    const [openExtendPackage, setOpenExtendPackage] = useState(false);
    const [openMembersDialog, setOpenMembersDialog] = useState(false);
    const [openSlotBuy, setOpenSlotBuy] = useState(false);
    const [walletCredit, setWalletCredit] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [callcenterStatis, setCallcenterStatis] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const [reload, setReload] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchWalletDetail();
        fetchCallcenterStatis();
    }, [params.orgId, reload]);

    const fetchCallcenterStatis = async () => {
        try {
            const response = await getCallcenterUsageStatistics(params?.orgId);
            if (response?.code === 0 && response?.content) {
                setCallcenterStatis(response.content);
                setIsActive(true);
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin gói:", error);
        }
    };

    const fetchWalletDetail = async () => {
        try {
            const response = await getWalletDetail(params.orgId);
            if (
                response?.code === 0 &&
                response?.content?.credit !== undefined
            ) {
                setWalletCredit(response.content.credit);
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin ví:", error);
        }
    };

    const handleOpenPaymentResult = () => {
        setOpenPaymentResult(true);
        setIsActive(true);
    };

    const handleReload = () => {
        setReload(!reload);
    };

    return (
        <div className="flex flex-col h-full w-full">
            {openMembersDialog && (
                <MembersDialog
                    open={openMembersDialog}
                    setOpen={setOpenMembersDialog}
                    callcenterStatis={callcenterStatis}
                    setReload={setReload}
                />
            )}
            {openActivePackage && (
                <ActivePackageDialog
                    open={openActivePackage}
                    setOpen={setOpenActivePackage}
                    setOpenPaymentResult={handleOpenPaymentResult}
                    setPaymentResult={setPaymentResult}
                    handleReload={handleReload}
                />
            )}
            {openPaymentResult && (
                <PaymentResultDialog
                    open={openPaymentResult}
                    setOpen={setOpenPaymentResult}
                    paymentResult={paymentResult}
                />
            )}
            {openExtendPackage && (
                <RenewPackageDialog
                    open={openExtendPackage}
                    setOpen={setOpenExtendPackage}
                    setOpenPaymentResult={handleOpenPaymentResult}
                    setPaymentResult={setPaymentResult}
                    handleReload={handleReload}
                />
            )}
            {openSlotBuy && (
                <SlotBuyDialog
                    open={openSlotBuy}
                    setOpen={setOpenSlotBuy}
                    setOpenPaymentResult={handleOpenPaymentResult}
                    setPaymentResult={setPaymentResult}
                    handleReload={handleReload}
                    currentMemberNumber={callcenterStatis?.memberLimit}
                />
            )}

            <div className="rounded-2xl flex flex-col bg-white h-full">
                <div className="flex items-center w-full justify-between pl-5 pr-3 py-4 border-b relative">
                    <div className="text-[18px] font-medium">Tổng đài</div>
                    <WalletBalance
                        walletCredit={walletCredit}
                        onClick={() =>
                            router.push(`/org/${params.orgId}/wallet`)
                        }
                    />
                </div>
                <ScrollArea className="flex flex-col gap-4 px-5 mt-4 flex-1">
                    <PackageInfo
                        callcenterStatis={callcenterStatis}
                        isActive={isActive}
                        onActivate={() => setOpenActivePackage(true)}
                        onExtend={() => setOpenExtendPackage(true)}
                        onBuy={() => setOpenSlotBuy(true)}
                        onMembers={() => setOpenMembersDialog(true)}
                    />
                    <CallNumbers
                        callcenterStatis={callcenterStatis}
                        isActive={isActive}
                    />
                    <CallReport />
                    <CallHistory isActive={isActive} />
                </ScrollArea>
            </div>
        </div>
    );
}

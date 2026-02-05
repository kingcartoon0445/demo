"use client";
import {
    getWalletDetail,
    orderAndPayPackage,
    getSubscriptionUpgradeInfo,
    upgradeSubscription,
    getSubscriptionDowngradeInfo,
    confirmSubscriptionDowngrade,
} from "@/api/payment";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, paymentMethod } from "@/lib/utils";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { getSubscriptionPackages } from "@/api/payment";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import toast from "react-hot-toast";
import { useSubscription } from "./subs_card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/number-input";

export default function UpgradeSupscriptionDialog({
    open,
    setOpen,
    subscription,
    upgradeType,
    isRenewal = false,
    isDowngrade = false,
    onSuccess,
}) {
    const [walletInfo, setWalletInfo] = useState(null);
    const { orgId } = useParams();
    const router = useRouter();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packageList, setPackageList] = useState([]);
    const { subscription: currentSubscription, refresh } = useSubscription();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
        paymentMethod["Ví Coka"].id,
    );
    const [duration, setDuration] = useState(1);
    const [upgradeInfo, setUpgradeInfo] = useState(null);

    useEffect(() => {
        if (!open) {
            // Reset state when dialog closes
            setUpgradeInfo(null);
            setSelectedPackage(null);
            setDuration(1);
            return;
        }

        const fetchWalletInfo = async () => {
            const response = await getWalletDetail(orgId);
            if (response.code === 0) {
                setWalletInfo(response.content);
            }
        };
        fetchWalletInfo();

        if (isDowngrade) {
            // Fetch downgrade info
            const fetchDowngradeInfo = async () => {
                try {
                    const response = await getSubscriptionDowngradeInfo(orgId);
                    if (response.code === 0) {
                        // Transform response to match upgradeInfo structure
                        setUpgradeInfo({
                            order: {
                                title: response.content.order.title,
                                member: response.content.order.member,
                                duration: response.content.order.duration,
                                price: response.content.order.price,
                                credit: response.content.order.credit,
                                fee: response.content.order.fee,
                                totalCredit: response.content.order.totalCredit,
                                startDate: response.content.order.startDate,
                                expiryDate: response.content.order.expiryDate,
                            },
                            member: response.content.member,
                            startDate: response.content.startDate,
                            expiryDate: response.content.expiryDate,
                        });
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin hạ cấp:", error);
                }
            };
            fetchDowngradeInfo();
        } else {
            const fetchPackages = async () => {
                try {
                    const response = await getSubscriptionPackages();
                    if (response.code === 0) {
                        const formattedPackages = response.content.map(
                            (pkg) => ({
                                id: pkg.id,
                                name: `${pkg.duration} tháng`,
                                price: pkg.credit * pkg.duration,
                                save: undefined,
                            }),
                        );
                        setPackageList(formattedPackages);

                        if (formattedPackages.length > 0) {
                            setSelectedPackage(formattedPackages[0].id);
                            fetchUpgradeInfo(formattedPackages[0].id, duration);
                        }
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy danh sách gói:", error);
                }
            };

            fetchPackages();
        }
    }, [orgId, isDowngrade, open]);

    const fetchUpgradeInfo = async (packageId, months) => {
        const response = await getSubscriptionUpgradeInfo(
            orgId,
            packageId,
            months,
        );
        if (response.code === 0) {
            setUpgradeInfo(response.content);
        }
    };

    const handleDurationChange = (value) => {
        if (value > 0) {
            setDuration(value);
            fetchUpgradeInfo(selectedPackage, value);
        }
    };

    const onConfirmPayment = async () => {
        if (isDowngrade) {
            const response = await confirmSubscriptionDowngrade(orgId);
            if (response?.message) return toast.error(response.message);

            toast.success("Hạ cấp thành công");
            // Set flag to hide subscription banner in Sidebar
            localStorage.setItem("hideSubscriptionBanner", "true");
            // Dispatch custom event to notify Sidebar
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("subscriptionBannerHide"));
            }
            refresh(orgId);
            setShowConfirmDialog(false);
            setOpen(false);
            try {
                if (typeof onSuccess === "function") onSuccess();
            } catch {}
        } else {
            const response = await upgradeSubscription(orgId, {
                packageId: selectedPackage,
                duration: duration,
            });
            if (response?.message) return toast.error(response.message);

            toast.success(
                isRenewal ? "Gia hạn thành công" : "Nâng cấp thành công",
            );
            refresh(orgId);
            setShowConfirmDialog(false);
            setOpen(false);
            try {
                if (typeof onSuccess === "function") onSuccess();
            } catch {}
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        {isDowngrade
                            ? "Hạ cấp gói"
                            : isRenewal
                              ? "Gia hạn gói"
                              : "Nâng cấp gói"}{" "}
                        {upgradeType}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1 p-4">
                    <div className="flex flex-col bg-bg1 rounded-lg p-3">
                        <div className="flex gap-2 mb-5">
                            <div className="p-[4px] rounded-lg bg-[#E3DFFF]">
                                <Image
                                    alt="ico"
                                    src={"/icons/subscription_ico.svg"}
                                    width={42}
                                    height={42}
                                />
                            </div>
                            <div className="text-text2 text-sm flex flex-col gap-1">
                                <span>Dành cho đội Nhóm</span>
                                <b className="text-[22px] text-title">
                                    {upgradeType}
                                </b>
                            </div>
                        </div>
                        {!isDowngrade && (
                            <div className="font-medium text-title text-[14px] mb-3 flex items-center gap-4">
                                {isRenewal
                                    ? "Thời hạn gia hạn"
                                    : "Thời hạn nâng cấp"}
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={duration}
                                        onChange={handleDurationChange}
                                        min={1}
                                        size="small"
                                    />
                                    <span className="text-sm text-title">
                                        tháng
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* <div className="flex flex-col gap-2">
                            {packageList.map((item, index) => (
                                <PaymentPackage
                                    key={index}
                                    checked={selectedPackage === item.id}
                                    id={item.id}
                                    name={item.name}
                                    price={item.price}
                                    save={item.save}
                                    setSelectedPackage={(id) => {
                                        setSelectedPackage(id);
                                        fetchUpgradeInfo(id, duration);
                                    }}
                                />
                            ))}
                        </div> */}
                    </div>
                    {!isDowngrade && (
                        <div className="flex flex-col p-3 bg-bg1 rounded-lg mt-4">
                            <div className="text-title font-medium mb-2">
                                Phương thức thanh toán
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={
                                        selectedPaymentMethod ===
                                        paymentMethod["Ví Coka"].id
                                    }
                                    onClick={() =>
                                        setSelectedPaymentMethod(
                                            paymentMethod["Ví Coka"].id,
                                        )
                                    }
                                    className="rounded-full mr-2"
                                />
                                <div
                                    className={`w-[30px] h-[30px] rounded-full border p-2 ${
                                        (upgradeInfo?.order?.totalCredit || 0) >
                                        (walletInfo?.credit || 0)
                                            ? "opacity-50"
                                            : ""
                                    }`}
                                >
                                    <Image
                                        src="/icons/coka_wallet_ico.svg"
                                        alt="wallet"
                                        width={20}
                                        height={20}
                                    />
                                </div>
                                <div
                                    className={`text-title text-sm flex flex-col leading-tight mr-auto ${
                                        (upgradeInfo?.order?.totalCredit || 0) >
                                        (walletInfo?.credit || 0)
                                            ? "opacity-50"
                                            : ""
                                    }`}
                                >
                                    <span className="font-medium">Ví coka</span>
                                    <span className="text-xs">
                                        Số dư ví:{" "}
                                        {walletInfo?.credit?.toLocaleString()}{" "}
                                        Coin
                                    </span>
                                </div>

                                {(upgradeInfo?.order?.totalCredit || 0) >
                                    (walletInfo?.credit || 0) && (
                                    <Button
                                        className="text-xs h-[30px] ml-3"
                                        onClick={() => {
                                            setOpen(false);
                                            router.push(
                                                `/org/${orgId}/wallet/deposit`,
                                            );
                                        }}
                                    >
                                        Nạp tiền
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col p-3 bg-bg1 rounded-lg mt-4">
                        <div className="text-title font-medium mb-2">
                            Chi tiết đơn hàng
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label
                                label="Gói thuê bao"
                                value={upgradeInfo?.order?.title || ""}
                            />
                            <Label
                                label="Số thành viên"
                                value={`${
                                    upgradeInfo?.order?.member || 0
                                } thành viên`}
                            />
                            <Label
                                label="Ngày bắt đầu"
                                value={
                                    upgradeInfo?.order?.startDate
                                        ? new Date(upgradeInfo.order.startDate)
                                              .toLocaleDateString("vi-VN", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                              })
                                              .replace(/\./g, "/")
                                        : ""
                                }
                            />
                            <Label
                                label="Ngày kết thúc"
                                value={
                                    upgradeInfo?.order?.expiryDate
                                        ? new Date(upgradeInfo.order.expiryDate)
                                              .toLocaleDateString("vi-VN", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                              })
                                              .replace(/\./g, "/")
                                        : ""
                                }
                            />
                            <Label
                                label="Giá"
                                value={`${
                                    upgradeInfo?.order?.credit?.toLocaleString() ||
                                    0
                                } Coin`}
                            />
                            <Label
                                label="Phí"
                                value={`${
                                    upgradeInfo?.order?.fee?.toLocaleString() ||
                                    0
                                } Coin`}
                            />
                            <Label
                                label="Tổng cộng"
                                value={`${
                                    upgradeInfo?.order?.totalCredit?.toLocaleString() ||
                                    0
                                } Coin`}
                                isTotal
                            />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={() => setShowConfirmDialog(true)}>
                        Hoàn tất
                    </Button>
                </DialogFooter>
                <CustomerAlertDialog
                    open={showConfirmDialog}
                    setOpen={setShowConfirmDialog}
                    title={
                        isDowngrade
                            ? "Xác nhận hạ cấp"
                            : isRenewal
                              ? "Xác nhận gia hạn"
                              : "Xác nhận nâng cấp"
                    }
                    subtitle={
                        isDowngrade
                            ? "Bạn có chắc chắn muốn hạ cấp gói không?"
                            : isRenewal
                              ? "Bạn có chắc chắn muốn gia hạn gói không?"
                              : "Bạn có chắc chắn muốn nâng cấp gói không?"
                    }
                    onSubmit={onConfirmPayment}
                />
            </DialogContent>
        </Dialog>
    );
}

const PaymentPackage = ({
    checked,
    name,
    id,
    price,
    save,
    setSelectedPackage,
}) => {
    return (
        <div className="flex items-center gap-2 font-medium text-title">
            <Checkbox
                checked={checked}
                onClick={() => setSelectedPackage(id)}
                className="rounded-full"
            />
            <div className="text-xs">{name}</div>
            <span className="ml-auto text-sm text-title">
                {save && (
                    <span className="text-[9px] text-white bg-primary rounded-full px-[6px] py-[3px]">
                        Tiết kiệm {save}%
                    </span>
                )}
                <span className="text-sm"> {price.toLocaleString()} Coin</span>
            </span>
        </div>
    );
};

const Label = ({ label, value, isTotal }) => {
    return (
        <div className="flex items-center justify-between">
            <div
                className={cn(
                    "text-[14px] text-title",
                    isTotal && "text-[18px] font-medium",
                )}
            >
                {label}
            </div>
            <div
                className={cn(
                    `text-[14px] text-title font-medium`,
                    isTotal && "text-[18px]",
                )}
            >
                {value}
            </div>
        </div>
    );
};

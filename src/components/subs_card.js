"use client";
import { getOrgUsageStatistics } from "@/api/org";
import { GroupIcon, KHTNIcon, TargetIcon } from "@/components/icons";
import { format } from "date-fns";
import Image from "next/image";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { MdPersonOutline } from "react-icons/md";
import { SubsSheet } from "./subs_sheet";
import { create } from "zustand";
import { useParams } from "next/navigation";
import UpgradeSupscriptionDialog from "./upgrade_subscription_dialog";
import SubscriptionPaymentDialog from "./renew_subscription_payment";
import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon, Plus } from "lucide-react";
import BuyNewMemberDialog from "./buy_new_member_dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const CustomCard = ({
    title,
    value,
    maxValue,
    icon,
    isMemberCard = false,
    onBuyMoreClick,
}) => {
    // Hàm xử lý giá trị
    const formatValue = (val) => {
        const parsedVal = parseInt(val);
        if (isNaN(parsedVal)) return val;
        return parsedVal.toLocaleString();
    };

    const isFull = parseInt(value) >= parseInt(maxValue);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex border border-stroke rounded-xl px-[16px] py-[20px] justify-between items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex flex-col">
                <div className="text-sm font-medium">
                    {title ?? "Gói của tổ chức đang được khởi tạo"}
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <div className="text-[20px]">
                        <span className="text-primary">
                            {formatValue(value)}
                        </span>
                        /{formatValue(maxValue)}
                    </div>
                    {isMemberCard && (isFull || isHovered) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onBuyMoreClick}
                            disabled={!title}
                            className="h-[30px] px-2 border-primary text-primary hover:text-primary/80"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Mua thêm
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="text-[30px] fill-primary text-primary">
                    {icon}
                </div>
            </div>
        </div>
    );
};

// Thêm hàm kiểm tra thời gian gần hết hạn hoặc hết hạn
const isNearExpiry = (expiryDate) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 || expiry < now;
};

const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry < now;
};

export default function SubsCard({ setCurrentSubscriptionId }) {
    const { t } = useLanguage();
    const { orgId } = useParams();
    const { subscription, refresh, setSubscription } = useSubscription();
    const [openSheet, setOpenSheet] = useState(false);
    const [isSkipNearExpiry, setIsSkipNearExpiry] = useState(false);
    const [openRenewalDialog, setOpenRenewalDialog] = useState(false);
    const [openBuyMemberDialog, setOpenBuyMemberDialog] = useState(false);
    const [openDowngradeDialog, setOpenDowngradeDialog] = useState(false);

    useEffect(() => {
        setSubscription(null);
        refresh(orgId);
        setIsSkipNearExpiry(false);
    }, [orgId]);

    useEffect(() => {
        if (subscription) {
            setCurrentSubscriptionId(subscription.id);
        }
    }, [subscription]);

    if (isNearExpiry(subscription?.expiryDate) && !isSkipNearExpiry) {
        return (
            <div className="bg-white rounded-xl flex-1 min-h-[250px] flex gap-2">
                {openSheet && (
                    <SubsSheet open={openSheet} setOpen={setOpenSheet} />
                )}
                <div className="flex-1">
                    <h2
                        className={`text-lg font-medium mb-2 ${
                            isExpired(subscription?.expiryDate)
                                ? "text-[#FF0707]"
                                : "text-[#FE7F09]"
                        }`}
                    >
                        {isExpired(subscription?.expiryDate)
                            ? "Gói thuê bao đã hết hạn"
                            : "Gói thuê bao sắp hết hạn"}
                    </h2>
                    {isExpired(subscription?.expiryDate) ? (
                        <p className="text-title">
                            Gói thuê bao <b>{subscription?.name}</b> của bạn đã
                            hết hạn. Gia hạn để tiếp tục sử dụng các tính năng
                            trả phí cũng như duy trì các không gian làm việc bên
                            trong tổ chức.
                        </p>
                    ) : (
                        <p className="text-title">
                            Gói thuê bao <b>{subscription?.name}</b> của bạn sẽ
                            hết hạn vào ngày{" "}
                            <b>
                                {format(subscription?.expiryDate, "dd/MM/yyyy")}
                            </b>{" "}
                            .
                            <br />
                            Gia hạn để tiếp tục sử dụng các tính năng trả phí
                            cũng như duy trì các không gian làm việc bên trong
                            tổ chức.
                        </p>
                    )}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => setOpenSheet(true)}
                            className="px-6 py-1 bg-primary text-white rounded-lg"
                        >
                            Gia hạn
                        </button>
                        {!isExpired(subscription?.expiryDate) && (
                            <button
                                onClick={() => setIsSkipNearExpiry(true)}
                                className="px-6 py-1 border border-gray-300 rounded-lg"
                            >
                                Bỏ qua
                            </button>
                        )}
                    </div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-4">
                    <DropdownMenu className="">
                        <DropdownMenuTrigger>
                            <Button variant="outline">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() => setOpenDowngradeDialog(true)}
                            >
                                Hạ cấp
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Image
                        src="/images/expire_icon.png"
                        alt="Expire warning"
                        width={160}
                        height={120}
                        unoptimized
                    />
                </div>

                {openDowngradeDialog && (
                    <UpgradeSupscriptionDialog
                        open={openDowngradeDialog}
                        setOpen={setOpenDowngradeDialog}
                        subscription={subscription}
                        upgradeType={subscription?.name || null}
                        isDowngrade={true}
                        onSuccess={() => {
                            refresh(orgId);
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="bg-transparent rounded-xl flex flex-col gap-2 flex-1 mb-2">
            {openSheet && <SubsSheet open={openSheet} setOpen={setOpenSheet} />}
            {openBuyMemberDialog && (
                <BuyNewMemberDialog
                    open={openBuyMemberDialog}
                    setOpen={setOpenBuyMemberDialog}
                />
            )}

            <h2 className="text-xl">{t("common.currentPackage")}</h2>
            <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                    if (subscription) {
                        setOpenSheet(true);
                    }
                }}
            >
                <Image
                    alt="ico"
                    src={"/icons/subscription_ico.svg"}
                    width={48}
                    height={48}
                />
                <div className="flex flex-col text-title ">
                    <div className="text-[20px] font-medium leading-[1.2]">
                        {subscription?.name}
                    </div>
                    <div className="text-[16px]">
                        {subscription?.name == "Pro Sales"
                            ? "Miễn phí"
                            : "Hết hạn: " +
                              (subscription?.expiryDate &&
                                  format(
                                      subscription?.expiryDate,
                                      "dd/MM/yyyy",
                                  ))}
                    </div>
                </div>
                <IoIosArrowForward className="ml-auto" />
            </div>
            <div className="grid grid-cols-2 text-title gap-4">
                <CustomCard
                    title={"Thành viên"}
                    value={subscription?.countMember ?? 0}
                    maxValue={subscription?.maxMember ?? 0}
                    icon={<MdPersonOutline />}
                    isMemberCard={true}
                    onBuyMoreClick={() => setOpenBuyMemberDialog(true)}
                />
                <CustomCard
                    title={"Nhóm làm việc"}
                    value={subscription?.countWorkspace ?? 0}
                    maxValue={subscription?.maxWorkspace ?? 0}
                    icon={<GroupIcon />}
                />
                <CustomCard
                    title={"Chiến dịch"}
                    value={subscription?.countCampaign ?? 0}
                    maxValue={subscription?.maxCampaign ?? 0}
                    icon={<TargetIcon className="w-[30px] h-[30px] p-[2px]" />}
                />
                <CustomCard
                    title={"K.H tiềm năng"}
                    value={subscription?.countContact ?? 0}
                    maxValue={subscription?.maxContact ?? 0}
                    icon={<KHTNIcon />}
                />
            </div>
        </div>
    );
}

export const useSubscription = create((set) => ({
    subscription: null,
    setSubscription: (subscription) => set({ subscription }),
    refresh: async (orgId) => {
        try {
            const response = await getOrgUsageStatistics(orgId); // Sử dụng hàm getOrgUsageStatistics để lấy dữ liệu
            if (response.code === 0) {
                set({ subscription: response.content });
            } else {
                console.error("Không thể lấy dữ liệu subscription");
            }
        } catch (error) {
            console.error("Lỗi khi refresh subscription:", error);
        }
    },
}));

"use client";
import {
    getOrderPackage,
    getWalletDetail,
    getFunctionPackages,
} from "@/api/payment";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    MdClose,
    MdHelpOutline,
    MdKeyboardBackspace,
    MdOutlineContentCopy,
} from "react-icons/md";
import { PiApproximateEquals } from "react-icons/pi";
import BankTransferDialog from "./components/bank_transfer_dialog";
import DetailPaymentDialog from "./components/detail_payment_dialog";
import PaymentDialog from "./components/payment_dialog";
import { useDetailPaymentStore } from "./stores/historyStore";
import { useLanguage } from "@/contexts/LanguageContext";
import useBreakpoint from "@/hooks/useBreakpoint";

interface WalletInfo {
    id: string;
    credit: number;
}

const walletTabs = [
    {
        name: "Nạp thêm",
        icon: "/images/deposit_ico.png",
        path: "/deposit",
    },
    {
        name: "Chuyển tiền",
        icon: "/images/transfer_ico.png",
        path: "/transfer",
    },
    {
        name: "Lịch sử",
        icon: "/images/history_ico.png",
        path: "/",
    },
];

export function TransactionHistory({
    transactions,
    hasMore,
    loading,
    next,
}: {
    transactions: any;
    hasMore: boolean;
    loading: boolean;
    next: () => Promise<void>;
}) {
    const { setTransactionId, setOpen } = useDetailPaymentStore() as any;
    const groupTransactionsByDate = (transactions: any) => {
        const groups: Record<string, any[]> = {};
        transactions.forEach((transaction: any) => {
            const date = new Date(transaction.orderDate);
            const dateKey = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ).toISOString();

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(transaction);
        });
        return groups;
    };

    const getDateTitle = (dateStr: any) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const date = new Date(dateStr);

        if (date.toDateString() === today.toDateString()) {
            return "Hôm nay";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Hôm qua";
        } else {
            const weekDays = [
                "Chủ nhật",
                "Thứ hai",
                "Thứ ba",
                "Thứ tư",
                "Thứ năm",
                "Thứ sáu",
                "Thứ bảy",
            ];
            const weekDay = weekDays[date.getDay()];
            return `${weekDay}, ${date.getDate()}/${
                date.getMonth() + 1
            }/${date.getFullYear()}`;
        }
    };

    return (
        <ScrollArea className="h-full pb-4">
            <div className="flex flex-col gap-3 w-full px-4 mt-4 items-center">
                {Object.entries(groupTransactionsByDate(transactions)).map(
                    ([dateKey, transactionsGroup]) => (
                        <div key={dateKey} className="w-full">
                            <div className="py-2 font-medium">
                                {getDateTitle(dateKey)}
                            </div>
                            <div className="flex flex-col gap-3">
                                {transactionsGroup.map((transaction: any) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center w-full cursor-pointer"
                                        onClick={() => {
                                            setTransactionId(transaction.id);
                                            setOpen(true);
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full border-[1px] p-2 flex items-center justify-center">
                                            <Image
                                                src="/icons/coka_wallet_ico.svg"
                                                alt="deposit"
                                                width={30}
                                                height={30}
                                            />
                                        </div>
                                        <div className="flex flex-col ml-2 gap-[2px]">
                                            <div className="text-title text-sm font-medium">
                                                {transaction.title}
                                            </div>
                                            <div className="text-xs text-text2">
                                                {format(
                                                    transaction?.orderDate,
                                                    "HH:mm - dd/MM/yyyy"
                                                )}
                                            </div>
                                            {![undefined, null].includes(
                                                transaction?.cumulativeValue
                                            ) && (
                                                <div className="text-xs text-text2">
                                                    Số dư ví:{" "}
                                                    {transaction?.cumulativeValue.toLocaleString()}{" "}
                                                    Coin
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col ml-auto gap-[2px]">
                                            {transaction.statusCode !==
                                                "Unpaid" &&
                                                ![undefined, null].includes(
                                                    transaction?.transactionValue
                                                ) && (
                                                    <div className="text-end font-medium text-sm">
                                                        {transaction.transactionValue >
                                                            0 && "+"}
                                                        {transaction?.transactionValue?.toLocaleString()}{" "}
                                                        Coin
                                                    </div>
                                                )}
                                            <div
                                                className={cn(
                                                    `text-end text-xs`,
                                                    getStatus(
                                                        transaction.statusCode
                                                    ).color
                                                )}
                                            >
                                                {transaction.statusDesc}
                                            </div>
                                            <div className="text-xs text-text2 text-end">
                                                {transaction?.paymentMethodName}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}
                <InfiniteScroll
                    hasMore={hasMore}
                    isLoading={loading}
                    next={next}
                    threshold={1}
                    reverse={false}
                >
                    {hasMore && (
                        <Loader2 className="my-1 md:my-4 h-8 w-8 animate-spin" />
                    )}
                </InfiniteScroll>
            </div>
        </ScrollArea>
    );
}

export default function WalletLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}) {
    const { t } = useLanguage();
    const breakpoint = useBreakpoint();
    const { orgId } = use(params);
    const router = useRouter();
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [functionPackages, setFunctionPackages] = useState<any[]>([]);
    const [functionPackagesLoading, setFunctionPackagesLoading] =
        useState<boolean>(false);
    const { open, setOpen, transactionId, setTransactionId } =
        useDetailPaymentStore() as any;
    const [showHelp, setShowHelp] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const transId = searchParams.get("transactionId");
    const handlePayAgain = (transaction: any) => {
        setLoading(true);
        getOrderPackage(orgId, transaction.id)
            .then((res) => {
                if (res.code === 0) {
                    setTransaction(res.content);
                    setOpen(false);
                    setOpenPaymentDialog(true);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        if (transId) {
            setTransactionId(transId);
            setOpen(true);
            // Xóa searchParams
            const newUrl = pathname;
            router.replace(newUrl);
        }
    }, [transId]);

    useEffect(() => {
        const fetchWalletInfo = async () => {
            const response = await getWalletDetail(orgId);
            if (response.code === 0) {
                setWalletInfo(response.content);
            }
        };

        fetchWalletInfo();
    }, [orgId]);

    useEffect(() => {
        const fetchFunctionPackages = async () => {
            try {
                setFunctionPackagesLoading(true);
                const response = await getFunctionPackages(orgId);
                if (response.code === 0) {
                    setFunctionPackages(response.content || []);
                }
            } finally {
                setFunctionPackagesLoading(false);
            }
        };
        fetchFunctionPackages();
    }, [orgId]);
    const [openBankTransferDialog, setOpenBankTransferDialog] = useState(false);

    const bankApi = searchParams.get("bankApi");
    useEffect(() => {
        if (bankApi) {
            setOpenBankTransferDialog(true);
        }
    }, [bankApi]);
    return (
        <div className="flex flex-col h-full w-full pb-6">
            {openBankTransferDialog && (
                <BankTransferDialog
                    open={openBankTransferDialog}
                    setOpen={setOpenBankTransferDialog}
                />
            )}

            {showHelp && (
                <Dialog open={showHelp} onOpenChange={setShowHelp}>
                    <DialogContent className="max-w-[550px]">
                        <div className="flex flex-col w-full">
                            <DialogHeader>
                                <DialogTitle className="font-medium text-title flex items-center justify-between mb-3">
                                    Coka coin là gì?{" "}
                                </DialogTitle>
                                <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                            </DialogHeader>
                            <div className="flex flex-col gap-2 mt-4 text-sm">
                                <span>
                                    Coka coin - một đơn vị qui đổi có giá trị
                                    qui ước 1 coin = 1 vnđ, dùng để tiến hành
                                    các giao dịch , thanh toán các tiện ích bên
                                    trong ứng dụng .
                                </span>
                                <span>
                                    Người dùng có thể sở hữu Coka coin thông qua
                                    một số phương thức khác nhau như: sử dụng
                                    Phiếu Quà Tặng, Nạp Coka coin trực tiếp vào
                                    tài khoản hoặc Chuyển/Tặng coin cho nhau
                                    giữa các tổ chức.
                                </span>
                                <span>
                                    Các giao dịch nạp/ chuyển Coka coin vào tài
                                    khoản sẽ không thể HỦY / TRẢ
                                </span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            {open && (
                <DetailPaymentDialog
                    open={open}
                    setOpen={setOpen}
                    transactionId={transactionId}
                    handlePayAgain={handlePayAgain}
                    loading={loading}
                />
            )}
            {openPaymentDialog && (
                <PaymentDialog
                    open={openPaymentDialog}
                    setOpen={setOpenPaymentDialog}
                    transaction={transaction}
                />
            )}

            <div className="w-full h-full flex gap-4 overflow-hidden">
                <div className="w-[450px] rounded-2xl flex flex-col bg-white">
                    <div className="flex items-center w-full pl-5 pr-3 py-4 border-b relative flex-shrink-0">
                        <MdKeyboardBackspace
                            className="text-xl cursor-pointer"
                            onClick={() => router.back()}
                        />
                        <div className="text-[18px] font-medium ml-2">
                            {t("wallet.balance")}
                        </div>
                    </div>
                    <div className="p-4 flex-shrink-0">
                        <div className="p-4 rounded-lg coin-card-bg w-full flex flex-col gap-2 text-white ">
                            <div className="flex flex-col border-dashed border-b border-white w-full pb-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    ID: {walletInfo?.id}
                                    <MdOutlineContentCopy
                                        className="cursor-pointer text-base"
                                        onClick={() => {
                                            if (walletInfo?.id) {
                                                navigator.clipboard.writeText(
                                                    walletInfo.id
                                                );
                                            }
                                            toast.success("Đã copy ví ID");
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-[6px] text-[20px] font-medium mt-2">
                                    {walletInfo?.credit.toLocaleString()}
                                    <Image
                                        src="/images/coka_coin.png"
                                        alt="coin"
                                        width={22}
                                        height={22}
                                    />
                                    <span
                                        className="text-[10px] cursor-pointer flex items-center ml-auto gap-1"
                                        onClick={() => setShowHelp(true)}
                                    >
                                        Coka coin là gì{" "}
                                        <MdHelpOutline className="text-sm" />
                                    </span>
                                </div>
                                <div className="text-xs mt-2 gap-1 flex items-center font-medium">
                                    <PiApproximateEquals />{" "}
                                    {walletInfo?.credit.toLocaleString()} VNĐ
                                </div>
                            </div>
                            <div className="flex items-center justify-around">
                                {walletTabs.map((tab, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex flex-col items-center gap-2 cursor-pointer text-xs text-white",
                                            pathname ===
                                                `/org/${orgId}/wallet${tab.path}`
                                                ? "font-medium"
                                                : ""
                                        )}
                                        onClick={() => {
                                            const path =
                                                tab.path === "/"
                                                    ? ""
                                                    : tab.path;
                                            router.push(
                                                `/org/${orgId}/wallet${path}`
                                            );
                                        }}
                                    >
                                        <Image
                                            src={tab.icon}
                                            alt={tab.name}
                                            width={30}
                                            height={30}
                                            unoptimized
                                        />
                                        {tab.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-4 flex flex-col gap-3">
                        <div className="font-medium text-sm">
                            Dịch vụ đã sử dụng
                        </div>
                        <ScrollArea
                            className={cn(
                                "max-h-[600px]",
                                breakpoint === "xl" ||
                                    breakpoint === "lg" ||
                                    breakpoint === "md" ||
                                    breakpoint === "sm"
                                    ? "max-h-[300px]"
                                    : ""
                            )}
                        >
                            <div className="flex flex-col gap-2 pr-2">
                                {functionPackagesLoading && (
                                    <div className="text-xs text-text2">
                                        Đang tải...
                                    </div>
                                )}
                                {!functionPackagesLoading &&
                                    functionPackages.length === 0 && (
                                        <div className="text-xs text-text2">
                                            Chưa có gói nào
                                        </div>
                                    )}
                                {functionPackages.map((pkg: any) => (
                                    <div
                                        key={pkg.id}
                                        className="w-full rounded-lg border p-3 cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            {pkg.packageType ===
                                                "DATA_ENRICHMENT" && (
                                                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                                                    <Image
                                                        src="/icons/data.svg"
                                                        alt="data_enrichment"
                                                        width={20}
                                                        height={20}
                                                    />
                                                </div>
                                            )}
                                            {(pkg.packageType ===
                                                "CALL_CENTER" ||
                                                pkg.packageType ===
                                                    "LINE_CALL_CENTER_DEFAULT") && (
                                                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                                                    <Image
                                                        src="/icons/phone.svg"
                                                        alt="phone"
                                                        width={20}
                                                        height={20}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex gap-2 w-full">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm font-medium">
                                                        {pkg.packageName}
                                                    </div>
                                                    <div className="text-[12px] text-text2">
                                                        Ngày đăng ký:{" "}
                                                        {pkg.startDate
                                                            ? format(
                                                                  new Date(
                                                                      pkg.startDate
                                                                  ),
                                                                  "HH:mm - dd/MM/yyyy"
                                                              )
                                                            : "-"}
                                                    </div>
                                                    <div className="text-[12px] text-text2">
                                                        Sử dụng:{" "}
                                                        <span className="font-medium text-title">
                                                            {pkg.usage?.toLocaleString?.() ??
                                                                pkg.usage}
                                                        </span>
                                                        {pkg.usageLimit > 0 && (
                                                            <>
                                                                <span> / </span>
                                                                <span className="font-medium text-title">
                                                                    {pkg.usageLimit?.toLocaleString?.() ??
                                                                        pkg.usageLimit}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {(pkg.memberLimit ?? 0) >
                                                        0 && (
                                                        <div className="text-[12px] text-text2">
                                                            Thành viên:{" "}
                                                            <span className="font-medium text-title">
                                                                {pkg.member?.toLocaleString?.() ??
                                                                    pkg.member}
                                                            </span>
                                                            <span> / </span>
                                                            <span className="font-medium text-title">
                                                                {pkg.memberLimit?.toLocaleString?.() ??
                                                                    pkg.memberLimit}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {(() => {
                                                    const now = new Date();
                                                    const expiry =
                                                        pkg.expiryDate
                                                            ? new Date(
                                                                  pkg.expiryDate
                                                              )
                                                            : null;
                                                    if (!expiry) return null;
                                                    const isExpired =
                                                        expiry < now;
                                                    const daysLeft = Math.max(
                                                        0,
                                                        Math.ceil(
                                                            (expiry.getTime() -
                                                                now.getTime()) /
                                                                (1000 *
                                                                    60 *
                                                                    60 *
                                                                    24)
                                                        )
                                                    );
                                                    const monthsLeft = Math.max(
                                                        0,
                                                        differenceInMonths(
                                                            expiry,
                                                            now
                                                        )
                                                    );
                                                    const isSoon =
                                                        !isExpired &&
                                                        daysLeft <= 7;
                                                    const statusText = isExpired
                                                        ? "Hết hạn"
                                                        : isSoon
                                                        ? "Sắp hết hạn"
                                                        : "Đang hoạt động";
                                                    const statusColor =
                                                        isExpired
                                                            ? "text-red-600"
                                                            : isSoon
                                                            ? "text-orange-600"
                                                            : "text-green-600";
                                                    const remainText = `Thời gian còn lại: ${
                                                        isExpired
                                                            ? 0
                                                            : monthsLeft >= 1
                                                            ? monthsLeft +
                                                              " tháng"
                                                            : daysLeft + " ngày"
                                                    }`;
                                                    return (
                                                        <div className="ml-auto text-right">
                                                            <div
                                                                className={`text-[12px] font-medium ${statusColor}`}
                                                            >
                                                                {statusText}
                                                            </div>
                                                            <div className="text-[11px] text-text2">
                                                                {remainText}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}

const getStatus = (status: any) => {
    switch (status) {
        case "Success":
            return { name: "Thành công", color: "text-green-500" };
        case "Failed":
            return { name: "Thất bại", color: "text-red-500" };
        case "Canceled":
            return { name: "Đã hủy", color: "text-red-500" };
        default:
            return { name: "Đang xử lý", color: "text-orange-500" };
    }
};

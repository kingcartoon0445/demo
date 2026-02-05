"use client";
import { MdKeyboardBackspace } from "react-icons/md";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TransactionHistory } from "./layout";
import { useHistoryStore } from "./stores/historyStore";
import { getTransactionHistory } from "@/api/payment";
import toast from "react-hot-toast";
import useBreakpoint from "@/hooks/useBreakpoint";
export default function HistoryPage({ params }: { params: any }) {
    const breakpoint = useBreakpoint();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState(searchParams.get("type") || "all");
    const {
        historyList,
        setHistoryList,
        resetHistoryList,
        page,
        incPage,
        resetPage,
    } = useHistoryStore() as any;
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        resetHistoryList();
        resetPage();
        setHasMore(true);
    }, [tab]);

    const next = async () => {
        setLoading(true);
        const value = await getTransactionHistory(params.orgId, {
            offset: page * 20,
            limit: 20,
            type: tab == "all" ? "" : tab,
        });
        if (value?.code == 0) {
            setHistoryList(value.content);
        } else if (value?.message) {
            toast.error(value?.message);
        } else {
            setLoading(false);
            return;
        }
        incPage();
        if ((value?.content?.length ?? 0) < 20) {
            setHasMore(false);
        }
        setLoading(false);
    };
    useEffect(() => {
        if (searchParams.get("type")) {
            setTab(searchParams.get("type") as string);
        }
    }, [searchParams.get("type")]);
    return (
        <div className="flex-1 rounded-2xl flex flex-col bg-white items-center">
            <div className="flex items-center w-full pl-5 pr-3 py-4 border-b relative">
                <div className="text-[18px] font-medium ml-2">
                    Lịch sử giao dịch
                </div>
            </div>
            <div className="flex items-center w-full overflow-x-auto">
                <div className="flex items-center justify-start w-full border-b border-gray-200">
                    {TabMenu.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex flex-col items-center py-3 px-4 border-b-2 font-medium cursor-pointer text-sm transition-all duration-300",
                                tab === item.value
                                    ? "text-primary border-primary"
                                    : "text-gray-600 hover:text-primary hover:bg-gray-50 border-transparent"
                            )}
                            onClick={() => {
                                router.push(
                                    `/org/${params.orgId}/wallet?type=${item.value}`
                                );
                            }}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-hidden w-full">
                <TransactionHistory
                    transactions={historyList}
                    hasMore={hasMore}
                    loading={loading}
                    next={next}
                />
            </div>
        </div>
    );
}

const TabMenu = [
    {
        name: "Tất cả",
        value: "all",
    },
    {
        name: "Nạp tiền",
        value: "IN",
    },
    {
        name: "Thanh toán",
        value: "OUT",
    },
    {
        name: "Chuyển tiền",
        value: "transfer",
    },
    {
        name: "Hoàn tiền",
        value: "refund",
    },
];

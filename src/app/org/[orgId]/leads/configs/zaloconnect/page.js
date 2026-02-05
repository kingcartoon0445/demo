"use client";
import { updateSubscriptionStatus } from "@/api/facebook";
import {
    deleteZaloMessageConnection,
    getZaloMessageConnection,
    updateZaloMessageConnection,
} from "@/api/leadV2";
import LeadsLayout from "@/components/leads/LeadsLayout";
import { ToastPromise } from "@/components/toast";
import { Switch } from "@/components/ui/switch";
import { useZaloSubscriptionList } from "@/hooks/facebook_data";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import { UnlinkButton } from "../form/components/unlink_button";
import ZaloConnectFrame from "./components/zaloconnect_frame";
import { Glass } from "@/components/Glass";

export default function Page({ params }) {
    const orgId = use(params).orgId;
    const { subscriptionList, setSubscriptionList, resetSubscriptionList } =
        useZaloSubscriptionList();
    useEffect(() => {
        resetSubscriptionList();
    }, [orgId]);
    const loadSubscriptionList = () => {
        getZaloMessageConnection(orgId).then((res) => {
            if (res?.code == 0) {
                setSubscriptionList(res?.content);
            }
        });
    };

    // Avoid duplicate load in React StrictMode Dev (runs effects twice on mount)
    const fetchedForOrgRef = useRef(null);
    useEffect(() => {
        if (!orgId) return;
        if (fetchedForOrgRef.current === orgId) return;
        fetchedForOrgRef.current = orgId;
        loadSubscriptionList();
    }, [orgId]);
    return (
        <LeadsLayout selectedSource="config-zalo" orgId={orgId}>
            <div className="flex flex-col h-full w-full">
                <Glass
                    className="rounded-2xl flex flex-col h-full overflow-hidden"
                    intensity="high"
                >
                    <ZaloConnectFrame
                        orgId={orgId}
                        onRefresh={loadSubscriptionList}
                    />

                    <div className="flex flex-col px-4 gap-2 overflow-y-auto min-h-0 flex-1 pb-4">
                        <div className="font-medium mb-2 shrink-0">
                            Trang đã liên kết
                        </div>
                        <div className="py-2 flex flex-col gap-5">
                            {subscriptionList.map((e, i) => (
                                <CustomCard
                                    key={i}
                                    name={e.name}
                                    status={e.status}
                                    avatar={e.avatar}
                                    id={e.id}
                                    orgId={orgId}
                                    uid={e.uid}
                                    onRefresh={loadSubscriptionList}
                                />
                            ))}
                        </div>
                    </div>
                </Glass>
            </div>
        </LeadsLayout>
    );
}

const CustomCard = ({ name, avatar, status, id, orgId, uid, onRefresh }) => {
    const [checked, setChecked] = useState(status == 1);
    const handleOnChange = (value) => {
        const prevState = checked;

        ToastPromise(() =>
            updateZaloMessageConnection(orgId, id, value ? 1 : 0)
                .then((response) => {
                    if (response?.code === 0) {
                        setChecked(value);
                    } else {
                        // Nếu request thất bại, quay lại trạng thái cũ
                        setChecked(prevState);
                    }
                    return response;
                })
                .catch(() => {
                    // Nếu có lỗi, quay lại trạng thái cũ
                    setChecked(prevState);
                }),
        );
    };

    const handleUnlink = () => {
        deleteZaloMessageConnection(orgId, id).then((res) => {
            if (res?.code === 0) {
                toast.success("Đã xóa kết nối");
                onRefresh();
            }
        });
    };
    return (
        <div className="flex items-center px-4 py-3 rounded-lg shadow-sm justify-between bg-white/40 border border-white/20 transition-all duration-200 hover:shadow-lg hover:bg-white/60 hover:-translate-y-0.5">
            <div className="flex items-center gap-2">
                <Avatar
                    name={getFirstAndLastWord(name)}
                    src={getAvatarUrl(avatar)}
                    round
                    size="32"
                />
                <Link
                    className=""
                    href={`https://zalo.me/${uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {name}
                </Link>
            </div>
            <div className="flex items-center gap-2">
                <Switch
                    checked={checked}
                    onCheckedChange={handleOnChange}
                    className="data-[state=checked]:bg-primary"
                />
                <UnlinkButton
                    title={name}
                    onUnlink={handleUnlink}
                    provider="ZALO"
                />
            </div>
        </div>
    );
};

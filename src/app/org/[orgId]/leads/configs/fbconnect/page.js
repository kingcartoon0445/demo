"use client";
import {
    deleteFacebookConnect,
    getFacebookMessageConnection,
} from "@/api/leadV2";
import LeadsLayout from "@/components/leads/LeadsLayout";
import { ToastPromise } from "@/components/toast";
import { Switch } from "@/components/ui/switch";
import { useFbSubscriptionList } from "@/hooks/facebook_data";
import { useUpdateSubscriptionStatus } from "@/hooks/useConversation";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import { UnlinkButton } from "../form/components/unlink_button";
import FBConnectFrame from "./components/fbConnectFrame";

export default function Page({ params }) {
    const orgId = use(params).orgId;
    const { subscriptionList, setSubscriptionList, resetSubscriptionList } =
        useFbSubscriptionList();
    useEffect(() => {
        resetSubscriptionList();
    }, [orgId]);
    const loadSubscriptionList = () => {
        getFacebookMessageConnection(orgId).then((res) => {
            if (res?.code == 0) {
                setSubscriptionList(res?.content);
            }
        });
    };
    useEffect(() => {
        loadSubscriptionList();
    }, [orgId]);
    return (
        <LeadsLayout selectedSource="config-messenger" orgId={orgId}>
            <div className="flex flex-col gap-2 w-full h-full">
                <FBConnectFrame orgId={orgId} />

                <div className="flex flex-col px-4 gap-2 overflow-y-auto">
                    <div className="font-medium mb-2">Trang đã liên kết</div>
                    <div className="py-2">
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
            </div>
        </LeadsLayout>
    );
}

const CustomCard = ({ name, avatar, status, id, orgId, uid, onRefresh }) => {
    const { mutateAsync: updateSubscriptionStatusMutation } =
        useUpdateSubscriptionStatus(orgId);
    const [checked, setChecked] = useState(status == 1);
    const handleOnChange = (value) => {
        const prevState = checked;
        ToastPromise(() =>
            updateSubscriptionStatusMutation({
                subscriptionId: id,
                status: value ? 1 : 0,
            })
                .then((res) => {
                    if (res?.code === 0) {
                        setChecked(value);
                    } else {
                        setChecked(prevState);
                    }
                    return res;
                })
                .catch(() => {
                    setChecked(prevState);
                })
        );
    };
    const handleUnlink = () => {
        deleteFacebookConnect(orgId, id).then((res) => {
            if (res?.code === 0) {
                toast.success("Đã xóa kết nối");
                onRefresh(); // Reload data after successful unlink
            }
        });
    };
    return (
        <div className="flex items-center px-4 py-3 rounded-lg shadow-sm justify-between">
            <div className="flex items-center gap-2">
                <Avatar
                    name={getFirstAndLastWord(name)}
                    src={getAvatarUrl(avatar)}
                    round
                    size="32"
                />
                <Link
                    className="ml-2"
                    href={`https://fb.com/${uid}`}
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
                    provider="FACEBOOK"
                />
            </div>
        </div>
    );
};

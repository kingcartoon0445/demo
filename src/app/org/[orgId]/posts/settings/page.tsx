"use client";

import { useParams } from "next/navigation";
import { PostsLayout } from "../components/PostsLayout";
import { ChannelSettingsContent } from "../components/ChannelSettingsContent";

export default function ChannelSettingsPage() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    if (!orgId) {
        return <div className="p-6">Thiếu orgId trên URL</div>;
    }

    return (
        <PostsLayout activeKey="settings">
            <ChannelSettingsContent />
        </PostsLayout>
    );
}



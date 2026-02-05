"use client";

import { useParams } from "next/navigation";
import { PostsLayout } from "../components/PostsLayout";
import { PostsScheduleContent } from "../components/PostsScheduleContent";

export default function PostsSchedulePage() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    if (!orgId) {
        return <div className="p-6">Thiếu orgId trên URL</div>;
    }

    return (
        <PostsLayout activeKey="schedule">
            <PostsScheduleContent />
        </PostsLayout>
    );
}



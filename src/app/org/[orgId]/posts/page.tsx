"use client";

import { useParams } from "next/navigation";
import { PostsOverviewLayout } from "./components/PostsOverviewLayout";

export default function PostsFeaturePage() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    if (!orgId) {
        return <div className="p-6">Thiếu orgId trên URL</div>;
    }

    return <PostsOverviewLayout />;
}

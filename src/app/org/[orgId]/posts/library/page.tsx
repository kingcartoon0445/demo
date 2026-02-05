"use client";

import { useParams } from "next/navigation";
import { PostsLayout } from "../components/PostsLayout";
import { MediaLibraryContent } from "../components/MediaLibraryContent";

export default function MediaLibraryPage() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    if (!orgId) {
        return <div className="p-6">Thiếu orgId trên URL</div>;
    }

    return (
        <PostsLayout activeKey="library">
            <MediaLibraryContent />
        </PostsLayout>
    );
}



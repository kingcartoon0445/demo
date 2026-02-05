"use client";

import { useParams } from "next/navigation";
import { PostsLayout } from "../../components/PostsLayout";
import { EditPostContent } from "../../components/EditPostContent";

export default function EditPostPage() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";
    const postId = (params.postId as string) || "";

    if (!orgId) {
        return <div className="p-6">Thiếu orgId trên URL</div>;
    }

    if (!postId) {
        return <div className="p-6">Thiếu postId trên URL</div>;
    }

    return (
        <PostsLayout activeKey="create">
            <EditPostContent postId={postId} />
        </PostsLayout>
    );
}


"use client";

import { PostsLayout } from "./PostsLayout";
import { CreatePostContent } from "./CreatePostContent";

export function CreatePostLayout() {
    return (
        <PostsLayout activeKey="create">
            <CreatePostContent />
        </PostsLayout>
    );
}



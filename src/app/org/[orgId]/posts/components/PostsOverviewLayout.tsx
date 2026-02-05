"use client";

import { PostsLayout } from "./PostsLayout";
import { PostsOverviewDashboard } from "./PostsOverviewDashboard";

export function PostsOverviewLayout() {
    return (
        <PostsLayout activeKey="overview">
            <PostsOverviewDashboard />
        </PostsLayout>
    );
}

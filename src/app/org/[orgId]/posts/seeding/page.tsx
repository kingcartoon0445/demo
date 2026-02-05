"use client";

import { PostsLayout } from "../components/PostsLayout";
import { SeedingDashboard } from "./components/SeedingDashboard";

export default function SeedingPage() {
    return (
        <PostsLayout activeKey="seeding">
            <SeedingDashboard />
        </PostsLayout>
    );
}

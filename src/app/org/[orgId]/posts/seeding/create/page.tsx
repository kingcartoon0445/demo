"use client";

import React from "react";
import { PostsLayout } from "../../components/PostsLayout";
import CreateSeedingCampaign from "./components/CreateSeedingCampaign";

export default function CreateSeedingPage() {
    // Note: Active key 'seeding' keeps the sidebar highlighted correctly
    return (
        <PostsLayout activeKey="seeding">
            <CreateSeedingCampaign />
        </PostsLayout>
    );
}

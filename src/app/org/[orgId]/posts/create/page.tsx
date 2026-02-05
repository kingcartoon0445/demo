"use client";

import { useParams } from "next/navigation";
import { CreatePostLayout } from "../components/CreatePostLayout";

export default function CreatePostPage() {
    const params = useParams();
    const orgId = (params.orgId as string) || "";

    if (!orgId) {
        return <div className="p-6">Thiếu orgId trên URL</div>;
    }

    return <CreatePostLayout />;
}



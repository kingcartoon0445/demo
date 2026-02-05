"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTable } from "./SimpleTable";
import type { PostListItem } from "@/interfaces/post";

interface PostListProps {
    items: PostListItem[];
    isLoading: boolean;
    onEdit: (row: PostListItem) => void;
    onDelete: (row: PostListItem) => void;
}

export function PostList({
    items,
    isLoading,
    onEdit,
    onDelete,
}: PostListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách Post</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleTable<PostListItem>
                    data={items}
                    isLoading={isLoading}
                    columns={[
                        { key: "title", label: "Title" },
                        { key: "type", label: "Type" },
                        { key: "channelId", label: "Channel" },
                        { key: "status", label: "Status" },
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </CardContent>
        </Card>
    );
}



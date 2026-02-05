"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTable } from "./SimpleTable";
import type { ChannelItem } from "@/interfaces/post";

interface ChannelListProps {
    items: ChannelItem[];
    isLoading: boolean;
    onEdit: (row: ChannelItem) => void;
    onDelete: (row: ChannelItem) => void;
}

export function ChannelList({
    items,
    isLoading,
    onEdit,
    onDelete,
}: ChannelListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách Channel</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleTable<ChannelItem>
                    data={items}
                    isLoading={isLoading}
                    columns={[
                        { key: "name", label: "Name" },
                        { key: "type", label: "Type" },
                        { key: "isActive", label: "Active" },
                        { key: "status", label: "Status" },
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </CardContent>
        </Card>
    );
}


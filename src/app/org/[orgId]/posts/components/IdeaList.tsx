"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTable } from "./SimpleTable";
import type { IdeaItem } from "@/interfaces/post";

interface IdeaListProps {
    items: IdeaItem[];
    isLoading: boolean;
    onEdit: (row: IdeaItem) => void;
    onDelete: (row: IdeaItem) => void;
}

export function IdeaList({
    items,
    isLoading,
    onEdit,
    onDelete,
}: IdeaListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách Idea</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleTable<IdeaItem>
                    data={items}
                    isLoading={isLoading}
                    columns={[
                        { key: "topic", label: "Topic" },
                        { key: "isUsed", label: "Used" },
                        { key: "status", label: "Status" },
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </CardContent>
        </Card>
    );
}


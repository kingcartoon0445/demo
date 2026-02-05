"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTable } from "./SimpleTable";
import type { CampaignItem } from "@/interfaces/post";

interface CampaignListProps {
    items: CampaignItem[];
    isLoading: boolean;
    onEdit: (row: CampaignItem) => void;
    onDelete: (row: CampaignItem) => void;
}

export function CampaignList({
    items,
    isLoading,
    onEdit,
    onDelete,
}: CampaignListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Danh sách Campaign</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleTable<CampaignItem>
                    data={items}
                    isLoading={isLoading}
                    columns={[
                        { key: "name", label: "Name" },
                        { key: "status", label: "Status" },
                        { key: "startDate", label: "Start" },
                        { key: "endDate", label: "End" },
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </CardContent>
        </Card>
    );
}



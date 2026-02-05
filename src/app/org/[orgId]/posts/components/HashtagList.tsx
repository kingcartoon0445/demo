"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTable } from "./SimpleTable";
import type { HashtagItem } from "@/interfaces/post";
import { useLanguage } from "@/contexts/LanguageContext";

interface HashtagListProps {
    items: HashtagItem[];
    isLoading: boolean;
    onEdit: (row: HashtagItem) => void;
    onDelete: (row: HashtagItem) => void;
}

export function HashtagList({
    items,
    isLoading,
    onEdit,
    onDelete,
}: HashtagListProps) {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("common.hashtagList")}</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleTable<HashtagItem>
                    data={items}
                    isLoading={isLoading}
                    columns={[
                        { key: "tag", label: t("common.hashtag") },
                        { key: "status", label: t("common.status") },
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </CardContent>
        </Card>
    );
}

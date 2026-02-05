"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTable } from "./SimpleTable";
import type { LabelItem } from "@/interfaces/post";
import { useLanguage } from "@/contexts/LanguageContext";

interface LabelListProps {
    items: LabelItem[];
    isLoading: boolean;
    onEdit: (row: LabelItem) => void;
    onDelete: (row: LabelItem) => void;
}

export function LabelList({
    items,
    isLoading,
    onEdit,
    onDelete,
}: LabelListProps) {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("common.labelList")}</CardTitle>
            </CardHeader>
            <CardContent>
                <SimpleTable<LabelItem>
                    data={items}
                    isLoading={isLoading}
                    columns={[
                        { key: "name", label: t("common.name") },
                        { key: "color", label: t("common.color") },
                        { key: "status", label: t("common.status") },
                    ]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </CardContent>
        </Card>
    );
}

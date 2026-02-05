"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { postsApi } from "@/api/posts";
import { useCrud } from "../hooks/useCrud";
import type { CampaignItem, CampaignPayload } from "@/interfaces/post";
import { parseGenericList } from "../utils";

interface CampaignComboboxProps {
    orgId: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function CampaignCombobox({
    orgId,
    value,
    onChange,
    placeholder = "Chọn Campaign...",
    disabled = false,
}: CampaignComboboxProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createValue, setCreateValue] = useState("");

    const campaignCrud = useCrud<CampaignItem>(
        {
            loadFn: (page, pageSize) =>
                postsApi.getCampaigns(orgId, { page, pageSize }),
            createFn: (payload) => postsApi.createCampaign(orgId, payload),
            parseList: parseGenericList<CampaignItem>(),
        },
        100
    );

    useEffect(() => {
        if (orgId) {
            campaignCrud.load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const options: SearchableSelectOption[] = useMemo(
        () =>
            campaignCrud.items.map((campaign) => ({
                value: String(campaign.id),
                label: campaign.name,
                description: campaign.description,
            })),
        [campaignCrud.items]
    );

    const handleCreate = async () => {
        if (!createValue.trim()) return;
        setIsCreating(true);
        try {
            // save() trong useCrud đã tự động gọi load() rồi
            await campaignCrud.save({
                name: createValue,
                description: "",
                status: 1,
            });
            // Tìm item vừa tạo và set value (items đã được load lại trong save())
            const newCampaign = campaignCrud.items.find(
                (item) => item.name === createValue
            );
            if (newCampaign?.id) {
                onChange(String(newCampaign.id));
            }
            setCreateValue("");
            setSearchQuery("");
        } catch (error) {
            console.error("Error creating campaign:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredOptions = searchQuery
        ? options.filter((opt) =>
              opt.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    const showCreateOption =
        searchQuery &&
        !filteredOptions.some(
            (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase()
        );

    return (
        <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            searchPlaceholder="Tìm kiếm campaign..."
            emptyMessage="Không tìm thấy campaign."
            renderEmptyComponent={(query) => (
                <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground mb-2">
                        Không tìm thấy campaign.
                    </p>
                    {showCreateOption && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Tạo "{query}"
                        </button>
                    )}
                </div>
            )}
            onSearch={(query) => {
                setSearchQuery(query);
                setCreateValue(query);
            }}
        />
    );
}

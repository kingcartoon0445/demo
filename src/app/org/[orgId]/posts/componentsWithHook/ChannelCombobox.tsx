"use client";

import { useState, useEffect, useMemo } from "react";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { postsApi } from "@/api/posts";
import { useCrud } from "../hooks/useCrud";
import type { ChannelItem } from "@/interfaces/post";
import { parseGenericList } from "../utils";

interface ChannelComboboxProps {
    orgId: string;
    value?: string;
    onChange: (value: string, channel?: ChannelItem) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function ChannelCombobox({
    orgId,
    value,
    onChange,
    placeholder = "Chọn Channel...",
    disabled = false,
}: ChannelComboboxProps) {
    const channelCrud = useCrud<ChannelItem>(
        {
            loadFn: (page, pageSize) =>
                postsApi.getChannels(orgId, { page, pageSize }),
            parseList: parseGenericList<ChannelItem>(),
        },
        100
    );

    useEffect(() => {
        if (orgId) {
            channelCrud.load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const options: SearchableSelectOption[] = useMemo(
        () =>
            channelCrud.items.map((channel) => ({
                value: String(channel.id),
                label: `${channel.name} (${channel.type})`,
                description: channel.type,
            })),
        [channelCrud.items]
    );

    const handleChange = (selectedValue: string) => {
        const selectedChannel = channelCrud.items.find(
            (item) => String(item.id) === selectedValue
        );
        onChange(selectedValue, selectedChannel);
    };

    return (
        <SearchableSelect
            options={options}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            searchPlaceholder="Tìm kiếm channel..."
            emptyMessage="Không tìm thấy channel."
        />
    );
}


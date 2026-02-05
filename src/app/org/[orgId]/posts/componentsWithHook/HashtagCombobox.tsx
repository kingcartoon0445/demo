"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { postsApi } from "@/api/posts";
import { useCrud } from "../hooks/useCrud";
import type { HashtagItem, HashtagPayload } from "@/interfaces/post";
import { parseGenericList } from "../utils";

interface HashtagComboboxProps {
    orgId: string;
    values?: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function HashtagCombobox({
    orgId,
    values = [],
    onChange,
    placeholder = "Chọn Hashtags...",
    disabled = false,
}: HashtagComboboxProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createValue, setCreateValue] = useState("");

    const hashtagCrud = useCrud<HashtagItem>(
        {
            loadFn: (page, pageSize) =>
                postsApi.getHashtags(orgId, { page, pageSize }),
            createFn: (payload) => postsApi.createHashtag(orgId, payload),
            parseList: parseGenericList<HashtagItem>(),
        },
        100
    );

    useEffect(() => {
        if (orgId) {
            hashtagCrud.load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const options: SearchableSelectOption[] = useMemo(
        () =>
            hashtagCrud.items.map((hashtag) => ({
                value: hashtag.tag,
                label: `#${hashtag.tag}`,
            })),
        [hashtagCrud.items]
    );

    const handleCreate = async () => {
        if (!createValue.trim()) return;
        setIsCreating(true);
        try {
            // save() trong useCrud đã tự động gọi load() rồi
            await hashtagCrud.save({
                tag: createValue.trim(),
                status: 1,
            });
            // Set value (items đã được load lại trong save())
            const tagValue = createValue.trim();
            if (!values.includes(tagValue)) {
                onChange([...values, tagValue]);
            }
            setCreateValue("");
            setSearchQuery("");
        } catch (error) {
            console.error("Error creating hashtag:", error);
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
            (opt) => opt.value.toLowerCase() === searchQuery.toLowerCase()
        );

    const selectedOptions = options.filter((opt) => values.includes(opt.value));
    const selectedLabels = selectedOptions.map((opt) => opt.label).join(", ");

    return (
        <div className="space-y-2">
            <SearchableSelect
                options={options}
                value=""
                onChange={(newValue) => {
                    if (values.includes(newValue)) {
                        // Nếu đã chọn rồi thì bỏ chọn (uncheck)
                        onChange(values.filter((v) => v !== newValue));
                    } else {
                        onChange([...values, newValue]);
                    }
                }}
                placeholder={selectedLabels || placeholder}
                disabled={disabled}
                searchPlaceholder="Tìm kiếm hashtag..."
                emptyMessage="Không tìm thấy hashtag."
                renderEmptyComponent={(query) => (
                    <div className="py-6 text-center text-sm">
                        <p className="text-muted-foreground mb-2">
                            Không tìm thấy hashtag.
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
        </div>
    );
}

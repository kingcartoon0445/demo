"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { postsApi } from "@/api/posts";
import { useCrud } from "../hooks/useCrud";
import type { IdeaItem, IdeaPayload } from "@/interfaces/post";
import { parseGenericList } from "../utils";

interface IdeaComboboxProps {
    orgId: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function IdeaCombobox({
    orgId,
    value,
    onChange,
    placeholder = "Chọn Idea...",
    disabled = false,
}: IdeaComboboxProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createValue, setCreateValue] = useState("");

    const ideaCrud = useCrud<IdeaItem>(
        {
            loadFn: (page, pageSize) =>
                postsApi.getIdeas(orgId, { page, pageSize }),
            createFn: (payload) => postsApi.createIdea(orgId, payload),
            parseList: parseGenericList<IdeaItem>(),
        },
        100
    );

    useEffect(() => {
        if (orgId) {
            ideaCrud.load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const options: SearchableSelectOption[] = useMemo(
        () =>
            ideaCrud.items.map((idea) => ({
                value: String(idea.id),
                label: idea.topic,
                description: idea.content,
            })),
        [ideaCrud.items]
    );

    const handleCreate = async () => {
        if (!createValue.trim()) return;
        setIsCreating(true);
        try {
            // save() trong useCrud đã tự động gọi load() rồi
            await ideaCrud.save({
                topic: createValue,
                content: "",
                isUsed: false,
                status: 1,
            });
            // Tìm item vừa tạo và set value (items đã được load lại trong save())
            const newIdea = ideaCrud.items.find(
                (item) => item.topic === createValue
            );
            if (newIdea?.id) {
                onChange(String(newIdea.id));
            }
            setCreateValue("");
            setSearchQuery("");
        } catch (error) {
            console.error("Error creating idea:", error);
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
            searchPlaceholder="Tìm kiếm idea..."
            emptyMessage="Không tìm thấy idea."
            renderEmptyComponent={(query) => (
                <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground mb-2">
                        Không tìm thấy idea.
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

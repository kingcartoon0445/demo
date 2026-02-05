"use client";

import { useState, useEffect, useMemo } from "react";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { getFacebookMessageConnection } from "@/api/leadV2";

interface FacebookPage {
    id: string;
    uid: string;
    title: string;
    name: string;
    avatar: string;
    status: number;
}

interface FacebookPageComboboxProps {
    orgId: string;
    value?: string | string[];
    onChange: (pageId: string | string[], pageName: string | string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    allowedPageIds?: string[];
    multiple?: boolean;
    showAll?: boolean;
}

export function FacebookPageCombobox({
    orgId,
    value,
    onChange,
    placeholder = "Chọn Facebook Page...",
    disabled = false,
    allowedPageIds,
    multiple = false,
    showAll = false,
}: FacebookPageComboboxProps) {
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            loadPages();
        }
    }, [orgId, allowedPageIds]);

    const loadPages = async () => {
        setIsLoading(true);
        try {
            const response = await getFacebookMessageConnection(orgId);
            if (response.code === 0 && response.content) {
                let loadedPages = response.content;
                if (allowedPageIds !== undefined) {
                    loadedPages = loadedPages.filter((page: FacebookPage) =>
                        allowedPageIds.includes(page.uid)
                    );
                }
                setPages(loadedPages);
            }
        } catch (error) {
            console.error("Error loading Facebook pages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const options: SearchableSelectOption[] = useMemo(
        () =>
            pages.map((page) => ({
                value: page.uid, // Sử dụng uid làm value (pageId)
                label: page.name || page.title,
                description: page.title,
                icon: page.avatar ? (
                    <img
                        src={page.avatar}
                        alt={page.name}
                        className="h-4 w-4 rounded-full"
                    />
                ) : undefined,
            })),
        [pages]
    );

    const multiSelectOptions = useMemo(
        () =>
            pages.map((page) => ({
                value: page.uid,
                label: page.name || page.title,
                avatar: page.avatar,
                showAvatar: true,
            })),
        [pages]
    );

    const handleChange = (selectedValue: string) => {
        const selectedPage = pages.find((page) => page.uid === selectedValue);
        if (selectedPage) {
            onChange(selectedPage.uid, selectedPage.name || selectedPage.title);
        }
    };

    const handleMultiChange = (selectedValues: string[]) => {
        const selectedNames = selectedValues.map((id) => {
            const page = pages.find((p) => p.uid === id);
            return page ? page.name || page.title : "";
        });
        onChange(selectedValues, selectedNames);
    };

    if (multiple) {
        return (
            <MultiSelect
                options={multiSelectOptions}
                selected={Array.isArray(value) ? value : value ? [value] : []}
                onChange={handleMultiChange}
                placeholder={isLoading ? "Đang tải..." : placeholder}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                showAllBadges={showAll}
            />
        );
    }

    return (
        <SearchableSelect
            options={options}
            value={value as string}
            onChange={handleChange}
            placeholder={isLoading ? "Đang tải..." : placeholder}
            disabled={disabled || isLoading}
            searchPlaceholder="Tìm kiếm Facebook page..."
            emptyMessage="Không tìm thấy Facebook page."
        />
    );
}

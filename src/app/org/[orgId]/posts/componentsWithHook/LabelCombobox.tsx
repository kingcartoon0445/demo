"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    SearchableSelect,
    type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { postsApi } from "@/api/posts";
import { useCrud } from "../hooks/useCrud";
import type { LabelItem, LabelPayload } from "@/interfaces/post";
import { parseGenericList } from "../utils";

interface LabelComboboxProps {
    orgId: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    multiple?: boolean;
    values?: string[];
    onChangeMultiple?: (values: string[]) => void;
}

export function LabelCombobox({
    orgId,
    value,
    onChange,
    placeholder = "Chọn Label...",
    disabled = false,
    multiple = false,
    values = [],
    onChangeMultiple,
}: LabelComboboxProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createColor, setCreateColor] = useState("#FF0000");
    const [isCreating, setIsCreating] = useState(false);

    const labelCrud = useCrud<LabelItem>(
        {
            loadFn: (page, pageSize) =>
                postsApi.getLabels(orgId, { page, pageSize }),
            createFn: (payload) => postsApi.createLabel(orgId, payload),
            parseList: parseGenericList<LabelItem>(),
        },
        100
    );

    useEffect(() => {
        if (orgId) {
            labelCrud.load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const options: SearchableSelectOption[] = useMemo(
        () =>
            labelCrud.items.map((label) => ({
                value: String(label.id),
                label: label.name,
                description: label.color,
                icon: (
                    <div
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: label.color || "#FF0000" }}
                    />
                ),
            })),
        [labelCrud.items]
    );

    const handleCreateClick = () => {
        setCreateName(searchQuery);
        setShowCreateDialog(true);
    };

    const handleCreate = async () => {
        if (!createName.trim()) return;
        setIsCreating(true);
        try {
            // save() trong useCrud đã tự động gọi load() rồi
            await labelCrud.save({
                name: createName,
                color: createColor,
                status: 1,
            });
            // Tìm item vừa tạo và set value (items đã được load lại trong save())
            const newLabel = labelCrud.items.find(
                (item) => item.name === createName
            );
            if (newLabel?.id) {
                const newId = String(newLabel.id);
                if (multiple && onChangeMultiple) {
                    onChangeMultiple([...values, newId]);
                } else {
                    onChange(newId);
                }
            }
            setCreateName("");
            setCreateColor("#FF0000");
            setSearchQuery("");
            setShowCreateDialog(false);
        } catch (error) {
            console.error("Error creating label:", error);
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

    if (multiple) {
        // Multi-select implementation
        const selectedOptions = options.filter((opt) =>
            values.includes(opt.value)
        );
        const selectedLabels = selectedOptions
            .map((opt) => opt.label)
            .join(", ");

        return (
            <>
                <div className="space-y-2">
                    <SearchableSelect
                        options={options}
                        value=""
                        onChange={(newValue) => {
                            if (
                                onChangeMultiple &&
                                !values.includes(newValue)
                            ) {
                                onChangeMultiple([...values, newValue]);
                            }
                        }}
                        placeholder={selectedLabels || placeholder}
                        disabled={disabled}
                        searchPlaceholder="Tìm kiếm label..."
                        emptyMessage="Không tìm thấy label."
                        renderEmptyComponent={(query) => (
                            <div className="py-6 text-center text-sm">
                                <p className="text-muted-foreground mb-2">
                                    Không tìm thấy label.
                                </p>
                                {showCreateOption && (
                                    <button
                                        type="button"
                                        onClick={handleCreateClick}
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tạo "{query}"
                                    </button>
                                )}
                            </div>
                        )}
                        onSearch={(query) => {
                            setSearchQuery(query);
                        }}
                    />
                    {selectedOptions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onChangeMultiple) {
                                                onChangeMultiple(
                                                    values.filter(
                                                        (v) => v !== opt.value
                                                    )
                                                );
                                            }
                                        }}
                                        className="ml-1 text-muted-foreground hover:text-foreground"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tạo Label mới</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">
                                    Tên Label
                                </label>
                                <Input
                                    value={createName}
                                    onChange={(e) =>
                                        setCreateName(e.target.value)
                                    }
                                    placeholder="Nhập tên label"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Màu sắc
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={createColor}
                                        onChange={(e) =>
                                            setCreateColor(e.target.value)
                                        }
                                        className="h-10 w-20"
                                    />
                                    <Input
                                        value={createColor}
                                        onChange={(e) =>
                                            setCreateColor(e.target.value)
                                        }
                                        placeholder="#FF0000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating || !createName.trim()}
                            >
                                {isCreating ? "Đang tạo..." : "Tạo"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <>
            <SearchableSelect
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                searchPlaceholder="Tìm kiếm label..."
                emptyMessage="Không tìm thấy label."
                renderEmptyComponent={(query) => (
                    <div className="py-6 text-center text-sm">
                        <p className="text-muted-foreground mb-2">
                            Không tìm thấy label.
                        </p>
                        {showCreateOption && (
                            <button
                                type="button"
                                onClick={handleCreateClick}
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <Plus className="h-4 w-4" />
                                Tạo "{query}"
                            </button>
                        )}
                    </div>
                )}
                onSearch={(query) => {
                    setSearchQuery(query);
                }}
            />
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo Label mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">
                                Tên Label
                            </label>
                            <Input
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Nhập tên label"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Màu sắc
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={createColor}
                                    onChange={(e) =>
                                        setCreateColor(e.target.value)
                                    }
                                    className="h-10 w-20"
                                />
                                <Input
                                    value={createColor}
                                    onChange={(e) =>
                                        setCreateColor(e.target.value)
                                    }
                                    placeholder="#FF0000"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateDialog(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !createName.trim()}
                        >
                            {isCreating ? "Đang tạo..." : "Tạo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

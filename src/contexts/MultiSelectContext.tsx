"use client";

import React, { createContext, useContext, useState } from "react";

interface MultiSelectContextType {
    isMultiSelectMode: boolean;
    selectedItems: Set<string>;
    setIsMultiSelectMode: (value: boolean) => void;
    setSelectedItems: (items: Set<string>) => void;
    toggleSelection: (itemId: string) => void;
    clearSelection: () => void;
}

const MultiSelectContext = createContext<MultiSelectContextType | undefined>(
    undefined
);

export function MultiSelectProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const toggleSelection = (itemId: string) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }

            // Bật multi-select mode khi có ít nhất 1 item được chọn
            if (newSet.size > 0) {
                setIsMultiSelectMode(true);
            } else {
                // Tắt multi-select mode khi không có item nào được chọn
                setIsMultiSelectMode(false);
            }

            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
        setIsMultiSelectMode(false);
    };

    return (
        <MultiSelectContext.Provider
            value={{
                isMultiSelectMode,
                selectedItems,
                setIsMultiSelectMode,
                setSelectedItems,
                toggleSelection,
                clearSelection,
            }}
        >
            {children}
        </MultiSelectContext.Provider>
    );
}

export function useMultiSelect() {
    const context = useContext(MultiSelectContext);
    if (context === undefined) {
        throw new Error(
            "useMultiSelect must be used within a MultiSelectProvider"
        );
    }
    return context;
}

import { useState, useCallback } from "react";

export function useDealsEditMode() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingColumn, setEditingColumn] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    const toggleEditMode = useCallback(() => {
        setIsEditMode((prev) => !prev);
        setEditingColumn(null);
        setEditingTitle("");
    }, []);

    const startEditingColumn = useCallback(
        (columnId: string, currentTitle: string) => {
            setEditingColumn(columnId);
            setEditingTitle(currentTitle);
        },
        []
    );

    const cancelEditing = useCallback(() => {
        setEditingColumn(null);
        setEditingTitle("");
    }, []);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.persist && e.persist();
            setEditingTitle(e.target.value);
        },
        []
    );

    return {
        isEditMode,
        setIsEditMode,
        editingColumn,
        setEditingColumn,
        editingTitle,
        setEditingTitle,
        toggleEditMode,
        startEditingColumn,
        cancelEditing,
        handleTitleChange,
    };
}

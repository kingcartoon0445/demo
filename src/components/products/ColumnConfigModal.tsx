"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { GripVertical, X, ExternalLink, Edit2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface ColumnConfig {
    columnKey: string;
    label: string;
    visible: boolean;
    order?: number;
}

interface ColumnConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (columns: ColumnConfig[]) => void;
    currentConfig: ColumnConfig[];
    defaultConfig: ColumnConfig[];
}

export default function ColumnConfigModal({
    isOpen,
    onClose,
    onSave,
    currentConfig,
    defaultConfig,
}: ColumnConfigModalProps) {
    const [selectedColumns, setSelectedColumns] = useState<ColumnConfig[]>([]);
    const [unselectedColumns, setUnselectedColumns] = useState<ColumnConfig[]>(
        []
    );
    const [editingColumn, setEditingColumn] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState("");
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    // Initialize columns when modal opens
    useEffect(() => {
        if (isOpen) {
            const selected = currentConfig.filter((col) => col.visible);
            const unselected = currentConfig.filter((col) => !col.visible);

            // Sort selected columns by order if available
            const sortedSelected = selected.sort((a, b) => {
                const orderA = a.order ?? 999;
                const orderB = b.order ?? 999;
                return orderA - orderB;
            });

            setSelectedColumns(sortedSelected);
            setUnselectedColumns(unselected);
        }
    }, [isOpen, currentConfig]);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;

        if (source.droppableId === destination.droppableId) {
            // Reordering within the same list
            const list =
                source.droppableId === "selected"
                    ? selectedColumns
                    : unselectedColumns;
            const reorderedList = Array.from(list);
            const [removed] = reorderedList.splice(source.index, 1);
            reorderedList.splice(destination.index, 0, removed);

            if (source.droppableId === "selected") {
                setSelectedColumns(reorderedList);
            } else {
                setUnselectedColumns(reorderedList);
            }
        } else {
            // Moving between lists
            const sourceList =
                source.droppableId === "selected"
                    ? selectedColumns
                    : unselectedColumns;
            const destList =
                destination.droppableId === "selected"
                    ? selectedColumns
                    : unselectedColumns;

            const newSourceList = Array.from(sourceList);
            const newDestList = Array.from(destList);

            const [moved] = newSourceList.splice(source.index, 1);

            // Update visible property based on destination
            const updatedMoved = {
                ...moved,
                visible: destination.droppableId === "selected",
            };

            newDestList.splice(destination.index, 0, updatedMoved);

            setSelectedColumns(
                source.droppableId === "selected" ? newSourceList : newDestList
            );
            setUnselectedColumns(
                source.droppableId === "selected" ? newDestList : newSourceList
            );
        }
    };

    const handleAddColumn = (columnKey: string) => {
        const column = unselectedColumns.find(
            (col) => col.columnKey === columnKey
        );
        if (column) {
            setUnselectedColumns(
                unselectedColumns.filter((col) => col.columnKey !== columnKey)
            );
            setSelectedColumns([
                ...selectedColumns,
                { ...column, visible: true },
            ]);
        }
    };

    const handleSetDefault = (columnKey: string) => {
        const defaultColumn = defaultConfig.find(
            (col) => col.columnKey === columnKey
        );
        if (defaultColumn) {
            setSelectedColumns(
                selectedColumns.map((col) =>
                    col.columnKey === columnKey
                        ? { ...col, label: defaultColumn.label }
                        : col
                )
            );
        }
    };

    const handleEditLabel = (columnKey: string, currentLabel: string) => {
        setEditingColumn(columnKey);
        setEditingLabel(currentLabel);
        setOpenPopoverId(columnKey);
    };

    const handleLabelChange = useCallback((value: string) => {
        setEditingLabel(value);
    }, []);

    const handleSaveLabel = () => {
        if (editingColumn && editingLabel.trim()) {
            // Update in selected columns
            setSelectedColumns(
                selectedColumns.map((col) =>
                    col.columnKey === editingColumn
                        ? { ...col, label: editingLabel.trim() }
                        : col
                )
            );

            // Update in unselected columns
            setUnselectedColumns(
                unselectedColumns.map((col) =>
                    col.columnKey === editingColumn
                        ? { ...col, label: editingLabel.trim() }
                        : col
                )
            );
        }
        setEditingColumn(null);
        setEditingLabel("");
        setOpenPopoverId(null);
    };

    const handleCancelEdit = () => {
        setEditingColumn(null);
        setEditingLabel("");
        setOpenPopoverId(null);
    };

    const handleSave = () => {
        // Add order to selected columns based on their position
        const orderedSelectedColumns = selectedColumns.map((col, index) => ({
            ...col,
            order: index,
        }));

        const allColumns = [...orderedSelectedColumns, ...unselectedColumns];
        onSave(allColumns);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Tuỳ chỉnh hiển thị cột</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col h-full">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                            {/* Selected Columns */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium">
                                        Đã chọn ({selectedColumns.length})
                                    </h3>
                                </div>
                                <Droppable droppableId="selected">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-2"
                                        >
                                            {selectedColumns.map(
                                                (column, index) => (
                                                    <Draggable
                                                        key={column.columnKey}
                                                        draggableId={
                                                            column.columnKey
                                                        }
                                                        index={index}
                                                    >
                                                        {(
                                                            provided,
                                                            snapshot
                                                        ) => (
                                                            <div
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.draggableProps}
                                                                className={`flex items-center justify-between p-2 rounded border ${
                                                                    snapshot.isDragging
                                                                        ? "bg-gray-50"
                                                                        : "bg-white"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="cursor-grab"
                                                                    >
                                                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                    <span className="text-sm">
                                                                        {
                                                                            column.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <Popover
                                                                    open={
                                                                        openPopoverId ===
                                                                        column.columnKey
                                                                    }
                                                                    onOpenChange={(
                                                                        open
                                                                    ) => {
                                                                        if (
                                                                            !open
                                                                        ) {
                                                                            setOpenPopoverId(
                                                                                null
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <PopoverTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-6 px-2 text-xs"
                                                                            onClick={() =>
                                                                                handleEditLabel(
                                                                                    column.columnKey,
                                                                                    column.label
                                                                                )
                                                                            }
                                                                        >
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-80">
                                                                        <div className="space-y-4">
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="label">
                                                                                    Tên
                                                                                    cột
                                                                                </Label>
                                                                                <Input
                                                                                    id="label"
                                                                                    value={
                                                                                        editingLabel
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        handleLabelChange(
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    placeholder="Nhập tên cột..."
                                                                                    onKeyDown={(
                                                                                        e
                                                                                    ) => {
                                                                                        if (
                                                                                            e.key ===
                                                                                            "Enter"
                                                                                        ) {
                                                                                            handleSaveLabel();
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={
                                                                                        handleSaveLabel
                                                                                    }
                                                                                    className="flex-1"
                                                                                >
                                                                                    Lưu
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={
                                                                                        handleCancelEdit
                                                                                    }
                                                                                    className="flex-1"
                                                                                >
                                                                                    Hủy
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Unselected Columns */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium">Chưa chọn</h3>
                                </div>
                                <Droppable droppableId="unselected">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-2"
                                        >
                                            {unselectedColumns.map(
                                                (column, index) => (
                                                    <Draggable
                                                        key={column.columnKey}
                                                        draggableId={
                                                            column.columnKey
                                                        }
                                                        index={index}
                                                    >
                                                        {(
                                                            provided,
                                                            snapshot
                                                        ) => (
                                                            <div
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.draggableProps}
                                                                className={`flex items-center justify-between p-2 rounded border ${
                                                                    snapshot.isDragging
                                                                        ? "bg-gray-50"
                                                                        : "bg-white"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="cursor-grab"
                                                                    >
                                                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                    <span className="text-sm">
                                                                        {
                                                                            column.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Popover
                                                                        open={
                                                                            openPopoverId ===
                                                                            column.columnKey
                                                                        }
                                                                        onOpenChange={(
                                                                            open
                                                                        ) => {
                                                                            if (
                                                                                !open
                                                                            ) {
                                                                                setOpenPopoverId(
                                                                                    null
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <PopoverTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-6 px-2 text-xs"
                                                                                onClick={() =>
                                                                                    handleEditLabel(
                                                                                        column.columnKey,
                                                                                        column.label
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Edit2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-80">
                                                                            <div className="space-y-4">
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="label">
                                                                                        Tên
                                                                                        cột
                                                                                    </Label>
                                                                                    <Input
                                                                                        id="label"
                                                                                        value={
                                                                                            editingLabel
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            handleLabelChange(
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        placeholder="Nhập tên cột..."
                                                                                        onKeyDown={(
                                                                                            e
                                                                                        ) => {
                                                                                            if (
                                                                                                e.key ===
                                                                                                "Enter"
                                                                                            ) {
                                                                                                handleSaveLabel();
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={
                                                                                            handleSaveLabel
                                                                                        }
                                                                                        className="flex-1"
                                                                                    >
                                                                                        Lưu
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={
                                                                                            handleCancelEdit
                                                                                        }
                                                                                        className="flex-1"
                                                                                    >
                                                                                        Hủy
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleAddColumn(
                                                                                column.columnKey
                                                                            )
                                                                        }
                                                                        className="h-6 px-2 text-xs"
                                                                    >
                                                                        Thêm
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </div>
                    </DragDropContext>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={onClose}>
                            Huỷ
                        </Button>
                        <Button onClick={handleSave}>Lưu</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

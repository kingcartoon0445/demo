"use client";

import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DraggingStyle,
    NotDraggingStyle,
} from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    useCustomSidebarMenu,
    useUpdateCustomSidebarMenu,
} from "@/hooks/useCustomSideBarMenu";
import { SidebarMenuItem } from "@/api/customSidebarMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Glass } from "@/components/Glass";

export default function SidebarConfigPage() {
    const params = useParams();
    const orgId = (params?.orgId as string) || "";
    const { language, t } = useLanguage();

    const { data, isLoading, isError } = useCustomSidebarMenu(orgId);
    const updateMutation = useUpdateCustomSidebarMenu(orgId);

    const [items, setItems] = useState<SidebarMenuItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempDisplayNameVi, setTempDisplayNameVi] = useState<string>("");
    const [tempDisplayNameEn, setTempDisplayNameEn] = useState<string>("");

    useEffect(() => {
        if (data?.success && Array.isArray(data.data)) {
            const sorted: SidebarMenuItem[] = [...data.data].sort(
                (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0),
            );
            setItems(sorted);
        }
    }, [data]);

    const getItemLabel = (item: SidebarMenuItem) => {
        if (language === "vi")
            return item.displayNameVi || item.displayName || item.name;
        return item.displayNameEn || item.displayName || item.name;
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result;
        if (!destination) return;
        if (destination.index === source.index) return;

        setItems((prev) => {
            const updated = [...prev];
            const [removed] = updated.splice(source.index, 1);
            updated.splice(destination.index, 0, removed);
            // Reassign orderIndex locally
            return updated.map((it, idx) => ({ ...it, orderIndex: idx + 1 }));
        });
    };

    const beginEdit = (item: SidebarMenuItem) => {
        setEditingId(item.id);
        setTempDisplayNameVi(item.displayNameVi || "");
        setTempDisplayNameEn(item.displayNameEn || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTempDisplayNameVi("");
        setTempDisplayNameEn("");
    };

    const saveEdit = (id: string) => {
        setItems((prev) =>
            prev.map((it) =>
                it.id === id
                    ? {
                          ...it,
                          displayNameVi: tempDisplayNameVi,
                          displayNameEn: tempDisplayNameEn,
                      }
                    : it,
            ),
        );
        cancelEdit();
    };

    const handleSave = () => {
        const payload = items.map((it, idx) => ({
            id: it.id,
            displayNameEn: it.displayNameEn || "",
            displayNameVi: it.displayNameVi || "",
            orderIndex: it.orderIndex ?? idx + 1,
        }));
        updateMutation.mutate(payload);
    };

    const handleCancel = () => {
        if (data?.success && Array.isArray(data.data)) {
            const sorted: SidebarMenuItem[] = [...data.data].sort(
                (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0),
            );
            setItems(sorted);
        }
        setEditingId(null);
        setTempDisplayNameVi("");
        setTempDisplayNameEn("");
    };

    return (
        <TooltipProvider>
            <div className="h-full">
                <Glass
                    intensity="high"
                    className="flex flex-col p-6 h-full rounded-xl overflow-hidden"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="text-[18px] font-medium text-gray-800">
                            {t("common.sidebarConfig")}
                        </div>
                        <Tooltip
                            content={
                                <div className="text-sm space-y-1 max-w-xs">
                                    <div className="font-medium">
                                        Hướng dẫn sử dụng:
                                    </div>
                                    <div>
                                        • Kéo thả các mục để sắp xếp thứ tự
                                    </div>
                                    <div>
                                        • Click vào tên mục để chỉnh sửa nhãn
                                    </div>
                                    <div>• Nhấn "Lưu" để áp dụng thay đổi</div>
                                    <div>• Nhấn "Hủy" để hoàn tác</div>
                                </div>
                            }
                            side="bottom"
                        >
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                <Info size={16} />
                            </button>
                        </Tooltip>
                    </div>

                    {isLoading && (
                        <div className="text-sm text-gray-500">
                            {t("common.loading")}
                        </div>
                    )}
                    {isError && (
                        <div className="text-sm text-red-500">
                            {t("common.loadError")}
                        </div>
                    )}

                    {!isLoading && !isError && (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="sidebarItems">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="space-y-2 overflow-y-auto pr-2 -mr-2 flex-1 custom-scrollbar"
                                    >
                                        {items.map((item, index) => (
                                            <Draggable
                                                key={item.id}
                                                draggableId={item.id}
                                                index={index}
                                            >
                                                {(dragProvided, snapshot) => {
                                                    const child = (
                                                        <div
                                                            ref={
                                                                dragProvided.innerRef
                                                            }
                                                            {...dragProvided.draggableProps}
                                                            style={{
                                                                ...dragProvided
                                                                    .draggableProps
                                                                    .style,
                                                            }}
                                                        >
                                                            <div
                                                                className={`flex items-center justify-between rounded-lg p-3 border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md ${
                                                                    snapshot.isDragging
                                                                        ? "ring-2 ring-sidebar-primary shadow-2xl relative z-50"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500 cursor-grab"
                                                                        {...dragProvided.dragHandleProps}
                                                                    >
                                                                        ≡
                                                                    </div>
                                                                    <div className="text-sm text-gray-800">
                                                                        {editingId ===
                                                                        item.id ? (
                                                                            <div className="flex flex-col gap-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-sm">
                                                                                        🇻🇳
                                                                                    </span>
                                                                                    <input
                                                                                        className="border rounded px-2 py-1 text-sm flex-1"
                                                                                        placeholder="Tiếng Việt"
                                                                                        value={
                                                                                            tempDisplayNameVi
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            setTempDisplayNameVi(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-sm">
                                                                                        🇺🇸
                                                                                    </span>
                                                                                    <input
                                                                                        className="border rounded px-2 py-1 text-sm flex-1"
                                                                                        placeholder="English"
                                                                                        value={
                                                                                            tempDisplayNameEn
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            setTempDisplayNameEn(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center gap-2 pt-1">
                                                                                    <button
                                                                                        className="px-3 py-1 bg-sidebar-primary text-white rounded"
                                                                                        onClick={() =>
                                                                                            saveEdit(
                                                                                                item.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {t(
                                                                                            "common.save",
                                                                                        )}
                                                                                    </button>
                                                                                    <button
                                                                                        className="px-3 py-1 border rounded"
                                                                                        onClick={
                                                                                            cancelEdit
                                                                                        }
                                                                                    >
                                                                                        {t(
                                                                                            "common.cancel",
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                className="text-left"
                                                                                onClick={() =>
                                                                                    beginEdit(
                                                                                        item,
                                                                                    )
                                                                                }
                                                                            >
                                                                                {getItemLabel(
                                                                                    item,
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    #
                                                                    {item.orderIndex ??
                                                                        index +
                                                                            1}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );

                                                    if (
                                                        snapshot.isDragging &&
                                                        typeof document !==
                                                            "undefined"
                                                    ) {
                                                        return createPortal(
                                                            child,
                                                            document.body,
                                                        );
                                                    }
                                                    return child;
                                                }}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}

                    {/* Save and Cancel buttons */}
                    <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-white/20">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={updateMutation.isPending}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending
                                ? t("common.saving")
                                : t("common.save")}
                        </Button>
                    </div>
                </Glass>
            </div>
        </TooltipProvider>
    );
}

import { Deal, PipelineColumn } from "@/app/org/[orgId]/deals/page";
import { cn } from "@/lib/utils";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Check, GripVertical, Loader2, Trash2, X, Palette } from "lucide-react";
import InfiniteScroll from "../ui/infinite-scroll";
import DealCard from "./DealCard";
import { useLanguage } from "@/contexts/LanguageContext";
import Loading from "../common/Loading";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { colorOptions } from "@/data/colorOptions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function KanbanColumn({
    column,
    index,
    isEditMode,
    editingColumn,
    editingTitle,
    handleTitleChange,
    saveColumnTitle,
    cancelEditing,
    startEditingColumn,
    onColorChange,
    deleteColumn,
    handleDealClick,
    loadMoreDeals,
    paginationState,
    pipeline,
    inputRef,
}: {
    column: PipelineColumn;
    index: number;
    isEditMode: boolean;
    editingColumn: string | null;
    editingTitle: string;
    handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveColumnTitle: (stageId: string) => void;
    cancelEditing: () => void;
    startEditingColumn: (columnId: string, currentTitle: string) => void;
    onColorChange: (stageId: string, color: string) => void;
    deleteColumn: (columnId: string) => void;
    handleDealClick: (deal: Deal) => void;
    loadMoreDeals: (columnId: string) => void;
    paginationState: Record<
        string,
        {
            offset: number;
            hasMore: boolean;
            isLoading: boolean;
            totalItems: number;
            loadedItems: number;
            initialLoading?: boolean; // Thêm trạng thái loading ban đầu
        }
    >;
    pipeline?: PipelineColumn[];
    inputRef?: React.RefObject<HTMLInputElement>;
}) {
    const { t } = useLanguage();
    return (
        <Draggable
            draggableId={column.id}
            index={index}
            isDragDisabled={!isEditMode}
            key={column.id}
        >
            {(providedDraggable, snapshotDraggable) => (
                <div
                    ref={providedDraggable.innerRef}
                    {...providedDraggable.draggableProps}
                    className={cn(
                        "flex flex-col rounded-lg p-2 w-[320px] flex-shrink-0 transition-all duration-200 border rounded-lg max-h-full",
                        snapshotDraggable.isDragging
                            ? "rotate-1 scale-105"
                            : "",
                        isEditMode ? "ring-2 ring-blue-300 bg-blue-50" : ""
                    )}
                    style={{
                        ...(providedDraggable.draggableProps.style || {}),
                        backgroundColor: isEditMode ? "#3B82F61A" : "#F4F2FA",
                        borderColor: isEditMode ? "#3B82F61A" : "#F4F2FA",
                    }}
                >
                    <div className="flex justify-between mb-4 flex-col">
                        <div className="flex items-center gap-2 flex-1">
                            {isEditMode && (
                                <div
                                    {...providedDraggable.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-blue-600"
                                >
                                    <GripVertical
                                        size={18}
                                        className="text-blue-500"
                                    />
                                </div>
                            )}

                            {editingColumn === column.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        ref={inputRef}
                                        defaultValue={editingTitle}
                                        // Không cần onChange để tránh re-render
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                saveColumnTitle(column.id);
                                            }
                                            if (e.key === "Escape")
                                                cancelEditing();
                                        }}
                                        className="flex-1 px-2 py-1 text-sm font-semibold border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() =>
                                            saveColumnTitle(column.id)
                                        }
                                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <span
                                    className={cn(
                                        "font-semibold text-gray-800 flex-1 text-sm",
                                        isEditMode
                                            ? "cursor-pointer hover:bg-blue-100 px-2 py-1 rounded border-2 border-dashed border-blue-300"
                                            : ""
                                    )}
                                    onClick={() =>
                                        isEditMode &&
                                        startEditingColumn(
                                            column.id,
                                            column.title
                                        )
                                    }
                                    title={
                                        isEditMode
                                            ? t("deal.clickToEditName")
                                            : ""
                                    }
                                >
                                    {column.title}
                                </span>
                            )}
                        </div>

                        <div
                            className={`flex items-center gap-2 mt-2 ${
                                isEditMode ? "justify-end" : ""
                            }`}
                        >
                            {/* {isEditMode && (
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={column.color || ""}
                                        onValueChange={(val) =>
                                            onColorChange(column.id, val)
                                        }
                                    >
                                        <SelectTrigger
                                            size="sm"
                                            className="text-xs min-w-[140px]"
                                        >
                                            <SelectValue
                                                placeholder={
                                                    t("deal.selectColor") as any
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colorOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded inline-block"
                                                        style={{
                                                            backgroundColor:
                                                                opt.value,
                                                            border: "1px solid rgba(0,0,0,0.1)",
                                                        }}
                                                    />
                                                    <span>{opt.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )} */}
                            {!isEditMode && (
                                <div className="flex flex-col w-full">
                                    <div className="text-sm font-bold text-green-600">
                                        {column.budget}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {paginationState[column.id]
                                            ?.loadedItems ||
                                            column.deals.length}{" "}
                                        /{" "}
                                        {paginationState[column.id]
                                            ?.totalItems ||
                                            column.totalDeals ||
                                            column.deals.length}{" "}
                                        {t("deal.transactions")}
                                    </div>
                                </div>
                            )}

                            {isEditMode && (
                                <TooltipProvider>
                                    <Tooltip content={t("deal.deleteStage")}>
                                        <button
                                            onClick={() =>
                                                deleteColumn(column.id)
                                            }
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                            disabled={
                                                pipeline?.length
                                                    ? pipeline.length <= 1
                                                    : false
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>

                    {!isEditMode && (
                        <>
                            <div className="overflow-y-auto max-h-[calc(100vh-220px)] kanban-scroll">
                                <Droppable droppableId={column.id} type="DEAL">
                                    {(providedDroppable, snapshotDroppable) => (
                                        <div
                                            {...providedDroppable.droppableProps}
                                            ref={providedDroppable.innerRef}
                                            className={cn(
                                                "space-y-3 min-h-[500px] rounded-lg transition-colors",
                                                snapshotDroppable.isDraggingOver
                                                    ? "bg-blue-50 ring-2 ring-blue-200"
                                                    : ""
                                            )}
                                        >
                                            {paginationState[column.id]
                                                ?.initialLoading ? (
                                                // Hiển thị loading state cho stage đang tải ban đầu
                                                <Loading />
                                            ) : column.deals.length > 0 ? (
                                                <InfiniteScroll
                                                    hasMore={
                                                        paginationState[
                                                            column.id
                                                        ]?.hasMore || false
                                                    }
                                                    isLoading={
                                                        paginationState[
                                                            column.id
                                                        ]?.isLoading || false
                                                    }
                                                    reverse={false}
                                                    threshold={0.5}
                                                    rootMargin="50px"
                                                    next={() =>
                                                        loadMoreDeals(column.id)
                                                    }
                                                >
                                                    {column.deals.map(
                                                        (deal, dealIndex) => (
                                                            <Draggable
                                                                key={deal.id}
                                                                draggableId={
                                                                    deal.id
                                                                }
                                                                index={
                                                                    dealIndex
                                                                }
                                                            >
                                                                {(
                                                                    providedDeal,
                                                                    snapshotDeal
                                                                ) => (
                                                                    <div
                                                                        ref={
                                                                            providedDeal.innerRef
                                                                        }
                                                                        {...providedDeal.draggableProps}
                                                                        {...providedDeal.dragHandleProps}
                                                                        className={cn(
                                                                            "transition-transform",
                                                                            snapshotDeal.isDragging
                                                                                ? "rotate-2 scale-105"
                                                                                : ""
                                                                        )}
                                                                    >
                                                                        <DealCard
                                                                            avatar={
                                                                                deal.avatar ||
                                                                                ""
                                                                            }
                                                                            {...deal}
                                                                            onClick={
                                                                                handleDealClick
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        )
                                                    )}
                                                    {paginationState[column.id]
                                                        ?.isLoading && (
                                                        <div className="py-3 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 my-2">
                                                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                                        </div>
                                                    )}

                                                    {paginationState[column.id]
                                                        ?.hasMore &&
                                                        !paginationState[
                                                            column.id
                                                        ]?.isLoading && (
                                                            <div className="py-3 flex flex-col items-center justify-center">
                                                                <div className="text-xs text-gray-500 mb-2">
                                                                    {t(
                                                                        "deal.loaded"
                                                                    )}
                                                                    :{" "}
                                                                    {paginationState[
                                                                        column
                                                                            .id
                                                                    ]
                                                                        ?.loadedItems ||
                                                                        0}{" "}
                                                                    /{" "}
                                                                    {paginationState[
                                                                        column
                                                                            .id
                                                                    ]
                                                                        ?.totalItems ||
                                                                        0}{" "}
                                                                    {t(
                                                                        "deal.transactions"
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </InfiniteScroll>
                                            ) : (
                                                <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                                    {t("deal.dropDealsHere")}
                                                </div>
                                            )}
                                            {providedDroppable.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </>
                    )}

                    {isEditMode && (
                        <div className="h-32 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-blue-600 text-sm bg-blue-50">
                            <GripVertical size={24} className="text-blue-400" />
                            <span className="ml-2 font-medium">
                                {t("deal.dragToArrangeStages")}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
}

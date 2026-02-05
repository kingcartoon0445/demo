"use client";

import { useBuilderStore } from "@/store/useBuilderStore";
import { Block, BLOCK_TYPES } from "@/lib/schema";
import { generatePreviewHTML } from "@/lib/renderer";
import {
    Type,
    Image,
    MousePointer,
    Minus,
    Square,
    Package,
    Columns,
    Layout,
} from "lucide-react";

const BLOCK_ICONS = {
    text: Type,
    image: Image,
    button: MousePointer,
    divider: Minus,
    spacer: Square,
    container: Package,
    column: Columns,
    row: Layout,
};
import { Button } from "@/components/ui/button";
import {
    Copy,
    Trash2,
    MoreVertical,
    GripVertical,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

// Container Component with Droppable
function ContainerBlock({
    block,
    level = 0,
    index,
}: BlockComponentProps & { index: number }) {
    const {
        selectedBlockId,
        selectBlock,
        deleteBlock,
        duplicateBlock,
        moveBlock,
        template,
    } = useBuilderStore();
    const [isHovered, setIsHovered] = useState(false);

    const isSelected = selectedBlockId === block.id;
    const hasChildren = block.children && block.children.length > 0;

    // removed noisy logs to reduce re-render noise during drag

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectBlock(block.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteBlock(block.id);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateBlock(block.id);
    };

    const handleMoveUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (index > 0) {
            moveBlock(block.id, null, index - 1);
        }
    };

    const handleMoveDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (index < template.blocks.length - 1) {
            moveBlock(block.id, null, index + 1);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isSelected) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "d":
                        e.preventDefault();
                        duplicateBlock(block.id);
                        break;
                    case "Delete":
                    case "Backspace":
                        e.preventDefault();
                        deleteBlock(block.id);
                        break;
                }
            }

            if (e.altKey) {
                switch (e.key) {
                    case "ArrowUp":
                        e.preventDefault();
                        if (index > 0) {
                            moveBlock(block.id, null, index - 1);
                        }
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        if (index < template.blocks.length - 1) {
                            moveBlock(block.id, null, index + 1);
                        }
                        break;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        isSelected,
        block.id,
        index,
        duplicateBlock,
        deleteBlock,
        moveBlock,
        template.blocks.length,
    ]);

    return (
        <Draggable draggableId={block.id} index={index}>
            {(draggableProvided, draggableSnapshot) => (
                <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    className={`relative group ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                    } ${isHovered ? "ring-1 ring-gray-300" : ""} ${
                        draggableSnapshot.isDragging ? "opacity-50" : ""
                    }`}
                    style={{
                        marginLeft: 0,
                        minHeight: "50px",
                        boxSizing: "border-box",
                        minWidth: 0,
                        ...(typeof (block.styles as any)?.width === "string" &&
                        (block.styles as any)?.width.trim().endsWith("%")
                            ? {
                                  width: "100%",
                                  flex: `0 0 ${(block.styles as any).width}`,
                                  flexBasis: (block.styles as any).width,
                              }
                            : {
                                  width: "100%",
                                  flex: "0 0 100%",
                                  flexBasis: "100%",
                              }),
                        ...draggableProvided.draggableProps.style,
                    }}
                    onClick={handleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Block Controls */}
                    {(isSelected || isHovered) && (
                        <div className="absolute -left-16 top-0 flex flex-col space-y-1 z-20">
                            {/* Move Up */}
                            {index > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                                    onClick={handleMoveUp}
                                    title="Move Up (Alt+↑)"
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </Button>
                            )}

                            {/* Move Down */}
                            {index < template.blocks.length - 1 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                                    onClick={handleMoveDown}
                                    title="Move Down (Alt+↓)"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            )}

                            {/* Duplicate */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                                onClick={handleDuplicate}
                                title="Duplicate (Ctrl+D)"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>

                            {/* Delete */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 p-0 bg-white shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleDelete}
                                title="Delete (Ctrl+Delete)"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    )}

                    {/* Drag Handle - Always visible for container blocks */}
                    <div
                        className="absolute -left-6 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                        {...draggableProvided.dragHandleProps}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="w-6 h-6 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center hover:bg-gray-50">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Container Content with Droppable */}
                    <Droppable
                        droppableId={`container-${block.id}`}
                        direction="vertical"
                    >
                        {(droppableProvided, droppableSnapshot) => {
                            return (
                                <div
                                    style={{
                                        ...(block.styles as any),
                                        width: "100%",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap:
                                            (block.styles as any)?.gap ?? "0px",
                                        // mở rộng vùng bắt thả khi rỗng hoặc đang kéo qua
                                        minHeight: hasChildren
                                            ? undefined
                                            : 160,
                                        padding:
                                            droppableSnapshot.isDraggingOver ||
                                            !hasChildren
                                                ? 16
                                                : 0,
                                    }}
                                    ref={droppableProvided.innerRef}
                                    {...droppableProvided.droppableProps}
                                    className={`!w-full !max-w-none !m-0 border-2 border-dashed ${
                                        block.type === "column"
                                            ? "border-gray-100"
                                            : "border-gray-200"
                                    } rounded-lg relative z-0 ${
                                        droppableSnapshot.isDraggingOver
                                            ? "bg-blue-50 border-blue-300"
                                            : "hover:border-gray-300"
                                    }`}
                                >
                                    {hasChildren ? (
                                        <div
                                            className={`${
                                                (block.styles as any)
                                                    ?.display === "flex" ||
                                                block.type === "row"
                                                    ? "flex"
                                                    : "block"
                                            }`}
                                            style={
                                                (block.styles as any)
                                                    ?.display === "flex" ||
                                                block.type === "row"
                                                    ? {
                                                          flexWrap:
                                                              "wrap" as const,
                                                          width: "100%",
                                                          boxSizing:
                                                              "border-box",
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {block.children!.map(
                                                (child, childIndex) => (
                                                    <SortableBlockComponent
                                                        key={child.id}
                                                        block={child}
                                                        level={level + 1}
                                                        index={childIndex}
                                                    />
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 text-sm py-6">
                                            <div className="text-lg mb-1">
                                                {block.type === "column"
                                                    ? "🧩 Column"
                                                    : block.type === "row"
                                                    ? "📐 Row"
                                                    : "📦 Container"}
                                            </div>
                                            <div>
                                                Drop blocks here to add content
                                            </div>
                                        </div>
                                    )}
                                    {droppableProvided.placeholder}
                                </div>
                            );
                        }}
                    </Droppable>
                </div>
            )}
        </Draggable>
    );
}

interface BlockComponentProps {
    block: Block;
    level?: number;
}

function SortableBlockComponent({
    block,
    level = 0,
    index,
}: BlockComponentProps & { index: number }) {
    const {
        selectedBlockId,
        selectBlock,
        deleteBlock,
        duplicateBlock,
        moveBlock,
        template,
    } = useBuilderStore();
    const [isHovered, setIsHovered] = useState(false);

    const isSelected = selectedBlockId === block.id;
    const hasChildren = block.children && block.children.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectBlock(block.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteBlock(block.id);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateBlock(block.id);
    };

    const handleMoveUp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (index > 0) {
            moveBlock(block.id, null, index - 1);
        }
    };

    const handleMoveDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (index < template.blocks.length - 1) {
            moveBlock(block.id, null, index + 1);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isSelected) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "d":
                        e.preventDefault();
                        duplicateBlock(block.id);
                        break;
                    case "Delete":
                    case "Backspace":
                        e.preventDefault();
                        deleteBlock(block.id);
                        break;
                }
            }

            if (e.altKey) {
                switch (e.key) {
                    case "ArrowUp":
                        e.preventDefault();
                        if (index > 0) {
                            moveBlock(block.id, null, index - 1);
                        }
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        if (index < template.blocks.length - 1) {
                            moveBlock(block.id, null, index + 1);
                        }
                        break;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        isSelected,
        block.id,
        index,
        duplicateBlock,
        deleteBlock,
        moveBlock,
        template.blocks.length,
    ]);

    const renderBlockContent = () => {
        const { type, content, styles, src, alt, href } = block;

        const styleString = styles
            ? Object.entries(styles)
                  .map(
                      ([key, value]) =>
                          `${key
                              .replace(/([A-Z])/g, "-$1")
                              .toLowerCase()}: ${value}`
                  )
                  .join("; ")
            : "";

        switch (type) {
            case "text": {
                const editorRef = useRef<HTMLDivElement | null>(null);

                useEffect(() => {
                    const editor = editorRef.current;
                    if (!editor) return;
                    const current = editor.innerHTML;
                    const next = content || "Your text here";
                    if (current !== next) {
                        editor.innerHTML = next;
                    }
                }, [content]);

                return (
                    <div
                        ref={editorRef}
                        style={{
                            ...styles,
                            width: "100%",
                            boxSizing: "border-box",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        data-block-id={block.id}
                        onInput={(e) => {
                            const html = (e.currentTarget as HTMLDivElement)
                                .innerHTML;
                            if (html !== content) {
                                useBuilderStore
                                    .getState()
                                    .updateBlock(block.id, {
                                        content: html,
                                    });
                            }
                        }}
                        onBlur={(e) => {
                            const html = (e.currentTarget as HTMLDivElement)
                                .innerHTML;
                            if (html !== content) {
                                useBuilderStore
                                    .getState()
                                    .updateBlock(block.id, {
                                        content: html,
                                    });
                            }
                        }}
                    />
                );
            }

            case "image":
                return (
                    <div style={{ textAlign: "center" }}>
                        {href ? (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src={src || "/placeholder-image.svg"}
                                    alt={alt || "Image"}
                                    style={{
                                        ...styles,
                                        maxWidth: "100%",
                                        height: "auto",
                                    }}
                                />
                            </a>
                        ) : (
                            <img
                                src={src || "/placeholder-image.svg"}
                                alt={alt || "Image"}
                                style={{
                                    ...styles,
                                    maxWidth: "100%",
                                    height: "auto",
                                }}
                            />
                        )}
                    </div>
                );

            case "button": {
                const { width, ...buttonStyles } = styles || {};
                return (
                    <div
                        style={{
                            textAlign: styles?.textAlign || "center",
                            width: width as any,
                        }}
                    >
                        <a
                            href={href || "#"}
                            style={{
                                ...buttonStyles,
                                display: "inline-block",
                                textDecoration: "none",
                                padding: "12px 24px",
                                borderRadius: "4px",
                            }}
                        >
                            {content || "Button"}
                        </a>
                    </div>
                );
            }

            case "divider":
                return (
                    <hr
                        style={{
                            ...styles,
                            border: "none",
                            borderTop: "1px solid #e0e0e0",
                            margin: "20px 0",
                        }}
                    />
                );

            case "spacer":
                return <div style={styles} />;

            case "container":
            case "row":
            case "column":
                return (
                    <ContainerBlock block={block} level={level} index={index} />
                );

            default:
                return <div style={styles}>{content}</div>;
        }
    };

    return (
        <Draggable draggableId={block.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`relative group ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                    } ${isHovered ? "ring-1 ring-gray-300" : ""} ${
                        snapshot.isDragging ? "opacity-50" : ""
                    }`}
                    style={{
                        marginLeft: 0,
                        minHeight: block.type === "spacer" ? "20px" : "auto",
                        boxSizing: "border-box",
                        minWidth: 0,
                        // width/flex rules for wrapping layout
                        ...(typeof (block.styles as any)?.width === "string" &&
                        (block.styles as any)?.width.trim().endsWith("%")
                            ? {
                                  width: (block.styles as any).width,
                                  flex: `0 0 ${(block.styles as any).width}`,
                                  flexBasis: (block.styles as any).width,
                              }
                            : {
                                  width: "100%",
                                  flex: "0 0 100%",
                                  flexBasis: "100%",
                              }),
                        ...provided.draggableProps.style,
                    }}
                    onClick={handleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Block Controls */}
                    {(isSelected || isHovered) && (
                        <div className="absolute -left-16 top-0 flex flex-col space-y-1 z-20">
                            {/* Move Up */}
                            {index > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                                    onClick={handleMoveUp}
                                    title="Move Up (Alt+↑)"
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </Button>
                            )}

                            {/* Move Down */}
                            {index < template.blocks.length - 1 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                                    onClick={handleMoveDown}
                                    title="Move Down (Alt+↓)"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            )}

                            {/* Duplicate */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                                onClick={handleDuplicate}
                                title="Duplicate (Ctrl+D)"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>

                            {/* Delete */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-6 h-6 p-0 bg-white shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleDelete}
                                title="Delete (Ctrl+Delete)"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    )}

                    {/* Drag Handle - Always visible */}
                    <div
                        className="absolute -left-6 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                        {...provided.dragHandleProps}
                    >
                        <div className="w-6 h-6 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center hover:bg-gray-50">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Block Content */}
                    <div className="min-h-[20px] w-full">
                        {renderBlockContent()}
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default function Canvas() {
    const { template, isPreviewMode, isMobilePreview, selectBlock } =
        useBuilderStore();

    const handleCanvasClick = () => {
        selectBlock(null);
    };

    if (isPreviewMode) {
        return (
            <div className="flex-1 bg-gray-100 p-8 overflow-auto">
                <div
                    className={`mx-auto ${
                        isMobilePreview ? "max-w-sm" : "max-w-2xl"
                    }`}
                >
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="bg-gray-800 text-white p-4">
                            <h2 className="text-lg font-semibold">
                                {template.subject}
                            </h2>
                        </div>
                        <div
                            className="p-6"
                            style={template.globalStyles}
                            dangerouslySetInnerHTML={{
                                __html: generatePreviewHTML(template),
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex-1 bg-gray-50 p-8 overflow-auto"
            onClick={handleCanvasClick}
        >
            <div className="max-w-2xl mx-auto">
                <Droppable droppableId="canvas" direction="vertical">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[200px] pb-24 ${
                                template.blocks.length === 0
                                    ? "border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                                    : "flex flex-wrap gap-y-4 items-start"
                            } ${
                                snapshot.isDraggingOver
                                    ? "bg-blue-50 border-blue-400"
                                    : ""
                            }`}
                        >
                            {template.blocks.length === 0 ? (
                                <div className="text-center text-gray-500">
                                    <div className="text-lg mb-2">
                                        Drop blocks here
                                    </div>
                                    <div className="text-sm">
                                        or click blocks in the sidebar
                                    </div>
                                </div>
                            ) : (
                                template.blocks.map((block, index) => {
                                    if (
                                        block.type === "container" ||
                                        block.type === "row" ||
                                        block.type === "column"
                                    ) {
                                        return (
                                            <ContainerBlock
                                                key={block.id}
                                                block={block}
                                                index={index}
                                            />
                                        );
                                    }
                                    return (
                                        <SortableBlockComponent
                                            key={block.id}
                                            block={block}
                                            index={index}
                                        />
                                    );
                                })
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
}

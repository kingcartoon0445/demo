import { useBusinessProcessTemplates } from "@/hooks/useBusinessProcess";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Loading from "../common/Loading";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

export default function BusinessProcessTemplateSelector({
    onSelect,
    selectedTemplate,
    onStageSelect,
    selectedStageIndex,
}: {
    onSelect: (template: string) => void;
    selectedTemplate: string;
    onStageSelect?: (stageIndex: number, stageName: string) => void;
    selectedStageIndex?: number;
}) {
    const { data: businessProcessTemplates, isLoading } =
        useBusinessProcessTemplates();
    const templates = useMemo(() => {
        return businessProcessTemplates?.data || [];
    }, [businessProcessTemplates]);

    // Lấy template đã chọn để hiển thị stages
    const selectedTemplateData = useMemo(() => {
        return templates.find((template) => template.id === selectedTemplate);
    }, [templates, selectedTemplate]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const slider = scrollContainerRef.current;
        if (slider) {
            setStartX(e.pageX - slider.offsetLeft);
            setScrollLeft(slider.scrollLeft);
            slider.style.cursor = "grabbing";
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        const slider = scrollContainerRef.current;
        if (slider) {
            slider.style.cursor = "grab";
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
        const slider = scrollContainerRef.current;
        if (slider) {
            slider.style.cursor = "grab";
        }
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            const slider = scrollContainerRef.current;
            if (slider) {
                const x = e.pageX - slider.offsetLeft;
                const walk = x - startX;
                slider.scrollLeft = scrollLeft - walk;
            }
        },
        [isDragging, startX, scrollLeft]
    );

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const slider = scrollContainerRef.current;
        if (slider) {
            slider.scrollLeft += e.deltaY;
        }
    }, []);

    useEffect(() => {
        const slider = scrollContainerRef.current;
        if (!slider) return;

        slider.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mousemove", handleMouseMove);
        slider.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            slider.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mousemove", handleMouseMove);
            slider.removeEventListener("wheel", handleWheel);
        };
    }, [
        handleMouseDown,
        handleMouseUp,
        handleMouseLeave,
        handleMouseMove,
        handleWheel,
    ]);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="w-full space-y-4">
            {/* Template Selector */}
            <Select value={selectedTemplate} onValueChange={onSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn template" />
                </SelectTrigger>
                <SelectContent>
                    {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                            {template.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Template Stages - chỉ hiển thị khi đã chọn template */}
            {selectedTemplateData &&
                selectedTemplateData.templateStages &&
                selectedTemplateData.templateStages.length > 0 && (
                    <div>
                        <div className="text-sm font-medium mb-2">
                            Giai đoạn
                        </div>
                        <div
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto gap-2 pb-2 sm:max-w-[420px] scrollbar-hide"
                            style={{
                                cursor: "grab",
                                WebkitOverflowScrolling: "touch",
                                userSelect: "none",
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                width: "100%",
                            }}
                        >
                            {selectedTemplateData.templateStages.map(
                                (stage, index) => (
                                    <button
                                        key={stage.id}
                                        type="button"
                                        className={cn(
                                            "flex-shrink-0 px-3 py-1.5 text-xs rounded-full border whitespace-nowrap",
                                            selectedStageIndex === index
                                                ? "bg-sidebar-primary text-white border-sidebar-primary"
                                                : "bg-white text-gray-600 border-gray-300 hover:border-sidebar-primary/30"
                                        )}
                                        onMouseDown={(e) => {
                                            // Prevent button click when starting drag
                                            if (e.button === 0) {
                                                // Left mouse button only
                                                e.stopPropagation();
                                            }
                                        }}
                                        onClick={(e) => {
                                            // Prevent click when dragging
                                            if (isDragging) {
                                                e.preventDefault();
                                                return;
                                            }
                                            if (onStageSelect) {
                                                onStageSelect(
                                                    index,
                                                    stage.name
                                                );
                                            }
                                        }}
                                    >
                                        {stage.name}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
}

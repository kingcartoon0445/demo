import { BusinessProcessStage } from "@/interfaces/businessProcess";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loading2 from "../Loading2";
import { useBusinessProcessStagesSelector } from "@/hooks/useBusinessProcess";

export function StagesSelector({
    orgId,
    selectedWorkspace,
    onStageSelect,
    selectedStageId,
    onNoStages,
}: {
    orgId: string;
    selectedWorkspace: string;
    onStageSelect?: (stageId: string, stageName: string) => void;
    selectedStageId?: string;
    onNoStages?: () => void;
}) {
    const {
        data: businessProcessStagesResponse,
        isLoading: isLoadingStages,
        isSuccess: isStagesSuccess,
    } = useBusinessProcessStagesSelector(orgId as string, selectedWorkspace);

    const stages = useMemo(() => {
        return (businessProcessStagesResponse?.data ??
            []) as BusinessProcessStage[];
    }, [businessProcessStagesResponse]);

    // Local state for selected stage index when not controlled externally
    const [selectedStageIndex, setSelectedStageIndex] = useState<number>(-1);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

    const handleMouseDown = useCallback((e: MouseEvent) => {
        const slider = scrollContainerRef.current;
        if (!slider) return;

        setIsDragging(true);
        dragStartRef.current = {
            x: e.pageX - slider.offsetLeft,
            scrollLeft: slider.scrollLeft,
        };
        slider.style.cursor = "grabbing";
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
            if (!slider) return;

            const x = e.pageX - slider.offsetLeft;
            const walk = x - dragStartRef.current.x;
            slider.scrollLeft = dragStartRef.current.scrollLeft - walk;
        },
        [isDragging]
    );

    // Touch events for mobile
    const handleTouchStart = useCallback((e: TouchEvent) => {
        const slider = scrollContainerRef.current;
        if (!slider) return;

        setIsDragging(true);
        dragStartRef.current = {
            x: e.touches[0].pageX - slider.offsetLeft,
            scrollLeft: slider.scrollLeft,
        };
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isDragging) return;
            e.preventDefault();

            const slider = scrollContainerRef.current;
            if (!slider) return;

            const x = e.touches[0].pageX - slider.offsetLeft;
            const walk = x - dragStartRef.current.x;
            slider.scrollLeft = dragStartRef.current.scrollLeft - walk;
        },
        [isDragging]
    );

    useEffect(() => {
        const slider = scrollContainerRef.current;
        if (!slider) return;

        // Mouse events
        slider.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
        slider.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mousemove", handleMouseMove);

        // Touch events
        slider.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });

        return () => {
            slider.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);
            slider.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mousemove", handleMouseMove);

            slider.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
            document.removeEventListener("touchmove", handleTouchMove);
        };
    }, [
        handleMouseDown,
        handleMouseUp,
        handleMouseLeave,
        handleMouseMove,
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove,
    ]);

    if (isLoadingStages) {
        return <Loading2 />;
    }

    if (stages.length === 0) {
        // Call onNoStages callback if provided
        if (onNoStages) {
            onNoStages();
        }
        return (
            <div className="text-sm text-gray-500">Không có giai đoạn nào</div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide sm:max-w-[420px]"
            style={{
                cursor: "grab",
                WebkitOverflowScrolling: "touch",
                userSelect: "none",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                width: "100%",
            }}
        >
            {stages.map((stage, index) => (
                <button
                    key={stage.id}
                    type="button"
                    className={cn(
                        "flex-shrink-0 px-3 py-1.5 text-xs rounded-full border whitespace-nowrap",
                        selectedStageId === stage.id ||
                            (!selectedStageId && selectedStageIndex === index)
                            ? "bg-sidebar-primary text-white border-sidebar-primary"
                            : "bg-white text-gray-600 border-gray-300 hover:border-sidebar-primary/30"
                    )}
                    onClick={(e) => {
                        // Prevent click when dragging
                        if (isDragging) return;

                        if (onStageSelect) {
                            onStageSelect(stage.id, stage.name);
                        } else {
                            setSelectedStageIndex(index);
                        }
                    }}
                >
                    {stage.name}
                </button>
            ))}
        </div>
    );
}

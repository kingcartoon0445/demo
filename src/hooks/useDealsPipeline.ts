import { useState, useCallback } from "react";
import { PipelineColumn } from "@/app/org/[orgId]/deals/page";

export interface PendingChanges {
    renamedStages: Record<string, string>;
    addedStages: PipelineColumn[];
    deletedStages: Array<{
        stageId: string;
        moveToStageId?: string;
        action: "delete_tasks" | "move_tasks";
    }>;
    reorderedStages: string[];
    hasReordered: boolean;
    tempToRealIdMapping: Record<string, string>;
}

export function useDealsPipeline() {
    const [pipeline, setPipeline] = useState<PipelineColumn[]>([]);
    const [originalPipeline, setOriginalPipeline] = useState<PipelineColumn[]>(
        []
    );
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
        renamedStages: {},
        addedStages: [],
        deletedStages: [],
        reorderedStages: [],
        hasReordered: false,
        tempToRealIdMapping: {},
    });

    const resetPendingChanges = useCallback(() => {
        setPendingChanges({
            renamedStages: {},
            addedStages: [],
            deletedStages: [],
            reorderedStages: [],
            hasReordered: false,
            tempToRealIdMapping: {},
        });
    }, []);

    const addRenamedStage = useCallback((stageId: string, newName: string) => {
        setPendingChanges((prev) => ({
            ...prev,
            renamedStages: {
                ...prev.renamedStages,
                [stageId]: newName,
            },
        }));
    }, []);

    const addDeletedStage = useCallback(
        (
            stageId: string,
            moveToStageId?: string,
            action: "delete_tasks" | "move_tasks" = "delete_tasks"
        ) => {
            setPendingChanges((prev) => ({
                ...prev,
                deletedStages: [
                    ...prev.deletedStages,
                    { stageId, moveToStageId, action },
                ],
            }));
        },
        []
    );

    const addAddedStage = useCallback(
        (stage: PipelineColumn & { insertIndex: number }) => {
            setPendingChanges((prev) => ({
                ...prev,
                addedStages: [...prev.addedStages, stage],
            }));
        },
        []
    );

    const setReordered = useCallback((stages: string[]) => {
        setPendingChanges((prev) => ({
            ...prev,
            hasReordered: true,
            reorderedStages: stages,
        }));
    }, []);

    const addTempToRealMapping = useCallback(
        (tempId: string, realId: string) => {
            setPendingChanges((prev) => ({
                ...prev,
                tempToRealIdMapping: {
                    ...prev.tempToRealIdMapping,
                    [tempId]: realId,
                },
            }));
        },
        []
    );

    return {
        pipeline,
        setPipeline,
        originalPipeline,
        setOriginalPipeline,
        pendingChanges,
        resetPendingChanges,
        addRenamedStage,
        addDeletedStage,
        addAddedStage,
        setReordered,
        addTempToRealMapping,
    };
}

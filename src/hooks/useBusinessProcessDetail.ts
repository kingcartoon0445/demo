import {
    batchArchiveTask,
    batchDeleteTask,
    batchMoveStage,
    batchUnarchiveTask,
    deleteNote,
    editNote,
} from "@/api/businessProcess";
import {
    BatchArchiveTask,
    BatchDeleteTask,
    BatchMoveStage,
    BatchUnarchiveTask,
} from "@/interfaces/businessProcess";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

export function useBatchMoveStage(orgId: string) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (body: BatchMoveStage) => batchMoveStage(orgId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
            toast.success(t("success.update"));
        },
        onError: (error) => {
            console.error(error);
            toast.error(t("error.update"));
        },
    });
}

export function useBatchArchiveTask(orgId: string) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (body: BatchArchiveTask) => batchArchiveTask(orgId, body),
        onSuccess: () => {
            // queryClient.invalidateQueries({
            //     queryKey: ["businessProcessTasksByWorkspace", orgId],
            // });
            toast.success(t("success.archive"));
        },
        onError: (error) => {
            toast.error(t("error.archive"));
            console.error(error);
        },
    });
}

export function useBatchUnarchiveTask(orgId: string) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (body: BatchUnarchiveTask) =>
            batchUnarchiveTask(orgId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
            toast.success(t("success.unarchive"));
        },
        onError: (error) => {
            toast.error(t("error.unarchive"));
            console.error(error);
        },
    });
}

export function useBatchDeleteTask(orgId: string) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (body: BatchDeleteTask) => batchDeleteTask(orgId, body),
        onSuccess: () => {
            // queryClient.invalidateQueries({
            //     queryKey: ["businessProcessTasksByWorkspace", orgId],
            // });
            toast.success(t("success.delete"));
        },
        onError: (error) => {
            toast.error(t("error.delete"));
            console.error(error);
        },
    });
}

export function useEditTaskNote(
    orgId: string,
    taskId: string,
    journeyId: string
) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (body: { content: string }) =>
            editNote(orgId, taskId, journeyId, body),
        onSuccess: () => {
            toast.success(t("success.edit"));
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
        },
        onError: (error) => {
            toast.error(t("error.edit"));
            console.error(error);
        },
    });
}

export function useDeleteTaskNote(
    orgId: string,
    taskId: string,
    journeyId: string
) {
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    return useMutation({
        mutationFn: () => deleteNote(orgId, taskId, journeyId),
        onSuccess: () => {
            toast.success(t("success.delete"));
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
        },
        onError: (error) => {
            toast.error(t("error.delete"));
            console.error(error);
        },
    });
}

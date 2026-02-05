import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    createBusinessProcessStageFromTemplate,
    createBusinessProcessTag,
    createBusinessProcessTask,
    createNote,
    deleteBusinessProcessStage,
    getBusinessProcess,
    getBusinessProcessStages,
    getBusinessProcessTags,
    getBusinessProcessTaskById,
    getBusinessProcessTasksByWorkspace,
    getBusinessProcessTemplates,
    getTaskJourney,
    moveBusinessProcessTask,
    rollbackBusinessProcessTask,
    updateBusinessProcessStageIndex,
    updateBusinessProcessStageName,
    updateBusinessProcessTaskStatus,
    updateBusinessProcessTaskTags,
    updateBusinessProcessTaskAssignees,
    archieveBusinessProcessTask,
    unarchieveBusinessProcessTask,
    duplicateBusinessProcessTask,
    deleteBusinessProcessTask,
    partialUpdateBusinessProcessTask,
    searchTask,
    linkConversationToTask,
    getTasksAdvanced,
    deleteBusinessProcessTag,
} from "@/api/businessProcess";
import {
    CreateBusinessProcessStageFromTemplate,
    CreateBusinessProcessTag,
    CreateBusinessProcessTask,
    CreateNote,
    DeleteBusinessProcessStage,
    MoveBusinessProcessTask,
    TaskJourney,
    UpdateBusinessProcessStageIndex,
    UpdateBusinessProcessStageName,
    UpdateBusinessProcessTaskStatus,
    BuinessProcessTask,
    LinkConversationToTask,
} from "@/interfaces/businessProcess";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductApiResponse } from "@/lib/interface";

export function useBusinessProcess(orgId: string, workspaceId: string) {
    return useQuery({
        queryKey: ["businessProcess", orgId, workspaceId],
        queryFn: () => getBusinessProcess(orgId, workspaceId),
        enabled: !!orgId && !!workspaceId,
    });
}

export function useBusinessProcessStages(orgId: string, workspaceId: string) {
    return useQuery({
        queryKey: ["businessProcess", orgId, workspaceId],
        queryFn: () => getBusinessProcessStages(orgId, workspaceId),
        enabled: !!orgId && !!workspaceId,
    });
}

export function useBusinessProcessStagesSelector(
    orgId: string,
    workspaceId: string,
) {
    return useQuery({
        queryKey: ["businessProcessSelector", orgId, workspaceId],
        queryFn: () => getBusinessProcessStages(orgId, workspaceId),
        enabled: !!orgId,
    });
}

export function useCreateBusinessProcess(orgId: string, workspaceId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateBusinessProcessStageFromTemplate) =>
            createBusinessProcessStageFromTemplate(orgId, workspaceId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcess", orgId, workspaceId],
            });
            toast.success(t("businessProcess.createSuccess"));
        },
        onError: (error) => {
            toast.error(t("businessProcess.createError"));
            console.error(error);
        },
    });
}

export function useBusinessProcessTemplates() {
    return useQuery({
        queryKey: ["businessProcessTemplates"],
        queryFn: () => getBusinessProcessTemplates(),
    });
}

export function useCreateBusinessProcessTask(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateBusinessProcessTask) =>
            createBusinessProcessTask(orgId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["infinite-leads"] });
            toast.success(t("success.createBusinessProcessTask"));
        },
        onError: (error) => {
            toast.error(t("error.createBusinessProcessTask"));
            console.error(error);
        },
    });
}

export function useBusinessProcessTaskById(orgId: string, taskId: string) {
    return useQuery({
        queryKey: ["businessProcessTaskById", orgId, taskId],
        queryFn: () => getBusinessProcessTaskById(orgId, taskId),
    });
}

export function useMoveBusinessProcessTask(orgId: string, taskId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: MoveBusinessProcessTask) =>
            moveBusinessProcessTask(orgId, taskId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
            toast.success(t("success.updateStage"));
        },
        onError: (error) => {
            toast.error(t("error.updateStage"));
            console.error(error);
        },
    });
}

export function useUpdateBusinessProcessStageName(
    orgId: string,
    stageId: string,
) {
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (body: UpdateBusinessProcessStageName) =>
            updateBusinessProcessStageName(orgId, stageId, body),
        onSuccess: () => {
            toast.success(t("success.updateStage"));
        },
        onError: (error) => {
            toast.error(t("error.updateStage"));
            console.error(error);
        },
    });
}

export function useUpdateBusinessProcessStageIndex(
    orgId: string,
    workspaceId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateBusinessProcessStageIndex) =>
            updateBusinessProcessStageIndex(orgId, workspaceId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcess", orgId, workspaceId],
            });
            // toast.success(t("success.updateStage"));
        },
        onError: (error) => {
            toast.error(t("error.updateStage"));
            console.error(error);
        },
    });
}

export function useDeleteBusinessProcessStage(
    orgId: string,
    workspaceId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            stageId,
            body,
        }: {
            stageId: string;
            body: DeleteBusinessProcessStage;
        }) => deleteBusinessProcessStage(orgId, stageId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcess", orgId, workspaceId],
            });
            toast.success(t("success.deleteStage"));
        },
        onError: (error) => {
            toast.error(t("error.deleteStage"));
        },
    });
}

export function useBusinessProcessTasksByWorkspace(
    orgId: string,
    params: {
        workspaceId: string;
        page?: number;
        pageSize?: number;
    },
) {
    return useQuery({
        queryKey: ["businessProcessTasksByWorkspace", orgId, params],
        queryFn: () => getBusinessProcessTasksByWorkspace(orgId, params),
    });
}

export function useGetTasksAdvanced(
    orgId: string,
    params: {
        page: number;
        pageSize: number;
        searchText?: string;
        stageId?: string;
        workspaceId?: string;
        assigneeIds?: string[];
        statusList?: number[];
    },
    options?: {
        enabled?: boolean;
    },
) {
    return useQuery({
        queryKey: ["businessProcessTasksAdvanced", orgId, params],
        queryFn: () => getTasksAdvanced(orgId, params),
        enabled:
            options?.enabled !== undefined
                ? options.enabled
                : !!orgId && !!params.workspaceId,
        staleTime: 0,
    });
}

export function useGetInfiniteTaskJourney(
    orgId: string,
    taskId: string,
    type: string,
) {
    return useInfiniteQuery<ProductApiResponse<TaskJourney>>({
        queryKey: ["taskJourney", orgId, taskId],
        queryFn: ({ pageParam = 0 }) => {
            return getTaskJourney(orgId, taskId, {
                page: pageParam as number,
                pageSize: 20,
                type: type,
            });
        },
        getNextPageParam: (lastPage) => {
            try {
                if (!lastPage || !lastPage.pagination) {
                    return undefined;
                }

                const currentPage = lastPage.pagination.pageNumber;
                const totalPages = lastPage.pagination.totalPages;

                const nextPage = currentPage + 1;
                const hasMore = nextPage <= totalPages;
                if (!hasMore) {
                    return undefined;
                }

                return nextPage;
            } catch (error) {
                console.error("Error in task getNextPageParam:", error);
                return undefined;
            }
        },
        initialPageParam: 0,
        enabled: !!orgId && !!taskId,
        staleTime: 0,
    });
}

export function useCreateNote(orgId: string, taskId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateNote) => createNote(orgId, taskId, body),
        onSuccess: (data) => {
            toast.success(t("success.createNote"));
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
        },
        onError: (error) => {
            toast.error(t("error.createNote"));
        },
    });
}

export function useUpdateBusinessProcessTaskStatus(
    orgId: string,
    taskId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: UpdateBusinessProcessTaskStatus) =>
            updateBusinessProcessTaskStatus(orgId, taskId, body),
        onSuccess: () => {
            toast.success(t("success.updateTaskStatus"));
            // queryClient.invalidateQueries({
            //     queryKey: ["businessProcessTaskById", orgId, taskId],
            // });
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
        },
        onError: (error) => {
            toast.error(t("error.updateTaskStatus"));
            console.error(error);
        },
    });
}

export function useRollbackBusinessProcessTask(orgId: string, taskId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => rollbackBusinessProcessTask(orgId, taskId),
        onSuccess: () => {
            toast.success(t("success.updateTaskStatus"));
            // queryClient.invalidateQueries({
            //     queryKey: ["businessProcessTaskById", orgId, taskId],
            // });
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
        },
        onError: (error) => {
            toast.error(t("error.updateTaskStatus"));
            console.error(error);
        },
    });
}

export function useCreateBusinessProcessTag(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateBusinessProcessTag) =>
            createBusinessProcessTag(orgId, body),
        onSuccess: (data) => {
            toast.success(t("success.createTag"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTags", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.createTag"));
            console.error(error);
        },
    });
}

export function useDeleteBusinessProcessTag(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tagId: string) => deleteBusinessProcessTag(orgId, tagId),
        onSuccess: () => {
            toast.success(t("success.deleteTag"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTags", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.deleteTag"));
            console.error(error);
        },
    });
}

export function useGetBusinessProcessTags(orgId: string, workspaceId: string) {
    return useQuery({
        queryKey: ["businessProcessTags", orgId, workspaceId],
        queryFn: () => getBusinessProcessTags(orgId, workspaceId),
    });
}

export function useUpdateBusinessProcessTaskTags(
    orgId: string,
    taskId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tagIds: string[]) =>
            updateBusinessProcessTaskTags(orgId, taskId, tagIds),
        onSuccess: () => {
            toast.success(t("success.updateTags"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTaskById", orgId, taskId],
            });
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
        },
        onError: (error) => {
            toast.error(t("error.updateTags"));
            console.error(error);
        },
    });
}

export function useUpdateBusinessProcessTaskAssignees(
    orgId: string,
    taskId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: {
            assigneeType: string;
            userIds: string[];
            teamIds: string[];
        }) => updateBusinessProcessTaskAssignees(orgId, taskId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTaskById", orgId, taskId],
            });
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
            toast.success(t("success.assignLead"));
        },
        onError: (error) => {
            toast.error(t("error.assignLead"));
            console.error(error);
        },
    });
}

export function useArchieveBusinessProcessTask(orgId: string, taskId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => archieveBusinessProcessTask(orgId, taskId),
        onSuccess: () => {
            toast.success(t("success.archieveTask"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.archieveTask"));
            console.error(error);
        },
    });
}

export function useUnarchieveBusinessProcessTask(
    orgId: string,
    taskId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => unarchieveBusinessProcessTask(orgId, taskId),
        onSuccess: () => {
            toast.success(t("success.unarchieveTask"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.unarchieveTask"));
            console.error(error);
        },
    });
}

export function useDuplicateBusinessProcessTask(orgId: string, taskId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => duplicateBusinessProcessTask(orgId, taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
            toast.success(t("success.duplicateTask"));
        },
        onError: (error) => {
            toast.error(t("error.duplicateTask"));
            console.error(error);
        },
    });
}

export function useDeleteBusinessProcessTask(orgId: string, taskId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deleteBusinessProcessTask(orgId, taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
            toast.success(t("success.deleteTask"));
        },
        onError: (error) => {
            toast.error(t("error.deleteTask"));
            console.error(error);
        },
    });
}

export function usePartialUpdateBusinessProcessTask(
    orgId: string,
    taskId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: Partial<BuinessProcessTask>) =>
            partialUpdateBusinessProcessTask(orgId, taskId, body),
        onSuccess: () => {
            toast.success(t("success.updateTask"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTaskById", orgId, taskId],
            });
            queryClient.invalidateQueries({
                queryKey: ["taskJourney", orgId, taskId],
            });
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTasksByWorkspace", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.updateTask"));
            console.error(error);
        },
    });
}

export function useSearchTask(
    orgId: string,
    params: {
        searchText: string;
        page: number;
        pageSize: number;
    },
) {
    return useQuery({
        queryKey: ["searchTask", orgId, params],
        queryFn: () => searchTask(orgId, params),
        enabled: !!orgId && !!params.searchText,
    });
}

export function useInfiniteSearchTask(
    orgId: string,
    params: {
        searchText: string;
        pageSize: number;
    },
) {
    return useInfiniteQuery({
        queryKey: [
            "infinite-searchTask",
            orgId,
            params.searchText,
            params.pageSize,
        ],
        queryFn: ({ pageParam = 1 }) =>
            searchTask(orgId, {
                searchText: params.searchText,
                page: pageParam as number,
                pageSize: params.pageSize,
            }),
        getNextPageParam: (lastPage) => {
            try {
                const currentPage = lastPage?.pagination?.pageNumber ?? 1;
                const totalPages = lastPage?.pagination?.totalPages ?? 1;
                const nextPage = currentPage + 1;
                return nextPage <= totalPages ? nextPage : undefined;
            } catch (e) {
                return undefined;
            }
        },
        initialPageParam: 1,
        enabled: !!orgId && !!params.searchText,
        staleTime: 0,
    });
}

export function useLinkConversationToTask(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: LinkConversationToTask) =>
            linkConversationToTask(orgId, body),
        onSuccess: () => {
            toast.success(t("success.linkConversation"));
            queryClient.invalidateQueries({
                queryKey: ["businessProcessTaskById", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.linkConversationToTask"));
            console.error(error);
        },
    });
}

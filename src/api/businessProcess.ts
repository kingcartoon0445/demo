import {
    BuinessProcessTask,
    BusinessProcess,
    BusinessProcessStage,
    BusinessProcessTemplate,
    CreateBusinessProcess,
    CreateBusinessProcessStageFromTemplate,
    CreateBusinessProcessTask,
    MoveBusinessProcessTask,
    UpdateBusinessProcessStageName,
    UpdateBusinessProcessStageIndex,
    DeleteBusinessProcessStage,
    CreateBusinessProcessStage,
    TaskJourney,
    CreateNote,
    UpdateBusinessProcessTaskStatus,
    BusinessProcessTag,
    CreateBusinessProcessTag,
    LinkConversationToTask,
    BatchMoveStage,
    BatchArchiveTask,
    BatchUnarchiveTask,
    BatchDeleteTask,
} from "@/interfaces/businessProcess";
import { createApiCall } from "@/lib/api";
import { businessProcessPaths } from "@/lib/authConstants";
import { ProductApiResponse, SingleProductApiResponse } from "@/lib/interface";

export async function getBusinessProcessStages(
    orgId: string,
    workspaceId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        businessProcessPaths.getBusinessProcessStage.replace(
            "{workspaceId}",
            workspaceId,
        ),
    );
    return response.data as ProductApiResponse<BusinessProcessStage>;
}
//hàm này sử dụng trong trường hợp tạo stage từ template và có chọn stage để gán vào task ở lead
export async function createBusinessProcessStageFromTemplate(
    orgId: string,
    workspaceId: string,
    body: CreateBusinessProcessStageFromTemplate,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.createBusinessProcessStageFromTemplate.replace(
            "{workspaceId}",
            workspaceId,
        ),
        body,
    );
    return response.data;
}

export async function getBusinessProcessTemplates() {
    const api = createApiCall();
    const response = await api.get(
        businessProcessPaths.businessProcessTemplate,
    );
    return response.data as ProductApiResponse<BusinessProcessTemplate>;
}

export async function createBusinessProcessTask(
    orgId: string,
    body: CreateBusinessProcessTask,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.businessProcessTask,
        body,
    );
    return response.data as SingleProductApiResponse<BuinessProcessTask>;
}

export async function linkOrder(
    orgId: string,
    taskId: string,
    orderId: string,
) {
    // Removed console.log
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.linkOrder.replace("{taskId}", taskId),
        {
            orderId,
        },
    );
    return response.data;
}

export async function createBusinessProcess(
    orgId: string,
    body: CreateBusinessProcess,
) {
    const api = createApiCall(orgId);
    const response = await api.post(businessProcessPaths.businessProcess, body);
    return response.data;
}

export async function createBusinessProcessWos(
    orgId: string,
    body: CreateBusinessProcess,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.createBusinessProcessWos,
        body,
    );
    return response.data;
}

export async function getBusinessProcess(orgId: string, workspaceId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(businessProcessPaths.businessProcess, {
        params: {
            workspaceId,
        },
    });
    return response.data as ProductApiResponse<BusinessProcess>;
}

export async function getBusinessProcessTasks(
    orgId: string,
    params: {
        stageId?: string;
        workspaceId?: string;
        page?: number;
        pageSize?: number;
    },
) {
    const api = createApiCall(orgId);
    const response = await api.get(businessProcessPaths.businessProcessTask, {
        params: {
            stageId: params.stageId,
            page: params.page, // No conversion needed, already 1-indexed from caller
            pageSize: params.pageSize,
        },
    });
    return response.data as ProductApiResponse<BuinessProcessTask>;
}

export async function getBusinessProcessTasksByWorkspace(
    orgId: string,
    params: {
        workspaceId: string;
        page?: number;
        pageSize?: number;
    },
) {
    const api = createApiCall(orgId);
    const response = await api.get(businessProcessPaths.businessProcessTask, {
        params: {
            workspaceId: params.workspaceId,
            page: params.page, // No conversion needed, already 1-indexed from caller
            pageSize: params.pageSize,
        },
    });
    return response.data as ProductApiResponse<BuinessProcessTask>;
}

export async function getBusinessProcessTaskById(
    orgId: string,
    taskId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        businessProcessPaths.businessProcessTaskById.replace(
            "{taskId}",
            taskId,
        ),
    );
    return response.data as SingleProductApiResponse<BuinessProcessTask>;
}

export async function moveBusinessProcessTask(
    orgId: string,
    taskId: string,
    body: MoveBusinessProcessTask,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.moveBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
        body,
    );
    return response.data as SingleProductApiResponse<BuinessProcessTask>;
}

export async function updateBusinessProcessStageName(
    orgId: string,
    stageId: string,
    body: UpdateBusinessProcessStageName,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBusinessProcessStageName.replace(
            "{stageId}",
            stageId,
        ),
        body,
    );
    return response.data;
}

export async function updateBusinessProcessStageIndex(
    orgId: string,
    workspaceId: string,
    body: UpdateBusinessProcessStageIndex,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBusinessProcessStageIndex.replace(
            "{workspaceId}",
            workspaceId,
        ),
        body,
    );
    return response.data;
}

export async function deleteBusinessProcessStage(
    orgId: string,
    stageId: string,
    body: DeleteBusinessProcessStage,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.deleteBusinessProcessStage.replace(
            "{stageId}",
            stageId,
        ),
        body,
    );
    return response.data;
}

export async function createBusinessProcessStage(
    orgId: string,
    body: CreateBusinessProcessStage,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.businessProcessStage,
        body,
    );
    return response.data as SingleProductApiResponse<BusinessProcessStage>;
}

export async function getTaskJourney(
    orgId: string,
    taskId: string,
    params: {
        page: number;
        pageSize: number;
        type: string;
    },
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            businessProcessPaths.getTaskJourney.replace("{taskId}", taskId),
            {
                params: {
                    page: params.page, // No conversion needed, already 1-indexed from caller
                    pageSize: params.pageSize,
                    type: params.type,
                },
            },
        );

        return response.data as ProductApiResponse<TaskJourney>;
    } catch (error) {
        console.error("Error in getTaskJourney:", error);
        throw error;
    }
}

export async function createNote(
    orgId: string,
    taskId: string,
    body: CreateNote,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.createNote.replace("{taskId}", taskId),
        body,
    );
    return response.data;
}

export async function updateBusinessProcessTaskStatus(
    orgId: string,
    taskId: string,
    body: UpdateBusinessProcessTaskStatus,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBusinessProcessTaskStatus.replace(
            "{taskId}",
            taskId,
        ),
        body,
    );
    return response.data;
}

export async function rollbackBusinessProcessTask(
    orgId: string,
    taskId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.rollbackBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
    );
    return response.data;
}

export async function getBusinessProcessTags(
    orgId: string,
    workspaceId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        businessProcessPaths.getBusinessProcessTags,
        {
            params: {
                workspaceId,
            },
        },
    );
    return response.data as ProductApiResponse<BusinessProcessTag>;
}

export async function createBusinessProcessTag(
    orgId: string,
    body: CreateBusinessProcessTag,
) {
    // Removed console.log
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.createBusinessProcessTag,
        body,
    );
    return response.data as SingleProductApiResponse<BusinessProcessTag>;
}

export async function updateBusinessProcessTaskTags(
    orgId: string,
    taskId: string,
    tagIds: string[],
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBusinessProcessTaskTags.replace(
            "{taskId}",
            taskId,
        ),
        { tagIds },
    );
    return response.data;
}

export async function updateBusinessProcessTaskAssignees(
    orgId: string,
    taskId: string,
    body: { assigneeType: string; userIds: string[]; teamIds: string[] },
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBusinessProcessTaskAssignees.replace(
            "{taskId}",
            taskId,
        ),
        body,
    );
    return response.data;
}

export async function archieveBusinessProcessTask(
    orgId: string,
    taskId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.archieveBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
    );
    return response.data;
}

export async function unarchieveBusinessProcessTask(
    orgId: string,
    taskId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.unarchieveBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
    );
    return response.data;
}

export async function duplicateBusinessProcessTask(
    orgId: string,
    taskId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.duplicateBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
    );
    return response.data;
}

export async function deleteBusinessProcessTask(orgId: string, taskId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        businessProcessPaths.deleteBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
    );
    return response.data;
}

export async function partialUpdateBusinessProcessTask(
    orgId: string,
    taskId: string,
    body: Partial<BuinessProcessTask>,
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        businessProcessPaths.partialUpdateBusinessProcessTask.replace(
            "{taskId}",
            taskId,
        ),
        body,
    );
    return response.data;
}

export async function searchTask(
    orgId: string,
    params: {
        searchText: string;
        page: number;
        pageSize: number;
    },
) {
    const api = createApiCall(orgId);
    const response = await api.get(businessProcessPaths.searchTask, {
        params,
    });
    return response.data as ProductApiResponse<BuinessProcessTask>;
}

export async function linkConversationToTask(
    orgId: string,
    body: LinkConversationToTask,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.linkConversationToTask,
        body,
    );
    return response.data as SingleProductApiResponse<BuinessProcessTask>;
}

export async function batchMoveStage(orgId: string, body: BatchMoveStage) {
    const api = createApiCall(orgId);
    const response = await api.put(businessProcessPaths.batchMoveStage, body);
    return response.data;
}

export async function batchArchiveTask(orgId: string, body: BatchArchiveTask) {
    const api = createApiCall(orgId);
    const response = await api.put(businessProcessPaths.batchArchiveTask, body);
    return response.data;
}

export async function batchUnarchiveTask(
    orgId: string,
    body: BatchUnarchiveTask,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.batchUnarchiveTask,
        body,
    );
    return response.data;
}

export async function batchDeleteTask(orgId: string, body: BatchDeleteTask) {
    const api = createApiCall(orgId);
    const response = await api.post(businessProcessPaths.batchDeleteTask, body);
    return response.data;
}

export async function getTasksAdvanced(
    orgId: string,
    params: {
        page: number;
        pageSize: number;
        searchText?: string;
        stageId?: string;
        workspaceId?: string;
        assigneeIds?: string[];
        statusList?: number[];
        fromDate?: string;
        toDate?: string;
        tags?: string[];
        status?: number;
    },
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.getTasksAdvanced,
        params,
    );
    return response.data as ProductApiResponse<BuinessProcessTask>;
}

export async function editNote(
    orgId: string,
    taskId: string,
    journeyId: string,
    body: { content: string },
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.editNote
            .replace("{taskId}", taskId)
            .replace("{journeyId}", journeyId),
        body,
    );
    return response.data;
}

export async function deleteNote(
    orgId: string,
    taskId: string,
    journeyId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        businessProcessPaths.deleteNote
            .replace("{taskId}", taskId)
            .replace("{journeyId}", journeyId),
    );
    return response.data;
}

export async function batchCreateStage(
    orgId: string,
    workspaceId: string,
    body: any,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.createBatchStage.replace(
            "{workspaceId}",
            workspaceId,
        ),
        body,
    );
    return response.data;
}

export async function batchDeleteStage(
    orgId: string,
    workspaceId: string,
    body: any,
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        businessProcessPaths.deleteBatchStage.replace(
            "{workspaceId}",
            workspaceId,
        ),
        body,
    );
    return response.data;
}

export async function batchUpdateStageName(
    orgId: string,
    workspaceId: string,
    body: any,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBatchStageName.replace(
            "{workspaceId}",
            workspaceId,
        ),
        body,
    );
    return response.data;
}

export async function batchUpdateStageColor(
    orgId: string,
    workspaceId: string,
    body: any,
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        businessProcessPaths.updateBatchStageColor.replace(
            "{workspaceId}",
            workspaceId,
        ),
        body,
    );
    return response.data;
}

export async function deleteBusinessProcessTag(orgId: string, tagId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        businessProcessPaths.deleteBusinessProcessTag.replace("{tagId}", tagId),
    );
    return response.data;
}

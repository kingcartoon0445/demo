export interface BaseEntity {
    id: string;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface BusinessProcess {
    id: string;
    name: string;
    description: string;
    category: string;
    templateId: string;
    workspaceId: string;
    customerId: string;
    assignedTo: string;
    startDate: string;
    dueDate: string;
    completedDate: string;
    status: number;
    totalValue: number;
    priority: string;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
    processStages: BusinessProcessStage[];
}

export interface BusinessProcessStage {
    id: string;
    name: string;
    description: string;
    color: string;
    orderIndex: number;
    isRequired: boolean;
    estimatedDays: number;
    startDate: string;
    completedDate: string;
    status: number;
    assignedTo: string;
    notes: string;
    isCurrentStage: boolean;
}

export interface CreateBusinessProcess {
    name: string;
    description?: string;
    workspaceId: string;
    templateId?: string;
    customStages?: {
        name: string;
    }[];
}

export interface CreateBusinessProcessStageFromTemplate {
    templateId: string;
    targetStageOrderIndex: number;
}

export interface BusinessProcessTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    isDefault: true;
    isActive: true;
    createdDate: string;
    createdBy: string;
    templateStages: BusinessProcessTemplateStage[];
}

export interface BusinessProcessTemplateStage {
    id: string;
    name: string;
    description: string;
    color: string;
    orderIndex: number;
    isRequired: boolean;
    estimatedDays: number;
}

export interface CreateBusinessProcessTask {
    stageId: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    description: string;
    customerId: string;
    leadId: string;
    buId: string;
    workspaceId: string;
    assignedTo: string[];
    assignToMember?: string[] | null;
    assignToTeam?: string[] | null;
    tagIds: string[];
    notes?: string;
    subTasks?: CreateBusinessProcessTaskSubTask[];
    provider?: string;
}

export interface CreateBusinessProcessTaskSubTask {
    name: string;
    description: string;
    assignedTo: string;
    startDate: string;
    dueDate: string;
    priority: string;
    notes: string;
    isRequired: boolean;
    orderIndex: number;
}

export interface BuinessProcessTask {
    id: string;
    stageId: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    description: string;
    customerId: string;
    customerName: string;
    leadId: string;
    buId: string;
    orderId: string;
    assignedTo: AssignedTo[];
    tags: BusinessProcessTag[];
    status: number;
    notes: string;
    isBlocked: boolean;
    blockedReason: string;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
    subTasks: BuinessProcessTaskSubTask[];
    stageHistory: BuinessProcessTaskStageHistory[];
    customerInfo?: CustomerInfo;
    activity: {
        id: string;
        taskId: string;
        totalCalls: number;
        totalNotes: number;
        totalReminders: number;
        totalAttachments: number;
    };
}

export interface BuinessProcessTaskSubTask {
    id: string;
    taskId: string;
    name: string;
    description: string;
    assignedTo: AssignedTo[];
    startDate: string;
    dueDate: string;
    completedDate: string;
    status: number;
    priority: string;
    notes: string;
    isRequired: boolean;
    orderIndex: number;
    createdDate: string;
    createdBy: string;
    updatedDate: string;
    updatedBy: string;
}

export interface CustomerInfo {
    id: string;
    organizationId: string;
    workspaceId: string | null;
    teamId: string | null;
    title: string;
    fullName: string;
    email: string;
    phone: string;
    gender: number;
    dob: string | null;
    maritalStatus: string | null;
    physicalId: string | null;
    dateOfIssue: string | null;
    placeOfIssue: string | null;
    address: string | null;
    rating: number;
    work: string | null;
    avatar: string | null;
    assignTo: string | null;
    type: string;
    companyId: string;
    flowStep: string | null;
    flowStepReason: string | null;
    status: number;
    isArchive: boolean;
    scope: string | null;
    stageId: string | null;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    conversation: {
        id: string;
        pageId: string;
        pageName: string;
        personId: string;
        personName: string;
        provider: string;
    };
    source?: any;
}

export interface BuinessProcessTaskStageHistory {
    id: string;
    taskId: string;
    stageId: string;
    stageName: string;
    startDate: string;
    endDate: string | null;
    durationMinutes: number | null;
    durationFormatted: string;
    isCurrentStage: boolean;
    createdDate: string;
    createdBy: string;
    updatedDate: string | null;
    updatedBy: string | null;
}

export interface AssignedTo {
    id: string;
    name: string;
    saleTeamId: string;
    saleTeamName: string;
    avatar: string;
    type: string;
}

export interface MoveBusinessProcessTask {
    newStageId: string;
}

export interface UpdateBusinessProcessStageName {
    name: string;
}

export interface UpdateBusinessProcessStageIndex {
    stages: {
        stageId: string;
        orderIndex: number;
    }[];
}

export interface DeleteBusinessProcessStage {
    action: string;
    targetStageId: string;
}

export interface CreateBusinessProcessStage {
    name: string;
    workspaceId: string;
}

export interface TaskJourney {
    id: string;
    summary: string;
    createdDate: string;
    createdByName?: string;
    type: string;
    icon: string;
    oldValue?: string;
    newValue?: string;
}

export interface CreateNote {
    content: string;
}

export interface UpdateBusinessProcessTaskStatus {
    isSuccess: boolean;
    note: string;
}

export interface BusinessProcessTag {
    id: string;
    workspaceId: string;
    name: string;
    textColor: string;
    backgroundColor: string;
}

export interface CreateBusinessProcessTag {
    workspaceId: string;
    name: string;
    textColor: string;
    backgroundColor: string;
}

export interface LinkConversationToTask {
    conversationId: string;
    taskId: string;
}

export interface BatchMoveStage {
    taskIds: string[];
    newStageId: string;
    notes?: string;
}

export interface BatchArchiveTask {
    taskIds: string[];
    notes?: string;
}

export interface BatchUnarchiveTask {
    taskIds: string[];
    notes?: string;
}

export interface BatchDeleteTask {
    taskIds: string[];
    reason?: string;
}

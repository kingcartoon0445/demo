export interface Dataset {
    id: string;
    organizationId: string;
    title: string;
    datasetId: string; // The pixel ID based on previous code usage, or is it 'pixelId' in new response? The sample has 'pixelId'. Let's check mapping in page.tsx.
    // The existing code maps 'pixelId' to 'datasetId'.
    // "datasetId: d.pixelId" in page.tsx line 161.
    // The sample response has "pixelId": "465464464654".
    // But also "datasetId" inside workspace objects? NO, that's referencing parent.
    // So I should keep 'datasetId' property name for compatibility or rename to 'pixelId'.
    // User code uses 'datasetId'. Let's keep it but add 'title'.
    accessToken: string; // Sample response doesn't show accessToken at root.
    // Wait, sample response doesn't have accessToken!
    // "datasetId" in sample is "465464464654" (pixelId).
    // The user said "dataset list hiện tại sẽ sửa lại như này" and provided a sample JSON.
    // The sample JSON shows "workspaces" array.
    // It does NOT show accessToken. Is it hidden?
    // Old code had accessToken.
    // I will duplicate existing props + new ones.
    status: number;
    isActiveLead?: number;
    isActiveDeal?: number;
    workspaces?: {
        id: string;
        datasetId: string;
        category: "LEAD" | "DEAL";
        workspaceId: string;
        workspaceName?: string;
        status: number;
        events: {
            id: string;
            stageName: string; // "stageName" in sample
            eventName: string; // "eventName" (Facebook event)
            status: number;
            datasetId: string;
            workspaceId: string;
        }[];
    }[];
}

export interface EventMapping {
    id: string;
    fbEventName: string;
    crmEventName: string;
    status: "active" | "inactive";
    icon: "purchase" | "checkout" | "view";
}

export interface DatasetResponse {
    id: string;
    category: string;
    workspaceId: string;
    workspaceName: string;
    events: {
        id: string;
        datasetId: string;
        organizationId: string;
        workspaceId: string;
        eventName: string;
        stageId: string;
        status: number;
        createdBy: string;
        createdDate: string;
        lastModifiedBy: string;
        lastModifiedDate: string;
        stageName: string;
    }[];
}

export interface DatasetEventsResponse {
    code: number;
    content: DatasetResponse[];
}

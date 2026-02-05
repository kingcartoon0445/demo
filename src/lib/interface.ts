import { AssignedTo } from "@/interfaces/businessProcess";

export interface Assignee {
    id: string;
    teamId: string;
    teamName: string;
    profileId: string;
    profileName: string;
    avatar: string;
    type: string;
}

export interface BaseEntity {
    id: string;
    fullName: string;
    assignees: Assignee[]; // Nếu muốn object: Assignee[], cần sửa ở cả backend
    createdDate: string;
    lastModifiedDate: string;
    avatar?: string;
    phone?: string;
    rawPhone?: string;
    gender?: number;
    dob?: string;
    maritalStatus?: number;
    address?: string;
    rating?: number;
    work?: string;
    physicalId?: string;
    email?: string;
}

export interface Customer extends BaseEntity {
    workspaceId: string;
    workspaceName: string;
    deals?: Array<{
        id: string;
        title?: string;
        fullName?: string;
        value?: number;
        workspaceId?: string;
        orderId?: string;
    }>;
    leads?: Array<{
        id: string;
        fullName?: string;
        email?: string;
    }>;
}

export interface Lead extends BaseEntity {
    workspaceId?: string;
    customer?: string;
    snippet?: string;
    channel?: string;
    sourceName?: string;
    pageName?: string;
    pageAvatar?: string;
}

export interface Deal extends BaseEntity {
    title: string;
    project?: string;
    workspaceId: string;
    workspaceName: string;
    stageId: string;
    stageName: string;
    stageGroupId: string;
    stageGroupName: string;
    totalReminders?: number;
    totalCalls?: number;
    totalNotes?: number;
    totalAttachments?: number;
    customer?: string;
    customerName?: string;
    source?: any;
}

export interface ApiResponse<T> {
    code: number;
    message?: string;
    content: T[] | T;
    metadata: {
        total: number;
        count: number;
        offset: number;
        limit: number;
    };
}

export interface ApiResponseSingle<T> {
    code: number;
    content: T;
    message?: string;
}

export interface WalletDetail {
    id: string;
    organizationId: string;
    credit: number;
    status: number;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

export interface DetailContactResponse {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    title?: string;
    rawPhone?: string;
    gender?: number;
    dob?: string;
    maritalStatus?: number;
    address?: string;
    rating?: number;
    work?: string;
    physicalId?: string;
    createdDate?: string;
    lastModifiedDate?: string;
    tags: string[];
}

export interface DetailLead extends DetailContactResponse {
    assignees: Assignee[];
    avatar?: string;
    source?: string;
    utmSource?: string[];
    customer?: Customer;
}

export interface DetailDeal extends DetailContactResponse {
    flowStep: string;
    assignees: Assignee[];
}

export interface UtmSource {
    id: string;
    organizationId: string;
    workspaceId: string;
    name: string;
    count: number;
    status: number;
    createdDate: string;
    lastModifiedDate: string;
}

export interface Organization {
    id: string;
    name: string;
    avatar?: string;
    subscription?: string;
}

export interface OrgMember {
    organizationId: string;
    profileId: string;
    fullName: string;
    email: string;
    avatar?: string;
    address?: string;
    typeOfEmployee: "OWNER" | "ADMIN" | "FULLTIME";
    status: number;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    lastOnline: string;
}

export interface UserProfile {
    id: string;
    fullName: string;
    phone?: string;
    email: string;
    dob?: string;
    gender?: number;
    about?: string;
    address?: string;
    position?: string;
    avatar?: string;
    cover?: string;
    isVerifyPhone?: boolean;
    isVerifyEmail?: boolean;
    isFcm?: boolean;
    createdDate: string;
    role?: {
        id: string;
        name: string;
    };
}

export interface PermissionGroup {
    id: string;
    organizationId: string;
    name: string;
    scope: "ORGANIZATION" | "WORKSPACE";
    isDefault: boolean;
    totalMembers: number;
    status: number;
    createdBy: string;
    createdDate: string;
}

export interface UserWorkspaceTeam {
    workspaceId: string;
    teamId: string;
    teamName: string;
    role: string;
}

export interface UserWorkspace {
    workspaceId: string;
    workspaceName: string;
    groupId?: string;
    groupName?: string;
    teams: UserWorkspaceTeam[];
}

export interface Workspace {
    workspaceId: string;
    workspaceName: string;
    teams: Team[];
}

export interface Team {
    id: string;
    name: string;
    parentId?: string;
    childs: Team[];
}

export interface DealStage {
    id: string;
    name: string;
    description: string;
    color: string;
    order: number;
    stageGroup?: {
        id: string;
        name: string;
        hexCode: string;
        index: number;
    };
    stageId: string;
    index: number;
}

export interface ParamsQuery {
    workspaceIds?: string[];
    searchText?: string;
    startDate?: string;
    endDate?: string;
    offset?: number;
    limit?: number;
    sort?: string;
    fields?: string[];
}

export interface CustomerTag {
    id: string;
    organizationId: string;
    workspaceId: string;
    name: string;
    count: number;
    status: number;
    createdDate: string;
    lastModifiedDate: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    status: number;
    images?: string[];
    image?: string;
    tax?: number;
    orgId?: string;
    organizationId?: string;
    createdDate?: string;
    createdBy?: string;
    updatedDate?: string;
    updatedBy?: string;
    isDeleted?: boolean;
    code?: string;
    unit?: string;
    category?: {
        id: string;
        name: string;
    };
    categories?: {
        id: string;
        name: string;
    }[];
    cost?: number;
    direct_cost?: number;
    comment?: string;
    currency?: string;
    billing_frequency?: "one_time" | "monthly" | "yearly";
    assignedTo?: AssignedTo[];
}

export interface ProductPagination {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
}

export interface ProductApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T[];
    pagination: ProductPagination;
}

export interface SingleProductApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T;
}

export interface OrderDetail {
    id: string;
    customerId: string;
    totalPrice: number;
    orderDetails: OrderDetailItem[];
}

export interface OrderDetailItem {
    id: string;
    productId: string;
    quantity: number;
    product: Product;
}

export interface Category {
    id: string;
    name: string;
    status: number;
}

export interface CreateUpdateProduct {
    name: string;
    code: string;
    price: number;
    tax: number;
    categoryIds: string[];
    description: string;
    status: number;
}

export interface PriceHistory {
    id: string;
    fieldChanged: string;
    oldValue: number;
    newValue: number;
    changedBy: string;
    changedAt: string;
}

export interface Transaction {
    id: string;
    orderId: string;
    workspaceId: string;
    customerName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: number;
    createdDate: string;
}

export interface QueryParams {
    offset: number;
    limit: number;
    searchText?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
    sourceIds?: string[];
    stageIds?: string[];
    assignees?: string[];
    utmSources?: string[];
    ratings?: number[];
    isBusiness?: boolean;
    isArchive?: boolean;
    fields?: string[];
    sort?: string;
    channel?: string;
    customCondition?: {
        field: string;
        operator: string;
        value: string;
    }[];
}

export interface WorkspaceListItem {
    id: string;
    organizationId: string;
    name: string;
    scope: number;
    status: number;
    type: string;
    createdDate: string;
    totalContact: number;
    totalMember: number;
}

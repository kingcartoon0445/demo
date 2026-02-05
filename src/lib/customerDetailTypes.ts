import { useLanguage } from "@/contexts/LanguageContext";

// Interface cho customer detail API response
export interface CustomerDetailResponse {
    code: number;
    content: CustomerDetail;
}

export interface CustomerDetail {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
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
}

export interface CustomerStage {
    id: string;
    organizationId: string;
    workspaceId: string;
    name: string;
    stageGroupId: string;
    status: number;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

export interface CustomerSource {
    sourceId: string;
    sourceName: string;
    createdDate: string;
}

export interface CustomerAdditional {
    name: string;
    value: string;
}

export interface CustomerSocial {
    platform: string;
    url: string;
}

export interface AssignedUser {
    id: string;
    fullName: string;
    avatar?: string;
}

export interface CustomerTag {
    id: string;
    name: string;
    color?: string;
}

// Helper functions for data processing
export const getMaritalStatusText = (status?: number): string => {
    switch (status) {
        case 0:
            return "Độc thân";
        case 1:
            return "Đã kết hôn";
        case 2:
            return "Chưa xác định";
        default:
            return "Chưa xác định";
    }
};

export const getGenderText = (gender?: number): string => {
    const { t } = useLanguage();
    switch (gender) {
        case 0:
            return t("common.female");
        case 1:
            return t("common.male");
        default:
            return t("common.unknown");
    }
};

export const formatDate = (dateString?: string): string => {
    if (!dateString) return "Chưa có";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    } catch {
        return "Ngày không hợp lệ";
    }
};

// Legacy functions for backward compatibility
export const getCustomerAdditionalField = (
    additional: any[],
    field: string
): string | null => {
    // These functions are kept for backward compatibility but may not be needed with new API
    return null;
};

export const getCustomerSocialField = (
    social: any[],
    field: string
): string | null => {
    // These functions are kept for backward compatibility but may not be needed with new API
    return null;
};

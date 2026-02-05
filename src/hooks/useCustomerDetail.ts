import {
    getCustomerDetail,
    getDealDetail,
    getLeadDetail,
    updateLeadField,
    updateLeadTags,
    updateLeadStep,
    updateCustomerField,
    linkLeadToCustomer,
    unLinkLeadToCustomer,
    assignCustomer,
} from "@/api/customerV2";
import { updateLeadAssignee, updateLeadFollower } from "@/api/leadV2";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomerDetailResponse } from "@/lib/customerDetailTypes";
import { ApiResponseSingle, DetailDeal, DetailLead } from "@/lib/interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useCustomerDetailApi(orgId: string, cid: string) {
    return useQuery<CustomerDetailResponse>({
        queryKey: ["customerDetail", orgId, cid],
        queryFn: () =>
            getCustomerDetail(orgId, cid) as Promise<CustomerDetailResponse>,
        enabled: !!orgId && !!cid,
        staleTime: 0, // 0.5 minutes
    });
}

export function useLeadDetailApi(orgId: string, cid: string) {
    return useQuery<ApiResponseSingle<DetailLead>>({
        queryKey: ["lead-detail-api", orgId, cid],
        queryFn: () =>
            getLeadDetail(orgId, cid) as Promise<ApiResponseSingle<DetailLead>>,
        enabled: !!orgId && !!cid,
        staleTime: 0, // 0.5 minutes
    });
}

export function useDealDetailApi(orgId: string, cid: string) {
    return useQuery<ApiResponseSingle<DetailDeal>>({
        queryKey: ["deal-detail-api", orgId, cid],
        queryFn: () =>
            getDealDetail(orgId, cid) as Promise<ApiResponseSingle<DetailDeal>>,
        enabled: !!orgId && !!cid,
        staleTime: 0, // 0.5 minutes
    });
}

export function useAssignLead(orgId: string, leadId: string, showToast = true) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateLeadAssignee(orgId, leadId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                if (showToast) {
                    toast.success(t("success.assignLead"));
                }
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            if (showToast) {
                toast.error(t("error.assignLead"));
            }
            console.error("Error assigning lead:", error);
        },
    });
}

export function useUpdateLeadFollower(
    orgId: string,
    leadId: string,
    showToast = true
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateLeadFollower(orgId, leadId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                if (showToast) {
                    toast.success(t("success.assignLead"));
                }
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            if (showToast) {
                toast.error(t("error.assignLead"));
            }
            console.error("Error assigning lead:", error);
        },
    });
}

export function useUpdateLeadField(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateLeadField(orgId, leadId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateLead"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["leadDetail", orgId, leadId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateLead"));
            console.error("Error updating lead field:", error);
        },
    });
}

export function useUpdateCustomerField(
    orgId: string,
    customerId: string,
    leadId?: string
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateCustomerField(orgId, customerId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateLead"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["customerDetail", orgId, customerId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["detailConversation", orgId, leadId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateLead"));
            console.error("Error updating customer field:", error);
        },
    });
}

export function useUpdateLeadTags(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateLeadTags(orgId, leadId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateLead"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateLead"));
            console.error("Error updating lead tags:", error);
        },
    });
}

export function useUpdateCustomerTags(
    orgId: string,
    customerId: string,
    leadId: string
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) =>
            updateCustomerField(orgId, customerId, { tags: body.tags }),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateLead"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateLead"));
            console.error("Error updating customer tags:", error);
        },
    });
}

export function useUpdateLeadStep(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => updateLeadStep(orgId, leadId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateLead"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateLead"));
            console.error("Error updating lead step:", error);
        },
    });
}

export function useLinkLeadToCustomer(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => linkLeadToCustomer(orgId, leadId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.link"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.link"));
            console.error("Error linking lead to customer:", error);
        },
    });
}

export function useUnlinkLeadToCustomer(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => unLinkLeadToCustomer(orgId, leadId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.unlink"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.unlink"));
            console.error("Error unlinking lead to customer:", error);
        },
    });
}

export function useAssignCustomer(orgId: string, customerId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => assignCustomer(orgId, customerId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.update"));
                queryClient.invalidateQueries({
                    queryKey: ["customerDetail", orgId, customerId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.update"));
            console.error("Error assigning customer:", error);
        },
    });
}

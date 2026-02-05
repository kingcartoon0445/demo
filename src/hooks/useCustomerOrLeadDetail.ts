import { useQuery } from "@tanstack/react-query";
import { getLeadDetail, getCustomerDetail } from "@/api/customerV2";

interface UseCustomerOrLeadDetailProps {
    orgId: string;
    customerId?: string;
    leadId?: string;
    workspaceId?: string;
    enabled?: boolean;
}

export function useCustomerOrLeadDetail({
    orgId,
    customerId,
    leadId,
    workspaceId,
    enabled = true,
}: UseCustomerOrLeadDetailProps) {
    // Ưu tiên customerId trước leadId
    const shouldFetchCustomer = !!customerId && enabled;
    const shouldFetchLead = !!leadId && !customerId && enabled;

    const customerQuery = useQuery({
        queryKey: ["customerDetail", orgId, customerId],
        queryFn: async ({ signal }) => {
            if (!customerId || !workspaceId) return null;
            return await getCustomerDetail(orgId, customerId);
        },
        enabled: shouldFetchCustomer && !!workspaceId,
        staleTime: 0, // 5 minutes
    });

    const leadQuery = useQuery({
        queryKey: ["leadDetail", orgId, leadId],
        queryFn: async () => {
            if (!leadId) return null;
            return await getLeadDetail(orgId, leadId);
        },
        enabled: shouldFetchLead,
        staleTime: 0, // 5 minutes
    });

    // Trả về data từ customer hoặc lead tùy theo priority
    const data = shouldFetchCustomer ? customerQuery.data : leadQuery.data;
    const isLoading = shouldFetchCustomer
        ? customerQuery.isLoading
        : leadQuery.isLoading;
    const error = shouldFetchCustomer ? customerQuery.error : leadQuery.error;
    const refetch = shouldFetchCustomer
        ? customerQuery.refetch
        : leadQuery.refetch;

    return {
        data,
        isLoading,
        error,
        refetch,
        isCustomer: shouldFetchCustomer,
        isLead: shouldFetchLead,
    };
}

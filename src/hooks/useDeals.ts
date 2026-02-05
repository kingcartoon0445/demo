import {
    createDeal,
    convertToDeal,
    getDealStages,
    updateFlowStep,
} from "@/api/deals";
import { getAccessToken } from "@/lib/authCookies";
import { ApiResponse, DealStage } from "@/lib/interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useDealStages(orgId?: string, workspaceId?: string) {
    // Get orgId and workspaceId from URL or context if not provided
    const currentOrgId =
        orgId || typeof window !== "undefined"
            ? window.location.pathname.split("/")[2]
            : "";
    const currentWorkspaceId = workspaceId || "";

    return useQuery<ApiResponse<DealStage[]>>({
        queryKey: ["dealStages", currentOrgId, currentWorkspaceId],
        queryFn: () => getDealStages(currentOrgId, currentWorkspaceId),
        enabled: !!currentOrgId && !!getAccessToken(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

interface ConvertToDealPayload {
    orgId: string;
    workspaceId: string;
    customerId: string;
    data: any;
}

export function useConvertToDeal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            orgId,
            workspaceId,
            customerId,
            data,
        }: ConvertToDealPayload) => {
            return await convertToDeal(orgId, workspaceId, customerId, data);
        },
        onSuccess: () => {
            toast.success("Chuyển sang chốt khách thành công");
            queryClient.invalidateQueries({ queryKey: ["infinite-leads"] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
        onError: () => {
            toast.error("Chuyển sang chốt khách thất bại");
        },
    });
}

export function useUpdateFlowStep(orgId: string, cid: string) {
    return useMutation({
        mutationFn: async (body: any) => {
            return await updateFlowStep(orgId, cid, body);
        },
        onSuccess: () => {
            toast.success("Cập nhật giai đoạn thành công");
        },
        onError: () => {
            toast.error("Cập nhật giai đoạn thất bại");
        },
    });
}

export function useCreateDeal() {
    return useMutation({
        mutationFn: async ({ orgId, body }: { orgId: string; body: any }) => {
            return await createDeal(orgId, body);
        },
        onSuccess: () => {
            toast.success("Tạo chốt khách thành công");
        },
        onError: () => {
            toast.error("Tạo chốt khách thất bại");
        },
    });
}

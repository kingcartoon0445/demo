import { deleteStage, updateStageIndex } from "@/api/category";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useDeleteStage(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: string | { id: string; targetId?: string }) => {
            if (typeof params === "string") {
                return deleteStage(orgId, params);
            } else {
                return deleteStage(orgId, params.id, params.targetId);
            }
        },
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({ queryKey: ["stages"] });
                toast.success(t("success.deleteStage"));
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteStage"));
        },
    });
}

export function useUpdateStage(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => updateStageIndex(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({ queryKey: ["stages"] });
                toast.success(t("success.updateStage"));
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateStage"));
        },
    });
}

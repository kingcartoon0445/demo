import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTaskColumnConfig, updateTaskColumnConfig } from "@/api/config";
import { TaskColumnConfig } from "@/interfaces/config";
import toast from "react-hot-toast";

export const useTaskColumnConfig = (orgId: string) => {
    return useQuery({
        queryKey: ["task-column-config", orgId],
        queryFn: () => getTaskColumnConfig(orgId),
    });
};

export const useUpdateTaskColumnConfig = (orgId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (config: TaskColumnConfig) =>
            updateTaskColumnConfig(orgId, config),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["task-column-config", orgId],
            });
            toast.success("Cập nhật cấu hình thành công");
        },
        onError: (error) => {
            toast.error("Cập nhật cấu hình thất bại");
            console.error(error);
        },
    });
};

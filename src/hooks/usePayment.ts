import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { getSubscriptionPackages, getWalletDetail } from "@/api/payment";
import { ApiResponseSingle, WalletDetail } from "@/lib/interface";

export const useWalletDetail = (orgId: string) => {
    return useQuery<ApiResponseSingle<WalletDetail>>({
        queryKey: ["wallet-detail", orgId],
        queryFn: () =>
            getWalletDetail(orgId) as Promise<ApiResponseSingle<WalletDetail>>,
        enabled: !!orgId,
    });
};

export const useSubscriptionPackages = (orgId: string) => {
    return useQuery({
        queryKey: ["subscription-packages", orgId],
        queryFn: () => getSubscriptionPackages(orgId),
        enabled: !!orgId,
    });
};

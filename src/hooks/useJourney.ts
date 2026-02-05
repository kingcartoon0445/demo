import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { JourneyResponse } from "@/lib/journeyUtils";
import { getJourneyList, getLeadJourneyList } from "@/api/customerV2";
import { getTaskJourney } from "@/api/businessProcess";
import { ProductApiResponse } from "@/lib/interface";
import { TaskJourney } from "@/interfaces/businessProcess";

/**
 * Fetch journey timeline data cho customer
 */
export function useCustomerJourney(
    orgId: string,
    customerId: string,
    limit: number = 20,
    offset: number = 0
) {
    return useQuery<JourneyResponse>({
        queryKey: ["customer-journey", orgId, customerId, limit, offset],
        queryFn: () => getJourneyList(orgId, customerId, offset, limit),
        enabled: !!orgId && !!customerId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Infinite query cho journey timeline
 */
export function useInfiniteCustomerJourney(
    orgId: string,
    customerId: string,
    limit: number = 20,
    type: string = ""
) {
    return useInfiniteQuery<JourneyResponse>({
        queryKey: ["infinite-customer-journey", orgId, customerId, limit, type],
        queryFn: ({ pageParam = 0 }) =>
            getJourneyList(orgId, customerId, pageParam as number, limit, type),
        enabled: !!orgId && !!customerId,
        getNextPageParam: (lastPage) => {
            try {
                // Kiểm tra metadata tồn tại
                if (!lastPage.metadata) {
                    return undefined;
                }

                const currentOffset = lastPage.metadata.offset;
                const currentLimit = lastPage.metadata.limit;
                const total = lastPage.metadata.total;

                const hasMore = currentOffset + currentLimit < total;

                if (!hasMore || lastPage.content.length === 0) {
                    return undefined;
                }

                const nextOffset = currentOffset + currentLimit;
                return nextOffset;
            } catch (error) {
                console.error("Error in getNextPageParam:", error);
                return undefined;
            }
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        initialPageParam: 0,
    });
}

/**
 * Infinite query cho journey timeline
 */
export function useInfiniteLeadJourney(
    orgId: string,
    leadId: string,
    limit: number = 20,
    type: string = ""
) {
    return useInfiniteQuery<JourneyResponse>({
        queryKey: ["infinite-lead-journey", orgId, leadId, limit, type],
        queryFn: ({ pageParam = 0 }) =>
            getLeadJourneyList(orgId, leadId, pageParam as number, limit, type),
        enabled: !!orgId && !!leadId,
        getNextPageParam: (lastPage) => {
            try {
                // Kiểm tra metadata tồn tại
                if (!lastPage.metadata) {
                    return undefined;
                }

                const currentOffset = lastPage.metadata.offset;
                const currentLimit = lastPage.metadata.limit;
                const total = lastPage.metadata.total;

                const hasMore = currentOffset + currentLimit < total;

                if (!hasMore || lastPage.content.length === 0) {
                    return undefined;
                }

                const nextOffset = currentOffset + currentLimit;
                return nextOffset;
            } catch (error) {
                return undefined;
            }
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        initialPageParam: 0,
    });
}

/**
 * Unified infinite journey hook to keep hook count stable regardless of provider
 */
export function useInfiniteJourney(
    provider: "bpt" | "lead" | "customer",
    orgId: string,
    id: string,
    limit: number = 20,
    type: string = ""
) {
    // Always call hooks in a stable order to respect Rules of Hooks
    const taskQuery = useInfiniteQuery<ProductApiResponse<TaskJourney>>({
        queryKey: ["taskJourney", orgId, id, type],
        queryFn: ({ pageParam = 0 }) =>
            getTaskJourney(orgId, id, {
                page: pageParam as number,
                pageSize: limit,
                type,
            }),
        getNextPageParam: (lastPage) => {
            try {
                if (!lastPage || !lastPage.pagination) {
                    return undefined;
                }
                const currentPage = lastPage.pagination.pageNumber;
                const totalPages = lastPage.pagination.totalPages;
                const nextPage = currentPage + 1;
                return nextPage <= totalPages ? nextPage : undefined;
            } catch (e) {
                return undefined;
            }
        },
        initialPageParam: 0,
        enabled: provider === "bpt" && !!orgId && !!id,
        staleTime: 0,
    });

    const isLead = provider === "lead";
    const leadOrCustomerQuery = useInfiniteQuery<JourneyResponse>({
        queryKey: [
            isLead ? "infinite-lead-journey" : "infinite-customer-journey",
            orgId,
            id,
            limit,
            type,
        ],
        queryFn: ({ pageParam = 0 }) =>
            (isLead
                ? getLeadJourneyList(
                      orgId,
                      id,
                      pageParam as number,
                      limit,
                      type
                  )
                : getJourneyList(
                      orgId,
                      id,
                      pageParam as number,
                      limit,
                      type
                  )) as any,
        enabled: provider !== "bpt" && !!orgId && !!id,
        getNextPageParam: (lastPage) => {
            try {
                if (!lastPage.metadata) return undefined;
                const currentOffset = lastPage.metadata.offset;
                const currentLimit = lastPage.metadata.limit;
                const total = lastPage.metadata.total;
                const hasMore = currentOffset + currentLimit < total;
                if (!hasMore || lastPage.content.length === 0) return undefined;
                return currentOffset + currentLimit;
            } catch (e) {
                return undefined;
            }
        },
        staleTime: 2 * 60 * 1000,
        initialPageParam: 0,
    });

    return (provider === "bpt" ? taskQuery : leadOrCustomerQuery) as any;
}

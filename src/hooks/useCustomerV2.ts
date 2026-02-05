import { updateStage } from "@/api/category";
import {
    archiveLead,
    archiveRestoreLead,
    createCustomer,
    createLead,
    createTag,
    deleteCustomerNote,
    deleteLead,
    deleteNote,
    editCustomerNote,
    editNote,
    getCustomerDetail,
    getCustomerList,
    getCustomerListByPost,
    getCustomerListV2ByPost,
    getCustomerTags,
    getDealList,
    getLeadList,
    getLeadListV2ByPost,
    noteCustomer,
    noteLead,
    updateCustomerStage,
    updateLeadAvatar,
    uploadAttachment,
    uploadAttachmentCustomer,
    deleteTag,
} from "@/api/customerV2";
import {
    bulkArchiveLead,
    bulkArchiveRestoreLead,
    bulkDeleteLead,
    deleteAttachment,
} from "@/api/leadV2";

import { useLanguage } from "@/contexts/LanguageContext";
import { getAccessToken } from "@/lib/authCookies";
import { CustomerTag } from "@/lib/customerDetailTypes";
import { ApiResponse, Customer, Lead, QueryParams } from "@/lib/interface";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useCustomers(
    orgId: string,
    limit: number = 10,
    offset: number = 0,
    startDate: string = "null",
    endDate: string = "null",
    isBusiness: boolean = false,
    searchText: string = "",
) {
    return useQuery<ApiResponse<Customer>>({
        queryKey: [
            "customers",
            orgId,
            limit,
            offset,
            startDate,
            endDate,
            isBusiness,
            searchText,
        ],
        queryFn: () =>
            getCustomerList(
                orgId,
                limit,
                offset,
                startDate,
                endDate,
                isBusiness,
                searchText,
            ),
        enabled: !!orgId,
        staleTime: 0, // 5 minutes
    });
}

export function useLeads(
    orgId: string,
    limit: number = 10,
    offset: number = 0,
    startDate: string = "null",
    endDate: string = "null",
) {
    return useQuery<ApiResponse<Lead>>({
        queryKey: ["leads", orgId, limit, offset, startDate, endDate],
        queryFn: () => getLeadList(orgId, limit, offset, startDate, endDate),
        enabled: !!orgId,
        staleTime: 0, // 5 minutes
    });
}

export function useDeals(orgId: string, params: object, enabled: boolean) {
    return useQuery({
        queryKey: ["deals", orgId, params],
        queryFn: () => getDealList(orgId, params),
        enabled: !!orgId && !!getAccessToken() && enabled,
        staleTime: 0, // 5 minutes
    });
}

// Infinite Query Hooks
export function useInfiniteLeads(
    orgId: string,
    limit: number = 20,
    startDate: string = "",
    endDate: string = "",
    tags: string[] = [],
    sourceIds: string[] = [],
    utmSources: string[] = [],
    assignees: string[] = [],
    searchText: string = "",
    isArchive: boolean = false,
) {
    return useInfiniteQuery<ApiResponse<Lead>>({
        queryKey: [
            "infinite-leads",
            orgId,
            limit,
            startDate,
            endDate,
            tags,
            sourceIds,
            utmSources,
            assignees,
            searchText,
            isArchive,
        ],
        queryFn: ({ pageParam = 0 }) =>
            getLeadList(
                orgId,
                limit,
                pageParam as number,
                startDate,
                endDate,
                tags,
                sourceIds,
                utmSources,
                assignees,
                searchText,
                isArchive,
            ),
        enabled: !!orgId,
        getNextPageParam: (lastPage) => {
            // Kiểm tra nếu không còn data hoặc đã lấy hết
            const currentOffset = lastPage.metadata.offset;
            const currentLimit = lastPage.metadata.limit;
            const total = lastPage.metadata.total;
            const returnedCount = Array.isArray(lastPage.content)
                ? lastPage.content.length
                : 0;

            // Nếu số lượng trả về ít hơn limit hoặc đã đạt total thì dừng
            const hasMore =
                returnedCount === limit && currentOffset + currentLimit < total;

            if (!hasMore) {
                return undefined;
            }
            // Trả về offset cho trang tiếp theo
            return currentOffset + currentLimit;
        },
        staleTime: 0, // 5 minutes
        initialPageParam: 0,
    });
}

export function useCustomerList(
    orgId: string,
    limit: number = 10,
    offset: number = 0,
    startDate: string = "null",
    endDate: string = "null",
) {
    return useQuery<ApiResponse<Customer>>({
        queryKey: ["customers", orgId, limit, offset, startDate, endDate],
        queryFn: () =>
            getCustomerList(orgId, limit, offset, startDate, endDate),
        enabled: !!orgId,
        staleTime: 0, // 5 minutes
    });
}

export function useCustomerListByPost(
    orgId: string,
    body: any,
    options?: { enabled?: boolean },
) {
    return useQuery<ApiResponse<Customer>>({
        queryKey: ["customers-by-post", orgId, body],
        queryFn: () => getCustomerListByPost(orgId, body || {}),
        enabled: !!orgId && (options?.enabled ?? true),
    });
}

export function useInfiniteCustomers(
    orgId: string,
    limit: number = 20,
    startDate: string = "null",
    endDate: string = "null",
) {
    return useInfiniteQuery<ApiResponse<Customer>>({
        queryKey: ["infinite-customers", orgId, limit, startDate, endDate],
        queryFn: ({ pageParam = 0 }) =>
            getCustomerList(
                orgId,
                limit,
                pageParam as number,
                startDate,
                endDate,
            ),
        enabled: !!orgId,
        getNextPageParam: (lastPage) => {
            const currentOffset = lastPage.metadata.offset;
            const currentLimit = lastPage.metadata.limit;
            const total = lastPage.metadata.total;
            const returnedCount = Array.isArray(lastPage.content)
                ? lastPage.content.length
                : 0;

            // Nếu số lượng trả về ít hơn limit hoặc đã đạt total thì dừng
            const hasMore =
                returnedCount === limit && currentOffset + currentLimit < total;

            if (!hasMore) {
                return undefined;
            }
            return currentOffset + currentLimit;
        },
        staleTime: 0, // 5 minutes
        initialPageParam: 0,
    });
}

export function useCustomerDetail(orgId: string, cid: string) {
    return useQuery<ApiResponse<Customer>>({
        queryKey: ["customer-detail", orgId, cid],
        queryFn: () => getCustomerDetail(orgId, cid),
        enabled: !!orgId && !!cid,
        staleTime: 0, // 5 minutes
    });
}

export function useGetCustomerTags(orgId: string, params: object) {
    return useQuery<ApiResponse<CustomerTag[]>>({
        queryKey: ["customer-tags", orgId],
        queryFn: () => getCustomerTags(orgId, params),
        enabled: !!orgId,
        staleTime: 0,
    });
}

export function useCreateTag(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: any) => createTag(orgId, body),
        onSuccess: (res: any) => {
            toast.success(t("success.createTag"));
            queryClient.invalidateQueries({
                queryKey: ["customer-tags", orgId],
            });
        },
        onError: (error) => {
            toast.error(t("error.createTag"));
        },
    });
}

export function useCreateCustomer(orgId: string, showToast: boolean = true) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createCustomer(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                if (showToast) {
                    toast.success(t("success.createCustomer"));
                }
                // queryClient.invalidateQueries({ queryKey: ["customers"] });
                queryClient.invalidateQueries({
                    queryKey: ["customersV2-by-post", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.createCustomer"));
        },
    });
}

export function useCreateLead(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createLead(orgId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.createCustomer"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.createCustomer"));
        },
    });
}

export function useUpdateCustomerStage(orgId: string, customerId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => updateCustomerStage(orgId, customerId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateCustomerStage"));
                queryClient.invalidateQueries({ queryKey: ["customers"] });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateCustomerStage"));
        },
    });
}

export function useNoteCustomer(orgId: string, customerId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => noteCustomer(orgId, customerId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.noteCustomer"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-customer-journey"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.noteCustomer"));
        },
    });
}

export function useNoteLead(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => noteLead(orgId, leadId, data),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.noteLead"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.noteLead"));
        },
    });
}

export function useUpdateStage(orgId: string, stageId?: string) {
    // Removed console.log to prevent excessive logging
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            // Sử dụng stageId từ data nếu có, nếu không thì sử dụng stageId từ tham số
            const targetStageId = data.stageId || stageId;
            if (!targetStageId) {
                throw new Error("stageId is required");
            }

            // Tạo body đúng cấu trúc
            const body = {
                name: data.name || "",
                groupId: data.groupId || "",
                description: data.description || "",
            };

            // Gọi API updateStage với đúng tham số
            return updateStage(orgId, targetStageId, body);
        },
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateStage"));
                queryClient.invalidateQueries({ queryKey: ["deals"] });
                queryClient.invalidateQueries({ queryKey: ["deals-by-stage"] });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.updateStage"));
            console.error("Error updating stage:", error);
        },
    });
}

export function useArchiveLead() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    interface ArchiveParams {
        orgId: string;
        customerId: string;
        onArchiveSuccess?: (data: any) => void;
    }

    return useMutation({
        mutationFn: ({ orgId, customerId }: ArchiveParams) =>
            archiveLead(orgId, customerId),
        onSuccess: (res: any, variables, context) => {
            if (res.code === 0) {
                toast.success(t("success.archiveCustomer"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                // Đảm bảo invalidateQueries hoàn thành trước khi gọi callback
                return queryClient
                    .invalidateQueries({
                        queryKey: ["infinite-leads-body-filter"],
                    })
                    .then(() => {
                        // Gọi callback sau khi invalidate hoàn thành
                        if (typeof variables.onArchiveSuccess === "function") {
                            variables.onArchiveSuccess(null);
                        }
                    });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.archiveCustomer"));
        },
    });
}

export function useArchiveRestoreLead() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    interface ArchiveRestoreParams {
        orgId: string;
        customerId: string;
        onArchiveSuccess?: (data: any) => void;
    }

    return useMutation({
        mutationFn: ({ orgId, customerId }: ArchiveRestoreParams) =>
            archiveRestoreLead(orgId, customerId),
        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                toast.success(t("success.archiveRestoreCustomer"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                // Đảm bảo invalidateQueries hoàn thành trước khi gọi callback
                return queryClient
                    .invalidateQueries({
                        queryKey: ["infinite-leads-body-filter"],
                    })
                    .then(() => {
                        // Gọi callback sau khi invalidate hoàn thành
                        if (typeof variables.onArchiveSuccess === "function") {
                            variables.onArchiveSuccess(null);
                        }
                    });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.archiveRestoreCustomer"));
        },
    });
}

export function useBulkArchiveLead(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ body }: any) => bulkArchiveLead(orgId, body),
        onSuccess: (res: any, variables, context) => {
            if (res.code === 0) {
                toast.success(t("success.archiveCustomer"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                // Đảm bảo invalidateQueries hoàn thành trước khi gọi callback
                return queryClient
                    .invalidateQueries({
                        queryKey: ["infinite-leads-body-filter"],
                    })
                    .then(() => {
                        // Gọi callback sau khi invalidate hoàn thành
                        if (typeof variables.onArchiveSuccess === "function") {
                            variables.onArchiveSuccess(null);
                        }
                    });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.archiveCustomer"));
        },
    });
}

export function useBulkArchiveRestoreLead(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ body }: any) => bulkArchiveRestoreLead(orgId, body),
        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                toast.success(t("success.archiveRestoreCustomer"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                // Đảm bảo invalidateQueries hoàn thành trước khi gọi callback
                return queryClient
                    .invalidateQueries({
                        queryKey: ["infinite-leads-body-filter"],
                    })
                    .then(() => {
                        // Gọi callback sau khi invalidate hoàn thành
                        if (typeof variables.onArchiveSuccess === "function") {
                            variables.onArchiveSuccess(null);
                        }
                    });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.archiveRestoreCustomer"));
        },
    });
}

export function useDeleteLead() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    interface DeleteParams {
        orgId: string;
        customerId: string;
        onDeleteSuccess?: (data: any) => void;
    }

    return useMutation({
        mutationFn: ({ orgId, customerId }: DeleteParams) =>
            deleteLead(orgId, customerId),
        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                toast.success(t("success.deleteCustomer"));

                // Đảm bảo invalidateQueries hoàn thành trước khi gọi callback
                return queryClient
                    .invalidateQueries({
                        queryKey: ["infinite-leads-body-filter"],
                    })
                    .then(() => {
                        // Gọi callback sau khi invalidate hoàn thành
                        if (typeof variables.onDeleteSuccess === "function") {
                            variables.onDeleteSuccess(null);
                        }
                    });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteCustomer"));
        },
    });
}

export function useBulkDeleteLead(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ body }: any) => bulkDeleteLead(orgId, body),
        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                toast.success(t("success.deleteCustomer"));

                // Đảm bảo invalidateQueries hoàn thành trước khi gọi callback
                return queryClient
                    .invalidateQueries({
                        queryKey: ["infinite-leads-body-filter"],
                    })
                    .then(() => {
                        // Gọi callback sau khi invalidate hoàn thành
                        if (typeof variables.onDeleteSuccess === "function") {
                            variables.onDeleteSuccess(null);
                        }
                    });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteCustomer"));
        },
    });
}

export function useUploadAttachment(orgId: string, lead: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) => uploadAttachment(orgId, lead, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("common.uploadAttachmentSuccess"));
                queryClient.invalidateQueries({
                    queryKey: ["lead", orgId, lead],
                });
                // Invalidate all journey related queries
                queryClient.invalidateQueries({
                    queryKey: ["infinite-customer-journey"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["taskJourney"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("common.uploadAttachmentFailed"));
        },
    });
}

export function useUploadAttachmentCustomer(orgId: string, customerId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) =>
            uploadAttachmentCustomer(orgId, customerId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("common.uploadAttachmentSuccess"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-customer-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("common.uploadAttachmentFailed"));
        },
    });
}

export function useEditNote(orgId: string, leadId: string, journeyId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) => editNote(orgId, leadId, journeyId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.editNote"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.editNote"));
            console.error(error);
        },
    });
}

export function useDeleteNote(
    orgId: string,
    leadId: string,
    journeyId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deleteNote(orgId, leadId, journeyId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.deleteNote"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteNote"));
            console.error(error);
        },
    });
}

export function useDeleteCustomerNote(
    orgId: string,
    customerId: string,
    journeyId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deleteCustomerNote(orgId, customerId, journeyId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.deleteNote"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-customer-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteNote"));
            console.error(error);
        },
    });
}

export function useEditCustomerNote(
    orgId: string,
    customerId: string,
    journeyId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) =>
            editCustomerNote(orgId, customerId, journeyId, body),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.editNote"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-customer-journey"],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.editNote"));
            console.error(error);
        },
    });
}

export function useLeadsV2(
    orgId: string,
    params: object,
    options?: { enabled?: boolean },
) {
    return useQuery<ApiResponse<Lead>>({
        queryKey: ["leadsV2", orgId, params],
        queryFn: () => getLeadListV2ByPost(orgId, params),
        enabled: !!orgId && (options?.enabled ?? true),
        staleTime: 0, // 5 minutes
    });
}

export function useDeleteTag(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (tagId: string) => deleteTag(orgId, tagId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.deleteTag"));
                queryClient.invalidateQueries({
                    queryKey: ["customer-tags", orgId],
                });
            } else {
                toast.error(res.message);
            }
        },
        onError: (error) => {
            toast.error(t("error.deleteTag"));
        },
    });
}

export function useCustomerListV2ByPost(
    orgId: string,
    body: any,
    options?: { enabled?: boolean },
) {
    return useQuery<ApiResponse<Customer>>({
        queryKey: ["customersV2-by-post", orgId, body],
        queryFn: () => getCustomerListV2ByPost(orgId, body || {}),
        enabled: !!orgId && (options?.enabled ?? true),
    });
}

export function useInfiniteLeadsV2(
    orgId: string,
    params: QueryParams,
    options?: { enabled?: boolean },
) {
    return useInfiniteQuery<ApiResponse<Lead>>({
        queryKey: ["infinite-leadsV2", orgId, params],
        queryFn: ({ pageParam = 0 }) =>
            getLeadListV2ByPost(orgId, {
                ...params,
                offset: pageParam as number,
                limit: params.limit,
            }),
        enabled: !!orgId && (options?.enabled ?? true),
        getNextPageParam: (lastPage) => {
            // Kiểm tra nếu không còn data hoặc đã lấy hết
            const currentOffset = lastPage.metadata.offset;
            const currentLimit = lastPage.metadata.limit;
            const total = lastPage.metadata.total;
            const returnedCount = Array.isArray(lastPage.content)
                ? lastPage.content.length
                : 0;

            // Nếu số lượng trả về ít hơn limit hoặc đã đạt total thì dừng
            const hasMore =
                returnedCount === (params.limit ?? lastPage.metadata.limit) &&
                currentOffset + currentLimit < total;

            if (!hasMore) {
                return undefined;
            }
            // Trả về offset cho trang tiếp theo
            return currentOffset + currentLimit;
        },
        staleTime: 0, // 5 minutes
        initialPageParam: 0,
    });
}

// Hook mới sử dụng body filter thay vì URL params
export function useInfiniteLeadsWithBodyFilter(
    orgId: string,
    filterBody: any,
    options?: { enabled?: boolean },
) {
    return useInfiniteQuery<ApiResponse<Lead>>({
        queryKey: ["infinite-leads-body-filter", orgId, filterBody],
        queryFn: async ({ pageParam = 0 }) =>
            getLeadListV2ByPost(orgId, {
                ...filterBody,
                offset: pageParam,
                limit: filterBody.limit || 20,
            }),
        enabled: !!orgId && (options?.enabled ?? true),
        getNextPageParam: (lastPage) => {
            if (lastPage.metadata) {
                const currentOffset = lastPage.metadata.offset;
                const currentLimit = lastPage.metadata.limit;
                const total = lastPage.metadata.total;
                const returnedCount = Array.isArray(lastPage.content)
                    ? lastPage.content.length
                    : 0;

                const hasMore =
                    returnedCount === currentLimit &&
                    currentOffset + currentLimit < total;

                return hasMore ? currentOffset + currentLimit : undefined;
            }
        },
        staleTime: 0, // 5 minutes
        initialPageParam: 0,
    });
}

export function useInfiniteCustomersV2ByPost(
    orgId: string,
    body: any,
    options?: { enabled?: boolean },
) {
    return useInfiniteQuery<ApiResponse<Customer>>({
        queryKey: ["infinite-customersV2-by-post", orgId, body],
        queryFn: async ({ pageParam = 0 }) =>
            getCustomerListV2ByPost(orgId, {
                ...body,
                offset: pageParam,
                limit: body?.limit || 20,
            }),
        enabled: !!orgId && (options?.enabled ?? true),
        getNextPageParam: (lastPage) => {
            const currentOffset = lastPage.metadata.offset;
            const currentLimit = lastPage.metadata.limit;
            const total = lastPage.metadata.total;
            const returnedCount = Array.isArray(lastPage.content)
                ? lastPage.content.length
                : 0;
            const hasMore =
                returnedCount === currentLimit &&
                currentOffset + currentLimit < total;
            return hasMore ? currentOffset + currentLimit : undefined;
        },
        staleTime: 0,
        initialPageParam: 0,
    });
}

export function useDeleteAttachment(
    orgId: string,
    leadId: string,
    journeyId: string,
) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deleteAttachment(orgId, leadId, journeyId),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.deleteAttachment"));
                queryClient.invalidateQueries({
                    queryKey: ["infinite-lead-journey"],
                });
            } else {
                toast.error(t("error.deleteAttachment"));
            }
        },
        onError: (error) => {
            console.error(error);
            toast.error(t("error.deleteAttachment"));
        },
    });
}

export function useUpdateLeadAvatar(orgId: string, leadId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            updateLeadAvatar(orgId, leadId, formData),
        onSuccess: (res: any) => {
            if (res.code === 0) {
                toast.success(t("success.updateAvatar"));
                queryClient.invalidateQueries({
                    queryKey: ["lead-detail-api", orgId, leadId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
            } else {
                toast.error(t("error.updateAvatar"));
            }
        },
        onError: (error) => {
            console.error(error);
            toast.error(t("error.updateAvatar"));
        },
    });
}

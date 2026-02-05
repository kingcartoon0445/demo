import {
    createCategory,
    createMultipleProducts,
    createProduct,
    deleteImage,
    getCategory,
    getOrderDetail,
    getOrderDetailWithProduct,
    getPriceHistory,
    getProductDetail,
    getProducts,
    getTransactions,
    order,
    updateCategory,
    updateProduct,
    updateProductStatus,
    uploadImage,
    getUserProductColumnConfig,
    updateUserProductColumnConfig,
    updateProductAssignee,
} from "@/api/productV2";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Category,
    CreateUpdateProduct,
    PriceHistory,
    Product,
    ProductApiResponse,
    SingleProductApiResponse,
    Transaction,
} from "@/lib/interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
export function useGetProducts(
    orgId: string,
    params: {
        page?: number;
        pageSize?: number;
        search?: string;
        fromDate?: string;
        toDate?: string;
        status?: string;
        categoryId?: string;
        sortBy?: string;
        ascending?: string;
        isManage?: boolean;
    } = { page: 1, pageSize: 10, isManage: false },
    shouldFetch: boolean = false
) {
    return useQuery<ProductApiResponse<Product>>({
        queryKey: ["products", orgId, JSON.stringify(params)],
        queryFn: () => getProducts(orgId, params),
        enabled: shouldFetch,
        select: (data) => {
            // If pagination is null, create a default pagination object
            if (!data.pagination) {
                return {
                    ...data,
                    pagination: {
                        pageNumber: params.page || 1,
                        pageSize: params.pageSize || 10,
                        totalRecords: data.data.length,
                        totalPages: 1,
                    },
                };
            }
            return data;
        },
    });
}

export function useGetProductById(orgId: string, productId: string) {
    return useQuery<SingleProductApiResponse<Product>>({
        queryKey: ["product", orgId, productId],
        queryFn: () => getProductDetail(orgId, productId),
        enabled: !!orgId && !!productId,
    });
}

export function useCreateMutipleProducts(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { products: object[] }) =>
            createMultipleProducts(orgId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", orgId] });
            toast.success(t("common.createSuccess"));
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
}

export function useCreateProduct(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) => createProduct(orgId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products", orgId] });
            toast.success(t("common.createSuccess"));
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
}

export function useOrder(orgId: string) {
    return useMutation({
        mutationFn: (body: object) => order(orgId, body),
        onSuccess: () => {
            // toast.success("Đặt hàng thành công");
        },
        onError: (error) => {
            // toast.error("Đặt hàng thất bại");
        },
    });
}

export function useGetOrderDetail(orgId: string, id: string) {
    return useQuery({
        queryKey: ["orderDetail", orgId, id],
        queryFn: () => getOrderDetail(orgId, id),
        enabled: !!orgId && !!id,
    });
}

export function useGetOrderDetailWithProduct(
    orgId: string,
    customerId: string
) {
    return useQuery({
        queryKey: ["orderDetailWithProduct", orgId, customerId],
        queryFn: () => getOrderDetailWithProduct(orgId, customerId),
        enabled: !!orgId && !!customerId,
    });
}

export function useUpdateProduct(orgId: string, productId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateUpdateProduct) =>
            updateProduct(orgId, productId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["product", orgId, productId],
            });
            queryClient.invalidateQueries({ queryKey: ["products", orgId] });
            toast.success(t("common.updateSuccess"));
        },
        onError: (error) => {
            toast.error(t("common.updateFailed"));
        },
    });
}

export function useGetCategory(orgId: string) {
    return useQuery<ProductApiResponse<Category>>({
        queryKey: ["category", orgId],
        queryFn: () => getCategory(orgId),
        enabled: !!orgId,
    });
}

export function useCreateCategory(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) => createCategory(orgId, body),
        onSuccess: () => {
            toast.success(t("common.createSuccess"));
            queryClient.invalidateQueries({ queryKey: ["category", orgId] });
        },
        onError: (error) => {
            toast.error(t("common.createFailed"));
        },
    });
}

export function useUpdateCategory(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: object }) =>
            updateCategory(orgId, id, body),
        onSuccess: () => {
            toast.success(t("common.updateSuccess"));
            queryClient.invalidateQueries({ queryKey: ["category", orgId] });
        },
        onError: (error) => {
            toast.error(t("common.updateFailed"));
        },
    });
}

export function useUpdateImage(orgId: string, productId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: object) => uploadImage(orgId, productId, body),
        onSuccess: () => {
            toast.success(t("common.uploadImageSuccess"));
            queryClient.invalidateQueries({
                queryKey: ["product", orgId, productId],
            });
            queryClient.invalidateQueries({ queryKey: ["product", orgId] });
        },
        onError: (error) => {
            toast.error(t("common.uploadImageFailed"));
        },
    });
}

export function useDeleteImage(orgId: string, productId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (imageIndex: number) =>
            deleteImage(orgId, productId, imageIndex),
        onSuccess: () => {
            toast.success(t("common.deleteImageSuccess"));
            queryClient.invalidateQueries({
                queryKey: ["product", orgId, productId],
            });
            queryClient.invalidateQueries({ queryKey: ["product", orgId] });
        },
        onError: (error) => {
            toast.error(t("common.deleteImageFailed"));
        },
    });
}

export function useGetPriceHistory(
    orgId: string,
    productId: string,
    params: {
        page?: number;
        pageSize?: number;
    } = { page: 1, pageSize: 10 }
) {
    return useQuery<ProductApiResponse<PriceHistory>>({
        queryKey: ["priceHistory", orgId, productId, params],
        queryFn: () => getPriceHistory(orgId, productId, params),
        enabled: !!orgId && !!productId,
    });
}

export function useUpdateProductStatus(orgId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: number }) =>
            updateProductStatus(orgId, id, status),
        onSuccess: () => {
            toast.success(t("common.updateSuccess"));
            queryClient.invalidateQueries({ queryKey: ["products", orgId] });
        },
    });
}

export function useGetTransactions(
    orgId: string,
    productId: string,
    params: {
        page?: number;
        pageSize?: number;
        status?: number;
    }
) {
    return useQuery<ProductApiResponse<Transaction>>({
        queryKey: ["transactions", orgId, productId, params],
        queryFn: () => getTransactions(orgId, productId, params),
        enabled: !!orgId && !!productId,
    });
}

// Hook lấy cấu hình cột sản phẩm của user
export function useGetUserProductColumnConfig(orgId: string) {
    return useQuery({
        queryKey: ["userProductColumnConfig", orgId],
        queryFn: () => getUserProductColumnConfig(orgId),
        enabled: !!orgId,
    });
}

// Hook cập nhật cấu hình cột sản phẩm của user
export function useUpdateUserProductColumnConfig(orgId: string) {
    const { t } = useLanguage();
    return useMutation({
        mutationFn: (
            columns: Array<{
                columnKey: string;
                label: string;
                visible: boolean;
            }>
        ) => updateUserProductColumnConfig(orgId, columns),
        onSuccess: () => {
            toast.success(t("success.update"));
        },
        onError: (error) => {
            toast.error(t("error.update"));
        },
    });
}

export function useUpdateProductAssignee(orgId: string, productId: string) {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            body,
        }: {
            body: { assigneeIds: string[]; assigneeType: "OWNER" | "FOLLOWER" };
        }) => updateProductAssignee(orgId, productId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["product", orgId, productId],
            });
        },
        onError: (error) => {
            toast.error(t("error.updateAssignees"));
        },
    });
}

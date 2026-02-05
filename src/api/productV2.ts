import { createApiCall } from "@/lib/api";
import { configPaths, productPaths } from "@/lib/authConstants";
import { getAccessToken } from "@/lib/authCookies";
import {
    Category,
    CreateUpdateProduct,
    PriceHistory,
    Product,
    ProductApiResponse,
    SingleProductApiResponse,
    Transaction,
} from "@/lib/interface";

export async function getProducts(
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
    } = { isManage: false }
): Promise<ProductApiResponse<Product>> {
    const api = createApiCall(orgId);
    const response = await api.get(productPaths.product, {
        params: { ...params, isManage: params.isManage },
    });
    return response.data as ProductApiResponse<Product>;
}

export async function createProduct(orgId: string, body: object) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(productPaths.product, body);
        return response.data;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
}

export async function createMultipleProducts(
    orgId: string,
    body: { products: object[] }
) {
    const api = createApiCall(orgId);
    const response = await api.post(productPaths.product + "/bulk", body);
    return response.data;
}

export async function createCustomerProduct(
    orgId: string,
    workspaceId: string,
    customerId: string
) {
    const body = {
        workspaceId,
        customerId,
    };
    const api = createApiCall(orgId);
    const response = await api.post(productPaths.customerProduct, body);
    return response.data;
}

export async function getCustomerProducts(
    orgId: string,
    workspaceId: string,
    customerId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(productPaths.customerProduct, {
        params: { workspaceId, customerId },
    });
    return response.data;
}

export async function getProductDetail(orgId: string, id: string) {
    const api = createApiCall(orgId);
    const response = await api.get(productPaths.product + "/" + id);
    return response.data as SingleProductApiResponse<Product>;
}

export async function updateProduct(
    orgId: string,
    id: string,
    body: CreateUpdateProduct
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.put(productPaths.product + "/" + id, body);
        return response.data;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
}

export async function deleteProduct(orgId: string, id: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(productPaths.product + "/" + id);
    return response.data;
}

export async function order(orgId: string, body: object) {
    const api = createApiCall(orgId);
    const response = await api.post(productPaths.order, body);
    return response.data;
}

export async function getOrderDetail(orgId: string, id: string) {
    const api = createApiCall(orgId);
    const response = await api.get(productPaths.order + "/" + id);
    return response.data;
}

export async function getOrderDetailWithProduct(
    orgId: string,
    orderId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        productPaths.getOrderDetailWithProduct.replace("{id}", orderId)
    );
    return response.data;
}

export async function getCategory(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(productPaths.category);
    return response.data as ProductApiResponse<Category>;
}

export async function createCategory(orgId: string, body: object) {
    const api = createApiCall(orgId);
    const response = await api.post(productPaths.category, body);
    return response.data;
}

export async function updateCategory(orgId: string, id: string, body: object) {
    const api = createApiCall(orgId);
    const response = await api.put(productPaths.category + "/" + id, body);
    return response.data;
}

export async function uploadImage(orgId: string, id: string, body: object) {
    try {
        const accessToken = getAccessToken();

        // If body is not already FormData, convert JSON to FormData
        let formDataBody: FormData;
        if (body instanceof FormData) {
            formDataBody = body;
        } else {
            formDataBody = new FormData();
            // Convert JSON object to FormData
            Object.entries(body).forEach(([key, value]) => {
                if (Array.isArray(value) && value.length === 0) {
                    // Handle empty arrays specially
                    formDataBody.append(key, "");
                } else if (value === null) {
                    // Skip null values
                    return;
                } else {
                    formDataBody.append(key, value as string);
                }
            });
        }

        const res = await fetch(productPaths.product + "/" + id + "/images", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                organizationId: orgId,
                // Don't set Content-Type for FormData, browser will set it automatically
            },
            body: formDataBody,
        });

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
}

export async function deleteImage(
    orgId: string,
    id: string,
    imageIndex: number
) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        productPaths.product + "/" + id + "/images/" + imageIndex
    );
    return response.data;
}

export async function getPriceHistory(
    orgId: string,
    productId: string,
    params: {
        page?: number;
        pageSize?: number;
    }
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        productPaths.product + "/" + productId + "/price-history",
        { params }
    );
    return response.data as ProductApiResponse<PriceHistory>;
}

export async function updateProductStatus(
    orgId: string,
    id: string,
    status: number
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        productPaths.product + "/" + id + "/status",
        { status }
    );
    return response.data;
}

export async function getTransactions(
    orgId: string,
    productId: string,
    params: {
        page?: number;
        pageSize?: number;
        status?: number;
    }
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        productPaths.product + "/" + productId + "/transactions",
        { params }
    );
    return response.data as ProductApiResponse<Transaction>;
}

export async function updateTransactionStatus(
    orgId: string,
    id: string,
    status: number
) {
    const api = createApiCall(orgId);
    const response = await api.put(productPaths.order + "/" + id + "/status", {
        status,
    });
    return response.data;
}

// Lấy cấu hình cột sản phẩm của user
export async function getUserProductColumnConfig(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(
        productPaths.product + "/user-column-config"
    );
    return response.data as {
        success: boolean;
        message: string;
        data: {
            userId: string;
            columns: Array<{
                columnKey: string;
                label: string;
                visible: boolean;
            }>;
        };
    };
}

// Cập nhật cấu hình cột sản phẩm của user
export async function updateUserProductColumnConfig(
    orgId: string,
    columns: Array<{ columnKey: string; label: string; visible: boolean }>
) {
    const api = createApiCall(orgId);
    const response = await api.post(
        productPaths.product + "/user-column-config",
        {
            columns,
        }
    );
    return response.data;
}

export async function exportProduct(orgId: string, params: object) {
    const api = createApiCall(orgId);
    const response = await api.get(productPaths.product + "/export", {
        params,
        responseType: "blob", // Specify response type as blob for file download
    });
    return response.data;
}

export async function updateProductAssignee(
    orgId: string,
    id: string,
    body: {
        assigneeIds: string[];
        assigneeType: "OWNER" | "FOLLOWER";
    }
) {
    const api = createApiCall(orgId);
    const response = await api.put(
        productPaths.product + "/" + id + "/assignee",
        body
    );
    return response.data;
}

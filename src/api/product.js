import { inventoryPaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getProductList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(inventoryPaths.productList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getProductDetail(orgId, workspaceId, productId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(
            `${inventoryPaths.productDetail}${productId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createProduct(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(inventoryPaths.productCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateProduct(orgId, workspaceId, productId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.put(
            `${inventoryPaths.productUpdate}${productId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateProductStatus(orgId, workspaceId, productId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.put(
            `${inventoryPaths.productUpdateStatus}${productId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateProductBlock(orgId, workspaceId, productId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.put(
            `${inventoryPaths.productUpdateBlock}${productId}/updateblock`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteProduct(orgId, workspaceId, productId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${inventoryPaths.productDelete}${productId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getCategoryList(orgId, workspaceId, params) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.get(inventoryPaths.categoryList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createCategory(orgId, workspaceId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.post(inventoryPaths.categoryCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateCategory(orgId, workspaceId, categoryId, body) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.put(
            `${inventoryPaths.categoryUpdate}${categoryId}`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteCategory(orgId, workspaceId, categoryId) {
    try {
        const api = createApiCall(orgId, workspaceId);
        const response = await api.delete(
            `${inventoryPaths.categoryDelete}${categoryId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

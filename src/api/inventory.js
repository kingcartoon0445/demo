import { inventoryPaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

export async function getInventoryList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(inventoryPaths.inventoryList, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getInventoryDetail(orgId, inventoryId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${inventoryPaths.inventoryDetail}${inventoryId}/getdetail`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createInventory(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(inventoryPaths.inventoryCreate, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateInventory(orgId, inventoryId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${inventoryPaths.inventoryUpdate}${inventoryId}/update`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateInventoryStatus(orgId, inventoryId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${inventoryPaths.inventoryUpdateStatus}${inventoryId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateInventoryAvatar(orgId, inventoryId, file) {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
            `${inventoryPaths.inventoryUpdateAvatar}${inventoryId}/updateavatar`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "PATCH",
                body: formData,
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteInventory(orgId, inventoryId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${inventoryPaths.inventoryDelete}${inventoryId}/delete`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getInventoryTransactionList(orgId, inventoryId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(
            `${inventoryPaths.inventoryTransactionList}${inventoryId}/transaction/getlist`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createInventoryTransaction(orgId, inventoryId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            `${inventoryPaths.inventoryTransactionCreate}${inventoryId}/transaction/create`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function updateInventoryTransaction(
    orgId,
    inventoryId,
    transactionId,
    body
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${inventoryPaths.inventoryTransactionUpdate}${inventoryId}/transaction/${transactionId}/update`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function deleteInventoryTransaction(
    orgId,
    inventoryId,
    transactionId
) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${inventoryPaths.inventoryTransactionDelete}${inventoryId}/transaction/${transactionId}/delete`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

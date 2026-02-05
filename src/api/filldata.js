import { paymentPaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";

// Lấy danh sách workspace có dữ liệu đầy đủ
export async function getFillDataList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.getFillDataList, {
            params,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Cập nhật trạng thái của workspace
export async function updateFillDataStatus(orgId, fillDataId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.patch(
            `${paymentPaths.fillDataUpdateStatus}${fillDataId}/updatestatus`,
            body
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

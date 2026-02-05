import { paymentPaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";
import qs from "qs";
// Lấy danh sách gói nạp coin
export async function getCreditPackages(orgId, params) {
    try {
        const queryString = qs.stringify(params);
        const res = await fetch(
            `${paymentPaths.creditPackages}?${queryString}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy chi tiết gói nạp coin
export async function getCreditPackageDetail(orgId, id) {
    try {
        const res = await fetch(`${paymentPaths.creditPackageDetail}${id}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Nạp coin
export async function orderCredit(orgId, body) {
    try {
        const res = await fetch(`${paymentPaths.creditOrder}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(body),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Thanh toán gói nạp coin
export async function payCreditOrder(orgId, orderId, body) {
    try {
        const res = await fetch(
            `${paymentPaths.creditPayment}${orderId}/payment`,
            {
                method: "POST",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(body),
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Nạp coin và thanh toán
export async function orderAndPayCredit(orgId, body) {
    try {
        const res = await fetch(`${paymentPaths.creditOrderAndPayment}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(body),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy lịch sử nạp coin
export async function getCreditHistory(orgId, params) {
    try {
        const queryString = qs.stringify(params);
        const res = await fetch(
            `${paymentPaths.creditHistory}?${queryString}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// ... Các hàm khác cho gói chức năng và gói thuê bao có thể được thêm vào tương tự

// Lấy danh sách gói chức năng Coka
export async function getFeaturePackages(orgId, params) {
    try {
        const queryString = qs.stringify(params);
        const res = await fetch(
            `${paymentPaths.featurePackages}?${queryString}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy chi tiết gói chức năng Coka
export async function getFeaturePackageDetail(orgId, id) {
    try {
        const res = await fetch(`${paymentPaths.featurePackageDetail}${id}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Mua gói chức năng/thuê bao
export async function orderPackage(orgId, body) {
    try {
        const res = await fetch(`${paymentPaths.packageOrder}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(body),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}
export async function getOrderPackage(orgId, transactionId) {
    try {
        const res = await fetch(
            `${paymentPaths.creditOrderDetail}${transactionId}`,
            {
                method: "GET",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}
// Thanh toán gói chức năng/thuê bao
export async function payPackageOrder(orgId, orderId, body) {
    try {
        const res = await fetch(
            `${paymentPaths.packagePayment}${orderId}/payment`,
            {
                method: "POST",
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                body: JSON.stringify(body),
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Mua và thanh toán gói chức năng/thuê bao
export async function orderAndPayPackage(orgId, body) {
    try {
        const res = await fetch(`${paymentPaths.packageOrderAndPayment}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(body),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy danh sách gói thuê bao
export async function getSubscriptionPackages(orgId) {
    try {
        const res = await fetch(`${paymentPaths.subscriptionPackages}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy chi tiết gói thuê bao
export async function getSubscriptionPackageDetail(orgId, id) {
    try {
        const res = await fetch(
            `${paymentPaths.subscriptionPackageDetail}${id}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy lịch sử biến động giá trị trong ví
export async function getWalletHistory(orgId, params) {
    try {
        const queryString = qs.stringify(params);
        const res = await fetch(
            `${paymentPaths.walletHistory}?${queryString}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy lịch sử giao dịch
export async function getTransactionHistory(orgId, params) {
    try {
        const queryString = qs.stringify(params);
        const res = await fetch(
            `${paymentPaths.transactionHistory}?${queryString}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

// Lấy thông tin chi tiết ví
export async function getWalletDetail(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.walletDetail);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

// Lấy chi tiết giao dịch
export async function getTransactionDetail(orgId, transactionId) {
    try {
        const res = await fetch(
            `${paymentPaths.transactionDetail}${transactionId}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function confirmTransactionApi(transactionId) {
    try {
        const res = await fetch(
            `${paymentPaths.confirmTransaction}${transactionId}/confirm`,
            {
                headers: {
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "POST",
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function getSubscriptionRenewInfo(orgId, duration) {
    try {
        const res = await fetch(
            `${paymentPaths.subscriptionRenewInfo}?duration=${duration}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function renewSubscription(orgId, body) {
    try {
        const res = await fetch(`${paymentPaths.subscriptionRenew}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(body),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function getSubscriptionUpgradeInfo(orgId, packageId, duration) {
    try {
        const res = await fetch(
            `${paymentPaths.subscriptionUpgradeInfo}?packageId=${packageId}&duration=${duration}`,
            {
                headers: {
                    organizationId: orgId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function upgradeSubscription(orgId, body) {
    try {
        const res = await fetch(`${paymentPaths.subscriptionUpgrade}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(body),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function getSubscriptionIntro(orgId) {
    try {
        const res = await fetch(`${paymentPaths.subscriptionIntro}`, {
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function checkBuyMember(orgId, memberCount) {
    try {
        const res = await fetch(`${paymentPaths.subscriptionBuyMemberCheck}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                member: memberCount,
            }),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

export async function buyMember(orgId, memberCount) {
    try {
        const res = await fetch(`${paymentPaths.subscriptionBuyMember}`, {
            method: "POST",
            headers: {
                organizationId: orgId,
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                member: memberCount,
            }),
        });
        return await res.json();
    } catch (error) {
        console.log(error);
        return { code: -1, message: error.message };
    }
}

export async function getPaymentHistory(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.paymentHistory, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function createPayment(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paymentPaths.createPayment, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getPackageList(orgId, params) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.packageList, { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function activatePackage(orgId, body) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(paymentPaths.activatePackage, body);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function cancelSubscription(orgId, subscriptionId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.delete(
            `${paymentPaths.cancelSubscription}${subscriptionId}`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getFunctionPackages(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.functionPackage);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function getSubscriptionDowngradeInfo(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.get(paymentPaths.subscriptionDowngradeInfo);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export async function confirmSubscriptionDowngrade(orgId) {
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            paymentPaths.confirmSubscriptionDowngrade
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

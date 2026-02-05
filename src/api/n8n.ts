import { createApiCall } from "@/lib/api";
import { n8nPaths } from "@/lib/authConstants";

export async function rewriteEmail(body: any) {
    try {
        const basicAuthToken = btoa("admin:admin@123");
        const res = await fetch(`${n8nPaths.rewriteEmail}`, {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Basic ${basicAuthToken}`,
            },
            method: "POST",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("error:", error);
        throw error;
    }
}

export async function writeWithAI(body: any) {
    try {
        const basicAuthToken = btoa("admin:admin@123");
        const res = await fetch(`${n8nPaths.writeWithAI}`, {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Basic ${basicAuthToken}`,
            },
            method: "POST",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("error:", error);
        throw error;
    }
}

export async function summaryEmailByAi(body: any) {
    try {
        const basicAuthToken = btoa("admin:admin@123");
        const res = await fetch(`${n8nPaths.summaryEmailByAi}`, {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Basic ${basicAuthToken}`,
            },
            method: "POST",
            body: JSON.stringify(body),
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("error:", error);
        throw error;
    }
}

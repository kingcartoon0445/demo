import paths from "@/lib/authConstants";

export async function getChatbotList(orgId) {
    try {
        const res = await fetch(`${paths.getChatBotListApi}`, {
            headers: {
                accept: "*/*",
                organizationId: orgId,
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function createChatBot(data, orgId) {
    try {
        const res = await fetch(`${paths.createChatBotApi}`, {
            headers: {
                accept: "*/*",
                organizationId: orgId,
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "POST",
            body: data,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function editChatBot(trainId, data, orgId) {
    try {
        const res = await fetch(`${paths.updateChatBotApi}${trainId}`, {
            headers: {
                accept: "*/*",
                organizationId: orgId,
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: data,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function updateStatusChatBot(trainId, data, orgId) {
    try {
        const res = await fetch(`${paths.updateStatusChatbotApi}${trainId}`, {
            headers: {
                accept: "*/*",
                organizationId: orgId,
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            method: "PATCH",
            body: data,
        });
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function updateStatusChatBotConv(orgId, convId, status) {
    try {
        const res = await fetch(
            `${paths.updateStatusChatbotConvApi}${convId}?Status=${status}`,
            {
                headers: {
                    accept: "*/*",
                    organizationId: orgId,
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
                method: "PATCH",
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

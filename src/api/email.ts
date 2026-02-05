import { createApiCall } from "@/lib/api";
import { emailPaths } from "@/lib/authConstants";

export async function getEmailList(orgId: string, params: any) {
    const api = createApiCall(orgId);
    const response = await api.get(emailPaths.getEmailList, { params });
    return response.data;
}

export async function getEmailDetail(orgId: string, configId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(
        emailPaths.getEmailDetail.replace("{configId}", configId)
    );
    return response.data;
}

export async function createEmail(orgId: string, data: any) {
    const api = createApiCall(orgId);
    const response = await api.post(emailPaths.createEmail, data);
    return response.data;
}

export async function updateEmail(orgId: string, configId: string, data: any) {
    const api = createApiCall(orgId);
    const response = await api.put(
        emailPaths.updateEmail.replace("{configId}", configId),
        data
    );
    return response.data;
}

export async function deleteEmail(orgId: string, configId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        emailPaths.deleteEmail.replace("{configId}", configId)
    );
    return response.data;
}

export async function getEmailTemplateList(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(emailPaths.getEmailTemplateList);
    return response.data;
}

export async function getEmailTemplateDetail(
    orgId: string,
    templateId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        emailPaths.getEmailTemplateDetail.replace("{templateId}", templateId)
    );
    return response.data;
}

export async function createEmailTemplate(orgId: string, data: any) {
    const api = createApiCall(orgId);
    const response = await api.post(emailPaths.createEmailTemplate, data);
    return response.data;
}

export async function updateEmailTemplate(
    orgId: string,
    templateId: string,
    data: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateEmailTemplate.replace("{templateId}", templateId),
        data
    );
    return response.data;
}

export async function updateStatusEmailTemplate(
    orgId: string,
    templateId: string,
    data: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateStatusEmailTemplate.replace(
            "{templateId}",
            templateId
        ),
        data
    );
    return response.data;
}

export async function deleteEmailTemplate(orgId: string, templateId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        emailPaths.deleteEmailTemplate.replace("{templateId}", templateId)
    );
    return response.data;
}

export async function updateEmailTemplateBody(
    orgId: string,
    templateId: string,
    data: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateEmailTemplateBody.replace("{templateId}", templateId),
        data
    );
    return response.data;
}

export async function updateEmailTemplateSubject(
    orgId: string,
    templateId: string,
    data: any
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateEmailTemplateSubject.replace(
            "{templateId}",
            templateId
        ),
        {
            data,
        }
    );
    return response.data;
}

export async function getRealVariable(
    orgId: string,
    variable: string,
    type: "lead" | "customer",
    refId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(emailPaths.getRealVariable, {
        params: {
            variable,
            type,
            refId,
        },
    });
    return response.data;
}

export async function getTemplateIncludeVariable(
    orgId: string,
    templateId: string,
    type: "lead" | "customer",
    refId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        emailPaths.getTemplateIncludeVariable.replace(
            "{templateId}",
            templateId
        ),
        {
            params: {
                type,
                refId,
            },
        }
    );
    return response.data;
}

export async function getEmailById(orgId: string, emailId: string) {
    const api = createApiCall(orgId);
    const response = await api.post(
        emailPaths.getEmailById.replace("{id}", emailId)
    );
    return response.data;
}

export async function getEmailVariablesWithValue(
    orgId: string,
    type: "LEAD" | "CUSTOMER",
    refId: string
) {
    const api = createApiCall(orgId);
    const response = await api.get(emailPaths.getEmailVariablesWithValue, {
        params: {
            type,
            refId,
        },
    });
    return response.data;
}
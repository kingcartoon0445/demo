import { createApiCall } from "@/lib/api";
import { emailPaths, emailApiBase, apiBase } from "@/lib/authConstants";
import { getAccessToken } from "@/lib/authCookies";
import axios from "axios";

// ... (existing code)

export async function getEmailList(orgId: string, params: any) {
    // Use new email API: api.email.coka.ai
    const token = getAccessToken();
    try {
        const response = await axios.get(`${emailApiBase}/api/email-accounts`, {
            headers: {
                Authorization: `Bearer ${token}`,
                organizationId: orgId,
                accept: "text/plain",
            },
            params,
        });
        return response.data;
    } catch (error: any) {
        console.error(
            "Email API Error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function getEmailAccountSummaries(orgId: string) {
    // Get email account summaries with unread count
    const token = getAccessToken();
    try {
        const response = await axios.get(
            `${emailApiBase}/api/email-accounts/summaries`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    accept: "text/plain",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Get email summaries error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function getEmailDetail(orgId: string, configId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(
        emailPaths.getEmailDetail.replace("{configId}", configId),
    );
    return response.data;
}

export async function createEmail(orgId: string, data: any) {
    // This API uses different base URL: api.email.coka.ai
    const token = getAccessToken();
    const response = await axios.post(
        `${emailApiBase}/api/email-accounts`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                organizationId: orgId,
                "Content-Type": "application/json",
            },
        },
    );
    return response.data;
}

export async function updateEmailAccount(
    orgId: string,
    accountId: string,
    data: any,
) {
    // Update email account
    const token = getAccessToken();
    try {
        const response = await axios.put(
            `${emailApiBase}/api/email-accounts/${accountId}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Update email account error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function deleteEmailAccount(orgId: string, accountId: string) {
    // Delete email account
    const token = getAccessToken();
    try {
        const response = await axios.delete(
            `${emailApiBase}/api/email-accounts/${accountId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Delete email account error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function testEmailConnection(orgId: string, accountId: string) {
    // Test email account connection
    const token = getAccessToken();
    try {
        const response = await axios.post(
            `${emailApiBase}/api/email-accounts/${accountId}/test`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Test connection error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export interface TestConnectionConfig {
    emailAddress: string;
    displayName?: string;
    accountType?: string;
    server: string;
    port: number;
    username: string;
    password: string;
    useSsl: boolean;
    smtpServer?: string;
    smtpPort?: number;
}

export async function testEmailConnectionWithConfig(
    orgId: string,
    config: TestConnectionConfig,
) {
    // Test email connection with config (before creating/updating account)
    const token = getAccessToken();
    try {
        const response = await axios.post(
            `${emailApiBase}/api/email-accounts/test-connection`,
            {
                emailAddress: config.emailAddress,
                displayName: config.displayName || "",
                accountType: config.accountType || "IMAP",
                server: config.server,
                port: config.port,
                username: config.username,
                password: config.password,
                useSsl: config.useSsl,
                smtpServer: config.smtpServer || "",
                smtpPort: config.smtpPort || 587,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Test connection with config error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function syncEmails(orgId: string, accountId: string) {
    // Sync emails for account
    const token = getAccessToken();
    try {
        const response = await axios.post(
            `${emailApiBase}/api/email-accounts/${accountId}/sync`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    accept: "*/*",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Sync emails error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function getEmails(
    orgId: string,
    accountId: string,
    params?: {
        Page?: number;
        PageSize?: number;
        Folder?: string;
        IsRead?: boolean;
        HasAttachments?: boolean;
        From?: string;
        Subject?: string;
        DateFrom?: string;
        DateTo?: string;
        SortBy?: string;
        SortOrder?: string;
        TagIds?: string[];
    },
) {
    // Get emails list for account
    const token = getAccessToken();
    try {
        const response = await axios.get(`${emailApiBase}/api/emails`, {
            headers: {
                Authorization: `Bearer ${token}`,
                organizationId: orgId,
            },
            params: {
                AccountId: accountId,
                ...(params || { Page: 1, PageSize: 20 }),
            },
            paramsSerializer: {
                indexes: null, // Use brackets for arrays: TagIds[]
            },
        });
        return response.data;
    } catch (error: any) {
        console.error(
            "Get emails error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function deleteEmails(orgId: string, emailIds: string[]) {
    // Delete emails in bulk: DELETE /api/emails/bulk
    const token = getAccessToken();
    try {
        const response = await axios.delete(`${emailApiBase}/api/emails/bulk`, {
            headers: {
                Authorization: `Bearer ${token}`,
                organizationId: orgId,
                "Content-Type": "application/json",
            },
            data: emailIds,
        });
        return response.data;
    } catch (error: any) {
        console.error(
            "Delete emails error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function getEmailDetailById(orgId: string, emailId: string) {
    // Get single email detail by ID from new email API
    const token = getAccessToken();
    try {
        const response = await axios.get(
            `${emailApiBase}/api/emails/${emailId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Get email detail error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function markEmailAsRead(
    orgId: string,
    emailId: string,
    isRead: boolean = true,
) {
    // Mark email as read/unread
    const token = getAccessToken();
    try {
        const response = await axios.put(
            `${emailApiBase}/api/emails/${emailId}/read`,
            { isRead },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Mark email as read error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

// ==================== Email Tags API ====================

export interface EmailTag {
    id: string;
    name: string;
    color: string;
    description?: string;
    isSystem?: boolean;
    createdAt?: string;
    emailCount?: number;
    unreadCount?: number;
}

export interface CreateEmailTagParams {
    name: string;
    color: string;
    description?: string;
}

export async function getEmailTags(orgId: string, id?: string) {
    // Get all email tags with stats: GET /api/email-tags/with-stats
    const token = getAccessToken();
    try {
        const response = await axios.get(
            `${emailApiBase}/api/email-accounts/${id}/tags/with-stats`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Get email tags error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function createEmailTag(
    orgId: string,
    emailAccountId: string,
    params: CreateEmailTagParams,
) {
    // Create email tag: POST /api/email-tags
    const token = getAccessToken();
    try {
        const response = await axios.post(
            `${emailApiBase}/api/email-accounts/${emailAccountId}/tags`,
            {
                name: params.name,
                color: params.color,
                description: params.description || "",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Create email tag error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function updateEmailTag(
    orgId: string,
    emailAccountId: string,
    tagId: string,
    params: Partial<CreateEmailTagParams>,
) {
    // Update email tag: PUT /api/email-tags/{id}
    const token = getAccessToken();
    try {
        const response = await axios.put(
            `${emailApiBase}/api/email-accounts/${emailAccountId}/tags/${tagId}`,
            params,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Update email tag error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function deleteEmailTag(
    orgId: string,
    emailAccountId: string,
    tagId: string,
) {
    // Delete email tag: DELETE /api/email-tags/{id}
    const token = getAccessToken();
    try {
        const response = await axios.delete(
            `${emailApiBase}/api/email-accounts/${emailAccountId}/tags/${tagId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Delete email tag error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function assignTagsToEmail(
    orgId: string,
    emailAccountId: string,
    emailId: string,
    tagIds: string[],
) {
    // Assign tags to email: POST /api/email-tags/emails/{emailId}/assign
    const token = getAccessToken();
    try {
        const response = await axios.post(
            `${emailApiBase}/api/email-accounts/${emailAccountId}/tags/emails/${emailId}/assign`,
            { tagIds },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Assign tags to email error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function getEmailTemplateList(orgId: string) {
    const api = createApiCall(orgId);
    const response = await api.get(emailPaths.getEmailTemplateList);
    return response.data;
}

export async function getEmailTemplateDetail(
    orgId: string,
    templateId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        emailPaths.getEmailTemplateDetail.replace("{templateId}", templateId),
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
    data: any,
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateEmailTemplate.replace("{templateId}", templateId),
        data,
    );
    return response.data;
}

export async function updateStatusEmailTemplate(
    orgId: string,
    templateId: string,
    data: any,
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateStatusEmailTemplate.replace(
            "{templateId}",
            templateId,
        ),
        data,
    );
    return response.data;
}

export async function deleteEmailTemplate(orgId: string, templateId: string) {
    const api = createApiCall(orgId);
    const response = await api.delete(
        emailPaths.deleteEmailTemplate.replace("{templateId}", templateId),
    );
    return response.data;
}

export async function updateEmailTemplateBody(
    orgId: string,
    templateId: string,
    data: any,
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateEmailTemplateBody.replace("{templateId}", templateId),
        data,
    );
    return response.data;
}

export async function updateEmailTemplateSubject(
    orgId: string,
    templateId: string,
    data: any,
) {
    const api = createApiCall(orgId);
    const response = await api.patch(
        emailPaths.updateEmailTemplateSubject.replace(
            "{templateId}",
            templateId,
        ),
        {
            data,
        },
    );
    return response.data;
}

export async function getRealVariable(
    orgId: string,
    variable: string,
    type: "lead" | "customer",
    refId: string,
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
    refId: string,
) {
    const api = createApiCall(orgId);
    const response = await api.get(
        emailPaths.getTemplateIncludeVariable.replace(
            "{templateId}",
            templateId,
        ),
        {
            params: {
                type,
                refId,
            },
        },
    );
    return response.data;
}

export async function getEmailById(orgId: string, emailId: string) {
    const api = createApiCall(orgId);
    const response = await api.post(
        emailPaths.getEmailById.replace("{id}", emailId),
    );
    return response.data;
}

export async function getEmailVariablesWithValue(
    orgId: string,
    type: "LEAD" | "CUSTOMER",
    refId: string,
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

export async function downloadAttachment(
    orgId: string,
    attachmentId: string,
    fileName: string,
) {
    // Download attachment file
    const token = getAccessToken();
    try {
        const response = await axios.get(
            `${emailApiBase}/api/Attachments/${attachmentId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
                responseType: "blob",
            },
        );

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error: any) {
        console.error(
            "Download attachment error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export interface SendEmailParams {
    outgoingAccountId: string;
    toAddresses: string[];
    ccAddresses?: string[];
    bccAddresses?: string[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments?: File[];
}

export async function sendEmail(orgId: string, params: SendEmailParams) {
    // Send email via API
    const token = getAccessToken();

    const formData = new FormData();
    formData.append("OutgoingAccountId", params.outgoingAccountId);

    // Add recipients
    params.toAddresses.forEach((email) => {
        formData.append("ToAddresses", email);
    });

    if (params.ccAddresses) {
        params.ccAddresses.forEach((email) => {
            formData.append("CcAddresses", email);
        });
    }

    if (params.bccAddresses) {
        params.bccAddresses.forEach((email) => {
            formData.append("BccAddresses", email);
        });
    }

    formData.append("Subject", params.subject);

    if (params.bodyText) {
        formData.append("BodyText", params.bodyText);
    }

    if (params.bodyHtml) {
        formData.append("BodyHtml", params.bodyHtml);
    }

    // Add attachments
    if (params.attachments && params.attachments.length > 0) {
        params.attachments.forEach((file) => {
            formData.append("Attachments", file);
        });
    }

    try {
        const response = await axios.post(
            `${emailApiBase}/api/emails/send`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Send email error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export interface ReplyEmailParams {
    outgoingAccountId: string;
    bodyText?: string;
    bodyHtml?: string;
    replyAll?: boolean;
    attachments?: File[];
}

export async function replyEmail(
    orgId: string,
    emailId: string,
    params: ReplyEmailParams,
) {
    // Reply to email via API
    const token = getAccessToken();

    const formData = new FormData();
    formData.append("OutgoingAccountId", params.outgoingAccountId);

    if (params.bodyText) {
        formData.append("BodyText", params.bodyText);
    }

    if (params.bodyHtml) {
        formData.append("BodyHtml", params.bodyHtml);
    }

    formData.append("ReplyAll", String(params.replyAll ?? false));

    // Add attachments
    if (params.attachments && params.attachments.length > 0) {
        params.attachments.forEach((file) => {
            formData.append("Attachments", file);
        });
    }

    try {
        const response = await axios.post(
            `${emailApiBase}/api/emails/${emailId}/reply`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Reply email error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export interface ForwardEmailParams {
    outgoingAccountId: string;
    toAddresses: string[];
    ccAddresses?: string[];
    additionalMessage?: string;
    includeAttachments?: boolean;
}

export async function forwardEmail(
    orgId: string,
    emailId: string,
    params: ForwardEmailParams,
) {
    // Forward email via API: POST /api/emails/{id}/forward
    const token = getAccessToken();

    try {
        const response = await axios.post(
            `${emailApiBase}/api/emails/${emailId}/forward`,
            {
                outgoingAccountId: params.outgoingAccountId,
                toAddresses: params.toAddresses,
                ccAddresses: params.ccAddresses || [],
                additionalMessage: params.additionalMessage || "",
                includeAttachments: params.includeAttachments ?? true,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "application/json",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Forward email error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function getEmailFolders(orgId: string, accountId: string) {
    const token = getAccessToken();
    try {
        const response = await axios.get(
            `${emailApiBase}/api/email-accounts/${accountId}/folders`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    accept: "text/plain",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Get email folders error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export interface SaveDraftParams {
    draftId?: string;
    toAddresses?: string[];
    ccAddresses?: string[];
    bccAddresses?: string[];
    subject?: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments?: File[];
}

export async function saveDraft(
    orgId: string,
    emailAccountId: string,
    params: SaveDraftParams,
) {
    const token = getAccessToken();
    const formData = new FormData();

    if (params.draftId) {
        formData.append("DraftId", params.draftId);
    }

    formData.append("EmailAccountId", emailAccountId);

    if (params.toAddresses) {
        params.toAddresses.forEach((email) => {
            formData.append("ToAddresses", email);
        });
    }

    if (params.ccAddresses) {
        params.ccAddresses.forEach((email) => {
            formData.append("CcAddresses", email);
        });
    }

    if (params.bccAddresses) {
        params.bccAddresses.forEach((email) => {
            formData.append("BccAddresses", email);
        });
    }

    if (params.subject) {
        formData.append("Subject", params.subject);
    }

    if (params.bodyText) {
        formData.append("BodyText", params.bodyText);
    }

    if (params.bodyHtml) {
        formData.append("BodyHtml", params.bodyHtml);
    }

    if (params.attachments && params.attachments.length > 0) {
        params.attachments.forEach((file) => {
            formData.append("Attachments", file);
        });
    }

    try {
        const response = await axios.post(
            `${emailApiBase}/api/emails/${emailAccountId}/drafts`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Save draft error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function deleteDraft(
    orgId: string,
    emailAccountId: string,
    draftId: string,
) {
    const token = getAccessToken();
    try {
        const response = await axios.delete(
            `${emailApiBase}/api/emails/${emailAccountId}/drafts/${draftId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    organizationId: orgId,
                },
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Delete draft error:",
            error.response?.data || error.message,
        );
        throw error;
    }
}

export async function searchEmailAddresses(orgId: string, searchText: string) {
    // Search email addresses: POST /api/v2/customer/email-addresses
    try {
        const api = createApiCall(orgId);
        const response = await api.post(
            `${apiBase}/api/v2/customer/email-addresses`,
            {
                searchText,
            },
        );
        return response.data;
    } catch (error: any) {
        console.error(
            "Search email addresses error:",
            error.response?.data || error.message,
        );
        // Return empty list on error to avoid breaking UI
        return { code: 0, content: [] };
    }
}

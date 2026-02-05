// Email interface matching the API response structure
export interface Email {
    // API fields
    id: string;
    messageId?: string;
    subject?: string;
    fromAddress?: string;
    fromName?: string;
    toAddresses?: string[];
    ccAddresses?: string[];
    bccAddresses?: string[];
    dateSent?: string;
    dateReceived?: string;
    bodyText?: string;
    bodyHtml?: string;
    isRead?: boolean;
    hasAttachments?: boolean;
    size?: number;
    folder?: string;
    attachments?: Array<{
        name: string;
        size: string;
        type: string;
    }>;

    // Legacy/UI fields for backward compatibility
    from?: string;
    to?: string;
    sender?: {
        name: string;
        email: string;
        avatar?: string;
    };
    snippet?: string;
    preview?: string;
    content?: string;
    time?: string;
    date?: string;
    fullTime?: string;
    tags?: Array<{
        id?: string;
        name?: string;
        color?: string;
        className?: string; // Legacy
        label?: string; // Legacy
    }>;
    isStarred?: boolean;
    hasAttachment?: boolean; // Alias for hasAttachments
}

// Optional: Mock email data for testing
export const mockEmails: Email[] = [
    {
        id: "1",
        messageId: "mock-1@example.com",
        subject: "Về dự án mới",
        fromAddress: "nguyenvana@example.com",
        fromName: "Nguyễn Van A",
        toAddresses: ["me@example.com"],
        ccAddresses: [],
        bccAddresses: [],
        dateSent: "2026-01-13T10:30:00",
        dateReceived: "2026-01-13T10:30:05",
        bodyText:
            "Chào em,\n\nAnh muốn trao đổi về dự án mới. Em có thời gian tuần này không?\n\nThân,\nNguyễn Van A",
        bodyHtml:
            "<p>Chào em,</p><p>Anh muốn trao đổi về dự án mới. Em có thời gian tuần này không?</p><p>Thân,<br>Nguyễn Van A</p>",
        isRead: false,
        hasAttachments: false,
        size: 250,
        folder: "INBOX",
        attachments: [],
        // Legacy fields for UI compatibility
        sender: {
            name: "Nguyễn Van A",
            email: "nguyenvana@example.com",
        },
        to: "me@example.com",
        snippet: "Chào em, anh muốn trao đổi về dự án mới...",
        preview: "Chào em, anh muốn trao đổi về dự án mới...",
        content:
            "<p>Chào em,</p><p>Anh muốn trao đổi về dự án mới. Em có thời gian tuần này không?</p><p>Thân,<br>Nguyễn Van A</p>",
        time: "10:30",
        fullTime: "Hôm nay lúc 10:30",
        tags: [
            {
                className: "bg-blue-100 text-blue-700",
                label: "Dự án",
            },
        ],
    },
    {
        id: "2",
        messageId: "mock-2@example.com",
        subject: "Báo cáo tuần",
        fromAddress: "tranthib@example.com",
        fromName: "Trần Thị B",
        toAddresses: ["me@example.com"],
        ccAddresses: [],
        bccAddresses: [],
        dateSent: "2026-01-13T09:15:00",
        dateReceived: "2026-01-13T09:15:03",
        bodyText: "Kính gửi anh/chị,\n\nEm xin gửi báo cáo công việc tuần này.",
        bodyHtml:
            "<p>Kính gửi anh/chị,</p><p>Em xin gửi báo cáo công việc tuần này.</p>",
        isRead: true,
        hasAttachments: true,
        size: 450,
        folder: "INBOX",
        attachments: [],
        // Legacy fields for UI compatibility
        sender: {
            name: "Trần Thị B",
            email: "tranthib@example.com",
        },
        to: "me@example.com",
        snippet: "Gửi anh/chị báo cáo công việc tuần này...",
        preview: "Gửi anh/chị báo cáo công việc tuần này...",
        content:
            "<p>Kính gửi anh/chị,</p><p>Em xin gửi báo cáo công việc tuần này.</p>",
        time: "09:15",
        fullTime: "Hôm nay lúc 09:15",
        tags: [],
    },
];

// Export as EMAILS for backward compatibility
export const EMAILS = mockEmails;

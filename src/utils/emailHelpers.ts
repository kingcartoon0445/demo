// Helper functions cho email processing

/**
 * Extract HTML từ body (có thể là JSON string hoặc object)
 */
export const extractHtml = (body: any): string => {
    if (!body) return "";
    if (typeof body === "string") {
        try {
            const parsed = JSON.parse(body);
            return parsed.html || parsed.body || body;
        } catch {
            return body;
        }
    }
    return body.html || body.body || String(body);
};

/**
 * Convert text với newlines thành HTML
 * \n\n thành paragraph breaks, \n đơn lẻ thành <br>
 */
export const convertNewlinesToHtml = (text: string): string => {
    if (!text) return "";
    // Convert \n\n thành paragraph breaks
    // Convert \n đơn lẻ thành <br>
    return text
        .split(/\n\n+/)
        .map((paragraph) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return "";
            // Convert \n đơn lẻ trong paragraph thành <br>
            const withBreaks = trimmed.replace(/\n/g, "<br>");
            return `<p>${withBreaks}</p>`;
        })
        .filter((p) => p)
        .join("");
};

/**
 * Convert HTML thành plain text
 * Loại bỏ HTML tags và decode HTML entities
 */
export const convertHtmlToPlainText = (html: string): string => {
    if (!html) return "";

    // Tạo một temporary DOM element để extract text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Convert các HTML line breaks và block elements thành newlines trước
    let processedHtml = html
        .replace(/<br\s*\/?>/gi, "\n") // <br> và <br/> thành \n
        .replace(/<\/p>/gi, "\n") // </p> thành \n
        .replace(/<p[^>]*>/gi, "") // <p> tags bị xóa
        .replace(/<\/div>/gi, "\n") // </div> thành \n
        .replace(/<div[^>]*>/gi, "") // <div> tags bị xóa
        .replace(/<\/li>/gi, "\n") // </li> thành \n
        .replace(/<li[^>]*>/gi, "") // <li> tags bị xóa (giữ nội dung)
        .replace(/<\/ul>/gi, "\n") // </ul> thành \n
        .replace(/<ul[^>]*>/gi, "") // <ul> tags bị xóa
        .replace(/<\/ol>/gi, "\n") // </ol> thành \n
        .replace(/<ol[^>]*>/gi, ""); // <ol> tags bị xóa

    // Set lại HTML đã được xử lý
    tempDiv.innerHTML = processedHtml;

    // Lấy text content (tự động decode HTML entities)
    let text = tempDiv.textContent || tempDiv.innerText || "";

    // Clean up multiple newlines và spaces
    text = text.replace(/\n{3,}/g, "\n\n"); // Nhiều hơn 2 newlines thành 2
    text = text.replace(/[ \t]+/g, " "); // Multiple spaces thành 1 space

    return text.trim();
};

/**
 * Validate format email
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate string containing multiple emails separated by comma
 * Returns array of invalid emails
 */
export const getInvalidEmails = (emailString: string): string[] => {
    if (!emailString) return [];

    return emailString
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e && !isValidEmail(e));
};

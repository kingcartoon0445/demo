import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiBase } from "./authConstants";
import { toast } from "react-hot-toast";
import CryptoJS from "crypto-js";
import { format, isThisWeek, isToday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} giây`);

    return parts.join(" ");
};

export function formatCustomDateTime(input: string | Date) {
    let date;
    if (typeof input === "string") {
        date = parseISO(input);
    } else if (input instanceof Date) {
        date = input;
    } else {
        throw new Error(
            "Đầu vào không hợp lệ. Vui lòng cung cấp chuỗi hoặc đối tượng Date.",
        );
    }

    if (isToday(date)) {
        return format(date, "HH:mm");
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        return format(date, "EEEE", { locale: vi });
    } else {
        return format(date, "dd/MM/yy");
    }
}

export function formatCurrency(value: number | undefined | null): string {
    // Handle undefined, null, or NaN values
    if (value === undefined || value === null || isNaN(value)) {
        return "0 ₫";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

export const defaultTitleHeader = "CoKa AI - CRM Platform";

export const getAvatarUrl = (avatar: string) => {
    if (!avatar) return null;
    if (avatar.includes("https")) return avatar;
    return avatar[0] == "/" ? `${apiBase}${avatar}` : `${apiBase}/${avatar}`;
};

let audioUnlockAttempted = false;
let pendingSoundUrl: string | null = null;

function addAudioUnlockListeners(callback: () => void) {
    const handler = () => {
        try {
            callback();
        } finally {
            document.removeEventListener("pointerdown", handler);
            document.removeEventListener("keydown", handler);
            document.removeEventListener("touchstart", handler);
        }
    };
    document.addEventListener("pointerdown", handler, { once: true });
    document.addEventListener("keydown", handler, { once: true });
    document.addEventListener("touchstart", handler, { once: true });
}

export function playSound(url: string) {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.play().catch((err: any) => {
        if (err && (err.name === "NotAllowedError" || err.code === 0)) {
            // Autoplay blocked: wait for first user interaction then retry once
            pendingSoundUrl = url;
            if (!audioUnlockAttempted) {
                audioUnlockAttempted = true;
                addAudioUnlockListeners(() => {
                    if (pendingSoundUrl) {
                        const retryAudio = new Audio(pendingSoundUrl);
                        retryAudio.preload = "auto";
                        retryAudio.play().catch(() => {
                            // Swallow to avoid unhandled promise rejections
                        });
                        pendingSoundUrl = null;
                    }
                });
            }
        } else {
            // Other playback errors
            console.error("Audio play error:", err);
        }
    });
}

export function getFirstAndLastWord(sentence: string) {
    if (!sentence) return "";
    let words = sentence?.trim()?.split(" ");
    let firstWord = words?.[0] || "";
    let lastWord = words?.[words.length - 1] || "";

    if (words?.length === 1) {
        return firstWord;
    } else {
        return `${firstWord} ${lastWord}`.trim();
    }
}

export function formatRelativeTime(inputDate: string) {
    const now = new Date();
    const input = new Date(inputDate);
    const diffMs = Math.abs(now.getTime() - input.getTime());
    const isFuture = input > now;
    const suffix = isFuture ? " nữa" : "";

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return `${seconds}s${suffix}`;
    if (minutes < 60) return `${minutes}p${suffix}`;
    if (hours < 24) return `${hours}g${suffix}`;
    if (days < 7) return `${days}n${suffix}`;
    if (weeks < 5) return `${weeks}t${suffix}`;
    if (months < 12) return `${months}th${suffix}`;
    return `${years}n${suffix}`;
}

export function getGender(gender: number) {
    return gender == 1 ? "Nam" : gender == 2 ? "Nữ" : "";
}

export function capitalizeFirstLetter(str: string) {
    if (!str || str?.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function get30daysAgo() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString();
}

export function get7daysAgo() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return sevenDaysAgo.toISOString();
}

export function getNow() {
    return new Date().toISOString();
}

export function getDaysInStage(startDate: string) {
    const createdDate = new Date(startDate);
    const today = new Date();

    // Xoá giờ phút giây, chỉ giữ lại ngày tháng năm
    const created = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate(),
    );
    const now = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "1 ngày";
    return `${diffDays + 1} ngày`;
}

export function extractFileInfo(str: string) {
    if (!str) return null;

    let jsonStr = str;

    // Thử parse trực tiếp nếu là JSON thuần
    try {
        const fileInfo = JSON.parse(str);
        if (fileInfo.FileName && fileInfo.Path) {
            return {
                name: fileInfo.FileName,
                path: fileInfo.Path,
                contentType: fileInfo.ContentType,
            };
        }
    } catch (e) {
        // Nếu không phải JSON thuần, thử tìm pattern "Đính kèm tệp tin"
        const regex = /Đính kèm tệp tin\s*[:\s]*({[\s\S]*?})/;
        const match = str.match(regex);
        if (!match) return null;

        jsonStr = match[1];
    }

    try {
        const fileInfo = JSON.parse(jsonStr);
        return {
            name: fileInfo.FileName,
            path: fileInfo.Path,
            contentType: fileInfo.ContentType,
        };
    } catch (e) {
        console.error("JSON parse failed", e);
        return null;
    }
}

export function extractAssignInfo(str: string) {
    if (!str) return null;

    const trimmed = String(str).trim();

    const prefixes = [
        { label: "Thu hồi phụ trách khách hàng" },
        { label: "Thêm phụ trách khách hàng" },
        { label: "Thu hồi theo dõi khách hàng" },
        { label: "Thêm theo dõi khách hàng" },
    ];

    const startsWithKnownPrefix = prefixes.some((p) =>
        trimmed.startsWith(p.label),
    );

    const toSimpleArray = (arr: any[]) =>
        arr.map((x: any) => ({
            teamId: x?.TeamId ?? null,
            teamName: x?.TeamName ?? null,
            profileId: x?.ProfileId ?? null,
            profileName: x?.ProfileName ?? null,
        }));

    // Nếu là JSON mảng thuần
    if (!startsWithKnownPrefix) {
        try {
            const maybeArray = JSON.parse(trimmed);
            if (Array.isArray(maybeArray)) {
                return toSimpleArray(maybeArray);
            }
        } catch (_) {}
        return null;
    }

    // Có tiền tố tiếng Việt: trích mảng [] và parse
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (
        firstBracket === -1 ||
        lastBracket === -1 ||
        lastBracket <= firstBracket
    ) {
        return null;
    }

    const jsonArrayStr = trimmed.slice(firstBracket, lastBracket + 1);
    try {
        const items = JSON.parse(jsonArrayStr);
        if (!Array.isArray(items)) return null;
        return toSimpleArray(items);
    } catch (e) {
        console.error("extractAssignInfo JSON parse failed", e);
        return null;
    }
}

/**
 * Utility function to handle API response with code checking
 * @param response - API response object with code and message properties
 * @param successMessage - Optional success message to show when code === 0
 * @param errorMessage - Optional custom error message prefix
 * @returns Object with success status and data
 */
export function handleApiResponse<T = any>(
    response:
        | { code: number; message?: string; content?: T; data?: T }
        | undefined
        | null,
    successMessage?: string,
    errorMessage: string = "Có lỗi xảy ra",
): { success: boolean; data?: T; error?: string } {
    if (!response) {
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
    if (response.code === 0) {
        // Success case
        if (successMessage) {
            toast.success(successMessage);
        }
        return {
            success: true,
            data: response.content || response.data,
        };
    } else {
        // Error case
        const errorMsg = response.message || errorMessage;
        toast.error(errorMsg);
        return {
            success: false,
            error: errorMsg,
        };
    }
}

/**
 * Utility function to handle API response for data fetching hooks
 * @param response - API response object with code and message properties
 * @param errorMessage - Optional custom error message prefix
 * @param showToast - Whether to show toast error (default: false to avoid setState during render)
 * @returns Data if successful, null if error
 */
export function handleApiDataResponse<T = any>(
    response:
        | { code: number; message?: string; content?: T; data?: T }
        | undefined
        | null,
    errorMessage: string = "Có lỗi xảy ra khi tải dữ liệu",
    showToast: boolean = false,
): T | null {
    if (!response) {
        return null;
    }
    if (response.code === 0) {
        return response.content || response.data || null;
    } else {
        const errorMsg = response.message || errorMessage;
        if (showToast) {
            toast.error(errorMsg);
        }
        return null;
    }
}

export const paymentMethod = {
    VNPay: {
        id: "5ddc74a5-74d2-11ef-9351-02981be25414",
        name: "VNPay",
        description: "Banking payment gateway",
        priority: 1,
        type: "PAYMENT_GATEWAY",
        status: 1,
        createdBy: "SYSTEM",
        createdDate: "2024-06-27T16:21:19",
        lastModifiedBy: "SYSTEM",
        lastModifiedDate: "2024-06-27T16:21:19",
    },
    "Ví Coka": {
        id: "26934ad6-6e57-11ef-9351-02981be25414",
        name: "Ví Coka",
        description: "CoKa",
        priority: 5,
        type: "COKA_GATEWAY",
        status: 1,
        createdDate: "2024-06-27T16:21:19",
        lastModifiedBy: "SYSTEM",
        lastModifiedDate: "2024-06-27T16:21:19",
    },
};

export function findBranchWithParentId(tree: any, parentId: any): any {
    for (const node of tree) {
        if (node.id === parentId) {
            return node;
        } else if (node.hasOwnProperty("childs")) {
            const childBranch = node.childs;
            const result: any = findBranchWithParentId(childBranch, parentId);
            if (result !== null) {
                return result;
            }
        }
    }
    return null;
}

function convertCryptKey(strKey: string) {
    const newKey = new Uint8Array(16);
    const strKeyBytes = new TextEncoder().encode(strKey);
    for (let i = 0; i < strKeyBytes.length; i++) {
        newKey[i % 16] ^= strKeyBytes[i];
    }
    return CryptoJS.lib.WordArray.create(newKey);
}

function decrypt(encryptedBase64: string, key: string) {
    const encryptedHex = CryptoJS.enc.Base64.parse(encryptedBase64).toString(
        CryptoJS.enc.Hex,
    );
    const encryptedWords = CryptoJS.enc.Hex.parse(encryptedHex);
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedWords,
    });
    const keyWordArray = convertCryptKey(key);
    const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

export const decryptPassword = (
    encryptedPassword: string,
    profileId: string,
) => {
    try {
        const password = decrypt(encryptedPassword, profileId);
        return password;
    } catch (error) {
        throw new Error("Dữ liệu UTF-8 không hợp lệ");
    }
};

export const getIconPath = (
    type: string,
    customerSource: any,
    createdByName: string,
) => {
    console.log("customerSource", customerSource);
    if (customerSource) {
        if (type == "SOURCE" && customerSource[0].toLowerCase() == "form") {
            return "/images/form_icon.png";
        }
        if (type == "SOURCE" && customerSource[0].toLowerCase() == "nhập vào") {
            return "/images/pencil.png";
        }
    }
    // if (type == "SOURCE") {
    //     return "/images/form_icon.png";
    // }
    if (type == "SOURCE") {
        return "/images/pencil.png";
    }
    if (type == "UPDATE_RATING") {
        return "/images/review.png";
    }
    if (type == "CALL") {
        return "/images/journey_phone.png";
    }
    if (
        type == "UPDATE_AVATAR" ||
        type == "UPDATE_INFO" ||
        type == "UPDATE_FIELD"
    ) {
        return "/images/pencil.png";
    }
    if (
        type == "UPDATE_STAGE" ||
        type == "CREATE_NOTE" ||
        type == "ATTACHMENT"
    ) {
        return "/images/sticky-notes.png";
    }
    if (type == "ASSIGNTO") {
        if (
            createdByName &&
            (createdByName.toLowerCase() == "bot" ||
                createdByName.toLowerCase() == "hệ thống")
        ) {
            return "/images/bot.png";
        } else if (!createdByName) {
            return "/images/bot.png";
        }
        return "/images/change.png";
    }

    return "/images/bot.png";
};

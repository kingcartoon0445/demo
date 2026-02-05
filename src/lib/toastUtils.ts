import * as ReactHotToast from "react-hot-toast";

// Track the timestamp of the last error toast for each unique message
const messageTimestamps = new Map<string, number>();
const DEBOUNCE_TIME = 2000; // 2 seconds

export const showErrorToast = (
    message: string,
    options?: any
): string => {
    if (typeof window === "undefined") return "";

    // Resolve toast from the module import to handle both default and named exports
    // @ts-ignore
    const toast = ReactHotToast.default || ReactHotToast.toast || ReactHotToast;

    if (!toast || typeof toast.error !== "function") {
        console.error("[ToastUtils] Error: 'toast' object is not valid.", toast);
        return "";
    }

    if (!message) message = "Đã có lỗi xảy ra";

    const now = Date.now();
    const lastTime = messageTimestamps.get(message) || 0;

    if (now - lastTime > DEBOUNCE_TIME) {
        messageTimestamps.set(message, now);
        return toast.error(message, options);
    }

    return "";
};

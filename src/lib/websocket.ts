export default class WebSocketClient {
    private url: string;
    private onMessage?: (data: any) => void;
    private ws: WebSocket | null;
    private reconnectAttempts: number;
    private pingInterval: ReturnType<typeof setInterval> | null;
    private maxReconnectAttempts: number;
    private isConnecting: boolean;
    private isConnected: boolean;

    constructor(url: string, onMessage?: (data: any) => void) {
        this.url = url;
        this.onMessage = onMessage; // Callback để xử lý tin nhắn mới
        this.ws = null;
        this.reconnectAttempts = 0;
        this.pingInterval = null;
        this.maxReconnectAttempts = 10;
        this.isConnecting = false;
        this.isConnected = false;
    }

    connect() {
        try {
            if (!this.url) {
                console.error("[WebSocket] Lỗi: Thiếu thông số URL kết nối");
                return;
            }

            // Ngăn kết nối trùng lặp
            if (this.isConnecting || this.isConnected) {
                console.log(
                    "[WebSocket] Đã có kết nối hoặc đang kết nối, bỏ qua"
                );
                return;
            }

            this.isConnecting = true;
            console.log("[WebSocket] Đang kết nối đến:", this.url);

            // Tạo kết nối WebSocket
            this.ws = new WebSocket(this.url);

            // Xử lý khi kết nối được mở
            this.ws.onopen = () => {
                console.log("[WebSocket] Đã kết nối thành công");
                this.isConnecting = false;
                this.isConnected = true;
                this.reconnectAttempts = 0; // Reset số lần thử kết nối lại

                // Thiết lập ping định kỳ
                if (this.pingInterval) {
                    clearInterval(this.pingInterval);
                }
                this.pingInterval = setInterval(() => {
                    try {
                        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                            this.ws.send(JSON.stringify({ type: "ping" }));
                            console.log("[WebSocket] Gửi ping");
                        }
                    } catch (error) {
                        console.error("[WebSocket] Lỗi khi gửi ping:", error);
                    }
                }, 5000);
            };

            // Xử lý khi nhận tin nhắn
            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    console.log(
                        "[WebSocket] Đã nhận tin nhắn:",
                        event.data.substring(0, 100) +
                            (event.data.length > 100 ? "..." : "")
                    );

                    // Chỉ xử lý tin nhắn nếu không phải là "pong"
                    if (
                        event.data === "pong" ||
                        (typeof event.data === "string" &&
                            event.data.includes('"type":"pong"'))
                    ) {
                        console.log("[WebSocket] Nhận pong từ server");
                        return;
                    }

                    // Gọi callback onMessage khi nhận được tin nhắn mới
                    if (this.onMessage) {
                        let parsedData;
                        try {
                            parsedData = JSON.parse(event.data);
                        } catch (parseError) {
                            console.warn(
                                "[WebSocket] Không thể parse dữ liệu JSON, sử dụng dữ liệu gốc:",
                                parseError
                            );
                            parsedData = event.data;
                        }

                        this.onMessage(parsedData);
                    }
                } catch (error) {
                    console.error("[WebSocket] Lỗi khi xử lý tin nhắn:", error);
                }
            };

            // Xử lý khi kết nối bị đóng
            this.ws.onclose = (event: CloseEvent) => {
                console.log(
                    `[WebSocket] Kết nối đã đóng. Code: ${event.code}, Reason: ${event.reason}`
                );
                this.isConnecting = false;
                this.isConnected = false;
                if (this.pingInterval) {
                    clearInterval(this.pingInterval);
                }
                this.reconnect();
            };

            // Xử lý khi xảy ra lỗi
            this.ws.onerror = (error: Event) => {
                console.error("[WebSocket] Lỗi:", error);
                this.isConnecting = false;
                this.isConnected = false;
            };
        } catch (error) {
            console.error("[WebSocket] Lỗi khi thiết lập kết nối:", error);
            this.reconnect();
        }
    }

    // Hàm ngắt kết nối
    disconnect() {
        try {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
            }
            if (this.ws) {
                console.log("[WebSocket] Ngắt kết nối");
                this.ws.close();
                this.ws = null;
            }
            this.isConnecting = false;
            this.isConnected = false;
        } catch (error) {
            console.error("[WebSocket] Lỗi khi ngắt kết nối:", error);
            this.ws = null;
            this.isConnecting = false;
            this.isConnected = false;
        }
    }

    // Hàm tự động kết nối lại
    reconnect() {
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.error(
                `[WebSocket] Đã vượt quá số lần thử lại tối đa (${this.maxReconnectAttempts})`
            );
            return;
        }

        const delay = Math.min(
            5000 * Math.pow(1.5, this.reconnectAttempts - 1),
            60000
        );
        console.log(
            `[WebSocket] Thử kết nối lại lần ${this.reconnectAttempts} sau ${
                delay / 1000
            } giây...`
        );

        setTimeout(() => {
            try {
                this.connect();
            } catch (error) {
                console.error("[WebSocket] Lỗi khi thử kết nối lại:", error);
            }
        }, delay);
    }

    // Hàm gửi tin nhắn qua WebSocket
    sendMessage(message: string | Record<string, unknown>) {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const msgString =
                    typeof message === "string"
                        ? message
                        : JSON.stringify(message);
                this.ws.send(msgString);
                console.log(
                    "[WebSocket] Đã gửi tin nhắn:",
                    typeof message === "object"
                        ? JSON.stringify(message).substring(0, 100)
                        : (message as string).substring(0, 100)
                );
            } else {
                console.error(
                    "[WebSocket] Không thể gửi tin nhắn: WebSocket chưa mở"
                );
                this.reconnect();
            }
        } catch (error) {
            console.error("[WebSocket] Lỗi khi gửi tin nhắn:", error);
        }
    }
}

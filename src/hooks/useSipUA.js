import { useState } from "react";
import { UserAgent, Registerer } from "sip.js";
import toast from "react-hot-toast";

export function useSipUA() {
    const [ua, setUa] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = async (name, pass) => {
        if (!name || !pass) return;

        try {
            const uri = UserAgent.makeURI(
                `sip:${name}@azvidi.voicecloud-platform.com`
            );
            const configuration = {
                uri,
                authorizationUsername: name,
                authorizationPassword: pass,
                displayName: name,
                userAgentString: "Dart SIP Client v1.0.0",
                transportOptions: {
                    server: "wss://vcwebrtc.voicecloud.vn:9443",
                },
                registerExpires: 120,
                noAnswerTimeout: 60,
                sessionTimersEnabled: false,
            };

            const userAgent = new UserAgent(configuration);
            const registerer = new Registerer(userAgent);

            userAgent.transport.onConnect = () => {
                setIsConnected(true);
            };

            userAgent.transport.onDisconnect = () => {
                setIsConnected(false);
            };

            await userAgent.start();
            await new Promise((resolve) => setTimeout(resolve, 500));
            await registerer.register();

            setUa(userAgent);
            return userAgent;
        } catch (error) {
            console.error("Error with SIP connection:", error);
            toast.error("Không thể kết nối đến máy chủ SIP.");
            throw error;
        }
    };

    const disconnect = () => {
        if (ua) {
            ua.stop();
            setUa(null);
            setIsConnected(false);
        }
    };

    return { ua, isConnected, connect, disconnect };
}

import { useState, useEffect } from "react";

export function useOtpId() {
    const [otpId, setOtpIdState] = useState<string>("");

    // Load otpId from localStorage on mount
    useEffect(() => {
        const savedOtpId = localStorage.getItem("otpId");
        if (savedOtpId) {
            setOtpIdState(savedOtpId);
        }
    }, []);

    // Function to set otpId and save to localStorage
    const setOtpId = (id: string) => {
        setOtpIdState(id);
        if (id) {
            localStorage.setItem("otpId", id);
        } else {
            localStorage.removeItem("otpId");
        }
    };

    return {
        otpId,
        setOtpId,
    };
}

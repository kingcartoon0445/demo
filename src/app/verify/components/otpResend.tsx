import React, { useEffect, useState } from "react";

interface OtpResendProps {
    onResend: () => void;
}

export default function OtpResend({ onResend }: OtpResendProps) {
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(59);

    useEffect(() => {
        const interval = setInterval(() => {
            if (seconds > 0) {
                setSeconds(seconds - 1);
            }

            if (seconds === 0) {
                if (minutes === 0) {
                    clearInterval(interval);
                } else {
                    setSeconds(59);
                    setMinutes(minutes - 1);
                }
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    });

    const resendOTP = () => {
        if (!(seconds > 0 || minutes > 0)) {
            onResend();
            setMinutes(1);
            setSeconds(59);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="text-sm md:text-base mt-5">
                Chưa nhận được mail?{" "}
                <b
                    className={` ${
                        seconds > 0 || minutes > 0
                            ? "opacity-70 pointer-events-none"
                            : "cursor-pointer"
                    }`}
                    onClick={resendOTP}
                >
                    Ấn vào để gửi lại
                </b>
            </div>
            {(seconds > 0 || minutes > 0) && (
                <p>
                    Sau {minutes < 10 ? `0${minutes}` : minutes}:
                    {seconds < 10 ? `0${seconds}` : seconds}
                    &nbsp;giây
                </p>
            )}
        </div>
    );
}

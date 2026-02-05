import { useState, useRef, useEffect, useReducer } from "react";
import {
    getCallcampaignNextPhone,
    getCallcenterUserLine,
    callcenterTracking,
    getCallcampaignNextPhoneQueue,
    updateContactStage,
} from "@/api/callcenter";
import { Inviter, UserAgent } from "sip.js";
import { decryptPassword } from "@/lib/utils";
import { useUserProfile } from "@/hooks/auth";
import toast from "react-hot-toast";
import { useSipUA } from "@/hooks/useSipUA";
import { useTimer } from "@/hooks/useTimer";
import { useUserDetail } from "@/hooks/useUser";

export const useCallHandler = (orgId, campaignId) => {
    const [state, dispatch] = useReducer(callReducer, initialState);
    const { contact, callStatus, isMuted, callDuration } = state;
    const [contactQueue, setContactQueue] = useState([]);
    const isCallRef = useRef(false);
    const [isCall, setIsCall] = useState(false);

    const remoteAudio = useRef(null);
    const timerRef = useRef(null);
    const [session, setSession] = useState(null);
    const audioRef = useRef(new Audio("/sounds/ringback.mp3"));
    const callTimeoutRef = useRef(null);
    const { data: currentUser } = useUserDetail();

    const { ua, isConnected, connect, disconnect } = useSipUA();
    const [isSipConnected, setIsSipConnected] = useState(false);
    const [sipError, setSipError] = useState(null);
    const [sipCredentials, setSipCredentials] = useState(null);

    const { startTimer, stopTimer } = useTimer({
        onTick: () => dispatch({ type: "INCREMENT_DURATION" }),
        initialDuration: 0,
    });

    const callDurationRef = useRef(0);

    useEffect(() => {
        callDurationRef.current = callDuration;
    }, [callDuration]);

    const setupSipCall = async (nextContact, userAgent) => {
        try {
            // Kiểm tra userAgent trước khi thực hiện cuộc gọi
            if (!userAgent) {
                throw new Error("User agent SIP chưa được khởi tạo.");
            }

            // Kiểm tra contact trước khi thực hiện cuộc gọi
            if (!nextContact || !nextContact.phone) {
                throw new Error("Không có thông tin số điện thoại để gọi");
            }

            // Yêu cầu quyền microphone
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const options = {
                media: {
                    constraints: {
                        audio: true,
                        video: false,
                    },
                },
                sessionTimersEnabled: false,
            };

            const target = UserAgent.makeURI(
                `sip:${nextContact.phone}@azvidi.voicecloud-platform.com`
            );
            if (!target) throw new Error("Failed to create target URI");

            const inviter = new Inviter(userAgent, target, options);

            // Thiết lập timeout cho cuộc gọi
            callTimeoutRef.current = setTimeout(() => {
                if (session && callStatus === "ringing") {
                    handleHangup();
                    toast.error("Cuộc gọi đã hết thời gian chờ.");
                }
            }, 60000);

            inviter.stateChange.addListener((state, session) => {
                switch (state) {
                    case "Establishing":
                        dispatch({ type: "SET_STATUS", payload: "ringing" });
                        audioRef.current.loop = true;
                        audioRef.current.play();
                        stopTimer();
                        break;
                    case "Established":
                        clearTimeout(callTimeoutRef.current);
                        dispatch({ type: "SET_STATUS", payload: "connected" });
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        startTimer();

                        const pc =
                            inviter.sessionDescriptionHandler.peerConnection;
                        const remoteStream = new MediaStream();
                        pc.getReceivers().forEach((receiver) => {
                            if (receiver.track) {
                                remoteStream.addTrack(receiver.track);
                            }
                        });
                        if (remoteAudio.current) {
                            remoteAudio.current.srcObject = remoteStream;
                            remoteAudio.current
                                .play()
                                .catch((e) =>
                                    console.error("Error playing audio:", e)
                                );
                        }
                        break;
                    case "Terminated":
                        let cause = "No Answer";
                        // Kiểm tra response để xác định cause
                        const response = inviter.request?.response;
                        if (response?.message?.statusCode === 486) {
                            cause = "Busy";
                        } else if (response?.message?.statusCode === 408) {
                            cause = "Request Timeout";
                        }
                        handleCallEnded({ status: "terminated", cause });
                        break;
                }
            });

            // Cleanup stream sau khi đã thiết lập cuộc gọi
            stream.getTracks().forEach((track) => track.stop());

            return inviter;
        } catch (error) {
            console.error("Error setting up SIP call:", error);
            throw error;
        }
    };

    const connectSip = async (userLine) => {
        if (!userLine) {
            toast.error("Không có thông tin tổng đài để kết nối SIP.");
            return false;
        }

        const credentials = {
            name: userLine.name,
            ext: userLine.ext,
            pass: decryptPassword(userLine.passwordHash, currentUser?.id),
        };

        try {
            const userAgent = await connect(credentials.name, credentials.pass);
            if (!userAgent) {
                throw new Error("Không thể kết nối SIP");
            }
            setIsSipConnected(true);
            setSipCredentials(credentials);
            return true;
        } catch (error) {
            console.error("Error connecting to SIP:", error);
            setSipError(error.message || "Lỗi kết nối SIP");
            toast.error(error.message || "Lỗi kết nối SIP");
            return false;
        }
    };

    const handleCall = async () => {
        try {
            // Reset duration khi bắt đầu cuộc gọi mới
            dispatch({ type: "RESET_DURATION" });
            dispatch({ type: "SET_STATUS", payload: "connecting" });

            let userLine;
            if (!sipCredentials) {
                const res = await getCallcenterUserLine(orgId);
                if (res?.code !== 0) {
                    toast.error(
                        "Bạn cần đăng ký tổng đài để sử dụng tính năng này."
                    );
                    setIsCall(false);
                    return;
                }
                userLine = res.content.find((item) => item.status === 1);
                if (!userLine) {
                    toast.error(
                        "Bạn cần đăng ký tổng đài để sử dụng tính năng này."
                    );
                    setIsCall(false);
                    return;
                }
                // 2. Kết nối SIP nếu chưa kết nối
                const isConnected = await connectSip(userLine);
                if (!isConnected) {
                    setIsCall(false);
                    return; // Dừng hàm nếu có lỗi kết nối SIP
                }
            }
            // 3. Lấy số điện thoại tiếp theo TRƯỚC
            const nextPhoneRes = await getCallcampaignNextPhone(
                orgId,
                campaignId
            );
            if (!nextPhoneRes?.content) {
                setIsCall(false);
                throw new Error("Không thể lấy số điện thoại tiếp theo");
            }

            // Đảm bảo có thông tin contact
            if (!nextPhoneRes.content.phone) {
                setIsCall(false);
                throw new Error("Số điện thoại không hợp lệ");
            }

            // Cập nhật state
            dispatch({ type: "SET_CONTACT", payload: nextPhoneRes.content });

            // Đợi một chút để đảm bảo state đã được cập nhật
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 4. Cập nhật queue
            fetchNextContacts();

            // 5. Thiết lập và thực hiện cuộc gọi
            const inviter = await setupSipCall(nextPhoneRes.content, ua);
            setSession(inviter);
            await inviter.invite();

            // 6. Tracking cuộc gọi
            callcenterTracking(orgId, null, {
                campaignId: campaignId,
                contactId: nextPhoneRes.content.id,
                type: "AUTOCALL",
                extention: sipCredentials.ext,
                phone: nextPhoneRes.content.phone,
            });

            // Thiết lập timeout
            callTimeoutRef.current = setTimeout(() => {
                if (callStatus === "ringing") {
                    handleHangup();
                    toast.error("Cuộc gọi đã hết thời gian chờ");
                }
            }, 60000);
        } catch (error) {
            console.error("Call error:", error);
            setIsCall(false);
            toast.error(error.message || "Lỗi khi thực hiện cuộc gọi");
            handleCallEnded();
        }
    };

    const handleCallEnded = async ({ status, cause } = {}) => {
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        dispatch({ type: "SET_STATUS", payload: "ended" });
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        stopTimer();

        // Sử dụng callDurationRef.current để lấy giá trị mới nhất
        if (callDurationRef.current === 0 && isCallRef.current) {
            handleCallAgain();
        }

        if (session) {
            try {
                const pc = session.sessionDescriptionHandler.peerConnection;
                if (pc) {
                    pc.getSenders().forEach((sender) => {
                        if (sender.track) {
                            sender.track.stop();
                        }
                    });
                    pc.getReceivers().forEach((receiver) => {
                        if (receiver.track) {
                            receiver.track.stop();
                        }
                    });
                    pc.close();
                }
                if (session.state !== "Terminated") {
                    await session.bye();
                }
            } catch (error) {
                console.error("Error ending session:", error);
            }
        }

        if (remoteAudio.current) {
            remoteAudio.current.srcObject = null;
        }

        setSession(null);
    };

    const handleHangup = async (options = {}) => {
        isCallRef.current = false;
        setIsCall(false);

        if (!session) {
            dispatch({ type: "SET_STATUS", payload: "idle" });
            setIsCall(false);
            audioRef.current?.pause();
            audioRef.current.currentTime = 0;
            await handleCallEnded({ status: "cancel", cause: "close" });
            return;
        }

        try {
            if (session.state === "Established") {
                await session.bye();
            } else {
                await session.cancel();
            }
        } catch (error) {
            console.error("Error hanging up:", error);
        }

        await handleCallEnded({ status: "cancel", cause: "close" });

        dispatch({ type: "SET_STATUS", payload: "idle" });
        audioRef.current?.pause();
        audioRef.current.currentTime = 0;
    };
    const handleUpdateContactStage = async (
        contactId,
        stageId,
        note,
        isCompleted
    ) => {
        await updateContactStage(orgId, campaignId, contactId, {
            stageId,
            note,
            isCompleted,
        });
    };

    const handleToggleMute = () => {
        if (session) {
            const audioSender = session.sessionDescriptionHandler.peerConnection
                .getSenders()
                .find((sender) => sender.track?.kind === "audio");

            if (audioSender) {
                audioSender.track.enabled = isMuted;
                dispatch({ type: "TOGGLE_MUTE" });
            }
        }
    };

    useEffect(() => {
        const setupSip = async () => {
            const res = await getCallcenterUserLine(orgId);
            if (res?.code === 0) {
                const userLine = res.content.find((item) => item.status === 1);
                if (userLine) {
                    await connectSip(userLine);
                }
            }
        };
        setupSip();
    }, [orgId, campaignId]);

    const fetchNextContacts = async () => {
        try {
            const response = await getCallcampaignNextPhoneQueue(
                orgId,
                campaignId
            );
            if (response?.content?.length > 0) {
                setContactQueue(response.content);
                return response.content;
            }
            return null;
        } catch (error) {
            console.error("Error fetching next contacts:", error);
            toast.error("Không thể lấy thông tin liên hệ tiếp theo");
            return null;
        }
    };

    useEffect(() => {
        return () => {
            stopTimer();
            if (session) {
                session.terminate();
            }
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
            }
            disconnect();
            setIsSipConnected(false);
        };
    }, []);

    const handleCallAgain = async () => {
        try {
            setSession(null);
            handleCall();
        } catch (error) {
            console.error("Error in handleCallAgain:", error);
            toast.error("Không thể thực hiện cuộc gọi mới");
        }
    };

    useEffect(() => {
        isCallRef.current = isCall;
    }, [isCall]);

    return {
        contact,
        callStatus,
        isMuted,
        callDuration,
        remoteAudio,
        handleCall,
        handleHangup,
        handleToggleMute,
        fetchNextContacts,
        contactQueue,
        handleCallAgain,
        handleUpdateContactStage,
        isCall,
        setIsCall,
    };
};

const callReducer = (state, action) => {
    switch (action.type) {
        case "SET_CONTACT":
            return { ...state, contact: action.payload };
        case "SET_STATUS":
            return { ...state, callStatus: action.payload };
        case "TOGGLE_MUTE":
            return { ...state, isMuted: !state.isMuted };
        case "INCREMENT_DURATION":
            return { ...state, callDuration: state.callDuration + 1 };
        case "RESET_DURATION":
            return { ...state, callDuration: 0 };
        default:
            return state;
    }
};

const initialState = {
    contact: null,
    callStatus: "idle",
    isMuted: false,
    callDuration: 0,
};

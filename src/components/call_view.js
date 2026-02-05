import { callcenterTracking, getCallcenterUserLine } from "@/api/callcenter";
import { updateJourney } from "@/api/customer";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useCustomerList } from "@/hooks/customers_data";
import { useSipUA } from "@/hooks/useSipUA";
import {
    cn,
    decryptPassword,
    getAvatarUrl,
    getFirstAndLastWord,
} from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { MdCallEnd } from "react-icons/md";
import { Inviter, UserAgent } from "sip.js";
import CallResultDialog from "./call_result_dialog";
import { useUserDetail } from "@/hooks/useUser";
import { useNoteCustomer } from "@/hooks/useCustomerV2";

export default function CallView() {
    const [sipCredentials, setSipCredentials] = useState(null);
    const { orgId, workspaceId } = useParams();
    const { data: currentUser } = useUserDetail();
    const [session, setSession] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [callStatus, setCallStatus] = useState("idle");
    const [customer, setCustomer] = useState(null);
    const [activePhoneNumber, setActivePhoneNumber] = useState(null);
    const audioRef = useRef(new Audio("/sounds/ringback.mp3"));
    const remoteAudio = useRef(null);
    const callTimeoutRef = useRef(null);
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef(null);
    const [openScript, setOpenScript] = useState(false);
    const [selectedScript, setSelectedScript] = useState(0);
    const router = useRouter();
    const { setRefresh } = useCustomerList();
    const [lastCallDuration, setLastCallDuration] = useState(0);

    const [scriptList, setScriptList] = useState([
        {
            title: "Kịch bản tư vấn BĐS",
            content: [
                "1. Lời chào và giới thiệu:",
                '"Chào anh/chị [Tên khách hàng]!, em là [Tên bạn] từ [Tên công ty].',
                'Em gọi để hỗ trợ anh/chị tìm hiểu về dự án mà mình quan tâm."',

                "2. Xác nhận nhu cầu:",
                '"Anh/chị đang quan tâm đến loại hình nào, và có yêu cầu gì đặc biệt không ạ? Để em tư vấn dự án phù hợp hơn."',

                "3. Giới thiệu dự án:",
                '"Dự án [tên dự án] rất phù hợp với anh/chị [đơn tải điểm nổi bật như vị trí, tiện ích, ưu đãi]. Hiện có ưu đãi hấp dẫn như [nêu ưu đãi ngắn gọn]."',

                "4. Đặt lịch hẹn:",
                '"Anh/chị có muốn đến tham quan dự án vào thời gian nào phù hợp không ạ? Trải nghiệm trực tiếp sẽ giúp anh/chị hình dung rõ hơn."',

                "5. Kết thúc:",
                '"Cảm ơn anh/chị đã lắng nghe! Em sẽ gửi thêm thông tin chi tiết qua [email/zalo]. Mong sớm gặp anh/chị tại dự án!"',
            ],
        },
        {
            title: "Kịch bản B",
            content: [],
        },
        {
            title: "Kịch bản C",
            content: [],
        },
        {
            title: "Kịch bản A",
            content: [],
        },
    ]);
    const endCallTimeoutRef = useRef(null);
    const [showCallResult, setShowCallResult] = useState(false);
    const [callViewPosition, setCallViewPosition] = useState({
        bottom: 16,
        right: 16,
    });

    const { ua, isConnected, connect } = useSipUA();

    // Tìm nút gọi điện và đặt CallView ở trên nó
    useEffect(() => {
        if (session || showCallResult) {
            const updatePosition = () => {
                const callButton = document.querySelector("[data-call-button]");
                if (callButton) {
                    const rect = callButton.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    const windowWidth = window.innerWidth;

                    // Đặt CallView ở trên nút gọi điện
                    // bottom = khoảng cách từ bottom của window đến top của nút + margin
                    const bottom = windowHeight - rect.top + 12; // 12px margin phía trên nút
                    // right = căn chỉnh theo bên phải của nút, dịch sang phải thêm 50%
                    const buttonWidth = rect.right - rect.left;
                    const right = windowWidth - rect.right - buttonWidth - 100;

                    setCallViewPosition({ bottom, right });
                } else {
                    // Fallback: đặt ở góc dưới bên phải
                    setCallViewPosition({ bottom: 16, right: 16 });
                }
            };

            // Cập nhật ngay lập tức
            updatePosition();

            // Sử dụng requestAnimationFrame để đảm bảo DOM đã render
            const rafId = requestAnimationFrame(() => {
                updatePosition();
            });

            // Lắng nghe các sự kiện để cập nhật vị trí
            window.addEventListener("resize", updatePosition);
            window.addEventListener("scroll", updatePosition, true);

            return () => {
                cancelAnimationFrame(rafId);
                window.removeEventListener("resize", updatePosition);
                window.removeEventListener("scroll", updatePosition, true);
            };
        }
    }, [session, showCallResult]);

    // Xử lý sự kiện khi có cuộc gọi mới từ customer_detail
    useEffect(() => {
        const handleNewCall = async (event) => {
            // Hiển thị ngay lập tức khi bắt đầu gọi
            setCallStatus("connecting");

            const phoneNumber = event.detail.phone;
            setCustomer(event.detail);
            if (!phoneNumber) return;

            try {
                // Lấy thông tin máy nhánh mới nhất khi bắt đầu gọi
                const res = await getCallcenterUserLine(orgId);
                if (res?.code === 0) {
                    const userLine = res.content.find(
                        (item) => item.status === 1
                    );
                    if (!userLine) {
                        throw new Error(
                            "Bạn cần đăng ký tổng đài để sử dụng tính năng này."
                        );
                    }
                    const credentials = {
                        name: userLine.name,
                        pass: decryptPassword(
                            userLine.passwordHash,
                            currentUser?.id
                        ),
                    };

                    // Yêu cầu quyền microphone và kết nối SIP
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                    });

                    // Kết nối SIP với thông tin mới nhất
                    const userAgent = await connect(
                        credentials.name,
                        credentials.pass
                    );
                    if (!userAgent) {
                        throw new Error("Không thể kết nối SIP");
                    }

                    callcenterTracking(orgId, event.detail?.workspaceId, {
                        phone: phoneNumber,
                        contactId: event.detail?.id,
                        extention: credentials.name,
                        telePhoneNumber: userLine.telePhoneNumber,
                    });
                    setActivePhoneNumber(phoneNumber);

                    try {
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
                            `sip:${phoneNumber}@azvidi.voicecloud-platform.com`
                        );
                        if (!target)
                            throw new Error("Failed to create target URI");

                        const inviter = new Inviter(userAgent, target, options);

                        callTimeoutRef.current = setTimeout(() => {
                            if (session && callStatus === "ringing") {
                                handleHangup();
                                toast.error("Cuộc gọi đã hết thời gian chờ.");
                            }
                        }, 60000);

                        inviter.stateChange.addListener((state) => {
                            switch (state) {
                                case "Establishing":
                                    setCallStatus("ringing");
                                    audioRef.current.loop = true;
                                    audioRef.current.play();
                                    break;
                                case "Established":
                                    clearTimeout(callTimeoutRef.current);
                                    setCallStatus("connected");
                                    audioRef.current.pause();
                                    audioRef.current.currentTime = 0;

                                    const pc =
                                        inviter.sessionDescriptionHandler
                                            .peerConnection;
                                    const remoteStream = new MediaStream();
                                    pc.getReceivers().forEach((receiver) => {
                                        if (receiver.track) {
                                            remoteStream.addTrack(
                                                receiver.track
                                            );
                                        }
                                    });
                                    if (remoteAudio.current) {
                                        remoteAudio.current.srcObject =
                                            remoteStream;
                                        remoteAudio.current
                                            .play()
                                            .catch((e) =>
                                                console.error(
                                                    "Error playing audio:",
                                                    e
                                                )
                                            );
                                    }
                                    break;
                                case "Terminated":
                                    handleCallEnded();
                                    break;
                            }
                        });

                        inviter.invite().catch((error) => {
                            console.error("Call failed:", error);
                            handleHangup();
                        });

                        setSession(inviter);

                        // Tracking cuộc gọi
                        callcenterTracking(orgId, null, {
                            phone: phoneNumber,
                            extention: credentials.name,
                            contactId: event.detail?.id,
                        });

                        // Cleanup stream sau khi đã thiết lập cuộc gọi
                        stream.getTracks().forEach((track) => track.stop());
                    } catch (error) {
                        console.error("Error making call:", error);
                        stream.getTracks().forEach((track) => track.stop());
                        handleHangup();
                    }

                    // Cập nhật sipCredentials sau khi đã kết nối thành công
                    setSipCredentials(credentials);
                } else {
                    throw new Error(
                        res?.message || "Không thể lấy thông tin máy nhánh"
                    );
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error(
                    error.message ||
                        "Không thể thực hiện cuộc gọi. Vui lòng thử lại."
                );
                handleHangup();
            }
        };

        window.addEventListener("initiate-call", handleNewCall);
        return () => window.removeEventListener("initiate-call", handleNewCall);
    }, [orgId, currentUser]);

    // Them useEffect de xu ly timer
    useEffect(() => {
        if (callStatus === "connected") {
            timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [callStatus]);

    const handleCallEnded = () => {
        clearTimeout(callTimeoutRef.current);
        setOpenScript(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setLastCallDuration(callDuration);
        setCallDuration(0);
        setCallStatus("ended");

        endCallTimeoutRef.current = setTimeout(() => {
            if (session) {
                const pc = session.sessionDescriptionHandler.peerConnection;
                if (pc) {
                    pc.getSenders().forEach((sender) => {
                        if (sender.track) sender.track.stop();
                    });
                }
            }
            if (remoteAudio.current) {
                remoteAudio.current.srcObject = null;
            }
            setSession(null);
            setCallStatus("idle");
            setActivePhoneNumber(null);
            setIsMuted(false);
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }, 1000);

        if (session?.state === "Terminated" || !session?.state) {
            setShowCallResult(true);
        }

        // Ngắt kết nối SIP khi kết thúc
        if (ua) {
            ua.stop();
        }
    };

    const handleHangup = () => {
        if (session) {
            try {
                if (session.state === "Established") {
                    session.bye();
                } else {
                    session.cancel();
                }
                handleCallEnded();
            } catch (error) {
                console.error("Lỗi khi kết thúc cuộc gọi:", error);
                handleCallEnded();
            }
        }
    };

    const handleToggleMute = () => {
        if (session) {
            const pc = session.sessionDescriptionHandler.peerConnection;
            if (pc) {
                pc.getSenders().forEach((sender) => {
                    if (sender.track && sender.track.kind === "audio") {
                        sender.track.enabled = !sender.track.enabled;
                    }
                });
                setIsMuted(!isMuted);
            }
        }
    };

    // Thêm hàm để format thời gian
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            if (endCallTimeoutRef.current) {
                clearTimeout(endCallTimeoutRef.current);
            }
        };
    }, []);
    const { mutateAsync: noteCustomer } = useNoteCustomer(orgId, customer?.id);

    const handleSubmitCallResult = (stage, note) => {
        ToastPromise(async () => {
            await noteCustomer({
                note: note,
            });
            setShowCallResult(false);
            if (workspaceId == customer?.workspaceId) {
                setRefresh();
            }
        });
    };
    if (!session && !showCallResult) return null;

    if (!session)
        return (
            <CallResultDialog
                open={showCallResult}
                setOpen={setShowCallResult}
                customer={customer}
                duration={lastCallDuration}
                onSubmit={handleSubmitCallResult}
            />
        );

    return (
        <AnimatePresence>
            <motion.div
                data-call-status={callStatus}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed z-[100]"
                style={{
                    bottom: `${callViewPosition.bottom}px`,
                    right: `${callViewPosition.right}px`,
                }}
            >
                <div
                    className={`bg-[#1C0F4B] px-4 py-2.5 z-[100] max-w-[420px] rounded-[34px] shadow-lg`}
                >
                    <div className="flex items-center">
                        <Avatar
                            className="cursor-pointer"
                            name={getFirstAndLastWord(customer?.fullName)}
                            src={getAvatarUrl(customer?.avatar)}
                            size="40"
                            round={true}
                            onClick={() =>
                                router.push(
                                    `/org/${orgId}/workspace/${customer?.workspaceId}?cid=${customer?.id}`
                                )
                            }
                        />
                        <div
                            className={cn(
                                "flex flex-col ml-2 mr-auto pr-8 leading-[1.4]"
                            )}
                        >
                            <span className="font-medium text-white text-[15px]">
                                {customer?.fullName}
                            </span>
                            <span className="text-[13px] text-white">
                                {callStatus === "connecting" ? (
                                    "Đang kết nối..."
                                ) : callStatus === "ringing" ? (
                                    "Đang đổ chuông..."
                                ) : callStatus === "connected" ? (
                                    <span style={{ color: "#37C058" }}>
                                        {formatTime(callDuration)}
                                    </span>
                                ) : callStatus === "ended" ? (
                                    <span style={{ color: "#FF0000" }}>
                                        Kết thúc cuộc gọi
                                    </span>
                                ) : (
                                    ""
                                )}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            {/* <Button
                                variant="default"
                                size="icon"
                                onClick={() => setOpenScript(!openScript)}
                                className={`rounded-full bg-land hover:bg-land ${openScript ? 'bg-white hover:bg-white' : ''}`}
                            >
                                <MdDescription className={cn("h-5 w-5 text-white", openScript && "text-[#532AE7]")} />
                            </Button> */}
                            <Button
                                variant="default"
                                size="icon"
                                onClick={handleToggleMute}
                                className={`rounded-full bg-white hover:bg-white ${
                                    isMuted
                                        ? "bg-[#646A73] hover:bg-[#646A73]"
                                        : ""
                                }`}
                            >
                                {isMuted ? (
                                    <BiSolidMicrophoneOff className="h-5 w-5 text-white" />
                                ) : (
                                    <BiSolidMicrophone className="h-5 w-5 text-[#532AE7]" />
                                )}
                            </Button>

                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleHangup}
                                className="rounded-full"
                            >
                                <MdCallEnd className="h-5 w-5 text-white" />
                            </Button>
                        </div>
                    </div>

                    <div
                        className={cn(
                            "rounded-lg transition-all duration-500 ease-in-out",
                            openScript
                                ? "opacity-100 my-4 bg-white p-4 max-h-[450px] max-w-[420px]"
                                : "opacity-0 max-h-0 max-w-0"
                        )}
                    >
                        <div className="flex gap-2 mb-4 overflow-hidden overflow-x-auto">
                            {scriptList.map((script, index) => (
                                <Button
                                    key={index}
                                    variant="default"
                                    className={cn(
                                        "bg-[#532AE7] hover:bg-[#532AE7] text-white rounded-lg outline-none text-xs h-[35px]",
                                        selectedScript !== index
                                            ? "bg-white hover:bg-white text-land border border-land"
                                            : "border-none"
                                    )}
                                    onClick={() => setSelectedScript(index)}
                                >
                                    {script.title}
                                </Button>
                            ))}
                        </div>
                        <div className="text-[#1C0F4B] whitespace-pre-line overflow-hidden overflow-y-auto max-h-[350px]">
                            {scriptList[selectedScript]?.content.map(
                                (line, index) => (
                                    <div
                                        key={index}
                                        className="mb-2 text-[13px]"
                                    >
                                        {line}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    <audio ref={remoteAudio} autoPlay />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

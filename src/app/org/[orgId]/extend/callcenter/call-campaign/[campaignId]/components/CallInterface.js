import { motion, AnimatePresence } from "framer-motion";
import Avatar from "react-avatar";
import { Button } from "@/components/ui/button";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { MdCallEnd, MdOutlineCall } from "react-icons/md";
import { getFirstAndLastWord } from "@/lib/utils";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useRouter } from "next/navigation";
import StageSelect from "@/components/customer_stage";
import { useState } from "react";
import { toast } from "react-hot-toast";

export const CallInterface = ({
    contact,
    callStatus,
    callDuration,
    isMuted,
    remoteAudio,
    onHangup,
    onToggleMute,
    campaign,
    contactQueue = [],
    onCallAgain,
    onBack,
    handleUpdateContactStage,
}) => {
    const router = useRouter();
    const [stage, setStage] = useState(null);
    const [note, setNote] = useState("");
    const [isNoCallback, setIsNoCallback] = useState(true);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const handleHangup = async () => {
        try {
            await onHangup();
        } catch (error) {
            console.error("Error during hangup:", error);
        }
    };
    const handleSaveAndClose = async () => {
        await onHangup();
        handleUpdateContactStage(contact.id, stage?.id, note, isNoCallback);
        setStage(null);
        setNote("");
        setIsNoCallback(false);
        onBack();
    };

    const handleSaveAndNext = async () => {
        if (!stage) {
            toast.error("Vui lòng chọn trạng thái khách hàng");
            return;
        }

        // Lưu thông tin cuộc gọi hiện tại
        handleUpdateContactStage(contact.id, stage?.id, note, isNoCallback);

        // Reset form
        setStage(null);
        setNote("");
        setIsNoCallback(false);

        // Thực hiện cuộc gọi mới
        onCallAgain();
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex h-full">
                <div className="w-[30%]">
                    <div className="flex flex-col space-y-2 p-4 rounded-lg">
                        <div className="font-medium ml-3 text-md text-titl mb-1">
                            Tiếp theo
                        </div>
                        <div className="space-y-2 w-full">
                            {(contactQueue || [])
                                .slice(1, 10)
                                .map((nextContact, index) => (
                                    <div
                                        key={nextContact.id}
                                        className="flex items-center gap-3 p-2 rounded-lg"
                                    >
                                        <div className="w-10 h-10 flex items-center justify-center bg-bg2 rounded-lg">
                                            <MdOutlineCall className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-medium text-gray-800">
                                                {nextContact?.fullName ||
                                                    "Không xác định"}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {nextContact?.phone.replace(
                                                    /^84/g,
                                                    "0"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            {(contactQueue || []).length === 0 && (
                                <div className="text-center text-gray-500 text-sm py-2">
                                    Không có liên hệ nào trong danh sách chờ
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="border-l border-gray-200"></div>
                <div className="bg-white rounded-2xl p-8 w-[40%] flex flex-col items-center mt-[5%]">
                    <audio ref={remoteAudio} />
                    <AnimatePresence>
                        {callStatus !== "ended" ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center space-y-4"
                            >
                                <Avatar
                                    name={
                                        getFirstAndLastWord(
                                            contact?.fullName
                                        ) || contact?.phone
                                    }
                                    size="120"
                                    round={true}
                                    className="shadow-lg"
                                />
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    {contact?.fullName || "Không xác định"}
                                </h2>
                                <p className="text-lg text-gray-600">
                                    {contact?.phone.replace(/^84/g, "0")}
                                </p>
                                <div className="mt-6 text-center">
                                    <p className="text-lg font-medium text-gray-600 capitalize">
                                        {callStatus === "ringing" &&
                                            "Đang gọi..."}
                                        {callStatus === "connected" &&
                                            "Đang trong cuộc gọi"}
                                    </p>
                                    {callStatus === "connected" && (
                                        <p className="text-2xl font-semibold text-gray-800 mt-2">
                                            {formatTime(callDuration)}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-8 flex items-center justify-center space-x-6">
                                    <Button
                                        onClick={onToggleMute}
                                        variant="ghost"
                                        size="icon"
                                        className={`w-14 h-14 rounded-full ${
                                            isMuted
                                                ? "bg-red-100 text-red-600"
                                                : "bg-gray-100 text-gray-600"
                                        } hover:bg-gray-200 transition-colors`}
                                    >
                                        {isMuted ? (
                                            <BiSolidMicrophoneOff className="w-6 h-6" />
                                        ) : (
                                            <BiSolidMicrophone className="w-6 h-6" />
                                        )}
                                    </Button>
                                    {
                                        <Button
                                            onClick={handleHangup}
                                            variant="destructive"
                                            size="icon"
                                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                                        >
                                            <MdCallEnd className="w-6 h-6" />
                                        </Button>
                                    }
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center w-full"
                            >
                                <h2 className="text-xl font-medium mb-4">
                                    Kết quả cuộc gọi
                                </h2>
                                <Avatar
                                    name={
                                        getFirstAndLastWord(
                                            contact?.fullName
                                        ) || contact?.phone
                                    }
                                    size="64"
                                    round={true}
                                    className="mb-2"
                                />
                                <p className="text-lg font-medium">
                                    {contact?.fullName || "Mr. A"}
                                </p>
                                <p className="text-gray-600 mb-6">
                                    {contact?.phone.replace(/^84/g, "0")}
                                </p>

                                <div className="w-full space-y-4">
                                    <div className="flex items-center">
                                        <span className="text-gray-600">
                                            Thời lượng:
                                        </span>
                                        <span className="ml-2 font-medium">
                                            {formatTime(callDuration)}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-gray-600">
                                            Trạng thái khách hàng
                                        </label>
                                        <StageSelect
                                            stage={stage}
                                            setStage={setStage}
                                            isShowIcon={false}
                                            className="w-full bg-none outline outline-1 outline-gray-200 rounded-lg px-3 py-2 justify-between text-text2 font-normal text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-gray-600">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            className="w-full p-2 border rounded-lg min-h-[100px]"
                                            placeholder="Nhập ghi chú..."
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center mt-2">
                                        <input
                                            checked={isNoCallback}
                                            onChange={() =>
                                                setIsNoCallback(!isNoCallback)
                                            }
                                            type="checkbox"
                                            id="noCallback"
                                            className="mr-2"
                                        />
                                        <label htmlFor="noCallback">
                                            Không gọi lại
                                        </label>
                                    </div>

                                    <div className="flex justify-between gap-4 mt-4">
                                        <Button
                                            onClick={handleSaveAndClose}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Lưu & đóng gọi
                                        </Button>
                                        <Button
                                            onClick={handleSaveAndNext}
                                            className="flex-1"
                                        >
                                            Lưu & gọi tiếp
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="border-l border-gray-200"></div>
                <div className="flex flex-col w-[30%] p-4">
                    <h3 className="text-lg font-medium">
                        Kịch bản gọi điện tư vấn
                    </h3>
                    <div className="flex flex-col mt-2">
                        {campaign?.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

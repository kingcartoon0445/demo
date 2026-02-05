import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { IoIosArrowRoundBack } from "react-icons/io";
import { CallInterface } from "./CallInterface";

export default function CallView({ campaign, setIsCall, callHandler }) {
    const { orgId, id } = useParams();
    const {
        contact,
        callStatus,
        isMuted,
        callDuration,
        remoteAudio,
        handleHangup,
        handleToggleMute,
        contactQueue,
        handleCallAgain,
        handleUpdateContactStage,
    } = callHandler;

    const handleBack = () => {
        handleHangup();
        setIsCall(false);
    };

    return (
        <div className="rounded-2xl flex flex-col bg-white h-full">
            {/* Header */}
            <div className="flex items-center w-full pl-5 pr-3 py-4 border-b relative">
                <div className="text-[18px] font-medium">
                    Tên chiến dịch: {campaign?.title}
                </div>
                <div className="flex gap-2 absolute right-5">
                    <Button
                        onClick={handleBack}
                        className="flex items-center gap-1 h-[35px] px-[10px] bg-land hover:bg-land/90 rounded-xl"
                    >
                        <IoIosArrowRoundBack className="text-2xl" />
                        Thoát
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <CallInterface
                contact={contact}
                campaign={campaign}
                callStatus={callStatus}
                callDuration={callDuration}
                isMuted={isMuted}
                remoteAudio={remoteAudio}
                onHangup={handleHangup}
                onToggleMute={handleToggleMute}
                onCallAgain={handleCallAgain}
                contactQueue={contactQueue}
                onBack={handleBack}
                handleUpdateContactStage={handleUpdateContactStage}
            />
        </div>
    );
}

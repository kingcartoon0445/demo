import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdClose } from "react-icons/md";
import { useState } from "react";

import ConfigurationStep from "./steps/ConfigurationStep";
import ContactListStep from "./steps/ContactListStep";
import ScriptStep from "./steps/ScriptStep";
import toast from "react-hot-toast";
import { createCallcampaign } from "@/api/callcenter";
import { useParams } from "next/navigation";
import { useCallCampaignList } from "./list_item";

export default function CreateCampaignDialog({ open, setOpen }) {
    const [step, setStep] = useState(1);
    const { orgId } = useParams();
    const [formData, setFormData] = useState({
        name: "",
        staff: "",
        phone: "",
        retryCount: 2,
        retryTime: 1,
        retryType: "hours",
        settings: {
            after5pm: false,
            autocare: false,
            autocreate: false,
            allowrecall: false,
            autohangup: false,
        },
    });
    const [contacts, setContacts] = useState([]);
    const [script, setScript] = useState("");
    const { addCallCampaign } = useCallCampaignList();
    const canProceedToNextStep = () => {
        if (step === 1 && (!formData.name || !formData.staff)) {
            return toast.error("Vui lòng điền đẩy đủ thông tin");
        }
        return "continue";
    };

    const handleNext = () => {
        if (canProceedToNextStep() === "continue") {
            setStep((prev) => prev + 1);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <ConfigurationStep
                        formData={formData}
                        setFormData={setFormData}
                    />
                );
            case 2:
                return (
                    <ContactListStep
                        contacts={contacts}
                        setContacts={setContacts}
                    />
                );
            case 3:
                return <ScriptStep script={script} setScript={setScript} />;
            default:
                return null;
        }
    };
    const getTimeNumber = (time) => {
        if (time === "hours") {
            return 1;
        }
        if (time === "months") {
            return 30;
        }
        if (time === "years") {
            return 365;
        }
        return 1;
    };
    const handleSubmit = () => {
        const body = {
            title: formData.name,
            packageUsageId: formData.phone,
            retryCountOnFailure: formData.retryCount,
            failureRetryDelay:
                getTimeNumber(formData.retryType) * formData.retryTime,
            content: script,
            profileIds: formData.staff,
            isAllowCallsOutside: formData.settings.after5pm,
            isAutoUpdateStage: formData.settings.autocare,
            isAllowManualDialing: formData.settings.allowrecall,
            isAutoEndIfNoAnswer: formData.settings.autohangup,
            contacts,
        };
        createCallcampaign(orgId, body).then((res) => {
            if (res.code === 0) {
                toast.success("Tạo chiến dịch thành công");
                addCallCampaign(res.content);
                setOpen(false);
            } else {
                toast.error(
                    res?.message ?? "Có lỗi xảy ra xin vui lòng thử lại"
                );
            }
        });

        // setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Tạo chiến dịch quay số
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1">
                    <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-center w-full">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                    {[1, 2, 3].map((num) => (
                                        <>
                                            <div
                                                className={`w-8 h-8 rounded-full border-2 ${
                                                    step >= num
                                                        ? "border-primary text-primary"
                                                        : "border-gray-200 text-title"
                                                } font-medium flex items-center justify-center`}
                                            >
                                                {num}
                                            </div>
                                            {num < 3 && (
                                                <div
                                                    className={`w-28 h-[2px] ${
                                                        step > num
                                                            ? "bg-primary"
                                                            : "bg-gray-200"
                                                    }`}
                                                ></div>
                                            )}
                                        </>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between w-full mt-2 text-sm whitespace-nowrap">
                                    <div className="w-20 text-center -ml-6 text-primary font-medium">
                                        Cấu hình
                                    </div>
                                    <div
                                        className={`w-26 text-center ${
                                            step >= 2
                                                ? "text-primary"
                                                : "text-title"
                                        } font-medium`}
                                    >
                                        Danh sách liên hệ
                                    </div>
                                    <div
                                        className={`w-20 text-center -mr-6 ${
                                            step >= 3
                                                ? "text-primary"
                                                : "text-title"
                                        } font-medium`}
                                    >
                                        Kịch bản
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderStepContent()}
                    </div>
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button
                        variant="outline"
                        onClick={() =>
                            step === 1 ? setOpen(false) : setStep(step - 1)
                        }
                    >
                        {step === 1 ? "Hủy" : "Quay lại"}
                    </Button>
                    <Button onClick={step === 3 ? handleSubmit : handleNext}>
                        {step === 3 ? "Hoàn thành" : "Tiếp theo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

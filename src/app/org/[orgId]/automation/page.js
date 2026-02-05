"use client";
import { Button } from "@/components/ui/button";
import { MdAdd } from "react-icons/md";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import AutomationDialog from "./components/AutomationDialog";
import RecallConfigDialogNew from "./components/RecallConfigDialogNew";
import ReminderConfigDialog from "./components/ReminderConfigDialog";
import AutomationConfigList from "./components/AutomationConfigList";
import UnderConstruction from "@/components/common/UnderContruction";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useParams } from "next/navigation";
export default function AutomationPage() {
    const params = useParams();
    const [open, setOpen] = useState(false);
    const [recallConfigOpen, setRecallConfigOpen] = useState(false);
    const [reminderConfigOpen, setReminderConfigOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const { permissions, isManager } = useUserPermissions(params.orgId);
    const canCreate = isManager || permissions.has("AUTOMATION.CREATE");
    const canDelete = isManager || permissions.has("AUTOMATION.DELETE");
    const handleRecallDialogClose = (refresh = false) => {
        setRecallConfigOpen(false);
        if (refresh) {
            setRefreshTrigger((prev) => prev + 1);
        }
    };

    const handleReminderDialogClose = (refresh = false) => {
        setReminderConfigOpen(false);
        if (refresh) {
            setRefreshTrigger((prev) => prev + 1);
        }
    };

    const handleRecallSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);

        // Tạo sự kiện custom để thông báo cần refresh
        const refreshEvent = new CustomEvent("refresh-recall-rules");
        window.dispatchEvent(refreshEvent);
    };

    const handleReminderSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);

        // Tạo sự kiện custom để thông báo cần refresh
        const refreshEvent = new CustomEvent("refresh-reminder-configs");
        window.dispatchEvent(refreshEvent);
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="rounded-2xl flex flex-col bg-white h-full">
                <div className="flex items-center justify-end w-full px-5 py-4 border-b">
                    <div className="flex gap-2 justify-end">
                        {canCreate && (
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button className="flex items-center gap-1 h-9 px-[10px]">
                                        <MdAdd className="text-xl" />
                                        Thêm mới
                                    </Button>
                                </DialogTrigger>
                                {open && (
                                    <AutomationDialog
                                        open={open}
                                        setOpen={setOpen}
                                        onCreateRecall={() => {
                                            setOpen(false);
                                            setRecallConfigOpen(true);
                                        }}
                                        onCreateReminder={() => {
                                            setOpen(false);
                                            setReminderConfigOpen(true);
                                        }}
                                    />
                                )}
                            </Dialog>
                        )}{" "}
                    </div>
                </div>

                <div className="p-5">
                    <AutomationConfigList
                        refreshTrigger={refreshTrigger}
                        setRefreshTrigger={setRefreshTrigger}
                        canDelete={canDelete}
                        canCreate={canCreate}
                    />
                </div>
            </div>

            {/* Dialog tạo kịch bản thu hồi lead */}
            <RecallConfigDialogNew
                open={recallConfigOpen}
                setOpen={(value) => {
                    if (!value) {
                        handleRecallDialogClose(true);
                    } else {
                        setRecallConfigOpen(value);
                    }
                }}
                onSuccess={handleRecallSuccess}
                canSave={canCreate}
            />

            {/* Dialog tạo kịch bản nhắc hẹn */}
            <ReminderConfigDialog
                open={reminderConfigOpen}
                setOpen={(value) => {
                    if (!value) {
                        handleReminderDialogClose(true);
                    } else {
                        setReminderConfigOpen(value);
                    }
                }}
                editMode={false}
                onSuccess={handleReminderSuccess}
                canSave={canCreate}
            />
        </div>
    );
}

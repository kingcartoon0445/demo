"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EvictionLogHistory from "./EvictionLogHistory";
import { useParams } from "next/navigation";
import { useState, useCallback } from "react";

// Custom hooks and components
import RecallConfigForm from "./RecallConfigForm";
import RecallConfigContent from "./RecallConfigContent";
import useRecallConfigSubmit from "./RecallConfigSubmit";

export default function RecallConfigDialogNew({
    open,
    setOpen,
    editMode = false,
    ruleData = null,
    onSuccess = null,
    canSave = true,
}) {
    const params = useParams();
    const [activeTab, setActiveTab] = useState("config");

    // Use custom hook for form state management
    const formState = RecallConfigForm({
        editMode,
        ruleData,
        onSuccess,
        open,
    });
    // Use custom hook for submit logic
    const { handleSubmit } = useRecallConfigSubmit({
        editMode,
        ruleData,
        onSuccess,
        setOpen,
        ...formState,
    });

    // Handle tab change
    const handleTabChange = useCallback((value) => {
        setActiveTab(value);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="grid sm:max-w-xl h-auto pt-4 transition-all gap-0"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-medium text-[20px] text-title flex items-center justify-between mb-3">
                        <span>Cấu hình kịch bản thu hồi</span>
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>

                {editMode && ruleData && (
                    <Tabs
                        defaultValue="config"
                        className="w-full"
                        onValueChange={handleTabChange}
                    >
                        <TabsList className="grid grid-cols-2 w-full mb-4">
                            <TabsTrigger value="config">Cấu hình</TabsTrigger>
                            <TabsTrigger value="history">Lịch sử</TabsTrigger>
                        </TabsList>

                        <TabsContent value="config">
                            <RecallConfigContent
                                {...formState}
                                editMode={editMode}
                            />
                        </TabsContent>

                        <TabsContent value="history">
                            <EvictionLogHistory
                                orgId={params.orgId}
                                ruleId={ruleData.id}
                            />
                        </TabsContent>
                    </Tabs>
                )}

                {(!editMode || !ruleData) && (
                    <div className="flex flex-col pt-4">
                        <RecallConfigContent
                            {...formState}
                            editMode={editMode}
                        />
                    </div>
                )}

                <DialogFooter className="sm:justify-end gap-2 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-[35px] px-6"
                        onClick={() => setOpen(false)}
                        disabled={formState.isSubmitting}
                    >
                        Huỷ
                    </Button>
                    {canSave && (
                        <Button
                            type="button"
                            variant="default"
                            className="h-[35px] bg-primary text-white hover:bg-primary/90 px-6"
                            onClick={handleSubmit}
                            disabled={formState.isSubmitting}
                        >
                            {formState.isSubmitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

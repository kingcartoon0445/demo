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
import { useState, useCallback, useEffect } from "react";

// TẠM THỜI: Tái sử dụng cùng form/logic với kịch bản thu hồi
// Khi có form riêng cho phân phối tỷ lệ, có thể tách thành hook/component mới
import RecallConfigForm from "./RecallConfigForm";
import RecallConfigContent from "./RecallConfigContent";
import useAssignRatioSubmit from "./AssignRatioSubmit";
import AssignRatioConfigDialog from "./AssignRatioConfigDialog";

export default function AssignRatioDialog({
    open,
    setOpen,
    editMode = false,
    ruleData = null,
    onSuccess = null,
    canSave = true,
}) {
    const params = useParams();
    const [activeTab, setActiveTab] = useState("config");
    const [openAssignRatioConfig, setOpenAssignRatioConfig] = useState(false);
    const [distributionTargets, setDistributionTargets] = useState([]);

    // Reset distributionTargets khi dialog đóng
    useEffect(() => {
        if (!open) {
            setDistributionTargets([]);
        }
    }, [open]);

    // Tạm dùng lại form state của RecallConfig
    const formState = RecallConfigForm({
        editMode,
        ruleData,
        onSuccess,
        open,
        initialTimeRule: { hour: 0, minute: 0 },
        initialRule: "ORGANIZATION",
    });

    const { handleSubmit } = useAssignRatioSubmit({
        editMode,
        ruleData,
        onSuccess,
        setOpen,
        distributionTargets,
        ...formState,
    });

    const handleTabChange = useCallback((value) => {
        setActiveTab(value);
    }, []);

    const handleAssignRatioSave = useCallback((data) => {
        const memberTargets = (data.members || [])
            .filter((m) => typeof m.ratio === "number" && m.ratio > 0)
            .map((m) => ({
                profileId: m.profileId,
                weight: m.ratio,
            }));

        const teamTargets = (data.teams || [])
            .filter((t) => typeof t.ratio === "number" && t.ratio > 0)
            .map((t) => ({
                teamId: t.id,
                weight: t.ratio,
            }));

        setDistributionTargets([...memberTargets, ...teamTargets]);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="grid sm:max-w-xl h-auto pt-4 transition-all gap-0"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-medium text-[20px] text-title flex items-center justify-between mb-3">
                        <span>Cấu hình kịch bản phân phối khách hàng</span>
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
                                useAssignRulePopover={true}
                                editMode={editMode}
                                onOpenAssignRatioConfig={() =>
                                    setOpenAssignRatioConfig(true)
                                }
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
                            useAssignRulePopover={true}
                            editMode={editMode}
                            onOpenAssignRatioConfig={() =>
                                setOpenAssignRatioConfig(true)
                            }
                        />
                    </div>
                )}

                {openAssignRatioConfig && (
                    <AssignRatioConfigDialog
                        open={openAssignRatioConfig}
                        setOpen={setOpenAssignRatioConfig}
                        assignTeam={formState.assignTeam}
                        rule={formState.rule}
                        editMode={editMode}
                        initialDistributionTargets={
                            ruleData?.targets || ruleData?.Targets || []
                        }
                        selectedWorkspaceId={formState.selectedWorkspaceId}
                        onSave={(data) => {
                            const memberTargets = (data.members || []).map(
                                (m) => ({
                                    profileId: m.profileId,
                                    teamId: m.teamId || null, // Gắn teamId nếu có
                                    weight:
                                        typeof m.ratio === "number"
                                            ? m.ratio
                                            : 0,
                                }),
                            );

                            const teamTargets = (data.teams || []).map((t) => ({
                                teamId: t.id,
                                weight:
                                    typeof t.ratio === "number" ? t.ratio : 0,
                            }));

                            setDistributionTargets([
                                ...memberTargets,
                                ...teamTargets,
                            ]);
                        }}
                    />
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
                    </Button>{" "}
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
                    )}{" "}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

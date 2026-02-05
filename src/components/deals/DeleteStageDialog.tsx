import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PipelineColumn } from "@/app/org/[orgId]/deals/page";

interface DeleteStageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    stageId: string;
    stageName: string;
    dealCount: number;
    onConfirmDelete: (
        moveToStageId?: string,
        options?: { targetId?: string }
    ) => void;
    otherStages: PipelineColumn[];
}

export function DeleteStageDialog({
    isOpen,
    onClose,
    stageId,
    stageName,
    dealCount,
    onConfirmDelete,
    otherStages,
}: DeleteStageDialogProps) {
    const { t } = useLanguage();
    const [action, setAction] = useState<"move" | "delete">("move");
    const [selectedStageId, setSelectedStageId] = useState<string>(
        otherStages.length > 0 ? otherStages[0].id : ""
    );

    // Execute the action immediately when user confirms
    const handleConfirm = () => {
        if (dealCount === 0 || action === "delete") {
            // Delete deals along with stage
            onConfirmDelete();
        } else if (action === "move" && selectedStageId) {
            // When moving deals to another stage, include targetId in the options
            onConfirmDelete(selectedStageId, { targetId: selectedStageId });
        }
        // Close dialog immediately to give user feedback that action is being processed
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("deal.deleteStageConfirm")}</DialogTitle>
                </DialogHeader>
                {dealCount > 0 ? (
                    <>
                        <div className="py-4">
                            <p className="mb-4">
                                {t("deal.currentDeals", {
                                    count: dealCount.toString(),
                                    stageName: stageName,
                                })}
                            </p>
                            <p className="mb-2">
                                {t("deal.whatToDoWithDeals")}
                            </p>
                            <RadioGroup
                                value={action}
                                onValueChange={(value) =>
                                    setAction(value as "move" | "delete")
                                }
                                className="space-y-3"
                            >
                                <div className="flex items-start space-x-2">
                                    <RadioGroupItem value="move" id="move" />
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="move"
                                            className="font-normal"
                                        >
                                            {t("deal.moveToOtherStage")}
                                        </Label>
                                        {action === "move" && (
                                            <Select
                                                value={selectedStageId}
                                                onValueChange={
                                                    setSelectedStageId
                                                }
                                                disabled={
                                                    otherStages.length === 0
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue
                                                        placeholder={t(
                                                            "deal.selectStage"
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {otherStages.map(
                                                        (stage) => (
                                                            <SelectItem
                                                                key={stage.id}
                                                                value={stage.id}
                                                            >
                                                                {stage.title}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <RadioGroupItem
                                        value="delete"
                                        id="delete"
                                    />
                                    <Label
                                        htmlFor="delete"
                                        className="font-normal"
                                    >
                                        {t("deal.deleteDeals")}
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </>
                ) : (
                    <div className="py-4">
                        <p>{t("deal.confirmDelete")}</p>
                    </div>
                )}
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="outline" onClick={onClose}>
                        {t("deal.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        {t("deal.delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

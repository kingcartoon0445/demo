import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import StageSelect from "@/components/customer_stage";
import { useState } from "react";

export default function StageRecallPopover({
    children,
    stage,
    setStage,
    hasStageUpdate,
    setHasStageUpdate,
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="pl-4">
                <div className="space-y-8 flex items-center">
                    <RadioGroup
                        value={hasStageUpdate}
                        onValueChange={setHasStageUpdate}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={false} id="no-update" />
                            <Label htmlFor="no-update">
                                Không cập nhật tình trạng chăm sóc
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={true} id="update" />
                            <Label htmlFor="update">
                                Chuyển trạng thái chăm sóc sang:
                            </Label>
                        </div>
                    </RadioGroup>

                    {hasStageUpdate && (
                        <div className="pl-6">
                            <StageSelect
                                stage={stage}
                                setStage={(stage) => setStage(stage)}
                                isShowIcon={false}
                            />
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

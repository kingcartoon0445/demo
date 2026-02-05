"use client";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";

export default function StageRecallPopover({
    children,
    stageGroups,
    stageOptions: stageOptionsProp,
    hasStageUpdate,
    setHasStageUpdate,
    selectedStage,
    setSelectedStage,
}) {
    const stageOptions =
        stageOptionsProp &&
        Array.isArray(stageOptionsProp) &&
        stageOptionsProp.length > 0
            ? stageOptionsProp
            : stageGroups.flatMap((group) =>
                  group.stages.map((stage) => ({
                      value: stage.id,
                      label: stage.name,
                      labelGroup: group.name,
                      hexCode: group.hexCode,
                  }))
              );

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="pl-4 w-full">
                <div className="space-y-8 flex items-center">
                    <RadioGroup
                        value={hasStageUpdate}
                        onValueChange={setHasStageUpdate}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={false} id="no-update" />
                            <Label htmlFor="no-update">
                                Không cập nhật trạng thái chăm sóc
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
                            <MultiSelect
                                options={stageOptions}
                                selected={selectedStage}
                                onChange={setSelectedStage}
                                textClassName="text-base"
                                className="inline-flex h-auto p-0 m-0 min-h-0 border-0 bg-transparent"
                                buttonClassName="h-auto min-h-0 p-0 bg-transparent font-bold border-0 !max-w-[400px] text-primary hover:bg-transparent hover:text-primary hover:opacity-80 shadow-none mt-0"
                                placeholder={"Chọn trạng thái"}
                            />
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

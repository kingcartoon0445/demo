import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { WorkspacesSelector } from "@/components/componentsWithHook/WorkspacesSelector";
import { Dataset } from "../types";

interface EventMappingDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    mappingType: "lead" | "deal";
    setMappingType: (val: "lead" | "deal") => void;
    orgId: string;
    selectedWorkspace: string;
    onWorkspaceChange: (id: string) => void;
    datasets: Dataset[];
    selectedDatasetIds: string[];
    setSelectedDatasetIds: (ids: string[]) => void;
    isLoadingDatasets: boolean;
    onSave: () => void;
}

export const EventMappingDialog: React.FC<EventMappingDialogProps> = ({
    isOpen,
    onOpenChange,
    mappingType,
    setMappingType,
    orgId,
    selectedWorkspace,
    onWorkspaceChange,
    datasets,
    selectedDatasetIds,
    setSelectedDatasetIds,
    isLoadingDatasets,
    onSave,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Ánh xạ sự kiện Facebook</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-gray-700">
                            Loại sự kiện
                        </Label>
                        <RadioGroup
                            value={mappingType}
                            onValueChange={(val: "lead" | "deal") =>
                                setMappingType(val)
                            }
                            className="flex flex-row space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="lead" id="r-lead" />
                                <Label htmlFor="r-lead">Cơ hội</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="deal" id="r-deal" />
                                <Label htmlFor="r-deal">Giao dịch</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {mappingType === "deal" && (
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-semibold text-gray-700">
                                Workspace
                            </Label>
                            <WorkspacesSelector
                                orgId={orgId}
                                selectedWorkspace={selectedWorkspace}
                                handleWorkspaceChange={onWorkspaceChange}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold text-gray-700">
                            Dataset
                        </Label>
                        <MultiSelect
                            options={datasets.map((d) => ({
                                value: d.id,
                                label: d.datasetId, // Using Pixel ID as label
                            }))}
                            selected={selectedDatasetIds}
                            onChange={setSelectedDatasetIds}
                            placeholder={
                                isLoadingDatasets
                                    ? "Đang tải..."
                                    : "Chọn dataset"
                            }
                            className="w-full"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={
                            (mappingType === "deal" && !selectedWorkspace) ||
                            selectedDatasetIds.length === 0
                        }
                    >
                        Lưu cấu hình
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

import { useWorkspaceList } from "@/hooks/workspace_data";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import Avatar from "react-avatar";
import { getAvatarUrl } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useState } from "react";


export function WorkspaceSelectDialog({ open, setOpen, selectedValue, setSelectedValue }) {
    const { workspaceList } = useWorkspaceList();

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={"overflow-y-auto max-h-[550px] gap-0 w-[450px]"}>
            <DialogHeader>
                <DialogTitle className="font-medium text-base mb-2">Chọn không gian làm việc</DialogTitle>
                <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
            </DialogHeader>
            <RadioGroup value={selectedValue}
                onValueChange={(value) => { setSelectedValue(value); }} className="flex flex-col max-h-[500px] overflow-y-auto w-full mt-2">
                {workspaceList?.map((e, i) => (
                    <div
                        key={i}
                        onClick={() => { setSelectedValue(e); setOpen(false) }}
                        className="flex items-center gap-4 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground p-2 rounded-lg"
                    >
                        <Avatar
                            name={e.name}
                            src={getAvatarUrl(e.avatar)}
                            size="40"
                            round
                        />
                        <div className="flex flex-col leading-[1.4]">
                            <div className="text-title text-base font-medium">{e.name}</div>
                        </div>
                        <RadioGroupItem value={e} id={e.id} className="ml-auto" />
                    </div>
                ))}
            </RadioGroup >

        </DialogContent>
    </Dialog>
}
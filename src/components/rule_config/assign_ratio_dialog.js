import { useTeamList } from "@/hooks/team_data";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import Avatar from "react-avatar";
import { useEffect, useState } from "react";
import { getAvatarUrl } from "@/lib/utils";

export function AssignRatioDialog({
    open,
    setOpen,
    isAutoAssignRule,
    setIsAutoAssignRule,
    assignList,
    setAssignList,
    isTeam,
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className={"overflow-y-auto max-h-[550px] gap-0 w-[450px]"}
            >
                <DialogHeader>
                    <DialogTitle>Tùy chỉnh</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-between mt-2">
                    Phân phối tới {isTeam ? "team" : "sale"} mới
                    <Switch
                        checked={isAutoAssignRule}
                        onCheckedChange={setIsAutoAssignRule}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
                <div className="flex flex-col gap-3 mt-2">
                    {assignList.map((e, i) => (
                        <div key={i} className="flex items-center">
                            <Avatar
                                name={isTeam ? e.name : e.profile.fullName}
                                src={getAvatarUrl(e?.profile?.avatar)}
                                round
                                size="40"
                            />
                            <div className="ml-3">
                                <div className="text-title text-base font-medium">
                                    {isTeam ? e.name : e.profile.fullName}
                                </div>
                                <div></div>
                            </div>
                            <CountComponent
                                defaultNumber={e.ratio}
                                onValueChange={(count) => {
                                    const tmpList = JSON.parse(
                                        JSON.stringify(assignList)
                                    );
                                    tmpList.find((e1) => e1.id == e.id).ratio =
                                        count;
                                    setAssignList(tmpList);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CountComponent({ defaultNumber, onValueChange }) {
    const [number, setNumber] = useState(defaultNumber);

    const handleChange = (value) => {
        setNumber(value);
        onValueChange(value);
    };

    return (
        <div className="ml-auto bg-bg2 flex items-center rounded-lg">
            <div
                onClick={() => {
                    if (number > 0) handleChange(number - 1);
                }}
                className="p-2 cursor-pointer"
            >
                -
            </div>
            <input
                min={0}
                value={number}
                maxLength={2}
                className="bg-white w-8 rounded-lg outline-none border-none text-center py-[2px] pr-[2px] text-sm"
                onChangeCapture={(e) => {
                    handleChange(e.target.value);
                }}
            />
            <div
                onClick={() => handleChange(number + 1)}
                className="p-2 cursor-pointer"
            >
                +
            </div>
        </div>
    );
}

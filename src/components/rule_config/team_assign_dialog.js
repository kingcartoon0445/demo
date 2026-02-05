import { useTeamList } from "@/hooks/team_data";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";
import { IoMdArrowDropdown } from "react-icons/io";
import Avatar from "react-avatar";
import { MdDelete } from "react-icons/md";
import { useState } from "react";

export function TeamAssignDialog({ open, setOpen, onChildChange }) {
    const { teamList, setTeamList } = useTeamList();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={"overflow-y-auto max-h-[550px] gap-0"}>
                <DialogHeader>
                    <DialogTitle>Chọn đội sale</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div className="h-2" />
                <ExpansionTileList
                    childs={teamList}
                    onTap={(e) => {
                        onChildChange(e);
                        setOpen(false);
                    }}
                    index={0}
                />
            </DialogContent>
        </Dialog>
    );
}

export const ExpansionTileList = ({ childs, onTap, style, index }) => {
    return childs?.map((e) => {
        const childs_1 = e.childs || [];
        return (
            <CExpansionTile
                key={e.id}
                child={e}
                childs={childs_1}
                onTap={onTap}
                style={style}
                index={index + 1}
            />
        );
    });
};
const CExpansionTile = ({ child, childs, onTap, style, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const name = child.name;
    const managers = child.managers || [];

    return (
        <div className="flex flex-col cursor-pointer">
            <div
                className={cn(
                    `flex items-center py-2 pr-3 transition-all duration-400 border-l-[3px] border-l-transparent hover:bg-accent`
                )}
                onClick={() => {
                    onTap(child);
                }}
            >
                <div
                    className="w-[37px] flex items-center justify-center"
                    style={style}
                >
                    {childs.length != 0 && (
                        <div
                            className={cn(
                                `text-2xl transition-transform ${
                                    isExpanded ? "rotate-0" : "-rotate-90"
                                }`
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            <IoMdArrowDropdown />
                        </div>
                    )}
                </div>

                <Avatar name={name} size="38" round />
                <div className="leading-[1.2] ml-2">
                    <div className="text-[16px] font-medium">{name}</div>
                    <div className="text-text2 text-[14px]">
                        {managers.length === 0
                            ? "Chưa có trưởng nhóm"
                            : managers[0].fullName}
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    ` transition-[grid-template-rows] duration-500 grid grid-rows-[0fr]`,
                    isExpanded && "grid-rows-[1fr]"
                )}
            >
                <div className="overflow-hidden">
                    <ExpansionTileList
                        childs={childs}
                        onTap={onTap}
                        style={{ marginLeft: `${index * 18}px` }}
                        index={index}
                    />
                </div>
            </div>
        </div>
    );
};

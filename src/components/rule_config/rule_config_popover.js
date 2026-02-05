"use client";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { MdOutlineGroup, MdOutlineGroups } from "react-icons/md";
import { IoMdCheckboxOutline } from "react-icons/io";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useState } from "react";
import { TeamAssignDialog } from "./team_assign_dialog";
import CustomerAssignListDialog from "../customer_assign_list";

export function RuleConfigPopover({
    children,
    rule,
    setRule,
    assignTeam,
    setAssignTeam,
    hideAssignTo,
    availableRules,
    selectedAutomationType,
    onMemberSelect,
    onWorkspaceSelect,
    onTeamSelect,
    isAssignRatioMode = false,
}) {
    const [openTeamDialog, setOpenTeamDialog] = useState(false);
    const [openMemberDialog, setOpenMemberDialog] = useState(false);
    const [openWorkspaceDialog, setOpenWorkspaceDialog] = useState(false);
    const [open, setOpen] = useState(false);

    // Lọc danh sách tùy chọn dựa trên availableRules nếu được cung cấp
    let filteredDataList = availableRules
        ? dataList.filter((item) => availableRules.includes(item.value))
        : hideAssignTo
        ? dataList.filter((item) => item.value !== "ASSIGN_TO")
        : dataList;

    // Filter based on automation type
    filteredDataList = filteredDataList.filter((item) => {
        if (item.showOnlyForDeals === true) {
            return selectedAutomationType === "deals";
        }
        return true;
    });

    // Customize text for AssignRatio mode
    if (isAssignRatioMode) {
        filteredDataList = filteredDataList.map((item) => {
            if (item.value === "TEAM") {
                return {
                    ...item,
                    value: "ORGANIZATION",
                    title: "Tổ chức",
                    subtitle:
                        "Áp dụng cho tất cả đội sale và thành viên trong tổ chức",
                };
            }
            return item;
        });
    }

    return (
        <>
            {openTeamDialog && (
                <TeamAssignDialog
                    open={openTeamDialog}
                    setOpen={setOpenTeamDialog}
                    onChildChange={(value) => {
                        setAssignTeam(value);
                        setRule("ASSIGN_TO");
                        if (onTeamSelect) {
                            onTeamSelect(value);
                        }
                    }}
                />
            )}
            {openMemberDialog && onMemberSelect && (
                <CustomerAssignListDialog
                    open={openMemberDialog}
                    setOpen={setOpenMemberDialog}
                    mode="select"
                    restrictTo="members"
                    onSelected={(payload) => {
                        onMemberSelect(payload);
                        setRule("ASSIGN_MEMBER");
                        setOpenMemberDialog(false);
                    }}
                />
            )}
            {openWorkspaceDialog && onWorkspaceSelect && (
                <CustomerAssignListDialog
                    open={openWorkspaceDialog}
                    setOpen={setOpenWorkspaceDialog}
                    mode="select"
                    showWorkspaceTab={true}
                    restrictTo="workspaces"
                    onSelected={(payload) => {
                        onWorkspaceSelect(payload);
                        setRule("ASSIGN_WORKSPACE");
                        setOpenWorkspaceDialog(false);
                    }}
                />
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>{children}</PopoverTrigger>
                <PopoverContent className="pl-6 min-w-0 w-full ">
                    <RadioGroup
                        defaultValue={rule}
                        value={rule}
                        onValueChange={(e) => {
                            if (e == "ASSIGN_TO") {
                                setOpenTeamDialog(true);
                            } else if (e === "ASSIGN_MEMBER") {
                                setOpenMemberDialog(true);
                            } else if (e === "ASSIGN_WORKSPACE") {
                                setOpenWorkspaceDialog(true);
                            } else {
                                setRule(e);
                            }
                            setOpen(false);
                        }}
                        className="flex flex-col gap-3 items-start text-sm"
                    >
                        {filteredDataList.map((e, i) => (
                            <div
                                key={e.value}
                                className="flex items-center gap-3"
                            >
                                <div className="text-xl">{e.icon}</div>
                                <div className="flex flex-col w-[280px]">
                                    <div className="font-medium text-sm">
                                        {e.title}
                                    </div>
                                    <div
                                        className={`text-xs text-text2 ${
                                            (e.value === "ASSIGN_TO" ||
                                                e.value === "ASSIGN_MEMBER" ||
                                                e.value ===
                                                    "ASSIGN_WORKSPACE") &&
                                            "cursor-pointer"
                                        }`}
                                        onClick={() => {
                                            if (e.value === "ASSIGN_TO") {
                                                setOpenTeamDialog(true);
                                            } else if (
                                                e.value === "ASSIGN_MEMBER"
                                            ) {
                                                setOpenMemberDialog(true);
                                            } else if (
                                                e.value === "ASSIGN_WORKSPACE"
                                            ) {
                                                setOpenWorkspaceDialog(true);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        {e.value === "ASSIGN_TO" && assignTeam
                                            ? "Đội sale " + assignTeam.name
                                            : e.subtitle}
                                    </div>
                                </div>
                                <RadioGroupItem value={e.value} />
                            </div>
                        ))}
                    </RadioGroup>
                </PopoverContent>
            </Popover>
        </>
    );
}
const dataList = [
    {
        icon: <MdOutlineGroup />,
        title: "Đội sale của người phụ trách",
        subtitle: "Thu hồi dữ liệu khách hàng về đội sale của người phụ trách",
        value: "TEAM",
    },
    {
        icon: <IoMdCheckboxOutline />,
        title: "Chỉ định cụ thể",
        subtitle: "Chọn đội sale",
        value: "ASSIGN_TO",
    },
    {
        icon: <MdOutlineGroup />,
        title: "Chỉ định thành viên cụ thể",
        subtitle: "Chọn thành viên cụ thể",
        value: "ASSIGN_MEMBER",
        showOnlyForDeals: false,
    },
    {
        icon: <MdOutlineGroups />,
        title: "Chỉ định không gian làm việc cụ thể",
        subtitle: "Chọn không gian làm việc cụ thể",
        value: "ASSIGN_WORKSPACE",
        showOnlyForDeals: true,
    },
    {
        icon: <MdOutlineGroups />,
        title: "Không gian làm việc",
        subtitle: "Thu hồi dữ liệu khách hàng về nhóm làm việc",
        value: "WORKSPACE",
    },
];

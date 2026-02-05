"use client";

import React, { useState, useEffect, memo, useMemo } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignedTo } from "@/interfaces/businessProcess";
import { Assignee } from "@/lib/interface";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import CustomerAssignListDialog from "../customer_assign_list";
import { useEditableField } from "./EditableFieldRow";
import { useUpdateBusinessProcessTaskAssignees } from "@/hooks/useBusinessProcess";
import {
    useAssignLead,
    useUpdateLeadFollower,
} from "@/hooks/useCustomerDetail";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface EditableAssigneesValueProps {
    assignees: AssignedTo[] | Assignee[];
    orgId: string;
    taskId?: string;
    customerId?: string;
    className?: string;
    owner?: string;
}

// Helper functions to safely access fields across different assignee shapes
function getAssigneeId(item: AssignedTo | Assignee | undefined): string {
    if (!item) return "";
    const anyItem = item as any;
    // Nếu là automation team (isAutoAssignRule và isAutomation), lấy id làm teamId
    if (anyItem?.isAutoAssignRule && anyItem?.isAutomation) {
        return anyItem?.id || anyItem?.saleTeamId || anyItem?.teamId || "";
    }
    const profileId = anyItem?.profileId || anyItem?.member?.profileId;
    const teamId = anyItem?.saleTeamId || anyItem?.teamId || anyItem?.id;
    return profileId || teamId || "";
}

function getAssigneeName(item: AssignedTo | Assignee | undefined): string {
    if (!item) return "";
    return "profileName" in (item as any) || "teamName" in (item as any)
        ? (item as any).profileName || (item as any).teamName || ""
        : (item as any).name || (item as any).saleTeamName || "";
}

function getAssigneeAvatar(item: AssignedTo | Assignee | undefined): string {
    if (!item) return "";
    return "avatar" in (item as any) ? (item as any).avatar || "" : "";
}

function isAssignedTo(
    item: AssignedTo | Assignee | undefined
): item is AssignedTo {
    return item != null && "name" in item;
}

function EditableAssigneesValueComponent({
    assignees,
    orgId,
    taskId,
    customerId,
    owner,
    className = "text-[14px] text-gray-900",
}: EditableAssigneesValueProps) {
    const { t } = useLanguage();
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
        assignees.map((assignee) => String(getAssigneeId(assignee)))
    );
    // Build default members for the dialog so previously selected show as checked
    const defaultMemberAssignees: any[] = useMemo(() => {
        const source = selectedAssignees.length ? selectedAssignees : assignees;
        return source
            .map((a: any) => {
                const profileId = a?.profileId || a?.member?.profileId || null;
                const teamId =
                    a?.saleTeamId ||
                    a?.teamId ||
                    (profileId ? null : a?.id) ||
                    null;
                if (profileId) return { profileId };
                if (teamId) return { id: teamId, teamId };
                return null;
            })
            .filter(Boolean) as any[];
    }, [selectedAssignees, assignees]);
    const updateAssigneesMutation = useUpdateBusinessProcessTaskAssignees(
        orgId,
        taskId || ""
    );

    const assignLeadMutation = useAssignLead(orgId, customerId || "");
    const updateLeadFollowerMutation = useUpdateLeadFollower(
        orgId,
        customerId || "",
        true
    );

    // Try to use context from EditableFieldRow
    let isEditing = false;
    let setIsEditing: (value: boolean) => void = () => {};

    try {
        const context = useEditableField();
        isEditing = context.isEditing;
        setIsEditing = context.setIsEditing;
    } catch {
        // Context not available, component might be used standalone
        console.warn(
            "EditableAssigneesValue should be used within EditableFieldRow"
        );
    }

    useEffect(() => {
        // Keep local state synced when external assignees change
        setSelectedAssigneeIds(
            assignees.map((assignee) => getAssigneeId(assignee))
        );
    }, [assignees]);

    // Auto open dialog when entering edit mode
    useEffect(() => {
        if (isEditing) {
            setShowAssignDialog(true);
        }
    }, [isEditing]);

    const handleConfirm = async () => {
        try {
            if (taskId) {
                // Tách danh sách được chọn thành userIds và teamIds dựa vào hình dạng dữ liệu
                const { userIds, teamIds } = ((): {
                    userIds: string[];
                    teamIds: string[];
                } => {
                    const users: string[] = [];
                    const teams: string[] = [];
                    const source = selectedAssignees.length
                        ? selectedAssignees
                        : assignees.filter((a) =>
                              selectedAssigneeIds.includes(
                                  String(getAssigneeId(a))
                              )
                          );
                    source.forEach((a: any) => {
                        // Kiểm tra nếu là automation team (isAutoAssignRule và isAutomation)
                        if (a?.isAutoAssignRule && a?.isAutomation) {
                            // Đây là team automation, lấy id làm teamId
                            const teamId =
                                a?.id || a?.saleTeamId || a?.teamId || null;
                            if (teamId) {
                                teams.push(String(teamId));
                            }
                        } else {
                            // Logic bình thường
                            const userId =
                                a?.profileId || a?.member?.profileId || null;
                            const teamId = a?.saleTeamId || a?.teamId || null;
                            if (userId) {
                                users.push(String(userId));
                            } else if (teamId) {
                                teams.push(String(teamId));
                            }
                        }
                    });
                    // Fallback: nếu không phân loại được, giữ nguyên selectedAssigneeIds là userIds
                    if (users.length === 0 && teams.length === 0) {
                        return { userIds: selectedAssigneeIds, teamIds: [] };
                    }
                    return { userIds: users, teamIds: teams };
                })();

                const body = {
                    assigneeType: "FOLLOWER",
                    userIds,
                    teamIds,
                };
                const res: any = await updateAssigneesMutation.mutateAsync(
                    body
                );
                if (res?.success) toast.success(t("success.updateAssignees"));
            } else {
                // Followers for lead: send [{ teamId, profileId }] using explicit keys
                const pool = (
                    selectedAssignees.length ? selectedAssignees : assignees
                ) as any[];
                const followerBodies = pool
                    .map((x: any) => {
                        // Nếu là automation team (isAutoAssignRule và isAutomation), lấy id làm teamId
                        if (x?.isAutoAssignRule && x?.isAutomation) {
                            return {
                                teamId:
                                    x?.id || x?.saleTeamId || x?.teamId || null,
                                profileId: null,
                            };
                        }
                        return {
                            teamId: x?.saleTeamId || x?.teamId || x?.id || null,
                            profileId:
                                x?.profileId || x?.member?.profileId || null,
                        };
                    })
                    .filter((b) =>
                        selectedAssigneeIds.includes(
                            String(b.profileId || b.teamId || "")
                        )
                    );
                const res: any = await updateLeadFollowerMutation.mutateAsync(
                    followerBodies
                );
                if (res?.code === 0 || res?.success)
                    toast.success(t("success.updateAssignees"));
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating assignees:", error);
            toast.error(t("error.common"));
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedAssigneeIds(
            assignees.map((assignee) =>
                isAssignedTo(assignee) ? assignee.id : assignee.profileId
            )
        );
    };
    const displayAssignees = assignees.slice(0, 3);
    const remainingCount = assignees.length - 3;

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 w-full">
                <CustomerAssignListDialog
                    open={showAssignDialog}
                    setOpen={(open: boolean) => {
                        setShowAssignDialog(open);
                    }}
                    customerID={customerId || ""}
                    defaultAssignees={defaultMemberAssignees as unknown as any}
                    mode="select"
                    onSelected={(selection: any) => {
                        // Support selecting members or teams from dialog
                        if (selection.type === "members") {
                            setSelectedAssignees(selection.members);
                            setSelectedAssigneeIds(
                                selection.members.map((m: any) =>
                                    String(m.profileId)
                                )
                            );
                        } else if (selection.type === "member") {
                            setSelectedAssignees([selection.member]);
                            setSelectedAssigneeIds([
                                String(selection.member.profileId),
                            ]);
                        } else if (selection.type === "teams") {
                            setSelectedAssignees(selection.teams);
                            setSelectedAssigneeIds(
                                selection.teams.map((t: any) =>
                                    String(t?.teamId || t?.saleTeamId || t?.id)
                                )
                            );
                        } else if (selection.type === "team") {
                            setSelectedAssignees([selection.team]);
                            setSelectedAssigneeIds([
                                String(
                                    selection.team?.teamId ||
                                        selection.team?.saleTeamId ||
                                        selection.team?.id
                                ),
                            ]);
                        } else if (selection.type === "combined") {
                            const mems = selection.members || [];
                            const tms = selection.teams || [];
                            setSelectedAssignees([...mems, ...tms]);
                            setSelectedAssigneeIds([
                                ...mems.map((m: any) => String(m.profileId)),
                                ...tms.map((t: any) =>
                                    String(t?.teamId || t?.saleTeamId || t?.id)
                                ),
                            ]);
                        }
                        setShowAssignDialog(false);
                    }}
                    showWorkspaceTab={false}
                    restrictTo={undefined}
                    singleSelect={false}
                />

                <>
                    <div className="flex-1">
                        <div
                            className="text-sm text-gray-600"
                            onClick={() => setShowAssignDialog(true)}
                        >
                            {t("common.selected")}: {selectedAssigneeIds.length}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleConfirm}
                        disabled={
                            updateAssigneesMutation.isPending ||
                            assignLeadMutation.isPending
                        }
                        className="text-green-600 hover:bg-green-100 rounded h-8 w-8 p-0"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleCancel}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </>
            </div>
        );
    }
    return (
        <div className={`flex items-center gap-1 ${className} py-1`}>
            {displayAssignees.length > 0 && (
                <div className="flex items-center gap-1">
                    {displayAssignees.map((assignee) => (
                        <TooltipProvider key={getAssigneeId(assignee)}>
                            <Tooltip content={getAssigneeName(assignee)}>
                                <span className="inline-flex">
                                    <Avatar
                                        src={
                                            getAvatarUrl(
                                                getAssigneeAvatar(assignee)
                                            ) || undefined
                                        }
                                        name={
                                            getFirstAndLastWord(
                                                getAssigneeName(assignee)
                                            ) || ""
                                        }
                                        round={true}
                                        size={"20"}
                                    />
                                </span>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            )}
            {remainingCount > 0 && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                    +{remainingCount}
                </div>
            )}
            {assignees.length === 0 && (
                <span className="text-gray-900">{t("common.noFollowers")}</span>
            )}
        </div>
    );
}

const EditableAssigneesValue = memo(EditableAssigneesValueComponent);
export default EditableAssigneesValue;

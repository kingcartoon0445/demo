"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUpdateBusinessProcessTaskAssignees } from "@/hooks/useBusinessProcess";
import {
    useAssignLead,
    useUpdateLeadFollower,
} from "@/hooks/useCustomerDetail";
import { AssignedTo } from "@/interfaces/businessProcess";
import { Assignee } from "@/lib/interface";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { memo, useEffect, useState } from "react";
import Avatar from "react-avatar";
import CustomerAssignListDialog from "../customer_assign_list";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useEditableField } from "./EditableFieldRow";

interface EditableAssigneeValueProps {
    assignee?: Assignee | AssignedTo;
    orgId: string;
    customerId?: string;
    taskId?: string;
    className?: string;
    followers?: Assignee[] | AssignedTo[];
    singleSelect?: boolean; // true: chỉ chọn 1 thành viên, false: chọn nhiều thành viên
    leadDetail?: any; // Thêm prop để truy cập dữ liệu lead
}

function EditableAssigneeValueComponent({
    assignee,
    followers,
    orgId,
    customerId,
    taskId,
    className = "text-[14px] text-gray-900",
    singleSelect = true, // Mặc định là true vì EditableAssigneeValue thường dùng để assign 1 người
    leadDetail,
}: EditableAssigneeValueProps) {
    const { t } = useLanguage();
    // Helper function to safely get ID from either type
    const getProfileId = (item: any): string =>
        (item && (item.profileId || item?.member?.profileId)) || "";
    const getTeamId = (item: any): string =>
        (item && (item.saleTeamId || item.teamId)) || "";
    const getAssigneeId = (item: Assignee | AssignedTo | undefined): string => {
        if (!item) return "";
        // Use profileId for users, teamId/saleTeamId for teams; do not fallback to generic id
        const pid = getProfileId(item as any);
        const tid = getTeamId(item as any);
        return pid || tid || "";
    };

    // Helper function to safely get name from either type
    const getAssigneeName = (
        item: Assignee | AssignedTo | undefined
    ): string => {
        if (!item) return "";
        return "profileName" in item || "teamName" in item
            ? (item as any).profileName || (item as any).teamName
            : item.name || (item as any).saleTeamName;
    };

    // Helper function to safely get avatar from either type
    const getAssigneeAvatar = (
        item: Assignee | AssignedTo | undefined
    ): string => {
        if (!item) return "";
        return "avatar" in item ? item.avatar || "" : "";
    };

    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(
        getAssigneeId(assignee)
    );
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState<any>(null);

    // Hook cho customer assignment
    const assignLeadMutation = useAssignLead(orgId, customerId || "", true);

    // Hook cho task assignment
    const updateTaskAssigneesMutation = useUpdateBusinessProcessTaskAssignees(
        orgId,
        taskId || ""
    );

    // Tìm tất cả OWNER hiện tại (cả member và team)
    const currentOwners =
        leadDetail?.assignees?.filter(
            (assignee: any) => assignee.type === "OWNER"
        ) || [];

    // Tạo danh sách followers mới bao gồm:
    // 1. Tất cả followers hiện tại
    // 2. Tất cả OWNER cũ (sẽ được chuyển thành FOLLOWER)
    // 3. Loại bỏ người được chọn làm OWNER mới
    const newFollowersIds = [
        ...(followers?.map((f) => getAssigneeId(f)) || []),
        ...currentOwners.map((owner: any) => getAssigneeId(owner)),
    ]
        .filter((id, index, arr) => id && arr.indexOf(id) === index)
        .filter((id) => id !== selectedAssigneeId); // Loại bỏ người được chọn làm owner khỏi danh sách followers

    // Hook để chuyển owner cũ thành follower (chỉ dùng cho customer)
    const updateLeadFollowerMutation = useUpdateLeadFollower(
        orgId,
        customerId || "",
        false
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
            "EditableAssigneeValue should be used within EditableFieldRow"
        );
    }

    useEffect(() => {
        // Keep local state synced when external assignee changes
        setSelectedAssigneeId(getAssigneeId(assignee));
        setSelectedAssignee(assignee);
    }, [assignee]);

    // Tự động mở dialog khi vào edit mode
    useEffect(() => {
        if (isEditing) {
            setShowAssignDialog(true);
        }
    }, [isEditing]);

    const handleConfirm = async (assigneeType: string = "member") => {
        try {
            if (selectedAssigneeId) {
                // Kiểm tra xem assignee là loại nào để sử dụng hook phù hợp
                const isAssignedToType = assignee && "name" in assignee;
                if (taskId) {
                    // Nếu là AssignedTo (task) - sử dụng updateTaskAssignees
                    const isNewOwnerTeam = assigneeType === "team";
                    // if (
                    //     assignee &&
                    //     getAssigneeId(assignee) !== selectedAssigneeId
                    // ) {
                    //     // Chỉ chuyển owner cũ thành follower (không đụng tới các follower đang có)
                    //     const isOldOwnerTeam = Boolean(
                    //         getTeamId(assignee as any)
                    //     );
                    //     await updateTaskAssigneesMutation.mutateAsync({
                    //         assigneeType: "FOLLOWER",
                    //         userIds: isOldOwnerTeam
                    //             ? []
                    //             : [getProfileId(assignee as any)],
                    //         teamIds: isOldOwnerTeam
                    //             ? [getTeamId(assignee as any)]
                    //             : [],
                    //     });

                    //     // Sau đó assign owner mới (với assigneeType = "OWNER")
                    //     setTimeout(async () => {
                    //         await updateTaskAssigneesMutation.mutateAsync({
                    //             assigneeType: "OWNER",
                    //             userIds: isNewOwnerTeam
                    //                 ? []
                    //                 : [selectedAssigneeId],
                    //             teamIds: isNewOwnerTeam
                    //                 ? [selectedAssigneeId]
                    //                 : [],
                    //         });
                    //         // Thoát khỏi edit mode sau khi hoàn thành
                    //         setIsEditing(false);
                    //     }, 500);
                    // } else {
                    // Nếu không có owner cũ hoặc giữ nguyên owner
                    await updateTaskAssigneesMutation.mutateAsync({
                        assigneeType: "OWNER",
                        userIds: isNewOwnerTeam ? [] : [selectedAssigneeId],
                        teamIds: isNewOwnerTeam ? [selectedAssigneeId] : [],
                    });
                    // Thoát khỏi edit mode sau khi hoàn thành
                    setIsEditing(false);
                    // }
                } else {
                    // Nếu là Assignee (customer/lead)
                    // Kiểm tra xem có OWNER cũ nào cần chuyển thành FOLLOWER không
                    const hasOldOwners =
                        currentOwners.length > 0 &&
                        currentOwners.some(
                            (owner: any) =>
                                getAssigneeId(owner) !== selectedAssigneeId
                        );

                    if (hasOldOwners) {
                        // Assign OWNER mới với body { teamId, profileId }
                        const res = await assignLeadMutation.mutateAsync({
                            teamId:
                                assigneeType === "team"
                                    ? selectedAssignee?.teamId ||
                                      selectedAssignee?.saleTeamId ||
                                      selectedAssignee?.id ||
                                      null
                                    : null,
                            profileId:
                                assigneeType === "team"
                                    ? null
                                    : selectedAssignee?.profileId || null,
                        });

                        // if (res.code === 0) {
                        //     // Sau khi assign OWNER mới thành công, chuyển OWNER cũ thành FOLLOWER
                        //     setTimeout(async () => {
                        //         // Xây mảng followers body: [{ teamId, profileId }]
                        //         const sourceList: any[] = [
                        //             ...((followers as any[]) || []),
                        //             ...currentOwners,
                        //         ];
                        //         const followerBodies = sourceList
                        //             .map((x) => ({
                        //                 teamId: getTeamId(x) || null,
                        //                 profileId: getProfileId(x) || null,
                        //             }))
                        //             .filter((b) =>
                        //                 newFollowersIds.includes(
                        //                     b.profileId || b.teamId || ""
                        //                 )
                        //             );
                        //         await updateLeadFollowerMutation.mutateAsync(
                        //             followerBodies
                        //         );
                        //     }, 300);

                        //     toast.success(t("success.assignLead"));
                        // } else {
                        //     toast.error(res.message);
                        // }
                        // Thoát khỏi edit mode sau khi hoàn thành
                        setIsEditing(false);
                    } else {
                        // Assign OWNER trực tiếp với body { teamId, profileId }
                        const res = await assignLeadMutation.mutateAsync({
                            teamId:
                                assigneeType === "team"
                                    ? selectedAssignee?.teamId ||
                                      selectedAssignee?.saleTeamId ||
                                      selectedAssignee?.id ||
                                      null
                                    : null,
                            profileId:
                                assigneeType === "team"
                                    ? null
                                    : selectedAssignee?.profileId || null,
                        });
                        // if (res.code === 0) {
                        //     toast.success(t("success.assignLead"));
                        // } else {
                        //     toast.error(res.message);
                        // }
                        // Thoát khỏi edit mode sau khi hoàn thành
                        setIsEditing(false);
                    }
                }
            } else {
                // Nếu không có selectedAssigneeId, vẫn thoát khỏi edit mode
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error updating assignee:", error);
            // Thoát khỏi edit mode ngay cả khi có lỗi
            setIsEditing(false);
        }
    };

    const handleAssigneeSelect = async (selection: any) => {
        let assigneeType = "member"; // Mặc định là member

        if (selection.type === "member") {
            setSelectedAssignee(selection.member);
            setSelectedAssigneeId(selection.member.profileId);
            assigneeType = "member";
        } else if (selection.type === "team") {
            setSelectedAssignee(selection.team);
            setSelectedAssigneeId(selection.team.id);
            assigneeType = "team";
        } else if (
            selection.type === "members" &&
            selection.members.length > 0
        ) {
            // Trường hợp singleSelect=false nhưng vẫn chỉ lấy thành viên đầu tiên
            setSelectedAssignee(selection.members[0]);
            setSelectedAssigneeId(selection.members[0].profileId);
            assigneeType = "member";
        }
        setShowAssignDialog(false);

        // Không tự động gọi API, chỉ cập nhật state và hiển thị nút xác nhận
        // User cần nhấn nút "Xác nhận" để gọi API
    };

    if (isEditing) {
        return (
            <>
                <CustomerAssignListDialog
                    open={showAssignDialog}
                    setOpen={(open: boolean) => {
                        setShowAssignDialog(open);
                        // Không tự động thoát edit mode khi đóng popup để tránh race condition
                        // Người dùng có thể nhấn nút xác nhận hoặc hủy để kết thúc edit mode
                    }}
                    customerID={customerId || ""}
                    mode="select"
                    onSelected={handleAssigneeSelect}
                    showWorkspaceTab={false}
                    restrictTo={undefined}
                    singleSelect={singleSelect}
                    defaultAssignees={(assignee ? [assignee] : []) as any}
                />

                {/* Hiển thị nút xác nhận khi đã chọn assignee */}
                <div className="flex items-center gap-2 w-full mt-2">
                    <div className="flex-1">
                        <div
                            className="text-sm text-gray-600"
                            onClick={() => setShowAssignDialog(true)}
                        >
                            {t("common.selected")}:{" "}
                            {selectedAssignee?.fullName ||
                                selectedAssignee?.name ||
                                selectedAssignee?.teamName}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                            const isTeam = selectedAssignee
                                ? !selectedAssignee?.profileId
                                : Boolean(
                                      (assignee as any)?.saleTeamId ||
                                          (assignee as any)?.teamName
                                  );
                            const assigneeType = isTeam ? "team" : "member";
                            await handleConfirm(assigneeType);
                        }}
                        disabled={
                            assignLeadMutation.isPending ||
                            updateTaskAssigneesMutation.isPending ||
                            updateLeadFollowerMutation.isPending
                        }
                        className="text-green-600 hover:bg-green-100 rounded h-8 w-8 p-0"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setIsEditing(false);
                            setSelectedAssignee(null);
                            setSelectedAssigneeId(getAssigneeId(assignee));
                            setShowAssignDialog(false);
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </>
        );
    }

    // Ưu tiên hiển thị người được chọn gần nhất (optimistic UI), fallback về prop assignee
    const displayAssignee = selectedAssignee || assignee;

    if (!displayAssignee) {
        return (
            <div className={`${className} py-1 text-gray-500`}>
                {t("common.noAssignee")}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className} py-1`}>
            <TooltipProvider>
                <Tooltip content={getAssigneeName(displayAssignee)}>
                    <span className="inline-flex">
                        <Avatar
                            src={
                                getAvatarUrl(
                                    getAssigneeAvatar(displayAssignee)
                                ) || undefined
                            }
                            name={
                                getFirstAndLastWord(
                                    getAssigneeName(displayAssignee)
                                ) || ""
                            }
                            round={true}
                            size={"20"}
                        />
                    </span>
                </Tooltip>
            </TooltipProvider>
            <span className="text-gray-900">
                {getAssigneeName(displayAssignee)}
            </span>
        </div>
    );
}

const EditableAssigneeValue = memo(EditableAssigneeValueComponent);
export default EditableAssigneeValue;

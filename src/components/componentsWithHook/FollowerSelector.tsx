import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import CustomerAssignListDialog from "../customer_assign_list";

export default function FollowerSelector({
    orgId,
    followers,
    handleFollowersChange,
    isOpen,
    setIsOpen,
    ownerId,
}: {
    orgId: string;
    followers: any[];
    handleFollowersChange: (followers: any[]) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    ownerId?: string;
}) {
    const { t } = useLanguage();
    const [showAssignDialog, setShowAssignDialog] = useState(false);

    const handleSelected = (result: any) => {
        const selectedFollowers: any[] = [];

        // Thêm members vào danh sách với type: "member" và lấy profileId
        if (result?.members && result.members.length > 0) {
            const formattedMembers = result.members.map((member: any) => ({
                ...member,
                type: "member",
                id: member.profileId, // Lấy profileId làm id
            }));
            selectedFollowers.push(...formattedMembers);
        }

        // Thêm teams vào danh sách với type: "team" và lấy id
        if (result?.teams && result.teams.length > 0) {
            const formattedTeams = result.teams.map((team: any) => ({
                ...team,
                type: "team",
                id: team.id, // Lấy id của team
            }));
            selectedFollowers.push(...formattedTeams);
        }

        // Nếu có member đơn lẻ (singleSelect case)
        if (result?.member) {
            selectedFollowers.push({
                ...result.member,
                type: "member",
                id: result.member.profileId,
            });
        }

        handleFollowersChange(selectedFollowers);
        setShowAssignDialog(false);
        setIsOpen(false);
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="text-sm text-gray-600 hover:bg-gray-100 p-1 h-auto"
                onClick={() => {
                    setShowAssignDialog(true);
                    setIsOpen(true);
                }}
            >
                {followers?.length || 0} {t("common.followers")}
                <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
            <CustomerAssignListDialog
                open={showAssignDialog}
                setOpen={(open: boolean) => {
                    setShowAssignDialog(open);
                    if (!open) {
                        setIsOpen(false);
                    }
                }}
                customerID=""
                mode="select"
                onSelected={handleSelected}
                showWorkspaceTab={false}
                restrictTo=""
                singleSelect={false}
                defaultAssignees={(followers || []) as any}
            />
        </>
    );
}

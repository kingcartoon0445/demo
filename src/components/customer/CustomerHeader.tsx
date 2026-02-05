import { useLanguage } from "@/contexts/LanguageContext";
import { useAssignCustomer } from "@/hooks/useCustomerDetail";
import { Assignee, Customer } from "@/lib/interface";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import FollowerSelector from "../componentsWithHook/FollowerSelector";
import OwnerSelector from "../componentsWithHook/OwnerSelector";
import AddNewDealModal from "../deals/AddNewDealModal";
import AddCustomerModal from "../leads/AddCustomerModal";
import AddOpportunityDropdown from "./AddOpportunityDropdown";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { MdOutlineCall } from "react-icons/md";
import toast from "react-hot-toast";

interface CustomerHeaderProps {
    customerName?: string;
    orgId: string;
    customerId?: string;
    assignees?: Assignee[];
    customerSelected?: Customer;
}

export default function CustomerHeader({
    customerName,
    orgId,
    customerId,
    assignees = [],
    customerSelected,
}: CustomerHeaderProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
    const [isOwnerPopoverOpen, setIsOwnerPopoverOpen] = useState(false);
    const [isFollowerPopoverOpen, setIsFollowerPopoverOpen] = useState(false);
    const [lastCallTime, setLastCallTime] = useState(0);

    // Hook để assign customer
    const assignCustomerMutation = useAssignCustomer(orgId, customerId || "");

    // Tách owner và followers từ assignees
    const owner = assignees.find((assignee) => assignee.type === "OWNER");
    const followers = assignees.filter(
        (assignee) => assignee.type === "FOLLOWER"
    );

    const handleAddOpportunity = () => {
        setIsAddCustomerModalOpen(true);
    };

    const handleAddDeal = () => {
        setIsAddDealModalOpen(true);
    };

    const handleOwnerChange = (member: any) => {
        if (!member || !customerId) return;

        // // Logic: Chỉ có 1 owner duy nhất
        // // Nếu có owner cũ, chuyển owner cũ thành follower
        // const currentOwnerIds = owner ? [owner.profileId] : [];
        // const newFollowerIds = followers.map((f) => f.profileId);

        // // Nếu có owner cũ và owner mới khác owner cũ
        // if (owner && member.profileId !== owner.profileId) {
        //     // Thêm owner cũ vào danh sách followers
        //     newFollowerIds.push(owner.profileId);
        // }

        // // Loại bỏ member mới khỏi followers (nếu có)
        // const updatedFollowerIds = newFollowerIds.filter(
        //     (id) => id !== member.profileId
        // );

        // Cập nhật owner mới
        assignCustomerMutation.mutate({
            type: member.profileId ? "member" : "team",
            role: "OWNER",
            ids: [member.profileId || member.id],
        });

        // // Nếu có followers, cập nhật luôn danh sách followers
        // if (updatedFollowerIds.length > 0) {
        //     setTimeout(() => {
        //         assignCustomerMutation.mutate({
        //             type: "member",
        //             role: "FOLLOWER",
        //             ids: updatedFollowerIds,
        //         });
        //     }, 500);
        // }

        setIsOwnerPopoverOpen(false);
    };

    const handleFollowersChange = (followers: any[]) => {
        if (!customerId) return;

        // Tách followers thành members và teams dựa trên type
        const members = followers.filter((f) => f.type === "member");
        const teams = followers.filter((f) => f.type === "team");

        // Lấy IDs của members (profileId hoặc id)
        const memberIds = members.map(
            (member) => member.profileId || member.id
        );

        // Lấy IDs của teams
        const teamIds = teams.map((team) => team.id);

        // Cập nhật followers cho members
        if (memberIds.length > 0) {
            assignCustomerMutation.mutate({
                type: "member",
                role: "FOLLOWER",
                ids: memberIds,
            });
        }

        // Cập nhật followers cho teams
        if (teamIds.length > 0) {
            assignCustomerMutation.mutate({
                type: "team",
                role: "FOLLOWER",
                ids: teamIds,
            });
        }
    };
    const handleCall = useCallback(() => {
        if (!customerSelected?.phone) {
            toast.error("Không có số điện thoại để gọi");
            return;
        }

        const now = Date.now();
        const currentCallStatus = document
            .querySelector("[data-call-status]")
            ?.getAttribute("data-call-status");
        if (
            now - lastCallTime < 2000 ||
            currentCallStatus === "connecting" ||
            currentCallStatus === "ringing" ||
            currentCallStatus === "connected"
        ) {
            toast.error(
                "Vui lòng kết thúc cuộc gọi hiện tại trước khi thực hiện cuộc gọi mới"
            );
            return;
        }

        setLastCallTime(now);

        const event = new CustomEvent("initiate-call", {
            detail: customerSelected,
        });
        window.dispatchEvent(event);
    }, [customerSelected, lastCallTime]);

    return (
        <>
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                    <TooltipProvider>
                        <Tooltip content={<p>Gọi điện</p>}>
                            <div
                                data-call-button
                                onClick={handleCall}
                                className={
                                    "bg-[#4dae50] rounded-full p-2 cursor-pointer"
                                }
                            >
                                <MdOutlineCall className="text-2xl text-white" />
                            </div>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex items-center gap-4">
                    {/* Owner Popover */}
                    <OwnerSelector
                        orgId={orgId}
                        owner={owner}
                        handleOwnerChange={handleOwnerChange}
                        isOpen={isOwnerPopoverOpen}
                        setIsOpen={setIsOwnerPopoverOpen}
                    />

                    {/* Followers Popover */}
                    <FollowerSelector
                        orgId={orgId}
                        followers={followers}
                        handleFollowersChange={handleFollowersChange}
                        isOpen={isFollowerPopoverOpen}
                        setIsOpen={setIsFollowerPopoverOpen}
                        ownerId={owner?.profileId}
                    />

                    <AddOpportunityDropdown
                        onAddOpportunity={handleAddOpportunity}
                        onAddDeal={handleAddDeal}
                    />
                </div>
            </div>

            {/* Modals */}
            <AddCustomerModal
                isOpen={isAddCustomerModalOpen}
                onClose={() => setIsAddCustomerModalOpen(false)}
                orgId={orgId}
                provider="lead"
                customerId={customerId}
            />

            <AddNewDealModal
                isOpen={isAddDealModalOpen}
                onClose={() => setIsAddDealModalOpen(false)}
                orgId={orgId}
            />
        </>
    );
}

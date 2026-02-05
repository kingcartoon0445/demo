import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import CustomerAssignListDialog from "../customer_assign_list";

export default function OwnerSelector({
    orgId,
    owner,
    handleOwnerChange,
    isOpen,
    setIsOpen,
}: {
    orgId: string;
    owner: any;
    handleOwnerChange: (member: any) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}) {
    const { t } = useLanguage();
    const [showAssignDialog, setShowAssignDialog] = useState(false);

    const handleSelected = (result: any) => {
        if (result?.member || (result?.teams && result?.teams.length > 0)) {
            handleOwnerChange(result.member || result.teams[0]);
        } else if (result?.members && result.members.length > 0) {
            handleOwnerChange(result.members[0]);
        }
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
                <span className="font-medium">
                    {owner?.profileName ||
                        owner?.name ||
                        owner?.teamName ||
                        (t("common.noAssigner") as string)}
                </span>{" "}
                ({t("common.assigner")})
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
                singleSelect={true}
                defaultAssignees={(owner ? [owner] : []) as any}
            />
        </>
    );
}

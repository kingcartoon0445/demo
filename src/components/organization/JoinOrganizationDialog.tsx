"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { BadgeCheck, Check, Users, X } from "lucide-react";
import Avatar from "react-avatar";

interface Organization {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    address?: string;
    fieldOfActivity?: string;
    website?: string;
    subscription?: string;
    memberCount?: number;
}

interface JoinOrganizationDialogProps {
    organization: Organization;
    onAccept: () => void;
    onReject: () => void;
    open: boolean;
    onClose?: () => void;
}

export default function JoinOrganizationDialog({
    organization,
    onAccept,
    onReject,
    open,
    onClose,
}: JoinOrganizationDialogProps) {
    const memberCountText =
        typeof organization.memberCount === "number"
            ? `${organization.memberCount} thành viên`
            : undefined;

    const subscriptionLabel =
        organization.subscription === "PERSONAL"
            ? "Tổ chức cá nhân"
            : organization.subscription === "BUSINESS"
            ? "Tổ chức doanh nghiệp"
            : organization.subscription;

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose?.();
                }
            }}
        >
            <DialogContent className="sm:max-w-[480px] p-0" showCloseButton>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="">
                        Lời mời tham gia tổ chức
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-2 text-center px-4 pb-4">
                    <div className="relative">
                        <Avatar
                            src={
                                getAvatarUrl(organization.avatar || "") ||
                                undefined
                            }
                            name={getFirstAndLastWord(organization.name)}
                            size="70"
                            round={true}
                        />
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-semibold text-gray-900 inline-flex items-center gap-1">
                            {organization.name}{" "}
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                                <BadgeCheck className="h-5 w-5" />
                            </span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Tổ chức chính thức của {organization.name}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="flex -space-x-2">
                            {organization.memberCount &&
                                organization.memberCount > 3 && (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-primary text-xs font-medium text-white">
                                        +{organization.memberCount - 3}
                                    </div>
                                )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {memberCountText
                                ? `Hãy tham gia cùng ${memberCountText}`
                                : "Hãy tham gia cùng các thành viên khác"}
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={onReject}>
                        <X className="w-4 h-4" />
                        Từ chối
                    </Button>
                    <Button onClick={onAccept}>
                        <Check className="w-4 h-4" />
                        Chấp nhận
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

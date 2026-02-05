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
import { BadgeCheck, Send, X } from "lucide-react";
import Avatar from "react-avatar";

interface Organization {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    memberCount?: number;
}

interface RequestOrganizationDialogProps {
    organization: Organization;
    onSendRequest: () => void;
    open: boolean;
    onClose?: () => void;
}

export default function RequestOrganizationDialog({
    organization,
    onSendRequest,
    open,
    onClose,
}: RequestOrganizationDialogProps) {
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
                        Yêu cầu tham gia tổ chức
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
                            Gửi yêu cầu để tham gia tổ chức này
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={() => onClose?.()}>
                        <X className="w-4 h-4" />
                        Đóng
                    </Button>
                    <Button onClick={onSendRequest}>
                        <Send className="w-4 h-4" />
                        Gửi yêu cầu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}



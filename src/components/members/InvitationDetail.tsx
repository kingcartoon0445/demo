"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, X } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";

interface Invitation {
    id: string;
    organizationId: string;
    profileId: string;
    profile: {
        id: string;
        fullName: string;
        email: string;
        gender: number;
        isVerifyPhone: boolean;
        isVerifyEmail: boolean;
        createdDate: string;
        avatar?: string;
    };
    typeOfEmployee: string;
    type: string;
    status: number;
    createdDate: string;
}

const getTypeOfEmployeeLabel = (type: string, t: (key: string) => string) => {
    switch (type) {
        case "OWNER":
            return t("role.owner");
        case "ADMIN":
            return t("role.admin");
        case "FULLTIME":
            return t("role.member");
        default:
            return t("role.member");
    }
};

interface InvitationDetailProps {
    invitation: Invitation;
    onAccept?: (invitationId: string) => void;
    onReject?: (invitationId: string) => void;
}

export default function InvitationDetail({
    invitation,
    onAccept,
    onReject,
}: InvitationDetailProps) {
    const { t } = useLanguage();

    if (!invitation) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <p>Chọn lời mời để xem chi tiết</p>
                </div>
            </div>
        );
    }

    // Check if profile exists
    if (!invitation.profile) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <p>Không có thông tin profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Member Header */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                    <Avatar
                        name={getFirstAndLastWord(invitation.profile.fullName)}
                        size="40"
                        round={true}
                        src={
                            getAvatarUrl(invitation.profile.avatar || "") ||
                            undefined
                        }
                    />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {invitation.profile.fullName}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button onClick={() => onAccept?.(invitation.id)}>
                        <Check className="w-4 h-4 mr-2" />
                        Chấp nhận
                    </Button> */}
                    <Button
                        onClick={() => onReject?.(invitation.id)}
                        variant="outline"
                        className=""
                    >
                        <X className="w-4 h-4 mr-2" />
                        Hủy lời mời
                    </Button>
                </div>
            </div>

            {/* Member Information */}
            <ScrollArea className="flex-1 overflow-y-auto p-2 h-full">
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Thông tin thành viên
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <p className="text-sm text-gray-900">
                                    {invitation.profile.email}
                                </p>
                            </div>
                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giới tính
                                </label>
                                <p className="text-sm text-gray-900">
                                    {invitation.profile.gender === 0
                                        ? "Nam"
                                        : invitation.profile.gender === 1
                                        ? "Nữ"
                                        : "Không xác định"}
                                </p>
                            </div> */}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

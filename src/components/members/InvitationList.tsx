"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, UserPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Tooltip } from "../ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollArea } from "../ui/scroll-area";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";

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

interface InvitationListProps {
    invitations: Invitation[];
    selectedInvitationId: string | null;
    onInvitationSelect: (invitationId: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddInvitation?: () => void;
}

export default function InvitationList({
    invitations,
    selectedInvitationId,
    onInvitationSelect,
    searchQuery,
    onSearchChange,
    onAddInvitation,
}: InvitationListProps) {
    const [showSearch, setShowSearch] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (showSearch && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showSearch]);

    return (
        <ScrollArea className="flex-1 overflow-y-auto">
            <div className="pb-4">
                {invitations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery
                            ? "Không tìm thấy lời mời"
                            : "Chưa có lời mời nào"}
                    </div>
                ) : (
                    invitations.map((invitation) => (
                        <div
                            key={invitation.id}
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 relative group last:border-0 ${
                                selectedInvitationId === invitation.id
                                    ? "bg-blue-50/50"
                                    : "hover:bg-gray-50/50 bg-transparent"
                            }`}
                            onClick={() => onInvitationSelect(invitation.id)}
                        >
                            {/* Active Indicator Line */}
                            {selectedInvitationId === invitation.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                            )}

                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Avatar
                                        name={getFirstAndLastWord(
                                            invitation.profile?.fullName,
                                        )}
                                        size="40"
                                        round={true}
                                        src={
                                            getAvatarUrl(
                                                invitation.profile?.avatar ||
                                                    "",
                                            ) || undefined
                                        }
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {invitation.profile?.fullName}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {getTypeOfEmployeeLabel(
                                            invitation.typeOfEmployee,
                                            t,
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {invitation.profile?.email}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {new Date(
                                            invitation.createdDate,
                                        ).toLocaleDateString("vi-VN")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    );
}

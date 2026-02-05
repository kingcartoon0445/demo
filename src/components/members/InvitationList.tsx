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
        <>
            {/* Header with Add + Search */}
            <div className="border-b border-gray-200/60 p-2 flex items-center">
                {/* Search input w/ animation */}
                <div
                    className="relative transition-all duration-300"
                    style={{
                        width: showSearch ? 220 : 0,
                        marginRight: showSearch ? "8px" : "0px",
                    }}
                >
                    {showSearch && (
                        <>
                            <Input
                                ref={inputRef}
                                placeholder="Tìm kiếm lời mời..."
                                className="pl-9 pr-8 border-gray-300 h-9"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <X
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
                                onClick={() => {
                                    onSearchChange("");
                                    setShowSearch(false);
                                }}
                            />
                        </>
                    )}
                </div>

                {/* Search icon */}
                {!showSearch && (
                    <Tooltip content="Tìm kiếm">
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-gray-600 hover:text-gray-800 mr-2"
                            onClick={() => setShowSearch(true)}
                        >
                            <Search className="w-5 h-5" />
                        </Button>
                    </Tooltip>
                )}

                {/* Add invitation - using AddMemberModal */}
                <Tooltip content="Gửi lời mời">
                    <Button
                        variant="default"
                        size="icon"
                        className="text-white px-3 py-2 rounded-lg transition-transform duration-300 hover:scale-105"
                        onClick={onAddInvitation}
                    >
                        <UserPlus className="w-4 h-4" />
                    </Button>
                </Tooltip>
            </div>

            {/* Invitation List */}
            <ScrollArea className="flex-1 overflow-y-auto">
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
                            className={`p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                selectedInvitationId === invitation.id
                                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                                    : ""
                            }`}
                            onClick={() => onInvitationSelect(invitation.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Avatar
                                        name={getFirstAndLastWord(
                                            invitation.profile?.fullName
                                        )}
                                        size="40"
                                        round={true}
                                        src={
                                            getAvatarUrl(
                                                invitation.profile?.avatar || ""
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
                                            t
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {invitation.profile?.email}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {new Date(
                                            invitation.createdDate
                                        ).toLocaleDateString("vi-VN")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </ScrollArea>
        </>
    );
}

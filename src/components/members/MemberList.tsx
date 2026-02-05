"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Tooltip } from "../ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollArea } from "../ui/scroll-area";
import { OrgMember } from "@/lib/interface";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";

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

interface MemberListProps {
    members: OrgMember[];
    selectedMemberId: string | null;
    onMemberSelect: (memberId: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddMember?: () => void;
}

export default function MemberList({
    members,
    selectedMemberId,
    onMemberSelect,
    searchQuery,
    onSearchChange,
    onAddMember,
}: MemberListProps) {
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
                                placeholder={t("member.searchPlaceholder")}
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
                    <Tooltip content={t("member.search")}>
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

                {/* Add member */}
                <Tooltip content={t("member.add")}>
                    <Button
                        variant="default"
                        size="icon"
                        className="text-white px-3 py-2 rounded-lg transition-transform duration-300 hover:scale-105"
                        onClick={onAddMember}
                    >
                        <UserPlus className="w-4 h-4" />
                    </Button>
                </Tooltip>
            </div>

            {/* Member List */}
            <ScrollArea className="flex-1 overflow-y-auto">
                {members.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery
                            ? t("member.notFound")
                            : t("member.noMembers")}
                    </div>
                ) : (
                    members.map((member) => (
                        <div
                            key={member.profileId}
                            className={`p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                selectedMemberId === member.profileId
                                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                                    : ""
                            }`}
                            onClick={() => onMemberSelect(member.profileId)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Avatar
                                        name={getFirstAndLastWord(
                                            member.fullName
                                        )}
                                        size="40"
                                        round={true}
                                        src={
                                            getAvatarUrl(member.avatar || "") ||
                                            undefined
                                        }
                                    />

                                    {member.lastOnline ? (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                    ) : (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {member.fullName}
                                        </p>
                                        {member.status !== 1 && (
                                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                                                {t("member.inactive")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {getTypeOfEmployeeLabel(
                                            member.typeOfEmployee,
                                            t
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {member.email}
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

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
import { Glass } from "@/components/Glass";

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
        <ScrollArea className="flex-1 overflow-y-auto">
            <div className="pb-4">
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
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 relative group last:border-0 ${
                                selectedMemberId === member.profileId
                                    ? "bg-blue-50/50"
                                    : "hover:bg-gray-50/50 bg-transparent"
                            }`}
                            onClick={() => onMemberSelect(member.profileId)}
                        >
                            {/* Active Indicator Line */}
                            {selectedMemberId === member.profileId && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                            )}

                            <div className="flex items-start gap-4">
                                {/* Avatar & Status */}
                                <div className="relative shrink-0">
                                    <Avatar
                                        name={getFirstAndLastWord(
                                            member.fullName,
                                        )}
                                        size="48"
                                        round={true}
                                        src={
                                            getAvatarUrl(member.avatar || "") ||
                                            undefined
                                        }
                                        className="shadow-sm"
                                        color={
                                            member.typeOfEmployee === "OWNER"
                                                ? "#FCD34D"
                                                : member.typeOfEmployee ===
                                                    "ADMIN"
                                                  ? "#F97316"
                                                  : "#3B82F6"
                                        }
                                        maxInitials={2}
                                    />
                                    {member.lastOnline ? (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                                    ) : (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-400 border-2 border-white rounded-full shadow-sm"></div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-[15px] font-bold text-gray-900 truncate pr-2">
                                            {member.fullName}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5 font-medium">
                                            {new Date(
                                                member.createdDate,
                                            ).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500 truncate mb-2 font-medium">
                                        {member.email}
                                    </p>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Role Badge */}
                                        <span
                                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                                member.typeOfEmployee ===
                                                "OWNER"
                                                    ? "bg-red-50 text-red-600 border-red-100"
                                                    : member.typeOfEmployee ===
                                                        "ADMIN"
                                                      ? "bg-blue-50 text-blue-600 border-blue-100"
                                                      : "bg-blue-50 text-blue-500 border-blue-100"
                                            }`}
                                        >
                                            {getTypeOfEmployeeLabel(
                                                member.typeOfEmployee,
                                                t,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    );
}

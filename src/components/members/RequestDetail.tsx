"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    X,
    Clock,
    User,
    Mail,
    Calendar,
    Shield,
    Phone,
    MapPin,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";

interface Request {
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

interface RequestDetailProps {
    request: Request;
    onAccept?: (requestId: string) => void;
    onReject?: (requestId: string) => void;
}

export default function RequestDetail({
    request,
    onAccept,
    onReject,
}: RequestDetailProps) {
    const { t } = useLanguage();

    if (!request) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <p>Chọn yêu cầu để xem chi tiết</p>
                </div>
            </div>
        );
    }

    // Check if profile exists
    if (!request.profile) {
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
                        name={getFirstAndLastWord(request.profile.fullName)}
                        size="40"
                        round={true}
                        src={
                            getAvatarUrl(request.profile.avatar || "") ||
                            undefined
                        }
                    />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {request.profile.fullName}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => onAccept?.(request.id)}>
                        <Check className="w-4 h-4 mr-2" />
                        Chấp nhận
                    </Button>
                    <Button
                        onClick={() => onReject?.(request.id)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Từ chối
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
                                    {request.profile.email}
                                </p>
                            </div>

                            {/* <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giới tính
                                </label>
                                <p className="text-sm text-gray-900">
                                    {request.profile.gender === 0
                                        ? "Nam"
                                        : request.profile.gender === 1
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

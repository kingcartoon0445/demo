"use client";

import React from "react";
import { Mail, Phone, User2 } from "lucide-react";

interface ContactInfoDisplayProps {
    fullName?: string;
    phone?: string;
    email?: string;
}

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-gray-500">
                <span className="inline-flex items-center justify-center w-5 h-5">
                    {icon}
                </span>
                <span className="text-sm">{label}</span>
            </div>
            <div className="text-sm font-medium text-gray-900 truncate max-w-[60%] text-right">
                {value || <span className="text-gray-400">—</span>}
            </div>
        </div>
    );
}

export default function ContactInfoDisplay({
    fullName,
    phone,
    email,
}: ContactInfoDisplayProps) {
    return (
        <div>
            <h3 className="font-medium mb-3">Thông tin liên hệ</h3>
            <div className="divide-y rounded-lg border border-gray-200 bg-white">
                <div className="px-3">
                    <InfoRow
                        icon={<User2 className="w-4 h-4" />}
                        label="Họ và tên"
                        value={fullName}
                    />
                </div>
                <div className="px-3">
                    <InfoRow
                        icon={<Phone className="w-4 h-4" />}
                        label="Số điện thoại"
                        value={phone}
                    />
                </div>
                <div className="px-3">
                    <InfoRow
                        icon={<Mail className="w-4 h-4" />}
                        label="Email"
                        value={email}
                    />
                </div>
            </div>
        </div>
    );
}


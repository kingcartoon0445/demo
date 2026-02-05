import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { CalendarDays, NotepadText, PhoneCall } from "lucide-react";
import React from "react";
import { IoIosAttach } from "react-icons/io";
import LastModifiedTime from "../LastModifiedTime";
import Avatar from "react-avatar";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

export interface DealCardProps {
    id: string;
    title: string;
    customer: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
    totalCalls: number;
    totalNotes: number;
    totalReminders: number;
    totalAttachments: number;
    lastModifiedDate: string;
    stageId?: string;
    stageName?: string;
    dealValue?: number;
    workspaceId?: string;
    workspaceName?: string;
    assignees?: string[];
    tags?: Array<{
        id: string;
        name: string;
        textColor?: string;
        backgroundColor?: string;
    }>;
    onClick?: (deal: any) => void;
}

const DealCard: React.FC<DealCardProps> = ({
    id,
    title,
    customer,
    username,
    email,
    phone,
    avatar,
    totalCalls,
    totalNotes,
    totalReminders,
    totalAttachments,
    lastModifiedDate,
    stageId,
    stageName,
    dealValue = 0,
    workspaceId,
    workspaceName,
    assignees,
    tags,
    onClick,
}) => {
    const handleClick = (e: React.MouseEvent) => {
        // Only handle click if not in edit mode and not on drag handles
        if (onClick) {
            e.stopPropagation();
            onClick({
                id,
                title,
                customer,
                username,
                email,
                phone,
                avatar,
                totalCalls,
                totalNotes,
                totalReminders,
                totalAttachments,
                lastModifiedDate,
                dealValue,
                stageId,
                stageName,
                // Add missing properties required by Deal interface
                workspaceId,
                workspaceName,
                assignees,
                tags,
            });
        }
    };

    // Format currency
    const formatValue = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "bg-white rounded-lg p-3 shadow-sm hover:shadow-xl transition-all duration-200 cursor-move border border-gray-100 hover:-translate-y-1",
                // statusColors[status]
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2 gap-2">
                <h4 className="font-medium text-sm text-gray-900 break-words line-clamp-2 w-[50%]">
                    {title}
                </h4>
                <div className="flex items-center gap-1 flex-shrink-0 w-[50%] justify-end">
                    {Array.isArray(tags) && tags.length > 0 ? (
                        (() => {
                            const visible = tags.slice(0, 3);
                            const remaining = tags.length - visible.length;
                            const rows: (typeof visible)[] = [];
                            for (let i = 0; i < visible.length; i += 2) {
                                rows.push(visible.slice(i, i + 2));
                            }
                            return (
                                <div className="flex flex-col gap-1">
                                    {rows.map((row, rowIndex) => (
                                        <div
                                            key={rowIndex}
                                            className="flex items-center gap-1"
                                        >
                                            {row.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded-md border"
                                                    style={{
                                                        color:
                                                            tag.textColor ||
                                                            "#111827",
                                                        backgroundColor:
                                                            tag.backgroundColor ||
                                                            "#F3F4F6",
                                                        borderColor:
                                                            "rgba(0,0,0,0.08)",
                                                    }}
                                                    title={tag.name}
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                    {remaining > 0 && (
                                        <div className="flex items-center">
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                                                +{remaining}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    ) : (
                        <div className="flex items-center gap-1">
                            <div className={cn("w-2 h-2 rounded-full")}></div>
                            <div className={cn("w-2 h-2 rounded-full")}></div>
                            <div className={cn("w-2 h-2 rounded-full")}></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Deal Value */}
            <p className="text-sm font-medium text-green-600 mb-3">
                {formatValue(dealValue)}
            </p>

            {/* Customer with avatar */}
            <div className="flex items-center justify-between gap-2 mb-3 ">
                <div className="flex items-center gap-2">
                    <Avatar
                        name={getFirstAndLastWord(username || "Unknown")}
                        size="20"
                        round={true}
                        src={getAvatarUrl(avatar) || undefined}
                    />
                    <span className="text-sm text-gray-700 truncate">
                        {username || "Unknown"}
                    </span>
                </div>
                <div>
                    {lastModifiedDate ? (
                        <LastModifiedTime lastModifiedDate={lastModifiedDate} />
                    ) : (
                        ""
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip content={<p>Số cuộc gọi</p>}>
                                <div className="flex items-center gap-1">
                                    <PhoneCall size={16} />
                                    <span className="text-xs font-medium">
                                        {totalCalls}
                                    </span>
                                </div>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip content={<p>Số ghi chú</p>}>
                                <div className="flex items-center gap-1">
                                    <NotepadText size={16} />
                                    <span className="text-xs font-medium">
                                        {totalNotes}
                                    </span>
                                </div>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip content={<p>Số lượng nhắc nhở</p>}>
                                <div className="flex items-center gap-1">
                                    <CalendarDays size={16} />
                                    <span className="text-xs font-medium">
                                        {totalReminders}
                                    </span>
                                </div>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip content={<p>Số lượng tệp đính kèm</p>}>
                                <div className="flex items-center gap-1">
                                    <IoIosAttach size={16} />
                                    <span className="text-xs font-medium">
                                        {totalAttachments}
                                    </span>
                                </div>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealCard;

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";
import { CalendarDays, PhoneCall, Pencil } from "lucide-react";
import { Button } from "../ui/button";

export type DealRow = {
    id: string;
    name: string;
    stage: string;
    product: string;
    customerName: string;
    customerAvatar?: string;
    orderValue?: string;
    assignees?: any[];
    assigneeAvatar?: string;
    tags?: string[];
    orderId?: string;
    originalDeal?: any;
    totalCalls?: number;
    totalReminders?: number;
};

export const createColumns = (
    columnVisibility?: Record<string, boolean>,
    columnLabels?: Record<string, string>,
    onEdit?: (deal: DealRow) => void,
): ColumnDef<DealRow>[] =>
    [
        {
            id: "select",
            header: ({ table }: { table: any }) => (
                <div className="pl-4">
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                                "indeterminate")
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                        className="data-[state=checked]:bg-[#532AE7] data-[state=checked]:border-[#532AE7] border-gray-300"
                    />
                </div>
            ),
            cell: ({ row }: { row: any }) => (
                <div className="pl-4">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-[#532AE7] data-[state=checked]:border-[#532AE7] border-gray-300"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        {
            accessorKey: "customerName",
            header: columnLabels?.customerName || "KHÁCH HÀNG",
            cell: ({ row }: { row: any }) => {
                const avatar = row.original.customerAvatar;
                return (
                    <div className="flex items-center gap-3">
                        {/* <Avatar
                            name={getFirstAndLastWord(
                                row.original.customerName || "Unknown"
                            )}
                            size="32"
                            round={true}
                            src={getAvatarUrl(avatar || "") || undefined}
                            className="font-bold"
                        /> */}
                        <span className="font-bold text-gray-900 text-sm">
                            {row.original.customerName || "Unknown"}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: columnLabels?.name || "TÊN GIAO DỊCH",
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-1">
                    <span className="text-gray-700 font-normal">
                        {row.original.name}
                    </span>
                    {/* Tags line if any */}
                    {row.original.tags && row.original.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                            {row.original.tags.map((tag: any) => (
                                <div
                                    key={tag.id}
                                    className="h-1 w-8 rounded-full"
                                    style={{
                                        backgroundColor:
                                            tag.backgroundColor || "#3B82F6",
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "orderValue",
            header: columnLabels?.orderValue || "GIÁ TRỊ",
            cell: ({ row }: { row: any }) => (
                <span className="text-blue-600 font-bold text-sm">
                    {row.original.orderValue}
                </span>
            ),
        },
        {
            accessorKey: "stage",
            header: columnLabels?.stage || "TRẠNG THÁI",
            cell: ({ row }: { row: any }) => (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700">
                    {row.original.stage}
                </div>
            ),
        },
        {
            accessorKey: "assignees",
            header: columnLabels?.assignees || "PHỤ TRÁCH",
            cell: ({ row }: { row: any }) => {
                const assignees = row.original.assignees;
                const displayAssignees = assignees?.slice(0, 3);
                const remainingCount = assignees?.length
                    ? assignees.length - 3
                    : 0;
                return assignees && assignees.length > 0 ? (
                    <div className="flex items-center gap-1">
                        {displayAssignees?.map((assignee: any) => (
                            <TooltipProvider key={assignee.id}>
                                <Tooltip
                                    content={
                                        <span className="text-sm ">
                                            {assignee.name}
                                        </span>
                                    }
                                >
                                    <TooltipTrigger>
                                        <div className="rounded-full border border-white shadow-sm">
                                            <Avatar
                                                name={getFirstAndLastWord(
                                                    assignee.name,
                                                )}
                                                size="28"
                                                round={true}
                                                src={
                                                    getAvatarUrl(
                                                        assignee.avatar,
                                                    ) || undefined
                                                }
                                            />
                                        </div>
                                    </TooltipTrigger>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {remainingCount > 0 && (
                            <span className="text-xs w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 border border-white font-medium">
                                +{remainingCount}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                );
            },
        },
        {
            accessorKey: "activity",
            header: columnLabels?.activity || "HOẠT ĐỘNG",
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1.5" title="Lịch hẹn">
                        <CalendarDays size={16} className="text-gray-400" />
                        <span className="text-xs font-medium">
                            {row.original.totalReminders || 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Cuộc gọi">
                        <PhoneCall size={16} className="text-gray-400" />
                        <span className="text-xs font-medium">
                            {row.original.totalCalls || 0}
                        </span>
                    </div>
                </div>
            ),
        },
    ].filter((column) => {
        // Always show select
        if (column.id === "select") return true;

        // Filter based on visibility if provided
        if (columnVisibility && column.accessorKey) {
            return columnVisibility[column.accessorKey as string] !== false;
        }

        // Default to showing all columns if no visibility config
        return true;
    });

// Export default columns for backward compatibility
export const columns = createColumns();

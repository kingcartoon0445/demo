import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";

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
};

export const createColumns = (
    columnVisibility?: Record<string, boolean>,
    columnLabels?: Record<string, string>
): ColumnDef<DealRow>[] =>
    [
        {
            id: "select",
            header: ({ table }: { table: any }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }: { row: any }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: columnLabels?.name || "Tiêu đề giao dịch",
        },
        {
            accessorKey: "stage",
            header: columnLabels?.stage || "Giai đoạn",
        },
        {
            accessorKey: "product",
            header: columnLabels?.product || "Sản phẩm",
        },
        {
            accessorKey: "customerName",
            header: columnLabels?.customerName || "Khách hàng",
            cell: ({ row }: { row: any }) => {
                const avatar = row.original.customerAvatar;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar
                            name={getFirstAndLastWord(
                                row.original.customerName
                            )}
                            size="20"
                            round={true}
                            src={getAvatarUrl(avatar || "") || undefined}
                        />
                        <span>{row.original.customerName}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "orderValue",
            header: columnLabels?.orderValue || "Giá trị giao dịch",
        },
        {
            accessorKey: "assignees",
            header: columnLabels?.assignees || "Người phụ trách",
            cell: ({ row }: { row: any }) => {
                const assignees = row.original.assignees;
                const avatar = row.original.assigneeAvatar;
                const displayAssignees = assignees?.slice(0, 3);
                const remainingCount = assignees?.length
                    ? assignees.length - 3
                    : 0;
                return assignees && assignees.length > 0 ? (
                    <div className="flex items-center gap-2">
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
                                        <Avatar
                                            name={getFirstAndLastWord(
                                                assignee.name
                                            )}
                                            size="20"
                                            round={true}
                                            src={
                                                getAvatarUrl(assignee.avatar) ||
                                                undefined
                                            }
                                        />
                                    </TooltipTrigger>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {remainingCount > 0 && (
                            <span className="text-sm text-gray-500">
                                +{remainingCount}
                            </span>
                        )}
                    </div>
                ) : (
                    <span>-</span>
                );
            },
        },
        {
            accessorKey: "tags",
            header: columnLabels?.tags || "Nhãn",
            cell: ({ row }: { row: any }) => {
                const displayTags = row.original.tags?.slice(0, 3);
                const remainingCount = row.original.tags?.length
                    ? row.original.tags.length - 3
                    : 0;
                return (
                    <div className="flex gap-2">
                        {displayTags?.map((tag: any, i: number) => (
                            <span
                                key={tag.id}
                                className="p-2 py-0.5 border rounded-full text-xs flex items-center gap-1"
                            >
                                <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                        backgroundColor: tag.backgroundColor,
                                    }}
                                />
                                {tag.name}
                            </span>
                        ))}
                        {remainingCount > 0 && (
                            <span className="text-sm text-gray-500">
                                +{remainingCount}
                            </span>
                        )}
                    </div>
                );
            },
        },
    ].filter((column) => {
        // Always show select column
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

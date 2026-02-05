import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { apiBase } from "@/lib/authConstants";
import { Customer } from "@/lib/interface";
import { getFirstAndLastWord } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import Avatar from "react-avatar";
import { useLanguage } from "@/contexts/LanguageContext";
// Helper function to format relative time
const formatRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else {
        return `${diffDays} ngày trước`;
    }
};

// Helper function to get avatar URL
const getAvatarUrl = (avatar: string | undefined) => {
    if (!avatar) return null;
    if (avatar.includes("https")) return avatar;
    return avatar[0] == "/" ? `${apiBase}${avatar}` : `${apiBase}/${avatar}`;
};

export const createColumns = (): ColumnDef<Customer, unknown>[] => [
    {
        id: "customer",
        header: "Khách hàng",
        cell: ({ row }) => {
            const customer = row.original;
            return (
                <div className="flex items-center gap-2">
                    <Avatar
                        name={getFirstAndLastWord(customer.fullName || "")}
                        src={getAvatarUrl(customer.avatar) || undefined}
                        size="24"
                        round={true}
                    />

                    <div>
                        <p className="font-medium">{customer.fullName}</p>
                    </div>
                </div>
            );
        },
    },
    {
        id: "assignees",
        header: "Người phụ trách",
        cell: ({ row }) => {
            const assignees = row.original.assignees;
            if (assignees.length === 0) return "-";

            const maxDisplay = 3;
            const displayAssignees = assignees.slice(0, maxDisplay);
            const remainingCount = assignees.length - maxDisplay;

            return (
                <TooltipProvider>
                    <div className="flex items-center gap-2">
                        {assignees.length === 1 ? (
                            // Nếu chỉ có 1 người, hiển thị avatar + tên như cũ
                            <div className="flex items-center gap-2">
                                <Avatar
                                    name={
                                        assignees[0].profileName ||
                                        assignees[0].teamName
                                    }
                                    src={
                                        getAvatarUrl(assignees[0].avatar) ||
                                        undefined
                                    }
                                    size="24"
                                    round={true}
                                />
                                <span>
                                    {assignees[0].profileName ||
                                        assignees[0].teamName}
                                </span>
                            </div>
                        ) : (
                            // Nếu có nhiều hơn 1 người, chỉ hiển thị avatar với tooltip
                            <>
                                {displayAssignees.map((assignee) => (
                                    <Tooltip
                                        key={assignee.id}
                                        content={assignee.profileName}
                                    >
                                        <div className="cursor-pointer">
                                            <Avatar
                                                name={assignee.profileName}
                                                src={
                                                    getAvatarUrl(
                                                        assignee.avatar
                                                    ) || undefined
                                                }
                                                size="24"
                                                round={true}
                                            />
                                        </div>
                                    </Tooltip>
                                ))}
                                {remainingCount > 0 && (
                                    <Tooltip
                                        content={assignees
                                            .slice(maxDisplay)
                                            .map((a) => a.profileName)
                                            .join(", ")}
                                    >
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-medium text-gray-700 cursor-pointer">
                                            +{remainingCount}
                                        </div>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </div>
                </TooltipProvider>
            );
        },
    },
    {
        id: "email",
        header: "Email",
        cell: ({ row }) => (row.original as any).email || "-",
    },
    {
        id: "phone",
        header: "Số điện thoại",
        cell: ({ row }) => (row.original as any).phone || "-",
    },
    // {
    //     id: "status",
    //     header: "Trạng thái",
    //     cell: ({ row }) => {
    //         const status = row.original.status;
    //         const getStatusBadgeVariant = (status: string) => {
    //             switch (status.toLowerCase()) {
    //                 case "active":
    //                     return "default";
    //                 case "inactive":
    //                     return "secondary";
    //                 case "pending":
    //                     return "outline";
    //                 default:
    //                     return "secondary";
    //             }
    //         };

    //         return (
    //             <Badge variant={getStatusBadgeVariant(status)}>
    //                 {status}
    //             </Badge>
    //         );
    //     },
    // },
    // {
    //     id: "source",
    //     header: "Nguồn",
    //     cell: ({ row }) => row.original.source || "-",
    // },
    {
        id: "lastInteraction",
        header: "Tương tác cuối",
        cell: ({ row }) => {
            const lastInteraction = row.original.lastModifiedDate;
            return formatRelativeTime(lastInteraction);
        },
    },
    // {
    //     id: "actions",
    //     header: "",
    //     cell: ({ row }) => {
    //         const customer = row.original;

    //         return (
    //             <div className="text-right">
    //                 <DropdownMenu>
    //                     <DropdownMenuTrigger asChild>
    //                         <Button
    //                             variant="ghost"
    //                             size="sm"
    //                             className="h-8 w-8 p-0"
    //                         >
    //                             <span className="sr-only">Mở menu</span>
    //                             <MoreHorizontal className="h-4 w-4" />
    //                         </Button>
    //                     </DropdownMenuTrigger>
    //                     <DropdownMenuContent align="end">
    //                         <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
    //                         <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
    //                         <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
    //                         <DropdownMenuSeparator />
    //                         <DropdownMenuItem className="text-destructive">
    //                             Xóa
    //                         </DropdownMenuItem>
    //                     </DropdownMenuContent>
    //                 </DropdownMenu>
    //             </div>
    //         );
    //     },
    // },
];

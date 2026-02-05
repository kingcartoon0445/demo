import { ColumnDef } from "@tanstack/react-table";
import { PriceHistory } from "@/lib/interface";
import { useUserProfileDetail } from "@/hooks/useUser";
export const columns: ColumnDef<PriceHistory>[] = [
    {
        accessorKey: "fieldChanged",
        header: "Trường thay đổi",
        cell: ({ row }) => {
            if (row.original.fieldChanged.toLowerCase() === "price") {
                return "Giá";
            } else if (row.original.fieldChanged.toLowerCase() === "tax") {
                return "Thuế";
            }
            return row.original.fieldChanged;
        },
    },
    {
        accessorKey: "oldValue",
        header: "Giá trị cũ",
        cell: ({ row }) =>
            Intl.NumberFormat().format(Number(row.original.oldValue)),
    },
    {
        accessorKey: "newValue",
        header: "Giá trị mới",
        cell: ({ row }) =>
            Intl.NumberFormat().format(Number(row.original.newValue)),
    },
    {
        accessorKey: "changedBy",
        header: "Người thay đổi",
        cell: ({ row }) => {
            const orgId = localStorage.getItem("currentOrgId");
            if (!orgId) return "";
            const { data: user } = useUserProfileDetail(
                orgId,
                row.original.changedBy
            );
            return user?.content?.fullName || "";
        },
    },
    {
        accessorKey: "changedAt",
        header: "Thời gian",
        cell: ({ row }) => new Date(row.original.changedAt).toLocaleString(),
    },
];

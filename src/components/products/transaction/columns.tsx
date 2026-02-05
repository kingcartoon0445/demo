import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "@/lib/interface";
import { useDealDetailApi, useLeadDetailApi } from "@/hooks/useCustomerDetail";
export const columns: (t: any) => ColumnDef<Transaction>[] = (t) => [
    {
        accessorKey: "customerName",
        header: t("common.customer"),
        cell: ({ row }) => {
            const customer = row.original.customerName;
            return customer || "";
        },
    },
    {
        accessorKey: "unitPrice",
        header: t("common.price"),
        cell: ({ row }) =>
            Intl.NumberFormat().format(Number(row.original.unitPrice)),
    },
    {
        accessorKey: "quantity",
        header: t("common.quantity"),
        cell: ({ row }) =>
            Intl.NumberFormat().format(Number(row.original.quantity)),
    },
    {
        accessorKey: "totalAmount",
        header: t("common.totalAmount"),
        cell: ({ row }) => {
            const orgId = localStorage.getItem("currentOrgId");
            if (!orgId) return "";
            return Intl.NumberFormat().format(Number(row.original.totalAmount));
        },
    },
    {
        accessorKey: "status",
        header: t("common.status"),
        cell: ({ row }) => {
            return row.original.status === 1
                ? t("common.open")
                : row.original.status === 2
                ? t("common.won")
                : t("common.lost");
        },
    },
    {
        accessorKey: "createdDate",
        header: t("common.time"),
        cell: ({ row }) => new Date(row.original.createdDate).toLocaleString(),
    },
];

"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    RowSelectionState,
    OnChangeFn,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
    isLoading?: boolean;
    rowSelection?: RowSelectionState;
    setRowSelection?: OnChangeFn<RowSelectionState>;
    enableRowSelection?: boolean;
    customHeaderContent?: React.ReactNode;
    showCustomHeader?: boolean;
    selectedRowId?: string;
    emptyMessage?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onRowClick,
    isLoading = false,
    rowSelection,
    setRowSelection,
    enableRowSelection = false,
    customHeaderContent,
    showCustomHeader = false,
    selectedRowId,
    emptyMessage = "No results.",
}: DataTableProps<TData, TValue>) {
    const [internalRowSelection, setInternalRowSelection] =
        useState<RowSelectionState>({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: enableRowSelection,
        onRowSelectionChange: setRowSelection || setInternalRowSelection,
        state: {
            rowSelection: rowSelection || internalRowSelection,
        },
        getRowId: (row: any) => row.id || String(row.id),
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {showCustomHeader ? (
                                // Khi hiển thị custom header, render một cell duy nhất span toàn bộ
                                <TableHead
                                    colSpan={headerGroup.headers.length}
                                    className="p-0 bg-[#F9F9F9]"
                                >
                                    {customHeaderContent}
                                </TableHead>
                            ) : (
                                // Khi không có custom header, render các cell bình thường
                                headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="bg-[#F9F9F9]"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })
                            )}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <div className="flex items-center justify-center py-10 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    <span>Đang tải...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : null}
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() =>
                                    onRowClick && onRowClick(row.original)
                                }
                                className={
                                    onRowClick
                                        ? "cursor-pointer hover:bg-muted"
                                        : ""
                                }
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : !isLoading ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import type { WithId } from "@/interfaces/post";

interface SimpleTableProps<T extends WithId> {
    data: T[];
    columns: { key: keyof T; label: string }[];
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    isLoading?: boolean;
}

export function SimpleTable<T extends WithId>({
    data,
    columns,
    onEdit,
    onDelete,
    isLoading,
}: SimpleTableProps<T>) {
    return (
        <div className="overflow-auto rounded-lg border bg-white">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                        {columns.map((c) => (
                            <th key={String(c.key)} className="px-3 py-2">
                                {c.label}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th className="px-3 py-2">Thao tác</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td
                                className="px-3 py-3 text-center text-muted-foreground"
                                colSpan={
                                    columns.length +
                                    (onEdit || onDelete ? 1 : 0)
                                }
                            >
                                Đang tải...
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                className="px-3 py-3 text-center text-muted-foreground"
                                colSpan={
                                    columns.length +
                                    (onEdit || onDelete ? 1 : 0)
                                }
                            >
                                Chưa có dữ liệu
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr key={row.id ?? idx} className="border-t">
                                {columns.map((c) => (
                                    <td
                                        key={String(c.key)}
                                        className="px-3 py-2 align-top"
                                    >
                                        {String((row as any)[c.key] ?? "")}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="px-3 py-2 space-x-2">
                                        {onEdit && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(row)}
                                            >
                                                Sửa
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => onDelete(row)}
                                            >
                                                Xóa
                                            </Button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

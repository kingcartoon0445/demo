import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import type { WithId, PaginationResponse } from "@/interfaces/post";

const DEFAULT_PAGE_SIZE = 10;

type CrudConfig<T extends WithId> = {
    loadFn: (page: number, pageSize: number) => Promise<PaginationResponse<T>>;
    createFn?: (payload: Omit<T, "id">) => Promise<any>;
    updateFn?: (id: string | number, payload: Omit<T, "id">) => Promise<any>;
    deleteFn?: (id: string | number) => Promise<any>;
    parseList: (response: PaginationResponse<T>) => T[];
    parseItem?: (response: any) => T;
};

export function useCrud<T extends WithId>(
    config: CrudConfig<T>,
    pageSize = DEFAULT_PAGE_SIZE
) {
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [editing, setEditing] = useState<T | null>(null);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await config.loadFn(page, pageSize);
            const list = config.parseList(res);
            setItems(list);
            const total =
                res?.pagination?.TotalRecords ??
                res?.total ??
                res?.totalRecords ??
                list.length;
            setTotalRecords(Number(total) || list.length);
        } catch (e: any) {
            toast.error(e?.message || "Không tải được dữ liệu");
        } finally {
            setIsLoading(false);
        }
    };

    const save = async (payload: Omit<T, "id"> & Partial<WithId>) => {
        const isUpdate = Boolean(payload.id);
        try {
            if (isUpdate && config.updateFn) {
                await config.updateFn(payload.id!, payload);
            } else if (!isUpdate && config.createFn) {
                await config.createFn(payload);
            } else {
                throw new Error(
                    "Create hoặc Update function chưa được định nghĩa"
                );
            }
            toast.success(isUpdate ? "Đã cập nhật" : "Đã tạo");
            setEditing(null);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Có lỗi xảy ra");
        }
    };

    const remove = async (id: string | number) => {
        if (!config.deleteFn) {
            toast.error("Delete function chưa được định nghĩa");
            return;
        }
        try {
            await config.deleteFn(id);
            toast.success("Đã xóa");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Có lỗi xảy ra");
        }
    };

    return {
        items,
        isLoading,
        page,
        setPage,
        totalRecords,
        editing,
        setEditing,
        load,
        save,
        remove,
    };
}

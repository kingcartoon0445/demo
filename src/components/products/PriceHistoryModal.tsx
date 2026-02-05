import { DataTable } from "@/components/ui/data-table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGetPriceHistory } from "@/hooks/useProduct";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { columns } from "./PriceHistoryColumns";

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
}

export default function PriceHistoryModal({
    isOpen,
    onClose,
    productId,
}: PriceHistoryModalProps) {
    const [page, setPage] = useState(0); // 0-based index
    const pageSize = 10;
    const orgId = localStorage.getItem("currentOrgId") || "";
    const { t } = useLanguage();
    const { data, isLoading } = useGetPriceHistory(orgId, productId, {
        page: page + 1,
        pageSize,
    });

    const rows = data?.data ?? [];
    const totalPages = data?.pagination?.totalPages ?? 1;

    const generatePagination = () => {
        if (!data) return [];

        const pages: number[] = [];
        const currentPage = page;

        // Always show first page
        pages.push(0);

        // Show pages around current page
        for (
            let i = Math.max(1, currentPage - 1);
            i <= Math.min(totalPages - 2, currentPage + 1);
            i++
        ) {
            pages.push(i);
        }

        // Always show last page if > 1 page
        if (totalPages > 1) {
            pages.push(totalPages - 1);
        }

        return [...new Set(pages)].sort((a, b) => a - b);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="min-w-[800px] max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Lịch sử thay đổi giá</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-2 text-gray-600">
                            {t("common.loading")}
                        </span>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        <DataTable columns={columns} data={rows} />

                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                setPage(Math.max(0, page - 1))
                                            }
                                            className={
                                                page === 0
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }
                                        />
                                    </PaginationItem>

                                    {generatePagination().map(
                                        (pageNumber, i, array) => {
                                            const isGap =
                                                i > 0 &&
                                                pageNumber > array[i - 1] + 1;

                                            return (
                                                <React.Fragment
                                                    key={pageNumber}
                                                >
                                                    {isGap && (
                                                        <PaginationItem
                                                            key={`ellipsis-${pageNumber}`}
                                                        >
                                                            <span className="flex h-9 w-9 items-center justify-center">
                                                                <PaginationEllipsis />
                                                            </span>
                                                        </PaginationItem>
                                                    )}

                                                    <PaginationItem>
                                                        <PaginationLink
                                                            onClick={() =>
                                                                setPage(
                                                                    pageNumber
                                                                )
                                                            }
                                                            isActive={
                                                                page ===
                                                                pageNumber
                                                            }
                                                        >
                                                            {pageNumber + 1}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                </React.Fragment>
                                            );
                                        }
                                    )}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() =>
                                                setPage(
                                                    Math.min(
                                                        totalPages - 1,
                                                        page + 1
                                                    )
                                                )
                                            }
                                            className={
                                                page >= totalPages - 1
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

import { DataTable } from "@/components/ui/data-table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGetTransactions } from "@/hooks/useProduct";
import { Tabs, TabsContent } from "@radix-ui/react-tabs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { columns } from "./columns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Transaction({ productId }: { productId: string }) {
    const { t } = useLanguage();
    const router = useRouter();
    const orgId = localStorage.getItem("currentOrgId");
    const [page, setPage] = useState(0); // 0-based index
    const pageSize = 10;
    const [tab, setTab] = useState("all");
    const { data: transactions, isLoading } = useGetTransactions(
        orgId || "",
        productId,
        {
            page: page + 1,
            pageSize,
            ...(tab === "open" && { status: 1 }),
            ...(tab === "won" && { status: 2 }),
            ...(tab === "lost" && { status: 3 }),
        }
    );

    const handleRowClick = (orderId: string, workspaceId: string) => {
        if (orgId && orderId && workspaceId) {
            // Navigate to deals page with cid parameter
            router.push(
                `/org/${orgId}/deals?wid=${workspaceId}&oid=${orderId}`
            );
        }
    };

    const generatePagination = () => {
        if (!transactions) return [];

        const totalPages = transactions.pagination.totalPages;
        const currentPage = page;
        const pages: number[] = [];

        // Always show first page
        pages.push(0);

        // Pages around current page
        for (
            let i = Math.max(1, currentPage - 1);
            i <= Math.min(totalPages - 2, currentPage + 1);
            i++
        ) {
            pages.push(i);
        }

        // Always show last page if more than one
        if (totalPages > 1) {
            pages.push(totalPages - 1);
        }

        return [...new Set(pages)].sort((a, b) => a - b);
    };

    return (
        <>
            <Tabs
                defaultValue="all"
                value={tab}
                onValueChange={setTab}
                className=" rounded-none "
            >
                <TabsList className="w-full border-b border-gray-200 p-0 bg-white">
                    <TabsTrigger
                        value="all"
                        className="w-full data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        {t("common.all")}
                    </TabsTrigger>
                    <TabsTrigger
                        value="open"
                        className="w-full data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        {t("common.open")}
                    </TabsTrigger>
                    <TabsTrigger
                        value="won"
                        className="w-full data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        {t("common.won")}
                    </TabsTrigger>
                    <TabsTrigger
                        value="lost"
                        className="w-full data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        {t("common.lost")}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <ScrollArea className="w-full overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-2 text-gray-600">
                                    {t("common.loading")}
                                </span>
                            </div>
                        ) : (
                            <DataTable
                                columns={columns(t)}
                                data={transactions?.data || []}
                                onRowClick={(row) =>
                                    handleRowClick(row.orderId, row.workspaceId)
                                }
                            />
                        )}
                    </ScrollArea>
                    {(transactions?.pagination?.totalPages ?? 0) > 1 && (
                        <div className="my-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                setPage((prev) =>
                                                    Math.max(0, prev - 1)
                                                )
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
                                                            key={`ellipsis-${i}`}
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
                                                setPage((prev) =>
                                                    Math.min(
                                                        (transactions
                                                            ?.pagination
                                                            .totalPages || 1) -
                                                            1,
                                                        prev + 1
                                                    )
                                                )
                                            }
                                            className={
                                                page >=
                                                (transactions?.pagination
                                                    .totalPages || 1) -
                                                    1
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="open">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="ml-2 text-gray-600">
                                {t("common.loading")}
                            </span>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns(t)}
                            data={transactions?.data || []}
                            onRowClick={(row) =>
                                handleRowClick(row.orderId, row.workspaceId)
                            }
                        />
                    )}

                    {(transactions?.pagination?.totalPages ?? 0) > 1 && (
                        <div className="my-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                setPage((prev) =>
                                                    Math.max(0, prev - 1)
                                                )
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
                                                            key={`ellipsis-${i}`}
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
                                                setPage((prev) =>
                                                    Math.min(
                                                        (transactions
                                                            ?.pagination
                                                            .totalPages || 1) -
                                                            1,
                                                        prev + 1
                                                    )
                                                )
                                            }
                                            className={
                                                page >=
                                                (transactions?.pagination
                                                    .totalPages || 1) -
                                                    1
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="won">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="ml-2 text-gray-600">
                                {t("common.loading")}
                            </span>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns(t)}
                            data={transactions?.data || []}
                            onRowClick={(row) =>
                                handleRowClick(row.orderId, row.workspaceId)
                            }
                        />
                    )}
                    {(transactions?.pagination?.totalPages ?? 0) > 1 && (
                        <div className="my-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                setPage((prev) =>
                                                    Math.max(0, prev - 1)
                                                )
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
                                                            key={`ellipsis-${i}`}
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
                                                setPage((prev) =>
                                                    Math.min(
                                                        (transactions
                                                            ?.pagination
                                                            .totalPages || 1) -
                                                            1,
                                                        prev + 1
                                                    )
                                                )
                                            }
                                            className={
                                                page >=
                                                (transactions?.pagination
                                                    .totalPages || 1) -
                                                    1
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="lost">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="ml-2 text-gray-600">
                                {t("common.loading")}
                            </span>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns(t)}
                            data={transactions?.data || []}
                            onRowClick={(row) =>
                                handleRowClick(row.orderId, row.workspaceId)
                            }
                        />
                    )}
                    {(transactions?.pagination?.totalPages ?? 0) > 1 && (
                        <div className="my-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                setPage((prev) =>
                                                    Math.max(0, prev - 1)
                                                )
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
                                                            key={`ellipsis-${i}`}
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
                                                setPage((prev) =>
                                                    Math.min(
                                                        (transactions
                                                            ?.pagination
                                                            .totalPages || 1) -
                                                            1,
                                                        prev + 1
                                                    )
                                                )
                                            }
                                            className={
                                                page >=
                                                (transactions?.pagination
                                                    .totalPages || 1) -
                                                    1
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </>
    );
}

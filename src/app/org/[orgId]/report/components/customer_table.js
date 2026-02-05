"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function CustomerTable({ selectedWorkspaces, date }) {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const params = useParams();

    useEffect(() => {
        setIsLoading(true);

        // Mô phỏng dữ liệu khách hàng rỗng
        const timer = setTimeout(() => {
            // Tạo dữ liệu mẫu trống cho bảng khách hàng
            const sampleData = Array.from({ length: 10 }, (_, i) => ({
                id: `customer-${i + 1}`,
                name: `Khách hàng ${i + 1}`,
                avatar: "",
                email: `customer${i + 1}@example.com`,
                phone: `0987654${i.toString().padStart(3, "0")}`,
                status:
                    i % 3 === 0 ? "new" : i % 3 === 1 ? "active" : "inactive",
                assignee: `Người phụ trách ${(i % 5) + 1}`,
                lastContact: new Date().toISOString(),
            }));

            setData(sampleData);
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [date, selectedWorkspaces, page, search, params.orgId]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "new":
                return (
                    <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                        Mới
                    </Badge>
                );
            case "active":
                return (
                    <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                    >
                        Đang hoạt động
                    </Badge>
                );
            case "inactive":
                return (
                    <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                        Không hoạt động
                    </Badge>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Danh sách khách hàng</h3>

                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Tìm kiếm khách hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-4 w-64"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="w-full h-[40px] rounded-md" />
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="w-full h-[40px] rounded-md"
                        />
                    ))}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Số điện thoại</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Người phụ trách</TableHead>
                                    <TableHead>Liên hệ gần nhất</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={customer.avatar}
                                                    />
                                                    <AvatarFallback>
                                                        {customer.name.charAt(
                                                            0,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{customer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.email}</TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                        <TableCell>
                                            {getStatusBadge(customer.status)}
                                        </TableCell>
                                        <TableCell>
                                            {customer.assignee}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(customer.lastContact)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                Chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink
                                        isActive={page === 1}
                                        onClick={() => setPage(1)}
                                    >
                                        1
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink
                                        isActive={page === 2}
                                        onClick={() => setPage(2)}
                                    >
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink
                                        isActive={page === 3}
                                        onClick={() => setPage(3)}
                                    >
                                        3
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage((p) => p + 1)}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </>
            )}
        </Card>
    );
}

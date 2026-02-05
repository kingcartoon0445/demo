import { Product } from "@/lib/interface";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { ArrowUpDown, Eye, ImageOff } from "lucide-react";
import { ArrowUp } from "lucide-react";
import { ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/customerDetailTypes";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpdateProductStatus } from "@/hooks/useProduct";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const createColumns = (
    sortBy: string | undefined,
    ascending: boolean,
    handleSort: (column: string) => void,
    router: any,
    orgId: string,
    t: any,
    columnLabels?: { [key: string]: string },
    columnOrder?: { [key: string]: number }
): ColumnDef<Product>[] => {
    // Define all possible columns
    const allColumns: ColumnDef<Product>[] = [
        {
            accessorKey: "images",
            header: columnLabels?.images || t("common.image"),
            cell: ({ row }) => {
                const images = row.getValue("images") as string[];

                if (!images || images.length === 0) {
                    return (
                        <div className="h-12 w-12 flex items-center justify-center text-xs text-gray-500 border rounded-md">
                            {/* <Image
                                src="/images/no-image-ic.png"
                                alt="No image"
                                className=""
                                width={48}
                                height={48}
                            /> */}
                            <ImageOff className="size-4" />
                        </div>
                    );
                }

                // Generate unique gallery ID for each product
                const galleryId = `product-gallery-${row.original.id}`;

                return (
                    <div
                        className="relative cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* First image - this is visible and clickable */}
                        <div className="h-12 w-12 relative rounded-md overflow-hidden z-10">
                            <a
                                href={images[0]}
                                data-fancybox={galleryId}
                                data-caption={`${row.original.name} - Hình 1`}
                            >
                                <Image
                                    src={images[0]}
                                    alt={row.original.name}
                                    fill
                                    className="object-cover"
                                />
                            </a>
                        </div>

                        {/* Second image (if exists) - shown stacked */}
                        {images.length > 1 && (
                            <div className="h-12 w-12 absolute top-2 left-2 rounded-md overflow-hidden border-2 border-white z-0">
                                <Image
                                    src={images[1]}
                                    alt={`${row.original.name} - image 2`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        {/* Counter for additional images */}
                        {images.length > 2 && (
                            <div className="absolute -bottom-1 right-[50%] bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center z-20">
                                +{images.length - 2}
                            </div>
                        )}

                        {/* Hidden links for the rest of the images */}
                        <div className="hidden">
                            {images.slice(1).map((img, index) => (
                                <a
                                    key={index + 1}
                                    href={img}
                                    data-fancybox={galleryId}
                                    data-caption={`${
                                        row.original.name
                                    } - Hình ${index + 2}`}
                                ></a>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "code",
            header: columnLabels?.code || t("common.productCode"),
            cell: ({ row }) => {
                const code = row.getValue("code") as string;
                const router = useRouter();
                return code ? (
                    <div
                        className="text-left cursor-pointer hover:underline"
                        onClick={() =>
                            router.push(
                                `/org/${orgId}/products/${row.original.id}`
                            )
                        }
                    >
                        {code}
                    </div>
                ) : (
                    <div className="text-left">-</div>
                );
            },
        },
        {
            accessorKey: "name",
            header: () => (
                <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("name")}
                >
                    {columnLabels?.name || t("common.productName")}
                    {sortBy === "name" ? (
                        ascending ? (
                            <ArrowUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )
                    ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                </div>
            ),
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                const router = useRouter();
                return (
                    <div
                        className="text-left cursor-pointer hover:underline"
                        onClick={() =>
                            router.push(
                                `/org/${orgId}/products/${row.original.id}`
                            )
                        }
                    >
                        {name}
                    </div>
                );
            },
        },
        {
            accessorKey: "categories",
            header: columnLabels?.categories || t("common.category"),
            cell: ({ row }) => {
                const categories = row.getValue("categories") as {
                    id: string;
                    name: string;
                }[];

                if (!categories || categories.length === 0) {
                    return "-";
                }

                const maxToShow = 3;
                const categoryNames = categories
                    .slice(0, maxToShow)
                    .map((category) => category.name);

                const isTruncated = categories.length > maxToShow;

                return isTruncated
                    ? `${categoryNames.join(", ")},...`
                    : categoryNames.join(", ");
            },
        },
        {
            accessorKey: "description",
            header: columnLabels?.description || t("common.description"),
            cell: ({ row }) => {
                const description = row.getValue("description") as string;

                if (!description) {
                    return "-";
                }

                return description.length > 30
                    ? description.slice(0, 30) + "..."
                    : description;
            },
        },
        {
            accessorKey: "price",
            header: () => (
                <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("price")}
                >
                    {columnLabels?.price || t("common.price")}
                    {sortBy === "price" ? (
                        ascending ? (
                            <ArrowUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )
                    ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                </div>
            ),
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("price"));
                const formattedPrice = formatCurrency(price);
                return <div className="text-right">{formattedPrice}</div>;
            },
        },
        {
            accessorKey: "status",
            header: columnLabels?.status || t("common.activity"),
            cell: ({ row }) => {
                const initialStatus = row.getValue("status") as number;
                const [isActive, setIsActive] = useState(initialStatus === 1);

                const updateProductStatusMutation =
                    useUpdateProductStatus(orgId);

                const handleStatusChange = (checked: boolean) => {
                    setIsActive(checked); // 1️⃣ Cập nhật UI ngay lập tức

                    updateProductStatusMutation.mutate(
                        {
                            id: row.original.id,
                            status: checked ? 1 : 2,
                        },
                        {
                            // 2️⃣ Nếu lỗi, rollback lại UI
                            onError: () => {
                                setIsActive(!checked);
                            },
                        }
                    );
                };

                return (
                    <Switch
                        checked={isActive}
                        onCheckedChange={handleStatusChange}
                    />
                );
            },
        },
        {
            accessorKey: "tax",
            header: () => (
                <div className="flex items-center cursor-pointer">
                    {columnLabels?.tax || t("common.tax")} (%)
                </div>
            ),
            cell: ({ row }) => {
                const tax = row.getValue("tax") as number;

                if (!tax) {
                    return "-";
                }

                return tax + "%";
            },
        },
        {
            accessorKey: "createdDate",
            header: () => (
                <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("created_date")}
                >
                    {columnLabels?.createdDate || t("common.createdDate")}
                    {sortBy === "created_date" ? (
                        ascending ? (
                            <ArrowUp className="ml-1 h-4 w-4" />
                        ) : (
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )
                    ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                </div>
            ),
            cell: ({ row }) => {
                const createdDate = row.getValue("createdDate") as string;
                return formatDate(createdDate);
            },
        },
        {
            accessorKey: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const product = row.original;
                const router = useRouter();
                return (
                    <div className="flex justify-center items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                router.push(
                                    `/org/${orgId}/products/${product.id}`
                                )
                            }
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    // If columnOrder is provided, sort columns according to the order
    if (columnOrder) {
        return allColumns.sort((a, b) => {
            const keyA = (a as any).accessorKey as string;
            const keyB = (b as any).accessorKey as string;

            // Actions column always at the end
            if (keyA === "actions") return 1;
            if (keyB === "actions") return -1;

            const orderA = columnOrder[keyA] ?? 999;
            const orderB = columnOrder[keyB] ?? 999;

            return orderA - orderB;
        });
    }

    return allColumns;
};

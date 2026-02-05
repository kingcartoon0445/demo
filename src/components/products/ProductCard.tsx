"use client";

import { Product } from "@/lib/interface";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Eye, ImageOff, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/Glass";

interface ProductCardProps {
    product: Product;
    orgId: string;
    onClick?: (product: Product) => void;
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
}

export const ProductCard = ({
    product,
    orgId,
    onClick,
    onEdit,
    onDelete,
}: ProductCardProps) => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick(product);
        } else {
            router.push(`/org/${orgId}/products/${product.id}`);
        }
    };

    const getStatusBadge = () => {
        const isActive = product.status === 1;
        return (
            <div
                className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    isActive
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                }`}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {isActive ? "MỞ BÁN" : "ĐÃ BÁN"}
            </div>
        );
    };

    const formatPrice = (price: number) => {
        if (price >= 1_000_000_000) {
            return `${(price / 1_000_000_000).toFixed(1)} Tỷ`;
        } else if (price >= 1_000_000) {
            return `${(price / 1_000_000).toFixed(0)} Tr`;
        }
        return formatCurrency(price);
    };

    const getProductImage = () => {
        if (product.images && product.images.length > 0) {
            return product.images[0];
        }
        if (product.image) {
            return product.image;
        }
        return null;
    };

    const getCategoryName = () => {
        if (product.categories && product.categories.length > 0) {
            return product.categories[0].name;
        }
        if (product.category) {
            return product.category.name;
        }
        return null;
    };

    const image = getProductImage();

    return (
        <div
            className="group h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <Glass
                className="h-full flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                intensity="high"
            >
                {/* Image Container - Fixed aspect ratio */}
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden shrink-0">
                    {image ? (
                        <Image
                            src={image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ImageOff className="w-12 h-12 text-gray-400" />
                        </div>
                    )}

                    {/* Status Badge */}
                    {getStatusBadge()}

                    {/* Price Badge */}
                    <div className="absolute bottom-3 left-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {formatPrice(product.price)}
                    </div>

                    {/* More Actions Button - Visible on Hover */}
                    {/* Delete Action Button - Visible on Hover */}
                    <div
                        className={`absolute top-3 right-3 z-10 transition-opacity duration-200 ${
                            isHovered ? "opacity-100" : "opacity-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-transparent text-red-500 hover:text-red-700 hover:scale-110 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* View Details Eye Icon - Visible on Hover */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-opacity duration-300 ${
                            isHovered ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 hover:bg-transparent text-white hover:scale-110 transition-transform"
                        >
                            <Eye className="h-8 w-8" />
                        </Button>
                    </div>
                </div>

                {/* Product Info - Fixed height section */}
                <div className="p-3 flex-1 flex flex-col min-h-[88px]">
                    {/* Code and Category */}
                    <div className="flex items-center gap-2 flex-wrap h-5">
                        {product.code && (
                            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-medium">
                                #{product.code}
                            </span>
                        )}
                        {getCategoryName() && (
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {getCategoryName()}
                            </span>
                        )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mt-2">
                        {product.name}
                    </h3>

                    {/* Description or Attributes */}
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1 flex-1">
                        {product.description || "\u00A0"}
                    </p>
                </div>
            </Glass>

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa sản phẩm
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa sản phẩm "{product.name}"
                            không? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteDialogOpen(false);
                                onDelete?.(product);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

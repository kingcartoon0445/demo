"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/lib/interface";
import { Minus, Plus } from "lucide-react";
import ProductMultiSelector from "../componentsWithHook/ProductMultiSelector";
import { ProductWithQuantity } from "./DealDetailPanel";

interface ProductEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    orgId: string;
    selectedProducts: string[];
    onProductsChange: (productIds: string[]) => void;
    productsWithQuantity: ProductWithQuantity[];
    onQuantityUpdate: (productId: string, change: number) => void;
    products: Product[];
    isLoading?: boolean;
}

export default function ProductEditDialog({
    isOpen,
    onClose,
    onSave,
    orgId,
    selectedProducts,
    onProductsChange,
    productsWithQuantity,
    onQuantityUpdate,
    products,
    isLoading = false,
}: ProductEditDialogProps) {
    // Calculate total price
    const totalPrice = productsWithQuantity.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        const price = product?.price || 0;
        const quantity = item.quantity || 1;
        return sum + price * quantity;
    }, 0);
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Product Multi Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Chọn sản phẩm
                        </label>
                        <ProductMultiSelector
                            orgId={orgId}
                            selectedProducts={selectedProducts}
                            setSelectedProducts={onProductsChange}
                        />
                    </div>

                    {/* Product Quantity Management */}
                    {productsWithQuantity.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium">
                                Số lượng sản phẩm
                            </h4>
                            {productsWithQuantity.map((item) => {
                                const productInfo = products.find(
                                    (p) => p.id === item.productId
                                );
                                return (
                                    <div
                                        key={item.productId}
                                        className="flex items-center justify-between border p-3 rounded-md"
                                    >
                                        <span className="text-sm font-medium">
                                            {item.name ||
                                                productInfo?.name ||
                                                "Sản phẩm"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    onQuantityUpdate(
                                                        item.productId,
                                                        -1
                                                    )
                                                }
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-12 text-center font-medium">
                                                {item.quantity || 1}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    onQuantityUpdate(
                                                        item.productId,
                                                        1
                                                    )
                                                }
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Total Price Display */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                        Tổng cộng:
                                    </span>
                                    <span className="font-bold text-lg">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(totalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button onClick={onSave} disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>
                                Đang lưu...
                            </span>
                        ) : (
                            "Lưu thay đổi"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

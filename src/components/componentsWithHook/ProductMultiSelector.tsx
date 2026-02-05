import { useGetProducts, useCreateMutipleProducts } from "@/hooks/useProduct";
import { Product } from "@/lib/interface";
import { useState } from "react";
import { MultiSelect } from "../ui/multi-select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";
import { useUserDetail } from "@/hooks/useUser";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewProductFormData {
    name: string;
    price: string;
    quantity: string;
    tax: string;
}

interface ProductResponse {
    success: boolean;
    message: string | null;
    data: Product[];
    pagination: any | null;
}

export default function ProductMultiSelector({
    orgId,
    selectedProducts,
    setSelectedProducts,
}: {
    orgId: string;
    selectedProducts: string[];
    setSelectedProducts: (products: string[]) => void;
}) {
    const { t } = useLanguage();
    const { data: productsResponse, isLoading } = useGetProducts(
        orgId,
        {
            isManage: false,
        },
        true
    );
    const createProductMutation = useCreateMutipleProducts(orgId);
    const [searchValue, setSearchValue] = useState("");
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [formData, setFormData] = useState<NewProductFormData>({
        name: "",
        price: "",
        quantity: "",
        tax: "",
    });
    const { data: currentUser } = useUserDetail();
    const products = productsResponse?.data || [];
    const options = products?.map((product: Product) => ({
        label: product.name,
        value: product.id,
        price: product.price,
    }));

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    const handleAddProduct = () => {
        setFormData((prev) => ({ ...prev, name: searchValue }));
        setIsAddProductDialogOpen(true);
    };

    const handleCreateProduct = () => {
        // Create product payload with only name and price
        const productData = {
            products: [
                {
                    name: formData.name,
                    price: formData.price ? parseFloat(formData.price) : 0.01,
                    description: "string",
                    status: 1,
                    image: "string",
                    tax: formData.tax ? parseFloat(formData.tax) : 0,
                    assigneeIds: [currentUser?.id],
                },
            ],
        };

        // Call the API to create the product
        createProductMutation.mutate(productData, {
            onSuccess: (response) => {
                // Close the dialog and reset form
                setIsAddProductDialogOpen(false);
                setSearchValue("");
                setFormData({
                    name: "",
                    price: "",
                    quantity: "",
                    tax: "",
                });

                // If the API returns the new product ID, add it to selected products
                const typedResponse = response as ProductResponse;
                if (typedResponse?.data && typedResponse.data.length > 0) {
                    const newProductId = typedResponse.data[0].id;
                    if (newProductId) {
                        setSelectedProducts([
                            ...selectedProducts,
                            newProductId,
                        ]);
                    }
                }
            },
        });
    };

    // Check if search value doesn't match any product
    const shouldShowAddOption =
        searchValue.trim() &&
        searchValue.trim().length > 0 &&
        !options.some((option) =>
            option.label.toLowerCase().includes(searchValue.toLowerCase())
        );

    // Custom render function for no results
    const renderNoResults = () => {
        // Only show when there's a search value and no matches
        if (!searchValue.trim()) {
            return null;
        }

        if (shouldShowAddOption) {
            return (
                <div
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
                    onClick={handleAddProduct}
                >
                    <PlusCircle className="h-4 w-4 text-primary" />
                    <span>
                        {t("common.addProduct")} "{searchValue}"
                    </span>
                </div>
            );
        }

        return (
            <div className="p-2 text-sm text-gray-500">
                {t("common.noProductFound")}
            </div>
        );
    };

    return (
        <>
            <MultiSelect
                options={options}
                selected={selectedProducts}
                onChange={(value) => setSelectedProducts(value)}
                placeholder={t("common.selectProduct")}
                className="w-full"
                textClassName="text-sm"
                buttonClassName="text-sm"
                maxHeight={300}
                hideBadges
                onSearchChange={handleSearchChange}
                renderNoResults={renderNoResults}
            />

            <Dialog
                open={isAddProductDialogOpen}
                onOpenChange={(open) => {
                    setIsAddProductDialogOpen(open);
                    if (!open) {
                        // Reset form when dialog closes
                        setFormData({
                            name: "",
                            price: "",
                            quantity: "",
                            tax: "",
                        });
                    }
                }}
            >
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{t("common.addProduct")}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Product Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("common.productName")}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                placeholder={t("common.enterProductName")}
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("common.price")}
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                placeholder={t("common.enterPrice")}
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        price: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("common.quantity")}
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                placeholder={t("common.enterQuantity")}
                                value={formData.quantity}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        quantity: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        {/* Tax */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("common.tax")}
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                placeholder={t("common.enterTax")}
                                value={formData.tax}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        tax: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddProductDialogOpen(false);
                                setFormData({
                                    name: "",
                                    price: "",
                                    quantity: "",
                                    tax: "",
                                });
                            }}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={handleCreateProduct}
                            disabled={createProductMutation.isPending}
                        >
                            {createProductMutation.isPending
                                ? t("common.processing")
                                : t("common.confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

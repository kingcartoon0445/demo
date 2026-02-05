import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateUpdateProduct, Product } from "@/lib/interface";
import { ChevronDown, ChevronUp, Pencil, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DetailsSectionProps {
    product: Product;
    isExpanded: boolean;
    setIsExpanded: (value: boolean) => void;
    onSave: (data: CreateUpdateProduct) => void;
    categories: { id: string; name: string }[];
    isCategoryLoading?: boolean;
}

export default function DetailsSection({
    product,
    isExpanded,
    setIsExpanded,
    onSave,
    categories,
    isCategoryLoading = false,
}: DetailsSectionProps) {
    const { t } = useLanguage();
    const [isEditMode, setIsEditMode] = useState(false);

    // Form states
    const [productName, setProductName] = useState("");
    const [productCode, setProductCode] = useState("");
    const [productPrice, setProductPrice] = useState(0);
    const [productTax, setProductTax] = useState(0);
    const [productCategory, setProductCategory] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const categoryOptions = useMemo(() => {
        if (!categories) return [];
        const hasCurrentCategory =
            product.category?.id &&
            !categories.some((cat) => cat.id === product.category?.id);
        if (hasCurrentCategory && product.category) {
            return [product.category, ...categories];
        }
        return categories;
    }, [categories, product.category]);
    useEffect(() => {
        if (product) {
            setProductName(product.name || "");
            setProductCode(product.code || "");
            setProductPrice(product.price || 0);
            setProductTax(product.tax || 0);
            setProductCategory(product.category?.id || "");
            setProductDescription(product.description || "");
        }
    }, [product]);

    const handleSave = () => {
        onSave({
            name: productName,
            code: productCode,
            price: productPrice,
            tax: productTax,
            categoryIds: [productCategory],
            description: productDescription,
            status: product.status,
        });

        setIsEditMode(false);
    };

    const handleCancel = () => {
        // Reset form values to original product data
        setProductName(product.name || "");
        setProductCode(product.code || "");
        setProductPrice(product.price || 0);
        setProductTax(product.tax || 0);
        setProductCategory(product.category?.id || "");
        setProductDescription(product.description || "");

        setIsEditMode(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between w-full p-4">
                <button
                    className="flex items-center text-left font-medium flex-grow"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span>{t("common.details")}</span>
                    {isExpanded ? (
                        <ChevronDown className="h-5 w-5 ml-2" />
                    ) : (
                        <ChevronUp className="h-5 w-5 ml-2" />
                    )}
                </button>
                {!isEditMode ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setIsEditMode(true)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            {isExpanded && (
                <div className="p-4 pt-0 space-y-4">
                    {!isEditMode ? (
                        // View mode
                        <>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">
                                    {t("common.name")}
                                </span>
                                <span>{product.name || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">
                                    {t("common.productCode")}
                                </span>
                                <span>{product.code || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">
                                    {t("common.tax")} %
                                </span>
                                <span>{product.tax || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">
                                    {t("common.category")}
                                </span>
                                <span>{product.category?.name || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">
                                    {t("common.description")}
                                </span>
                                <span>{product.description || "-"}</span>
                            </div>
                        </>
                    ) : (
                        // Edit mode
                        <>
                            <div>
                                <Label
                                    htmlFor="productCode"
                                    className="text-xs"
                                >
                                    {t("common.productCode")}
                                </Label>
                                <Input
                                    id="productCode"
                                    value={productCode}
                                    onChange={(e) =>
                                        setProductCode(e.target.value)
                                    }
                                    className="mt-1 h-8 text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="tax" className="text-xs">
                                    {t("common.tax")} %
                                </Label>
                                <Input
                                    id="tax"
                                    type="number"
                                    value={productTax}
                                    onChange={(e) =>
                                        setProductTax(Number(e.target.value))
                                    }
                                    className="mt-1 h-8 text-sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="category" className="text-xs">
                                    {t("common.category")}
                                </Label>
                                <Select
                                    value={productCategory}
                                    onValueChange={setProductCategory}
                                >
                                    <SelectTrigger className="mt-1 h-8 text-sm w-full">
                                        <SelectValue
                                            placeholder={t(
                                                "common.selectCategory"
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isCategoryLoading ? (
                                            <SelectItem value="" disabled>
                                                {t("common.loading")}
                                            </SelectItem>
                                        ) : categoryOptions.length > 0 ? (
                                            categoryOptions.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="" disabled>
                                                {t("common.noCategory") ||
                                                    "Không có danh mục"}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="description"
                                    className="text-xs"
                                >
                                    {t("common.description")}
                                </Label>
                                <Textarea
                                    id="description"
                                    value={productDescription}
                                    onChange={(e) =>
                                        setProductDescription(e.target.value)
                                    }
                                    className="mt-1 text-sm min-h-[60px]"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

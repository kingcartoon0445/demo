import { useCreateProduct } from "@/hooks/useProduct";
import { Product } from "@/lib/interface";
import { useEffect, useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import CategoryMultiSelecor from "../componentsWithHook/CategoryMultiSelecor";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useUserDetail } from "@/hooks/useUser";

interface CreateOrUpdateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product;
    orgId: string;
}

// Form data interface
interface ProductFormData {
    code: string;
    name: string;
    price: number;
    description: string;
    status: number;
    tax: number;
    categoryIds: string[];
}

export default function CreateOrUpdateProductModal({
    isOpen,
    onClose,
    product,
    orgId,
}: CreateOrUpdateProductModalProps) {
    const isEditMode = !!product;
    const createProductMutation = useCreateProduct(orgId);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const { data: currentUser } = useUserDetail();
    // React Hook Form setup
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        defaultValues: {
            code: "",
            name: "",
            price: 0,
            description: "",
            status: 1,
            tax: 0,
            categoryIds: [],
        },
    });

    // Update form data when product data changes
    useEffect(() => {
        if (product) {
            reset({
                code: product.code || "",
                name: product.name || "",
                price: product.price || 0,
                description: product.description || "",
                status:
                    typeof product.status === "boolean"
                        ? product.status
                            ? 1
                            : 0
                        : product.status || 1,
                tax: product.tax || 0,
                categoryIds: product.category?.id ? [product.category.id] : [],
            });

            // Initialize current price for tooltip
            setCurrentPrice(product.price || 0);
        } else {
            // Reset form when creating new product
            reset({
                code: "",
                name: "",
                price: 0,
                description: "",
                status: 1,
                tax: 0,
                categoryIds: [],
            });

            // Reset current price
            setCurrentPrice(0);
        }
    }, [product, reset, isOpen]);

    const handleCategoryChange = (selectedCategories: string[]) => {
        // Since we're using a multi-selector but only need one category for now
        const categoryIds =
            selectedCategories.length > 0 ? selectedCategories : [];
        setValue("categoryIds", categoryIds as string[]);
    };

    const handlePriceChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        onChange: (value: number) => void
    ) => {
        const value = parseFloat(e.target.value) || 0;
        setCurrentPrice(value);
        onChange(value);
        // Update tooltip position
        updateTooltipPosition();
    };

    const handlePriceFocus = () => {
        setTooltipVisible(true);
        updateTooltipPosition();
    };

    const handlePriceBlur = () => {
        setTooltipVisible(false);
    };

    const updateTooltipPosition = () => {
        if (priceInputRef.current) {
            const rect = priceInputRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: rect.right + 10,
                y: rect.top + rect.height / 2,
            });
        }
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            const body = {
                code: data.code,
                name: data.name,
                price: data.price,
                description: data.description,
                status: 1,
                tax: data.tax,
                categoryIds: data.categoryIds,
                assigneeIds: [currentUser?.id],
            };

            // Create new product
            await createProductMutation.mutateAsync(body);

            // Close the dialog
            onClose();
        } catch (error) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} product:`,
                error
            );
            toast.error(
                `Failed to ${isEditMode ? "update" : "create"} product`
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode
                            ? "Chỉnh sửa sản phẩm"
                            : "Thêm sản phẩm mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Cập nhật thông tin sản phẩm. Nhấn Lưu khi hoàn tất."
                            : "Nhập thông tin sản phẩm mới. Nhấn Thêm khi hoàn tất."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Mã sản phẩm</Label>
                                <Controller
                                    name="code"
                                    control={control}
                                    render={({ field }) => (
                                        <Input id="code" {...field} />
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên sản phẩm</Label>
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{
                                        required: "Tên sản phẩm là bắt buộc",
                                    }}
                                    render={({ field }) => (
                                        <Input id="name" {...field} required />
                                    )}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <Label htmlFor="price">Giá</Label>
                                <Controller
                                    name="price"
                                    control={control}
                                    rules={{
                                        required: "Giá sản phẩm là bắt buộc",
                                    }}
                                    render={({ field }) => (
                                        <>
                                            <div className="flex items-center border rounded px-2">
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    {...field}
                                                    ref={priceInputRef}
                                                    onFocus={handlePriceFocus}
                                                    onBlur={handlePriceBlur}
                                                    onChange={(e) =>
                                                        handlePriceChange(
                                                            e,
                                                            field.onChange
                                                        )
                                                    }
                                                    required
                                                    className="flex-1 border-none focus:ring-0 focus:outline-none shadow-none"
                                                    style={{
                                                        boxShadow: "none",
                                                    }}
                                                />
                                                <span className="ml-2 pl-2 border-l text-gray-500 select-none">
                                                    VND
                                                </span>
                                            </div>
                                            {tooltipVisible &&
                                                currentPrice > 0 && (
                                                    <div
                                                        className="absolute bg-white text-black border border-gray-200 px-2 py-1 rounded text-xs z-50"
                                                        style={{
                                                            left: "0",
                                                            top: "calc(100% + 5px)",
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            currentPrice
                                                        )}
                                                    </div>
                                                )}
                                        </>
                                    )}
                                />
                                {errors.price && (
                                    <p className="text-sm text-red-500">
                                        {errors.price.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax">Thuế %</Label>
                                <Controller
                                    name="tax"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="tax"
                                            type="number"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Danh mục</Label>
                            <Controller
                                name="categoryIds"
                                control={control}
                                render={({ field }) => (
                                    <CategoryMultiSelecor
                                        orgId={orgId}
                                        selected={field.value || []}
                                        onChange={handleCategoryChange}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        id="description"
                                        {...field}
                                        rows={4}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? "Đang xử lý..."
                                : isEditMode
                                ? "Lưu thay đổi"
                                : "Thêm sản phẩm"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

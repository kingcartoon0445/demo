import {
    useCreateCategory,
    useGetCategory,
    useUpdateCategory,
} from "@/hooks/useProduct";
import { Category } from "@/lib/interface";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

interface CategoryManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
}

export default function CategoryManagementModal({
    isOpen,
    onClose,
    orgId,
}: CategoryManagementModalProps) {
    const { data, isLoading } = useGetCategory(orgId);
    const createCategoryMutation = useCreateCategory(orgId);
    const updateCategoryMutation = useUpdateCategory(orgId);

    const [searchTerm, setSearchTerm] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<{
        id: string;
        name: string;
        status: number;
    } | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const categories = data?.data || [];

    // Filter categories based on search term
    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleChangeSearchTerm = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setNewCategoryName(e.target.value);
    };

    const handleCreateCategory = async () => {
        if (newCategoryName === "") {
            toast.error("Tên danh mục không được để trống");
            return;
        }

        try {
            await createCategoryMutation.mutateAsync({
                name: newCategoryName.trim(),
                status: 1, // Active by default
            });
            setNewCategoryName("");
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;

        try {
            await updateCategoryMutation.mutateAsync({
                id: editingCategory.id,
                body: {
                    name: editingCategory.name,
                    status: editingCategory.status,
                },
            });
            setEditingCategory(null);
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    const columns: ColumnDef<Category>[] = [
        {
            accessorKey: "name",
            header: "Tên danh mục",
            cell: ({ row }) => {
                const category = row.original;

                if (editingCategory && editingCategory.id === category.id) {
                    return (
                        <div className="flex items-center space-x-2">
                            <Input
                                value={editingCategory.name}
                                onChange={(e) =>
                                    setEditingCategory({
                                        ...editingCategory,
                                        name: e.target.value,
                                    })
                                }
                                className="h-8"
                                autoFocus
                            />
                        </div>
                    );
                }

                return category.name;
            },
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const category = row.original;
                const isActive = category.status === 1;

                if (editingCategory && editingCategory.id === category.id) {
                    return (
                        <div className="flex items-center space-x-2">
                            <select
                                value={editingCategory.status}
                                onChange={(e) =>
                                    setEditingCategory({
                                        ...editingCategory,
                                        status: parseInt(e.target.value),
                                    })
                                }
                                className="h-8 rounded-md border border-input px-3"
                            >
                                <option value={1}>Hiện</option>
                                <option value={0}>Ẩn</option>
                            </select>
                        </div>
                    );
                }

                return (
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${
                            isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                    >
                        {isActive ? "Hiện" : "Ẩn"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => {
                const category = row.original;

                if (editingCategory && editingCategory.id === category.id) {
                    return (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleUpdateCategory}
                                disabled={!editingCategory.name.trim()}
                            >
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                            >
                                <X className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setEditingCategory({
                                    id: category.id,
                                    name: category.name,
                                    status: category.status,
                                })
                            }
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    // Check if search term doesn't match any existing category
    const shouldShowCreateOption =
        searchTerm.trim() !== "" &&
        !filteredCategories.some(
            (c) => c.name.toLowerCase() === searchTerm.toLowerCase()
        );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Quản lý danh mục</DialogTitle>
                    <DialogDescription>
                        Xem, thêm và chỉnh sửa danh mục sản phẩm
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            ref={searchInputRef}
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={handleChangeSearchTerm}
                            className="mb-2 pr-8"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                    // Tạo event giả lập đúng kiểu cho onChange
                                    const event = {
                                        target: { value: "" },
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    handleChangeSearchTerm(event);
                                }}
                                tabIndex={-1}
                            >
                                &#10005;
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            Đang tải...
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={filteredCategories}
                            />

                            {shouldShowCreateOption && (
                                <div className="mt-2 p-3 border border-dashed rounded-md">
                                    <p className="text-sm mb-2">
                                        Không tìm thấy "{searchTerm}". Bạn có
                                        muốn tạo mới?
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            value={
                                                newCategoryName || searchTerm
                                            }
                                            onChange={(e) =>
                                                setNewCategoryName(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Tên danh mục"
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleCreateCategory}
                                            disabled={
                                                !(
                                                    newCategoryName ||
                                                    searchTerm
                                                ).trim()
                                            }
                                        >
                                            Thêm
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

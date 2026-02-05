import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useDeleteImage, useUpdateImage } from "@/hooks/useProduct";
import { Product } from "@/lib/interface";
import {
    AlertCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Loader2,
    Pencil,
    Save,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageSectionProps {
    product: Product;
    currentImageIndex: number;
    isExpanded: boolean;
    setIsExpanded: (value: boolean) => void;
    onImageSelect: (index: number) => void;
    orgId: string;
    refetch: () => void;
}

// Maximum file size: 1MB in bytes
const MAX_FILE_SIZE = 1 * 1024 * 1024;

export default function ImageSection({
    product,
    currentImageIndex,
    isExpanded,
    setIsExpanded,
    onImageSelect,
    orgId,
    refetch,
}: ImageSectionProps) {
    const { t } = useLanguage();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    const handleDeleteImage = (index: number) => {
        setImageToDelete(index);
        setIsDeleteDialogOpen(true);
    };

    const { mutate: deleteImage } = useDeleteImage(orgId, product.id);
    const confirmDeleteImage = async () => {
        if (imageToDelete !== null) {
            try {
                setIsDeleting(true);
                // Call the API to delete the image
                await deleteImage(imageToDelete);
            } catch (error) {
                console.error("Failed to delete image");
            } finally {
                setIsDeleting(false);
                setIsDeleteDialogOpen(false);
                setImageToDelete(null);
            }
        }
    };

    const handleSave = () => {
        // Save any pending changes
        setIsEditMode(false);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setFileError(null);
    };

    const { mutate: uploadImage } = useUpdateImage(orgId, product.id);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Reset previous errors
            setFileError(null);

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                setFileError(
                    "Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn hoặc bằng 1MB."
                );
                return;
            }

            try {
                setIsUploading(true);

                // Create FormData object
                const formData = new FormData();
                formData.append("images", file);

                // Call the API to upload the image
                await uploadImage(formData);

                // Clear any errors
                setFileError(null);
            } catch (error) {
                console.error("Failed to upload image");
                setFileError(
                    "Không thể tải lên hình ảnh. Vui lòng thử lại sau."
                );
            } finally {
                setIsUploading(false);
            }
        }
    };

    const nextImage = () => {
        if (product.images && product.images.length > 0) {
            const nextIndex = (currentImageIndex + 1) % product.images.length;
            onImageSelect(nextIndex);
        }
    };

    const prevImage = () => {
        if (product.images && product.images.length > 0) {
            const prevIndex =
                currentImageIndex === 0
                    ? product.images.length - 1
                    : currentImageIndex - 1;
            onImageSelect(prevIndex);
        }
    };

    // Helper function to format file size in human-readable format
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="border-b">
            <div className="flex items-center justify-between w-full p-4">
                <button
                    className="flex items-center text-left font-medium flex-grow"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span>{t("common.image")}</span>
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
                <div className="p-4 pt-0 flex flex-col justify-center items-center">
                    {!isEditMode ? (
                        // View mode - Carousel
                        product.images && product.images.length > 0 ? (
                            <div className="relative w-full">
                                <div className="relative aspect-square rounded-md overflow-hidden border border-gray-200 w-40 h-40 mx-auto">
                                    <Image
                                        src={product.images[currentImageIndex]}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Navigation arrows */}
                                {product.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                prevImage();
                                            }}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                nextImage();
                                            }}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </>
                                )}

                                {/* Dots indicator */}
                                {product.images.length > 1 && (
                                    <div className="flex justify-center mt-2 space-x-1">
                                        {product.images.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    onImageSelect(index)
                                                }
                                                className={`w-2 h-2 rounded-full ${
                                                    currentImageIndex === index
                                                        ? "bg-primary"
                                                        : "bg-gray-300"
                                                }`}
                                                aria-label={`Go to image ${
                                                    index + 1
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <label className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center w-40 h-40 cursor-pointer hover:bg-gray-50">
                                {isUploading ? (
                                    <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                                ) : (
                                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                )}
                                <span className="text-sm text-gray-500">
                                    {isUploading
                                        ? t("common.uploading")
                                        : t("common.upload")}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    {t("common.maxFileSize", {
                                        size: formatFileSize(MAX_FILE_SIZE),
                                    })}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                />
                            </label>
                        )
                    ) : (
                        // Edit mode
                        <div className="space-y-4 w-full">
                            <div className="grid grid-cols-2 gap-2">
                                {product.images && product.images.length > 0
                                    ? product.images.map((image, index) => (
                                          <div
                                              key={index}
                                              className="relative group"
                                          >
                                              <div className="aspect-square rounded-md overflow-hidden border">
                                                  <Image
                                                      src={image}
                                                      alt={`Product image ${
                                                          index + 1
                                                      }`}
                                                      fill
                                                      className="object-cover"
                                                  />
                                              </div>
                                              <button
                                                  className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() =>
                                                      handleDeleteImage(index)
                                                  }
                                                  disabled={isDeleting}
                                              >
                                                  {isDeleting &&
                                                  imageToDelete === index ? (
                                                      <Loader2 className="h-3 w-3 text-red-500 animate-spin" />
                                                  ) : (
                                                      <Trash2 className="h-3 w-3 text-red-500" />
                                                  )}
                                              </button>
                                          </div>
                                      ))
                                    : null}

                                {/* Add new image button */}
                                <label className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                                    {isUploading ? (
                                        <Loader2 className="h-6 w-6 text-primary animate-spin mb-1" />
                                    ) : (
                                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {isUploading
                                            ? t("common.uploading")
                                            : t("common.upload")}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {t("common.maxFileSize", {
                                            size: formatFileSize(MAX_FILE_SIZE),
                                        })}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>

                            {/* Error message */}
                            {fileError && (
                                <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{fileError}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Delete Image Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDeleteImage}
                title={t("common.deleteImage")}
                description={t("common.deleteImageDescription")}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
            />
        </div>
    );
}

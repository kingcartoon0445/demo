"use client";

import React, { useState, useEffect } from "react";
import { Glass } from "../Glass";
import { Product } from "@/lib/interface";
import { formatCurrency } from "@/lib/utils";
import {
    X,
    MapPin,
    Tag,
    Edit3,
    CheckCircle,
    AlertCircle,
    Home,
    Compass,
    Layout,
    Check,
    Clock,
    Trash2,
    LayoutGrid,
    User,
    Calendar,
    Phone,
    ArrowUpRight,
    Box,
    Users,
} from "lucide-react";
import { useGetProductById } from "@/hooks/useProduct";
import { Size } from "react-aria-components";

// Extended interface to support properties used in the design
// but potentially missing from the strict Product type
interface ExtendedProduct extends Product {
    relatedDeal?: {
        dealId: string;
        customerName: string;
        customerAvatar: string;
        phone: string;
        date: string;
    };
    // Override/Extend owner and followers to match the design's expected structure if needed
    // In strict mode we rely on the props 'owner' and 'followers' passed to the component
    attributes?: Array<{
        label: string;
        value: string;
    }>;
}

interface ProductDetailViewProps {
    product: Product;
    orgId: string;
    onClose?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onCreateDeal?: () => void;
    owner?: {
        id?: string;
        profileId?: string;
        name?: string;
        email?: string;
        avatar?: string;
    };
    followers?: Array<{
        id?: string;
        profileId?: string;
        name?: string;
        email?: string;
        avatar?: string;
    }>;
}

type ProductStatus = "available" | "reserved" | "sold" | "inactive";

export const ProductDetailView = ({
    product: initialProduct,
    orgId,
    onClose,
    onEdit,
    onDelete,
    onCreateDeal,
    owner: initialOwner,
    followers: initialFollowers,
}: ProductDetailViewProps) => {
    // Fetch fresh data
    const { data: productData } = useGetProductById(
        orgId,
        initialProduct.id || "",
    );

    // Merge fresh data with initial data, prefer fresh data
    const product = (productData?.data || initialProduct) as ExtendedProduct;

    // Determine owner and followers from fresh data if available, otherwise fallback
    const assignedTo = product.assignedTo || [];
    const ownerEntry = assignedTo.find((a) => a.type === "OWNER");
    const followerEntries = assignedTo.filter((a) => a.type === "FOLLOWER");

    const owner = ownerEntry
        ? {
              name: ownerEntry.name,
              avatar: ownerEntry.avatar,
          }
        : initialOwner;

    const followers =
        followerEntries.length > 0
            ? followerEntries.map((a) => ({
                  name: a.name,
                  avatar: a.avatar,
                  id: a.id,
              }))
            : initialFollowers;

    const [activeImage, setActiveImage] = useState(product.image || "");

    // Normalize images array: Use the provided images array or fallback to single image or empty
    const gallery =
        product.images && product.images.length > 0
            ? product.images
            : product.image
              ? [product.image]
              : [];

    useEffect(() => {
        // Reset active image when product changes
        if (product.images && product.images.length > 0) {
            setActiveImage(product.images[0]);
        } else if (product.image) {
            setActiveImage(product.image);
        }
    }, [product]);

    // Map numeric status to string status for the UI logic
    // 1: available (active), 2: reserved (pending), 0: sold, 3: inactive
    const getStatusString = (statusNumber: number): ProductStatus => {
        switch (statusNumber) {
            case 1:
                return "available";
            case 2:
                return "reserved";
            case 0:
                return "sold";
            case 3:
                return "inactive";
            default:
                return "inactive";
        }
    };

    const currentStatus = getStatusString(product.status);
    const isSelectable = currentStatus === "available";

    const getStatusConfig = (status: ProductStatus) => {
        switch (status) {
            case "available":
                return {
                    label: "Đang mở bán",
                    color: "bg-green-100 text-green-700 border-green-200",
                    icon: CheckCircle,
                };
            case "reserved":
                return {
                    label: "Đang giữ chỗ",
                    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    icon: Clock,
                };
            case "sold":
                return {
                    label: "Đã bán",
                    color: "bg-red-100 text-red-700 border-red-200",
                    icon: X,
                };
            case "inactive":
                return {
                    label: "Ngưng bán",
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    icon: AlertCircle,
                };
            default:
                return {
                    label: "Không xác định",
                    color: "bg-gray-100",
                    icon: AlertCircle,
                };
        }
    };

    // Helper to request status change (mock for now as prop isn't strictly available in ProjectDetailViewProps)
    const handleStatusChange = (newStatus: ProductStatus) => {
        console.log("Request status change to:", newStatus);
        // Implement actual update logic here if needed
    };

    return (
        <div className="relative w-full h-[85vh] flex flex-col shadow-2xl rounded-3xl overflow-hidden font-sans">
            <Glass
                className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white/95"
                intensity="high"
                border={false}
            >
                {/* Left Side: Image Gallery */}
                <div className="w-full md:w-1/2 bg-gray-900 relative group overflow-hidden flex flex-col">
                    {/* Main Image Container */}

                    <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-900">
                        {/* Blurred Background for Vertical Images */}
                        {activeImage && (
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
                                style={{
                                    backgroundImage: `url(${activeImage})`,
                                }}
                            ></div>
                        )}

                        {/* The Image */}
                        {activeImage ? (
                            <img
                                src={activeImage}
                                alt={product.name}
                                className="relative z-10 w-full h-full object-contain transition-transform duration-700"
                            />
                        ) : (
                            <div className="relative z-10 text-gray-500 flex flex-col items-center">
                                <span className="text-sm">
                                    Không có hình ảnh
                                </span>
                            </div>
                        )}

                        {/* Status Overlay */}
                        <div className="absolute top-4 left-4 z-20">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 backdrop-blur-md ${
                                    isSelectable
                                        ? "bg-green-500/90 text-white"
                                        : "bg-red-500/90 text-white"
                                }`}
                            >
                                {isSelectable ? (
                                    <CheckCircle size={14} />
                                ) : (
                                    <X size={14} />
                                )}
                                {isSelectable
                                    ? "Có thể chọn"
                                    : "Không thể chọn"}
                            </span>
                        </div>
                    </div>

                    {/* Gallery Thumbnails */}
                    {gallery.length > 1 && (
                        <div className="h-20 bg-black/80 backdrop-blur-md p-2 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 z-20 border-t border-white/10 justify-center">
                            {gallery.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setActiveImage(img)}
                                    className={`h-full aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border-2 shrink-0 ${
                                        activeImage === img
                                            ? "border-indigo-500 opacity-100 ring-2 ring-indigo-500/50"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img
                                        src={img}
                                        className="w-full h-full object-cover"
                                        alt={`thumb-${i}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details */}

                <div className="w-full md:w-1/2 flex flex-col h-full bg-white/60 backdrop-blur-xl">
                    <div className="flex justify-end w-full">
                        <button
                            onClick={onClose}
                            className="mr-4 mt-2 z-50 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors border border-white/20"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                {product.category?.name || "SẢN PHẨM"}
                            </span>

                            {product.code && (
                                <span className="text-sm font-mono font-bold text-gray-500">
                                    #{product.code}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {product.name}
                        </h1>

                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-3xl font-black text-indigo-700">
                                {formatCurrency(product.price)}
                            </span>
                            <span className="text-sm font-medium text-gray-500 mb-1.5">
                                / đơn vị
                            </span>
                        </div>

                        {/* OWNER / DEAL INFO (If Sold or Reserved) - Mock data usage based on design document */}
                        {(currentStatus === "sold" ||
                            currentStatus === "reserved") &&
                            product.relatedDeal && (
                                <div className="mb-6 bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                                    <div
                                        className={`absolute top-0 left-0 w-1 h-full ${
                                            currentStatus === "sold"
                                                ? "bg-red-500"
                                                : "bg-yellow-500"
                                        }`}
                                    ></div>
                                    <div className="flex justify-between items-start mb-3 pl-2">
                                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                            <User
                                                size={16}
                                                className="text-indigo-600"
                                            />
                                            Thông tin sở hữu
                                        </h3>
                                        <span
                                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                currentStatus === "sold"
                                                    ? "bg-red-50 text-red-600"
                                                    : "bg-yellow-50 text-yellow-600"
                                            }`}
                                        >
                                            {currentStatus === "sold"
                                                ? "Đã bán"
                                                : "Đang giữ chỗ"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 pl-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 border border-white shadow-sm overflow-hidden shrink-0">
                                            <img
                                                src={
                                                    product.relatedDeal
                                                        .customerAvatar
                                                }
                                                className="w-full h-full object-cover"
                                                alt="Customer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">
                                                {
                                                    product.relatedDeal
                                                        .customerName
                                                }
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={10} />{" "}
                                                    {product.relatedDeal.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />{" "}
                                                    {product.relatedDeal.date}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-gray-50 group-hover:bg-indigo-50 rounded-lg text-gray-400 group-hover:text-indigo-600 transition-colors">
                                            <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* OWNER & FOLLOWERS SECTION */}
                        <div className="mb-6 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between">
                            {owner && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                        Người phụ trách
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border border-white shadow-sm overflow-hidden">
                                            {owner.avatar ? (
                                                <img
                                                    src={owner.avatar}
                                                    className="w-full h-full object-cover"
                                                    alt={owner.name}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {owner.name
                                                        ?.substring(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">
                                            {owner.name}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {followers && followers.length > 0 && (
                                <div className="text-right">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                        Người theo dõi
                                    </label>
                                    <div className="flex items-center justify-end -space-x-2">
                                        {followers.map((f, idx) => (
                                            <div
                                                key={f.id || idx}
                                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden"
                                                title={f.name}
                                            >
                                                <img
                                                    src={f.avatar}
                                                    className="w-full h-full object-cover"
                                                    alt={f.name}
                                                />
                                            </div>
                                        ))}
                                        <button className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors z-10 text-xs font-bold">
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                                Trạng thái hiện tại
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(
                                    [
                                        "available",
                                        "reserved",
                                        "sold",
                                        "inactive",
                                    ] as ProductStatus[]
                                ).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() =>
                                            handleStatusChange(status)
                                        }
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                            currentStatus === status
                                                ? getStatusConfig(status)
                                                      .color +
                                                  " ring-1 ring-offset-1"
                                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                                        }`}
                                    >
                                        {currentStatus === status && (
                                            <Check size={14} />
                                        )}
                                        {getStatusConfig(status).label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* DYNAMIC ATTRIBUTES GRID */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {product.attributes &&
                            product.attributes.length > 0 ? (
                                product.attributes.map((attr, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white/50"
                                    >
                                        <div className="mt-0.5 text-indigo-500">
                                            <Box size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 font-bold uppercase truncate">
                                                {attr.label}
                                            </p>
                                            <p
                                                className="text-sm font-bold text-gray-800 truncate"
                                                title={attr.value}
                                            >
                                                {attr.value}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Fallback to display some basic info if attributes are missing, just to not look empty like the design doc fallback */
                                <>
                                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white/50">
                                        <div className="mt-0.5 text-indigo-500">
                                            <Compass size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 font-bold uppercase truncate">
                                                Đơn vị
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {product.unit || "--"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white/50">
                                        <div className="mt-0.5 text-indigo-500">
                                            <Tag size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 font-bold uppercase truncate">
                                                Thuế
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {product.tax || 0}%
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">
                                Mô tả chi tiết
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {product.description ||
                                    "Chưa có mô tả chi tiết cho sản phẩm này."}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                        {/* Delete Button */}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                title="Xóa sản phẩm"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}

                        <button
                            onClick={onEdit}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit3 size={18} />
                            Chỉnh sửa
                        </button>
                        <button
                            disabled={!isSelectable}
                            onClick={() =>
                                isSelectable && onCreateDeal && onCreateDeal()
                            }
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg ${
                                isSelectable
                                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            <Tag size={18} />
                            {isSelectable ? "Tạo Deal mới" : "Không khả dụng"}
                        </button>
                    </div>
                </div>
            </Glass>
        </div>
    );
};

export default ProductDetailView;

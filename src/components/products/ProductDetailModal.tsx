"use client";

import { Product } from "@/lib/interface";
 
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import ProductDetailView from "./ProductDetailView";

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
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

export const ProductDetailModal = ({
    product,
    isOpen,
    onClose,
    orgId,
    onEdit,
    onDelete,
    onCreateDeal,
    owner,
    followers = [],
}: ProductDetailModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-5xl p-0 border-none bg-transparent shadow-none w-[90vw] max-h-[90vh] sm:max-w-5xl"
                showCloseButton={false}
            >
                <VisuallyHidden.Root>
                    <DialogTitle>Chi tiết sản phẩm</DialogTitle>
                    <DialogDescription>
                        Xem và chỉnh sửa thông tin chi tiết sản phẩm
                    </DialogDescription>
                </VisuallyHidden.Root>

                {product && (
                    <ProductDetailView
                        product={product}
                        orgId={orgId}
                        onClose={onClose}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onCreateDeal={onCreateDeal}
                        owner={owner}
                        followers={followers}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ProductDetailModal;

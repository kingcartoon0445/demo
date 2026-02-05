"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateCustomer } from "@/hooks/useCustomerV2";
import { useState } from "react";
import toast from "react-hot-toast";

interface AddOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
}

export default function AddOrganizationModal({
    isOpen,
    onClose,
    orgId,
}: AddOrganizationModalProps) {
    const { t } = useLanguage();
    const [organizationName, setOrganizationName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createCustomerMutation = useCreateCustomer(orgId, false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!organizationName.trim()) {
            toast.error("Vui lòng nhập tên tổ chức");
            return;
        }

        setIsSubmitting(true);

        try {
            await createCustomerMutation.mutateAsync({
                fullName: organizationName.trim(),
                isBusiness: true,
            });

            toast.success("Tạo tổ chức thành công!");
            setOrganizationName("");
            onClose();
        } catch (error) {
            console.error("Error creating organization:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setOrganizationName("");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm tổ chức mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="organizationName">
                            Tên tổ chức <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="organizationName"
                            value={organizationName}
                            onChange={(e) =>
                                setOrganizationName(e.target.value)
                            }
                            placeholder="Nhập tên tổ chức"
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !organizationName.trim()}
                        >
                            {isSubmitting ? "Đang tạo..." : "Tạo tổ chức"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

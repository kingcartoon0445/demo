"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, forwardRef, useImperativeHandle } from "react";

const CreateContactForm = forwardRef(({ onSubmit }, ref) => {
    const [formData, setFormData] = useState({
        phone: "",
        name: "",
        note: "",
    });

    useImperativeHandle(ref, () => ({
        submitForm: () => {
            if (formData.phone && formData.name) {
                onSubmit(formData);
                return true;
            }
            return false;
        },
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    return (
        <form
            id="create-contact-form"
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <div className="space-y-1">
                <Label htmlFor="phone">
                    Số điện thoại<span className="text-destructive">*</span>
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-1">
                <Label htmlFor="name">
                    Tên khách hàng<span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    placeholder="Nhập tên khách hàng"
                    required
                    value={formData.name}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-1">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                    id="note"
                    placeholder="Nhập ghi chú"
                    rows={4}
                    value={formData.note}
                    onChange={handleChange}
                />
            </div>
        </form>
    );
});

CreateContactForm.displayName = "CreateContactForm";

export default CreateContactForm;

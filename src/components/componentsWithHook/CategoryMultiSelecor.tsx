import { useGetCategory } from "@/hooks/useProduct";
import { MultiSelect } from "../ui/multi-select";
import { useState, useEffect } from "react";

interface CategoryMultiSelecorProps {
    orgId: string;
    selected?: string[];
    onChange?: (value: string[]) => void;
}

export default function CategoryMultiSelecor({
    orgId,
    selected = [],
    onChange,
}: CategoryMultiSelecorProps) {
    const { data: categoryData } = useGetCategory(orgId);
    const categories = categoryData?.data || [];

    const [internalSelected, setInternalSelected] =
        useState<string[]>(selected);

    useEffect(() => {
        setInternalSelected(selected);
    }, [selected]);

    const handleChange = (value: string[]) => {
        setInternalSelected(value);
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <MultiSelect
            placeholder="Chọn danh mục"
            options={categories.map((category) => ({
                label: category.name,
                value: category.id,
            }))}
            selected={internalSelected}
            onChange={handleChange}
        />
    );
}

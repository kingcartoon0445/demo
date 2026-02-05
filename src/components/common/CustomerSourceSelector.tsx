import { ChevronsUpDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomerSourceSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function CustomerSourceSelector({
    value,
    onChange,
}: CustomerSourceSelectorProps) {
    const { t } = useLanguage();
    const options = [
        {
            value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82",
            label: "Nhập vào",
            default: true,
        },
        {
            value: "3b70970b-e448-46fa-af8f-6605855a6b52",
            label: "Form",
            default: false,
        },
        {
            value: "38b353c3-ecc8-4c62-be27-229ef47e622d",
            label: "AIDC",
            default: false,
        },
    ];

    const [selectedLabel, setSelectedLabel] = useState<string>("");

    // Update selected label when value changes
    useEffect(() => {
        if (value) {
            const option = options.find((opt) => opt.value === value);
            if (option) {
                setSelectedLabel(option.label);
            }
        }
    }, [value]);

    const handleValueChange = (newValue: string) => {
        onChange(newValue);
        const option = options.find((opt) => opt.value === newValue);
        if (option) {
            setSelectedLabel(option.label);
        }
    };

    const defaultOption = options.find((opt) => opt.default)?.value;

    return (
        <Select
            value={value}
            onValueChange={handleValueChange}
            defaultValue={defaultOption}
        >
            <SelectTrigger className="w-full">
                <SelectValue
                    placeholder={t("common.selectCustomerType")}
                    className="truncate"
                >
                    <span className="truncate block text-black font-medium">
                        {selectedLabel || t("common.selectCustomerType")}
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

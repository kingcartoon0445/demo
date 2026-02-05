import { createCustomer } from "@/api/customerV2";
import { Customer } from "@/lib/interface";
import React, { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "../ui/button";
import { Plus, UserPlus, X } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useUserDetail } from "@/hooks/useUser";
import { getCustomerList } from "@/api/customerV2";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "../ui/input";
import { getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";
import ListSkeleton from "@/components/common/ListSkeleton";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

export const BusinessCustomerSelector = ({
    orgId,
    selected,
    onChange,
    placeholder = "Tìm kiếm tổ chức...",
    className = "",
}: {
    orgId: string;
    selected: string;
    onChange: (selected: string, organizationName?: string) => void;
    placeholder?: string;
    className?: string;
}) => {
    const [searchText, setSearchText] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDisplayName, setSelectedDisplayName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const debouncedSearchText = useDebounce(searchText, 500);
    const queryClient = useQueryClient();
    const { data: userDetail } = useUserDetail();
    const { t } = useLanguage();
    const minLengthReached = (debouncedSearchText?.trim().length || 0) >= 4;

    const { data: businessCustomersResponse, isLoading } = useQuery({
        queryKey: [
            "customers",
            orgId,
            20,
            0,
            "",
            "",
            true,
            debouncedSearchText,
        ],
        queryFn: () =>
            getCustomerList(orgId, 20, 0, "", "", true, debouncedSearchText),
        enabled: !!orgId && minLengthReached,
        staleTime: 0, // 5 minutes
    });

    const businessCustomers =
        (businessCustomersResponse?.content as Customer[]) || [];

    // Tìm tổ chức đã chọn để hiển thị
    const selectedCustomer = useMemo(() => {
        return businessCustomers.find((customer) => customer.id === selected);
    }, [businessCustomers, selected]);

    // Hiển thị tên trong input - ưu tiên selectedDisplayName nếu có selected
    const displayValue = selected
        ? selectedCustomer?.fullName || selectedDisplayName
        : searchText;

    // Cập nhật selectedDisplayName khi selected thay đổi
    React.useEffect(() => {
        if (selected && selectedCustomer) {
            setSelectedDisplayName(selectedCustomer.fullName);
        } else if (!selected) {
            setSelectedDisplayName("");
            setSearchText("");
        }
    }, [selected, selectedCustomer]);

    const handleSelectCustomer = (customer: Customer) => {
        onChange(customer.id, customer.fullName);
        setSelectedDisplayName(customer.fullName);
        setSearchText(customer.fullName);
        setIsOpen(false);
    };

    const handleCreateOrganization = async (name: string) => {
        if (!name.trim() || isCreating || !userDetail?.id) return;

        setIsCreating(true);

        try {
            const customerData = {
                fullName: name.trim(),
                title: "",
                phone: "",
                email: "",
                sourceId: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82", // Hardcoded sourceId
                utmSource: "",
                isBusiness: true,
                tags: [],
                assignees: [userDetail.id],
            };

            const result = await createCustomer(orgId, customerData);
            const newOrganization = result.content;

            // Sau khi tạo tổ chức mới thành công, chọn tổ chức đó
            if (newOrganization && newOrganization.id) {
                onChange(newOrganization.id, newOrganization.fullName || name);
                setSelectedDisplayName(newOrganization.fullName || name);
                setSearchText(newOrganization.fullName || name);
                toast.success(t("common.createSuccess"));
            }

            // Invalidate và refetch customers data để hiển thị tổ chức mới
            queryClient.invalidateQueries({
                queryKey: ["customers", orgId],
            });
            setIsOpen(false);

            return newOrganization;
        } catch (error) {
            console.error("Error creating organization:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("common.createFailed")
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleClear = () => {
        onChange("", "");
        setSelectedDisplayName("");
        setSearchText("");
        setIsOpen(false);
    };

    const handleClearSelection = () => {
        onChange("", "");
        setSelectedDisplayName("");
        setSearchText("");
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Nếu đã chọn tổ chức, không cho phép thay đổi text
        if (selected) {
            return;
        }

        setSearchText(newValue);

        // Clear selected nếu user đang nhập khác với tên đã chọn
        if (selected && newValue !== selectedDisplayName) {
            onChange("", "");
            setSelectedDisplayName("");
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Input
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => !selected && setIsOpen(true)}
                    readOnly={!!selected}
                    className="w-full pr-8"
                />
                {selected && (
                    <TooltipProvider>
                        <Tooltip content={<span>{t("common.cancel")}</span>}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSelection}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {isOpen && !selected && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md">
                        <Command shouldFilter={false}>
                            <CommandList className="max-h-60 overflow-auto">
                                {isLoading && minLengthReached && (
                                    <ListSkeleton
                                        rows={3}
                                        showAvatar
                                        showRadio={false}
                                        hasSecondaryText
                                    />
                                )}

                                {!isLoading &&
                                    minLengthReached &&
                                    businessCustomers.length === 0 && (
                                        <CommandEmpty>
                                            <div className="p-4 text-center">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {t("common.noResult")}
                                                    {searchText && (
                                                        <span>
                                                            {" "}
                                                            với từ khóa "
                                                            {searchText}"
                                                        </span>
                                                    )}
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() =>
                                                        handleCreateOrganization(
                                                            searchText
                                                        )
                                                    }
                                                    disabled={isCreating}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    {isCreating
                                                        ? "Đang tạo..."
                                                        : "Thêm tổ chức mới"}
                                                </Button>
                                            </div>
                                        </CommandEmpty>
                                    )}

                                {!minLengthReached && (
                                    <CommandEmpty>
                                        {t("common.enterAtLeast3Characters")}
                                    </CommandEmpty>
                                )}

                                {/* Option "Không chọn" */}
                                {minLengthReached && (
                                    <CommandItem
                                        onSelect={handleClear}
                                        className="cursor-pointer hover:bg-gray-50"
                                    >
                                        <span className="text-sm text-muted-foreground">
                                            {t("common.noSelectCompany")}
                                        </span>
                                    </CommandItem>
                                )}

                                {/* Option tạo mới khi có search text */}
                                {searchText.trim().length > 0 && (
                                    <CommandItem
                                        className="cursor-pointer hover:bg-gray-50"
                                        onSelect={() =>
                                            handleCreateOrganization(searchText)
                                        }
                                        disabled={isCreating}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        <span className="font-medium">
                                            {isCreating
                                                ? "Đang tạo..."
                                                : `Thêm tổ chức mới: "${searchText}"`}
                                        </span>
                                    </CommandItem>
                                )}

                                {businessCustomers.length > 0 && (
                                    <CommandGroup>
                                        {businessCustomers.map(
                                            (customer: Customer) => (
                                                <CommandItem
                                                    key={customer.id}
                                                    onSelect={() =>
                                                        handleSelectCustomer(
                                                            customer
                                                        )
                                                    }
                                                    className="cursor-pointer hover:bg-gray-50"
                                                >
                                                    <Avatar
                                                        className="mr-2"
                                                        name={
                                                            getFirstAndLastWord(
                                                                customer.fullName
                                                            ) || ""
                                                        }
                                                        src={
                                                            customer.avatar ||
                                                            ""
                                                        }
                                                        size="24"
                                                        round
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {customer.fullName}
                                                        </span>
                                                        <div className="flex flex-col gap-0.5">
                                                            {customer.phone && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        customer.phone
                                                                    }
                                                                </span>
                                                            )}
                                                            {customer.email && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        customer.email
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            )
                                        )}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </div>
                )}
            </div>

            {/* Click outside to close */}
            {isOpen && !selected && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

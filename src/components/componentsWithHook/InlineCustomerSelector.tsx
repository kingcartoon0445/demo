"use client";

import * as React from "react";
import { useCustomerListByPost } from "@/hooks/useCustomerV2";
import { createCustomer } from "@/api/customerV2";
import { useLinkToCustomer } from "@/hooks/useConversation";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { getFirstAndLastWord } from "@/lib/utils";
import Avatar from "react-avatar";
import ListSkeleton from "@/components/common/ListSkeleton";
import { useLinkLeadToCustomer } from "@/hooks/useCustomerDetail";
import { Button } from "../ui/button";
import { UserPlus, X } from "lucide-react";
import { useUserDetail } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

interface SelectedCustomer {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
}

interface InlineCustomerSelectorProps {
    orgId: string;
    onSelect?: (customer: SelectedCustomer | null) => void;
    onCreateNew?: (searchText: string) => void;
    conversationId?: string;
    provider?: string;
    placeholder?: string;
    className?: string;
}

export default function InlineCustomerSelector({
    orgId,
    onSelect,
    onCreateNew,
    conversationId,
    provider,
    placeholder = "Tìm kiếm khách hàng...",
    className = "",
}: InlineCustomerSelectorProps) {
    const [searchText, setSearchText] = React.useState("");
    const [debouncedSearchText, setDebouncedSearchText] = React.useState("");
    const [selectedCustomer, setSelectedCustomer] =
        React.useState<SelectedCustomer | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);

    const queryClient = useQueryClient();
    const { data: userDetail } = useUserDetail();

    const DEBOUNCE_MS = 600;
    React.useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [searchText]);

    const minLengthReached = (debouncedSearchText?.trim().length || 0) >= 3;
    const { data, isLoading } = useCustomerListByPost(
        orgId,
        {
            limit: 20,
            offset: 0,
            searchText: debouncedSearchText,
        },
        { enabled: minLengthReached && !isCreating }
    );

    const customers = Array.isArray(data?.content) ? data?.content : [];
    const linkMutation =
        provider === "lead"
            ? useLinkLeadToCustomer(orgId, conversationId || "")
            : useLinkToCustomer(orgId, conversationId || "");

    const handleSelectCustomer = (customer: any) => {
        const selected: SelectedCustomer = {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
        };
        setSelectedCustomer(selected);
        setSearchText(customer.fullName);
        setIsOpen(false);
        onSelect?.(selected);
    };

    const handleClearSelection = () => {
        setSelectedCustomer(null);
        setSearchText("");
        setIsOpen(false);
        onSelect?.(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);

        // Nếu đã chọn khách hàng và người dùng thay đổi text, cập nhật fullName
        if (selectedCustomer) {
            const updatedCustomer = {
                ...selectedCustomer,
                fullName: value,
            };
            setSelectedCustomer(updatedCustomer);
            onSelect?.(updatedCustomer);
        }
    };

    const handleCreateNew = () => {
        setSelectedCustomer(null);
        setIsOpen(false);
        onCreateNew?.(searchText);
    };

    const handleCreateCustomer = async (name: string) => {
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
                isBusiness: false, // Khách hàng cá nhân
                tags: [],
                assignees: [userDetail.id],
            };

            const result = await createCustomer(orgId, customerData);
            const newCustomer = result.content;

            // Sau khi tạo khách hàng mới thành công, chọn khách hàng đó
            if (newCustomer && newCustomer.id) {
                const selectedData: SelectedCustomer = {
                    id: newCustomer.id,
                    fullName: newCustomer.fullName,
                    phone: newCustomer.phone,
                    email: newCustomer.email,
                };
                setSelectedCustomer(selectedData);
                setSearchText(newCustomer.fullName);
                onSelect?.(selectedData);
                toast.success("Tạo khách hàng thành công!");
            }

            // Invalidate và refetch customers data để hiển thị khách hàng mới
            queryClient.invalidateQueries({
                queryKey: ["customerListByPost", orgId],
            });
            setIsOpen(false);

            return newCustomer;
        } catch (error) {
            console.error("Error creating customer:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Có lỗi xảy ra khi tạo khách hàng"
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleLink = async () => {
        if (!conversationId || !selectedCustomer) return;
        await linkMutation.mutateAsync({ customerId: selectedCustomer.id });
    };

    const showLinkButtons =
        (provider === "lead" || provider === "customer") && conversationId;

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Input
                    placeholder={placeholder}
                    value={searchText}
                    onChange={handleInputChange}
                    onFocus={() => !selectedCustomer && setIsOpen(true)}
                    className="w-full pr-8"
                    autoFocus={false}
                />
                {selectedCustomer && (
                    <TooltipProvider>
                        <Tooltip content={<span>Bỏ chọn</span>}>
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

                {isOpen && !selectedCustomer && (
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
                                    customers.length === 0 && (
                                        <CommandEmpty>
                                            Không tìm thấy kết quả
                                        </CommandEmpty>
                                    )}
                                {!minLengthReached && (
                                    <CommandEmpty>
                                        Nhập tối thiểu 3 ký tự để tìm kiếm
                                    </CommandEmpty>
                                )}

                                {/* Option tạo mới khi có search text */}
                                {searchText.trim().length > 0 && (
                                    <CommandItem
                                        onSelect={async () => {
                                            // Hủy bỏ truy vấn tìm kiếm đang chạy để không phải chờ
                                            await queryClient.cancelQueries({
                                                queryKey: [
                                                    "customers-by-post",
                                                    orgId,
                                                ],
                                            });
                                            // Ưu tiên sử dụng handleCreateCustomer nếu có userDetail
                                            if (userDetail?.id) {
                                                await handleCreateCustomer(
                                                    searchText
                                                );
                                            } else if (onCreateNew) {
                                                handleCreateNew();
                                            }
                                        }}
                                        className="cursor-pointer hover:bg-gray-50"
                                        disabled={isCreating}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        <span className="font-medium">
                                            {isCreating
                                                ? "Đang tạo..."
                                                : `Thêm khách hàng mới: "${searchText}"`}
                                        </span>
                                    </CommandItem>
                                )}

                                {customers.length > 0 && (
                                    <CommandGroup>
                                        {customers.map((c: any) => (
                                            <CommandItem
                                                key={c.id}
                                                onSelect={() =>
                                                    handleSelectCustomer(c)
                                                }
                                                className="cursor-pointer hover:bg-gray-50"
                                            >
                                                <Avatar
                                                    className="mr-2"
                                                    name={
                                                        getFirstAndLastWord(
                                                            c.fullName
                                                        ) || ""
                                                    }
                                                    src={c.avatar || ""}
                                                    size="24"
                                                    round
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {c.fullName}
                                                    </span>
                                                    <div className="flex flex-col gap-0.5">
                                                        {c.phone && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {c.phone}
                                                            </span>
                                                        )}
                                                        {c.email && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {c.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </div>
                )}
            </div>

            {/* Buttons chỉ hiển thị khi có provider phù hợp */}
            {/* {showLinkButtons && selectedCustomer && (
                <div className="flex items-center gap-2 mt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setSelectedCustomer(null);
                            setSearchText("");
                            onSelect?.(null);
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleLink}
                        disabled={linkMutation.isPending}
                    >
                        {linkMutation.isPending
                            ? "Đang liên kết..."
                            : "Liên kết"}
                    </Button>
                </div>
            )} */}

            {/* Click outside to close */}
            {isOpen && !selectedCustomer && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

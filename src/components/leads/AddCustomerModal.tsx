import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCustomer, useCreateLead } from "@/hooks/useCustomerV2";
import { useUserDetail } from "@/hooks/useUser";
import { memo, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CustomerSourceSelector } from "../common/CustomerSourceSelector";
import { CustomInput } from "../common/CustomInput";
import { BusinessCustomerSelector } from "../componentsWithHook/BusinessCustomerSelector";
import { CustomerTagsMultiSelector } from "../componentsWithHook/CustomerTagsMultiSelector";
import { OrgMemberSelect } from "../componentsWithHook/MemberSelector";
import { UtmSourceSelector } from "../componentsWithHook/UtmSourceSelector";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { linkToCustomer, linkToLead } from "@/api/conversation";
import { useQueryClient } from "@tanstack/react-query";
import { linkLeadToCustomer } from "@/api/customerV2";
import InlineCustomerSelector from "../componentsWithHook/InlineCustomerSelector";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: CustomerFormData) => void;
    orgId: string;
    provider?: string;
    conversationId?: string;
    customerId?: string;
    leadId?: string;
}

export interface CustomerFormData {
    fullName: string;
    title: string;
    phone: string;
    email: string;
    sourceId: string;
    utmSource: string;
    isBusiness: boolean;
    tags: string[];
    assignees: string[];
    companyId?: string;
    customerId?: string;
    isCreateNewCustomer?: boolean;
    conversationId?: string;
}

// Memoized form fields to prevent unnecessary re-renders
const FormField = memo(
    ({
        label,
        children,
        required = false,
        error,
    }: {
        label: string;
        children: React.ReactNode;
        required?: boolean;
        error?: string;
    }) => (
        <div>
            <Label className="block text-sm font-medium mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {children}
            {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
        </div>
    )
);

FormField.displayName = "FormField";

export default function AddCustomerModal({
    isOpen,
    onClose,
    onSubmit,
    orgId,
    provider,
    conversationId,
    customerId,
    leadId,
}: AddCustomerModalProps) {
    const router = useRouter();
    const { mutateAsync: createLead, isPending: isCreatingLead } =
        useCreateLead(orgId);
    const { mutateAsync: createCustomer, isPending: isCreatingCustomer } =
        useCreateCustomer(orgId);
    const [localOpen, setLocalOpen] = useState(isOpen);
    const { data: currentUserResponse } = useUserDetail();
    const { t } = useLanguage();
    const currentUser = currentUserResponse;
    const {
        control,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<CustomerFormData>({
        defaultValues: {
            fullName: "",
            title: "",
            phone: "",
            email: "",
            sourceId: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82",
            utmSource: "",
            isBusiness: false,
            tags: [],
            assignees: [],
            companyId: "",
            customerId: "",
            conversationId: conversationId || "",
        },
    });

    // Watch các giá trị để xử lý logic hiển thị dấu *
    const watchedCustomerId = watch("customerId");
    const watchedCompanyId = watch("companyId");

    // Logic hiển thị dấu * có điều kiện
    // Sửa lại logic required cho đúng yêu cầu mới:
    const isCustomerOrCompanyProvider =
        provider === "customer" || provider === "customer1";
    const isCustomerRequired = isCustomerOrCompanyProvider
        ? !watchedCompanyId?.trim() && !watchedCustomerId?.trim()
        : !watchedCompanyId?.trim();
    const isCompanyRequired = isCustomerOrCompanyProvider
        ? !watchedCustomerId?.trim() && !watchedCompanyId?.trim()
        : !watchedCustomerId?.trim();
    const [title, setTitle] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<{
        id: string;
        fullName: string;
        phone?: string;
        email?: string;
    } | null>(null);
    const queryClient = useQueryClient();
    useEffect(() => {
        if (provider === "customer" || provider === "customer1") {
            setTitle(t("customer.createCustomer"));
        } else if (provider === "lead" || provider === "lead1") {
            setTitle(t("lead.createLead"));
        }
    }, [provider]);
    useEffect(() => {
        setLocalOpen(isOpen);
    }, [isOpen]);

    const handleSourceChange = (sourceId: string) => {
        setValue("sourceId", sourceId);
    };

    const handleUtmSourceChange = (utmSource: string) => {
        setValue("utmSource", utmSource);
    };

    const handleBusinessChange = (value: string, organizationName?: string) => {
        setValue("companyId", value);
        // const currentFullName = (watch("fullName") || "").trim();
        // if (!currentFullName && organizationName) {
        //     setValue("fullName", organizationName);
        // }
    };

    const handleCustomerSelect = (
        customer: {
            id: string;
            fullName: string;
            phone?: string;
            email?: string;
        } | null
    ) => {
        setSelectedCustomer(customer);
        if (customer) {
            // setValue("fullName", customer.fullName);
            if (customer.phone) setValue("phone", customer.phone);
            if (customer.email) setValue("email", customer.email);
            if (customer.id) setValue("customerId", customer.id);
        } else {
            // Clear customerId khi không chọn khách hàng
            setValue("customerId", "");
        }
    };

    const handleCreateNewCustomer = (searchText: string) => {
        // setValue("fullName", searchText);
        // Không clear customerId nữa, vì user có thể muốn tạo tên mới
        // nhưng vẫn giữ customerId hoặc companyId đã chọn
        setSelectedCustomer(null);
    };

    const onFormSubmit = async (data: CustomerFormData) => {
        const submissionData = {
            ...data,
            sourceId: data.sourceId || "ce7f42cf-f10f-49d2-b57e-0c75f8463c82",
            fullName: data.title,
            assignees:
                data.assignees.length > 0
                    ? data.assignees
                    : [currentUser?.id || ""],
        };

        if (provider === "customer") {
            try {
                const res = await createCustomer(submissionData);
                if (res.code === 0) {
                    const newCustomerId = res.content.id;
                    if (conversationId) {
                        await linkToCustomer(orgId, conversationId, {
                            customerId: newCustomerId,
                        });
                        queryClient.invalidateQueries({
                            queryKey: [
                                "detailConversation",
                                orgId,
                                conversationId,
                            ],
                        });
                    }
                    if (leadId) {
                        await linkLeadToCustomer(orgId, leadId, {
                            customerId: newCustomerId,
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["lead-detail-api", orgId, leadId],
                        });
                    }
                }
            } catch (error) {
                console.error("Error creating customer:", error);
            }
        } else if (provider === "customer1") {
            createCustomer(submissionData);
        } else if (provider === "lead1") {
            const response = await createLead(submissionData);
            if (response.code === 0) {
                const newLeadId = response.content.id;
                router.push(`leads?lid=${newLeadId}`);
            }
        } else if (provider === "lead") {
            try {
                const res = await createLead(submissionData);
                if (res.code === 0) {
                    const newLeadId = res.content.id;
                    if (conversationId) {
                        await linkToLead(orgId, conversationId, {
                            leadId: newLeadId,
                        });
                        if (data.isCreateNewCustomer) {
                            const response = await createCustomer(
                                submissionData
                            );
                            if (response.code === 0) {
                                const newCustomerId = response.content.id;
                                await linkToCustomer(orgId, conversationId, {
                                    customerId: newCustomerId,
                                });
                            }
                        } else {
                            await linkToCustomer(orgId, conversationId, {
                                customerId: data.customerId,
                            });
                        }
                        queryClient.invalidateQueries({
                            queryKey: [
                                "detailConversation",
                                orgId,
                                conversationId,
                            ],
                        });
                    }
                    router.push(`leads?lid=${newLeadId}`);
                    // if (customerId) {
                    //     await linkLeadToCustomer(orgId, newLeadId, {
                    //         customerId: customerId || data.customerId,
                    //     });
                    //     queryClient.invalidateQueries({
                    //         queryKey: [
                    //             "customer-detail-api",
                    //             orgId,
                    //             customerId || data.customerId,
                    //         ],
                    //     });
                    // }
                    // if (data.isCreateNewCustomer) {
                    //     const response = await createCustomer(submissionData);
                    //     if (response.code === 0) {
                    //         const newCustomerId = response.content.id;
                    //         await linkLeadToCustomer(orgId, newLeadId, {
                    //             customerId: newCustomerId,
                    //         });
                    //     }
                    // }
                }
            } catch (error) {
                console.error("Error creating lead:", error);
            }
        }
        onClose();
        reset();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };
    return (
        <Dialog open={localOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="w-[500px] max-h-[90vh] overflow-y-auto p-0 custom-scrollbar"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <div className="px-4 pb-4 space-y-4">
                        {provider !== "customer" &&
                            provider !== "customer1" && (
                                <FormField
                                    label={t("common.title")}
                                    required={true}
                                    error={
                                        (errors as any)?.title
                                            ?.message as string
                                    }
                                >
                                    <Controller
                                        name="title"
                                        control={control}
                                        rules={{
                                            validate: (value) => {
                                                if (provider !== "customer") {
                                                    return (
                                                        !!value?.trim() ||
                                                        t(
                                                            "common.pleaseEnterTitle"
                                                        )
                                                    );
                                                }
                                                return true;
                                            },
                                        }}
                                        render={({ field }) => (
                                            <Input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                placeholder={t(
                                                    "common.enterTitle"
                                                )}
                                                autoFocus={false}
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormField>
                            )}
                        <FormField
                            label={t("common.customerName")}
                            required={isCustomerRequired}
                            error={(errors as any)?.fullName?.message as string}
                        >
                            {provider === "customer" ||
                            provider === "customer1" ||
                            customerId ? (
                                <Controller
                                    name="fullName"
                                    control={control}
                                    rules={{
                                        validate: (value) => {
                                            // Với customer/customer1: cho phép bỏ trống nếu đã có companyId
                                            if (
                                                (provider === "customer" ||
                                                    provider === "customer1") &&
                                                (!value || !value.trim())
                                            ) {
                                                return (
                                                    !!watch(
                                                        "companyId"
                                                    )?.trim() ||
                                                    t(
                                                        "common.pleaseEnterCustomerNameOrSelectCompany"
                                                    )
                                                );
                                            }
                                            // Với case khác: fullName là bắt buộc
                                            if (
                                                !(
                                                    provider === "customer" ||
                                                    provider === "customer1"
                                                )
                                            ) {
                                                return (
                                                    !!value?.trim() ||
                                                    t(
                                                        "common.pleaseEnterCustomerName"
                                                    )
                                                );
                                            }
                                            return true;
                                        },
                                    }}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Điền Thanh Huy"
                                            autoFocus={false}
                                            {...field}
                                        />
                                    )}
                                />
                            ) : (
                                <InlineCustomerSelector
                                    orgId={orgId}
                                    onSelect={handleCustomerSelect}
                                    onCreateNew={handleCreateNewCustomer}
                                    conversationId={conversationId}
                                    provider={provider}
                                    placeholder={t("common.searchCustomer")}
                                    className="w-full"
                                />
                            )}
                        </FormField>

                        <FormField
                            label={t("common.company")}
                            required={isCompanyRequired}
                            error={
                                (errors as any)?.companyId?.message as string
                            }
                        >
                            <Controller
                                name="companyId"
                                control={control}
                                rules={{
                                    validate: (value) => {
                                        if (
                                            (provider === "customer" ||
                                                provider === "customer1") &&
                                            (!value || !value.trim())
                                        ) {
                                            return (
                                                !!watch("fullName")?.trim() ||
                                                t(
                                                    "common.pleaseEnterCustomerNameOrSelectCompany"
                                                )
                                            );
                                        }
                                        return true;
                                    },
                                }}
                                render={({ field }) => (
                                    <BusinessCustomerSelector
                                        orgId={orgId}
                                        selected={field.value || ""}
                                        onChange={(value, name) =>
                                            handleBusinessChange(value, name)
                                        }
                                        placeholder={t("common.searchCompany")}
                                    />
                                )}
                            />
                        </FormField>

                        <FormField label={t("common.phone")}>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <CustomInput
                                        placeholder={t("common.enterPhone")}
                                        id="phone-main"
                                        {...field}
                                    >
                                        {t("common.mainContact")}
                                    </CustomInput>
                                )}
                            />
                        </FormField>

                        <FormField label="Email">
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <CustomInput
                                        placeholder={t("common.enterEmail")}
                                        id="email-main"
                                        {...field}
                                    >
                                        {t("common.mainEmail")}
                                    </CustomInput>
                                )}
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label={t("common.assignee")}>
                                <Controller
                                    name="assignees"
                                    control={control}
                                    render={({ field }) => (
                                        <OrgMemberSelect
                                            orgId={orgId}
                                            value={field.value[0]}
                                            onSelect={(member) => {
                                                if (member) {
                                                    field.onChange([
                                                        member.profileId,
                                                    ]);
                                                } else {
                                                    field.onChange([]);
                                                }
                                            }}
                                            placeholder={t(
                                                "common.selectAssignee"
                                            )}
                                        />
                                    )}
                                />
                            </FormField>
                            <FormField label={t("common.tag")}>
                                <Controller
                                    name="tags"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomerTagsMultiSelector
                                            placeholder={t("common.selectTag")}
                                            orgId={orgId}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label={t("common.customerType")}>
                                <Controller
                                    name="sourceId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomerSourceSelector
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                handleSourceChange(value);
                                            }}
                                        />
                                    )}
                                />
                            </FormField>
                            <FormField label={t("common.utmSource")}>
                                <Controller
                                    name="utmSource"
                                    control={control}
                                    render={({ field }) => (
                                        <UtmSourceSelector
                                            orgId={orgId}
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                handleUtmSourceChange(value);
                                            }}
                                        />
                                    )}
                                />
                            </FormField>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            disabled={isCreatingLead || isCreatingCustomer}
                        >
                            {isCreatingLead || isCreatingCustomer
                                ? t("common.creating")
                                : t("common.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

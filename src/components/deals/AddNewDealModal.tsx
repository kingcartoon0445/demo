import {
    createBusinessProcessStageFromTemplate,
    createBusinessProcessWos,
    linkConversationToTask,
    linkOrder,
} from "@/api/businessProcess";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateBusinessProcessTask } from "@/hooks/useBusinessProcess";
import { useCreateCustomer } from "@/hooks/useCustomerV2";
import { useGetProducts, useOrder } from "@/hooks/useProduct";
import { useUserDetail } from "@/hooks/useUser";
import { CreateBusinessProcessStageFromTemplate } from "@/interfaces/businessProcess";
import { Product } from "@/lib/interface";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { memo, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { BusinessCustomerSelector } from "../componentsWithHook/BusinessCustomerSelector";
import BusinessProcessTagMultiSelector from "../componentsWithHook/BusinessProcessTagMultiSelector";
import BusinessProcessTemplateSelector from "../componentsWithHook/BusinessProcessTemplateSelector";
import InlineCustomerSelector from "../componentsWithHook/InlineCustomerSelector";
import CustomerAssignListDialog from "../customer_assign_list";
import { getFirstAndLastWord } from "@/lib/utils";
import ProductMultiSelector from "../componentsWithHook/ProductMultiSelector";
import { StagesSelector } from "../componentsWithHook/StagesSelector";
import { WorkspacesSelector } from "../componentsWithHook/WorkspacesSelector";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface AddNewDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: FormValues) => void;
    orgId: string;
    conversationId?: string;
    refreshSingleStageData?: (stageId: string) => void;
    workspaceId?: string;
}

const formSchema = z.object({
    fullName: z.string().min(1, "Tên khách hàng là bắt buộc"),
    title: z.string().min(1, "Tiêu đề là bắt buộc"),
    workspace: z.string().min(1, "Vui lòng chọn không gian làm việc"),
    stage: z.string(),
    stageId: z.string().min(1, "Vui lòng chọn giai đoạn"),
    templateId: z.string().optional(),
    product: z.array(z.string()),
    dealValue: z.string(),
    assignee: z.array(z.string()),
    description: z.string(),
    productQuantities: z.record(z.string(), z.number()),
    sourceId: z.string(),
    utmSource: z.string(),
    companyId: z.string(),
    isBusiness: z.boolean(),
    tags: z.array(z.string()),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    customerId: z.string().optional(),
    processName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Memoized form fields to prevent unnecessary re-renders
const FormField = memo(
    ({
        label,
        children,
        required = false,
    }: {
        label: string;
        children: React.ReactNode;
        required?: boolean;
    }) => (
        <div>
            <Label className="block text-sm font-medium mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {children}
        </div>
    )
);

FormField.displayName = "FormField";

export default function AddNewDealModal({
    isOpen,
    onClose,
    onSubmit,
    orgId,
    conversationId,
    refreshSingleStageData,
    workspaceId,
}: AddNewDealModalProps) {
    const { t } = useLanguage();
    const orderMutation = useOrder(orgId);
    const { data: userResponse } = useUserDetail();
    const currentUser = userResponse;
    const [localOpen, setLocalOpen] = useState(isOpen);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [hasStages, setHasStages] = useState<boolean>(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [selectedStageIndex, setSelectedStageIndex] = useState<number>(-1);
    const [shouldSetNoStages, setShouldSetNoStages] = useState<boolean>(false);
    const [hasWorkspaceId, setHasWorkspaceId] = useState<boolean>(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
    const [assignToMember, setAssignToMember] = useState<string[]>([]);
    const [assignToTeam, setAssignToTeam] = useState<string[]>([]);
    const { data: productsResponse } = useGetProducts(orgId, {
        isManage: false,
    });
    const products = productsResponse?.data || [];
    const { control, handleSubmit, setValue, reset, watch } =
        useForm<FormValues>({
            defaultValues: {
                fullName: "",
                title: "",
                workspace: workspaceId || "",
                stage: "",
                stageId: "",
                templateId: "",
                product: [],
                dealValue: "",
                assignee: [],
                description: "",
                productQuantities: {},
                tags: [],
                phone: "",
                email: "",
                customerId: "",
                processName: "new process",
            },
        });
    useEffect(() => {
        if (isOpen) {
            reset({
                fullName: "",
                title: "",
                workspace: workspaceId || "",
                stage: "",
                stageId: "",
                templateId: "",
                product: [],
                dealValue: "",
                assignee: [],
                description: "",
                productQuantities: {},
                companyId: "",
                tags: [],
                processName: "new process",
            });
            setSelectedWorkspace("");
            setHasStages(true);
            setSelectedTemplate("");
            setSelectedStageIndex(-1);
            setShouldSetNoStages(false);
            setSelectedAssignee(null);
            setAssignToMember([]);
            setAssignToTeam([]);
        }
    }, [isOpen, reset]);

    useEffect(() => {
        if (workspaceId) {
            setSelectedWorkspace(workspaceId);
            setHasWorkspaceId(true);
        }
    }, [workspaceId]);

    // Handle setting hasStages to false when StagesSelector indicates no stages
    useEffect(() => {
        if (shouldSetNoStages) {
            setHasStages(false);
            setShouldSetNoStages(false);
        }
    }, [shouldSetNoStages]);
    const selectedProducts = watch("product");
    const productQuantities = watch("productQuantities");
    const watchedFullName = watch("fullName");
    const watchedCustomerId = watch("customerId");
    const watchedCompanyId = watch("companyId");
    const isCustomerRequired =
        !(watchedCompanyId || "").trim() && !(watchedCustomerId || "").trim();
    const isCompanyRequired =
        !(watchedFullName || "").trim() && !(watchedCustomerId || "").trim();

    // Tính tổng giá trị sản phẩm khi chọn sản phẩm hoặc thay đổi số lượng
    useEffect(() => {
        if (selectedProducts.length > 0) {
            let totalValue = 0;

            selectedProducts.forEach((productId) => {
                const product = getProductById(productId);
                const quantity = productQuantities[productId] || 1;

                if (product?.price) {
                    totalValue += product.price * quantity;
                }
            });

            setValue("dealValue", totalValue.toString());
        }
    }, [selectedProducts, productQuantities, setValue]);

    useEffect(() => {
        setLocalOpen(isOpen);
    }, [isOpen]);

    const handleBusinessChange = (value: string, organizationName?: string) => {
        setValue("companyId", value);
        // Đặt isBusiness thành true khi có giá trị tổ chức được chọn
        setValue("isBusiness", value !== "");
        const currentFullName = (watch("fullName") || "").trim();
        if (!currentFullName && organizationName) {
            setValue("fullName", organizationName);
        }
    };

    // Handle workspace change
    const handleWorkspaceChange = (workspaceId: string) => {
        setSelectedWorkspace(workspaceId);
        setValue("workspace", workspaceId, { shouldValidate: true });
        setValue("stage", "", { shouldValidate: true });
        setValue("stageId", "", { shouldValidate: true });
        setHasStages(true); // Reset to true, will be updated by StagesSelector
        setSelectedTemplate("");
        setSelectedStageIndex(-1);
        setShouldSetNoStages(false);
    };

    // Handle stage selection
    const handleStageSelect = (stageId: string, stageName: string) => {
        setValue("stage", stageName, { shouldValidate: true });
        setValue("stageId", stageId, { shouldValidate: true });
    };

    // Handle template selection
    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        setValue("templateId", templateId, { shouldValidate: true });
        setValue("stage", "", { shouldValidate: true });
        setValue("stageId", "", { shouldValidate: true });
        setSelectedStageIndex(-1);
    };

    // Handle template stage selection
    const handleTemplateStageSelect = (
        stageIndex: number,
        stageName: string
    ) => {
        setSelectedStageIndex(stageIndex);
        setValue("stage", stageName, { shouldValidate: true });
        setValue("stageId", `template-stage-${stageIndex}`, {
            shouldValidate: true,
        });
    };

    const businessProcessTaskMutation = useCreateBusinessProcessTask(orgId);
    const queryClient = useQueryClient();

    const handleCreateBusinessProcess = async (formData: FormValues) => {
        try {
            const body = {
                name: formData.processName || "",
                workspaceId: formData.workspace,
            };
            const response: any = await createBusinessProcessWos(orgId, body);
            if (response.success) {
                return true;
            } else {
                console.error(response.message);
                return false;
            }
        } catch (error) {
            console.error("Lỗi khi tạo quy trình:", error);
            return false;
        }
    };

    const handleOrder = (data: FormValues) => {
        return {
            totalPrice: parseInt(data.dealValue) || 0,
            orderDetails: data.product.map((productId) => ({
                productId,
                quantity: data.productQuantities[productId] || 1,
                unitPrice: getProductById(productId)?.price || 0,
            })),
            customerId: data.customerId,
            actor: currentUser?.id || "",
            workspaceId: selectedWorkspace,
        };
    };

    const handleCreateTask = (formData: FormValues) => {
        const resolvedAssignToMember =
            assignToMember.length === 0 &&
            assignToTeam.length === 0 &&
            currentUser?.id
                ? [currentUser.id]
                : assignToMember;

        businessProcessTaskMutation.mutate(
            {
                name: formData.title,
                username: formData.fullName,
                email: formData.email || "",
                phone: formData.phone || "",
                description: formData.description,
                customerId: formData.customerId || "",
                buId: formData.companyId || "",
                assignedTo:
                    formData.assignee.length > 0
                        ? [formData.assignee[0]]
                        : [currentUser?.id || ""],
                assignToMember: resolvedAssignToMember.length
                    ? resolvedAssignToMember
                    : null,
                assignToTeam: assignToTeam.length ? assignToTeam : null,
                tagIds: formData.tags,
                workspaceId: formData.workspace,
                stageId: formData.stageId,
                notes: formData.description,
                provider: "",
                subTasks: [],
                leadId: "",
            },
            {
                onSuccess: (data: any) => {
                    const newTaskId = data.data.id;
                    const orderData = handleOrder(formData);
                    orderMutation.mutate(orderData, {
                        onSuccess: async (orderData: any) => {
                            linkOrder(orgId, newTaskId, orderData.data.orderId);
                            // if (formData.customerId) {
                            //     await updateLeadStep(
                            //         orgId,
                            //         formData.customerId,
                            //         {
                            //             isComplete: true,
                            //         }
                            //     );
                            // }
                            queryClient.invalidateQueries({
                                queryKey: ["infinite-leads-body-filter", orgId],
                            });
                            if (conversationId) {
                                await linkConversationToTask(orgId, {
                                    conversationId: conversationId,
                                    taskId: newTaskId,
                                });
                                queryClient.invalidateQueries({
                                    queryKey: [
                                        "detailConversation",
                                        orgId,
                                        conversationId,
                                    ],
                                });
                            }

                            if (refreshSingleStageData) {
                                setTimeout(() => {
                                    refreshSingleStageData(formData.stageId);
                                }, 500);
                            }
                            onClose();
                            reset();
                        },
                        onError: (error: any) => {
                            console.error("Tạo đơn hàng thất bại:", error);
                        },
                    });
                },
                onError: (error: any) => {
                    console.error("Tạo task thất bại:", error);
                },
            }
        );
    };

    const { mutateAsync: createUser } = useCreateCustomer(orgId, false);

    const handleCreateUser = async (data: FormValues) => {
        const requestBody = {
            fullName: data.fullName,
            title: data.title,
            email: data.email || null,
            phone: data.phone || null,
        };
        const response = await createUser(requestBody);
        if (response.code === 0) {
            return response.content.id;
        } else {
            console.error(response.message);
            return;
        }
    };

    const onFormSubmit = async (data: FormValues) => {
        try {
            // Validate like AddCustomerModal: require either customer name, selected customer, or organization
            const hasCustomerName = !!(
                watchedFullName && watchedFullName.trim()
            );
            const hasCustomerId = !!(
                watchedCustomerId && watchedCustomerId.trim()
            );
            const hasCompanyId = !!(
                watchedCompanyId && watchedCompanyId.trim()
            );
            if (!hasCustomerName && !hasCustomerId && !hasCompanyId) {
                toast.error("Vui lòng nhập tên khách hàng hoặc chọn tổ chức");
                return;
            }

            // Validate deal value: require either selected products or a positive deal value
            const hasProducts = (data.product || []).length > 0;
            // Remove non-digits to be safe when user types with separators
            const numericDealValue = parseInt(
                (data.dealValue || "").toString().replace(/\D/g, "") || "0",
                10
            );
            const hasDealValue = numericDealValue > 0;
            if (!hasProducts && !hasDealValue) {
                toast.error(
                    "Vui lòng chọn sản phẩm hoặc nhập giá trị giao dịch"
                );
                return;
            }

            if (!hasStages) {
                const isSuccess = await handleCreateBusinessProcess(data);
                if (!isSuccess) {
                    return;
                }
                const body = {
                    templateId: data.templateId,
                    targetStageOrderIndex: selectedStageIndex,
                };
                const response: any =
                    await createBusinessProcessStageFromTemplate(
                        orgId,
                        data.workspace,
                        body as CreateBusinessProcessStageFromTemplate
                    );
                if (response.success) {
                    data.stageId = response.data.success.targetStageId;
                    setValue("stageId", response.data.success.targetStageId, {
                        shouldValidate: true,
                    });
                } else {
                    console.error(response.message);
                    return;
                }
            }

            // Format the request body according to the API requirements
            if (data.customerId || data.companyId) {
                handleCreateTask(data);
            } else {
                const customerId = await handleCreateUser(data);
                handleCreateTask({ ...data, customerId });
            }
        } catch (error) {
            console.error("Lỗi khi xử lý form:", error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    const getProductById = (productId: string) => {
        return products.find((product: Product) => product.id === productId);
    };

    const handleProductQuantityChange = (
        productId: string,
        quantity: number
    ) => {
        setValue("productQuantities", {
            ...productQuantities,
            [productId]: quantity,
        });
    };

    return (
        <Dialog open={localOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="2xl:min-w-[1000px] xl:min-w-[800px] min-w-[500px] max-h-[90vh] overflow-y-auto p-0 custom-scrollbar"
            >
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{t("common.createDeal")}</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onFormSubmit)}
                    className="w-full h-full"
                >
                    <div className="flex w-full">
                        <div className="px-4 pb-4 space-y-4 w-1/2">
                            <FormField
                                label={t("common.customerName")}
                                required={isCustomerRequired}
                            >
                                <InlineCustomerSelector
                                    orgId={orgId}
                                    placeholder={t("common.searchCustomer")}
                                    onSelect={(customer) => {
                                        if (customer) {
                                            setSelectedCustomer(customer);
                                            setIsNewCustomer(false);
                                            setValue(
                                                "fullName",
                                                customer.fullName
                                            );
                                            setValue("customerId", customer.id);
                                            // Không cần setValue cho phone và email nữa
                                        } else {
                                            setSelectedCustomer(null);
                                            setIsNewCustomer(false);
                                            setValue("fullName", "");
                                            setValue("customerId", "");
                                            // Không cần setValue cho phone và email nữa
                                        }
                                    }}
                                    onCreateNew={(searchText) => {
                                        setIsNewCustomer(true);
                                        setSelectedCustomer(null);
                                        setValue("fullName", searchText);
                                        // Không cần setValue cho phone và email nữa
                                    }}
                                />
                            </FormField>

                            {/* Email và Phone fields đã được ẩn đi */}

                            <FormField
                                label={t("common.company")}
                                required={isCompanyRequired}
                            >
                                <Controller
                                    name="companyId"
                                    control={control}
                                    render={({ field }) => (
                                        <BusinessCustomerSelector
                                            orgId={orgId}
                                            selected={field.value || ""}
                                            onChange={handleBusinessChange}
                                            placeholder={t(
                                                "common.searchCompany"
                                            )}
                                        />
                                    )}
                                />
                            </FormField>

                            <FormField
                                label={t("common.title")}
                                required={true}
                            >
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder={t("common.enterTitle")}
                                            autoFocus={false}
                                            {...field}
                                        />
                                    )}
                                />
                            </FormField>

                            <FormField
                                label={t("common.workspace")}
                                required={true}
                            >
                                <Controller
                                    name="workspace"
                                    control={control}
                                    render={({ field }) => (
                                        <WorkspacesSelector
                                            orgId={orgId}
                                            selectedWorkspace={
                                                selectedWorkspace
                                            }
                                            handleWorkspaceChange={
                                                handleWorkspaceChange
                                            }
                                            hasWorkspaceId={hasWorkspaceId}
                                        />
                                    )}
                                />
                            </FormField>

                            {/* Stages - Only show when workspace is selected */}
                            {selectedWorkspace &&
                                selectedWorkspace !== "none" && (
                                    <>
                                        {hasStages ? (
                                            <FormField
                                                label={t("common.stage")}
                                                required={true}
                                            >
                                                <Controller
                                                    name="stageId"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <div
                                                            className="w-full overflow-hidden"
                                                            style={{
                                                                maxWidth:
                                                                    "calc(100% - 10px)",
                                                            }}
                                                        >
                                                            <StagesSelector
                                                                orgId={orgId}
                                                                selectedWorkspace={
                                                                    selectedWorkspace
                                                                }
                                                                onStageSelect={
                                                                    handleStageSelect
                                                                }
                                                                selectedStageId={
                                                                    field.value
                                                                }
                                                                onNoStages={() =>
                                                                    setShouldSetNoStages(
                                                                        true
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                />
                                            </FormField>
                                        ) : (
                                            <>
                                                <FormField
                                                    label={t(
                                                        "common.selectTemplate"
                                                    )}
                                                >
                                                    <Controller
                                                        name="templateId"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <BusinessProcessTemplateSelector
                                                                onSelect={
                                                                    handleTemplateSelect
                                                                }
                                                                selectedTemplate={
                                                                    selectedTemplate
                                                                }
                                                                onStageSelect={
                                                                    handleTemplateStageSelect
                                                                }
                                                                selectedStageIndex={
                                                                    selectedStageIndex
                                                                }
                                                            />
                                                        )}
                                                    />
                                                </FormField>
                                            </>
                                        )}
                                    </>
                                )}

                            <div className="grid grid-cols-1 gap-4">
                                <FormField label={t("common.assignee")}>
                                    <Controller
                                        name="assignee"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="space-y-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                    onClick={() =>
                                                        setIsAssignDialogOpen(
                                                            true
                                                        )
                                                    }
                                                >
                                                    {selectedAssignee
                                                        ? selectedAssignee.profileId
                                                            ? selectedAssignee.fullName ||
                                                              selectedAssignee.profileName ||
                                                              "Đã chọn thành viên"
                                                            : selectedAssignee.name ||
                                                              selectedAssignee.teamName ||
                                                              "Đã chọn đội"
                                                        : t(
                                                              "common.selectAssignee"
                                                          )}
                                                </Button>
                                                {selectedAssignee && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-red-600 hover:text-red-700"
                                                        onClick={() => {
                                                            setSelectedAssignee(
                                                                null
                                                            );
                                                            setAssignToMember(
                                                                []
                                                            );
                                                            setAssignToTeam([]);
                                                            field.onChange([]);
                                                        }}
                                                    >
                                                        Xóa lựa chọn
                                                    </Button>
                                                )}
                                                <CustomerAssignListDialog
                                                    open={isAssignDialogOpen}
                                                    setOpen={
                                                        setIsAssignDialogOpen
                                                    }
                                                    customerID=""
                                                    mode="select"
                                                    singleSelect={true}
                                                    restrictTo={undefined}
                                                    onSelected={(
                                                        result: any
                                                    ) => {
                                                        const assignee =
                                                            result.member ||
                                                            result.team ||
                                                            (result.members &&
                                                                result.members
                                                                    .length >
                                                                    0 &&
                                                                result
                                                                    .members[0]) ||
                                                            (result.teams &&
                                                                result.teams
                                                                    .length >
                                                                    0 &&
                                                                result
                                                                    .teams[0]) ||
                                                            null;

                                                        if (assignee) {
                                                            setSelectedAssignee(
                                                                assignee
                                                            );
                                                            if (
                                                                assignee.profileId
                                                            ) {
                                                                const memberId =
                                                                    assignee.profileId;
                                                                setAssignToMember(
                                                                    [memberId]
                                                                );
                                                                setAssignToTeam(
                                                                    []
                                                                );
                                                                field.onChange([
                                                                    memberId,
                                                                ]);
                                                            } else {
                                                                const teamId =
                                                                    assignee.id ||
                                                                    assignee.teamId ||
                                                                    assignee.saleTeamId ||
                                                                    "";
                                                                if (teamId) {
                                                                    setAssignToTeam(
                                                                        [teamId]
                                                                    );
                                                                    setAssignToMember(
                                                                        []
                                                                    );
                                                                    field.onChange(
                                                                        [teamId]
                                                                    );
                                                                }
                                                            }
                                                        } else {
                                                            setSelectedAssignee(
                                                                null
                                                            );
                                                            setAssignToMember(
                                                                []
                                                            );
                                                            setAssignToTeam([]);
                                                            field.onChange([]);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    />
                                </FormField>
                            </div>
                            {selectedWorkspace && (
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField label={t("common.tag")}>
                                        <Controller
                                            name="tags"
                                            control={control}
                                            render={({ field }) => (
                                                <BusinessProcessTagMultiSelector
                                                    orgId={orgId}
                                                    workspaceId={
                                                        selectedWorkspace
                                                    }
                                                    selected={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </FormField>
                                </div>
                            )}
                            {/* 
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Loại khách hàng">
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
                            <FormField label="Nguồn khách hàng">
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
                        </div> */}
                        </div>
                        <div className="px-4 pb-4 space-y-4 w-1/2">
                            <FormField label={t("common.product")}>
                                <Controller
                                    name="product"
                                    control={control}
                                    render={({ field }) => (
                                        <ProductMultiSelector
                                            orgId={orgId}
                                            selectedProducts={field.value || []}
                                            setSelectedProducts={field.onChange}
                                        />
                                    )}
                                />
                            </FormField>

                            {selectedProducts.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {selectedProducts.map((productId) => {
                                        const product =
                                            getProductById(productId);
                                        return (
                                            <div
                                                key={productId}
                                                className="flex items-center gap-2 border border-gray-200 rounded-md p-2"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {product?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {product?.price
                                                            ? `${product.price.toLocaleString()} đ`
                                                            : "Chưa có giá"}
                                                    </div>
                                                </div>
                                                <div className="w-24">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                                        placeholder="SL"
                                                        autoFocus={false}
                                                        value={
                                                            productQuantities[
                                                                productId
                                                            ] || 1
                                                        }
                                                        onChange={(e) =>
                                                            handleProductQuantityChange(
                                                                productId,
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 1
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <FormField label={t("common.dealValue")}>
                                <Controller
                                    name="dealValue"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                className={cn(
                                                    selectedProducts.length > 0
                                                        ? "bg-gray-100 text-gray-700"
                                                        : "focus:border-sidebar-primary"
                                                )}
                                                placeholder={t(
                                                    "common.enterDealValue"
                                                )}
                                                autoFocus={false}
                                                value={
                                                    selectedProducts.length >
                                                        0 && field.value
                                                        ? parseInt(
                                                              field.value
                                                          ).toLocaleString() +
                                                          " đ"
                                                        : field.value
                                                }
                                                onChange={(e) =>
                                                    selectedProducts.length ===
                                                        0 &&
                                                    field.onChange(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    selectedProducts.length > 0
                                                }
                                            />
                                            {selectedProducts.length > 0 && (
                                                <div className="absolute inset-0 bg-transparent pointer-events-none" />
                                            )}
                                        </div>
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
                        <Button type="submit" variant="default">
                            {t("common.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import {
    createBusinessProcessStageFromTemplate,
    createBusinessProcessWos,
    linkOrder,
} from "@/api/businessProcess";
import { updateLeadStep } from "@/api/customerV2";
import { useCreateBusinessProcessTask } from "@/hooks/useBusinessProcess";
import { useLeadDetailApi } from "@/hooks/useCustomerDetail";
import { useGetProducts, useOrder } from "@/hooks/useProduct";
import { useUserDetail } from "@/hooks/useUser";
import { CreateBusinessProcessStageFromTemplate } from "@/interfaces/businessProcess";
import { Lead, Product } from "@/lib/interface";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { BusinessCustomerSelector } from "../componentsWithHook/BusinessCustomerSelector";
import BusinessProcessTagMultiSelector from "../componentsWithHook/BusinessProcessTagMultiSelector";
import BusinessProcessTemplateSelector from "../componentsWithHook/BusinessProcessTemplateSelector";
import ProductMultiSelector from "../componentsWithHook/ProductMultiSelector";
import { StagesSelector } from "../componentsWithHook/StagesSelector";
import { WorkspacesSelector } from "../componentsWithHook/WorkspacesSelector";
import CustomerAssignListDialog from "../customer_assign_list";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

// Define the validation schema with Zod
const formSchema = z.object({
    fullName: z.string().min(1, "Tên khách hàng là bắt buộc"),
    title: z.string().min(1, "Tiêu đề là bắt buộc"),
    workspace: z.string().min(1, "Vui lòng chọn không gian làm việc"),
    stage: z.string(),
    stageId: z.string().min(1, "Vui lòng chọn giai đoạn"),
    templateId: z.string().optional(),
    product: z.array(z.string()),
    dealValue: z.string(),
    assignee: z.any().default([]),
    description: z.string(),
    productQuantities: z.record(z.string(), z.number()),
    businessCustomerId: z.string().optional(),
    tags: z.array(z.string()),
    processName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
});

export type ConvertToDealFormValues = z.infer<typeof formSchema>;
type FormValues = ConvertToDealFormValues;
interface ConvertToDealPopupProps {
    orgId: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: FormValues) => void;
    onSelectCustomer?: (customer: Lead | null) => void;
    leadName: string;
    leadId: string;
    customerId?: string;
    customerName?: string;
}

export function ConvertToDealPopup({
    orgId,
    isOpen,
    onClose,
    onConfirm,
    onSelectCustomer,
    leadId,
    leadName,
    customerId,
    customerName,
}: ConvertToDealPopupProps) {
    const router = useRouter();
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
    const [hasStages, setHasStages] = useState<boolean>(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [selectedStageIndex, setSelectedStageIndex] = useState<number>(-1);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
    const [assignToMember, setAssignToMember] = useState<string[]>([]);
    const [assignToTeam, setAssignToTeam] = useState<string[]>([]);
    const { data: productsResponse } = useGetProducts(orgId, {
        isManage: false,
    });
    const products = productsResponse?.data || [];
    const { data: userResponse } = useUserDetail();
    const currentUser = userResponse;
    const { data: detailLead } = useLeadDetailApi(orgId, leadId);
    const lead = detailLead?.content;
    // Add order mutation
    const { mutateAsync: orderMutation } = useOrder(orgId);
    const { mutateAsync: businessProcessTaskMutation } =
        useCreateBusinessProcessTask(orgId);
    const queryClient = useQueryClient();

    // Setup react-hook-form with zod resolver
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: customerName,
            title: lead?.title || "",
            workspace: "",
            stage: "",
            stageId: "",
            templateId: "",
            product: [],
            dealValue: "",
            assignee: [],
            description: "",
            productQuantities: {},
            businessCustomerId: "",
            tags: [],
            processName: "new process",
            email: "",
            phone: "",
        },
    });

    const { control, setValue, watch, getValues, formState } = form;
    const selectedProducts = watch("product");
    const productQuantities = watch("productQuantities");

    // Reset form when dialog opens/closes or when lead data changes
    useEffect(() => {
        if (isOpen && lead) {
            form.reset({
                fullName: customerName,
                title: lead?.fullName || "", // Để trống cho người dùng nhập
                workspace: "", // Để trống cho người dùng chọn
                stage: "",
                stageId: "",
                templateId: "",
                product: [], // Để trống cho người dùng chọn
                dealValue: "", // Để trống cho người dùng nhập
                assignee:
                    lead.assignees
                        ?.filter((a) => a.type == "OWNER")
                        .map((a) => a.profileId) || [], // Điền sẵn người phụ trách hiện tại
                description: "",
                productQuantities: {},
                businessCustomerId: "", // Để trống cho người dùng chọn
                tags: [], // Điền sẵn nhãn hiện tại
                processName: "new process",
                email: lead.email,
                phone: lead.phone,
            });
            setSelectedAssignee(null);
            setAssignToMember([]);
            setAssignToTeam([]);
        } else if (isOpen) {
            form.reset({
                fullName: customerName,
                title: lead?.fullName || "",
                workspace: "",
                stage: "",
                stageId: "",
                templateId: "",
                product: [],
                dealValue: "",
                assignee: [],
                description: "",
                productQuantities: {},
                businessCustomerId: "",
                tags: [],
                processName: "new process",
            });
            setSelectedWorkspace("");
            setSelectedAssignee(null);
            setAssignToMember([]);
            setAssignToTeam([]);
        }
    }, [isOpen, form, customerName, lead]);

    // Handle workspace change
    const handleWorkspaceChange = (workspaceId: string) => {
        setSelectedWorkspace(workspaceId);
        setValue("workspace", workspaceId, { shouldValidate: true });
        setValue("stage", "", { shouldValidate: true });
        setValue("stageId", "", { shouldValidate: true });
        setHasStages(true); // Reset to true, will be updated by StagesSelector
        setSelectedTemplate("");
        setSelectedStageIndex(-1);
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

    // Define getProductById before it's used
    const getProductById = (productId: string) => {
        return products.find((product: Product) => product.id === productId);
    };

    // Set default quantity to 1 when a product is selected
    useEffect(() => {
        const newProductQuantities = { ...productQuantities };
        let updated = false;

        selectedProducts.forEach((productId) => {
            if (newProductQuantities[productId] === undefined) {
                newProductQuantities[productId] = 1;
                updated = true;
            }
        });

        // Remove quantities for products that are no longer selected
        Object.keys(newProductQuantities).forEach((productId) => {
            if (!selectedProducts.includes(productId)) {
                delete newProductQuantities[productId];
                updated = true;
            }
        });

        if (updated) {
            setValue("productQuantities", newProductQuantities);
        }
    }, [selectedProducts, productQuantities, setValue]);

    // Calculate total price based on selected products and quantities
    const totalPrice = useMemo(() => {
        if (selectedProducts.length === 0) return getValues("dealValue");

        let total = 0;
        selectedProducts.forEach((productId) => {
            const product = getProductById(productId);
            const quantity = productQuantities[productId] || 1;
            if (product && product.price) {
                total += product.price * quantity;
            }
        });

        return total.toString();
    }, [selectedProducts, productQuantities, getValues, products]);

    // Update dealValue when totalPrice changes
    useEffect(() => {
        if (selectedProducts.length > 0) {
            setValue("dealValue", totalPrice);
        }
    }, [totalPrice, selectedProducts.length, setValue]);

    const handleProductQuantityChange = (
        productId: string,
        quantity: number
    ) => {
        setValue("productQuantities", {
            ...getValues("productQuantities"),
            [productId]: quantity,
        });
    };

    const handleOrder = (data: FormValues) => {
        return {
            totalPrice: parseInt(data.dealValue) || 0,
            orderDetails: data.product.map((productId) => ({
                productId,
                quantity: data.productQuantities[productId] || 1,
                unitPrice: getProductById(productId)?.price || 0,
            })),
            customerId: customerId,
            leadId: leadId,
            actor: currentUser?.id || "",
            workspaceId: selectedWorkspace,
        };
    };

    const handleCreateTask = async (formData: FormValues) => {
        const res = await businessProcessTaskMutation({
            name: formData.title,
            username: formData.fullName,
            email: formData.email || "",
            phone: formData.phone || "",
            description: formData.description,
            leadId: leadId,
            customerId: customerId || "",
            buId: formData.businessCustomerId || "",
            assignedTo: formData.assignee || [],
            assignToMember: assignToMember,
            assignToTeam: assignToTeam.length ? assignToTeam : null,
            tagIds: formData.tags,
            workspaceId: formData.workspace,
            stageId: formData.stageId,
            notes: formData.description,
            provider: "lead",
            subTasks: [],
        });
        if (res.success) {
            const newTaskId = res.data.id;
            // Nếu có sản phẩm, tạo đơn hàng
            // if (formData.product.length > 0) {
            const orderData = handleOrder(formData);
            const response: any = await orderMutation(orderData);
            if (response.success) {
                linkOrder(orgId, newTaskId, response.data.orderId);
                await updateLeadStep(orgId, leadId, {
                    isComplete: true,
                });
                // Gọi callback sau khi thành công tất cả
                if (onSelectCustomer) {
                    onSelectCustomer(null);
                }
                queryClient.invalidateQueries({
                    queryKey: ["infinite-leads-body-filter", orgId],
                });
                onConfirm(formData);
                onClose();
            } else {
                console.error(response.message);
            }
            // } else {
            //     await updateLeadStep(orgId, leadId, {
            //         isComplete: true,
            //     });
            // }
            if (onSelectCustomer) {
                onSelectCustomer(null);
            }
            onConfirm(formData);
            onClose();
        }
        return true;
    };

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

    const onSubmit = form.handleSubmit(async (formData) => {
        try {
            if (!hasStages) {
                const isSuccess = await handleCreateBusinessProcess(formData);
                if (!isSuccess) {
                    return;
                }
                const body = {
                    templateId: formData.templateId,
                    targetStageOrderIndex: selectedStageIndex,
                };
                const response: any =
                    await createBusinessProcessStageFromTemplate(
                        orgId,
                        formData.workspace,
                        body as CreateBusinessProcessStageFromTemplate
                    );
                if (response.success) {
                    formData.stageId = response.data.success.targetStageId;
                    setValue("stageId", response.data.success.targetStageId, {
                        shouldValidate: true,
                    });
                } else {
                    console.error(response.message);
                    return;
                }
            }
            await handleCreateTask(formData);
            router.push(`leads`);
        } catch (error) {
            console.error("Lỗi khi xử lý form:", error);
        }
    });

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="2xl:min-w-[1000px] xl:min-w-[800px] min-w-[500px] max-h-[90vh] overflow-y-auto p-0 custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b">
                        Chuyển sang chốt khách
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={onSubmit}>
                        <div className="space-y-4  w-full flex gap-2">
                            {/* Customer Name */}
                            <div className="px-4 pb-4 space-y-4 w-1/2">
                                <FormField
                                    control={control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Tên khách hàng
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập tên khách hàng"
                                                    {...field}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sidebar-primary"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Business Customer */}
                                <FormField
                                    control={control}
                                    name="businessCustomerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tổ chức</FormLabel>
                                            <FormControl>
                                                <BusinessCustomerSelector
                                                    orgId={orgId}
                                                    selected={field.value || ""}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Tiêu đề giao dịch
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập tiêu đề"
                                                    {...field}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-sidebar-primary"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Workspace Selector */}
                                <FormField
                                    control={control}
                                    name="workspace"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Chọn quy trình làm việc
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <div>
                                                    <WorkspacesSelector
                                                        orgId={orgId}
                                                        selectedWorkspace={
                                                            selectedWorkspace
                                                        }
                                                        handleWorkspaceChange={
                                                            handleWorkspaceChange
                                                        }
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Stages - Only show when workspace is selected */}
                                {selectedWorkspace &&
                                    selectedWorkspace !== "none" && (
                                        <>
                                            {hasStages ? (
                                                <FormField
                                                    control={control}
                                                    name="stageId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Chọn giai đoạn
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <div
                                                                    className="w-full overflow-hidden"
                                                                    style={{
                                                                        maxWidth:
                                                                            "calc(100% - 10px)",
                                                                    }}
                                                                >
                                                                    <StagesSelector
                                                                        orgId={
                                                                            orgId
                                                                        }
                                                                        selectedWorkspace={
                                                                            selectedWorkspace
                                                                        }
                                                                        onStageSelect={
                                                                            handleStageSelect
                                                                        }
                                                                        selectedStageId={getValues(
                                                                            "stageId"
                                                                        )}
                                                                        onNoStages={() =>
                                                                            setHasStages(
                                                                                false
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ) : (
                                                <>
                                                    <FormField
                                                        control={control}
                                                        name="templateId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Chọn mẫu
                                                                    giai đoạn
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                                </FormLabel>
                                                                <FormControl>
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
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}

                                {/* Assignee */}
                                <FormField
                                    control={control}
                                    name="assignee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Chọn người phụ trách
                                            </FormLabel>
                                            <FormControl>
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
                                                            : "Chọn người phụ trách"}
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
                                                                setAssignToTeam(
                                                                    []
                                                                );
                                                                field.onChange(
                                                                    []
                                                                );
                                                            }}
                                                        >
                                                            Xóa lựa chọn
                                                        </Button>
                                                    )}
                                                    <CustomerAssignListDialog
                                                        open={
                                                            isAssignDialogOpen
                                                        }
                                                        setOpen={
                                                            setIsAssignDialogOpen
                                                        }
                                                        customerID={
                                                            customerId || ""
                                                        }
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
                                                                    result
                                                                        .members
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
                                                                        [
                                                                            memberId,
                                                                        ]
                                                                    );
                                                                    setAssignToTeam(
                                                                        []
                                                                    );
                                                                    field.onChange(
                                                                        [
                                                                            memberId,
                                                                        ]
                                                                    );
                                                                } else {
                                                                    const teamId =
                                                                        assignee.id ||
                                                                        assignee.teamId ||
                                                                        assignee.saleTeamId ||
                                                                        "";
                                                                    if (
                                                                        teamId
                                                                    ) {
                                                                        setAssignToTeam(
                                                                            [
                                                                                teamId,
                                                                            ]
                                                                        );
                                                                        setAssignToMember(
                                                                            []
                                                                        );
                                                                        field.onChange(
                                                                            [
                                                                                teamId,
                                                                            ]
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
                                                                setAssignToTeam(
                                                                    []
                                                                );
                                                                field.onChange(
                                                                    []
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            {/* FormMessage removed - assignee is optional */}
                                        </FormItem>
                                    )}
                                />

                                {selectedWorkspace && (
                                    <FormField
                                        control={control}
                                        name="tags"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Chọn nhãn</FormLabel>
                                                <FormControl>
                                                    <BusinessProcessTagMultiSelector
                                                        orgId={orgId}
                                                        workspaceId={
                                                            selectedWorkspace
                                                        }
                                                        selected={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Description */}
                                <FormField
                                    control={control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ghi chú</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Nhập ghi chú"
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="px-4 pb-4 space-y-4 w-1/2">
                                {/* Product */}
                                <FormField
                                    control={control}
                                    name="product"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sản phẩm</FormLabel>
                                            <FormControl>
                                                <ProductMultiSelector
                                                    orgId={orgId}
                                                    selectedProducts={
                                                        field.value
                                                    }
                                                    setSelectedProducts={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Product Quantities */}
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

                                {/* Deal Value */}
                                <FormField
                                    control={control}
                                    name="dealValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-1 mb-2">
                                                <FormLabel>
                                                    Giá trị giao dịch
                                                </FormLabel>
                                                {selectedProducts.length >
                                                    0 && (
                                                    <LockIcon className="h-3 w-3 text-gray-500" />
                                                )}
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        className={cn(
                                                            selectedProducts.length >
                                                                0
                                                                ? "bg-gray-100 text-gray-700"
                                                                : "focus:border-sidebar-primary"
                                                        )}
                                                        placeholder="Nhập số tiền"
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
                                                            selectedProducts.length >
                                                            0
                                                        }
                                                    />
                                                    {selectedProducts.length >
                                                        0 && (
                                                        <div className="absolute inset-0 bg-transparent pointer-events-none" />
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                type="button"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={formState.isSubmitting}
                                aria-busy={formState.isSubmitting}
                            >
                                {formState.isSubmitting
                                    ? "Đang xử lý..."
                                    : "Xác nhận"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

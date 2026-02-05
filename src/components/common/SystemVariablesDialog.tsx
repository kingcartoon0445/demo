import React, { useState, useEffect, useMemo } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import toast from "react-hot-toast";
import { getCustomerVariables, getLeadVariables } from "@/api/variables";
import { getRealVariable, getEmailVariablesWithValue } from "@/api/email";
import { User, Users } from "lucide-react";

type VariableCategory = {
    category: string;
    icon?: React.ComponentType<any>;
    variables: {
        key: string;
        label: string;
        description: string;
        value?: string;
    }[];
};

type SystemVariablesDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editorRef?: React.RefObject<any>;
    provider?: "lead" | "customer";
    orgId?: string;
    refId?: string;
    title?: string;
    description?: string;
    onVariableSelect?: (variable: string) => void | Promise<void>;
};

export default function SystemVariablesDialog({
    open,
    onOpenChange,
    editorRef,
    provider,
    orgId,
    refId,
    title = "Chọn biến hệ thống",
    description = "Tìm kiếm và chọn biến để chèn vào email",
    onVariableSelect,
}: SystemVariablesDialogProps) {
    const [isLoadingVariables, setIsLoadingVariables] = useState(false);
    const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
    const [variablesWithValue, setVariablesWithValue] = useState<any[]>([]);

    useEffect(() => {
        if (!open || !provider) {
            return;
        }

        setIsLoadingVariables(true);

        // Nếu có orgId và refId, load từ getEmailVariablesWithValue
        if (orgId && refId) {
            const type = provider === "lead" ? "LEAD" : "CUSTOMER";
            getEmailVariablesWithValue(orgId, type, refId)
                .then((response) => {
                    const data = (response as any)?.content ?? response;
                    const variables = Array.isArray(data) ? data : [];
                    setVariablesWithValue(variables);
                })
                .catch((error) => {
                    console.error(
                        "Error fetching variables with value:",
                        error
                    );
                    toast.error("Không thể tải danh sách biến hệ thống");
                })
                .finally(() => setIsLoadingVariables(false));
        } else {
            // Fallback về cách cũ nếu không có orgId/refId
            const fetcher =
                provider === "lead" ? getLeadVariables : getCustomerVariables;

            fetcher()
                .then((response) => {
                    const data = (response as any)?.content ?? response;
                    const columns = Array.isArray((data as any)?.columns)
                        ? (data as any).columns
                        : [];
                    setDynamicColumns(columns);
                })
                .catch((error) => {
                    console.error("Error fetching system variables:", error);
                    toast.error("Không thể tải danh sách biến hệ thống");
                })
                .finally(() => setIsLoadingVariables(false));
        }
    }, [open, provider, orgId, refId]);

    const dynamicCategories = useMemo(() => {
        // Nếu có variablesWithValue, ưu tiên dùng nó
        if (variablesWithValue.length > 0) {
            const iconComponent = provider === "lead" ? Users : User;
            const categoryLabel =
                provider === "lead" ? "Biến thông tin" : "Biến thông tin";

            return [
                {
                    category: categoryLabel,
                    icon: iconComponent,
                    variables: variablesWithValue.map((variable) => ({
                        key: variable.Name,
                        label: variable.Alias || variable.Name,
                        description: variable.Value || "",
                        value: variable.Value || "",
                    })),
                },
            ];
        }

        // Fallback về cách cũ
        if (!provider || dynamicColumns.length === 0) {
            return [];
        }

        const iconComponent = provider === "lead" ? Users : User;
        const categoryLabel =
            provider === "lead" ? "Biến thông tin" : "Biến thông tin";

        return [
            {
                category: categoryLabel,
                icon: iconComponent,
                variables: dynamicColumns.map((column) => ({
                    key: `{{${column.name}}}`,
                    label: column.alias || column.name,
                    description: column.alias
                        ? `Trường: ${column.alias}`
                        : `Trường: ${column.name}`,
                })),
            },
        ];
    }, [dynamicColumns, provider, variablesWithValue]);

    const allVariables = useMemo((): VariableCategory[] => {
        return [...dynamicCategories];
    }, [dynamicCategories]);

    const insertVariable = async (variable: string, variableValue?: string) => {
        if (onVariableSelect) {
            await onVariableSelect(variableValue || variable);
            onOpenChange(false);
            return;
        }

        const editor = editorRef?.current;

        // Nếu có variableValue (từ variablesWithValue), chèn trực tiếp
        if (variableValue) {
            try {
                if (editor && typeof editor.insertContent === "function") {
                    editor.insertContent(variableValue);
                    toast.success(`Đã chèn giá trị: ${variableValue}`);
                } else {
                    navigator.clipboard.writeText(variableValue);
                    toast.success(`Đã copy: ${variableValue}`);
                }
                onOpenChange(false);
                return;
            } catch (error) {
                console.error("Error inserting variable value:", error);
                navigator.clipboard.writeText(variableValue);
                toast.success(`Đã copy: ${variableValue}`);
                onOpenChange(false);
                return;
            }
        }

        // Fallback về logic cũ nếu không có value
        const variableName = variable.replace(/[{}]/g, "");

        if (provider && orgId && refId) {
            try {
                onOpenChange(false);
                const response = await getRealVariable(
                    orgId,
                    variableName,
                    provider,
                    refId
                );

                const realValue = (response as any)?.content || variable;

                if (editor && typeof editor.insertContent === "function") {
                    editor.insertContent(realValue);
                    toast.success(`Đã chèn giá trị: ${realValue}`);
                } else {
                    navigator.clipboard.writeText(realValue);
                    toast.success(`Đã copy: ${realValue}`);
                }
                return;
            } catch (error) {
                console.error("Error fetching real variable value:", error);
                toast.error("Không thể lấy giá trị biến, chèn biến thay thế");
            }
        }

        try {
            if (editor && typeof editor.insertContent === "function") {
                editor.insertContent(variable);
                toast.success(`Đã chèn: ${variable}`);
                onOpenChange(false);
                return;
            }
            navigator.clipboard.writeText(variable);
            toast.success(`Đã copy: ${variable}`);
            onOpenChange(false);
        } catch (error) {
            console.error("Error inserting variable:", error);
            navigator.clipboard.writeText(variable);
            toast.success(`Đã copy: ${variable}`);
            onOpenChange(false);
        }
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
        >
            <CommandInput placeholder="Tìm kiếm biến..." />
            <CommandList>
                {isLoadingVariables ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                        Đang tải biến hệ thống...
                    </div>
                ) : (
                    <>
                        <CommandEmpty>Không tìm thấy biến nào</CommandEmpty>
                        {allVariables.map((category, categoryIndex) => {
                            return (
                                <CommandGroup
                                    key={categoryIndex}
                                    heading={category.category}
                                >
                                    {category.variables.map(
                                        (variable, variableIndex) => (
                                            <CommandItem
                                                key={variableIndex}
                                                value={`${variable.label} ${variable.key} ${variable.description}`}
                                                onSelect={() =>
                                                    insertVariable(
                                                        variable.key,
                                                        variable.value
                                                    )
                                                }
                                                className="flex flex-col items-start gap-1 py-2"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="text-sm font-medium">
                                                        {variable.label}
                                                    </span>
                                                    {/* {variable.value && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ({variable.value})
                                                        </span>
                                                    )} */}
                                                </div>
                                                {variable.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {variable.description}
                                                    </div>
                                                )}
                                            </CommandItem>
                                        )
                                    )}
                                </CommandGroup>
                            );
                        })}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    Copy,
    Building,
    Calendar,
    Mail,
    User,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getCustomerVariables, getLeadVariables } from "@/api/variables";

type SystemVariablesPanelProps = {
    editorRef: React.RefObject<any>;
    isOpen: boolean;
    onToggle: () => void;
    provider?: "lead" | "customer";
};

export default function SystemVariablesPanel({
    editorRef,
    isOpen,
    onToggle,
    provider,
}: SystemVariablesPanelProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [dynamicColumns, setDynamicColumns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (!isOpen || !provider) {
            return;
        }

        // Chỉ gọi API nếu chưa load hoặc provider thay đổi
        setIsLoading(true);
        const fetcher =
            provider === "lead" ? getLeadVariables : getCustomerVariables;

        fetcher()
            .then((response) => {
                const data = (response as any)?.content ?? response;
                const columns = Array.isArray((data as any)?.columns)
                    ? (data as any).columns
                    : [];
                setDynamicColumns(columns);
                setHasLoaded(true);
            })
            .catch((error) => {
                console.error("Error fetching system variables:", error);
                toast.error("Không thể tải danh sách biến hệ thống");
            })
            .finally(() => setIsLoading(false));
    }, [isOpen, provider]);

    const copyVariable = (variable: string) => {
        const editor = editorRef.current;
        try {
            if (editor && typeof editor.insertContent === "function") {
                editor.insertContent(variable);
                toast.success(`Đã chèn: ${variable}`);
                return;
            }
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(variable);
            toast.success(`Đã copy: ${variable}`);
        } catch (error) {
            console.error("Error inserting variable:", error);
            navigator.clipboard.writeText(variable);
            toast.success(`Đã copy: ${variable}`);
        }
    };

    const dynamicCategories = useMemo(() => {
        if (!provider || dynamicColumns.length === 0) {
            return [];
        }

        const iconComponent = provider === "lead" ? Users : User;
        const categoryLabel =
            provider === "lead"
                ? "Biến thông tin lead"
                : "Biến thông tin khách hàng";

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
    }, [dynamicColumns, provider]);

    // Filter variables based on search term
    const combinedVariables = useMemo(
        () => [...dynamicCategories],
        [dynamicCategories]
    );

    const filteredVariables = combinedVariables
        .map((category) => ({
            ...category,
            variables: category.variables.filter(
                (variable) =>
                    variable.label
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    variable.key
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    variable.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            ),
        }))
        .filter((category) => category.variables.length > 0);

    if (!isOpen) return null;

    return (
        <div className="border-t bg-gray-50">
            <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Biến hệ thống</div>
                    <button
                        onClick={onToggle}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        Thu gọn
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm biến..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-sm"
                    />
                </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto p-3">
                {isLoading ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                        Đang tải biến hệ thống...
                    </div>
                ) : filteredVariables.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                        Không tìm thấy biến nào
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredVariables.map((category, categoryIndex) => {
                            const IconComponent = category.icon;
                            return (
                                <div key={categoryIndex} className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <IconComponent className="h-3 w-3" />
                                        {category.category}
                                    </div>
                                    <div className="space-y-1">
                                        {category.variables.map(
                                            (variable, variableIndex) => (
                                                <div
                                                    key={variableIndex}
                                                    className="group p-2 border rounded-md hover:bg-white transition-colors cursor-pointer bg-white"
                                                    onClick={() =>
                                                        copyVariable(
                                                            variable.key
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs font-mono px-1.5 py-0"
                                                                >
                                                                    {
                                                                        variable.key
                                                                    }
                                                                </Badge>
                                                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                                                            </div>
                                                            <p className="text-xs font-medium">
                                                                {variable.label}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    variable.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

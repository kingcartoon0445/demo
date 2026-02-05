"use client";

import TemplateGalleryModal from "@/components/editors/TemplateGalleryModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
    createEmailTemplate,
    deleteEmail,
    deleteEmailTemplate,
    getEmailList,
    getEmailTemplateList,
    updateEmailTemplate,
    updateEmailTemplateBody,
    updateStatusEmailTemplate,
} from "@/api/email";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Search, SettingsIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import EmailConfigModal from "./components/EmailConfigModal";
import SimpleTemplateModal from "./components/SimpleTemplateModal";
import TemplateModal from "./components/TemplateModal";

interface EmailConfig {
    id: string;
    title: string;
    description: string;
    serverName: string;
    port: number;
    connectionSecurity: string;
    displayName?: string;
    userName: string;
    password: string;
    createdAt?: string;
    updatedAt?: string;
}

interface TemplateItem {
    id: string;
    name: string;
    subject: string;
    updatedAt?: string;
    createdAt?: string;
    html?: string;
    json?: any;
    description?: string;
    body?: string;
    enabled?: boolean;
}

const extractTemplatePayload = (response: any) => {
    if (!response || typeof response !== "object") {
        return response;
    }

    const payload =
        response.content ??
        response.data ??
        response.result ??
        response.payload ??
        response.template ??
        response;

    if (
        payload &&
        typeof payload === "object" &&
        "template" in (payload as Record<string, unknown>)
    ) {
        const nested = (payload as any).template;
        if (nested && typeof nested === "object") {
            return nested;
        }
    }

    return payload;
};

const extractTemplateId = (response: any): string | undefined => {
    const payload = extractTemplatePayload(response);

    if (!payload) return undefined;
    if (typeof payload === "string") return payload;

    if (typeof payload.id === "string" && payload.id) return payload.id;
    if (
        typeof (payload as Record<string, unknown>).templateId === "string" &&
        (payload as any).templateId
    ) {
        return (payload as any).templateId;
    }

    return undefined;
};

export default function EmailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.orgId as string;

    const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(
        null
    );
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");

    // Template states
    const [templateList, setTemplateList] = useState<TemplateItem[]>([]);
    const [templateSearch, setTemplateSearch] = useState("");
    const [templatePage, setTemplatePage] = useState(1);
    const templateLimit = 10;
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const filteredTemplates = templateList.filter((t) =>
        [t.name, t.subject].some((v) =>
            v?.toLowerCase().includes(templateSearch.toLowerCase())
        )
    );
    const templateTotal = filteredTemplates.length;
    const templateTotalPages = Math.max(
        1,
        Math.ceil(templateTotal / templateLimit)
    );
    const templatePageData = filteredTemplates.slice(
        (templatePage - 1) * templateLimit,
        templatePage * templateLimit
    );

    // Template modal
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateMode, setTemplateMode] = useState<"create" | "edit">(
        "create"
    );
    const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(
        null
    );
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Simple template modal (chỉ cho tên và subject)
    const [isSimpleTemplateModalOpen, setIsSimpleTemplateModalOpen] =
        useState(false);
    const [simpleTemplateMode, setSimpleTemplateMode] = useState<
        "create" | "edit"
    >("create");
    const [editingSimpleTemplate, setEditingSimpleTemplate] =
        useState<TemplateItem | null>(null);

    // Fetch email configurations
    const fetchEmailConfigs = async (page = 1, search = "") => {
        setIsLoading(true);
        try {
            const offset = (page - 1) * limit;
            const response = (await getEmailList(orgId, {
                limit,
                offset,
                searchText: search,
            })) as any;

            const itemsRaw = response?.content ?? response?.data ?? [];
            const items: EmailConfig[] = (itemsRaw as any[]).map((it) => ({
                id: it.id,
                title: it.title,
                description: it.description,
                serverName: it.serverName,
                port: it.port,
                connectionSecurity: it.connectionSecurity,
                displayName: it.displayName,
                userName: it.userName,
                // API trả về passwordHash, không hiển thị nên để trống
                password: "",
                createdAt: it.createdDate,
                updatedAt: it.lastModifiedDate,
            }));

            const totalFromApi =
                response?.total ??
                response?.totalElements ??
                itemsRaw.length ??
                0;
            const totalPagesFromApi = response?.totalPages;

            setEmailConfigs(items);
            setTotalItems(Number(totalFromApi) || 0);
            setTotalPages(
                Number(totalPagesFromApi) ||
                    Math.ceil((Number(totalFromApi) || 0) / limit) ||
                    1
            );
        } catch (error) {
            console.error("Error fetching email configs:", error);
            toast.error("Không thể tải danh sách cấu hình email");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search
    const handleSearch = (value: string) => {
        setSearchText(value);
        setCurrentPage(1);
        fetchEmailConfigs(1, value);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchEmailConfigs(page, searchText);
    };

    // Handle create new config
    const handleCreate = () => {
        setEditingConfig(null);
        setModalMode("create");
        setIsModalOpen(true);
    };

    // Handle edit config
    const handleEdit = (config: EmailConfig) => {
        setEditingConfig(config);
        setModalMode("edit");
        setIsModalOpen(true);
    };

    // Handle delete config
    const handleDelete = async (configId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa cấu hình này?")) {
            try {
                await deleteEmail(orgId, configId);
                toast.success("Xóa cấu hình thành công");
                fetchEmailConfigs(currentPage, searchText);
            } catch (error) {
                console.error("Error deleting email config:", error);
                toast.error("Không thể xóa cấu hình");
            }
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingConfig(null);
    };

    // Handle modal success
    const handleModalSuccess = () => {
        fetchEmailConfigs(currentPage, searchText);
        handleModalClose();
    };

    // Load templates from API
    const loadTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const response = (await getEmailTemplateList(orgId)) as any;
            const templates = (response?.content || response?.data || []).map(
                (item: any) => ({
                    id: item.id,
                    name: item.name,
                    subject: item.subject,
                    description: item.description,
                    body: item.body,
                    createdAt: item.createdDate,
                    updatedAt: item.lastModifiedDate,
                    enabled: Boolean(
                        item.status ?? item.enabled ?? item.active ?? false
                    ),
                })
            );
            setTemplateList(templates);
        } catch (error) {
            console.error("Error loading templates from API:", error);
            toast.error("Không thể tải danh sách template");
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    // Load data on component mount and when returning from editor
    useEffect(() => {
        const loadData = async () => {
            await fetchEmailConfigs();
            await loadTemplates();
        };
        loadData();
    }, [orgId]);

    // Refresh templates when the page becomes visible (user returns from editor)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadTemplates().catch(console.error);
            }
        };

        const handleFocus = () => {
            loadTemplates().catch(console.error);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // Define columns for email config table
    const emailConfigColumns: ColumnDef<EmailConfig>[] = [
        {
            accessorKey: "title",
            header: "Tiêu đề",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("title")}</div>
            ),
        },
        {
            accessorKey: "description",
            header: "Mô tả",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {row.getValue("description")}
                </div>
            ),
        },
        {
            accessorKey: "serverName",
            header: "Server",
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue("serverName")}</div>
            ),
        },
        {
            accessorKey: "port",
            header: "Port",
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue("port")}</div>
            ),
        },
        {
            accessorKey: "userName",
            header: "Tên đăng nhập",
            cell: ({ row }) => (
                <div className="text-sm">{row.getValue("userName")}</div>
            ),
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => {
                const config = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(config)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const templateColumns: ColumnDef<TemplateItem>[] = [
        {
            accessorKey: "enabled",
            header: "Kích hoạt",
            cell: ({ row }) => {
                const item = row.original;
                const isEnabled = Boolean(item.enabled);
                const onToggle = async (checked: boolean) => {
                    const prev = item.enabled;
                    // Optimistic update
                    setTemplateList((prevList) =>
                        prevList.map((t) =>
                            t.id === item.id ? { ...t, enabled: checked } : t
                        )
                    );
                    try {
                        await updateStatusEmailTemplate(orgId, item.id, {
                            status: checked == true ? 1 : 0,
                        });
                        toast.success("Đã cập nhật trạng thái");
                    } catch (error) {
                        console.error("Error updating template status:", error);
                        toast.error("Không thể cập nhật trạng thái");
                        // Revert on error
                        setTemplateList((prevList) =>
                            prevList.map((t) =>
                                t.id === item.id ? { ...t, enabled: prev } : t
                            )
                        );
                    }
                };
                return (
                    <Switch checked={isEnabled} onCheckedChange={onToggle} />
                );
            },
        },
        {
            accessorKey: "name",
            header: "Tên mẫu",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "subject",
            header: "Tiêu đề",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue("subject")}
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: "Mô tả",
            cell: ({ row }) => {
                const description = row.getValue("description") as string;
                return description ? (
                    <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {description}
                    </div>
                ) : null;
            },
        },
        {
            accessorKey: "updatedAt",
            header: "Cập nhật",
            cell: ({ row }) => {
                const value = row.getValue("updatedAt") as string | undefined;
                return (
                    <div className="text-sm">
                        {value ? new Date(value).toLocaleString() : "--"}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip content="Chỉnh sửa tên và tiêu đề">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditTemplate(item)}
                                    title=""
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </Tooltip>
                        </TooltipProvider>
                        {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConfigureTemplate(item)}
                            title="Cấu hình nội dung email (Email Builder)"
                        >
                            <Settings className="h-4 w-4" />
                        </Button> */}
                        <TooltipProvider>
                            <Tooltip content="Chỉnh sửa nội dung mẫu">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditWithCKEditor(item)}
                                >
                                    <SettingsIcon className="h-4 w-4" />
                                </Button>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip content="Xóa mẫu">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDeleteTemplate(item.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            },
        },
    ];

    const onCreateTemplate = () => {
        setSimpleTemplateMode("create");
        setEditingSimpleTemplate(null);
        setIsSimpleTemplateModalOpen(true);
    };
    const onCreateFromTemplate = () => {
        setIsGalleryOpen(true);
    };
    const onEditTemplate = (item: TemplateItem) => {
        setSimpleTemplateMode("edit");
        setEditingSimpleTemplate(item);
        setIsSimpleTemplateModalOpen(true);
    };
    const onConfigureTemplate = (item: TemplateItem) => {
        const params = new URLSearchParams({
            id: item.id,
            name: item.name,
            subject: item.subject,
        });

        router.push(
            `/org/${orgId}/extend/email/template/update?${params.toString()}`
        );
    };
    const onEditWithCKEditor = (item: TemplateItem) => {
        const params = new URLSearchParams({
            id: item.id,
            name: item.name,
            subject: item.subject,
        });

        router.push(
            `/org/${orgId}/extend/email/template/edit?${params.toString()}`
        );
    };
    const onDeleteTemplate = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa template này?")) return;

        try {
            // Delete from API
            await deleteEmailTemplate(orgId, id);
            setTemplateList((prev) => prev.filter((t) => t.id !== id));
            toast.success("Đã xóa mẫu");
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Không thể xóa mẫu");
        }
    };
    const onSaveTemplate = (data: {
        name: string;
        subject: string;
        html: string;
        json?: any;
    }) => {
        if (templateMode === "create") {
            const newItem: TemplateItem = {
                id: `tpl_${Date.now()}`,
                name: data.name,
                subject: data.subject,
                updatedAt: new Date().toISOString(),
                html: data.html,
                json: data.json,
            };
            setTemplateList((prev) => [newItem, ...prev]);
            toast.success("Tạo mẫu thành công");
        } else if (editingTemplate) {
            setTemplateList((prev) =>
                prev.map((t) =>
                    t.id === editingTemplate.id
                        ? {
                              ...t,
                              name: data.name,
                              subject: data.subject,
                              updatedAt: new Date().toISOString(),
                              html: data.html,
                              json: data.json,
                          }
                        : t
                )
            );
            toast.success("Cập nhật mẫu thành công");
        }
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
    };

    const onSaveSimpleTemplate = async (data: {
        name: string;
        subject: string;
        description?: string;
        html?: string;
    }) => {
        try {
            if (simpleTemplateMode === "create") {
                // Create via API
                const apiResponse = (await createEmailTemplate(orgId, {
                    name: data.name,
                    description: data.description ?? data.subject, // Prefer provided description
                    subject: data.subject,
                })) as any;
                const newTemplateId = extractTemplateId(apiResponse);

                if (!newTemplateId) {
                    throw new Error("Không lấy được ID template vừa tạo");
                }

                // If there's HTML content, update the body
                if (data.html) {
                    await updateEmailTemplateBody(orgId, newTemplateId, {
                        body: data.html,
                    });
                }

                await loadTemplates();
                toast.success("Tạo template thành công");

                // If created from sample, go to editor immediately
                if (data.html) {
                    setIsSimpleTemplateModalOpen(false);
                    setEditingSimpleTemplate(null);
                    router.push(
                        `/org/${orgId}/extend/email/template/update?id=${newTemplateId}`
                    );
                    return;
                }
            } else if (editingSimpleTemplate) {
                // Update via API
                await updateEmailTemplate(orgId, editingSimpleTemplate.id, {
                    name: data.name,
                    description: data.description ?? data.subject,
                    subject: data.subject,
                });

                await loadTemplates();
                toast.success("Cập nhật mẫu thành công");
            }
        } catch (error) {
            console.error("Error saving mẫu:", error);
            toast.error("Không thể lưu mẫu");
        }

        setIsSimpleTemplateModalOpen(false);
        setEditingSimpleTemplate(null);
    };

    if (!orgId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="template" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="template">Mẫu</TabsTrigger>
                    <TabsTrigger value="config">Cấu hình</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Mẫu Email</CardTitle>
                                <div className="flex items-center gap-4">
                                    <Button onClick={onCreateTemplate}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm mẫu
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm mẫu..."
                                            value={templateSearch}
                                            onChange={(e) => {
                                                setTemplateSearch(
                                                    e.target.value
                                                );
                                                setTemplatePage(1);
                                            }}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <DataTable
                                    columns={templateColumns}
                                    data={templatePageData}
                                    isLoading={isLoadingTemplates}
                                    emptyMessage="Chưa có mẫu nào"
                                />

                                {templateTotalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Hiển thị{" "}
                                            {(templatePage - 1) *
                                                templateLimit +
                                                1}{" "}
                                            đến{" "}
                                            {Math.min(
                                                templatePage * templateLimit,
                                                templateTotal
                                            )}{" "}
                                            trong tổng số {templateTotal} mục
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setTemplatePage((p) =>
                                                        Math.max(1, p - 1)
                                                    )
                                                }
                                                disabled={templatePage === 1}
                                            >
                                                Trước
                                            </Button>
                                            <span className="text-sm">
                                                Trang {templatePage} /{" "}
                                                {templateTotalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setTemplatePage((p) =>
                                                        Math.min(
                                                            templateTotalPages,
                                                            p + 1
                                                        )
                                                    )
                                                }
                                                disabled={
                                                    templatePage ===
                                                    templateTotalPages
                                                }
                                            >
                                                Sau
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="config" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Cấu hình email</CardTitle>
                                <Button onClick={handleCreate}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm cấu hình
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Search */}
                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm cấu hình..."
                                            value={searchText}
                                            onChange={(e) =>
                                                handleSearch(e.target.value)
                                            }
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                {/* Data Table */}
                                <DataTable
                                    columns={emailConfigColumns}
                                    data={emailConfigs}
                                    isLoading={isLoading}
                                    emptyMessage="Không có cấu hình email nào"
                                />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Hiển thị{" "}
                                            {(currentPage - 1) * limit + 1} đến{" "}
                                            {Math.min(
                                                currentPage * limit,
                                                totalItems
                                            )}{" "}
                                            trong tổng số {totalItems} mục
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handlePageChange(
                                                        currentPage - 1
                                                    )
                                                }
                                                disabled={currentPage === 1}
                                            >
                                                Trước
                                            </Button>
                                            <span className="text-sm">
                                                Trang {currentPage} /{" "}
                                                {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handlePageChange(
                                                        currentPage + 1
                                                    )
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                            >
                                                Sau
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Email Config Modal */}
            <EmailConfigModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                config={editingConfig}
                mode={modalMode}
                orgId={orgId}
            />

            {/* Template Modal */}
            <TemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSave={onSaveTemplate}
                mode={templateMode}
                initialData={
                    editingTemplate
                        ? {
                              name: editingTemplate.name,
                              subject: editingTemplate.subject,
                              html: editingTemplate.html || "",
                              json: editingTemplate.json,
                          }
                        : null
                }
            />

            {/* Simple Template Modal */}
            <SimpleTemplateModal
                isOpen={isSimpleTemplateModalOpen}
                onClose={() => setIsSimpleTemplateModalOpen(false)}
                onSave={onSaveSimpleTemplate}
                mode={simpleTemplateMode}
                initialData={
                    editingSimpleTemplate
                        ? {
                              name: editingSimpleTemplate.name,
                              subject: editingSimpleTemplate.subject,
                              description: editingSimpleTemplate.description,
                          }
                        : null
                }
            />
            <TemplateGalleryModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                unlayerApiKey={
                    "0L1oizuep38x8pMbMJxJaDdImIoUg0kOammmiMlS77rZZhhzB7SIloBTdGWNcPSk"
                }
                onApply={async (item) => {
                    try {
                        // Create a new template via API from selected sample
                        const apiResponse = (await createEmailTemplate(orgId, {
                            name: item.name,
                            description: item.subject || item.name,
                            subject: item.subject || "",
                        })) as any;
                        const newTemplateId = extractTemplateId(apiResponse);

                        if (!newTemplateId) {
                            throw new Error(
                                "Không lấy được ID template vừa tạo"
                            );
                        }

                        // If there's HTML content, update the body
                        if (item.html) {
                            await updateEmailTemplateBody(
                                orgId,
                                newTemplateId,
                                {
                                    body: item.html,
                                }
                            );
                        }

                        await loadTemplates();
                        setIsGalleryOpen(false);
                        router.push(
                            `/org/${orgId}/extend/email/template/update?id=${newTemplateId}`
                        );
                        toast.success("Đã tạo template từ mẫu");
                    } catch (error) {
                        console.error(
                            "Error creating template from sample:",
                            error
                        );
                        toast.error("Không thể tạo template từ mẫu");
                    }
                }}
            />
        </div>
    );
}

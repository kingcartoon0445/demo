"use client";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdAdd, MdDelete, MdEdit, MdOutlineLanguage } from "react-icons/md";
import CreateConnectDialog from "./components/connect_list";
import { EditWebformDialog } from "./components/edit_webform_dialog";

import {
    deleteLeadConnection,
    getAllLeadConnection,
    updateLeadStatus,
} from "@/api/leadV2";
import LeadsLayout from "@/components/leads/LeadsLayout";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { use } from "react";
import Swal from "sweetalert2";
import { EditTiktokDialog } from "./components/edit_tiktok_dialog";
import { EditWebhookDialog } from "./components/edit_webhook_dialog";
import { EditZaloFormDialog } from "./components/edit_zaloform_dialog";
import { UnlinkButton } from "./components/unlink_button";
import { useRefresh } from "./hooks/useRefresh";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

export default function Page({ params }) {
    const orgId = use(params).orgId;
    const [open, setOpen] = useState(false);
    const [openWebformConfig, setOpenWebformConfig] = useState(false);
    const [webformConfig, setWebformConfig] = useState();
    const [openWebhookConfig, setOpenWebhookConfig] = useState(false);
    const [webhookConfig, setWebhookConfig] = useState();
    const [openTiktokConfig, setOpenTiktokConfig] = useState(false);
    const [tiktokConfig, setTiktokConfig] = useState();
    const [openZaloConfig, setOpenZaloConfig] = useState(false);
    const [zaloConfig, setZaloConfig] = useState();
    const [connectionsList, setConnectionsList] = useState([]);
    const { refreshConnectionsList, setRefreshConnectionsList } = useRefresh();

    useEffect(() => {
        getAllLeadConnection(orgId).then((res) => {
            if (res?.code !== 0) {
                return toast.error(
                    res?.message ?? "Đã có lỗi xảy ra xin vui lòng thử lại",
                    { position: "top-center" }
                );
            }

            const markedData = res?.content?.map((item) => {
                let connectionType = "webform"; // default

                // Xác định connectionType dựa trên provider
                if (item.provider.toLowerCase() === "facebook") {
                    connectionType = "facebook";
                } else if (item.provider.toLowerCase() === "zalo") {
                    connectionType = "zalo";
                } else if (item.provider.toLowerCase() === "tiktok") {
                    connectionType = "tiktok";
                } else if (item.provider.toLowerCase() === "webhook") {
                    connectionType = "webhook";
                } else if (item.provider.toLowerCase() === "webform") {
                    connectionType = "webform";
                }

                return {
                    ...item,
                    connectionType,
                    // Map các trường cần thiết cho UI
                    title: item.title || item.name || item.url,
                    status: item.status === "1" ? 1 : 0,
                    organizationId: orgId,
                };
            });

            setConnectionsList(markedData || []);
        });
    }, [refreshConnectionsList, orgId]);

    const groupByType = (items) => {
        if (!items || items.length === 0) return {};
        const grouped = {};
        items.forEach((item) => {
            const type = item.connectionType || "webform";
            if (!grouped[type]) grouped[type] = [];
            grouped[type].push(item);
        });
        return grouped;
    };

    const groupedItemsByType = groupByType(connectionsList);
    const typeOrder = ["webform", "webhook", "facebook", "zalo", "tiktok"];
    const typeLabels = {
        webform: "Webform",
        webhook: "Webhook",
        facebook: "Facebook",
        zalo: "Zalo",
        tiktok: "Tiktok",
    };
    return (
        <LeadsLayout selectedSource="config-form" orgId={orgId}>
            <div className="flex flex-col h-full w-full">
                {open && (
                    <CreateConnectDialog
                        open={open}
                        setOpen={setOpen}
                        orgId={orgId}
                    />
                )}
                {openWebformConfig && (
                    <EditWebformDialog
                        open={openWebformConfig}
                        setOpen={setOpenWebformConfig}
                        data={webformConfig}
                    />
                )}
                {openWebhookConfig && (
                    <EditWebhookDialog
                        open={openWebhookConfig}
                        setOpen={setOpenWebhookConfig}
                        data={webhookConfig}
                    />
                )}
                {openTiktokConfig && (
                    <EditTiktokDialog
                        open={openTiktokConfig}
                        setOpen={setOpenTiktokConfig}
                        data={tiktokConfig}
                    />
                )}
                {openZaloConfig && (
                    <EditZaloFormDialog
                        open={openZaloConfig}
                        setOpen={setOpenZaloConfig}
                        data={zaloConfig}
                        orgId={orgId}
                    />
                )}
                <div className="rounded-2xl flex flex-col bg-white h-full">
                    <div className="flex items-center w-full justify-between pl-5 pr-3 py-4 border-b relative">
                        <div className="text-[18px] font-medium">
                            Kênh kết nối
                        </div>

                        <Button
                            onClick={() => setOpen(true)}
                            className={
                                "flex items-center gap-1 h-[35px] px-[10px] absolute right-5"
                            }
                        >
                            <MdAdd className="text-xl" />
                            Thêm
                        </Button>
                    </div>
                    <div className="p-3 overflow-y-auto">
                        {typeOrder.map((typeKey) => {
                            const items = groupedItemsByType[typeKey] || [];
                            if (items.length === 0) return null;
                            return (
                                <div key={typeKey} className="mb-4">
                                    <div className="text-lg font-medium text-title mb-2">
                                        {typeLabels[typeKey]}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 [grid-auto-rows:1fr]">
                                        {items.map((e, i) => {
                                            switch (e.provider.toLowerCase()) {
                                                case "webhook":
                                                    return (
                                                        <WebhookItem
                                                            e={e}
                                                            key={`webhook-${i}`}
                                                            onClick={() => {
                                                                setWebhookConfig(
                                                                    e
                                                                );
                                                                setOpenWebhookConfig(
                                                                    true
                                                                );
                                                            }}
                                                        />
                                                    );
                                                case "zalo":
                                                    return (
                                                        <ZaloItem
                                                            e={e}
                                                            key={`zalo-${i}`}
                                                            onClick={() => {
                                                                setZaloConfig(
                                                                    e
                                                                );
                                                                setOpenZaloConfig(
                                                                    true
                                                                );
                                                            }}
                                                        />
                                                    );
                                                case "tiktok":
                                                    return (
                                                        <TiktokItem
                                                            e={e}
                                                            key={`tiktok-${i}`}
                                                            onClick={() => {
                                                                setTiktokConfig(
                                                                    e
                                                                );
                                                                setOpenTiktokConfig(
                                                                    true
                                                                );
                                                            }}
                                                        />
                                                    );
                                                case "facebook":
                                                case "webform":
                                                default:
                                                    return (
                                                        <ListItem
                                                            e={e}
                                                            key={`list-${i}`}
                                                            onClick={() => {
                                                                if (
                                                                    e.connectionType ===
                                                                    "webform"
                                                                ) {
                                                                    setWebformConfig(
                                                                        e
                                                                    );
                                                                    setOpenWebformConfig(
                                                                        true
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    );
                                            }
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </LeadsLayout>
    );
}
const getBadgeStyle = (state) => {
    switch (state) {
        case "Chưa xác minh":
            return "border border-border text-land";
        case "Mất kết nối":
            return "border border-[#FF0000] text-[#FF0000]";
        case "Đang kết nối":
            return "border border-border text-[#5EB640]";
        case "Đã kết nối":
            return "border border-border text-primary";
        case "Gỡ kết nối":
            return "border border-border text-land";
        default:
            return "border border-border text-land";
    }
};
const WebhookItem = ({ e, onClick }) => {
    const [checked, setChecked] = useState(e.status == 1);
    const [loading, setLoading] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();
    return (
        <ContextMenu className="h-full">
            <ContextMenuTrigger className="h-full">
                <div
                    onClick={onClick}
                    className="group flex flex-col h-full px-3 py-3 rounded-lg border border-border cursor-pointer"
                >
                    <div className=" flex items-center gap-2">
                        <div className="w-[28px] h-[28px]">
                            <Image
                                alt="ico"
                                src={"/icons/webhook.svg"}
                                width={24}
                                height={24}
                            />
                        </div>
                        <div className="text-base text-title font-medium break-all flex-1 flex gap-2">
                            {e?.title || "Webhook"}
                            {e.totalLeads > 0 && (
                                <TooltipProvider>
                                    <Tooltip content={<p>Số lượng lead</p>}>
                                        <span className="bg-primary text-white text-xs rounded-md px-2 py-0.5 w-6 h-5 text-center transition-all duration-500 ease-in-out">
                                            {e.totalLeads}
                                        </span>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <Switch
                            checked={checked}
                            className="data-[state=checked]:bg-primary ml-auto"
                            onClick={(evt) => evt.stopPropagation()}
                            onCheckedChange={(value) => {
                                if (loading) return;
                                setLoading(true);
                                ToastPromise(() =>
                                    updateLeadStatus(
                                        e.organizationId,
                                        e.id,
                                        e.provider,
                                        value ? 1 : 0
                                    )
                                        .then((res) => {
                                            setLoading(false);
                                            if (res?.message)
                                                return toast.error(res.message);
                                            setChecked(value);
                                        })
                                        .catch((err) => setLoading(false))
                                );
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-1 break-all">
                        <span className="text-sm text-title font-medium">
                            {e?.title}
                        </span>
                        {e.connectionState && (
                            <span
                                className={`text-xs px-2 py-0.5 whitespace-nowrap rounded-full ${getBadgeStyle(
                                    e.connectionState
                                )}`}
                            >
                                {e.connectionState}
                            </span>
                        )}
                        <UnlinkButton
                            title={e?.title}
                            onUnlink={() => {
                                deleteLeadConnection(
                                    e.organizationId,
                                    e.id,
                                    e.provider
                                ).then((res) => {
                                    if (res?.message) toast.error(res.message);
                                    setRefreshConnectionsList();
                                });
                            }}
                        />
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem
                    onClick={() => {
                        Swal.fire({
                            title: `Bạn muốn xóa webhook ${e.title}?`,
                            text: "Bạn sẽ không thể hoàn lại thao tác này",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonText: "Hủy",
                            confirmButtonText: "Đồng ý",
                            preConfirm: async () => {
                                try {
                                    const response = await deleteLeadConnection(
                                        e.organizationId,
                                        e.id,
                                        e.provider
                                    );
                                    if (response.message)
                                        toast.error(response.message);
                                    setRefreshConnectionsList();
                                    return response;
                                } catch (e) {
                                    toast.error(e);
                                }
                            },
                        });
                    }}
                >
                    <MdDelete />
                    Xóa Webhook
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
const ZaloItem = ({ e, onClick }) => {
    const [checked, setChecked] = useState(e.status == 1);
    const [loading, setLoading] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();
    return (
        <ContextMenu className="h-full">
            <ContextMenuTrigger className="h-full">
                <div
                    className="group flex flex-col h-full px-3 py-3 rounded-lg border border-border cursor-pointer"
                    onClick={onClick}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-[28px] h-[28px]">
                            <Image
                                alt="ico"
                                src="/icons/zalo.svg"
                                width={24}
                                height={24}
                            />
                        </div>
                        <div className="text-base text-title font-medium break-all flex-1 flex gap-2">
                            {"Zalo Form"}
                            {e.totalLeads > 0 && (
                                <TooltipProvider>
                                    <Tooltip content={<p>Số lượng lead</p>}>
                                        <span className="bg-primary text-white text-xs rounded-md px-2 py-0.5 w-6 h-5 text-center transition-all duration-500 ease-in-out">
                                            {e.totalLeads}
                                        </span>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {e.status != 2 && (
                            <Switch
                                checked={checked}
                                className="data-[state=checked]:bg-primary ml-auto"
                                onClick={(evt) => evt.stopPropagation()}
                                onCheckedChange={(value) => {
                                    if (loading) return;
                                    setLoading(true);
                                    if (e?.provider) {
                                        ToastPromise(() =>
                                            updateLeadStatus(
                                                e.organizationId,
                                                e.id,
                                                e.provider,
                                                value ? 1 : 0
                                            )
                                                .then((res) => {
                                                    setLoading(false);
                                                    if (res?.message)
                                                        return toast.error(
                                                            res.message
                                                        );
                                                    setChecked(value);
                                                })
                                                .catch((e) => setLoading(false))
                                        );
                                    } else {
                                        ToastPromise(() =>
                                            updateLeadStatus(
                                                e.organizationId,
                                                e.id,
                                                e.provider,
                                                value ? 1 : 0
                                            )
                                                .then((res) => {
                                                    setLoading(false);
                                                    if (res?.message)
                                                        return toast.error(
                                                            res.message
                                                        );
                                                    setChecked(value);
                                                })
                                                .catch((e) => setLoading(false))
                                        );
                                    }
                                }}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 break-all">
                        <span className="text-sm text-title font-medium">
                            {e?.title}
                        </span>
                        {e.connectionState && (
                            <span
                                className={`text-xs px-2 py-0.5 whitespace-nowrap rounded-full ${getBadgeStyle(
                                    e.connectionState
                                )}`}
                            >
                                {e.connectionState}
                            </span>
                        )}
                        <UnlinkButton
                            title={e?.title}
                            onUnlink={() => {
                                deleteLeadConnection(
                                    e.organizationId,
                                    e.id,
                                    e.provider
                                ).then((res) => {
                                    if (res?.message) toast.error(res.message);
                                    setRefreshConnectionsList();
                                });
                            }}
                        />
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={onClick}>
                    <MdEdit />
                    Chỉnh sửa
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => {
                        Swal.fire({
                            title: `Bạn muốn xóa form ${e.title}?`,
                            text: "Bạn sẽ không thể hoàn lại thao tác này",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonText: "Hủy",
                            confirmButtonText: "Đồng ý",
                            preConfirm: async () => {
                                try {
                                    const response = await deleteLeadConnection(
                                        e.organizationId,
                                        e.id,
                                        e.provider
                                    );
                                    if (response.message)
                                        toast.error(response.message);

                                    setRefreshConnectionsList();
                                    return response;
                                } catch (e) {
                                    toast.error(e);
                                }
                            },
                        }).then((result) => {
                            if (result.isConfirmed) {
                                Swal.fire({
                                    title: "Thành công!",
                                    text: `Form ${e.title} đã bị xóa khỏi hệ thống`,
                                    icon: "success",
                                });
                            }
                        });
                    }}
                >
                    <MdDelete />
                    Xóa form
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
const TiktokItem = ({ e, onClick }) => {
    const [checked, setChecked] = useState(e.status == 1);
    const [loading, setLoading] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();

    return (
        <ContextMenu className="h-full">
            <ContextMenuTrigger className="h-full">
                <div
                    className="group flex flex-col h-full px-3 py-3 rounded-lg border border-border cursor-pointer relative"
                    onClick={onClick}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-[28px] h-[28px]">
                            <Image
                                alt="ico"
                                src="/icons/tiktok.svg"
                                width={24}
                                height={24}
                            />
                        </div>
                        <div className="text-base text-title font-medium break-all flex-1 flex gap-2">
                            {"Tiktok Form"}
                            {e.totalLeads > 0 && (
                                <TooltipProvider>
                                    <Tooltip content={<p>Số lượng lead</p>}>
                                        <span className="bg-primary text-white text-xs rounded-md px-2 py-0.5 w-6 h-5 text-center transition-all duration-500 ease-in-out">
                                            {e.totalLeads}
                                        </span>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {e.status != 2 && (
                            <Switch
                                checked={checked}
                                className="data-[state=checked]:bg-primary ml-auto"
                                onClick={(evt) => evt.stopPropagation()}
                                onCheckedChange={(value) => {
                                    if (loading) return;
                                    setLoading(true);
                                    ToastPromise(() =>
                                        updateLeadStatus(
                                            e.organizationId,
                                            e.id,
                                            e.provider,
                                            value ? 1 : 0
                                        )
                                            .then((res) => {
                                                setLoading(false);
                                                if (res?.message)
                                                    return toast.error(
                                                        res.message
                                                    );
                                                setChecked(value);
                                            })
                                            .catch((err) => {
                                                console.error(err);
                                                setLoading(false);
                                            })
                                    );
                                }}
                            />
                        )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1 pb-6">
                        <div className="flex items-center justify-between gap-2 break-all">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm text-title font-medium">
                                    {e?.title || "Chưa có tên"}
                                </span>
                                {e.connectionState && (
                                    <span
                                        className={`text-xs px-2 py-0.5 whitespace-nowrap rounded-full ${getBadgeStyle(
                                            e.connectionState
                                        )}`}
                                    >
                                        {e.connectionState}
                                    </span>
                                )}
                            </div>
                            <div className="">
                                <UnlinkButton
                                    title={e?.title || "Form này"}
                                    onUnlink={() => {
                                        deleteLeadConnection(
                                            e.organizationId,
                                            e.id,
                                            e.provider
                                        ).then((res) => {
                                            if (res?.message)
                                                toast.error(res.message);
                                            setRefreshConnectionsList();
                                            toast.success(
                                                "Đã xóa form thành công",
                                                { position: "top-center" }
                                            );
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        {e.authName && (
                            <div className="text-xs text-gray-600 mt-1">
                                Tài khoản: {e.authName}
                            </div>
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuItem
                    onClick={(event) => {
                        event.stopPropagation();
                        onClick && onClick();
                    }}
                >
                    <MdEdit className="mr-2" />
                    Chỉnh sửa cấu hình
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={(event) => {
                        event.stopPropagation();
                        Swal.fire({
                            title: `Bạn muốn xóa form ${e.title || "này"}?`,
                            text: "Bạn sẽ không thể hoàn lại thao tác này",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonText: "Hủy",
                            confirmButtonText: "Đồng ý",
                            preConfirm: async () => {
                                try {
                                    const response = await deleteLeadConnection(
                                        e.organizationId,
                                        e.id,
                                        e.provider
                                    );
                                    if (response.message)
                                        toast.error(response.message);
                                    Swal.fire({
                                        title: "Thành công!",
                                        text: `Form đã bị xóa khỏi hệ thống`,
                                        icon: "success",
                                    });
                                    setRefreshConnectionsList();
                                    toast.success("Đã xóa form thành công", {
                                        position: "top-center",
                                    });
                                    return response;
                                } catch (error) {
                                    toast.error(
                                        error.message || "Có lỗi xảy ra"
                                    );
                                }
                            },
                        });
                    }}
                >
                    <MdDelete className="mr-2" />
                    Xóa form
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
const ListItem = ({ e, onClick }) => {
    const [checked, setChecked] = useState(e.status == 1);
    const [loading, setLoading] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();
    return (
        <ContextMenu className="h-full">
            <ContextMenuTrigger className="h-full">
                <div
                    onClick={onClick}
                    className="group flex flex-col h-full px-3 py-3 rounded-lg border border-border cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-[28px] h-[28px]">
                            {e?.provider.toLowerCase() == "facebook" ? (
                                <Image
                                    alt="ico"
                                    src={"/icons/fb_ico.svg"}
                                    width={24}
                                    height={24}
                                />
                            ) : (
                                <MdOutlineLanguage className="text-primary w-[28px] h-[28px]" />
                            )}
                        </div>
                        <div className="text-base text-title font-medium break-all flex-1 flex gap-2">
                            {e.provider.toLowerCase() == "facebook"
                                ? "Facebook Form"
                                : "Web Form"}
                            {e.totalLeads > 0 && (
                                <TooltipProvider>
                                    <Tooltip content={<p>Số lượng lead</p>}>
                                        <span className="bg-primary text-white text-xs rounded-md px-2 py-0.5 w-6 h-5 text-center transition-all duration-500 ease-in-out">
                                            {e.totalLeads}
                                        </span>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {e.status != 2 && (
                            <Switch
                                checked={checked}
                                className="data-[state=checked]:bg-primary ml-auto"
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={(value) => {
                                    if (loading) return;
                                    setLoading(true);
                                    if (e?.provider) {
                                        ToastPromise(() =>
                                            updateLeadStatus(
                                                e.organizationId,
                                                e.id,
                                                e.provider,
                                                value ? 1 : 0
                                            )
                                                .then((res) => {
                                                    setLoading(false);
                                                    if (res?.message)
                                                        return toast.error(
                                                            res.message
                                                        );
                                                    setChecked(value);
                                                })
                                                .catch((e) => setLoading(false))
                                        );
                                    } else {
                                        ToastPromise(() =>
                                            updateLeadStatus(
                                                e.organizationId,
                                                e.id,
                                                e.provider,
                                                value ? 1 : 0
                                            )
                                                .then((res) => {
                                                    setLoading(false);
                                                    if (res?.message)
                                                        return toast.error(
                                                            res.message
                                                        );
                                                    setChecked(value);
                                                })
                                                .catch((e) => setLoading(false))
                                        );
                                    }
                                }}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 break-all">
                        <span className="text-sm text-title font-medium">
                            {e?.title}
                        </span>
                        {e.connectionState && (
                            <span
                                className={`text-xs px-2 py-0.5 whitespace-nowrap rounded-full ${getBadgeStyle(
                                    e.connectionState
                                )}`}
                            >
                                {e.connectionState}
                            </span>
                        )}
                        <UnlinkButton
                            title={e?.title ?? e?.url}
                            onUnlink={() => {
                                deleteLeadConnection(
                                    e.organizationId,
                                    e.id,
                                    e.provider
                                ).then((res) => {
                                    if (res?.message) toast.error(res.message);
                                    if (e?.provider == "FACEBOOK")
                                        return setRefreshConnectionsList();
                                    if (e?.provider == "ZALO")
                                        return setRefreshConnectionsList();
                                    setRefreshConnectionsList();
                                });
                            }}
                        />
                    </div>
                </div>
            </ContextMenuTrigger>

            {!e?.provider && (
                <ContextMenuContent>
                    <ContextMenuItem
                        onClick={() => {
                            Swal.fire({
                                title: `Bạn muốn xóa form ${e.name || e.url}?`,
                                text: "Bạn sẽ không thể hoàn lại thao tác này",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#d33",
                                cancelButtonText: "Hủy",
                                confirmButtonText: "Đồng ý",
                                preConfirm: async () => {
                                    try {
                                        const response =
                                            await deleteLeadConnection(
                                                e.organizationId,
                                                e.id,
                                                e.provider
                                            );
                                        if (response.message)
                                            toast.error(response.message);
                                        Swal.fire({
                                            title: "Thành công!",
                                            text: `Form ${
                                                e.name || e.url
                                            } đã bị xóa khỏi hệ thống`,
                                            icon: "success",
                                        });
                                        setRefreshConnectionsList();
                                        return response;
                                    } catch (error) {
                                        toast.error(
                                            error.message || "Có lỗi xảy ra"
                                        );
                                    }
                                },
                            });
                        }}
                    >
                        <MdDelete />
                        Xóa form
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
};

import { dialogTitleStyle } from "@/components/common/customer_update_create";
import { WorkspacesSelector } from "@/components/componentsWithHook/WorkspacesSelector";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceSelectDialog } from "@/components/workspace_select_dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { MdOutlineLanguage } from "react-icons/md";
import { useRefresh } from "../hooks/useRefresh";
import FacebookWarningDialog from "./facebook_warning_dialog";
import { TiktokConfig } from "./tiktok_config";
import { WebformConfig } from "./webform_config";
import WebhookConfig from "./webhook_config";
import { ZaloformConfig } from "./zaloform_config";

export default function CreateConnectDialog({
    open,
    setOpen,
    orgId,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    orgId: string;
}) {
    const [wpOpen, setWpOpen] = useState(false);
    const [workspace, setWorkspace] = useState<string | undefined>(undefined);
    const [selected, setSelected] = useState<number | undefined>(undefined);
    const [fbWarningOpen, setFbWarningOpen] = useState(false);
    const { setRefreshConnectionsList } = useRefresh();

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="min-w-[900px] h-[70dvh] flex gap-4"
                    showCloseButton={true}
                >
                    <div className="flex flex-col flex-1">
                        <DialogHeader>
                            <DialogTitle className={dialogTitleStyle}>
                                Liên kết trang mới
                            </DialogTitle>
                            <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                        </DialogHeader>
                        <div className="flex flex-col pt-3">
                            {/* <WorkspaceSelectDialog
                                open={wpOpen}
                                setOpen={setWpOpen}
                                selectedValue={workspace}
                                setSelectedValue={setWorkspace}
                            />
                            <div className="font-medium text-sm">
                                Không gian làm việc{" "}
                                <span className="text-[#FF0000]">*</span>
                            </div>
                            <div className="mt-2">
                                <WorkspacesSelector
                                    orgId={orgId}
                                    selectedWorkspace={workspace ?? ""}
                                    handleWorkspaceChange={setWorkspace}
                                />
                            </div> */}
                            <div className="flex flex-col gap-3 mt-5">
                                {menuList.map((e, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (i == 1) {
                                                // Mở dialog cảnh báo thay vì kết nối trực tiếp
                                                setFbWarningOpen(true);
                                                return;
                                            }
                                            setSelected(i);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 bg-[var(--bg1)] rounded-lg hover:bg-accent cursor-pointer transition-all",
                                            selected == i &&
                                                "bg-[var(--bg2)] text-primary"
                                        )}
                                    >
                                        {e.icon}{" "}
                                        <div className="text-sm ">
                                            {e.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {selected == 0 ? (
                        <WebformConfig
                            orgId={orgId}
                            workspaceId={workspace}
                            setOpen={setOpen}
                        />
                    ) : selected == 2 ? (
                        <ZaloformConfig
                            orgId={orgId}
                            workspaceId={workspace}
                            setOpen={setOpen}
                        />
                    ) : selected == 3 ? (
                        <TiktokConfig
                            orgId={orgId}
                            workspaceId={workspace}
                            setOpen={setOpen}
                        />
                    ) : (
                        selected == 4 && (
                            <WebhookConfig
                                orgId={orgId}
                                workspaceId={workspace}
                                setOpen={setOpen}
                            />
                        )
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog cảnh báo khi kết nối Facebook */}
            <FacebookWarningDialog
                open={fbWarningOpen}
                setOpen={setFbWarningOpen}
                orgId={orgId}
                workspace={workspace}
                refreshFbList={setRefreshConnectionsList}
                onSuccess={() => {
                    // Sau khi kết nối thành công, đóng dialog chính
                    setOpen(false);
                }}
            />
        </>
    );
}

const menuList = [
    {
        icon: <MdOutlineLanguage className="text-primary text-2xl" />,
        label: "Liên kết qua Web Form",
        path: "webform",
    },
    {
        icon: (
            <Image
                alt="ico"
                src={"/icons/messenger.svg"}
                width={25}
                height={25}
                className="w-[25px] h-auto "
            />
        ),
        label: "Liên kết qua Facebook Form",
        path: "facebook",
    },
    {
        icon: (
            <Image
                alt="ico"
                src={"/icons/zalo.svg"}
                width={25}
                height={25}
                className="w-[25px] h-auto"
            />
        ),
        label: "Liên kết qua Zalo Form",
    },
    {
        icon: (
            <Image
                alt="ico"
                src={"/icons/tiktok.svg"}
                width={25}
                height={25}
                className="w-[25px] h-auto"
            />
        ),
        label: "Liên kết qua Tiktok Form",
    },
    {
        icon: (
            <Image
                alt="ico"
                src={"/icons/webhook.svg"}
                width={25}
                height={25}
                className="w-[25px] h-auto"
            />
        ),
        label: "Webhook",
    },
];

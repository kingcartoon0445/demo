import { getZaloMessageConnection } from "@/api/leadV2";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiBase } from "@/lib/authConstants";
import { popupCenter } from "@/lib/window_popup";
import { getAvatarUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";

export function ZlMessListDialog({
    open,
    setOpen,
    selectedList,
    setSelectedList,
    orgId,
}) {
    const [zlMessList, setZlMessList] = useState();
    const refreshList = () => {
        getZaloMessageConnection(orgId).then((res) => {
            if (res?.code == 0) {
                setZlMessList(res.content);
            }
        });
    };
    useEffect(() => {
        if (!open) return;
        refreshList();
    }, [open]);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className={"overflow-y-auto max-h-[550px] gap-0 w-[450px]"}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="font-medium text-base mb-2">
                            Chọn trang kết nối
                        </DialogTitle>
                        <Button
                            onClick={() => {
                                popupCenter(
                                    `${apiBase}/api/v2/public/integration/auth/zalo/message?organizationId=${orgId}&accessToken=${localStorage.getItem(
                                        "accessToken"
                                    )}`,
                                    "Connect Zalo OA",
                                    600,
                                    1000,
                                    () => {
                                        refreshList();
                                    }
                                );
                            }}
                            className="ml-4"
                        >
                            Kết nối OA
                        </Button>
                    </div>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                <div className="flex flex-col max-h-[500px] overflow-y-auto w-full mt-2">
                    {zlMessList?.map((e, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                const exists = selectedList?.some(
                                    (item) => item.id == e.id
                                );
                                if (exists) {
                                    setSelectedList((prev) =>
                                        prev.filter((item) => item.id !== e.id)
                                    );
                                } else {
                                    setSelectedList((prev) => [
                                        ...(prev || []),
                                        e,
                                    ]);
                                }
                            }}
                            className="flex items-center gap-4 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground p-2 rounded-lg"
                        >
                            <Avatar
                                name={e.name}
                                src={getAvatarUrl(e.avatar)}
                                size="40"
                                round
                            />
                            <div className="flex flex-col leading-[1.4]">
                                <div className="text-title text-base font-medium">
                                    {e.name}
                                </div>
                            </div>
                            <Checkbox
                                checked={selectedList?.some(
                                    (item) => item.id == e.id
                                )}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedList((prev) => [...prev, e]);
                                    } else {
                                        setSelectedList((prev) =>
                                            prev.filter(
                                                (item) => item.id !== e.id
                                            )
                                        );
                                    }
                                }}
                                className="ml-auto"
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
